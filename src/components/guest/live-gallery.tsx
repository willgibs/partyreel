"use client";

/**
 * The LIVE gallery half of the guest page (Phase 3 streaming split). Owns
 * everything gallery-stateful: the server item list + conditional-poll ETag,
 * the optimistic upload tiles (blob URLs), the hybrid doorbell/poll refresh
 * machine, the likes context, and the teaser CTA. EventExperience is the
 * SHELL around it (header, entry modal, upload slot) and streams this in via
 * <Suspense> — the seed payload arrives through `galleryPromise` (React 19
 * `use()`), so the presign-heavy gallery never blocks the shell's paint.
 *
 * Mounted with key={access} by the shell: an access flip (teaser -> full
 * after sign-in, via router.refresh()) is a clean remount that re-seeds from
 * the new promise — no resync effects. Uploads completing before this mounts
 * are buffered by the shell and flushed through the callback ref.
 */
import { use, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Ref } from "react";

import type { GridMedia } from "@/components/app/media-grid";
import { GuestMasonry } from "@/components/guest/guest-masonry";
import type { UploadedItem } from "@/components/guest/guest-upload";
import { LikesProvider } from "@/components/likes/likes-provider";
import { Button } from "@/components/ui/button";
import type { GalleryAccess } from "@/lib/events/gallery-access";
import { mergeGalleryItems } from "@/lib/guest/merge-gallery-items";
import { useGalleryDoorbell } from "@/lib/guest/use-gallery-doorbell";

// The hybrid doorbell cadence (Phase 3): while the Realtime channel is live,
// pings drive refreshes and the poll is just a 60s safety net; if the socket
// drops, fall back to the old 12s blind poll until it reconnects.
const FAST_POLL_MS = 12_000;
const SLOW_POLL_MS = 60_000;

export type GalleryPayload = {
  items: GridMedia[];
  teaserTotal: number | null;
  etag: string;
};

export type LiveGalleryHandle = {
  /** An upload finished: optimistic tile (approved only) + a refresh. */
  notifyUploaded: (u: UploadedItem) => void;
};

export function LiveGallery({
  ref,
  galleryPromise,
  qrToken,
  access,
  isDemo,
  onOpenGate,
}: {
  ref?: Ref<LiveGalleryHandle>;
  /** The RSC's gallery load — resolved via use(), so this component suspends
   *  (the shell's <Suspense> shows GallerySkeleton) instead of blocking SSR. */
  galleryPromise: Promise<GalleryPayload>;
  qrToken: string;
  access: GalleryAccess;
  isDemo: boolean;
  /** Re-opens the entry modal at its gate step (the teaser CTA's action). */
  onOpenGate: () => void;
}) {
  const seed = use(galleryPromise);
  const [serverItems, setServerItems] = useState<GridMedia[]>(seed.items);
  const [optimistic, setOptimistic] = useState<GridMedia[]>([]);
  const blobUrls = useRef(new Map<string, string>()); // mediaId → object URL
  // The current conditional-request validator: sent as If-None-Match so an
  // unchanged gallery answers a bare 304 (no payload, no presigns server-side).
  const etagRef = useRef<string | null>(seed.etag);

  // Re-fetch the latest approved media (presigned) and reconcile optimistic tiles.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/guests/gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(etagRef.current ? { "If-None-Match": etagRef.current } : {}),
        },
        body: JSON.stringify({ qr_token: qrToken }),
      });
      // 304 = nothing changed since the validator we hold; skip all state work.
      if (res.status === 304) return;
      if (!res.ok) return;
      const body = (await res.json()) as { ok: boolean; items?: GridMedia[] };
      if (!body.ok || !body.items) return;
      etagRef.current = res.headers.get("etag");
      const items = body.items;
      // Reconcile by id: KEEP already-rendered items' presigned URLs so unchanged
      // media doesn't re-download (a new `url` would reload the <img>). Only
      // genuinely new items use the fresh presign; removed items drop; order
      // follows the server (newest-first).
      setServerItems((prev) => {
        const prevById = new Map(prev.map((m) => [m.id, m]));
        return items.map((m) => prevById.get(m.id) ?? m);
      });
      // Drop + revoke any optimistic tile the server now reflects (the presigned
      // version takes over seamlessly via mergeGalleryItems' dedupe).
      const serverIds = new Set(items.map((m) => m.id));
      setOptimistic((prev) =>
        prev.filter((m) => {
          if (!serverIds.has(m.id)) return true;
          const url = blobUrls.current.get(m.id);
          if (url) {
            URL.revokeObjectURL(url);
            blobUrls.current.delete(m.id);
          }
          return false;
        }),
      );
    } catch {
      // Best-effort poll — never surface a transient network blip to the guest.
    }
  }, [qrToken]);

  // The doorbell: a contentless Realtime ping per gallery change, coalesced
  // inside the hook (immediate refresh, bursts collapse into one trailing
  // refetch) — and the ETag makes even redundant refetches cheap.
  const liveEnabled = !isDemo && access !== "none";
  const { live } = useGalleryDoorbell({
    qrToken,
    enabled: liveEnabled,
    onRefresh: () => void refresh(),
  });

  // The fallback poll, paused while the tab is hidden (frugality + correctness):
  // a 60s safety net while the doorbell is live, the old 12s cadence when the
  // socket is down. In demo mode there's nothing to poll — the curated media is
  // static and the simulated tiles are local-only — so skip it entirely.
  useEffect(() => {
    if (!liveEnabled) return;
    const pollMs = live ? SLOW_POLL_MS : FAST_POLL_MS;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!timer) timer = setInterval(refresh, pollMs);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        void refresh();
        start();
      }
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh, liveEnabled, live]);

  // Revoke any lingering blob URLs on unmount.
  useEffect(() => {
    const blobs = blobUrls.current;
    return () => {
      for (const url of blobs.values()) URL.revokeObjectURL(url);
      blobs.clear();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    notifyUploaded(u) {
      // Only LIVE uploads are public immediately, so only those go to the top
      // optimistically. Hold-for-approval items stay pending (the upload list
      // shows "waiting for host approval"); they appear once the host approves
      // (which rings the doorbell).
      if (u.status === "approved") {
        const url = URL.createObjectURL(u.file);
        blobUrls.current.set(u.mediaId, url);
        setOptimistic((prev) => [
          { id: u.mediaId, type: u.kind, url, downloadUrl: url },
          ...prev.filter((m) => m.id !== u.mediaId),
        ]);
      }
      if (!isDemo) void refresh();
    },
  }));

  const items = mergeGalleryItems(optimistic, serverItems);

  return (
    <section className="mt-9">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        {items.length > 0
          ? `${items.length} ${items.length === 1 ? "photo" : "photos"} & videos`
          : "Gallery"}
      </h2>
      {items.length > 0 ? (
        // Likes: anonymous guests get the like button -> the create-account flow;
        // signed-in guests toggle in place. Counts stay host-only.
        <LikesProvider mediaIds={items.map((m) => m.id)}>
          <GuestMasonry items={items} />
        </LikesProvider>
      ) : (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No photos yet. Be the first to share one.
        </p>
      )}
      {access === "teaser" && (
        // The teaser boundary CTA: re-opens the entry modal to the account step
        // (the soft paywall).
        <div className="mt-5 flex justify-center">
          <Button onClick={onOpenGate} className="active:scale-[0.99]">
            {seed.teaserTotal !== null && seed.teaserTotal > items.length
              ? `See all ${seed.teaserTotal} photos`
              : "Create a free account to see everything"}
          </Button>
        </div>
      )}
    </section>
  );
}

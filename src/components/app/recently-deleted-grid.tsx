"use client";

import {
  type CSSProperties,
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { useHubWrites } from "@/components/app/event-feed/host-album";
import { PricingSheet } from "@/components/app/pricing/pricing-sheet";
import { MasonryColumns } from "@/components/shared/masonry";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createLinkStore, type LinkStore } from "@/lib/album/links";
import { DEFAULT_TIER, toBillingTier } from "@/lib/constants/tiers";
import {
  binItem,
  type BinEntry,
  type BinLinksBody,
  type BinManifestBody,
  type BinMedia,
} from "@/lib/event/bin";
import { binCountdownLabel } from "@/lib/lifecycle/recently-deleted";
import { GLASS, GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

// The host "Recently deleted" MEDIA grid (event-detail). Reuses the shared
// MasonryColumns in the album's justified rows, windowed (natural ratios, clamped
// for control legibility); the per-tile controls ride in via `renderOverlay` as
// SIBLINGS of the open-lightbox button, so tapping a control never opens the
// lightbox. The bin's only verbs are Restore (capacity-gated in the RPC -> safe +
// reversible, no confirm) and Delete permanently (irreversible -> skips the 30-day
// window, so it's behind a confirm Dialog). Items carry NO downloadUrl, so the
// lightbox hides Save (no original-file download from the bin), and the viewer is
// read-only (NOT the host moderation viewer). We toast on every outcome, and an
// item that leaves the bin leaves the grid at once (`onGone`).

/** A bin item = a GridMedia plus its server-computed countdown (a stable integer dodges the
 * locale-date hydration mismatch). It's assignable to GridMedia, so the lightbox accepts it. */
export type { BinMedia } from "@/lib/event/bin";

function BinTileOverlay({
  eventId,
  item,
  onOutOfRoom,
  onGone,
  onRestored,
}: {
  eventId: string;
  item: BinMedia;
  /** The grid's ONE pricing sheet, opened by this tile's cap refusal. */
  onOutOfRoom: () => void;
  /** The item left the bin (restored or deleted for good): the grid drops it. */
  onGone?: (id: string) => void;
  /** A restore landed: the album takes the photograph back. */
  onRestored?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const writes = useHubWrites();

  function onRestore() {
    startTransition(async () => {
      const result = await writes.restore(eventId, item.id);
      if (result.ok) {
        toast.success("Restored. It's back in the album.");
        onGone?.(item.id);
        onRestored?.();
        return;
      }
      // insufficient_space is the expected at-cap refusal -> offer the upgrade
      // path. It opens the pricing sheet on `room` rather than leaving for a
      // static /pricing (`first=trigger`, Will 2026-09-20).
      if (
        result.code === "insufficient_space" ||
        result.code === "event_limit"
      ) {
        toast.error(result.message, {
          action: { label: "Upgrade", onClick: onOutOfRoom },
        });
        return;
      }
      toast.error("Couldn't restore that item.", {
        description: result.message,
      });
    });
  }

  function onPurge() {
    startTransition(async () => {
      const result = await writes.purge(eventId, [item.id]);
      if (result.ok) {
        toast.success("Permanently deleted.");
        onGone?.(item.id);
        return;
      }
      toast.error("Couldn't delete that item.", {
        description: result.message,
      });
    });
  }

  return (
    <>
      {/* The countdown is a MARK, so it stays at every width: it is the only
          thing that makes this grid different from the album. */}
      <span
        className={cn(
          "pointer-events-none absolute top-1.5 left-1.5 z-10 inline-flex h-5 items-center rounded-full px-2 text-micro font-medium text-white",
          GLASS_MARK,
        )}
      >
        {binCountdownLabel(item.countdownDays)}
      </span>

      {/* The bin's two verbs, in the one pane the grid draws. Restore is
          capacity-gated in the RPC (safe + reversible, no confirm); Delete
          permanently skips the 30-day window, so it stays behind a confirm.
          The Dialog lives HERE rather than in the row because the row is a
          declared action set and a trigger is a component. */}
      <div className="absolute top-1.5 right-1.5 z-10 hidden md:block">
        <Dialog>
          <div
            data-reveal-chip
            style={{ "--reveal-max": "4rem" } as CSSProperties}
            className={cn(
              "flex items-center gap-0.5 rounded-full p-0.5",
              GLASS,
            )}
          >
            <button
              type="button"
              disabled={isPending}
              aria-label="Restore"
              title="Restore"
              onClick={onRestore}
              className={BIN_ACTION}
            >
              <Undo2 className="size-4" />
            </button>
            <DialogTrigger asChild>
              <button
                type="button"
                disabled={isPending}
                aria-label="Delete permanently"
                title="Delete permanently"
                className={cn(BIN_ACTION, "hover:text-destructive")}
              >
                <Trash2 className="size-4" />
              </button>
            </DialogTrigger>
          </div>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete permanently?</DialogTitle>
              <DialogDescription>
                This skips the 30-day recovery window and deletes the file for
                good. It can&rsquo;t be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={onPurge}
                >
                  Delete permanently
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

/** One glyph of the bin's pane: no surface of its own (`row=bar`). */
const BIN_ACTION =
  "flex size-6 cursor-pointer items-center justify-center rounded-full text-white outline-none transition-[color,transform] duration-150 ease-emphasis focus-visible:ring-2 focus-visible:ring-white/70 active:scale-90 motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50";

export function RecentlyDeletedGrid({
  eventId,
  items,
  /** Server-derived (`profiles.tier`); it only picks the sheet's headline. */
  tier,
  onWindowChange,
  onGone,
  onRestored,
}: {
  eventId: string;
  items: BinMedia[];
  tier?: string;
  /** The tiles the window mounts, whenever that changes: the paged bin mints their links. */
  onWindowChange?: (ids: readonly string[]) => void;
  /** An item left the bin (restored or deleted for good). */
  onGone?: (id: string) => void;
  /** A restore landed. */
  onRestored?: () => void;
}) {
  // ONE sheet for the whole bin, not one per tile: a bin holds dozens of tiles
  // and each mounted sheet is a portal, a focus trap and a scroll lock waiting
  // to exist. The tiles raise the refusal; the grid owns the surface.
  const [pricingOpen, setPricingOpen] = useState(false);
  // clampAspect keeps the countdown + restore/purge controls legible on extreme
  // ratios (same moderation-ergonomics reason as the main host grid).
  return (
    <>
      <MasonryColumns
        items={items}
        layout="rows"
        clampAspect
        onWindowChange={onWindowChange}
        renderOverlay={(item) => (
          <BinTileOverlay
            eventId={eventId}
            item={item}
            onOutOfRoom={() => setPricingOpen(true)}
            onGone={onGone}
            onRestored={onRestored}
          />
        )}
      />
      <PricingSheet
        open={pricingOpen}
        onOpenChange={setPricingOpen}
        trigger={{ kind: "room" }}
        plan={{ tier: toBillingTier(tier ?? DEFAULT_TIER), hasBilling: false }}
        returnTo={`/dashboard/${eventId}`}
      />
    </>
  );
}

/* ─────────────────────────── the paged bin ─────────────────────────── */

/** The hub's bin: its list once asked for, and the link store its windows mint through. */
export type HubBinState = {
  status: "idle" | "loading" | "ready" | "error";
  entries: readonly BinEntry[];
  links: LinkStore<null>;
  /** Read the list (each time the filter is chosen; the last list stays on screen meanwhile). */
  open: () => void;
  /** Items that left the bin. */
  drop: (ids: readonly string[]) => void;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return (await res.json()) as T;
}

/**
 * THE PAGED BIN'S STATE (`lib/event/bin.ts`). Nothing is read until the Deleted filter is chosen;
 * then the list comes (ids, shapes, countdowns) and each window's links through the album's own link
 * store (dated and re-minted the same way). An id the links route no longer finds in the bin
 * (restored in another tab, purged by the sweep) leaves the list.
 *
 * ★ THE LIST IS READ AGAIN EACH TIME THE FILTER IS CHOSEN. A host who deletes from the album and
 * then opens Deleted must find what she just deleted there, and a list kept for the island's life
 * (the old bin's rule, when every item in it cost a presign) showed the bin as it was the first time
 * she looked. The list has no links, so reading it again costs one light request; the links it
 * already minted stay in the store, and the last list stays on screen while the new one is read.
 */
export function useHubBin(eventId: string): HubBinState {
  const [list, setList] = useState<BinList>(IDLE_BIN);
  // One read at a time (read and written only in `open`, an event's handler).
  const inFlight = useRef(false);

  const drop = useCallback((ids: readonly string[]) => {
    if (ids.length === 0) return;
    const gone = new Set(ids);
    setList((prev) => ({
      ...prev,
      entries: prev.entries.filter((e) => !gone.has(e[0])),
      // Left while a read is out: that read's answer, read before it left, must not bring it back.
      left: prev.reading ? new Set([...prev.left, ...gone]) : prev.left,
    }));
  }, []);

  const [links] = useState(() =>
    createLinkStore<null>({
      fetch: (ids) =>
        postJson<BinLinksBody>(
          `/api/events/${encodeURIComponent(eventId)}/bin/media`,
          { ids },
        ),
      onMissing: (ids) => drop(ids),
    }),
  );

  const open = useCallback(() => {
    if (inFlight.current) return;
    inFlight.current = true;
    setList((prev) => ({
      ...prev,
      status: prev.status === "ready" ? "ready" : "loading",
      reading: true,
      left: NONE_LEFT,
    }));
    void (async () => {
      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventId)}/bin`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`bin: ${res.status}`);
        const body = (await res.json()) as BinManifestBody;
        // In the bin now, by this read: an id the links route once answered missing (restored in
        // another tab) and since deleted again is asked for again.
        links.revive(body.entries.map((e) => e[0]));
        setList((prev) => ({
          status: "ready",
          entries: body.entries.filter((e) => !prev.left.has(e[0])),
          reading: false,
          left: NONE_LEFT,
        }));
      } catch {
        // A first read that failed says so; a read again that failed keeps the list on screen.
        setList((prev) => ({
          ...prev,
          status: prev.status === "ready" ? "ready" : "error",
          reading: false,
          left: NONE_LEFT,
        }));
      } finally {
        inFlight.current = false;
      }
    })();
  }, [eventId, links]);

  return { status: list.status, entries: list.entries, links, open, drop };
}

/** The bin's list as the hook holds it: what it shows, and whether a read is out and what left meanwhile. */
type BinList = {
  status: HubBinState["status"];
  entries: readonly BinEntry[];
  reading: boolean;
  left: ReadonlySet<string>;
};
const NONE_LEFT: ReadonlySet<string> = new Set();
const IDLE_BIN: BinList = {
  status: "idle",
  entries: [],
  reading: false,
  left: NONE_LEFT,
};

/** The bin's grid over its list and its windows' links. */
export function HubBin({
  bin,
  eventId,
  tier,
  onRestored,
}: {
  bin: HubBinState;
  eventId: string;
  tier?: string;
  onRestored?: () => void;
}) {
  const { links, entries, drop } = bin;
  const revision = useSyncExternalStore(
    links.subscribe,
    links.revision,
    () => 0,
  );
  const items = useMemo(() => {
    void revision; // a window's links landed
    return entries.map((e) => binItem(e, links.get(e[0])));
  }, [entries, links, revision]);
  const onWindowChange = useCallback(
    (ids: readonly string[]) => void links.ensure(ids),
    [links],
  );
  const onGone = useCallback((id: string) => drop([id]), [drop]);
  return (
    <RecentlyDeletedGrid
      eventId={eventId}
      items={items}
      tier={tier}
      onWindowChange={onWindowChange}
      onGone={onGone}
      onRestored={onRestored}
    />
  );
}

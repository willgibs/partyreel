"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Check,
  Clock,
  ImageIcon,
  ListChecks,
  Loader2,
  XCircle,
} from "lucide-react";

import { useGalleryLive } from "@/components/guest/gallery-live";
import { PickPreview } from "@/components/guest/upload/pick-preview";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import { formatCount } from "@/lib/format/count";
import {
  buildTrackerRows,
  TRACKER_WORDS,
  trackerShows,
  waitingCount,
  type OwnUploadWire,
  type TrackerRow,
  type TrackerStatus,
} from "@/lib/guest/upload-tracker";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
import { cn } from "@/lib/utils";

/**
 * HER TRACKER (`guest-capture` r1, Will's `tracker=button`): a round button beside Add photos opens
 * her own batch, each row with where it stands, and the button wears the count of what waits for
 * the host ("what's that 12? oh my uploads waiting for approval"), the number only. Only where she
 * has something sent at a moderated event; never in the demo. The rules are `lib/guest/upload-
 * tracker.ts`'s, as data; this is the drawing and the wiring.
 *
 * ★ TWO HALVES, BECAUSE THE PAGE HAS TWO BOXES. The button sits in the words column and the dock,
 * ABOVE the album's live provider; the list needs what only the provider knows (the album's ids,
 * this device's in-flight pictures, the album's links). So `UploadTracker` lives inside the provider
 * and draws the sheet, and hands the button its two facts (whether to show, the count) through a
 * small store the page creates once: a sync re-renders the tracker, never the page's shell.
 *
 * ★ NO NEW POLL. Her queue is live; the album's own doorbell and poll carry every approval; her
 * own rows are read once at mount and again whenever she opens the list (the only place a refusal
 * can be learned, `/api/guests/mine` with `statuses`).
 *
 * ★ HER UPLOADS ARE A LIST, SO THEY OPEN AS ONE (`popups` r1, `lists=panel`, Will 2026-09-27): a
 * side panel beside the album at a desk, and in a hand the whole screen under a back arrow that says
 * "Album", the phone's own Back closing it. A list is a place she moves through, not a question: no
 * 85 percent cap and no album peeking over her rows.
 */

type TrackerSnapshot = { show: boolean; waiting: number };

const HIDDEN: TrackerSnapshot = { show: false, waiting: 0 };

export type UploadTrackerStore = {
  getSnapshot: () => TrackerSnapshot;
  subscribe: (listener: () => void) => () => void;
  set: (next: TrackerSnapshot) => void;
};

/** The two facts the button needs, kept outside React state (the page creates one per mount). */
export function createUploadTrackerStore(): UploadTrackerStore {
  let snapshot = HIDDEN;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(next) {
      if (next.show === snapshot.show && next.waiting === snapshot.waiting) {
        return;
      }
      snapshot = next;
      for (const listener of listeners) listener();
    },
  };
}

const EMPTY: ReadonlySet<string> = new Set();

/**
 * Her own rows' statuses, from the one route that reads them (`/api/guests/mine`, `statuses`).
 * Null on any failure: the list keeps what it knew, and the queue and the album are still live.
 */
async function readOwnStatuses(
  qrToken: string,
  sessionToken: string | null,
): Promise<OwnUploadWire[] | null> {
  try {
    const res = await fetch("/api/guests/mine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // The ticket in the BODY, never a URL (a capability in a query string ends up in a log).
      body: JSON.stringify({
        qr_token: qrToken,
        ...(sessionToken ? { session_token: sessionToken } : {}),
        statuses: true,
      }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      ok?: boolean;
      items?: OwnUploadWire[];
    };
    return body.ok && Array.isArray(body.items) ? body.items : null;
  } catch {
    return null;
  }
}

/**
 * THE TRACKER'S HALF INSIDE THE ALBUM: her rows, kept live, and the list they open into. Draws
 * nothing on the page itself; the sheet is portalled.
 */
export function UploadTracker({
  store,
  queue,
  qrToken,
  sessionToken,
  isAuthed,
  moderated,
  isDemo,
  isOwner,
  removedIds,
  open,
  onOpenChange,
}: {
  store: UploadTrackerStore;
  /** The page's one queue: this visit's files, live. */
  queue: readonly QueueItem[];
  qrToken: string;
  /** The device's ticket, which speaks for her unclaimed row. */
  sessionToken: string | null;
  /** Signed in: the account speaks for its own rows (the route asks `getUser()`). */
  isAuthed: boolean;
  /** The event holds uploads for the host. */
  moderated: boolean;
  isDemo: boolean;
  isOwner: boolean;
  /** What she removed herself this visit: hers to forget, never listed. */
  removedIds: ReadonlySet<string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const live = useGalleryLive();
  const album = live?.serverIds ?? EMPTY;

  /* ── her own rows, read on demand (mount, and each opening) ─────────────────────────────────── */
  const canAsk =
    moderated && !isDemo && !isOwner && (Boolean(sessionToken) || isAuthed);
  const [own, setOwn] = useState<OwnUploadWire[] | null>(null);
  const loaded = own !== null;
  useEffect(() => {
    // Once at mount (and whenever the ticket changes: her first join mints one), then again at
    // every opening, never on a timer.
    if (!canAsk || (loaded && !open)) return;
    let active = true;
    void readOwnStatuses(qrToken, sessionToken).then((items) => {
      if (active && items) setOwn(items);
    });
    return () => {
      active = false;
    };
  }, [canAsk, loaded, open, qrToken, sessionToken]);

  /* ── which of hers the album has held (so one that leaves it was taken down) ─────────────────── */
  const [approvedOnce, setApprovedOnce] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const newlyIn: string[] = [];
  for (const item of queue) {
    if (
      item.mediaId &&
      album.has(item.mediaId) &&
      !approvedOnce.has(item.mediaId)
    ) {
      newlyIn.push(item.mediaId);
    }
  }
  for (const o of own ?? []) {
    if (album.has(o.id) && !approvedOnce.has(o.id)) newlyIn.push(o.id);
  }
  // The sanctioned adjust-state-during-render pattern: remembered in the render that first saw it.
  if (newlyIn.length > 0) {
    setApprovedOnce((prev) => new Set([...prev, ...newlyIn]));
  }

  const rows = useMemo(
    () =>
      buildTrackerRows({
        queue,
        own,
        album,
        approvedOnce,
        removed: removedIds,
      }),
    [queue, own, album, approvedOnce, removedIds],
  );
  const waiting = waitingCount(rows);
  const show = trackerShows({ moderated, isDemo, isOwner, rows });
  useEffect(() => {
    store.set({ show, waiting });
  }, [store, show, waiting]);
  // Gone with the album (an access flip remounts it): the button goes with it rather than lingering.
  useEffect(() => () => store.set(HIDDEN), [store]);

  /* ── the pictures: this visit's own files, or the album's links for what is in it ──────────── */
  const byId = useMemo(() => {
    if (!open || !live) return null;
    return new Map(live.items.map((item) => [item.id, item]));
  }, [open, live]);
  const ensureLinks = live?.ensureLinks;
  useEffect(() => {
    if (!open || !ensureLinks) return;
    const wanted = rows
      .filter((row) => row.status === "approved" && row.mediaId)
      .map((row) => row.mediaId as string);
    if (wanted.length > 0) ensureLinks(wanted);
  }, [open, rows, ensureLinks]);

  const queueById = useMemo(
    () => new Map(queue.map((item) => [item.id, item])),
    [queue],
  );

  return (
    <Popup open={open && show} onOpenChange={onOpenChange}>
      <PopupContent kind="list" data-upload-tracker-sheet>
        {/* The album's own sentence for this event's rule, so one rule has one wording. */}
        <PopupHeader
          title="Your uploads"
          description="The host reviews uploads before they appear in the album."
          back="Album"
        />
        <PopupBody>
          <ul className="divide-y divide-border/60 pb-2">
            {rows.map((row) => {
              const queued = row.queueId ? queueById.get(row.queueId) : null;
              const localUrl = row.queueId
                ? live?.pendingUrls.get(row.queueId)
                : undefined;
              const linked = row.mediaId ? byId?.get(row.mediaId) : undefined;
              const src = linked ? linked.previewUrl || linked.url : "";
              return (
                <TrackerRowView
                  key={row.key}
                  row={row}
                  picture={
                    queued && localUrl ? (
                      <PickPreview file={queued.file} url={localUrl} />
                    ) : src ? (
                      // eslint-disable-next-line @next/next/no-img-element -- a presigned album link or this device's own object URL
                      <img
                        src={src}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : null
                  }
                />
              );
            })}
          </ul>
        </PopupBody>
      </PopupContent>
    </Popup>
  );
}

const ICON: Record<TrackerStatus, typeof Check> = {
  sending: Loader2,
  waiting: Clock,
  approved: Check,
  refused: XCircle,
};

const TONE: Record<TrackerStatus, string> = {
  sending: "text-muted-foreground",
  waiting: "text-warning",
  approved: "text-success",
  refused: "text-muted-foreground",
};

/** One of hers: the picture (or a plain tile where none can be shown), and where it stands. */
function TrackerRowView({
  row,
  picture,
}: {
  row: TrackerRow;
  picture: React.ReactNode;
}) {
  const Icon = ICON[row.status];
  return (
    <li
      data-upload-tracker-row={row.status}
      className="flex items-center gap-3 py-2.5"
    >
      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-tile bg-muted">
        {/* A held or refused photograph from an earlier visit has no picture here: nothing that
            is not in the album is ever presigned for a guest (`r2/grid-items.ts`). */}
        {picture ?? (
          <ImageIcon className="size-4 text-muted-foreground/60" aria-hidden />
        )}
      </div>
      <p
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1.5 text-sm",
          TONE[row.status],
        )}
      >
        <Icon
          className={cn(
            "size-4 shrink-0",
            row.status === "sending" && "motion-safe:animate-spin",
          )}
          aria-hidden
        />
        <span className="truncate text-foreground">
          {TRACKER_WORDS[row.status]}
        </span>
      </p>
    </li>
  );
}

/**
 * THE ROUND BUTTON BESIDE ADD PHOTOS, with its count: the number of hers waiting for the host, the
 * number only, like a notification badge. Nothing to count, no badge; nothing of hers sent at a
 * moderated event, no button at all.
 */
export function UploadTrackerButton({
  store,
  onOpen,
}: {
  store: UploadTrackerStore;
  onOpen: () => void;
}) {
  const { show, waiting } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => HIDDEN,
  );
  if (!show) return null;
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      onClick={onOpen}
      data-upload-tracker
      aria-label={
        waiting > 0
          ? `Your uploads, ${formatCount(waiting)} waiting for the host`
          : "Your uploads"
      }
      className="relative shrink-0 rounded-full"
    >
      <ListChecks />
      {waiting > 0 && (
        <span
          aria-hidden
          data-upload-tracker-count
          className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-micro font-semibold text-background tabular-nums ring-2 ring-background"
        >
          {formatCount(waiting)}
        </span>
      )}
    </Button>
  );
}

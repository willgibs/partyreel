"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Check,
  Clock,
  ImageIcon,
  ListChecks,
  Loader2,
  XCircle,
} from "lucide-react";

import { removeMyUploadGuestAction } from "@/app/(guest)/e/[token]/actions";
import { useGalleryLive } from "@/components/guest/gallery-live";
import { PickPreview } from "@/components/guest/upload/pick-preview";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import { NOT_APPROVED_HELP_HREF } from "@/lib/content/help-links";
import { formatCount } from "@/lib/format/count";
import {
  buildTrackerRows,
  developTimeWords,
  newlyInAlbum,
  TRACKER_SEALED_WORDS,
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
 * approval ("what's that 12? oh my uploads waiting for approval"), the number only. Only where she
 * has something sent at a moderated event; never in the demo. The rules are `lib/guest/upload-
 * tracker.ts`'s, as data; this is the drawing and the wiring.
 *
 * ★ IT IS THE ONLY PLACE A HELD PHOTOGRAPH SHOWS TO HER (`voice-guest` r2, Will's `held=uploads`):
 * nothing of hers stands in the album until the host lets it in, so the badge beside the Add she
 * just pressed is what says it went, and her list is where she learns what the host decided.
 *
 * ★ TWO HALVES, BECAUSE THE PAGE HAS TWO BOXES. The button sits in the words column and the dock,
 * ABOVE the album's live provider; the list needs what only the provider knows (the album's ids,
 * this device's in-flight pictures, the album's links). So `UploadTracker` lives inside the provider
 * and draws the sheet, and hands the button its two facts (whether to show, the count) through a
 * small store the page creates once: a sync re-renders the tracker, never the page's shell.
 *
 * ★ NO NEW POLL. Her queue is live; the album's own doorbell and poll carry every approval; her
 * own rows are read once at mount, again whenever she opens the list, and again when one of hers
 * arrives in the album (the only place a refusal can be learned, `/api/guests/mine` with
 * `statuses`; the arrival's re-read is `newlyInAlbum`'s note).
 *
 * ★ HER UPLOADS ARE A LIST, SO THEY OPEN AS ONE (`popups` r1, `lists=panel`, Will 2026-09-27): a
 * side panel beside the album at a desk, and in a hand the whole screen under a back arrow that says
 * "Album", the phone's own Back closing it. A list is a place she moves through, not a question: no
 * 85 percent cap and no album peeking over her rows.
 *
 * ★ WHAT WAITS FOR THE HOST IS STILL HERS TO TAKE BACK (Will's live walk, 2026-10-02: "Definitely need a
 * way to delete pending uploads ... where something may have been a mistake"). Every one of her own that is
 * not yet in the album (held for the host, and sealed until a disposable album develops) wears a Remove, on
 * the paths the album's own Delete uses (`remove_my_upload` for an account, `remove_my_upload_by_session`
 * for a guest's ticket, both of which take any of her rows not already removed), so a removed held upload
 * never reaches the host's Review. No confirm: nothing else in this list asks one. It says so the moment it
 * is pressed (Removing), leaves her list when the server agrees, and stays with a Try again when it does not.
 *
 * ★ HER READS CARRY HER NEWS (crumbs-38, the approval toast's server half): each asks `tell`, and the
 * server answers which of hers a decision let into the album since she was last told, marking them told
 * as it answers (`readOwnUploads`). The tracker hands the ids to the album's approval toast through the
 * store's own news channel (`news`), so the toast says "One of yours is in the album" on her return too,
 * once, and the page's shell never re-renders for it.
 */

/** Whether it shows, how many of hers wait, and how many of those wait for the album to develop. */
type TrackerSnapshot = { show: boolean; waiting: number; sealed: number };

const HIDDEN: TrackerSnapshot = { show: false, waiting: 0, sealed: 0 };

const NO_NEWS: readonly string[] = [];

/** The server's news, as the approval toast reads it: every id told this visit, in the order it arrived. */
export type ApprovalNews = {
  get: () => readonly string[];
  subscribe: (listener: () => void) => () => void;
};

export type UploadTrackerStore = {
  getSnapshot: () => TrackerSnapshot;
  subscribe: (listener: () => void) => () => void;
  set: (next: TrackerSnapshot) => void;
  /** Her news this visit (the toast reads it; the button never does). */
  news: ApprovalNews & { add: (ids: readonly string[]) => void };
};

/** The two facts the button needs, and the toast's news, kept outside React state (the page creates one per mount). */
export function createUploadTrackerStore(): UploadTrackerStore {
  let snapshot = HIDDEN;
  const listeners = new Set<() => void>();
  let news = NO_NEWS;
  const newsListeners = new Set<() => void>();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(next) {
      if (
        next.show === snapshot.show &&
        next.waiting === snapshot.waiting &&
        next.sealed === snapshot.sealed
      ) {
        return;
      }
      snapshot = next;
      for (const listener of listeners) listener();
    },
    news: {
      get: () => news,
      subscribe(listener) {
        newsListeners.add(listener);
        return () => {
          newsListeners.delete(listener);
        };
      },
      add(ids) {
        const fresh = ids.filter((id) => !news.includes(id));
        if (fresh.length === 0) return;
        news = [...news, ...fresh];
        for (const listener of newsListeners) listener();
      },
    },
  };
}

const EMPTY: ReadonlySet<string> = new Set();

/**
 * Her own rows' statuses, and her news, from the one route that reads them (`/api/guests/mine`,
 * `statuses` with `tell`). Null on any failure: the list keeps what it knew, and the queue and the
 * album are still live (and news not answered is not marked told: the next read answers it).
 */
async function readOwnStatuses(
  qrToken: string,
  sessionToken: string | null,
): Promise<{ items: OwnUploadWire[]; news: string[] } | null> {
  try {
    const res = await fetch("/api/guests/mine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // The ticket in the BODY, never a URL (a capability in a query string ends up in a log).
      body: JSON.stringify({
        qr_token: qrToken,
        ...(sessionToken ? { session_token: sessionToken } : {}),
        statuses: true,
        tell: true,
      }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      ok?: boolean;
      items?: OwnUploadWire[];
      news?: unknown;
    };
    if (!body.ok || !Array.isArray(body.items)) return null;
    const news = Array.isArray(body.news)
      ? body.news.filter((id): id is string => typeof id === "string")
      : [];
    return { items: body.items, news };
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
  developsAt = null,
  isDemo,
  isOwner,
  removedIds,
  onOwnRemoved,
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
  /** What she adds waits (`uploadsWait`'s `waits`): for the host's approval, or for a develop time ahead. */
  moderated: boolean;
  /** The album's develop time while it is ahead (`uploadsWait`'s `developsAt`): what she adds is sealed until then. */
  developsAt?: string | null;
  isDemo: boolean;
  isOwner: boolean;
  /** What she removed herself this visit: hers to forget, never listed. */
  removedIds: ReadonlySet<string>;
  /**
   * One of hers was removed from her list (the page's own-removal handler: it forgets the row, and on a
   * require-an-upload album with nothing of hers left, the server decides whether the door stands again).
   */
  onOwnRemoved?: (mediaId: string, remaining: number) => void;
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
    void readOwnStatuses(qrToken, sessionToken).then((answer) => {
      if (!answer) return;
      // The news is the store's, not this render's: told is told, even if the list closed meanwhile.
      store.news.add(answer.news);
      if (active) setOwn(answer.items);
    });
    return () => {
      active = false;
    };
  }, [canAsk, loaded, open, qrToken, sessionToken, store]);

  /* ── which of hers the album has held (so one that leaves it was taken down) ─────────────────── */
  const [approvedOnce, setApprovedOnce] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  // How many times one of hers has arrived in the album out of waiting: each one re-reads her rows.
  const [arrivals, setArrivals] = useState(0);
  const newlyIn = newlyInAlbum({ queue, own, album, approvedOnce });
  // The sanctioned adjust-state-during-render pattern: remembered in the render that first saw it.
  if (newlyIn.ids.length > 0) {
    setApprovedOnce((prev) => new Set([...prev, ...newlyIn.ids]));
    if (newlyIn.arrived) setArrivals((n) => n + 1);
  }
  useEffect(() => {
    // The arrival's re-read (`newlyInAlbum`): the refusal decided beside it is learned with it.
    if (!canAsk || arrivals === 0) return;
    let active = true;
    void readOwnStatuses(qrToken, sessionToken).then((answer) => {
      if (!answer) return;
      store.news.add(answer.news);
      if (active) setOwn(answer.items);
    });
    return () => {
      active = false;
    };
  }, [canAsk, arrivals, qrToken, sessionToken, store]);

  const sealing = developsAt !== null;
  // Said only in the open list, which draws after hydration: her own zone, never the server's.
  const developWhen = open && sealing ? developTimeWords(developsAt) : null;
  const rows = useMemo(
    () =>
      buildTrackerRows({
        queue,
        own,
        album,
        approvedOnce,
        removed: removedIds,
        sealing,
      }),
    [queue, own, album, approvedOnce, removedIds, sealing],
  );
  const waiting = waitingCount(rows);
  const sealed = rows.filter((row) => row.sealed).length;
  const show = trackerShows({ moderated, isDemo, isOwner, rows });
  useEffect(() => {
    store.set({ show, waiting, sealed });
  }, [store, show, waiting, sealed]);
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

  /* ── taking one of hers back (the head note): its state while it works, and if it fails ───────── */
  const [removing, setRemoving] = useState<
    ReadonlyMap<string, "working" | "failed">
  >(() => new Map());
  const mark = useCallback(
    (mediaId: string, state: "working" | "failed" | null) =>
      setRemoving((prev) => {
        const next = new Map(prev);
        if (state) next.set(mediaId, state);
        else next.delete(mediaId);
        return next;
      }),
    [],
  );
  const liveOwnCount = live?.liveOwnCount;
  const remove = useCallback(
    async (mediaId: string) => {
      mark(mediaId, "working");
      let ok = false;
      try {
        if (isAuthed) {
          ok = (await removeMyUploadGuestAction(mediaId)).ok;
        } else if (sessionToken) {
          const res = await fetch("/api/guests/remove", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // The ticket in the BODY, never a URL (the read's own rule).
            body: JSON.stringify({
              qr_token: qrToken,
              session_token: sessionToken,
              media_id: mediaId,
            }),
          });
          ok = res.ok;
        }
      } catch {
        ok = false;
      }
      if (!ok) {
        mark(mediaId, "failed");
        return;
      }
      // Gone from her list through the page's own record of what she removed (`removedIds`).
      mark(mediaId, null);
      onOwnRemoved?.(mediaId, liveOwnCount ? liveOwnCount(mediaId) : 0);
    },
    [isAuthed, sessionToken, qrToken, onOwnRemoved, liveOwnCount, mark],
  );

  return (
    <Popup open={open && show} onOpenChange={onOpenChange}>
      <PopupContent kind="list" data-upload-tracker-sheet>
        {/* The album's own sentence for this event's rule, so one rule has one wording: the host's review, or the
            develop (the album's time ahead, said in her own zone). */}
        <PopupHeader
          title="Your uploads"
          description={
            sealing
              ? `Uploads appear in the album when it develops${developWhen ? `, ${developWhen}` : ""}.`
              : "The host reviews uploads before they appear in the album."
          }
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
                  removing={
                    row.mediaId ? (removing.get(row.mediaId) ?? null) : null
                  }
                  onRemove={
                    removable(row) && row.mediaId
                      ? () => void remove(row.mediaId as string)
                      : undefined
                  }
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

/**
 * Whether she may take one of hers back here: it is on the server (it has its row) and not in the album
 * yet, where the album's own Delete would be its door. Held for the host today; a disposable album's
 * sealed ones read as waiting too until it develops.
 */
function removable(row: TrackerRow): boolean {
  return row.status === "waiting" && Boolean(row.mediaId);
}

/** One of hers: the picture (or a plain tile where none can be shown), and where it stands. */
function TrackerRowView({
  row,
  picture,
  removing = null,
  onRemove,
}: {
  row: TrackerRow;
  picture: React.ReactNode;
  /** Its removal, while it works or once it failed. */
  removing?: "working" | "failed" | null;
  /** Hers to take back (`removable`): its Remove. */
  onRemove?: () => void;
}) {
  const Icon = ICON[row.status];
  return (
    <li
      data-upload-tracker-row={row.status}
      data-removing={removing ?? undefined}
      className={cn(
        "flex items-center gap-3 py-2.5 transition-opacity duration-150 motion-reduce:transition-none",
        removing === "working" && "opacity-60",
      )}
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
          {removing === "failed"
            ? "Couldn't remove it"
            : row.sealed
              ? TRACKER_SEALED_WORDS
              : TRACKER_WORDS[row.status]}
        </span>
      </p>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={removing === "working"}
          data-upload-tracker-remove=""
          // Its name says which of her list it takes back where its word alone cannot.
          aria-label={
            removing === "failed"
              ? "Try removing this upload again"
              : "Remove this upload"
          }
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          {removing === "working" ? (
            <>
              <Loader2 className="motion-safe:animate-spin" aria-hidden />
              Removing
            </>
          ) : removing === "failed" ? (
            "Try again"
          ) : (
            "Remove"
          )}
        </Button>
      )}
      {/* THE LINK AT THE MOMENT OF TROUBLE (help-center r1 `from-product=contextual`): the host
          gives no reason, so the article's own section says what "Not approved" means and what
          she can do about it, in a new tab so her list and the album stay where they are. */}
      {row.status === "refused" && (
        <a
          href={NOT_APPROVED_HELP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          data-upload-tracker-why=""
          // The visible word leads the name (a voice user says "Why"), and the rest says where
          // it goes for a reader who meets it in a list of links, out of its row.
          aria-label="Why? What Not approved means"
          className="shrink-0 text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
        >
          Why?
        </a>
      )}
    </li>
  );
}

/**
 * THE ROUND BUTTON BESIDE ADD PHOTOS, with its count: the number of hers waiting (for approval, or for the album to
 * develop), the number only, like a notification badge; a screen reader hears the list's own words for it.
 * Nothing to count, no badge; nothing of hers sent at a moderated event, no button at all.
 *
 * ★ IT WEARS WHERE IT STANDS (`event-header` r1): the glass round beside the cover's Add, on the
 * photograph (`glass`), and the page's own round beside the shutter at the foot (`round`), both at
 * the 44px of the controls beside them. `row` is the 36px outline round a row of words holds.
 */
export function UploadTrackerButton({
  store,
  onOpen,
  look = "row",
}: {
  store: UploadTrackerStore;
  onOpen: () => void;
  look?: "row" | "glass" | "round";
}) {
  const { show, waiting, sealed } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => HIDDEN,
  );
  if (!show) return null;
  // What hers wait for, in her rows' own words: the host's approval, the develop, or both at once.
  const waitsFor =
    sealed === 0
      ? ` ${TRACKER_WORDS.waiting.toLowerCase()}`
      : sealed === waiting
        ? ` ${TRACKER_SEALED_WORDS.toLowerCase()}`
        : " waiting";
  return (
    <Button
      type="button"
      variant={look === "glass" ? "glass" : "outline"}
      size={look === "row" ? "icon-lg" : "icon-cta"}
      onClick={onOpen}
      data-upload-tracker
      aria-label={
        waiting > 0
          ? `Your uploads, ${formatCount(waiting)}${waitsFor}`
          : "Your uploads"
      }
      className={cn(
        "relative shrink-0 rounded-full",
        look === "round" && "bg-background shadow-layer",
      )}
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

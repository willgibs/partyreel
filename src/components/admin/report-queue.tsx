"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  BadgeCheck,
  Check,
  EyeOff,
  Gavel,
  ImageOff,
  Images,
  MailQuestion,
  Reply,
  ShieldAlert,
  Upload,
  UserRound,
  VideoOff,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  actionReportAction,
  askProofAction,
  dismissReportAction,
  dismissReportsAction,
  holdFromReportAction,
  holdScopeAction,
  reopenReportsAction,
  takeDownAction,
  undoTakeDownAction,
  type DismissResult,
} from "@/app/admin/reports/actions";
import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { MediaTile } from "@/components/app/media-grid";
import { showUndoToast } from "@/components/shared/undo-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { layerIsUp } from "@/components/ui/layer-is-up";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";
import { Textarea } from "@/components/ui/textarea";
import {
  askableProof,
  deletedItemLine,
  deletedItemNoun,
  dismissEndsTheHide,
  heldMessage,
  HIDE_RESTORED_MESSAGE,
  holdReasonFor,
  holdTouches,
  type HoldScope,
  LANE_WORDS,
  NO_REASON,
  PHONE_DESK_ONLY,
  phoneDeletedLine,
  PHONE_HOLD,
  PHONE_LINE,
  PHONE_TAKE_DOWN,
  PROOF_OFF_LINE,
  PROOF_QUESTION_MAX,
  REOPENED_MESSAGE,
  REPORT_NOTE_MAX,
  reporterWho,
  reporterWords,
  strikeWords,
  TAKE_DOWN_TOO,
} from "@/lib/admin/reports";
import type { EntryReport, ReviewEntry } from "@/lib/db/queries/reports";
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";
import { operatorRemovalTouches } from "@/lib/moderation/operator-actions";
import { isCoveredKind, isHarmKind, KIND_CHIP } from "@/lib/reports/kinds";
import { cn } from "@/lib/utils";

/**
 * THE REPORTS QUEUE AS THE REVIEW GRID (admin-triage r2, Will 2026-09-29, `look=grid`): "The host queue's 4:5
 * tiles and keys, the front as split cards; each reason, who reported and who sent it under its tile, and Space
 * opens it whole." One ENTRY a thing reported (the carried call `one-entry`), in two lanes this component draws
 * and People between them (the page's slot):
 *
 *  - IN FRONT, what its reporter called harm (`harm=kinds`), worst first, as split cards judged one at a time and
 *    never ticked (the carried call `front`). The two sexual kinds arrive COVERED, looked at once on a press
 *    (the runbook: confirm plausibility, never study it).
 *  - EVERYTHING ELSE, the sweep: 4:5 tiles with select circles, one Dismiss for all of them, and the product's
 *    Undo on its toast.
 *  - THE PEEK (Space, or a press): the report whole beside its photograph, every reason, every fact, the proof
 *    thread and the verbs: Dismiss at one press with its Undo, Remove through the portal's confirm with its
 *    note, Ask for proof where the reporter can be asked (`proof=confirm`), and Hold for forensics with Take it
 *    down too (the hold rebuilt on his word).
 *
 * ★ A PHONE GETS TWO ACTS, EACH ONE PRESS (`phone=stop` with his note: "May help to have both on mobile"): Take
 * it down now and Hold for forensics, on every item report, the front opened whole. Below 640 px there are no
 * ticks, no Dismiss, no notes and no proof: the report stays open for a desk to write its record.
 *
 * ★ THE KEYS ARE THE HOST QUEUE'S, MAPPED (the carried call `keys`): the arrows move, X ticks, Enter dismisses
 * what is ticked (or the report under the cursor in the sweep; in front it only opens it, so no key ever closes
 * a report of harm), Space opens it whole, Escape closes and then clears. Keys are the queue's only while nothing
 * else is focused or a report in it is; a field, a menu or another dialog keeps its own.
 *
 * ★ NOTHING HERE DECIDES WHAT A VERDICT TOUCHES: the actions read each report's own thing on the server and
 * answer the whole entry; the words below only describe it, from the server's read.
 */

/* ── The writes, injectable ──────────────────────────────────────────────── */

/**
 * EVERY WRITE THE QUEUE MAKES, as one object: the Server Actions by default, and writes that change nothing in
 * the Library (Review and Storage's own convention), so the real queue can be looked at without a reviewer ever
 * touching anyone's report.
 */
export type ReportQueueWrites = {
  dismiss: typeof dismissReportAction;
  dismissMany: typeof dismissReportsAction;
  reopenMany: typeof reopenReportsAction;
  action: typeof actionReportAction;
  askProof: typeof askProofAction;
  takeDown: typeof takeDownAction;
  undoTakeDown: typeof undoTakeDownAction;
  holdScope: typeof holdScopeAction;
  hold: typeof holdFromReportAction;
};

const SERVER_WRITES: ReportQueueWrites = {
  dismiss: dismissReportAction,
  dismissMany: dismissReportsAction,
  reopenMany: reopenReportsAction,
  action: actionReportAction,
  askProof: askProofAction,
  takeDown: takeDownAction,
  undoTakeDown: undoTakeDownAction,
  holdScope: holdScopeAction,
  hold: holdFromReportAction,
};

const WritesContext = createContext<ReportQueueWrites>(SERVER_WRITES);

/* ── Where the queue stands ──────────────────────────────────────────────── */

/** The one toast every verdict here speaks through: a later one replaces it, Undo and all. */
const QUEUE_TOAST_ID = "admin-report-queue";

function useQueueState(entries: readonly ReviewEntry[]) {
  const [ticked, setTicked] = useState<ReadonlySet<string>>(() => new Set());
  const [gone, setGone] = useState<ReadonlySet<string>>(() => new Set());
  const [cursor, setCursor] = useState<string | null>(null);
  const [peek, setPeek] = useState<string | null>(null);

  // What is on screen: the server's entries less what this page just dismissed (the refresh follows).
  const shown = useMemo(
    () => entries.filter((e) => !gone.has(e.key)),
    [entries, gone],
  );
  const front = shown.filter((e) => e.lane === "front");
  const sweep = shown.filter((e) => e.lane !== "front");

  const tick = useCallback(
    (key: string) => {
      if (!sweep.some((e) => e.key === key)) return;
      setTicked((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [sweep],
  );

  return {
    shown,
    front,
    sweep,
    ticked,
    cursor,
    peek,
    tick,
    clearTicks: () => setTicked(new Set()),
    point: setCursor,
    open: setPeek,
    hide: (keys: readonly string[]) =>
      setGone((prev) => new Set([...prev, ...keys])),
    unhide: (keys: readonly string[]) =>
      setGone((prev) => new Set([...prev].filter((k) => !keys.includes(k)))),
    untick: (keys: readonly string[]) =>
      setTicked((prev) => new Set([...prev].filter((k) => !keys.includes(k)))),
  };
}

type Queue = ReturnType<typeof useQueueState>;

/* ── The one dismissal, from a key, a bar, a card or the peek ─────────────── */

function useDismiss(q: Queue) {
  const w = useContext(WritesContext);
  const [pending, startTransition] = useTransition();

  const dismiss = useCallback(
    (entries: readonly ReviewEntry[], note?: string | null) => {
      if (entries.length === 0) return;
      const keys = entries.map((e) => e.key);
      // Lead with the result: they leave the queue now; a refusal puts them back.
      q.hide(keys);
      q.untick(keys);
      q.open(null);
      startTransition(async () => {
        const result: DismissResult =
          entries.length === 1
            ? await w.dismiss(entries[0].reportId, note ?? null)
            : await w.dismissMany(entries.map((e) => e.reportId));
        if (!result.ok) {
          q.unhide(keys);
          toast.error("Couldn't dismiss that.", {
            description: result.message,
          });
          return;
        }
        const closed = result.reportIds.length;
        showUndoToast({
          id: QUEUE_TOAST_ID,
          message: result.restored
            ? HIDE_RESTORED_MESSAGE
            : closed === 1
              ? "Report dismissed."
              : `Dismissed ${formatCount(closed)} reports.`,
          tone: "success",
          onUndo: () => q.unhide(keys),
          undo: () => w.reopenMany(result.reportIds),
          onUndoFailed: () => q.hide(keys),
          onUndone: () => toast.success(REOPENED_MESSAGE),
        });
      });
    },
    [q, w],
  );

  return { dismiss, pending };
}

/* ── The keys ────────────────────────────────────────────────────────────── */

/** Columns the sweep's grid lays out in, read off the page (the host queue's own rule). */
function columnsOf(root: Element | null): number {
  const grid = root?.querySelector<HTMLElement>("[data-report-grid]");
  if (!grid) return 1;
  const tracks = getComputedStyle(grid)
    .gridTemplateColumns.split(" ")
    .filter((t) => t && t !== "none");
  return Math.max(1, tracks.length);
}

function focusEntry(root: Element | null, key: string) {
  const el = root?.querySelector<HTMLElement>(
    `[data-entry-button="${CSS.escape(key)}"]`,
  );
  el?.focus({ preventScroll: true });
  el?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}

function useQueueKeys(
  rootRef: React.RefObject<HTMLElement | null>,
  q: Queue,
  dismiss: (entries: readonly ReviewEntry[]) => void,
) {
  const latest = useRef({ q, dismiss });
  useEffect(() => {
    latest.current = { q, dismiss };
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const root = rootRef.current;
      // The keys are a desk's: below 640 px there is nothing to sweep and no key to press.
      if (!root || !window.matchMedia("(min-width: 640px)").matches) return;
      const { q: s, dismiss: drop } = latest.current;
      // Another layer is up (the peek, a confirm, a menu): its keys are its own, Escape included.
      if (layerIsUp()) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("input, textarea, select, [contenteditable='true']"))
        return;
      const onBody =
        !target ||
        target === document.body ||
        target === document.documentElement;
      if (!onBody && !root.contains(target)) return;

      const order = [...s.front, ...s.sweep];
      if (order.length === 0) return;
      const at = s.cursor ? order.findIndex((x) => x.key === s.cursor) : -1;
      const inSweep = at >= s.front.length;
      const move = (next: number) => {
        const entry = order[Math.min(order.length - 1, Math.max(0, next))];
        if (!entry) return;
        s.point(entry.key);
        focusEntry(root, entry.key);
      };

      switch (e.key) {
        case "ArrowRight":
          move(at + 1);
          break;
        case "ArrowLeft":
          move(at - 1);
          break;
        case "ArrowDown":
          move(at < 0 ? 0 : at + (inSweep ? columnsOf(root) : 1));
          break;
        case "ArrowUp":
          move(at - (inSweep ? columnsOf(root) : 1));
          break;
        case "x":
        case "X":
          if (s.cursor) s.tick(s.cursor);
          break;
        case "Enter": {
          if (s.ticked.size > 0) {
            drop(s.sweep.filter((x) => s.ticked.has(x.key)));
          } else if (at >= 0 && inSweep) {
            drop([order[at]]);
          } else if (at >= 0) {
            // In front, Enter only opens: no key ever closes a report of harm.
            s.open(order[at].key);
          } else return;
          break;
        }
        case " ":
          if (at < 0) return;
          s.open(order[at].key);
          break;
        case "Escape":
          if (s.ticked.size === 0) return;
          s.clearTicks();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [rootRef]);
}

/* ── The facts, one set of parts ──────────────────────────────────────────── */

/** The peek's first words: the album, or the item's kind (a deleted item's as its report kept it). */
function peekSubject(entry: ReviewEntry): string {
  if (entry.subject === "album") return "The whole album";
  const type = entry.media?.type ?? entry.deleted?.type ?? null;
  if (type === "video") return "A video";
  if (type === "photo" || entry.media) return "A photo";
  return "An item";
}

/** What the thing reported is right now, as a chip; nothing while it is up. */
function nowWords(entry: ReviewEntry): string | null {
  const m = entry.media;
  // A report whose item is gone still names it (crumbs-21): the chip says what became of it.
  if (!m) return entry.deleted ? "Deleted" : null;
  if (m.held) return "Held";
  if (m.hidden) return "Hidden right away";
  if (m.standing === "operator") return "Taken down";
  if (m.standing === "removed") return "Out of the album";
  return null;
}

function Chips({ entry }: { entry: ReviewEntry }) {
  const now = nowWords(entry);
  const count = entry.reports.length;
  return (
    <div className="flex flex-wrap gap-1 empty:hidden">
      {isHarmKind(entry.kind) ? (
        <Badge
          data-report-fact="kind"
          variant={isCoveredKind(entry.kind) ? "destructive" : "warning"}
        >
          {KIND_CHIP[entry.kind]}
        </Badge>
      ) : null}
      {count > 1 ? (
        <Badge
          data-report-fact="count"
          variant="outline"
          className="font-normal"
        >
          {formatCount(count)} reports
        </Badge>
      ) : null}
      {now ? (
        <Badge
          data-report-fact="now"
          variant={entry.media?.held ? "info" : "secondary"}
          className="font-normal"
        >
          {now}
        </Badge>
      ) : null}
    </div>
  );
}

function Words({
  report,
  clamp,
  className,
}: {
  report: EntryReport;
  clamp?: 1 | 2;
  className?: string;
}) {
  return (
    <p
      data-report-fact="words"
      className={cn(
        "text-working text-pretty whitespace-pre-line",
        clamp === 1 && "line-clamp-1",
        clamp === 2 && "line-clamp-2",
        !report.reason && "text-muted-foreground",
        className,
      )}
    >
      {report.reason ?? NO_REASON}
    </p>
  );
}

/** Who sent it, in one line: her name and what else is known of her here. */
function uploaderLine(entry: ReviewEntry): string | null {
  const u = entry.uploader;
  if (!u) return null;
  if (u.isHost) return "The host's own upload";
  const parts = [
    `${u.name ?? "Nobody named"}${u.verified ? "" : ", unverified"}`,
  ];
  if (u.more !== null) parts.push(`${formatCount(u.more)} more here`);
  if (u.otherReports) {
    parts.push(
      `${formatCount(u.otherReports)} other report${u.otherReports === 1 ? "" : "s"}`,
    );
  }
  if (u.held) parts.push(`${formatCount(u.held)} of theirs held`);
  return parts.join(" · ");
}

function albumLine(entry: ReviewEntry): string {
  const e = entry.event;
  if (!e) return "Unknown album";
  const parts = [e.name];
  if (e.uploads !== null) {
    // One upload is one (build 23's NIT-10: "1 uploads").
    parts.push(
      `${formatCount(e.uploads)} ${e.uploads === 1 ? "upload" : "uploads"}`,
    );
  }
  if (e.host) parts.push(e.host);
  return parts.join(" · ");
}

function Fact({
  icon,
  id,
  children,
}: {
  icon: ReactNode;
  id: string;
  children: ReactNode;
}) {
  return (
    <span data-report-fact={id} className="flex min-w-0 items-center gap-1.5">
      <span className="shrink-0 text-muted-foreground/80 [&>svg]:size-3.5">
        {icon}
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

/**
 * ★ A CHILD-ABUSE REPORT'S ADDRESS AGAINST THE INSTANT HIDE (crumbs-33, from `hide-strikes`): how many live strikes
 * it holds and what a Dismiss would make of them, read from the rule's one home (`report_strikes`), so the
 * operator knows before the press when a Dismiss is the one that takes its hide away (marked, `data-strikes-end`).
 * Its own line, never truncated: the date is the point. Nothing at all where there is no reading.
 */
function StrikeLine({ report }: { report: EntryReport | undefined }) {
  const strikes = report?.strikes;
  if (!strikes) return null;
  const ends = dismissEndsTheHide(strikes);
  return (
    <p
      data-report-fact="strikes"
      data-strikes-end={ends ? "" : undefined}
      className={cn(
        "flex min-w-0 items-start gap-1.5 text-caption text-pretty text-muted-foreground",
        ends && "font-medium text-foreground",
      )}
    >
      <Gavel
        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/80"
        aria-hidden
      />
      <span className="min-w-0">{strikeWords(strikes)}</span>
    </p>
  );
}

/** A tile's facts. The peek lists every report with who sent it, so it asks for the rest without `who`. */
function FactLines({
  entry,
  who = true,
}: {
  entry: ReviewEntry;
  who?: boolean;
}) {
  const newest = entry.reports[0];
  const sent = uploaderLine(entry);
  return (
    <div className="flex min-w-0 flex-col gap-1 text-caption text-muted-foreground">
      {who ? (
        <Fact id="who" icon={newest.signedIn ? <BadgeCheck /> : <UserRound />}>
          {reporterWords(newest)}, {formatAdminTimestamp(newest.createdAt)}
        </Fact>
      ) : null}
      {/* The newest report whose address carries strikes (the peek says every report's own). */}
      {who ? (
        <StrikeLine report={entry.reports.find((r) => r.strikes)} />
      ) : null}
      {sent ? (
        <Fact id="uploader" icon={<Upload />}>
          {sent}
        </Fact>
      ) : null}
      <Fact id="album" icon={<Images />}>
        {entry.subject === "album"
          ? `The whole album: ${albumLine(entry)}`
          : albumLine(entry)}
      </Fact>
    </div>
  );
}

/* ── The frame ───────────────────────────────────────────────────────────── */

/**
 * THE REPORTED FRAME, 4:5 (the review queue's uniform box). The worst kinds arrive COVERED: nothing of the picture
 * is loaded until someone presses to look, once, and it stays in view for the page after that.
 */
function Still({
  entry,
  revealed,
  onReveal,
  className,
  big = false,
}: {
  entry: ReviewEntry;
  revealed: boolean;
  onReveal: () => void;
  className?: string;
  big?: boolean;
}) {
  const covered = isCoveredKind(entry.kind) && !revealed;
  return (
    <div
      className={cn(
        "relative aspect-[4/5] shrink-0 overflow-hidden rounded-tile bg-muted",
        className,
      )}
    >
      {entry.media && !covered ? (
        <MediaTile
          item={{
            type: entry.media.type,
            url: entry.media.url,
            previewUrl: big ? null : entry.media.previewUrl,
          }}
        />
      ) : entry.media ? (
        <span
          data-report-covered
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-foreground/85 p-2 text-center text-background"
        >
          <EyeOff className={big ? "size-6" : "size-4"} aria-hidden />
          <span className="text-caption font-medium">Covered</span>
          {big ? (
            <>
              <span className="max-w-56 text-caption opacity-80">
                The runbook: look only to confirm it, never to study it.
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-1"
                onClick={onReveal}
              >
                View once
              </Button>
            </>
          ) : null}
        </span>
      ) : entry.deleted ? (
        // ★ A REPORT WHOSE ITEM IS GONE IS STILL THAT ITEM'S (crumbs-21, migration 20260929231000): a
        // dismissal reopened after the purge took the row names the item it always named, never its album.
        <span
          data-report-deleted={entry.deleted.type ?? "item"}
          className="flex size-full flex-col justify-end gap-0.5 p-2"
        >
          {entry.deleted.type === "video" ? (
            <VideoOff className="size-3.5 text-muted-foreground" aria-hidden />
          ) : (
            <ImageOff className="size-3.5 text-muted-foreground" aria-hidden />
          )}
          <span className="line-clamp-2 text-caption font-medium">
            {deletedItemLine(entry.deleted.type)}
          </span>
        </span>
      ) : (
        <span className="flex size-full flex-col justify-end gap-0.5 p-2">
          <Images className="size-3.5 text-muted-foreground" aria-hidden />
          <span className="line-clamp-2 text-caption font-medium">
            {entry.event?.name ?? "An album"}
          </span>
        </span>
      )}
    </div>
  );
}

/* ── A tile in the sweep, a card in front ────────────────────────────────── */

function Tile({
  entry,
  q,
  revealed,
  onReveal,
  sweep,
}: {
  entry: ReviewEntry;
  q: Queue;
  revealed: boolean;
  onReveal: () => void;
  /** Ticks belong to the sweep (a phone draws none). */
  sweep: boolean;
}) {
  const on = q.ticked.has(entry.key);
  const newest = entry.reports[0];
  return (
    <li
      data-report-entry={entry.key}
      data-report-tile
      className="min-w-0 space-y-1.5"
    >
      <div
        className={cn(
          "relative rounded-tile outline-2 outline-offset-2",
          q.cursor === entry.key ? "outline-foreground" : "outline-transparent",
        )}
      >
        <button
          type="button"
          data-entry-button={entry.key}
          aria-label={`Open the report on ${entry.event?.name ?? "this album"}`}
          onFocus={() => q.point(entry.key)}
          onClick={() => {
            q.point(entry.key);
            q.open(entry.key);
          }}
          className="relative block w-full rounded-tile focus-visible:outline-none"
        >
          <Still
            entry={entry}
            revealed={revealed}
            onReveal={onReveal}
            className="w-full"
          />
          {on ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-tile bg-black/40"
            />
          ) : null}
        </button>
        {sweep ? (
          <button
            type="button"
            aria-pressed={on}
            aria-label={on ? "Untick" : "Tick"}
            onClick={() => q.tick(entry.key)}
            className={cn(
              "absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full ring-1 ring-white/70",
              on
                ? "bg-success text-success-foreground"
                : "bg-black/35 text-white hover:bg-black/50",
            )}
          >
            {on ? <Check className="size-3.5" /> : null}
          </button>
        ) : null}
      </div>
      <div className="min-w-0 space-y-1">
        <Chips entry={entry} />
        <Words
          report={newest}
          clamp={2}
          className="text-caption leading-snug"
        />
        <p className="flex min-w-0 items-center gap-1 text-micro text-muted-foreground">
          <span
            data-report-fact="who"
            className="shrink-0"
            title={reporterWords(newest)}
          >
            {newest.signedIn ? (
              <BadgeCheck className="size-3" aria-label={reporterWho(newest)} />
            ) : (
              <UserRound className="size-3" aria-label={reporterWho(newest)} />
            )}
          </span>
          <span className="min-w-0 truncate">
            {/* With no uploader to name, what the report is on, in the peek's own words: an item's
                report whose item is gone has no uploader either, and is never its album's (build 27). */}
            <span data-report-fact="uploader">
              {entry.uploader
                ? entry.uploader.isHost
                  ? "The host"
                  : `${entry.uploader.name ?? "Nobody named"}${entry.uploader.more !== null ? ` · ${formatCount(entry.uploader.more)} more` : ""}`
                : peekSubject(entry)}
            </span>
            {" · "}
            <span data-report-fact="album">
              {entry.event?.name ?? "An album"}
            </span>
            {" · "}
            {formatAdminTimestamp(newest.createdAt)}
          </span>
        </p>
      </div>
    </li>
  );
}

function FrontCard({
  entry,
  q,
  revealed,
  onReveal,
}: {
  entry: ReviewEntry;
  q: Queue;
  revealed: boolean;
  onReveal: () => void;
}) {
  return (
    <li
      data-report-entry={entry.key}
      data-report-front
      className={cn(
        "flex min-w-0 gap-3 rounded-lg border bg-card p-3",
        q.cursor === entry.key && "ring-2 ring-foreground",
      )}
    >
      <button
        type="button"
        data-entry-button={entry.key}
        aria-label="Open this report whole"
        onFocus={() => q.point(entry.key)}
        onClick={() => {
          q.point(entry.key);
          q.open(entry.key);
        }}
        className="shrink-0 rounded-tile focus-visible:outline-none"
      >
        <Still
          entry={entry}
          revealed={revealed}
          onReveal={onReveal}
          className="w-20"
        />
      </button>
      <div className="min-w-0 flex-1 space-y-1">
        <Chips entry={entry} />
        <Words report={entry.reports[0]} clamp={2} />
        <FactLines entry={entry} />
      </div>
    </li>
  );
}

/* ── The lanes ───────────────────────────────────────────────────────────── */

function LaneHead({
  lane,
  count,
  children,
}: {
  lane: "front" | "sweep";
  count: number;
  children?: ReactNode;
}) {
  const words = LANE_WORDS[lane];
  return (
    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 items-baseline gap-2">
        <h2
          className={cn(
            "text-label font-semibold uppercase",
            lane === "front" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {words.label}
          <span className="ml-1.5 tabular-nums opacity-70">
            {formatCount(count)}
          </span>
        </h2>
        <p className="hidden truncate text-caption text-muted-foreground sm:block">
          {words.line}
        </p>
      </div>
      {children}
    </div>
  );
}

function BulkBar({
  q,
  onDismiss,
  pending,
}: {
  q: Queue;
  onDismiss: () => void;
  pending: boolean;
}) {
  const n = q.ticked.size;
  if (n === 0) return null;
  return (
    <div
      data-report-bulk
      className="flex items-center gap-2 rounded-lg border bg-card py-1 pr-1 pl-3 shadow-xs"
    >
      <span className="mr-auto text-working font-medium tabular-nums">
        {formatCount(n)} ticked
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={onDismiss}
      >
        Dismiss {formatCount(n)}
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Clear the ticks"
        onClick={q.clearTicks}
      >
        <X />
      </Button>
    </div>
  );
}

/* ── The acts ────────────────────────────────────────────────────────────── */

/**
 * What the verdict's confirm says, true of THIS item as it stands: still up (a removal), already out of the album
 * by someone else's hand (made the operator's), already an operator's removal (the reports only close), or an
 * album (the reports only close; the album is acted on from Albums).
 */
export function verdictSheet(entry: ReviewEntry): {
  button: string;
  title: string;
  lede: string;
  verb: string;
  touches: string[];
  done: string;
} {
  const item = entry.media;
  const kind = item?.type ?? "photo";
  const eventName = entry.event?.name ?? "this event";
  const reports = entry.reports.length;
  const closes =
    reports === 1
      ? "This report moves to Actioned"
      : `All ${formatCount(reports)} reports on it move to Actioned`;
  if (!item && entry.deleted) {
    // Its item is gone (crumbs-21): nothing is left to take down, so the verdict only closes.
    const noun = deletedItemNoun(entry.deleted.type);
    return {
      button: "Action…",
      title: "Close this report as Actioned?",
      lede: `The ${noun} is already deleted; the report closes as Actioned.`,
      verb: "Action",
      touches: [closes],
      done: "Report actioned.",
    };
  }
  if (!item) {
    return {
      button: "Action…",
      title: "Action this report?",
      lede: "The report closes as Actioned; nothing else changes.",
      verb: "Action",
      touches: [closes, "The album itself is unchanged: act on it from Albums"],
      done: "Report actioned.",
    };
  }
  if (item.standing === "operator") {
    return {
      button: "Action…",
      title: "Close this report as Actioned?",
      lede: `The ${kind} is already taken down; the report closes as Actioned.`,
      verb: "Action",
      touches: [
        closes,
        `The ${kind} stays down: restore it from Albums if it should come back`,
      ],
      done: "Report actioned.",
    };
  }
  const live = item.standing === "live";
  return {
    button: "Remove…",
    title: `Remove this ${kind}?`,
    lede: live
      ? "It leaves the album and the host's Deleted now, and the report closes as Actioned."
      : "It is already out of the album; this takes it out of the host's Deleted too, and the report closes as Actioned.",
    verb: "Remove",
    touches: [
      ...operatorRemovalTouches({
        kind,
        eventName,
        from: live ? "album" : "deleted",
        wayBack: live ? "undo" : "albums",
      }),
      closes,
    ],
    done: live
      ? "Removed, and the report is actioned."
      : "Taken from the host, and the report is actioned.",
  };
}

/** The desk's verbs on one entry: Dismiss, Remove, Ask for proof, Hold for forensics and a note. */
function DeskVerbs({
  entry,
  proofOn,
  onDismiss,
  pending,
}: {
  entry: ReviewEntry;
  proofOn: boolean;
  onDismiss: (note: string | null) => void;
  pending: boolean;
}) {
  const w = useContext(WritesContext);
  const [asking, setAsking] = useState<"verdict" | "hold" | "proof" | null>(
    null,
  );
  const [scope, setScope] = useState<HoldScope | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, startTransition] = useTransition();
  const verdict = verdictSheet(entry);
  const newest = entry.reports[0];
  const askable = askableProof({ kind: entry.kind, canAsk: newest.canAsk });
  const item = entry.media;

  function openHold() {
    startTransition(async () => {
      const result = await w.holdScope(entry.reportId);
      if (!result.ok) {
        toast.error("Couldn't open the hold.", { description: result.message });
        return;
      }
      setScope(result.scope);
      setAsking("hold");
    });
  }

  return (
    <div data-report-verbs className="space-y-3">
      {noteOpen ? (
        <div className="space-y-1.5">
          <label htmlFor={`note-${entry.key}`} className="text-sm font-medium">
            Note{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <Textarea
            id={`note-${entry.key}`}
            rows={2}
            maxLength={REPORT_NOTE_MAX}
            value={note}
            placeholder="Why, in one line"
            className="min-h-0 resize-none"
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || busy}
          onClick={() => onDismiss(note.trim() || null)}
        >
          Dismiss
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending || busy}
          onClick={() => setAsking("verdict")}
        >
          {verdict.button}
        </Button>
        {item && !item.held ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || busy}
            onClick={openHold}
          >
            <ShieldAlert />
            Hold for forensics
          </Button>
        ) : null}
        {askable ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-report-ask
            disabled={!proofOn || pending || busy}
            title={proofOn ? undefined : PROOF_OFF_LINE}
            onClick={() => setAsking("proof")}
          >
            <MailQuestion />
            Ask for proof
          </Button>
        ) : null}
        {noteOpen ? null : (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            className="text-caption text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Add a note
          </button>
        )}
      </div>
      {item?.held ? (
        <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <ShieldAlert className="size-3.5 shrink-0" aria-hidden />
          Held for forensics. Only Forensics releases it.
        </p>
      ) : null}
      {askable && !proofOn ? (
        <p className="text-caption text-muted-foreground">{PROOF_OFF_LINE}</p>
      ) : null}

      <DestructiveSheet
        open={asking === "verdict"}
        onOpenChange={(open) => setAsking(open ? "verdict" : null)}
        title={verdict.title}
        lede={verdict.lede}
        verb={verdict.verb}
        touches={verdict.touches}
        severity="reversible"
        note={{
          label: "Note",
          defaultValue: note,
          placeholder: "Why, in one line",
          hint: "Kept on the report with the verdict. Only this portal reads it.",
          maxLength: REPORT_NOTE_MAX,
        }}
        successMessage={verdict.done}
        onConfirm={(_typed, written) => w.action(entry.reportId, written)}
      />
      {scope ? (
        <DestructiveSheet
          open={asking === "hold"}
          onOpenChange={(open) => setAsking(open ? "hold" : null)}
          title={`Hold and preserve this ${scope.kind}?`}
          lede="It stays out of every purge until the hold is released from Forensics, and this report stays open."
          verb="Set hold and preserve"
          touches={(takeDown) => holdTouches(scope, { takeDown })}
          severity="reversible"
          option={{
            label: TAKE_DOWN_TOO.label,
            hint: TAKE_DOWN_TOO.hint,
            defaultChecked: true,
          }}
          note={{
            label: "Reason, on the record",
            required: true,
            defaultValue: holdReasonFor(entry.reportId),
            placeholder: "e.g. report reference, CyberTipline filing",
            hint: "Written on each hold and in the forensic audit log.",
            maxLength: REPORT_NOTE_MAX,
          }}
          successMessage={(takeDown) =>
            heldMessage(1 + scope.others, { takeDown })
          }
          onConfirm={(_typed, reason, takeDown) =>
            w.hold(entry.reportId, reason, takeDown)
          }
        />
      ) : null}
      {askable ? (
        <DestructiveSheet
          open={asking === "proof"}
          onOpenChange={(open) => setAsking(open ? "proof" : null)}
          title="Ask the reporter for proof?"
          lede="One mail, in your words, to the address she confirmed as she reported."
          verb="Send the question"
          touches={[
            "One mail to the address she confirmed; this portal never shows it",
            "Her answer lands on this report, beside its photo",
            "The report stays open, and the host is never told",
          ]}
          severity="reversible"
          note={{
            label: "Your question",
            required: true,
            placeholder: "What would show this is harm, in a sentence or two",
            hint: "Sent as written. The address is deleted when the report closes.",
            maxLength: PROOF_QUESTION_MAX,
          }}
          successMessage="Question sent."
          onConfirm={(_typed, question) => w.askProof(entry.reportId, question)}
        />
      ) : null}
    </div>
  );
}

/** A phone's two acts on an item report, each one press; the report stays open for a desk. */
function PhoneActs({ entry }: { entry: ReviewEntry }) {
  const w = useContext(WritesContext);
  const [pending, startTransition] = useTransition();
  if (entry.subject !== "item" || !entry.media) {
    return (
      <p data-report-phone-acts className="text-caption text-muted-foreground">
        {entry.subject === "item" && entry.deleted
          ? phoneDeletedLine(entry.deleted.type)
          : PHONE_DESK_ONLY[entry.subject === "person" ? "person" : "album"]}
      </p>
    );
  }
  const down = entry.media.standing === "operator";

  function takeItDown() {
    startTransition(async () => {
      const result = await w.takeDown(entry.reportId);
      if (!result.ok) {
        toast.error("Couldn't take it down.", { description: result.message });
        return;
      }
      showUndoToast({
        id: QUEUE_TOAST_ID,
        message: "Taken down. The report stays open for a desk.",
        tone: "success",
        onUndo: () => {},
        undo: () => w.undoTakeDown(entry.reportId, result.at),
        onUndoFailed: () => {},
        onUndone: () => toast.success("It's back where it was."),
      });
    });
  }

  function hold() {
    startTransition(async () => {
      const result = await w.hold(entry.reportId, null, true);
      if (!result.ok) {
        toast.error("Couldn't finish the hold.", {
          description: result.message,
        });
        return;
      }
      toast.success(heldMessage(1, { takeDown: true }));
    });
  }

  return (
    <div data-report-phone-acts className="space-y-2">
      <Button
        type="button"
        variant="destructive"
        className="w-full"
        disabled={pending || down}
        onClick={takeItDown}
      >
        {down ? "Taken down" : PHONE_TAKE_DOWN}
      </Button>
      {entry.media.held ? null : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={pending}
          onClick={hold}
        >
          <ShieldAlert />
          {PHONE_HOLD}
        </Button>
      )}
      <p className="text-caption text-pretty text-muted-foreground">
        {PHONE_LINE}
      </p>
    </div>
  );
}

/* ── The proof thread ────────────────────────────────────────────────────── */

function ProofThread({ report }: { report: EntryReport }) {
  if (!report.proof) return null;
  const { askedAt, question, answeredAt, answer } = report.proof;
  return (
    <div
      data-report-proof
      className="space-y-2 rounded-lg border bg-muted/30 p-3"
    >
      <div className="space-y-0.5">
        <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <MailQuestion className="size-3.5" aria-hidden />
          You asked, {formatAdminTimestamp(askedAt)}
        </p>
        <p className="text-working whitespace-pre-line">{question}</p>
      </div>
      <div className="space-y-1 border-t pt-2">
        {answeredAt && answer ? (
          <>
            <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
              <Reply className="size-3.5" aria-hidden />
              She answered, {formatAdminTimestamp(answeredAt)}
            </p>
            <p className="text-working whitespace-pre-line">{answer}</p>
          </>
        ) : (
          <p className="text-caption text-muted-foreground">No answer yet.</p>
        )}
      </div>
    </div>
  );
}

/* ── The peek: the report whole ──────────────────────────────────────────── */

/**
 * THE REPORT WHOLE (Space, or a press), as a place the operator reads: the portal's panel beside the queue at a
 * desk, the whole screen in a hand (`PopupContent kind="list"`, the one table's row for a place). The photograph
 * at the panel's width (covered until it is looked at once), every report's words with who sent it, every fact,
 * the proof thread, and the verbs this width is trusted with.
 */
function Peek({
  entry,
  onClose,
  revealed,
  onReveal,
  proofOn,
  onDismiss,
  pending,
}: {
  entry: ReviewEntry | null;
  onClose: () => void;
  revealed: boolean;
  onReveal: () => void;
  proofOn: boolean;
  onDismiss: (note: string | null) => void;
  pending: boolean;
}) {
  return (
    <Popup
      open={entry !== null}
      onOpenChange={(open) => (open ? null : onClose())}
    >
      <PopupContent kind="list">
        {entry ? (
          <>
            <PopupHeader
              title={entry.event?.name ?? "A report"}
              description={`${peekSubject(entry)}, ${formatAdminTimestamp(entry.newestAt)}`}
              back="Reports"
            />
            <PopupBody className="space-y-4">
              <div data-report-peek className="space-y-4">
                <Still
                  entry={entry}
                  revealed={revealed}
                  onReveal={onReveal}
                  big
                  className="mx-auto w-full max-w-[360px]"
                />
                <Chips entry={entry} />
                <ol className="space-y-3">
                  {entry.reports.map((report) => (
                    <li key={report.id} className="space-y-1">
                      <Words report={report} className="text-reading" />
                      <p className="text-caption text-muted-foreground">
                        {reporterWords(report)},{" "}
                        {formatAdminTimestamp(report.createdAt)}
                      </p>
                      <StrikeLine report={report} />
                      <ProofThread report={report} />
                    </li>
                  ))}
                </ol>
                <FactLines entry={entry} who={false} />
              </div>
            </PopupBody>
            <PopupFooter>
              <div className="hidden w-full sm:block">
                <DeskVerbs
                  entry={entry}
                  proofOn={proofOn}
                  onDismiss={onDismiss}
                  pending={pending}
                />
              </div>
              <div className="w-full sm:hidden">
                <PhoneActs entry={entry} />
              </div>
            </PopupFooter>
          </>
        ) : null}
      </PopupContent>
    </Popup>
  );
}

/* ── The queue ───────────────────────────────────────────────────────────── */

export function ReportQueue({
  entries,
  proofOn,
  people,
  writes = SERVER_WRITES,
}: {
  entries: ReviewEntry[];
  /** Ask for proof's mail is switched on (`ops_flags.report_proof_mail_enabled`). */
  proofOn: boolean;
  /** The People lane, drawn between the front and the sweep. */
  people?: ReactNode;
  /** The Server Actions, or the Library's writes that change nothing. */
  writes?: ReportQueueWrites;
}) {
  return (
    <WritesContext.Provider value={writes}>
      <Queue entries={entries} proofOn={proofOn} people={people} />
    </WritesContext.Provider>
  );
}

function Queue({
  entries,
  proofOn,
  people,
}: {
  entries: ReviewEntry[];
  proofOn: boolean;
  people?: ReactNode;
}) {
  const q = useQueueState(entries);
  const { dismiss, pending } = useDismiss(q);
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const reveal = (key: string) =>
    setRevealed((prev) => new Set([...prev, key]));
  const rootRef = useRef<HTMLDivElement | null>(null);
  useQueueKeys(rootRef, q, dismiss);

  const peekEntry = q.peek
    ? (q.shown.find((e) => e.key === q.peek) ?? null)
    : null;

  const frontCount = q.front.reduce((n, e) => n + e.reports.length, 0);
  const sweepCount = q.sweep.reduce((n, e) => n + e.reports.length, 0);

  return (
    <div ref={rootRef} data-report-queue className="space-y-6">
      {q.front.length > 0 ? (
        <section aria-label="In front" data-report-lane="front">
          <LaneHead lane="front" count={frontCount} />
          {/* A desk: split cards, judged one at a time. */}
          <ul className="hidden gap-3 sm:grid lg:grid-cols-2">
            {q.front.map((entry) => (
              <FrontCard
                key={entry.key}
                entry={entry}
                q={q}
                revealed={revealed.has(entry.key)}
                onReveal={() => reveal(entry.key)}
              />
            ))}
          </ul>
          {/* A phone: each opened whole, with its two acts. */}
          <div className="space-y-3 sm:hidden">
            {q.front.map((entry) => (
              <article
                key={entry.key}
                data-report-phone-front
                className="space-y-3 rounded-lg border bg-card p-3"
              >
                <div className="flex gap-3">
                  <Still
                    entry={entry}
                    revealed={revealed.has(entry.key)}
                    onReveal={() => reveal(entry.key)}
                    className="w-24"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Chips entry={entry} />
                    <Words report={entry.reports[0]} clamp={2} />
                  </div>
                </div>
                <FactLines entry={entry} />
                <PhoneActs entry={entry} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {people}

      {q.sweep.length > 0 ? (
        <section aria-label="Everything else" data-report-lane="sweep">
          <LaneHead lane="sweep" count={sweepCount}>
            <div className="hidden sm:block">
              <BulkBar
                q={q}
                pending={pending}
                onDismiss={() =>
                  dismiss(q.sweep.filter((e) => q.ticked.has(e.key)))
                }
              />
            </div>
          </LaneHead>
          {/* A desk: the review grid with its select circles. */}
          <ul
            data-report-grid
            className="hidden grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-x-3 gap-y-5 sm:grid"
          >
            {q.sweep.map((entry) => (
              <Tile
                key={entry.key}
                entry={entry}
                q={q}
                sweep
                revealed={revealed.has(entry.key)}
                onReveal={() => reveal(entry.key)}
              />
            ))}
          </ul>
          {/* A phone: tiles without ticks; a tap opens the report whole with its two acts. */}
          <ul className="grid grid-cols-3 gap-x-2 gap-y-3 sm:hidden">
            {q.sweep.map((entry) => (
              <Tile
                key={entry.key}
                entry={entry}
                q={q}
                sweep={false}
                revealed={revealed.has(entry.key)}
                onReveal={() => reveal(entry.key)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <Peek
        entry={peekEntry}
        onClose={() => q.open(null)}
        revealed={peekEntry ? revealed.has(peekEntry.key) : false}
        onReveal={() => (peekEntry ? reveal(peekEntry.key) : undefined)}
        proofOn={proofOn}
        pending={pending}
        onDismiss={(note) =>
          peekEntry ? dismiss([peekEntry], note) : undefined
        }
      />
    </div>
  );
}

"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { Copy, Play, ShieldAlert, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  CLOSED_REPORTS,
  frameOf,
  OPEN_REPORTS,
  type ReportRow,
} from "./fixtures";
import { StateChip } from "./shell";

/**
 * A REPORT, DRAWN EVERY WAY THIS BOARD ASKS ABOUT.
 *
 * Four axes meet on one card and each decision moves exactly one of them: what
 * leads it (`look`), what a report with nothing said does (`reason`), what
 * pressing a verdict costs (`verdict`), and what is left of it once it is
 * closed (`closed`). Everything else is today's product, so a decision never
 * arrives quietly wearing the answer to a question he has not been asked.
 *
 * ★ THE FILTER BAR STAYS AT TODAY'S OPEN/ALL EVERYWHERE BUT ON ITS OWN
 * QUESTION. Three surfaces in one nav group spell the same gesture three ways,
 * which is what `one-idiom` asks; drawing the fix here would answer it on seven
 * other steps by accident and would make every "as today" option a lie.
 *
 * ★ AND NOTHING ON THIS BOARD CALLS AN ACTION. `ReportReviewList` imports
 * `dismissReportAction` and `actionReportAction` at module scope, so mounting
 * the real component in a frame would put two live service-role writes one
 * click from a board. Every button here is a look-alike on the same
 * primitives: same `Button` variants, same sizes, same words.
 */

export type LookShape = "frame" | "split";
export type ReasonShape = "last" | "chrono";
export type VerdictShape = "two" | "note";
export type ClosedShape = "line" | "undo";

export const lookOf = (v: string | undefined): LookShape =>
  v === "frame" ? v : "split";
export const reasonOf = (v: string | undefined): ReasonShape =>
  v === "last" ? v : "chrono";
export const verdictOf = (v: string | undefined): VerdictShape =>
  v === "two" ? v : "note";
export const closedOf = (v: string | undefined): ClosedShape =>
  v === "line" ? v : "undo";

/* ── The parts a card is made of ─────────────────────────────────────────── */

/**
 * The reported frame. `data-tri-frame` is how the board reads its real edge in
 * CSS pixels off the laid-out document: the one number on this board that
 * cannot be argued with is how big the thing being judged actually is.
 */
function Shot({
  row,
  size,
  className,
}: {
  row: ReportRow;
  /**
   * The square edge in px, "fill" to take the column it is in, or "row" for
   * the 200 px square of the row shape, which becomes a full-width frame
   * under 640 px rather than squeezing the words to one per line.
   */
  size: number | "fill" | "row";
  className?: string;
}) {
  const still = frameOf(row);
  if (!still) return null;
  return (
    <div
      data-tri-frame
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted",
        size === "fill" && "aspect-[3/2] w-full",
        size === "row" && "tri-row-shot",
        typeof size === "number" && "aspect-square",
        className,
      )}
      style={typeof size === "number" ? { width: size } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a presigned original */}
      <img
        src={still.src}
        alt=""
        className="size-full object-cover"
        draggable={false}
      />
      {row.media?.type === "video" ? (
        <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
          <Play className="size-2.5 fill-current" />
          Video
        </span>
      ) : null}
    </div>
  );
}

function StatusChip({ row }: { row: ReportRow }) {
  // `shrink-0`, because the row puts it opposite a paragraph: without it a
  // 375 px column squeezes the chip on top of the first word of the reason,
  // which the first capture pass caught on the phone step.
  const cls = "shrink-0";
  if (row.status === "open")
    return (
      <StateChip level="open" className={cls}>
        Open
      </StateChip>
    );
  if (row.status === "dismissed")
    return (
      <StateChip level="dismissed" className={cls}>
        Dismissed
      </StateChip>
    );
  return (
    <StateChip level="actioned" className={cls}>
      Actioned
    </StateChip>
  );
}

/** The quiet line every shape carries: when, whose album, what was reported. */
function Meta({ row, className }: { row: ReportRow; className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      {row.when} · {row.scope === "item" ? "item reported" : "album reported"} ·{" "}
      {row.host}
    </p>
  );
}

/**
 * The reason, two ways, now that an empty block is ruled absent rather than
 * drawn hollow (app-shape r2): neither answer here ever fakes a sentence
 * where none was typed. `chrono` draws nothing at all, keeping the wordless
 * report's place in the queue. `last` draws one small line explaining why the
 * report sank to the foot, which is a status note rather than a stand-in
 * reason.
 */
function Reason({ row, shape }: { row: ReportRow; shape: ReasonShape }) {
  if (row.reason) return <p className="text-sm">{row.reason}</p>;
  if (shape === "last")
    return (
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Nothing said.</span> Ranked
        under every report that carries a sentence.
      </p>
    );
  return null;
}

/* ── The verdict, two ways ───────────────────────────────────────────────── */

function VerdictBar({
  row,
  shape,
  /** True on the one card drawn mid-act, so a note field is open on exactly one. */
  acting = false,
}: {
  row: ReportRow;
  shape: VerdictShape;
  acting?: boolean;
}) {
  const remove = row.media ? "Remove item and action" : "Action";

  if (shape === "note" && acting)
    return (
      <div className="w-full space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm">
            Dismiss
          </Button>
          <Button type="button" variant="destructive" size="sm">
            {remove}
          </Button>
        </div>
        <div className="rounded-md border border-dashed bg-background px-3 py-2 text-sm text-muted-foreground">
          Add a note. Optional, and nobody outside this portal reads it.
        </div>
      </div>
    );

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm">
        Dismiss
      </Button>
      <Button type="button" variant="destructive" size="sm">
        {remove}
      </Button>
      {shape === "note" ? (
        <span className="text-xs text-muted-foreground underline underline-offset-4">
          Add a note
        </span>
      ) : null}
    </div>
  );
}

/* ── One report, in whichever shape leads ────────────────────────────────── */

export type CardWorld = {
  look: LookShape;
  reason: ReasonShape;
  verdict: VerdictShape;
  /**
   * The escalate decision's own control, asked for per report: an album-level
   * report names no media row, so there is nothing to hold and nothing to copy.
   */
  escalate?: (row: ReportRow) => ReactNode;
  /** The card drawn mid-act, for the verdict that asks for a line. */
  acting?: boolean;
};

export function OpenReport({ row, world }: { row: ReportRow; world: CardWorld }) {
  const { look, reason, verdict, escalate, acting } = world;
  const hold = escalate?.(row) ?? null;

  // THE PICTURE FIRST: the reported frame takes the card's whole width and the
  // words sit under it, which is the shape of every product whose operator is
  // judging an image rather than reading a ticket.
  if (look === "frame")
    return (
      <Card className="overflow-hidden py-0">
        <Shot row={row} size="fill" className="rounded-none" />
        <div className="space-y-3 px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Reason row={row} shape={reason} />
              <Meta row={row} className="mt-1.5" />
            </div>
            <StatusChip row={row} />
          </div>
          {hold}
          <VerdictBar row={row} shape={verdict} acting={acting} />
        </div>
      </Card>
    );

  // THE PICTURE BESIDE THE REASON: one row per report, the frame at 200 px on
  // the left, the words and the verdict on the right. An album report with no
  // frame keeps the row and gives the words the whole width.
  return (
    <Card>
      {/* ★ THE ROW STACKS UNDER 640 px. At 375 a fixed 200 px frame leaves the
          words about 100 px, which renders one word a line with the status chip
          sitting on top of the first one: the first 375 capture pass caught it.
          A row shape that cannot narrow is not a row shape. */}
      <div className="tri-row px-6 py-5">
        {/* An album report names no frame, so it takes the row's whole width
            rather than 200 px of dashed nothing beside three short lines. */}
        {row.media ? <Shot row={row} size="row" /> : null}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Reason row={row} shape={reason} />
              <Meta row={row} className="mt-1.5" />
            </div>
            <StatusChip row={row} />
          </div>
          {hold}
          <VerdictBar row={row} shape={verdict} acting={acting} />
        </div>
      </div>
    </Card>
  );
}

/* ── A closed report, two ways ───────────────────────────────────────────── */

function ClosedReport({
  row,
  shape,
}: {
  row: ReportRow;
  shape: ClosedShape;
}) {
  // A CLOSED REPORT IS ONE LINE: the verdict, the note it left, and who took
  // it. The queue reads as a log, and the thumbnail is small because the
  // decision has already been taken on it.
  return (
    <div
      data-tri-closed
      className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0"
    >
      {row.media ? (
        <Shot row={row} size={32} className="rounded" />
      ) : (
        <span className="size-8 shrink-0 rounded border border-dashed" />
      )}
      <StatusChip row={row} />
      <span className="min-w-0 flex-1 truncate text-sm">
        {row.resolved?.note ?? (
          <span className="text-muted-foreground">No note</span>
        )}
      </span>
      {/* `shrink-0` and a fixed column: `truncate` sets overflow:hidden, which
          makes a flex item's automatic minimum size 0, so beside a flex-1
          sibling this album's name was being squeezed to nothing. The first
          capture pass caught it as a missing column. */}
      <span className="tri-log-album w-44 shrink-0 truncate text-right text-xs text-muted-foreground">
        {row.event}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {row.resolved?.when}
      </span>
      {shape === "undo" ? (
        row.held ? (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <ShieldAlert className="size-3.5" />
            Held
          </span>
        ) : row.status === "actioned" && row.when.startsWith("Yesterday") ? (
          <Button type="button" variant="outline" size="sm" className="shrink-0">
            <Undo2 className="size-3.5" />
            Undo
          </Button>
        ) : (
          <span className="w-[68px] shrink-0" />
        )
      ) : null}
    </div>
  );
}

/* ── The surface ─────────────────────────────────────────────────────────── */

/** Today's filter bar, kept exactly, because `one-idiom` is the question about it. */
function Filters({ active }: { active: "open" | "all" }) {
  return (
    <nav className="mb-5 flex flex-wrap gap-1">
      {(["open", "all"] as const).map((f) => (
        <span
          key={f}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm",
            active === f
              ? "bg-foreground text-background"
              : "text-muted-foreground",
          )}
        >
          {f === "open" ? "Open" : "All"}
        </span>
      ))}
    </nav>
  );
}

export function ReportsSurface({
  world,
  reason = "chrono",
  /** Which report is drawn mid-act, by index in the open queue. */
  acting,
  /**
   * Draw one report rather than the queue. The escalate decision needs the
   * report and the surface the hold is set on to be on one screen, and three
   * reports push the second one 1,100 px down a 900 px page.
   */
  only,
  children,
}: {
  world: CardWorld;
  reason?: ReasonShape;
  acting?: number;
  only?: number;
  children?: ReactNode;
}) {
  // The wordless report drops to the foot of the queue only under `last`; the
  // other two answers leave the newest-first order the query already has.
  const sorted =
    reason === "last"
      ? [...OPEN_REPORTS].sort(
          (a, b) => Number(!a.reason) - Number(!b.reason),
        )
      : OPEN_REPORTS;
  const queue = only === undefined ? sorted : [OPEN_REPORTS[only]];

  return (
    <>
      <Filters active="open" />
      {children}
      <div className="space-y-4">
        {queue.map((row, i) => (
          <OpenReport
            key={row.id}
            row={row}
            world={{ ...world, reason, acting: acting === i }}
          />
        ))}
      </div>
    </>
  );
}

/**
 * ★ THE ALL VIEW IS SCROLLED TO THE ANSWER, ONCE, ON MOUNT, AND THE CAPTURE
 * PASS IS WHY. Drawn from the top, all three options of this decision are the
 * same picture: tonight's three open reports are the newest rows, they stand
 * 816 px of a 900 px screen, and every answered report is below the fold in
 * every option. `lab:demo` called it FROZEN and it was right. The page itself is
 * honest (the query is newest first and open reports are the newest tonight);
 * what was wrong was showing a question about closed reports from a scroll
 * position where none of them is visible. So the frame starts where the history
 * does, which is where an operator who pressed All is going anyway.
 */
function ScrollToHistory() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const run = () => {
      const first =
        el.ownerDocument.querySelector<HTMLElement>("[data-tri-closed]");
      if (!first) return;
      // 64 px of the row above it, so the history reads as a section of a page
      // rather than as a page of its own.
      const top = first.getBoundingClientRect().top + win.scrollY - 64;
      win.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    };
    // Three passes: the layout, the photographs decoding, and the board's own
    // late reading. A frame that never settles simply stays where it was.
    const late = [400, 1200, 2100].map((ms) => win.setTimeout(run, ms));
    return () => late.forEach((t) => win.clearTimeout(t));
  }, []);
  return <div ref={ref} aria-hidden />;
}

export function HistorySurface({
  shape,
  look,
}: {
  shape: ClosedShape;
  look: LookShape;
}) {
  return (
    <>
      <ScrollToHistory />
      <Filters active="all" />
      <div className="space-y-6">
        <div className="space-y-4">
          {OPEN_REPORTS.map((row) => (
            <OpenReport
              key={row.id}
              row={row}
              world={{ look, reason: "chrono", verdict: "two" }}
            />
          ))}
        </div>
        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Closed
          </p>
          <div className="rounded-xl border bg-card">
            {CLOSED_REPORTS.map((row) => (
              <ClosedReport key={row.id} row={row} shape={shape} />
            ))}
          </div>
          {shape === "undo" ? (
            <p className="mt-2 text-xs text-muted-foreground">
              An Undo restores the item and reopens the report for a day. A
              held item has no Undo: only Forensics releases a hold.
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ── The same act in a hand ──────────────────────────────────────────────── */

export type PhoneShape = "act" | "all";

export const phoneOf = (v: string | undefined): PhoneShape =>
  v === "all" ? v : "act";

export function PhoneQueue({ shape }: { shape: PhoneShape }) {
  const row = OPEN_REPORTS[0];

  // SEE IT AND STOP IT: the frame, the reason, and the one verb that cannot
  // wait. The report stays open until the record is written on a laptop, which
  // is the honest cost of taking a photograph down from a party.
  if (shape === "act")
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">3 open</p>
          <StateChip level="open">Needs you</StateChip>
        </div>
        <Card className="overflow-hidden py-0">
          <Shot row={row} size="fill" className="rounded-none" />
          <div className="space-y-3 px-4 py-4">
            <p className="text-sm">{row.reason}</p>
            <Meta row={row} />
            <Button type="button" variant="destructive" className="w-full">
              Take it down now
            </Button>
            <p className="text-xs text-muted-foreground">
              It leaves the album at once. The report stays open until you write
              the record.
            </p>
          </div>
        </Card>
        {/* The other two, collapsed: "3 open" at the head has to be three
            reports on the page, or the picture contradicts its own count.
            The first capture pass drew two. */}
        {OPEN_REPORTS.slice(1).map((next) => (
          <Card key={next.id}>
            <div className="flex gap-3 px-4 py-3">
              {next.media ? (
                <Shot row={next} size={56} className="rounded" />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded border border-dashed text-[10px] text-muted-foreground">
                  Album
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm">{next.reason ?? next.event}</p>
                <p className="text-xs text-muted-foreground">{next.when}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );

  // THE WHOLE ACT AT 375: both verbs, the note, and the hold door, in a column.
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">3 open</p>
        <StateChip level="open">Needs you</StateChip>
      </div>
      <Card className="overflow-hidden py-0">
        <Shot row={row} size="fill" className="rounded-none" />
        <div className="space-y-3 px-4 py-4">
          <p className="text-sm">{row.reason}</p>
          <Meta row={row} />
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground">
            <Copy className="size-3" />
            <span className="truncate tabular-nums">{row.media?.id}</span>
          </div>
          <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
            Why, in one line
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline">
              Dismiss
            </Button>
            <Button type="button" variant="destructive">
              Remove
            </Button>
          </div>
          <Button type="button" variant="ghost" className="w-full">
            <ShieldAlert className="size-4" />
            Hold for forensics
          </Button>
        </div>
      </Card>
    </div>
  );
}

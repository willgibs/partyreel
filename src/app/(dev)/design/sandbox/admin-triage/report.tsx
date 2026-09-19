"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { Copy, Play, ShieldAlert, Undo2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  CLOSED_REPORTS,
  frameOf,
  OPEN_REPORTS,
  REPORTS,
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

export type LookShape = "card" | "frame" | "split";
export type ReasonShape = "same" | "quiet" | "last";
export type VerdictShape = "two" | "note" | "required";
export type ClosedShape = "card" | "line" | "undo";

export const lookOf = (v: string | undefined): LookShape =>
  v === "card" || v === "frame" || v === "split" ? v : "split";
export const reasonOf = (v: string | undefined): ReasonShape =>
  v === "same" || v === "quiet" || v === "last" ? v : "quiet";
export const verdictOf = (v: string | undefined): VerdictShape =>
  v === "two" || v === "note" || v === "required" ? v : "required";
export const closedOf = (v: string | undefined): ClosedShape =>
  v === "card" || v === "line" || v === "undo" ? v : "undo";

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
        size === "row" &&
          "aspect-[3/2] w-full sm:aspect-square sm:w-[200px] sm:shrink-0",
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
 * The reason, three ways. `same` is today: a sentence saying nothing was said,
 * at the size of a sentence that was. `quiet` draws nothing at all, so a
 * wordless report is visibly shorter than one somebody wrote.
 */
function Reason({ row, shape }: { row: ReportRow; shape: ReasonShape }) {
  if (row.reason) return <p className="text-sm">{row.reason}</p>;
  if (shape === "quiet") return null;
  if (shape === "last")
    return (
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Nothing said.</span> Ranked
        under every report that carries a sentence.
      </p>
    );
  return <p className="text-sm text-muted-foreground">No reason provided.</p>;
}

/* ── The verdict, three ways ─────────────────────────────────────────────── */

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

  if (shape === "required" && acting)
    return (
      <div className="w-full space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Why, in one line. It is the record.
        </label>
        <div className="rounded-md border bg-background px-3 py-2 text-sm">
          Child in frame, reporter is the parent. Removed, host not contacted.
          <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-foreground align-text-bottom" />
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="destructive" size="sm">
            {remove}
          </Button>
          <Button type="button" variant="ghost" size="sm">
            Cancel
          </Button>
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
      {shape === "required" ? (
        <span className="text-xs text-muted-foreground">
          Either one asks for a line first.
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

  // TODAY, exactly: the event's name is the title, the badge is a `Badge`, the
  // reported frame is a 160 px square under a timestamp, and the reason is body
  // text beneath it. Redrawn rather than imported for the module-scope action.
  if (look === "card")
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold">{row.event}</h3>
            <Badge variant="default">Open</Badge>
          </div>
          <Meta row={row} />
        </CardHeader>
        <CardContent className="space-y-3">
          <Shot row={row} size={160} />
          <Reason row={row} shape={reason} />
          {hold}
        </CardContent>
        <CardFooter>
          <VerdictBar row={row} shape={verdict} acting={acting} />
        </CardFooter>
      </Card>
    );

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
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:gap-5">
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

/* ── A closed report, three ways ─────────────────────────────────────────── */

function ClosedReport({
  row,
  shape,
  look,
}: {
  row: ReportRow;
  shape: ClosedShape;
  look: LookShape;
}) {
  // TODAY: the same full card as an open one, forever, minus its buttons.
  if (shape === "card")
    return (
      <Card data-tri-closed>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold">{row.event}</h3>
            <StatusChip row={row} />
          </div>
          <Meta row={row} />
        </CardHeader>
        <CardContent className="space-y-3">
          {row.media ? <Shot row={row} size={look === "card" ? 160 : 200} /> : null}
          <p className="text-sm">{row.reason ?? "No reason provided."}</p>
          <p className="text-xs text-muted-foreground">
            Resolved {row.resolved?.when} by {row.resolved?.by}
          </p>
        </CardContent>
      </Card>
    );

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
      <span className="hidden w-44 shrink-0 truncate text-right text-xs text-muted-foreground lg:inline">
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
  reason = "same",
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
      {shape === "card" ? (
        <div className="space-y-4">
          {REPORTS.map((row) =>
            row.status === "open" ? (
              <OpenReport
                key={row.id}
                row={row}
                world={{ look, reason: "same", verdict: "two" }}
              />
            ) : (
              <ClosedReport key={row.id} row={row} shape={shape} look={look} />
            ),
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            {OPEN_REPORTS.map((row) => (
              <OpenReport
                key={row.id}
                row={row}
                world={{ look, reason: "same", verdict: "two" }}
              />
            ))}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Closed
            </p>
            <div className="rounded-xl border bg-card">
              {CLOSED_REPORTS.map((row) => (
                <ClosedReport
                  key={row.id}
                  row={row}
                  shape={shape}
                  look={look}
                />
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
      )}
    </>
  );
}

/* ── The same act in a hand ──────────────────────────────────────────────── */

export type PhoneShape = "none" | "act" | "all";

export const phoneOf = (v: string | undefined): PhoneShape =>
  v === "none" || v === "act" || v === "all" ? v : "act";

export function PhoneQueue({
  shape,
  look,
}: {
  shape: PhoneShape;
  look: LookShape;
}) {
  const row = OPEN_REPORTS[0];

  // NOTHING TODAY: the laptop surface at 375, which is what an operator opening
  // this on a phone actually meets. The 200 px frame of the row shape has no
  // room beside the words, so the card wraps and the verbs land at its foot.
  if (shape === "none")
    return (
      <>
        <Filters active="open" />
        <div className="space-y-4">
          {OPEN_REPORTS.map((r) => (
            <OpenReport
              key={r.id}
              row={r}
              world={{ look, reason: "same", verdict: "two" }}
            />
          ))}
        </div>
      </>
    );

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

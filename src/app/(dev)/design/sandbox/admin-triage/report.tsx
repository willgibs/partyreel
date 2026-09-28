"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Copy, Play, ShieldAlert, Undo2, X } from "lucide-react";

import { GALLERY_UNIFORM_COLUMNS } from "@/components/shared/masonry";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GLASS, GLASS_BEHIND, GLASS_MARK } from "@/lib/glass";
import { UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { cn } from "@/lib/utils";

import {
  CLOSED_REPORTS,
  frameOf,
  OPEN_PEOPLE,
  OPEN_REPORTS,
  type PersonReportRow,
  type ReportRow,
  type ReportStatus,
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

/**
 * Each of the four gained a genuine third (boards refresh, 2026-09-24), and the
 * production refresh (2026-09-28) redrew three of them on what ships: `grid` is
 * the host's review queue's grammar now (`host-curation`'s `queue=uniform`,
 * `peek=verdict`, `keys=arrows`: 4:5 tiles, the verdict on a peek), `marked` is
 * what `ReportCard` has printed all along (a muted "No reason provided." in
 * place, so it is today), and `note` and `always` send Remove through the
 * portal's one confirm carrying its line. `window` is a longer `undo` (the
 * product's own 30-day window, not a second admin clock), untouched.
 */
export type LookShape = "frame" | "split" | "grid";
export type ReasonShape = "last" | "chrono" | "marked";
export type VerdictShape = "two" | "note" | "always";
export type ClosedShape = "line" | "undo" | "window";

export const lookOf = (v: string | undefined): LookShape =>
  v === "frame" ? v : v === "grid" ? v : "split";
export const reasonOf = (v: string | undefined): ReasonShape =>
  v === "last" ? v : v === "marked" ? v : "chrono";
export const verdictOf = (v: string | undefined): VerdictShape =>
  v === "two" ? v : v === "always" ? v : "note";
export const closedOf = (v: string | undefined): ClosedShape =>
  v === "line" ? v : v === "window" ? v : "undo";

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

function StatusChip({ row }: { row: { status: ReportStatus } }) {
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
 * What a wordless report prints in its place TODAY, word for word
 * (`ReportCard`, since 734133d9): muted, in time order. The board drew a blank
 * here as "today" until the production refresh read the card.
 */
export const NO_REASON = "No reason provided.";

/**
 * The reason, three ways. No answer fakes a sentence where none was typed.
 * `marked` is today: `ReportCard`'s muted line, in place, the queue's order
 * untouched. `chrono` draws nothing at all, as app-shape r2's absent-never-
 * hollow rule would, keeping the place. `last` draws one small line saying why
 * the report sank to the foot, a status note rather than a stand-in reason.
 */
function Reason({ row, shape }: { row: ReportRow; shape: ReasonShape }) {
  if (row.reason) return <p className="text-sm">{row.reason}</p>;
  if (shape === "last")
    return (
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Nothing said.</span>{" "}
        Ranked under every report that carries a sentence.
      </p>
    );
  if (shape === "marked")
    return <p className="text-sm text-muted-foreground">{NO_REASON}</p>;
  return null;
}

/* ── The verdict ─────────────────────────────────────────────────────────── */

/**
 * The two verbs on a card. `two` is today's pair and nothing else, pressed
 * once each. Under `note` and `always` Dismiss gains its line beside the pair
 * (optional or required) and Remove's own line lives in the portal's confirm,
 * which the verdict step draws open over the queue (`ConfirmLook`).
 */
function VerdictBar({
  remove,
  shape,
}: {
  /** The destructive verb's words, which differ by what the report names. */
  remove: string;
  shape: VerdictShape;
}) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm">
        Dismiss
      </Button>
      <Button type="button" variant="destructive" size="sm">
        {remove}
      </Button>
      {shape === "two" ? null : (
        <span className="text-xs text-muted-foreground underline underline-offset-4">
          {shape === "always" ? "Add a note (required)" : "Add a note"}
        </span>
      )}
    </div>
  );
}

const removeOf = (row: ReportRow) =>
  row.media ? "Remove item and action" : "Action";

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
};

export function OpenReport({
  row,
  world,
}: {
  row: ReportRow;
  world: CardWorld;
}) {
  const { look, reason, verdict, escalate } = world;
  const hold = escalate?.(row) ?? null;

  // THE PICTURE FIRST: the reported frame takes the card's whole width and the
  // words sit under it, which is the shape of every product whose operator is
  // judging an image rather than reading a ticket.
  if (look === "frame")
    return (
      <Card
        data-tri-report="item"
        data-tri-wordless={row.reason ? undefined : ""}
        className="overflow-hidden py-0"
      >
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
          <VerdictBar remove={removeOf(row)} shape={verdict} />
        </div>
      </Card>
    );

  // THE PICTURE BESIDE THE REASON: one row per report, the frame at 200 px on
  // the left, the words and the verdict on the right. An album report with no
  // frame keeps the row and gives the words the whole width.
  return (
    <Card
      data-tri-report="item"
      data-tri-wordless={row.reason ? undefined : ""}
    >
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
          <VerdictBar remove={removeOf(row)} shape={verdict} />
        </div>
      </div>
    </Card>
  );
}

/* ── A closed report, three ways ─────────────────────────────────────────── */

/**
 * `window` (boards refresh, 2026-09-24): the same Undo, but for as long as the
 * removed item would exist anyway. `lifecycle-recovery.md`'s own 30-day Trash
 * is the real number; the fixture's four closed reports are dated so it and
 * `undo`'s 24 hours pick out different rows, never the same one.
 */
const UNDO_WINDOW_DAYS = { undo: 1, window: 30 } as const;

/** Days since `resolved.when`, read off the fixture's own dated strings. */
function daysSinceResolved(row: ReportRow): number | null {
  if (!row.resolved) return null;
  if (row.when.startsWith("Tonight") || row.when.startsWith("Yesterday"))
    return row.when.startsWith("Tonight") ? 0 : 1;
  // "15 September, 09:10" / "8 September, 23:37" against today, 24 September.
  const day = Number(row.resolved.when.match(/^(\d+)/)?.[1]);
  if (!day) return null;
  return 24 - day;
}

function ClosedReport({ row, shape }: { row: ReportRow; shape: ClosedShape }) {
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
      {shape === "undo" || shape === "window" ? (
        row.held ? (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <ShieldAlert className="size-3.5" />
            Held
          </span>
        ) : row.status === "actioned" &&
          (daysSinceResolved(row) ?? Infinity) <= UNDO_WINDOW_DAYS[shape] ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
          >
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

/* ── A report about a person ─────────────────────────────────────────────── */

/**
 * THE PEOPLE SECTION'S CARD (`PersonReportList`), listed FIRST whenever one is
 * open. A person has no frame to lead with in any shape, so it is the same card
 * under all three: the name, the handle the page links to the live profile, the
 * reason (or that arm's own "No reason given."), when, and two verbs. "Mark
 * actioned" removes nothing: a person is actioned out of band, so marking one
 * only closes the report, and it never opens the confirm.
 */
function PersonReport({
  row,
  verdict,
}: {
  row: PersonReportRow;
  verdict: VerdictShape;
}) {
  return (
    <Card data-tri-report="person">
      <div className="flex flex-col gap-3 px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {row.name}{" "}
              <span className="font-normal text-muted-foreground underline underline-offset-4">
                {row.slug ? `@${row.slug}` : "No public handle"}
              </span>
            </p>
            <p className="mt-1.5 text-sm">{row.reason ?? "No reason given."}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {row.when} · person reported
            </p>
          </div>
          <StatusChip row={row} />
        </div>
        <VerdictBar remove="Mark actioned" shape={verdict} />
      </div>
    </Card>
  );
}

/** A section of the page under its label, exactly as `/admin/reports` heads one. */
function Section({
  label,
  children,
}: {
  label: string | null;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      {label ? (
        <h2>
          <span className="text-label font-semibold text-muted-foreground uppercase">
            {label}
          </span>
        </h2>
      ) : null}
      {children}
    </section>
  );
}

/* ── The grid, in the review queue's grammar ─────────────────────────────── */

/**
 * `look=grid`, REDRAWN IN THE HOST'S REVIEW QUEUE'S GRAMMAR (the production
 * refresh, 2026-09-28), so split and grid are judged against the product's
 * other picture queue as Will picked it: `queue=uniform` (every item the same
 * 4:5 box, on the review grid's own columns), `peek=verdict` (a tap opens it
 * large on the lightbox's ground with the verdict ON it) and `keys=arrows` (the
 * arrows step and Escape closes, with no hint row saying so). A report carries
 * what an upload never does, a sentence, so the peek's foot carries the words
 * above the verdict, on an opaque panel (glass is media chrome, never a panel).
 *
 * ★ DRAWN BOTH WAYS, AND REALLY BOUND. The peek's ground is the album blurred
 * at half brightness, so a peek drawn open hides the very queue the option is
 * about, and a grid drawn shut hides the verdict. So `look` draws two frames,
 * the queue and a tap on it (`peekOn`), and a step whose question lives on the
 * peek (the verdict, a wordless report's line) opens it on the report it is
 * about. Inside a frame it is live either way: close it, tap a tile to open
 * that one, and the arrows step. The frame's own window listens, never the lab
 * page's, so no key on the board moves it.
 */
function ReportGrid({
  rows,
  world,
  peekOn,
}: {
  rows: ReportRow[];
  world: CardWorld;
  /** The report the peek opens on, or null for the queue at rest. */
  peekOn: string | null;
}) {
  const grid = useRef<HTMLDivElement | null>(null);
  const [at, setAt] = useState(() =>
    Math.max(
      0,
      rows.findIndex((r) => r.id === peekOn),
    ),
  );
  const [open, setOpen] = useState(peekOn !== null);
  const last = rows.length - 1;

  useEffect(() => {
    const el = grid.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    // Left and right step one report, on the grid and on the peek alike; up
    // and down step a row of the grid's own columns, and nothing on the peek.
    const across = () =>
      win.getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean)
        .length || 1;
    // A step past either end stays put, as a grid's own keys do.
    const step = (by: number) =>
      setAt((i) => (i + by >= 0 && i + by <= last ? i + by : i));
    const onKey = (e: KeyboardEvent) => {
      const peeking = Boolean(win.document.querySelector("[data-tri-peek]"));
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowDown" && !peeking) step(across());
      else if (e.key === "ArrowUp" && !peeking) step(-across());
      else if (e.key === "Enter") setOpen(true);
      else if (e.key === "Escape") setOpen(false);
      else return;
      e.preventDefault();
    };
    win.addEventListener("keydown", onKey);
    return () => win.removeEventListener("keydown", onKey);
  }, [last]);

  const active = rows[Math.min(at, last)];
  return (
    <div>
      <div ref={grid} className={GALLERY_UNIFORM_COLUMNS}>
        {rows.map((row, i) => {
          const still = frameOf(row);
          return (
            <button
              key={row.id}
              type="button"
              data-tri-tile
              aria-label={`Open the report on ${row.event}`}
              onClick={() => {
                setAt(i);
                setOpen(true);
              }}
              style={{ aspectRatio: UNIFORM_TILE_ASPECT }}
              className={cn(
                "relative w-full overflow-hidden rounded-tile bg-muted text-left outline-2 -outline-offset-2",
                i === at ? "outline-foreground" : "outline-transparent",
              )}
            >
              {still ? (
                // eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a presigned original
                <img
                  src={still.src}
                  alt=""
                  className="size-full object-cover"
                  draggable={false}
                />
              ) : (
                // An album report names no frame: its tile is its album.
                <span className="flex size-full flex-col justify-end gap-1 p-3">
                  <span className="text-xs text-muted-foreground">
                    Album reported
                  </span>
                  <span className="text-sm font-medium">{row.event}</span>
                </span>
              )}
              {row.media?.type === "video" ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white",
                    GLASS_MARK,
                  )}
                >
                  <Play className="size-4 translate-x-px fill-current" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {open ? (
        <Peek row={active} world={world} onClose={() => setOpen(false)} />
      ) : null}
    </div>
  );
}

/** The peek: the report large on the lightbox's ground, the words and the verdict at its foot. */
function Peek({
  row,
  world,
  onClose,
}: {
  row: ReportRow;
  world: CardWorld;
  onClose: () => void;
}) {
  const still = frameOf(row);
  return (
    <div data-tri-peek className="tri-peek">
      {/* The ground on its own element, never an ancestor of the photograph
          (`GLASS_BEHIND`'s rule). */}
      <div aria-hidden className={cn("tri-peek-ground", GLASS_BEHIND)} />
      <div className="tri-peek-stage">
        {still ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a presigned original
          <img
            data-tri-peek-frame
            src={still.src}
            alt=""
            className="max-h-full max-w-full rounded-md object-contain"
            draggable={false}
          />
        ) : (
          <div
            data-tri-peek-frame
            className="flex h-full max-h-80 flex-col items-center justify-center gap-2 rounded-md bg-muted px-10 text-center"
            style={{ aspectRatio: UNIFORM_TILE_ASPECT }}
          >
            <span className="text-xs text-muted-foreground">
              The whole album was reported
            </span>
            <span className="text-base font-medium">{row.event}</span>
          </div>
        )}
        {/* A video's still carries the tile's own play mark: the real peek
            plays it, and a still with no mark would pass for a photograph. */}
        {row.media?.type === "video" ? (
          <span
            aria-hidden
            className={cn(
              "absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white",
              GLASS_MARK,
            )}
          >
            <Play className="size-5 translate-x-px fill-current" />
          </span>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={cn(
          "absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-white",
          GLASS,
        )}
      >
        <X className="size-5" />
      </button>
      <div className="tri-peek-foot">
        <div className="w-full max-w-xl rounded-float bg-popover p-4 text-popover-foreground shadow-layer ring-1 ring-foreground/10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Reason row={row} shape={world.reason} />
              <Meta row={row} className="mt-1.5" />
            </div>
            <StatusChip row={row} />
          </div>
          <div className="mt-3">
            <VerdictBar remove={removeOf(row)} shape={world.verdict} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReportsSurface({
  world,
  reason = "chrono",
  /**
   * Draw one report rather than the queue. The escalate decision needs the
   * report and the surface the hold is set on to be on one screen, and three
   * reports push the second one 1,100 px down a 900 px page.
   */
  only,
  /**
   * Draw the People section first, as the page does whenever a person report
   * is open. The refreshed steps draw it; `closed`, `idiom` and `phone` keep
   * the night they were drawn with (see `PERSON_REPORTS`).
   */
  people = false,
  /** Under `look=grid`, the report whose peek is drawn open (null: the queue at rest). */
  peekOn = null,
  children,
}: {
  world: CardWorld;
  reason?: ReasonShape;
  only?: number;
  people?: boolean;
  peekOn?: string | null;
  children?: ReactNode;
}) {
  // The wordless report drops to the foot of the queue only under `last`; the
  // other two answers leave the newest-first order the query already has.
  const sorted =
    reason === "last"
      ? [...OPEN_REPORTS].sort((a, b) => Number(!a.reason) - Number(!b.reason))
      : OPEN_REPORTS;
  const queue = only === undefined ? sorted : [OPEN_REPORTS[only]];
  const withPeople = people && only === undefined && OPEN_PEOPLE.length > 0;

  // `only` draws one already-isolated report: `grid` has nothing to be a grid
  // of there, so it falls through to the same single card `escalate` and the
  // history's "still open" rows already use.
  const items =
    world.look === "grid" && only === undefined ? (
      <ReportGrid rows={queue} world={{ ...world, reason }} peekOn={peekOn} />
    ) : (
      <div className="space-y-4">
        {queue.map((row) => (
          <OpenReport key={row.id} row={row} world={{ ...world, reason }} />
        ))}
      </div>
    );

  if (!withPeople)
    return (
      <>
        <Filters active="open" />
        {children}
        {items}
      </>
    );

  // PEOPLE FIRST, as the page lists them: "a report about a person is about
  // somebody's conduct across the product, which outranks one photograph".
  return (
    <>
      <Filters active="open" />
      {children}
      <div className="space-y-6">
        <Section label="People">
          <div className="space-y-3">
            {OPEN_PEOPLE.map((row) => (
              <PersonReport key={row.id} row={row} verdict={world.verdict} />
            ))}
          </div>
        </Section>
        <Section label="Albums and items">{items}</Section>
      </div>
    </>
  );
}

/**
 * ★ THE REASON STEP IS SCROLLED TO ITS SUBJECT, ONCE, ON MOUNT (the production
 * refresh). The People section now leads the queue, which pushed the one
 * wordless report to the fold at 1440 by 900: the three answers differed in a
 * strip at the foot of the frame, and `lab:demo` measured them 1.4 percent
 * apart. So the frame starts with that report on screen, where an operator
 * reading down the queue meets it anyway, with what sits above it in view. A
 * grid has no card to scroll to (its words are on the peek), so it stays put.
 */
export function ScrollToWordless() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const run = () => {
      const target = el.ownerDocument.querySelector<HTMLElement>(
        "[data-tri-wordless]",
      );
      if (!target) return;
      const top =
        target.getBoundingClientRect().top +
        win.scrollY -
        win.innerHeight * 0.4;
      win.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    };
    // The same three passes as the history's: the layout, the photographs
    // decoding, and the board's own late reading.
    const late = [400, 1200, 2100].map((ms) => win.setTimeout(run, ms));
    return () => late.forEach((t) => win.clearTimeout(t));
  }, []);
  return <div ref={ref} aria-hidden />;
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
          {shape === "undo" || shape === "window" ? (
            <p className="mt-2 text-xs text-muted-foreground">
              An Undo restores the item and reopens the report
              {shape === "undo"
                ? " for a day"
                : " for as long as a removed item would exist anyway, the product's own 30-day Trash"}
              . A held item has no Undo: only Forensics releases a hold.
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ── The same act in a hand ──────────────────────────────────────────────── */

/**
 * `hold` (boards refresh, 2026-09-24): `act`'s one verb, plus a way to start a
 * legal hold before the moment passes. Not "typed with a thumb" like `all`: the
 * hold opens untyped, and only its note waits for a desk, because evidence a
 * party keeps deleting cannot always wait until morning either.
 */
export type PhoneShape = "act" | "all" | "hold";

export const phoneOf = (v: string | undefined): PhoneShape =>
  v === "all" ? v : v === "hold" ? v : "act";

export function PhoneQueue({ shape }: { shape: PhoneShape }) {
  const row = OPEN_REPORTS[0];

  // SEE IT AND STOP IT (`hold` shares this half): the frame, the reason, and
  // the one verb that cannot wait. The report stays open until the record is
  // written on a laptop, which is the honest cost of taking a photograph down
  // from a party.
  if (shape === "act" || shape === "hold")
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
            {shape === "hold" ? (
              <Button type="button" variant="outline" className="w-full">
                <ShieldAlert className="size-4" />
                Preserve for the record
              </Button>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {shape === "hold"
                ? "Preserve opens the hold now, untyped. Its note, and the rest of the runbook, wait for a desk."
                : "It leaves the album at once. The report stays open until you write the record."}
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

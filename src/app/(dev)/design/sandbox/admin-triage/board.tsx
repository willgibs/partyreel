"use client";

import "./admin-triage.css";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { ConfirmLook } from "./confirm";
import {
  escalateOf,
  type EscalateShape,
  ForensicsPanel,
  HoldSheet,
  IdStrip,
} from "./escalate";
import {
  type NavEntry,
  OPEN_REPORTS,
  REPORTS_SURFACE,
  SUPPORT_SURFACE,
  WITH_PEOPLE,
} from "./fixtures";
import { Inboxes, idiomOf, type IdiomShape } from "./inboxes";
import { noticeOf, type NoticeShape, WhoIsTold } from "./notice";
import {
  type ClosedShape,
  closedOf,
  HistorySurface,
  type LookShape,
  lookOf,
  type PhoneShape,
  phoneOf,
  PhoneQueue,
  type ReasonShape,
  reasonOf,
  ReportsSurface,
  ScrollToWordless,
  type VerdictShape,
  verdictOf,
} from "./report";
import { type Counts, Portal, PhonePortal, SurfaceHead } from "./shell";
import { ADMIN_TRIAGE } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the operator's portal on one
 * Saturday night, with exactly one axis moved.
 *
 * ★ ONE NIGHT, EIGHT DECISIONS, EIGHT AXES. Each preview reads the board's live
 * state and overrides only its own axis, so a verdict is judged on the card
 * shape he picked, a closed report is judged on the verdict he picked, and
 * going back to an earlier question redraws it in the world he chose rather
 * than the one the board assumed. A staged decision wears its parent's answer,
 * and before he answers the parent it wears the parent's recommendation, which
 * is what `defineExploration` puts in the mirrored control's default.
 *
 * ★ 1440 BY 900 IS A LAPTOP AND THE FOLD IS REAL. An operator is at a desk, and
 * half of what these decisions decide is how much of a night fits on one
 * screen: six full cards do not, three rows and a log do. A frame taller than
 * the screen would answer that by cheating, so every desk frame is a real
 * viewport that scrolls inside itself exactly as the page will. 375 is on the
 * knob everywhere but `phone`, which ignores it and is always a phone.
 *
 * ★ AND THE NUMBERS UNDER EVERY FRAME ARE MEASURED, NEVER COMPUTED. A board
 * once drew an option with its formula's sign backwards and the tile Will
 * judged showed the opposite of its words (docs/PROGRAM.md). So each caption
 * reads the laid-out DOM inside the frame's own document once it settles: how
 * big the reported frame really is in CSS pixels, how tall one report really
 * stands, how much of the screen the open queue really covers, how many status
 * words are really on the page. If the words above a frame and the caption
 * under it disagree, the caption is the truth.
 */

/* ── The measurement ─────────────────────────────────────────────────────── */

type Reader = (root: HTMLElement, win: Window) => string | null;

/**
 * Reads one fact out of the frame's own document.
 *
 * ★ THE OBSERVER IS THE FRAME'S, NOT THE LAB PAGE'S. The subtree lives in the
 * iframe's document, so it is observed with THAT window's `ResizeObserver`: it
 * fires when the copied stylesheets land (the first layout is unstyled) and
 * again whenever a new option reflows the page. A hidden option on the stage is
 * `visibility: hidden`, which keeps its layout, so it measures true as well.
 * The late pass covers the one thing an observer cannot see: photographs
 * decoding at their natural heights inside columns that never changed width.
 */
function Probe({
  read,
  onRead,
  children,
}: {
  read: Reader;
  onRead: (s: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // The latest reader and reporter, refreshed AFTER each commit: writing a ref
  // in the render body is what the compiler's rule refuses, and the observer
  // below must not be torn down and rebuilt on every render.
  const latest = useRef({ read, onRead });
  useEffect(() => {
    latest.current = { read, onRead };
  });

  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView as
      | (Window & typeof globalThis)
      | null
      | undefined;
    if (!el || !win) return;
    const run = () => {
      const said = latest.current.read(el, win);
      if (said) latest.current.onRead(said);
    };
    run();
    const ro = new win.ResizeObserver(run);
    ro.observe(el);
    const late = [700, 1500].map((ms) => win.setTimeout(run, ms));
    return () => {
      ro.disconnect();
      late.forEach((t) => win.clearTimeout(t));
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

const pct = (n: number, of: number) => Math.round((n / of) * 100);

/**
 * The frame, the card and the queue, as the browser actually laid them out.
 *
 * ★ "ONE REPORT" IS THE FIRST PICTURE REPORT, NOT THE FIRST CARD. Since the
 * refresh the People section leads the refreshed steps, and a person's card
 * has no frame: measured as "one report" it would describe the one card that
 * is not what the question is about. So the refreshed cards carry
 * `data-tri-report` (the item cards `item`), every one of them counts toward
 * the screen's share, and a surface without them (the phone's own cards) is
 * read exactly as before.
 */
const queueRead: Reader = (root, win) => {
  const shot = root.querySelector<HTMLElement>("[data-tri-frame]");
  const tagged = root.querySelectorAll<HTMLElement>("[data-tri-report]");
  const cards =
    tagged.length > 0
      ? tagged
      : root.querySelectorAll<HTMLElement>("[data-slot='card']");
  if (cards.length === 0) return null;
  const lead =
    root.querySelector<HTMLElement>("[data-tri-report='item']") ?? cards[0];
  const first = Math.round(lead.getBoundingClientRect().height);
  if (first < 8) return null;
  const edge = shot ? Math.round(shot.getBoundingClientRect().width) : null;
  // How much of the screen the reports themselves take, clipped to the viewport:
  // a card below the fold is a card the operator has not seen.
  let area = 0;
  cards.forEach((el) => {
    const b = el.getBoundingClientRect();
    const w = Math.max(
      0,
      Math.min(b.right, win.innerWidth) - Math.max(b.left, 0),
    );
    const h = Math.max(
      0,
      Math.min(b.bottom, win.innerHeight) - Math.max(b.top, 0),
    );
    area += w * h;
  });
  const share = pct(area, win.innerWidth * win.innerHeight);
  return `Measured: ${edge ? `the reported frame is ${edge} px wide, ` : "no frame on this one, "}one report stands ${first} px, and the reports on screen cover ${share} percent of it.`;
};

/**
 * The grid in the review queue's grammar: how big a tile really is, how many
 * the grid's own columns fit across, and how wide the peek really draws the
 * report being judged.
 */
const gridRead: Reader = (root, win) => {
  const tiles = root.querySelectorAll<HTMLElement>("[data-tri-tile]");
  if (tiles.length === 0) return null;
  const tile = tiles[0].getBoundingClientRect();
  if (tile.height < 8) return null;
  const grid = tiles[0].parentElement;
  const across = grid
    ? win.getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean)
        .length
    : 0;
  const peek = root.querySelector<HTMLElement>("[data-tri-peek-frame]");
  const edge = peek ? Math.round(peek.getBoundingClientRect().width) : null;
  return `Measured: a tile is ${Math.round(tile.width)} by ${Math.round(tile.height)} px, ${across} fit across, and ${edge ? `the peek draws the report ${edge} px wide` : "the peek is closed"}.`;
};

/** What an answered report costs the page, once the history is on screen. */
const historyRead: Reader = (root, win) => {
  const rows = root.querySelectorAll<HTMLElement>("[data-tri-closed]");
  if (rows.length === 0) return null;
  let tall = 0;
  let seen = 0;
  rows.forEach((el) => {
    const b = el.getBoundingClientRect();
    tall += Math.round(b.height);
    if (b.top < win.innerHeight && b.bottom > 0) seen += 1;
  });
  if (tall < 8) return null;
  return `Measured: ${rows.length} answered reports stand ${tall} px in all, and ${seen} of the ${rows.length} are on this screen at once.`;
};

/**
 * How many filter bars and how many SHAPES of status control one operator meets
 * at once. The first draft of this reader counted every `nav span` on the page
 * and reported 41 filter tabs, because the rail is a nav too; it also counted
 * distinct status WORDS, which makes the shared control look worse than today
 * (three surfaces spelling one thing badly use fewer words than three spelling
 * their own things well). The finding was never the vocabulary size. It is how
 * many different controls do one job.
 */
const idiomRead: Reader = (root) => {
  const bars = root.querySelectorAll<HTMLElement>("[data-tri-tabs]").length;
  const shapes = new Set<string>();
  root
    .querySelectorAll<HTMLElement>("[data-tri-control]")
    .forEach((el) => shapes.add(el.dataset.triControl ?? ""));
  if (bars === 0) return null;
  return `Measured: ${bars} filter bar${bars === 1 ? "" : "s"} and ${shapes.size} shape${shapes.size === 1 ? "" : "s"} of status control on one screen.`;
};

/* ── The stage ───────────────────────────────────────────────────────────── */

type Size = "1440" | "375";

const sizeOf = (v: string | undefined): Size => (v === "375" ? "375" : "1440");

const BOX: Record<Size, { w: number; h: number }> = {
  "1440": { w: 1440, h: 900 },
  "375": { w: 375, h: 812 },
};

/** One picture: a real viewport, the settled portal, one axis moved. */
function Screen({
  id,
  size,
  caption,
  read,
  label,
  children,
}: {
  id: string;
  size: Size;
  caption: string;
  /** A reader whose measured line replaces the caption once it has one. */
  read?: Reader;
  /** Which of an option's two frames this is, after its size. */
  label?: string;
  children: ReactNode;
}) {
  const [said, setSaid] = useState<string | null>(null);
  const { w, h } = BOX[size];
  return (
    <Frame
      id={`triage-${id}`}
      w={w}
      h={h}
      title={label ? `${w} x ${h}, ${label}` : `${w} x ${h}`}
      caption={said ? `${caption} ${said}` : caption}
    >
      {read ? (
        <Probe read={read} onRead={setSaid}>
          {children}
        </Probe>
      ) : (
        children
      )}
    </Frame>
  );
}

/* ── The world every preview reads ───────────────────────────────────────── */

type World = {
  size: Size;
  look: LookShape;
  reason: ReasonShape;
  verdict: VerdictShape;
  closed: ClosedShape;
  escalate: EscalateShape;
  phone: PhoneShape;
  idiom: IdiomShape;
  notice: NoticeShape;
};

const worldOf = (s: BoardState, over: Partial<World> = {}): World => ({
  size: sizeOf(s.screen),
  look: lookOf(s.look),
  reason: reasonOf(s.reason),
  verdict: verdictOf(s.verdict),
  closed: closedOf(s.closed),
  escalate: escalateOf(s.escalate),
  phone: phoneOf(s.phone),
  idiom: idiomOf(s.idiom),
  notice: noticeOf(s.notice),
  ...over,
});

/**
 * ★ TWO AXES STAY AT TODAY'S VALUE EVERYWHERE BUT ON THEIR OWN QUESTION.
 * `reason` and `verdict` are both drawn on every report on this board, so
 * letting them follow the board's live state would answer them quietly on six
 * other steps: the first capture pass had a verdict hint meant for one shape
 * bleeding onto the step about a different one, which is the recommended
 * answer to a question he had not been asked. They are independent roots, not
 * ancestors, so on anyone else's step they draw as today. Every other axis
 * follows the live state, which is what makes a staged decision wear its
 * parent's answer. (`guest-upload` pinned its `words` axis for the same
 * reason.)
 *
 * ★ AND TODAY IS WHAT THE CARD PRINTS, NOT WHAT A SPEC SAID OF IT. Until the
 * production refresh (2026-09-28) `reason` was pinned to `chrono`, a blank,
 * because the ask said a wordless report draws nothing; `ReportCard` has
 * printed a muted "No reason provided." in place since 734133d9, which is
 * `marked`. Every step drew a report the product never showed.
 */
const TODAY = { reason: "marked", verdict: "two" } as const;

/**
 * ★ AT 375 THE BOARD COLLAPSES THE RAIL, AND THAT IS NOT AN ANSWER TO ANYTHING.
 * The shipped portal keeps its 232 px rail at `lg` and a dropdown below it, so
 * the desk surface drawn with its rail at 375 leaves a 143 px column and every
 * one of these questions becomes the same unreadable picture. The first 375
 * capture pass was seven copies of that. What the PORTAL does at a phone is
 * this board's `phone` decision, so everywhere else the knob collapses it, and
 * the question stays about the content it was asking about.
 */
function Surface({
  size,
  active,
  counts,
  children,
}: {
  size: Size;
  active: NavEntry;
  /** The step's own open-report count (the refreshed steps count a person). */
  counts?: Counts;
  children: ReactNode;
}) {
  if (size === "375")
    return <PhonePortal active={active}>{children}</PhonePortal>;
  return (
    <Portal active={active} counts={counts}>
      {children}
    </Portal>
  );
}

/** The page's own line, word for word (`/admin/reports`). */
const REPORTS_LEDE =
  "Guest-submitted reports. Actioning an item removes it; the purge cron reclaims its storage afterward. A reported person is actioned out of band, so marking one handled only closes the report. Resolved reports are read-only.";

/**
 * The reports surface, which is where six of the eight decisions live.
 * `counts` is set by the refreshed steps, which draw the People section and
 * count its report; `closed` passes none and keeps the rail it was drawn with.
 */
function reportsScreen(
  id: string,
  w: World,
  caption: string,
  body: ReactNode,
  lede = REPORTS_LEDE,
  read: Reader = queueRead,
  counts?: Counts,
  label?: string,
) {
  return (
    <Screen id={id} size={w.size} caption={caption} read={read} label={label}>
      <Surface size={w.size} active={REPORTS_SURFACE} counts={counts}>
        <SurfaceHead title="Reports" lede={lede} />
        {body}
      </Surface>
    </Screen>
  );
}

/* ── The first look, and the two questions it unlocks ────────────────────── */

const LOOK_CAPTION: Record<LookShape, string> = {
  frame:
    "The reported frame at the card's full width, the sentence under it, the verdict beneath that; the person above it has no frame to lead with.",
  split:
    "One row each: the frame on the left at a size you can judge, the words and the verdict on the right, the reported person first as the page lists them.",
  grid: "The host's review queue's grammar: every report a 4:5 tile on the review grid's own columns, the reported person above as the page lists them, and no words until a tap.",
};

/** The grid's second frame: the tap its first one is waiting for. */
const GRID_PEEK_CAPTION =
  "A tap on the first: the peek, with its words and the verdict on it. Live in the frame: close it, tap another tile, or step with the arrows.";

/** A report the grid's peek opens on, for a step whose question lives there. */
const WORDLESS = OPEN_REPORTS.find((r) => !r.reason) ?? OPEN_REPORTS[0];

function lookScreen(v: LookShape, s: BoardState) {
  const w = worldOf(s, { look: v, ...TODAY });
  const screen = (peekOn: string | null, caption: string, label?: string) =>
    reportsScreen(
      peekOn ? `look-${v}-peek` : `look-${v}`,
      w,
      caption,
      <ReportsSurface
        world={{ look: v, reason: w.reason, verdict: w.verdict }}
        reason={w.reason}
        people
        peekOn={peekOn}
      />,
      REPORTS_LEDE,
      v === "grid" ? gridRead : queueRead,
      WITH_PEOPLE,
      label,
    );
  if (v !== "grid") return screen(null, LOOK_CAPTION[v]);
  // ★ TWO FRAMES FOR THE ONE SHAPE WHOSE VERDICT IS A TAP AWAY: the queue as
  // an operator scans it, and the peek it opens, because the peek's ground
  // hides the queue and the queue hides the verdict (`ReportGrid`).
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {screen(null, LOOK_CAPTION.grid, "the queue")}
      {screen(OPEN_REPORTS[0].id, GRID_PEEK_CAPTION, "a tap")}
    </div>
  );
}

const REASON_CAPTION: Record<ReasonShape, string> = {
  marked:
    "Today. The wordless report keeps its place and prints a muted 'No reason provided.' where the sentence would sit.",
  chrono:
    "Nothing drawn where the reason would be, and no reordering: the wordless report keeps its place and says nothing.",
  last: "The wordless report falls under both written ones and says why it is there.",
};

function reasonScreen(v: ReasonShape, s: BoardState) {
  const w = worldOf(s, { reason: v, verdict: TODAY.verdict });
  return reportsScreen(
    `reason-${v}`,
    w,
    REASON_CAPTION[v],
    <>
      <ScrollToWordless />
      <ReportsSurface
        world={{ look: w.look, reason: v, verdict: w.verdict }}
        reason={v}
        people
        // On the grid the words live on the peek, so it opens on the report
        // this question is about.
        peekOn={WORDLESS.id}
      />
    </>,
    REPORTS_LEDE,
    w.look === "grid" ? gridRead : queueRead,
    WITH_PEOPLE,
  );
}

const ESCALATE_CAPTION: Record<EscalateShape, string> = {
  retype:
    "Today. Nothing on a report is an id, and the form that needs one is two surfaces away.",
  copy: "The report reference and the media id on the card, and the same form with them pasted in.",
  door: "One control on the report itself, Hold for forensics, with a line saying what it does: no id to find, nothing to paste.",
};

/** The door's second frame: the confirm its control opens. */
const DOOR_OPEN_CAPTION =
  "A tap on it: the portal's own confirm, filled in from the report, saying what the hold touches, with its reason on the record.";

function escalateScreen(v: EscalateShape, s: BoardState) {
  const w = worldOf(s, { escalate: v, ...TODAY });
  const screen = (open: boolean, caption: string, label?: string) => (
    <Screen
      id={open ? `escalate-${v}-open` : `escalate-${v}`}
      size={w.size}
      caption={caption}
      read={queueRead}
      label={label}
    >
      {/* ★ THE SURFACE IS ALWAYS REPORTS. The first capture pass had the rail
          highlighting Forensics while the heading said Reports, because the
          forensics FORM is drawn here: an operator reading that picture would
          have been told they were on a page they were not on. The form below is
          an inset of the other surface and says so in its own head. */}
      <Surface size={w.size} active={REPORTS_SURFACE} counts={WITH_PEOPLE}>
        <SurfaceHead
          title="Reports"
          lede="A guest has reported a photograph of a child. The runbook says: remove it from live, then hold and preserve."
        />
        <div className="space-y-5">
          {/* One report, not the queue: the report and the surface the hold is
              set on have to be on one screen for the question to mean anything. */}
          <ReportsSurface
            world={{
              look: w.look,
              reason: w.reason,
              verdict: w.verdict,
              // Only a report that names an item can be held: an album report
              // has no media row to preserve.
              escalate: (row) =>
                row.media ? <IdStrip shape={v} row={row} /> : null,
            }}
            reason={w.reason}
            only={0}
          />
          {v === "door" ? null : <ForensicsPanel shape={v} />}
        </div>
      </Surface>
      {open ? <HoldSheet /> : null}
    </Screen>
  );
  if (v !== "door") return screen(false, ESCALATE_CAPTION[v]);
  // ★ TWO FRAMES FOR THE DOOR, as for the grid's peek: the portal's confirm is
  // a centred dialog over a blurred page, so the control on the report that
  // opens it would be behind the blur in the one picture that shows both.
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {screen(false, ESCALATE_CAPTION.door, "the report")}
      {screen(true, DOOR_OPEN_CAPTION, "a tap")}
    </div>
  );
}

/* ── The verdict, and what it leaves ─────────────────────────────────────── */

const VERDICT_CAPTION: Record<VerdictShape, string> = {
  two: "Today. One press each, nothing typed and no confirm: Remove acts at once with a toast, and the record is a status and a time.",
  note: "Remove opens the portal's one confirm, as Albums' Remove already does, with an optional note in it; Dismiss keeps one press, with Add a note beside it.",
  always:
    "The same confirm with the line required, and the verb waiting on it; Dismiss asks for its line the same way before it commits.",
};

/**
 * THE REMOVE, THROUGH THE PORTAL'S ONE CONFIRM, for the report being answered.
 * What it lists is what `actionReportAction` really does to an item report: a
 * soft removal stamped as an operator's (restorable from Albums until the one
 * 30-day window ends, `lifecycle-recovery.md`), and the report closed. The
 * note is the proposed prop; `always` requires it, so the verb waits.
 */
function RemoveConfirm({ required }: { required: boolean }) {
  const row = OPEN_REPORTS[0];
  return (
    <ConfirmLook
      title="Remove this photo?"
      lede="It leaves the album now, and the report closes as Actioned."
      touches={[
        `1 photo in ${row.event}`,
        "Restorable from Albums for 30 days, then the purge deletes it",
        "The report closes as Actioned, with the note on it",
      ]}
      verb="Remove"
      severity="reversible"
      note={
        required
          ? {
              label: "Note",
              required: true,
              placeholder: "Why, in one line",
              hint: "Nothing commits without it, Dismiss included. Only this portal reads it.",
            }
          : {
              label: "Note",
              required: false,
              value: "Child in frame; her parent asked.",
              placeholder: "Why, in one line",
              hint: "Kept on the report. Only this portal reads it.",
            }
      }
    />
  );
}

function verdictScreen(v: VerdictShape, s: BoardState) {
  const w = worldOf(s, { verdict: v, reason: TODAY.reason });
  return reportsScreen(
    `verdict-${v}`,
    w,
    VERDICT_CAPTION[v],
    <>
      <ReportsSurface
        world={{ look: w.look, reason: w.reason, verdict: v }}
        reason={w.reason}
        people
        // On the grid the verdict lives on the peek, open on the report the
        // confirm is about.
        peekOn={OPEN_REPORTS[0].id}
      />
      {v === "two" ? null : <RemoveConfirm required={v === "always"} />}
    </>,
    REPORTS_LEDE,
    w.look === "grid" ? gridRead : queueRead,
    WITH_PEOPLE,
  );
}

const CLOSED_CAPTION: Record<ClosedShape, string> = {
  line: "The three still open, then the answered ones as a log under them, one line each where All draws every card today.",
  undo: "The same log, with a day's way back on the one removal that is not held.",
  window:
    "The same log, with a way back for as long as the item would exist anyway: the product's own 30-day Trash, not a second clock.",
};

function closedScreen(v: ClosedShape, s: BoardState) {
  const w = worldOf(s, { closed: v, ...TODAY });
  return reportsScreen(
    `closed-${v}`,
    w,
    CLOSED_CAPTION[v],
    <HistorySurface shape={v} look={w.look} />,
    "Every report on record. Resolved ones are read-only; a removal is undone from Albums.",
    historyRead,
  );
}

/* ── The phone, which ignores the knob ───────────────────────────────────── */

const PHONE_CAPTION: Record<PhoneShape, string> = {
  act: "The frame, the sentence and the one verb that cannot wait until morning.",
  all: "Everything the desk can do, in a column, typed with a thumb at a party.",
  hold: "The one verb, plus a Preserve that starts the hold now; its note waits for a desk.",
};

function phoneScreen(v: PhoneShape) {
  return (
    <Screen
      id={`phone-${v}`}
      size="375"
      caption={PHONE_CAPTION[v]}
      read={queueRead}
    >
      {/* Admin r1 already measures the shell for a thumb, so every option wears
          that bar rather than a folded desk page: none of them depends on the
          board's live state any more. */}
      <PhonePortal active={REPORTS_SURFACE}>
        <PhoneQueue shape={v} />
      </PhonePortal>
    </Screen>
  );
}

/* ── The two loose pieces ────────────────────────────────────────────────── */

const IDIOM_CAPTION: Record<IdiomShape, string> = {
  three:
    "Today. Three surfaces in one nav group, three filter bars, and two shapes of control between them.",
  shape:
    "One control and one filter bar on all three, each taking the words its surface needs.",
  "one-inbox":
    "One list, one vocabulary, filtered by kind. The three surfaces become three tabs.",
};

function idiomScreen(v: IdiomShape, s: BoardState) {
  const w = worldOf(s, { idiom: v });
  return (
    <Screen
      id={`idiom-${v}`}
      size={w.size}
      caption={IDIOM_CAPTION[v]}
      read={idiomRead}
    >
      <Surface size={w.size} active={SUPPORT_SURFACE}>
        <SurfaceHead
          title="Inboxes"
          lede="Everything an operator answers, drawn side by side: three surfaces from one nav group on one Saturday night."
        />
        <Inboxes shape={v} />
      </Surface>
    </Screen>
  );
}

const NOTICE_CAPTION: Record<NoticeShape, string> = {
  silence:
    "Today. Her uploads list says Not in the album; the host is sent nothing and finds a Restore in her Deleted that cannot restore.",
  deleted:
    "Nothing is sent. Her Deleted says Removed by Partyreel with no Restore to fail, in the same words for a takedown and a hold.",
  host: "One line to the host, identical on every removal, and her Deleted says the same, so a held photo reads like any other.",
};

function noticeScreen(v: NoticeShape, s: BoardState) {
  const w = worldOf(s, { notice: v, ...TODAY });
  return (
    <Screen id={`notice-${v}`} size={w.size} caption={NOTICE_CAPTION[v]}>
      <Surface size={w.size} active={REPORTS_SURFACE} counts={WITH_PEOPLE}>
        <SurfaceHead
          title="After the verdict"
          lede="The same removal, and everyone it reaches. The record never changes; only what the host is told, and where."
        />
        <WhoIsTold shape={v} verdict={w.verdict} />
      </Surface>
    </Screen>
  );
}

/* ── The map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof ADMIN_TRIAGE> = {
  "look.frame": (s) => lookScreen("frame", s),
  "look.split": (s) => lookScreen("split", s),
  "look.grid": (s) => lookScreen("grid", s),

  "reason.chrono": (s) => reasonScreen("chrono", s),
  "reason.last": (s) => reasonScreen("last", s),
  "reason.marked": (s) => reasonScreen("marked", s),

  "verdict.two": (s) => verdictScreen("two", s),
  "verdict.note": (s) => verdictScreen("note", s),
  "verdict.always": (s) => verdictScreen("always", s),

  "closed.line": (s) => closedScreen("line", s),
  "closed.undo": (s) => closedScreen("undo", s),
  "closed.window": (s) => closedScreen("window", s),

  "escalate.retype": (s) => escalateScreen("retype", s),
  "escalate.copy": (s) => escalateScreen("copy", s),
  "escalate.door": (s) => escalateScreen("door", s),

  "phone.act": () => phoneScreen("act"),
  "phone.all": () => phoneScreen("all"),
  "phone.hold": () => phoneScreen("hold"),

  "idiom.three": (s) => idiomScreen("three", s),
  "idiom.shape": (s) => idiomScreen("shape", s),
  "idiom.one-inbox": (s) => idiomScreen("one-inbox", s),

  "notice.silence": (s) => noticeScreen("silence", s),
  "notice.deleted": (s) => noticeScreen("deleted", s),
  "notice.host": (s) => noticeScreen("host", s),
};

export function AdminTriageBoard() {
  return <ExplorationBoard spec={ADMIN_TRIAGE} previews={PREVIEWS} />;
}

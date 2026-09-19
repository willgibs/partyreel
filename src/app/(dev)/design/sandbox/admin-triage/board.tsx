"use client";

import "./admin-triage.css";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  escalateOf,
  type EscalateShape,
  ForensicsPanel,
  HoldSheet,
  IdStrip,
} from "./escalate";
import {
  type NavEntry,
  REPORTS_SURFACE,
  SUPPORT_SURFACE,
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
  type VerdictShape,
  verdictOf,
} from "./report";
import { Portal, PhonePortal, SurfaceHead } from "./shell";
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

/** The frame, the card and the queue, as the browser actually laid them out. */
const queueRead: Reader = (root, win) => {
  const shot = root.querySelector<HTMLElement>("[data-tri-frame]");
  const cards = root.querySelectorAll<HTMLElement>("[data-slot='card']");
  if (cards.length === 0) return null;
  const first = Math.round(cards[0].getBoundingClientRect().height);
  if (first < 8) return null;
  const edge = shot
    ? Math.round(shot.getBoundingClientRect().width)
    : null;
  // How much of the screen the reports themselves take, clipped to the viewport:
  // a card below the fold is a card the operator has not seen.
  let area = 0;
  cards.forEach((el) => {
    const b = el.getBoundingClientRect();
    const w = Math.max(0, Math.min(b.right, win.innerWidth) - Math.max(b.left, 0));
    const h = Math.max(0, Math.min(b.bottom, win.innerHeight) - Math.max(b.top, 0));
    area += w * h;
  });
  const share = pct(area, win.innerWidth * win.innerHeight);
  return `Measured: ${edge ? `the reported frame is ${edge} px wide, ` : "no frame on this one, "}one report stands ${first} px, and the reports on screen cover ${share} percent of it.`;
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
  return `Measured: three answered reports stand ${tall} px in all, and ${seen} of the three are on this screen at once.`;
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
  children,
}: {
  id: string;
  size: Size;
  caption: string;
  /** A reader whose measured line replaces the caption once it has one. */
  read?: Reader;
  children: ReactNode;
}) {
  const [said, setSaid] = useState<string | null>(null);
  const { w, h } = BOX[size];
  return (
    <Frame
      id={`triage-${id}`}
      w={w}
      h={h}
      title={`${w} x ${h}`}
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
 * other steps: the first capture pass had "Either one asks for a line first."
 * on the verdict buttons of the step about the CARD, which is the recommended
 * answer to a question he had not been asked. They are independent roots, not
 * ancestors, so on anyone else's step they draw as today. Every other axis
 * follows the live state, which is what makes a staged decision wear its
 * parent's answer. (`guest-upload` pinned its `words` axis for the same
 * reason.)
 */
const TODAY = { reason: "same", verdict: "two" } as const;

/**
 * ★ AT 375 THE BOARD COLLAPSES THE RAIL, AND THAT IS NOT AN ANSWER TO ANYTHING.
 * The shipped portal keeps its 232 px rail at every width, so the desk surface
 * at 375 leaves a 143 px column and every one of these questions becomes the
 * same unreadable picture. The first 375 capture pass was seven copies of that.
 * The rail is the `admin` board's, and what the PORTAL does at a phone is this
 * board's `phone` decision, whose first option draws today's rail at 375
 * exactly. So everywhere else the knob collapses it, and the question stays
 * about the content it was asking about.
 */
function Surface({
  size,
  active,
  children,
}: {
  size: Size;
  active: NavEntry;
  children: ReactNode;
}) {
  if (size === "375")
    return <PhonePortal active={active}>{children}</PhonePortal>;
  return <Portal active={active}>{children}</Portal>;
}

const REPORTS_LEDE =
  "Guest-submitted reports. Actioning an item removes it; the purge cron reclaims its storage afterward.";

/** The reports surface, which is where six of the eight decisions live. */
function reportsScreen(
  id: string,
  w: World,
  caption: string,
  body: ReactNode,
  lede = REPORTS_LEDE,
  read: Reader = queueRead,
) {
  return (
    <Screen id={id} size={w.size} caption={caption} read={read}>
      <Surface size={w.size} active={REPORTS_SURFACE}>
        <SurfaceHead title="Reports" lede={lede} />
        {body}
      </Surface>
    </Screen>
  );
}

/* ── The first look, and the two questions it unlocks ────────────────────── */

const LOOK_CAPTION: Record<LookShape, string> = {
  card: "Today. The album's name is the headline and the thing being judged is a thumbnail.",
  frame:
    "The reported frame at the card's full width, the sentence under it, the verdict beneath that.",
  split:
    "A row each: the frame on the left at a size you can judge, the words and the verdict on the right.",
};

function lookScreen(v: LookShape, s: BoardState) {
  const w = worldOf(s, { look: v, ...TODAY });
  return reportsScreen(
    `look-${v}`,
    w,
    LOOK_CAPTION[v],
    <ReportsSurface
      world={{ look: v, reason: w.reason, verdict: w.verdict }}
      reason={w.reason}
    />,
  );
}

const REASON_CAPTION: Record<ReasonShape, string> = {
  same: "Today. A sentence saying nothing was said, the same size as one somebody wrote.",
  quiet:
    "The wordless report keeps its place and loses its paragraph, so it is visibly shorter.",
  last: "The wordless report falls under both written ones and says why it is there.",
};

function reasonScreen(v: ReasonShape, s: BoardState) {
  const w = worldOf(s, { reason: v, verdict: TODAY.verdict });
  return reportsScreen(
    `reason-${v}`,
    w,
    REASON_CAPTION[v],
    <ReportsSurface
      world={{ look: w.look, reason: v, verdict: w.verdict }}
      reason={v}
    />,
  );
}

const ESCALATE_CAPTION: Record<EscalateShape, string> = {
  retype:
    "Today. Nothing on a report is an id, and the form that needs one is two surfaces away.",
  copy: "The report reference and the media id on the card, and the same form with them pasted in.",
  door: "One control on the report, and the panel it opens, saying what the hold touches.",
};

function escalateScreen(v: EscalateShape, s: BoardState) {
  const w = worldOf(s, { escalate: v, ...TODAY });
  return (
    <Screen
      id={`escalate-${v}`}
      size={w.size}
      caption={ESCALATE_CAPTION[v]}
      read={queueRead}
    >
      {/* ★ THE SURFACE IS ALWAYS REPORTS. The first capture pass had the rail
          highlighting Forensics while the heading said Reports, because the
          forensics FORM is drawn here: an operator reading that picture would
          have been told they were on a page they were not on. The form below is
          an inset of the other surface and says so in its own head. */}
      <Surface size={w.size} active={REPORTS_SURFACE}>
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
      {v === "door" ? <HoldSheet /> : null}
    </Screen>
  );
}

/* ── The verdict, and what it leaves ─────────────────────────────────────── */

const VERDICT_CAPTION: Record<VerdictShape, string> = {
  two: "Today. Two presses, nothing typed, and the record is a status and a time.",
  note: "The same two verbs with Add a note beside them, open on the one being answered.",
  required:
    "The verb opens one line before it commits, and nothing closes without it.",
};

function verdictScreen(v: VerdictShape, s: BoardState) {
  const w = worldOf(s, { verdict: v, reason: TODAY.reason });
  return reportsScreen(
    `verdict-${v}`,
    w,
    VERDICT_CAPTION[v],
    <ReportsSurface
      world={{ look: w.look, reason: w.reason, verdict: v }}
      reason={w.reason}
      acting={v === "two" ? undefined : 0}
    />,
  );
}

const CLOSED_CAPTION: Record<ClosedShape, string> = {
  card: "Today, in the All view. Three answered reports as tall as the three that are not.",
  line: "The three still open, then the answered ones as a log under them.",
  undo: "The same log, with a day's way back on the one removal that is not held.",
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
  none: "Today. The desk page folded into 375, with the verbs somewhere below the fold.",
  act: "The frame, the sentence and the one verb that cannot wait until morning.",
  all: "Everything the desk can do, in a column, typed with a thumb at a party.",
};

function phoneScreen(v: PhoneShape, s: BoardState) {
  const w = worldOf(s, TODAY);
  return (
    <Screen
      id={`phone-${v}`}
      size="375"
      caption={PHONE_CAPTION[v]}
      read={queueRead}
    >
      {/* The first option is today: the desk portal, rail and all, at 375. */}
      {v === "none" ? (
        // Today, exactly: the desk portal with its rail, drawing the card shape
        // that ships, at 375. Drawing the picked row shape here would blame
        // today's page for a layout today's page does not have.
        <Portal active={REPORTS_SURFACE}>
          <SurfaceHead title="Reports" lede={REPORTS_LEDE} />
          <PhoneQueue shape={v} look="card" />
        </Portal>
      ) : (
        <PhonePortal active={REPORTS_SURFACE}>
          <PhoneQueue shape={v} look={w.look} />
        </PhonePortal>
      )}
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
  silence: "Today. Two people are affected by the decision and neither is told it happened.",
  host: "One line to the host, identical on every removal, so a held item reads like any other.",
  both: "That line, and a closing note to a reporter the product has no address for.",
};

function noticeScreen(v: NoticeShape, s: BoardState) {
  const w = worldOf(s, { notice: v });
  return (
    <Screen id={`notice-${v}`} size={w.size} caption={NOTICE_CAPTION[v]}>
      <Surface size={w.size} active={REPORTS_SURFACE}>
        <SurfaceHead
          title="After the verdict"
          lede="The same removal, and everyone it reaches. The record on the right never changes; only how far outside the portal it travels."
        />
        <WhoIsTold shape={v} />
      </Surface>
    </Screen>
  );
}

/* ── The map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof ADMIN_TRIAGE> = {
  "look.card": (s) => lookScreen("card", s),
  "look.frame": (s) => lookScreen("frame", s),
  "look.split": (s) => lookScreen("split", s),

  "reason.same": (s) => reasonScreen("same", s),
  "reason.quiet": (s) => reasonScreen("quiet", s),
  "reason.last": (s) => reasonScreen("last", s),

  "verdict.two": (s) => verdictScreen("two", s),
  "verdict.note": (s) => verdictScreen("note", s),
  "verdict.required": (s) => verdictScreen("required", s),

  "closed.card": (s) => closedScreen("card", s),
  "closed.line": (s) => closedScreen("line", s),
  "closed.undo": (s) => closedScreen("undo", s),

  "escalate.retype": (s) => escalateScreen("retype", s),
  "escalate.copy": (s) => escalateScreen("copy", s),
  "escalate.door": (s) => escalateScreen("door", s),

  "phone.none": (s) => phoneScreen("none", s),
  "phone.act": (s) => phoneScreen("act", s),
  "phone.all": (s) => phoneScreen("all", s),

  "idiom.three": (s) => idiomScreen("three", s),
  "idiom.shape": (s) => idiomScreen("shape", s),
  "idiom.one-inbox": (s) => idiomScreen("one-inbox", s),

  "notice.silence": (s) => noticeScreen("silence", s),
  "notice.host": (s) => noticeScreen("host", s),
  "notice.both": (s) => noticeScreen("both", s),
};

export function AdminTriageBoard() {
  return <ExplorationBoard spec={ADMIN_TRIAGE} previews={PREVIEWS} />;
}

"use client";

import "./host-curation.css";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  KeysShowcase,
  type KeysOption,
  PeekShowcase,
  type PeekOption,
  QueueShowcase,
  type QueueMode,
  queueOf,
  VerbShowcase,
  type VerbOption,
} from "./queue";
import { HostGround, Scene, screenOf, type ScreenId } from "./scene";
import {
  ArrivalsShowcase,
  type ArrivalOption,
  ToldShowcase,
  type ToldOption,
  UndoShowcase,
  type UndoOption,
} from "./signals";
import { HOST_CURATION } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the host's own event page at
 * a real viewport, with the real review components in it and one thing changed.
 *
 * ★ EVERY PREVIEW IS A FUNCTION OF THE BOARD'S STATE. The screen is a knob all
 * eight decisions share and every picture reads it. A decision staged behind
 * another is drawn WEARING that answer: the peek is judged over whichever grid
 * the queue settled on, and the keyboard over whatever a tap then means. Going
 * back redraws the earlier ones in the world he chose rather than the one the
 * board assumed.
 *
 * ★ A STAGED DECISION WEARS ITS PARENT'S RECOMMENDATION UNTIL HE ANSWERS.
 * `defineExploration` mirrors each ask as a control whose default IS the
 * recommendation and `useBoardState` fills every declared control, so there is
 * no unanswered value to read: before he answers `queue`, the peek is drawn
 * over the masonry this board recommends. That is what the staging is for.
 *
 * ★ NOTHING ON THIS BOARD CALLS A SERVER FUNCTION. The triage machine is forked
 * (`triage.ts`), the host album and the guest feed have pointer events off over
 * the grids whose chips call one, and the bell is drawn from the real pure
 * builder rather than opened, because opening the shipped one marks
 * announcements seen on a real profile.
 */

const screen = (s: BoardState): ScreenId => screenOf(s.screen as string);

/** How big the thing being judged really is, read off the frame's own layout:
 *  a claim about judging a photograph has to be a claim about its size. */
function measureBiggest(root: HTMLElement, win: Window): string {
  const boxes = [
    ...root.querySelectorAll<HTMLElement>("[data-hc-whole], img"),
  ].filter((el) => el.clientWidth > 90);
  if (boxes.length === 0) return "measuring";
  const areas = boxes.map((el) => el.clientWidth * el.clientHeight);
  const biggest = boxes[areas.indexOf(Math.max(...areas))];
  const above = boxes.filter(
    (el) => el.getBoundingClientRect().top < win.innerHeight,
  ).length;
  return `the biggest upload renders ${Math.round(biggest.clientWidth)} by ${Math.round(
    biggest.clientHeight,
  )}; ${above} judgeable on screen at once`;
}

/** Whether the bar's words still fit the room the floating pill has. */
function measureBar(root: HTMLElement): string {
  const bar = root.querySelector<HTMLElement>("[data-hc-says]")
    ? root.querySelector<HTMLElement>(".pointer-events-auto")
    : null;
  if (!bar) return "measuring";
  const over = bar.scrollWidth > bar.clientWidth + 1;
  return over
    ? `the bar runs ${bar.scrollWidth}px in ${bar.clientWidth}px: it overflows`
    : `the bar fits: ${bar.scrollWidth}px of buttons in ${bar.clientWidth}px`;
}

/** How far a verdict is from the photograph it is about, in real pixels. */
function measureReach(root: HTMLElement, win: Window): string {
  const photo = root.querySelector<HTMLElement>(".hc-overlay img");
  const verdict = root.querySelector<HTMLElement>("[data-hc-verdict]");
  if (!photo) return "measuring";
  if (!verdict) {
    return `${Math.round(photo.clientWidth)}px of photograph, and no verdict on it: close, find the tile, decide`;
  }
  const a = photo.getBoundingClientRect();
  const b = verdict.getBoundingClientRect();
  const gap = Math.round(Math.max(0, b.top - a.bottom));
  return `${Math.round(photo.clientWidth)}px of photograph with the verdict ${gap}px below it, on a ${win.innerWidth}px screen`;
}

/* ── the pictures ────────────────────────────────────────────────────────── */

const queue = (s: BoardState, mode: QueueMode) => (
  <Scene
    id={`queue-${mode}`}
    screen={screen(s)}
    title="The queue"
    measure={measureBiggest}
  >
    <HostGround screen={screen(s)}>
      <QueueShowcase mode={mode} screen={screen(s)} />
    </HostGround>
  </Scene>
);

const verb = (s: BoardState, option: VerbOption) => (
  <Scene
    id={`verb-${option}`}
    screen={screen(s)}
    title="The verb"
    measure={measureBar}
  >
    <HostGround screen={screen(s)}>
      <VerbShowcase option={option} screen={screen(s)} />
    </HostGround>
  </Scene>
);

const peek = (s: BoardState, option: PeekOption) => (
  <Scene
    id={`peek-${option}`}
    screen={screen(s)}
    title="The peek"
    measure={measureReach}
  >
    <HostGround screen={screen(s)}>
      <PeekShowcase
        option={option}
        queue={queueOf(s.queue as string)}
        screen={screen(s)}
      />
    </HostGround>
  </Scene>
);

const keys = (s: BoardState, option: KeysOption) => (
  <Scene
    id={`keys-${option}`}
    screen={screen(s)}
    title="The keyboard"
    short
    caption={
      option === "none"
        ? "No key in this frame moves anything, which is today"
        : "The keys are really bound here: click into the frame and press them"
    }
  >
    <HostGround screen={screen(s)}>
      <KeysShowcase
        option={option}
        queue={queueOf(s.queue as string)}
        screen={screen(s)}
      />
    </HostGround>
  </Scene>
);

const undo = (s: BoardState, option: UndoOption) => (
  <Scene
    id={`undo-${option}`}
    screen={screen(s)}
    title="After a bulk act"
    short
    caption="Five really approved on arrival, at the shipped exit timing; the fork's Server Function is a resolved promise"
  >
    <HostGround screen={screen(s)}>
      <UndoShowcase option={option} screen={screen(s)} />
    </HostGround>
  </Scene>
);

const arrivals = (s: BoardState, option: ArrivalOption) => (
  <Scene
    id={`arrivals-${option}`}
    screen={screen(s)}
    title="One lands mid-visit"
    caption="Three land 1.2 seconds in, with one tile already selected"
  >
    <HostGround screen={screen(s)}>
      <ArrivalsShowcase option={option} screen={screen(s)} />
    </HostGround>
  </Scene>
);

const told = (s: BoardState, option: ToldOption) => (
  <Scene id={`told-${option}`} screen={screen(s)} title="The guest" short>
    <HostGround screen={screen(s)}>
      <ToldShowcase option={option} screen={screen(s)} />
    </HostGround>
  </Scene>
);

const PREVIEWS: PreviewsFor<typeof HOST_CURATION> = {
  "queue.uniform": (s) => queue(s, "uniform"),
  "queue.natural": (s) => queue(s, "natural"),
  "queue.one": (s) => queue(s, "one"),
  "verb.today": (s) => verb(s, "today"),
  "verb.reject": (s) => verb(s, "reject"),
  "verb.chip": (s) => verb(s, "chip"),
  "peek.readonly": (s) => peek(s, "readonly"),
  "peek.verdict": (s) => peek(s, "verdict"),
  "peek.viewer": (s) => peek(s, "viewer"),
  "keys.none": (s) => keys(s, "none"),
  "keys.jk": (s) => keys(s, "jk"),
  "keys.arrows": (s) => keys(s, "arrows"),
  "undo.plain": (s) => undo(s, "plain"),
  "undo.undo": (s) => undo(s, "undo"),
  "undo.hold": (s) => undo(s, "hold"),
  "arrivals.silence": (s) => arrivals(s, "silence"),
  "arrivals.prompt": (s) => arrivals(s, "prompt"),
  "arrivals.live": (s) => arrivals(s, "live"),
  "told.never": (s) => told(s, "never"),
  "told.line": (s) => told(s, "line"),
  "told.message": (s) => told(s, "message"),
};

export function HostCurationBoard() {
  return <ExplorationBoard spec={HOST_CURATION} previews={PREVIEWS} />;
}

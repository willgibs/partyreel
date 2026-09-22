"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import {
  EVENT,
  REEL_BY_PACE,
  REEL_LANDSCAPE,
  REEL_PORTRAIT,
  REEL_REDUCED_SLOW,
} from "./fixtures";
import { REEL_VIEW } from "./spec";
import {
  arrivalOf,
  chromeOf,
  controlsOf,
  loopOf,
  orientationFor,
  paceOf,
  postureOf,
  reducedOf,
  ReelPausedWithControls,
  ReelPosterFrame,
  ReelViewSurface,
  Screen,
  screenOf,
  tapOf,
} from "./surfaces";

/**
 * THE PREVIEWS, and nothing else: every option is the same wedding album,
 * playing through the real engine, with one thing about the view's chrome
 * changed.
 *
 * ★ EVERY DIMENSION READS THE BOARD'S OWN STATE (`viewFor`), never a hardcoded
 * default. `defineExploration`'s "wearing" convention hands every preview the
 * OTHER asks' current or recommended answers, so reviewing `chrome` still
 * shows `arrival`'s own beat pulsing and `pacing`'s own quick hold playing: one
 * coherent view, not eight disconnected specimens. Only `controls` forces the
 * foot dock up regardless of `chrome`'s answer, because an arrangement cannot
 * be judged on a hidden dock (the same rule media-viewer's `who` forces
 * `summoned`).
 */

function viewFor(s: BoardState) {
  const screen = screenOf(s.screen);
  const posture = postureOf(s.posture);
  const orientation = orientationFor(posture, screen);
  const landscape = orientation === "landscape";
  const pace = paceOf(s.pacing);
  return {
    screen,
    landscape,
    reelProps: REEL_BY_PACE[pace][orientation],
    chrome: chromeOf(s.chrome),
    controls: controlsOf(s.controls),
    arrival: arrivalOf(s.arrival),
    tap: tapOf(s.tap),
  };
}

function ViewFrame({
  id,
  caption,
  s,
  forceChromeUp,
  slow,
}: {
  id: string;
  caption: string;
  s: BoardState;
  /** `controls` asks the arrangement itself: a hidden dock cannot answer it. */
  forceChromeUp?: boolean;
  /** `reduced`'s "it plays, just slower" option: a hold well past pacing's own knob. */
  slow?: boolean;
}) {
  const v = viewFor(s);
  const reduced = usePrefersReducedMotion();
  const reelProps = slow
    ? REEL_REDUCED_SLOW[v.landscape ? "landscape" : "portrait"]
    : v.reelProps;
  return (
    <Screen id={id} screen={v.screen} caption={caption}>
      <ReelViewSurface
        reelProps={reelProps}
        landscape={v.landscape}
        chrome={v.chrome}
        controls={v.controls}
        arrival={v.arrival}
        tap={v.tap}
        loop={loopOf(s.loop)}
        eventName={EVENT.name}
        reduced={reduced}
        forceChromeUp={forceChromeUp}
      />
    </Screen>
  );
}

/* ── 1. the chrome ────────────────────────────────────────────────────────── */

const CHROME_CAPTION: Record<string, string> = {
  bare: "Nothing on the frame at rest. Move the pointer over the picture to bring the foot dock up; it fades again a couple of seconds after it stops.",
  thin: "A faint strip holds at the foot even at rest. Move the pointer to see it brighten into the full dock.",
  foot: "The full dock stays lit the whole time. Moving the pointer changes nothing; there is nothing left to summon.",
};

function chromeScreen(shape: string, s: BoardState) {
  return <ViewFrame id={`chrome-${shape}`} caption={CHROME_CAPTION[shape]} s={s} />;
}

/* ── 2. the controls ──────────────────────────────────────────────────────── */

const CONTROLS_CAPTION: Record<string, string> = {
  row: "All five foot controls in one row, evenly weighted, in the ruled order. Close keeps its own corner regardless.",
  weighted: "Add yours and Make your own on their own row; the three utility controls ride smaller above them.",
  split: "The three utility controls cluster opposite Close's own corner; Add yours and Make your own stand alone at the foot.",
};

function controlsScreen(shape: string, s: BoardState) {
  return (
    <ViewFrame
      id={`controls-${shape}`}
      caption={CONTROLS_CAPTION[shape]}
      s={s}
      forceChromeUp
    />
  );
}

/* ── 3. the arrival ───────────────────────────────────────────────────────── */

const ARRIVAL_CAPTION: Record<string, string> = {
  caption: "Pulses on a beat so it can be caught without a real upload landing. It clears itself and the reel carries on.",
  chip: "The same beat, as a quiet corner chip instead of a line across the frame.",
  none: "The album's own doorbell still splices the item in; nothing on the frame says so.",
};

function arrivalScreen(shape: string, s: BoardState) {
  return <ViewFrame id={`arrival-${shape}`} caption={ARRIVAL_CAPTION[shape]} s={s} />;
}

/* ── 4. the tap ───────────────────────────────────────────────────────────── */

const TAP_CAPTION: Record<string, string> = {
  lightbox: "The dashed label is this board's own annotation for an invisible gesture. media-viewer owns the lightbox's shape once it opens.",
  pause: "A tap freezes the current clip in place; a second tap resumes it.",
  none: "The picture answers nothing at all. Only play/pause and Close do anything.",
};

function tapScreen(shape: string, s: BoardState) {
  return <ViewFrame id={`tap-${shape}`} caption={TAP_CAPTION[shape]} s={s} />;
}

/* ── 5. the posture ───────────────────────────────────────────────────────── */

const POSTURE_CAPTION: Record<string, string> = {
  follow: "At 1440 the same event renders landscape, filling more of the laptop's own window; at 375 it stays portrait.",
  letterboxed: "Portrait everywhere: at 1440 the dark backdrop fills the rest of the window either side of the picture.",
};

function postureScreen(shape: string, s: BoardState) {
  return <ViewFrame id={`posture-${shape}`} caption={POSTURE_CAPTION[shape]} s={s} />;
}

/* ── 6. the pacing ────────────────────────────────────────────────────────── */

const PACE_CAPTION: Record<string, string> = {
  quick: "A real 1.0 second hold, playing: watch two or three photographs pass to feel it.",
  steady: "A real 1.5 second hold, playing.",
  unhurried: "A real 2.2 second hold, playing: closer to today's stored, post-event reel.",
};

function paceScreen(shape: string, s: BoardState) {
  return <ViewFrame id={`pace-${shape}`} caption={PACE_CAPTION[shape]} s={s} />;
}

/* ── 7. the loop ──────────────────────────────────────────────────────────── */

const LOOP_CAPTION: Record<string, string> = {
  continues: "No boundary is drawn on this picture. The transition from the last clip into the next take is the only seam there ever is.",
  breath: "A near-black beat, under a second, pulsed here on a timer so it can be caught without waiting for a real loop.",
  title: "The event's own name, pulsed on the same timer, standing in for the real loop boundary.",
};

function loopScreen(shape: string, s: BoardState) {
  return <ViewFrame id={`loop-${shape}`} caption={LOOP_CAPTION[shape]} s={s} />;
}

/* ── 8. reduced motion ────────────────────────────────────────────────────── */

const REDUCED_CAPTION: Record<string, string> = {
  paused: "Frame 0, held, with the foot dock already up: the shipped guest overlay's own reduced-motion state today.",
  frame: "Frame 0, held, with only the shared play mark: the same minimal state a poster card wears before anyone presses it.",
  slower: "Plays if your own system is not asking for reduced motion: a 3.2 second hold, well past pacing's own slowest, so it reads as calm rather than frantic.",
};

function reducedScreen(shape: string, s: BoardState) {
  const screen = screenOf(s.screen);
  const orientation = orientationFor(postureOf(s.posture), screen);
  const landscape = orientation === "landscape";
  const controls = controlsOf(s.controls);
  const reelProps = landscape ? REEL_LANDSCAPE : REEL_PORTRAIT;
  const shown = reducedOf(shape);
  if (shown === "paused")
    return (
      <Screen id={`reduced-${shape}`} screen={screen} caption={REDUCED_CAPTION.paused}>
        <ReelPausedWithControls
          reelProps={reelProps}
          landscape={landscape}
          controls={controls}
        />
      </Screen>
    );
  if (shown === "frame")
    return (
      <Screen id={`reduced-${shape}`} screen={screen} caption={REDUCED_CAPTION.frame}>
        <ReelPosterFrame reelProps={reelProps} landscape={landscape} />
      </Screen>
    );
  return <ViewFrame id={`reduced-${shape}`} caption={REDUCED_CAPTION.slower} s={s} slow />;
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof REEL_VIEW> = {
  "chrome.bare": (s) => chromeScreen("bare", s),
  "chrome.thin": (s) => chromeScreen("thin", s),
  "chrome.foot": (s) => chromeScreen("foot", s),

  "controls.row": (s) => controlsScreen("row", s),
  "controls.weighted": (s) => controlsScreen("weighted", s),
  "controls.split": (s) => controlsScreen("split", s),

  "arrival.caption": (s) => arrivalScreen("caption", s),
  "arrival.chip": (s) => arrivalScreen("chip", s),
  "arrival.none": (s) => arrivalScreen("none", s),

  "tap.lightbox": (s) => tapScreen("lightbox", s),
  "tap.pause": (s) => tapScreen("pause", s),
  "tap.none": (s) => tapScreen("none", s),

  "posture.follow": (s) => postureScreen("follow", s),
  "posture.letterboxed": (s) => postureScreen("letterboxed", s),

  "pacing.quick": (s) => paceScreen("quick", s),
  "pacing.steady": (s) => paceScreen("steady", s),
  "pacing.unhurried": (s) => paceScreen("unhurried", s),

  "loop.continues": (s) => loopScreen("continues", s),
  "loop.breath": (s) => loopScreen("breath", s),
  "loop.title": (s) => loopScreen("title", s),

  "reduced.paused": (s) => reducedScreen("paused", s),
  "reduced.frame": (s) => reducedScreen("frame", s),
  "reduced.slower": (s) => reducedScreen("slower", s),
};

export function ReelViewBoard() {
  return <ExplorationBoard spec={REEL_VIEW} previews={PREVIEWS} />;
}

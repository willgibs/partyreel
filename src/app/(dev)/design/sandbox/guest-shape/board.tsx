"use client";

import "./guest-shape.css";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { ChromePage, type ChromeShape, positionOf } from "./chrome";
import { screenOf, SCREENS, type ScreenId } from "./page-parts";
import { GUEST_SHAPE } from "./spec";
import { MINE_INDEX, TheirsPage, type TheirsShape, showOf } from "./theirs";
import {
  contentFixtureOf,
  stepOf,
  Welcome,
  type WelcomeShape,
  whichOf,
} from "./welcome";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the guest page, the door,
 * or the album at a real screen, phone first, wearing exactly one thing
 * changed.
 *
 * ★ THE MEASUREMENT SCAFFOLD IS ROUND ONE'S, UNCHANGED (this board's own
 * precedent, and `profile-page`'s independent arrival at the same shape): a
 * board once drew an option with its formula's sign backwards and the tile he
 * judged showed the opposite of the words he picked (docs/PROGRAM.md), so
 * every caption below reads the laid-out DOM inside the frame's own document
 * once it settles rather than describing what the code is supposed to do. If
 * the words above a frame and the caption under it disagree, the caption is
 * the truth.
 */

/* ── the measurement ─────────────────────────────────────────────────────── */

type Reader = (root: HTMLElement, win: Window) => string | null;

/**
 * Reads one fact out of the frame's own document, watched with THAT window's
 * ResizeObserver (the subtree lives in the iframe's document) plus a late
 * pass for photographs still decoding at layout time.
 *
 * ★ `deps` RE-ARMS THE WATCH, AND THAT IS NOT ROUND ONE'S OWN COPY
 * (`profile-page`'s `Measured` improved on it first). A ResizeObserver fires
 * on a LAYOUT change; `position` on `chrome` and `which`/`step`/`show` on
 * `welcome`/`theirs` change what is TRUE inside an already-mounted frame
 * without resizing anything (a scrollTop, a filtered item list), so a probe
 * armed once at mount would keep reporting the picture it first saw. Found
 * live on this board: the `column` option at `position=deep` measured
 * "Invite reachable" because the scroll happened AFTER the one-time read.
 * Depending on the state that can change the answer makes the effect re-run
 * exactly when it has to.
 */
function Probe({
  read,
  deps,
  onRead,
  children,
}: {
  read: Reader;
  deps: readonly unknown[];
  onRead: (s: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
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
    // Two late passes: the scroll container settles its position a beat
    // after mount/prop-change (ScrollPage's own 1200ms re-apply), and a
    // filtered grid's photographs can still be decoding at 1400ms alone.
    const mid = win.setTimeout(run, 1300);
    const late = win.setTimeout(run, 1900);
    return () => {
      ro.disconnect();
      win.clearTimeout(mid);
      win.clearTimeout(late);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return <div ref={ref}>{children}</div>;
}

const pct = (h: number, win: Window) => Math.round((h / win.innerHeight) * 100);

function Screen({
  id,
  screen,
  caption,
  read,
  deps,
  children,
}: {
  id: string;
  screen: ScreenId;
  caption: string;
  read: Reader;
  /** Every piece of state besides `screen` (already in `id`) that can change
   *  what `read` finds true, so the probe re-arms when any of it changes. */
  deps: readonly unknown[];
  children: ReactNode;
}) {
  const [said, setSaid] = useState<string | null>(null);
  const { w, h, name } = SCREENS[screen];
  return (
    <Frame
      id={`gs-${id}-${screen}`}
      w={w}
      h={h}
      title={`${w} x ${h}, ${name}`}
      caption={said ? `${caption} ${said}` : caption}
    >
      <Probe read={read} deps={deps} onRead={setSaid}>
        {children}
      </Probe>
    </Frame>
  );
}

const screenFor = (s: BoardState): ScreenId => screenOf(s.screen);

const inFrame = (el: HTMLElement, win: Window): boolean => {
  const r = el.getBoundingClientRect();
  return (
    r.bottom > 0 && r.top < win.innerHeight && r.right > 0 && r.left < win.innerWidth
  );
};

/* ── 1. the chrome ───────────────────────────────────────────────────────── */

const CHROME_CAPTION: Record<ChromeShape, string> = {
  column:
    "Today. Add over Invite on landing; scrolled deep, only the floating pill remains.",
  dock: "No row at all. Add and Invite share one bar fixed to the foot, at any depth.",
  both: "The row on landing; a dock with both actions once it scrolls away.",
  header: "Add pins to the header; Invite lives alone in a dock at the foot.",
};

/** Whether Add and Invite are each actually inside the frame's own viewport
 *  right now, which is his own criterion measured rather than described. */
const chromeRead: Reader = (root, win) => {
  const add = root.querySelector<HTMLElement>("[data-gs-add]");
  const pill = root.querySelector<HTMLElement>("[data-floating-add]");
  const invite = root.querySelector<HTMLElement>("[data-gs-invite]");
  if (!add && !invite) return null;
  const addOk = (!!add && inFrame(add, win)) || (!!pill && inFrame(pill, win));
  const inviteOk = !!invite && inFrame(invite, win);
  return `Measured: Add ${addOk ? "reachable" : "off screen"}, Invite ${inviteOk ? "reachable" : "off screen"}.`;
};

function chromeScreen(shape: ChromeShape, s: BoardState) {
  const screen = screenFor(s);
  const position = positionOf(s.position);
  return (
    <Screen
      id={`chrome-${shape}`}
      screen={screen}
      read={chromeRead}
      // Every piece of state `chromeRead`'s answer can depend on: the shape
      // itself included, because the step swaps one option's tree for
      // another's AT THE SAME slot (`Screen` never remounts on its own), so
      // `position` alone left a stale reading the one time shape changed
      // and position did not.
      deps={[shape, screen, position]}
      caption={CHROME_CAPTION[shape]}
    >
      <ChromePage shape={shape} screen={screen} position={position} />
    </Screen>
  );
}

/* ── 2. the welcome ──────────────────────────────────────────────────────── */

const WELCOME_CAPTION: Record<WelcomeShape, string> = {
  today: "Today. A drawer below 640, the centred dialog above it.",
  page: "No floating chrome. The welcome and the gate each take the whole screen, in turn.",
  card: "A compact float over the album's own top, the page visible in the room it leaves.",
  sheet:
    "The responsive Sheet's own posture: a bottom sheet, or a full-height panel from the right.",
};

/** How tall the shell itself stands, whichever of the four it is. */
const welcomeRead: Reader = (root, win) => {
  const el = root.querySelector<HTMLElement>(
    "[data-gs-door], .gs-sheet, .gs-dialog",
  );
  if (!el) return null;
  const h = Math.round(el.getBoundingClientRect().height);
  if (h < 8) return null;
  return `Measured: ${h} px tall, ${pct(h, win)} percent of the screen.`;
};

function welcomeScreen(shape: WelcomeShape, s: BoardState) {
  const screen = screenFor(s);
  const which = whichOf(s.which);
  const step = stepOf(s.step);
  const { content, fixture } = contentFixtureOf(which);
  return (
    <Screen
      id={`welcome-${shape}`}
      screen={screen}
      read={welcomeRead}
      deps={[shape, screen, which, step]}
      caption={WELCOME_CAPTION[shape]}
    >
      <Welcome
        shape={shape}
        screen={screen}
        content={content}
        fixture={fixture}
        step={step}
      />
    </Screen>
  );
}

/* ── 3. theirs ────────────────────────────────────────────────────────────── */

const THEIRS_CAPTION: Record<TheirsShape, string> = {
  none: "Nothing added. Finding one of ten among 68 is scrolling and recognising it by eye.",
  chip: 'A "Yours" chip beside Sort and Filter; on, the grid narrows to the ten.',
  strip: "Everything this guest added, together, above the full 68.",
  mark: "A subtle mark rides the ten tiles that are theirs, wherever they fall.",
};

/**
 * How many of the ten are on screen without scrolling: the whole of the
 * question, measured. Three shapes of evidence, tried in order: `strip`'s own
 * section, scoped so the full 68 sitting under it are never counted as
 * "yours"; a grid narrowed to the ten (`chip`/`mark` reading `mine`), which
 * holds nothing else so every tile in it counts; and the unfiltered 68
 * (`none`, or `chip`/`mark` reading `all`), where the ten's real DOM
 * positions (`MINE_INDEX`, the album's own order) are looked up directly.
 */
const theirsRead: Reader = (root, win) => {
  const strip = root.querySelector<HTMLElement>("[data-gs-mine-strip]");
  if (strip) {
    const tiles = [...strip.querySelectorAll<HTMLElement>("[data-media-tile]")];
    const n = tiles.filter((t) => inFrame(t, win)).length;
    return `Measured: all ${tiles.length} of yours together in the strip, ${n} without scrolling.`;
  }
  const tiles = [...root.querySelectorAll<HTMLElement>("[data-media-tile]")];
  if (tiles.length === 0) return null;
  if (tiles.length <= MINE_INDEX.length) {
    const n = tiles.filter((t) => inFrame(t, win)).length;
    return `Measured: all ${tiles.length} of yours together, ${n} without scrolling.`;
  }
  const mine = MINE_INDEX.map((i) => tiles[i]).filter(
    (t): t is HTMLElement => Boolean(t),
  );
  const n = mine.filter((t) => inFrame(t, win)).length;
  return `Measured: ${n} of ${mine.length} of yours visible without scrolling, among ${tiles.length}.`;
};

function theirsScreen(shape: TheirsShape, s: BoardState) {
  const screen = screenFor(s);
  const show = showOf(s.show);
  return (
    <Screen
      id={`theirs-${shape}`}
      screen={screen}
      read={theirsRead}
      deps={[shape, screen, show]}
      caption={THEIRS_CAPTION[shape]}
    >
      <TheirsPage shape={shape} screen={screen} show={show} />
    </Screen>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof GUEST_SHAPE> = {
  "chrome.column": (s) => chromeScreen("column", s),
  "chrome.dock": (s) => chromeScreen("dock", s),
  "chrome.both": (s) => chromeScreen("both", s),
  "chrome.header": (s) => chromeScreen("header", s),

  "welcome.today": (s) => welcomeScreen("today", s),
  "welcome.page": (s) => welcomeScreen("page", s),
  "welcome.card": (s) => welcomeScreen("card", s),
  "welcome.sheet": (s) => welcomeScreen("sheet", s),

  "theirs.none": (s) => theirsScreen("none", s),
  "theirs.chip": (s) => theirsScreen("chip", s),
  "theirs.strip": (s) => theirsScreen("strip", s),
  "theirs.mark": (s) => theirsScreen("mark", s),
};

export function GuestShapeBoard() {
  return <ExplorationBoard spec={GUEST_SHAPE} previews={PREVIEWS} />;
}

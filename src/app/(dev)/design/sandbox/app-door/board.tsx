"use client";

import "./app-door.css";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { APP_DOOR } from "./spec";
import { SCREENS, screenOf, Still, type ScreenId } from "./shells";
import { WELCOME_SCREENS, WelcomeFlowStack, type WelcomeShape } from "./welcome";

/**
 * ★ THE NUMBERS UNDER EVERY FRAME ARE MEASURED, NEVER COMPUTED (round one's
 * finding, kept whole into round two: docs/PROGRAM.md, "measure every tile
 * before it ships"). Each caption reads the laid-out DOM inside the frame's
 * own document once it settles: how many screens a flow really is, how far
 * it really runs, how many fields it really asks for. If the words above a
 * frame and the caption under it disagree, the caption is the truth.
 *
 * ★ SUBTRACTIVE. Round one measured a door, a surface, a page, a collision
 * and a failure; none of those asks is open any more, so their readers
 * (`doorRead`, `surfaceRead`, `pageRead`, `namedRead`, `failureRead`,
 * `returnRead`) and the DOM facts only they needed (`methodsIn`, `leadsWith`,
 * `hasTerms`, `pct`) are gone with them. `flowRead` is the one reader every
 * `tour` shape still needs, unchanged from what it measured for `welcome` in
 * round one.
 */

/* ── the measurement ─────────────────────────────────────────────────────── */

type Reader = (root: HTMLElement, win: Window) => string | null;

/**
 * Reads one fact out of the frame's own document.
 *
 * ★ THE OBSERVER IS THE FRAME'S, NOT THE LAB PAGE'S. The subtree lives in the
 * iframe's document, so it is observed with THAT window's `ResizeObserver`. It
 * fires when the copied stylesheets land, because the first layout is
 * unstyled, and again whenever a new option re-flows. The late pass covers
 * what an observer cannot see: photographs decoding at their natural heights
 * inside columns that never changed width.
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
    const late = win.setTimeout(run, 1400);
    return () => {
      ro.disconnect();
      win.clearTimeout(late);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

/**
 * Every field a person has to fill.
 *
 * ★ BY EXCLUSION, NOT BY ALLOW-LIST (round one's finding). The shipped name
 * input sets no `type` at all, so an allow-list of types measured the welcome
 * flow at "0 fields asked for" while drawing a required name field.
 */
const fieldsIn = (root: HTMLElement) =>
  root.querySelectorAll<HTMLElement>(
    "input:not([type='hidden']):not([type='checkbox']):not([type='radio']):not([type='button']):not([type='submit'])",
  ).length;

/** A whole flow: how many screens, how far it runs, how many fields in all. */
const flowRead: Reader = (root) => {
  const screens = root.querySelectorAll<HTMLElement>("[data-ad-screen]");
  if (screens.length === 0) return null;
  const first = screens[0].getBoundingClientRect().top;
  const last = screens[screens.length - 1].getBoundingClientRect().bottom;
  const run = Math.round(last - first);
  if (run < 8) return null;
  const fields = fieldsIn(root);
  return `Measured: ${screens.length} screen${screens.length === 1 ? "" : "s"}, ${run} px of flow, ${fields} field${fields === 1 ? "" : "s"} asked for in all.`;
};

/* ── the frame ───────────────────────────────────────────────────────────── */

function Screen({
  id,
  screen,
  caption,
  read,
  children,
}: {
  id: string;
  screen: ScreenId;
  caption: string;
  read: Reader;
  children: ReactNode;
}) {
  const { w, h, name } = SCREENS[screen];
  // ★ A MEASUREMENT GOES STALE WHEN A KNOB CHANGES, AND THAT IS HOW A CAPTION
  // LIES (round one's finding). `Screen` sits in the same slot whatever the
  // option or the knob, so React keeps its state and the Probe's mount effect
  // never runs again unless the tag changes. The sentence is therefore
  // STAMPED with the picture it was read from and ignored the moment they
  // disagree, and the key remounts the Probe so a new one arrives.
  const tag = `${id}-${screen}`;
  const [said, setSaid] = useState<{ tag: string; text: string } | null>(null);
  const text = said?.tag === tag ? said.text : null;
  return (
    <Frame
      id={`ad-${id}-${screen}`}
      w={w}
      h={h}
      title={`${w} x ${h}, ${name}`}
      caption={text ? `${caption} ${text}` : caption}
    >
      <Probe key={tag} read={read} onRead={(s) => setSaid({ tag, text: s })}>
        <Still>{children}</Still>
      </Probe>
    </Frame>
  );
}

const screenFor = (s: BoardState): ScreenId => screenOf(s.screen);

/* ── the tour, four whole shapes ─────────────────────────────────────────── */

const TOUR_CAPTION: Record<WelcomeShape, string> = {
  cards:
    "Today, corrected to the current copy. The name, then the shipped three-step tutorial with its dots.",
  stage:
    "The name, three real screens of the product with the copy beside each, then a dimmed peek at the wizard.",
  film:
    "The name, three of the twelve bespoke pictures in motion with the copy overlapping each, then a fourth closing it.",
  one: "The name, one line of promise, and the two doors. Nothing else.",
};

function tourScreen(shape: WelcomeShape, s: BoardState) {
  const screen = screenFor(s);
  const of = WELCOME_SCREENS[shape];
  return (
    <Screen
      id={`tour-${shape}`}
      screen={screen}
      read={flowRead}
      caption={`${TOUR_CAPTION[shape]} ${of} screen${of === 1 ? "" : "s"} between the code and the dashboard.`}
    >
      <WelcomeFlowStack shape={shape} screen={screen} />
    </Screen>
  );
}

const PREVIEWS: PreviewsFor<typeof APP_DOOR> = {
  "tour.cards": (s) => tourScreen("cards", s),
  "tour.stage": (s) => tourScreen("stage", s),
  "tour.film": (s) => tourScreen("film", s),
  "tour.one": (s) => tourScreen("one", s),
};

export function AppDoorBoard() {
  return <ExplorationBoard spec={APP_DOOR} previews={PREVIEWS} />;
}

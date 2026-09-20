"use client";

import "./demo-event.css";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  Door,
  type DoorShape,
  type PlaceId,
  placeOf,
  SCREENS,
  type ScreenId,
  screenOf,
} from "./doors";
import { DEMO_EVENT } from "./spec";

/**
 * THE DOOR BOARD, ROUND TWO. Round one's other six decisions are ruled and
 * wired whole by `demo-wiring` (see `spec.ts`'s `history`), so this file keeps
 * only what the one open question needs: the object at each of its four
 * places, measured rather than asserted, exactly as round one's own `Probe`
 * did (its header star: a board once drew a caption whose sign disagreed with
 * its picture, so every number here reads the frame's own laid-out DOM).
 */

/* ── the measurement ─────────────────────────────────────────────────────── */

type Reader = (root: HTMLElement, win: Window) => string | null;

/**
 * Reads one fact out of the frame's own document. Unchanged from round one:
 * the observer is the FRAME's window, not the lab page's, and a late pass
 * covers a photograph decoding after the first layout.
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
    const late = win.setTimeout(run, 1500);
    return () => {
      ro.disconnect();
      win.clearTimeout(late);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

/**
 * What the door spends, and how much of it is photograph. A door with no
 * `[data-de-door]` node (the nav pane under `stage`) is a real answer, not a
 * missing one: the pane stays a clean column, which is the option's own claim.
 */
const doorRead: Reader = (root) => {
  const door = root.querySelector<HTMLElement>("[data-de-door]");
  if (!door)
    return "Measured: nothing stands here; the pane keeps its plain column.";
  const box = door.getBoundingClientRect();
  const size = `${Math.round(box.width)} by ${Math.round(box.height)} px`;
  const shots = door.querySelectorAll("img").length;
  return `Measured: the object is ${size}, ${shots} photograph${shots === 1 ? "" : "s"} and one code.`;
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
  const [said, setSaid] = useState<string | null>(null);
  const { w, h, name } = SCREENS[screen];
  const frameId = `de-${id}-${screen}`;
  return (
    <Frame
      // ★ KEYED ON ITS OWN FULL ID, SO A SWITCH REMOUNTS RATHER THAN REUSES.
      // Every option shares this one call site (`doorScreen`), so with no key
      // React updates the same Probe in place on a shape or place switch: its
      // one-shot effect (`[]` deps) never reruns and the ResizeObserver stays
      // attached to whatever it first observed, so a caption can go on
      // reporting the PREVIOUS option's measurement under the NEW option's
      // picture. The key forces a fresh Probe (and a fresh iframe) per
      // combination, which is what "the caption is the truth" needs.
      key={frameId}
      id={frameId}
      w={w}
      h={h}
      title={`${w} x ${h}, ${name}`}
      caption={said ? `${caption} ${said}` : caption}
    >
      <Probe read={read} onRead={setSaid}>
        {children}
      </Probe>
    </Frame>
  );
}

const screenFor = (s: BoardState): ScreenId => screenOf(s.screen);

/* ── what a door promises, per place ─────────────────────────────────────── */

/**
 * ★ PLACE-AWARE, BECAUSE TODAY IS UNEVEN (doors.tsx's own second star). Only
 * the footer already carries an object; the hero's plate is bare on its real
 * corridor, a feature page's line is words alone, and the nav pane is empty.
 * So `pile`'s caption at the hero and the line says what it really is: a
 * proposal, not a picture of today.
 */
const DOOR_CAPTION: Record<PlaceId, Record<DoorShape, string>> = {
  hero: {
    pile: "Proposed: the footer's fan, swapped in for today's bare plate.",
    frame: "One photograph in a mat, the code tucked into its corner.",
    stage: "The album's own scatter, settled, the code centred over it.",
    ticket: "A stub redrawn from the retired ticket, no label this time.",
  },
  footer: {
    pile: "Today, unchanged: the real FooterDemo, fanned under the plate.",
    frame: "The same frame, at the footer's own size.",
    stage: "The same scatter, at the footer's own size.",
    ticket: "The same stub, at the footer's own size.",
  },
  line: {
    pile: "Proposed: today is words alone; this adds three photographs.",
    frame: "Proposed: today is words alone; this adds one photograph.",
    stage: "Proposed: today is words alone; this adds the settled scatter.",
    ticket: "Proposed: today is words alone; this adds the stub.",
  },
  nav: {
    pile: "New: the pile, small, in the pane the retired ticket left empty.",
    frame: "New: the frame, in the pane the retired ticket left empty.",
    stage: "Nothing stands here: the pane stays a clean column.",
    ticket: "New: the stub, in the pane the retired ticket left empty.",
  },
};

/** The nav pane's real surface is a desktop hover; a phone has no equivalent
 *  to judge, so every shape shares one honest caption there instead of four
 *  captions measuring a surface that does not exist. */
const NAV_PHONE_CAPTION =
  "The panel is desktop-only; a phone's Features opens the full-screen menu instead.";

function doorScreen(shape: DoorShape, s: BoardState) {
  const screen = screenFor(s);
  const place = placeOf(s.place);
  const phoneNav = place === "nav" && screen === "375";
  return (
    <Screen
      id={`door-${shape}-${place}`}
      screen={screen}
      read={doorRead}
      caption={phoneNav ? NAV_PHONE_CAPTION : DOOR_CAPTION[place][shape]}
    >
      <Door shape={shape} place={place} screen={screen} />
    </Screen>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof DEMO_EVENT> = {
  "door.pile": (s) => doorScreen("pile", s),
  "door.frame": (s) => doorScreen("frame", s),
  "door.stage": (s) => doorScreen("stage", s),
  "door.ticket": (s) => doorScreen("ticket", s),
};

export function DemoEventBoard() {
  return <ExplorationBoard spec={DEMO_EVENT} previews={PREVIEWS} />;
}

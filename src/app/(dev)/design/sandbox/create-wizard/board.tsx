"use client";

import "./create-wizard.css";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";

import { screenOf } from "./knobs";
import { type Mode } from "./pictures";
import { readBeat, readMode, readScreen, Scene, Story } from "./scene";
import { CREATE_WIZARD } from "./spec";
import type { Beside, Compare } from "./steps";
import { type Moment, type Shape, WizardScreen } from "./wizard";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is Create drawn whole for Maya
 * & Jay's wedding, from production's atoms (`Button`, `Logo`, `PhoneShell`,
 * the code's own renderer `StyledQr`) and production's readiness (the beat's
 * rail is `readiness(newEventFacts(...))`, the call the wizard makes), at a
 * phone or a laptop on the Screen knob. Every frame is titled with its
 * option's own name, read off the spec, and every caption is read off the
 * frame: the words a host reads, the picture's size, where the action sits.
 *
 * What a drawing is not: the camera is a stand-in (`disposable-mode` r3 draws
 * the real one tonight), the photographs are the marketing stills every board
 * reuses, the light is drawn in the lamp set's hues rather than by the Aurora's
 * engine (`create-wizard.css` says why), and nothing is wired.
 *
 * ★ ONE WORLD (`exploration.ts`'s `Preview`). The shape draws its camera step
 * in whatever compare the board holds and its beat in whatever stands beside
 * the code; the compare and the beat are drawn in the shape picked. Until he
 * answers, each wears its recommendation.
 */

/* ── reading the board's state ────────────────────────────────────────── */

const pick = <T extends string>(all: readonly T[], v: unknown, d: T): T =>
  all.includes(v as T) ? (v as T) : d;

const shapeOf = (s: BoardState) =>
  pick<Shape>(["card", "screen", "preview"], s.shape, "screen");
const compareOf = (s: BoardState) =>
  pick<Compare>(["rows", "night", "story"], s.mode, "night");
const besideOf = (s: BoardState) =>
  pick<Beside>(["lit", "scan", "guest"], s.hand, "scan");

/** An option's own name, off the spec, so the frame's title and the tile agree. */
const LABEL = (ask: string, option: string) => {
  const found = CREATE_WIZARD.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/* ── one screen ───────────────────────────────────────────────────────── */

function Screen({
  id,
  s,
  title,
  shape,
  compare,
  beside,
  moment,
  read,
}: {
  id: string;
  s: BoardState;
  title: string;
  shape: Shape;
  compare: Compare;
  beside: Beside;
  moment: Moment;
  read: typeof readScreen;
}) {
  const screen = screenOf(s.screen);
  return (
    <Scene id={id} screen={screen} title={title} measure={read}>
      <WizardScreen
        shape={shape}
        wide={screen === "1440"}
        compare={compare}
        beside={beside}
        moment={moment}
      />
    </Scene>
  );
}

/* ── 1. the shape: Create's four screens ──────────────────────────────── */

function shapePreview(s: BoardState, shape: Shape) {
  const name = LABEL("shape", shape);
  const common = { s, shape, compare: compareOf(s), beside: besideOf(s) };
  return (
    <Story screen={screenOf(s.screen)}>
      <Screen
        {...common}
        id={`cw-shape-${shape}-name`}
        title={`${name}: the name`}
        moment={{ step: 1 }}
        read={readScreen}
      />
      <Screen
        {...common}
        id={`cw-shape-${shape}-mode`}
        title={`${name}: how guests add`}
        moment={{ step: 2, picked: "album", open: false }}
        read={readMode}
      />
      <Screen
        {...common}
        id={`cw-shape-${shape}-code`}
        title={`${name}: the code's look`}
        moment={{ step: 3 }}
        read={readScreen}
      />
      <Screen
        {...common}
        id={`cw-shape-${shape}-live`}
        title={`${name}: the beat`}
        moment={{ step: 4 }}
        read={readBeat}
      />
    </Story>
  );
}

/* ── 2. comparing the album and the camera ────────────────────────────── */

function modePreview(s: BoardState, compare: Compare) {
  const name = LABEL("mode", compare);
  const common = { s, shape: shapeOf(s), compare, beside: besideOf(s) };
  const comparing =
    compare === "rows"
      ? "Compare unfolded"
      : compare === "night"
        ? "slid to the morning"
        : "both nights open";
  const at = (picked: Mode, open: boolean): Moment => ({
    step: 2,
    picked,
    open,
  });
  return (
    <Story screen={screenOf(s.screen)}>
      <Screen
        {...common}
        id={`cw-mode-${compare}-open`}
        title={`${name}: as the step opens`}
        moment={at("album", false)}
        read={readMode}
      />
      <Screen
        {...common}
        id={`cw-mode-${compare}-compare`}
        title={`${name}: ${comparing}`}
        moment={at("album", true)}
        read={readMode}
      />
      <Screen
        {...common}
        id={`cw-mode-${compare}-camera`}
        title={`${name}: the camera picked`}
        moment={at("camera", false)}
        read={readMode}
      />
    </Story>
  );
}

/* ── 3. what stands beside the code ───────────────────────────────────── */

function handPreview(s: BoardState, beside: Beside) {
  const name = LABEL("hand", beside);
  const common = { s, shape: shapeOf(s), compare: compareOf(s), beside };
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Screen
        {...common}
        id={`cw-hand-${beside}-lands`}
        title={`${name}: as it lands`}
        moment={{ step: 4 }}
        read={readBeat}
      />
      {beside === "scan" && (
        <Screen
          {...common}
          id={`cw-hand-${beside}-opened`}
          title={`${name}: her phone has opened it`}
          moment={{ step: 4, scanned: true }}
          read={readBeat}
        />
      )}
      {beside === "guest" && (
        <Screen
          {...common}
          id={`cw-hand-${beside}-camera`}
          title={`${name}: a disposable camera event`}
          moment={{ step: 4, mode: "camera" }}
          read={readBeat}
        />
      )}
    </Story>
  );
}

/* ── the map ──────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof CREATE_WIZARD> = {
  "shape.card": (s) => shapePreview(s, "card"),
  "shape.screen": (s) => shapePreview(s, "screen"),
  "shape.preview": (s) => shapePreview(s, "preview"),

  "mode.rows": (s) => modePreview(s, "rows"),
  "mode.night": (s) => modePreview(s, "night"),
  "mode.story": (s) => modePreview(s, "story"),

  "hand.lit": (s) => handPreview(s, "lit"),
  "hand.scan": (s) => handPreview(s, "scan"),
  "hand.guest": (s) => handPreview(s, "guest"),
};

export function CreateWizardBoard() {
  return <ExplorationBoard spec={CREATE_WIZARD} previews={PREVIEWS} />;
}

"use client";

import "./create-wizard.css";

import type { ReactNode } from "react";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";

import type { AddWay } from "./add";
import { BEAT_MID, type BeatWay } from "./beat";
import { ROOM_LOW } from "./fixtures";
import { type ScreenId, screenOf } from "./knobs";
import type { LookWay } from "./look";
import type { Flow } from "./room";
import {
  type Reader,
  readAdd,
  readBeat,
  readLook,
  readScreen,
  Scene,
  Story,
} from "./scene";
import { CREATE_WIZARD } from "./spec";
import {
  ANSWERS,
  type Held,
  LiveAdd,
  LiveLook,
  StillChange,
  StillStep,
  TryIt,
} from "./wizard";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is Create drawn in the room for
 * Maya & Jay's wedding, from production's atoms (`Button`, the code's own
 * renderer `StyledQr`) and production's readiness (the beat reads
 * `readiness(...)`, the call the wizard makes), at a phone or a laptop on the
 * Screen knob. Every frame is titled with its option's own name, read off the
 * spec, and every caption is read off the frame.
 *
 * Each decision opens on a live frame (Try it for the flow, the step as it
 * opens for the others) and then the frames a reviewer reads still. What a
 * drawing is not: the camera is this board's small redrawing of
 * `disposable-mode`'s picks, the photographs are the marketing stills every
 * board reuses, the light is drawn in the lamp set's hues rather than by the
 * Aurora's engine (`create-wizard.css` says why), and nothing is wired.
 *
 * ★ ONE WORLD (`exploration.ts`'s `Preview`). Every decision is drawn in what
 * the board holds for the other three; until he answers, each wears its
 * recommendation.
 */

/* ── reading the board's state ────────────────────────────────────────── */

const pick = <T extends string>(all: readonly T[], v: unknown, d: T): T =>
  all.includes(v as T) ? (v as T) : d;

const heldOf = (s: BoardState): Held => ({
  flow: pick<Flow>(["still", "slide", "carry"], s.flow, "carry"),
  add: pick<AddWay>(["pair", "switch", "stack"], s.add, "pair"),
  look: pick<LookWay>(["plate", "places", "four"], s.look, "places"),
  beat: pick<BeatWay>(["develop", "rise", "two"], s.beat, "develop"),
});

/** An option's own name, off the spec, so the frame's title and the tile agree. */
const LABEL = (ask: string, option: string) => {
  const found = CREATE_WIZARD.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/** One frame of an option: its title, its reader, its drawing. */
function Shot({
  id,
  screen,
  title,
  read,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  read: Reader;
  children: ReactNode;
}) {
  return (
    <Scene id={id} screen={screen} title={title} measure={read}>
      {children}
    </Scene>
  );
}

/* ── 1. from one screen to the next ───────────────────────────────────── */

function flowPreview(s: BoardState, flow: Flow) {
  const name = LABEL("flow", flow);
  const screen = screenOf(s.screen);
  const wide = screen === "1440";
  const held = { ...heldOf(s), flow };
  const id = `cw-flow-${flow}`;
  return (
    <Story screen={screen}>
      <Shot id={`${id}-try`} screen={screen} title={`${name}: Try it`} read={readScreen}>
        <TryIt held={held} wide={wide} />
      </Shot>
      <Shot
        id={`${id}-change`}
        screen={screen}
        title={`${name}: Continue, then Back`}
        read={readScreen}
      >
        <StillChange held={held} wide={wide} loop />
      </Shot>
      <Shot id={`${id}-add`} screen={screen} title={`${name}: how guests add`} read={readScreen}>
        <StillStep n={2} held={held} wide={wide} />
      </Shot>
      <Shot id={`${id}-look`} screen={screen} title={`${name}: the code's look`} read={readScreen}>
        <StillStep n={3} held={held} wide={wide} />
      </Shot>
    </Story>
  );
}

/* ── 2. how guests add, compared ──────────────────────────────────────── */

function addPreview(s: BoardState, add: AddWay) {
  const name = LABEL("add", add);
  const screen = screenOf(s.screen);
  const wide = screen === "1440";
  const held = { ...heldOf(s), add };
  const id = `cw-add-${add}`;
  return (
    <Story screen={screen}>
      <Shot id={`${id}-open`} screen={screen} title={`${name}: as the step opens`} read={readAdd}>
        <LiveAdd held={held} wide={wide} />
      </Shot>
      <Shot id={`${id}-morning`} screen={screen} title={`${name}: slid to the morning`} read={readAdd}>
        <StillStep n={2} held={held} wide={wide} answers={{ ...ANSWERS, hour: "morning" }} />
      </Shot>
      <Shot id={`${id}-camera`} screen={screen} title={`${name}: the camera picked`} read={readAdd}>
        <StillStep n={2} held={held} wide={wide} answers={{ ...ANSWERS, picked: "camera" }} />
      </Shot>
    </Story>
  );
}

/* ── 3. the code's look ───────────────────────────────────────────────── */

function lookPreview(s: BoardState, look: LookWay) {
  const name = LABEL("look", look);
  const screen = screenOf(s.screen);
  const wide = screen === "1440";
  const held = { ...heldOf(s), look };
  const id = `cw-look-${look}`;
  return (
    <Story screen={screen}>
      <Shot id={`${id}-open`} screen={screen} title={`${name}: as the step opens`} read={readLook}>
        <LiveLook held={held} wide={wide} />
      </Shot>
      <Shot id={`${id}-rounded`} screen={screen} title={`${name}: Rounded picked`} read={readLook}>
        <StillStep n={3} held={held} wide={wide} />
      </Shot>
    </Story>
  );
}

/* ── 4. the lit code arrives ──────────────────────────────────────────── */

function beatPreview(s: BoardState, beat: BeatWay) {
  const name = LABEL("beat", beat);
  const screen = screenOf(s.screen);
  const wide = screen === "1440";
  const held = { ...heldOf(s), beat };
  const id = `cw-beat-${beat}`;
  return (
    <Story screen={screen}>
      <Shot id={`${id}-arrives`} screen={screen} title={`${name}: as it arrives`} read={readBeat}>
        <StillStep
          n={4}
          held={held}
          wide={wide}
          answers={{ ...ANSWERS, beatAt: BEAT_MID[beat], beatLoop: true }}
        />
      </Shot>
      <Shot id={`${id}-rest`} screen={screen} title={`${name}: at rest`} read={readBeat}>
        <StillStep n={4} held={held} wide={wide} />
      </Shot>
      <Shot id={`${id}-room`} screen={screen} title={`${name}: her storage 92% used`} read={readBeat}>
        <StillStep n={4} held={held} wide={wide} answers={{ ...ANSWERS, r: ROOM_LOW }} />
      </Shot>
    </Story>
  );
}

/* ── the map ──────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof CREATE_WIZARD> = {
  "flow.still": (s) => flowPreview(s, "still"),
  "flow.slide": (s) => flowPreview(s, "slide"),
  "flow.carry": (s) => flowPreview(s, "carry"),

  "add.pair": (s) => addPreview(s, "pair"),
  "add.switch": (s) => addPreview(s, "switch"),
  "add.stack": (s) => addPreview(s, "stack"),

  "look.plate": (s) => lookPreview(s, "plate"),
  "look.places": (s) => lookPreview(s, "places"),
  "look.four": (s) => lookPreview(s, "four"),

  "beat.develop": (s) => beatPreview(s, "develop"),
  "beat.rise": (s) => beatPreview(s, "rise"),
  "beat.two": (s) => beatPreview(s, "two"),
};

export function CreateWizardBoard() {
  return <ExplorationBoard spec={CREATE_WIZARD} previews={PREVIEWS} />;
}

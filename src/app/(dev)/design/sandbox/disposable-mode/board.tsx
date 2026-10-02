"use client";

import "./disposable-mode.css";

import type { ReactNode } from "react";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
} from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import type { CameraId, VideoCount, VideoWay } from "./cam-shared";
import { Camera, cameraOf } from "./camera";
import { LEFT, LOOK_SET, NEXT_SCENE, PARTY, ROLL, SCENE } from "./fixtures";
import { LOOK_NAME, type LookId } from "./film";
import { screenOf, stockOf } from "./knobs";
import { LookAlbum, LookViewer } from "./look";
import { TryPhotos, useTriedPhotos } from "./try-photos";
import { MeasureButton } from "./measure";
import { all, reach, type Reader, said, Scene, Story, textOf } from "./scene";
import { DISPOSABLE_MODE } from "./spec";
import {
  DeleteShot,
  DialRoom,
  GlowRoom,
  HerShots,
  type RoomId,
  SheetRoom,
  StackRoom,
  WaitingScreen,
} from "./waiting";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option drawn whole on the surface it
 * ships on, a phone at 375 for everything a guest meets, the waiting room and
 * the developed album at 1440 on the knob. Every frame is titled with its
 * option's own name, read off the spec, and every caption is read off the
 * frame.
 *
 * ★ A STAGED DECISION IS DRAWN IN THE WORLD IT WAITS ON (`exploration.ts`'s
 * `Preview`): taking a video in the camera he picked, what a video costs in
 * that camera and that way of filming. Until he answers, each wears its
 * parent's recommendation, the kit's own rule.
 */

/* ── reading the board's state ────────────────────────────────────────── */

const pick = <T extends string>(
  all: readonly T[],
  v: unknown,
  fallback: T,
): T => (all.includes(v as T) ? (v as T) : fallback);

const recommended = (ask: string) =>
  DISPOSABLE_MODE.asks.find((a) => a.id === ask)?.recommended ?? "";

const cameraIn = (s: BoardState) =>
  cameraOf(s.camera, recommended("camera") as CameraId);

const waitingIn = (s: BoardState) =>
  pick<RoomId>(
    ["sheet", "stack", "glow", "dial"],
    s.waiting,
    recommended("waiting") as RoomId,
  );

const videoIn = (s: BoardState) =>
  pick<VideoWay>(
    ["hold", "switch", "button"],
    s.video,
    recommended("video") as VideoWay,
  );

/** An option's own name, off the spec, so the frame's title and the tile agree. */
const LABEL = (ask: string, option: string) => {
  const found = DISPOSABLE_MODE.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/* ── what the frames read ─────────────────────────────────────────────── */

/** The roll as the camera shows it: its ticks, its rim, its strip or its rail, and its count. */
const rollSays: Reader = (root) => {
  const parts: string[] = [];
  const lit = (sel: string) =>
    root.querySelector(sel)?.querySelectorAll('[data-tick="lit"]').length ?? 0;
  if (root.querySelector("[data-dm-ring]"))
    parts.push(`${lit("[data-dm-ring]")} of ${ROLL.shots} ticks lit`);
  if (root.querySelector("[data-dm-rim]"))
    parts.push(`${lit("[data-dm-rim]")} of ${ROLL.shots} rim segments lit`);
  const strip = root.querySelector<HTMLElement>("[data-dm-strip]");
  if (strip) parts.push(`the strip: ${strip.dataset.dmStrip}`);
  const rail = root.querySelector<HTMLElement>("[data-dm-rail]");
  if (rail) parts.push(`the rail at ${rail.dataset.dmRail}`);
  const count = textOf(root.querySelector("[data-dm-say]"));
  if (count) parts.push(`the count reads "${count}"`);
  return parts.length ? parts.join("; ") : null;
};

const doneSays = said("[data-dm-done] [data-dm-say]", (w) => `It says: "${w}"`);

/** What the waiting room holds in its middle, read off its own marks. */
const roomHolds: Reader = (root) => {
  const count = textOf(root.querySelector("[data-dm-count] p"));
  if (!count) return null;
  const sheet = root.querySelector<HTMLElement>("[data-dm-sheet]");
  const deck = root.querySelector<HTMLElement>("[data-dm-deck]");
  const dial = root.querySelector<HTMLElement>("[data-dm-dial]");
  const yours = root.querySelector("[data-dm-yours]");
  const middle = sheet
    ? `a sheet of ${sheet.querySelectorAll(".dm-cell").length} squares, ${sheet.querySelectorAll("[data-mine]").length} of them hers`
    : deck
      ? `a deck ${deck.dataset.dmDeck} edges deep, ${deck.querySelectorAll("[data-dm-tab]").length} tabs of hers`
      : dial
        ? `a dial of ${dial.dataset.dmDial}, ${dial.querySelectorAll("[data-dm-hers-dot]").length} dots of hers`
        : yours
          ? `${root.querySelectorAll(".dm-pool").length} pools of the party's colour; ${yours.querySelectorAll("[data-dm-hers-cell]").length} of hers below`
          : "nothing";
  return `The count: ${count}; in the middle, ${middle}`;
};

const hersSays: Reader = (root) => {
  const n = root.querySelectorAll("[data-dm-hers]").length;
  const del = root.querySelectorAll("[data-dm-delete]").length;
  const lead = textOf(root.querySelector("[data-dm-lead]"));
  return n ? `${n} of hers, ${del} with a Delete; "${lead}"` : null;
};

const askSays = said(
  "[data-dm-sheet-ask] [data-dm-say]",
  (w) => `The sheet asks: "${w}"`,
);

/* ── 1. The camera ────────────────────────────────────────────────────── */

function cameraPreview(id: CameraId): ReactNode {
  const name = LABEL("camera", id);
  return (
    <Story>
      <Scene
        id={`dm-camera-${id}-framing`}
        title={`${name}: framing her seventh`}
        measure={all(reach("The shutter"), rollSays)}
      >
        <Camera id={id} phase="framing" still={SCENE} left={LEFT} />
      </Scene>
      <Scene
        id={`dm-camera-${id}-after`}
        title={`${name}: the moment after`}
        measure={rollSays}
      >
        <Camera
          id={id}
          phase="after"
          still={NEXT_SCENE}
          left={LEFT - 1}
          taken={PARTY.hers + 1}
        />
      </Scene>
      <Scene
        id={`dm-camera-${id}-done`}
        title={`${name}: her 24th, the roll done`}
        measure={doneSays}
      >
        <Camera id={id} phase="done" still={SCENE} left={0} />
      </Scene>
    </Story>
  );
}

/* ── 2. Taking a video ────────────────────────────────────────────────── */

function videoPreview(s: BoardState, way: VideoWay): ReactNode {
  const camera = cameraIn(s);
  const name = LABEL("video", way);
  return (
    <Story>
      <Scene
        id={`dm-video-${way}-framing`}
        title={`${name}: framing, on a paid event`}
        measure={all(
          reach("The shutter"),
          (root) =>
            textOf(root.querySelector("[data-dm-hint]")) ||
            (root.querySelector("[data-dm-modes]")
              ? "a Photo and Video switch"
              : "no line"),
        )}
      >
        <Camera
          id={camera}
          phase="framing"
          still={NEXT_SCENE}
          left={LEFT}
          video={way}
        />
      </Scene>
      <Scene
        id={`dm-video-${way}-recording`}
        title={`${name}: four seconds into a video`}
        measure={said("[data-dm-rec]", (w) => `It reads "${w}"`)}
      >
        <Camera
          id={camera}
          phase="recording"
          still={NEXT_SCENE}
          left={LEFT}
          video={way}
          seconds={4}
        />
      </Scene>
    </Story>
  );
}

/* ── 3. What a video costs ────────────────────────────────────────────── */

/**
 * Her counts by what a video costs: just after a six-second video (her
 * seventh act of the night), and her shots before it (five photos and the
 * video at 9:55, as her shots list them).
 */
const COUNTS: Record<
  VideoCount,
  { after: number; videos?: number; lead: string }
> = {
  one: {
    after: LEFT - 1,
    lead: `6 of ${ROLL.shots} spent · a video is one shot`,
  },
  three: {
    after: ROLL.shots - 5 - 6,
    lead: `8 of ${ROLL.shots} spent · a video spends three`,
  },
  own: {
    after: ROLL.shots - 5,
    videos: 1,
    lead: `5 photos of ${ROLL.shots} · 1 video of 3`,
  },
};

function costPreview(s: BoardState, count: VideoCount): ReactNode {
  const camera = cameraIn(s);
  const way = videoIn(s);
  const name = LABEL("cost", count);
  const c = COUNTS[count];
  return (
    <Story>
      <Scene
        id={`dm-cost-${count}-after`}
        title={`${name}: just after a six-second video`}
        measure={rollSays}
      >
        <Camera
          id={camera}
          phase="after"
          still={SCENE}
          left={c.after}
          taken={PARTY.hers + 1}
          video={way}
          count={count}
          videosLeft={c.videos}
          afterVideo
        />
      </Scene>
      <Scene
        id={`dm-cost-${count}-hers`}
        title={`${name}: her shots, the video among them`}
        measure={said("[data-dm-lead]", (w) => `Her shots: "${w}"`)}
      >
        <WaitingScreen wide={false}>
          <HerShots room={waitingIn(s)} lead={c.lead} />
        </WaitingScreen>
      </Scene>
    </Story>
  );
}

/* ── 4. The waiting room ──────────────────────────────────────────────── */

function roomFor(id: RoomId): ReactNode {
  if (id === "stack") return <StackRoom />;
  if (id === "glow") return <GlowRoom />;
  if (id === "dial") return <DialRoom />;
  return <SheetRoom />;
}

function waitingPreview(s: BoardState, id: RoomId): ReactNode {
  const screen = screenOf(s.screen);
  const wide = screen === "1440";
  const name = LABEL("waiting", id);
  return (
    <Story screen={screen}>
      <Scene
        id={`dm-waiting-${id}-room`}
        screen={screen}
        title={`${name}: ${PARTY.time}, a shot lands`}
        measure={roomHolds}
      >
        <WaitingScreen wide={wide}>{roomFor(id)}</WaitingScreen>
      </Scene>
      <Scene
        id={`dm-waiting-${id}-hers`}
        screen={screen}
        title={`${name}: her shots, opened`}
        measure={hersSays}
      >
        <WaitingScreen wide={wide}>
          <HerShots
            room={id}
            lead={`${PARTY.hers} of ${ROLL.shots} · only you see these`}
          />
        </WaitingScreen>
      </Scene>
      <Scene
        id={`dm-waiting-${id}-delete`}
        screen={screen}
        title={`${name}: deleting one`}
        measure={askSays}
      >
        <WaitingScreen wide={wide}>
          <DeleteShot room={id} />
        </WaitingScreen>
      </Scene>
    </Story>
  );
}

/* ── 5. The look ──────────────────────────────────────────────────────── */

type LookOption = "none" | "grain" | "stocks";

/** The look an option draws: none, the grain alone, or the colour look on the knob. */
const lookOf = (option: LookOption, s: BoardState): LookId =>
  option === "none" ? "clean" : option === "grain" ? "grain" : stockOf(s.stock);

const albumSays: Reader = (root) => {
  const album = root.querySelector<HTMLElement>("[data-dm-album]");
  if (!album) return null;
  const n = album.querySelectorAll(".dm-film").length;
  const look = album.dataset.dmAlbum as LookId;
  return `${n} photographs in ${album.dataset.dmRows} rows, ${look === "clean" ? "as taken" : `wearing ${LOOK_NAME[look]}`}`;
};

/**
 * THE LOOK'S FRAMES, IN THE SET OR IN THE READER'S OWN: a component, so it
 * can hear the dock's Try your photos and redraw every frame in them.
 */
function LookFrames({ s, option }: { s: BoardState; option: LookOption }) {
  const mine = useTriedPhotos();
  const set = mine.length ? mine : LOOK_SET;
  const look = lookOf(option, s);
  const screen = screenOf(s.screen);
  const wide = screen === "1440";
  const name = LABEL("look", option);
  // Up close: the club's coloured light and an overcast sky, the two a look
  // most often gets wrong (or the reader's first two).
  const close = mine.length
    ? [mine[0], mine[1] ?? mine[0]]
    : [LOOK_SET[1], LOOK_SET[7]];
  return (
    <Story screen={screen}>
      <Scene
        id={`dm-look-${option}-album`}
        screen={screen}
        title={`${name}: the album at ${MORNING_TIME}`}
        measure={albumSays}
      >
        <LookAlbum set={set} look={look} wide={wide} own={mine.length > 0} />
      </Scene>
      {close.slice(0, wide ? 1 : 2).map((still, i) => (
        <Scene
          key={i}
          id={`dm-look-${option}-close-${i + 1}`}
          screen={screen}
          title={`${name}: up close, ${still.light.toLowerCase()}`}
          measure={said("[data-dm-light]", (w) => `Under it: "${w}"`)}
        >
          <LookViewer still={still} look={look} wide={wide} />
        </Scene>
      ))}
    </Story>
  );
}

const MORNING_TIME = "9:02 am";

/* ── the map ──────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof DISPOSABLE_MODE> = {
  "camera.viewfinder": cameraPreview("viewfinder"),
  "camera.shutter": cameraPreview("shutter"),
  "camera.rim": cameraPreview("rim"),
  "camera.reel": cameraPreview("reel"),
  "camera.timeline": cameraPreview("timeline"),
  "camera.scroll": cameraPreview("scroll"),

  "video.hold": (s) => videoPreview(s, "hold"),
  "video.switch": (s) => videoPreview(s, "switch"),
  "video.button": (s) => videoPreview(s, "button"),

  "cost.one": (s) => costPreview(s, "one"),
  "cost.three": (s) => costPreview(s, "three"),
  "cost.own": (s) => costPreview(s, "own"),

  "waiting.sheet": (s) => waitingPreview(s, "sheet"),
  "waiting.stack": (s) => waitingPreview(s, "stack"),
  "waiting.glow": (s) => waitingPreview(s, "glow"),
  "waiting.dial": (s) => waitingPreview(s, "dial"),

  "look.none": (s) => <LookFrames s={s} option="none" />,
  "look.grain": (s) => <LookFrames s={s} option="grain" />,
  "look.stocks": (s) => <LookFrames s={s} option="stocks" />,
};

export function DisposableModeBoard() {
  return (
    <ExplorationBoard
      spec={DISPOSABLE_MODE}
      previews={PREVIEWS}
      dock={() => (
        <>
          <TryPhotos />
          <MeasureButton />
        </>
      )}
    />
  );
}

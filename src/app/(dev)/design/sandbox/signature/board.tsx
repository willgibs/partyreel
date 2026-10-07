"use client";

import "./signature.css";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";

import { AddBeat, AddPlaying, type AddWay, type Beat, BEAT_TITLE } from "./add";
import { Dock, GuestAlbum, Ring, type RingBeat } from "./album";
import { CameraFilming, type ClipMoment, type ClipWay } from "./camera";
import { CreateScreen, type CreateStep, type CreateWay } from "./create";
import { DoorScene, type DoorStep, type DoorWay } from "./door";
import { ALBUM, COVER } from "./fixtures";
import { HubScreen } from "./hub";
import { type Ground, groundOf, type Screen, screenOf } from "./knobs";
import { albumLight, edgeLight } from "./light";
import {
  find,
  lightsIn,
  parts,
  type Reader,
  Scene,
  Story,
  textOf,
} from "./scene";
import { SIGNATURE } from "./spec";

/**
 * THE PREVIEWS, one per option, each a surface drawn as its moments: the
 * frames production would show at each, the option's light placed in them.
 * `spec.ts` says what each decision is; each drawing's file says what is
 * production's and what is a stand-in (`album.tsx`, `hub.tsx`, `add.tsx`,
 * `door.tsx`, `camera.tsx`, `create.tsx`).
 */

/* ── what the frames read ──────────────────────────────────────────────── */

const readLights: Reader = (root, win) => {
  if (!root.ownerDocument.querySelector("[data-sg-ground]")) return null;
  return lightsIn(root, win);
};

/** The Ring at this instant: production's state, and its glow as the frame paints it. */
const readRing: Reader = (root, win) => {
  const ring = find(root, "[data-sg-ring]");
  const shutter = ring?.querySelector<HTMLElement>("[data-slot='shutter']");
  const glow = ring?.querySelector<HTMLElement>(".shutter-glow");
  if (!ring || !shutter || !glow) return null;
  const opacity = Number(win.getComputedStyle(glow).opacity);
  return parts(
    `the Ring ${ring.dataset.sgRing}, ${shutter.dataset.state}`,
    `its glow at ${opacity.toFixed(2)}`,
    shutter.querySelector("[data-slot='shutter-count']")
      ? `${textOf(shutter.querySelector("[data-slot='shutter-count']"))} on its shoulder`
      : undefined,
  );
};

const readCamera: Reader = (root, win) => {
  const hint = find(root, "[data-cam-hint]");
  if (!hint) return null;
  const seam = find(root, "[data-sg-clip-seam]");
  const bloom = find(root, "[data-sg-bloom='clip']");
  const light = seam
    ? `a Seam under the picture, ${Math.round(seam.getBoundingClientRect().height)}px`
    : bloom
      ? `a Bloom round the picture at ${Number(win.getComputedStyle(bloom, "::before").opacity).toFixed(2)}`
      : "no light";
  return parts(`"${textOf(hint)}"`, light);
};

/* ── album: where its one light lives ──────────────────────────────────── */

type AlbumWay = "ring" | "seam" | "follow";

const albumOf = (v: string | undefined): AlbumWay =>
  v === "seam" || v === "follow" ? v : "ring";

/** The album's own light: its photographs', the Ring's colour. */
const ALBUM_LIGHT = albumLight(ALBUM.slice(0, 6).map((s) => s.id));
/** The cover's bottom edge: the Seam's colour. */
const EDGE_LIGHT = edgeLight(COVER.id);

/** The Ring's kind in an album answer: unlit at rest where the cover's Seam holds the album's light. */
const kindOf = (way: AlbumWay): RingBeat["kind"] =>
  way === "seam" ? "unlit" : "lit";

function AlbumStory({
  way,
  screen,
  ground,
}: {
  way: AlbumWay;
  screen: Screen;
  ground: Ground;
}) {
  const seam = way === "ring" ? null : EDGE_LIGHT;
  return (
    <Story screen={screen}>
      <Scene
        id={`sg-album-top-${way}`}
        screen={screen}
        ground={ground}
        title="The album's first screen"
        measure={readLights}
      >
        <GuestAlbum
          screen={screen}
          ground={ground}
          seam={seam}
          scroll={false}
        />
      </Scene>
      <Scene
        id={`sg-album-in-${way}`}
        screen={screen}
        ground={ground}
        title="Scrolled in, the Add at the foot"
        measure={readLights}
      >
        <GuestAlbum
          screen={screen}
          ground={ground}
          seam={seam}
          scroll
          dock={
            <Dock
              ring={
                <Ring
                  beat={{
                    kind: kindOf(way),
                    state: "idle",
                    lift: 0,
                    held: true,
                  }}
                  light={ALBUM_LIGHT}
                  ground={ground}
                />
              }
            />
          }
        />
      </Scene>
      {screen === "1440" ? (
        // At a laptop, where a host runs her party, her hub beside the guest's album: the light she already has.
        <Scene
          id={`sg-album-hub-${way}`}
          screen="1440"
          ground={ground}
          title="The host's hub, its Seam as wired"
          measure={readLights}
        >
          <HubScreen ground={ground} />
        </Scene>
      ) : null}
    </Story>
  );
}

/* ── add: how the Ring rests and answers ───────────────────────────────── */

/** A beat's frame: the album's foot, a phone's width, short enough to read the Ring. */
const FOOT_H = 440;
const BEATS: readonly Beat[] = ["rest", "landing", "landed", "guest"];

function AddStory({
  way,
  album,
  ground,
}: {
  way: AddWay;
  album: AlbumWay;
  ground: Ground;
}) {
  const kind = kindOf(album);
  return (
    <Story screen="375">
      <Scene
        id={`sg-add-play-${way}-${album}`}
        screen="375"
        ground={ground}
        height={FOOT_H}
        title="Playing: her run of three, then the party"
        measure={readRing}
      >
        <AddPlaying way={way} kind={kind} light={ALBUM_LIGHT} ground={ground} />
      </Scene>
      {BEATS.map((beat) => (
        <Scene
          key={beat}
          id={`sg-add-${beat}-${way}-${album}`}
          screen="375"
          ground={ground}
          height={FOOT_H}
          title={BEAT_TITLE[beat]}
          measure={readRing}
        >
          <AddBeat
            way={way}
            beat={beat}
            kind={kind}
            light={ALBUM_LIGHT}
            ground={ground}
          />
        </Scene>
      ))}
    </Story>
  );
}

/* ── door: the sheet's light ───────────────────────────────────────────── */

const DOOR_TITLE: Record<DoorStep, string> = {
  name: "Her first step: her name",
  photo: "Her last step: her first photo",
};

function DoorStory({
  way,
  screen,
  ground,
}: {
  way: DoorWay;
  screen: Screen;
  ground: Ground;
}) {
  // At a desk a frame is a stage's width: the one step that decides, both where the light grows between them.
  const steps: readonly DoorStep[] =
    screen === "1440" && way !== "grows" ? ["photo"] : ["name", "photo"];
  return (
    <Story screen={screen}>
      {steps.map((step) => (
        <Scene
          key={step}
          id={`sg-door-${step}-${way}`}
          screen={screen}
          ground={ground}
          title={DOOR_TITLE[step]}
          measure={readLights}
        >
          <DoorScene way={way} screen={screen} ground={ground} step={step} />
        </Scene>
      ))}
    </Story>
  );
}

/* ── clip: the camera, filming ─────────────────────────────────────────── */

const MOMENTS: readonly { moment: ClipMoment; title: string }[] = [
  { moment: "loud", title: "Four seconds in, the room's toast" },
  { moment: "quiet", title: "The same clip, a quiet moment" },
  { moment: "refused", title: "Its microphone refused: it films silence" },
];

function ClipStory({ way }: { way: ClipWay }) {
  return (
    <Story screen="375">
      <Scene
        id={`sg-clip-play-${way}`}
        screen="375"
        title="Playing: the toast's sound"
        measure={readCamera}
      >
        <CameraFilming way={way} moment="loud" playing />
      </Scene>
      {MOMENTS.map(({ moment, title }) => (
        <Scene
          key={moment}
          id={`sg-clip-${moment}-${way}`}
          screen="375"
          title={title}
          measure={readCamera}
        >
          <CameraFilming way={way} moment={moment} />
        </Scene>
      ))}
    </Story>
  );
}

/* ── create: the room's light ──────────────────────────────────────────── */

const CREATE_STEPS: readonly { step: CreateStep; title: string }[] = [
  { step: "name", title: "Its name" },
  { step: "style", title: "The album's style, Live picked" },
  { step: "close", title: "The close: her code made" },
];

function CreateStory({ way, screen }: { way: CreateWay; screen: Screen }) {
  return (
    <Story screen={screen}>
      {CREATE_STEPS.map(({ step, title }) => (
        <Scene
          key={step}
          id={`sg-create-${step}-${way}`}
          screen={screen}
          title={title}
          measure={readLights}
        >
          <CreateScreen way={way} step={step} />
        </Scene>
      ))}
    </Story>
  );
}

/* ── the map ───────────────────────────────────────────────────────────── */

const at = (s: BoardState) => screenOf(s.screen);
const on = (s: BoardState) => groundOf(s.ground);
const inAlbum = (s: BoardState) => albumOf(s.album);

const PREVIEWS: PreviewsFor<typeof SIGNATURE> = {
  "album.ring": (s) => <AlbumStory way="ring" screen={at(s)} ground={on(s)} />,
  "album.seam": (s) => <AlbumStory way="seam" screen={at(s)} ground={on(s)} />,
  "album.follow": (s) => (
    <AlbumStory way="follow" screen={at(s)} ground={on(s)} />
  ),
  "add.breath": (s) => (
    <AddStory way="breath" album={inAlbum(s)} ground={on(s)} />
  ),
  "add.still": (s) => (
    <AddStory way="still" album={inAlbum(s)} ground={on(s)} />
  ),
  "add.answer": (s) => (
    <AddStory way="answer" album={inAlbum(s)} ground={on(s)} />
  ),
  "add.party": (s) => (
    <AddStory way="party" album={inAlbum(s)} ground={on(s)} />
  ),
  "door.lamps": (s) => <DoorStory way="lamps" screen={at(s)} ground={on(s)} />,
  "door.seam": (s) => <DoorStory way="seam" screen={at(s)} ground={on(s)} />,
  "door.grows": (s) => <DoorStory way="grows" screen={at(s)} ground={on(s)} />,
  "door.none": (s) => <DoorStory way="none" screen={at(s)} ground={on(s)} />,
  "clip.red": <ClipStory way="red" />,
  "clip.seam": <ClipStory way="seam" />,
  "clip.bloom": <ClipStory way="bloom" />,
  "create.field": (s) => <CreateStory way="field" screen={at(s)} />,
  "create.dark": (s) => <CreateStory way="dark" screen={at(s)} />,
  "create.chosen": (s) => <CreateStory way="chosen" screen={at(s)} />,
};

export function SignatureBoard() {
  return <ExplorationBoard spec={SIGNATURE} previews={PREVIEWS} />;
}

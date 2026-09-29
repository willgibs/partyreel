"use client";

import "./disposable-mode.css";

import type { ReactNode } from "react";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import { optionId, optionLabel } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import type { CameraId, VideoCount, VideoWay } from "./cam-shared";
import { Camera, cameraOf } from "./camera";
import { HER_SHOTS, LEFT, NEXT_SCENE, PARTY, ROLL, SCENE } from "./fixtures";
import {
  CoverCard,
  type CreateShape,
  CreateStep,
  Hub,
  HostViewer,
  OpenAlbum,
  ReviewQueue,
  WaitCard,
} from "./host";
import { reviewOf, screenOf, stockOf } from "./knobs";
import { MeasureButton } from "./measure";
import { both, type Reader, reach, Scene, Story, textOf } from "./scene";
import { DISPOSABLE_MODE } from "./spec";
import { DownloadMenu, GuestViewer, type SaveId, SavedPhoto } from "./viewer";
import {
  DeleteShot,
  HerShots,
  PileRoom,
  StackRoom,
  StripRoom,
  TrayRoom,
  WaitingScreen,
} from "./waiting";
import { DarkroomWall, GlimpseWall, SlideshowWall } from "./wall";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option drawn whole on the surface it
 * ships on, a phone at 375 for everything a guest meets, the host's hub and
 * Create at 375 with 1440 on the knob, the room's screen at 16:9. Every frame
 * is titled with its option's own name, read off the spec, and every caption
 * is read off the frame.
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

const videoOf = (s: BoardState) =>
  pick<VideoWay>(["hold", "switch", "button"], s.video, "hold");

/** An option's own name, off the spec, so the frame's title and the tile agree. */
const LABEL = (ask: string, option: string) => {
  const found = DISPOSABLE_MODE.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/* ── what the frames read ─────────────────────────────────────────────── */

/** What one marked element says, framed in a sentence. */
const said =
  (selector: string, frame: (words: string) => string): Reader =>
  (root) => {
    const words = textOf(root.querySelector(selector));
    return words ? frame(words) : null;
  };

/** The roll as the camera shows it: the ring's lit ticks, or the strip's exposed frames. */
const rollSays: Reader = (root) => {
  const ring = root.querySelector<SVGElement>("[data-dm-ring]");
  const lit = ring?.querySelectorAll('[data-tick="lit"]').length;
  const strip = root.querySelector<HTMLElement>("[data-dm-strip]");
  const count = textOf(root.querySelector("[data-dm-say]"));
  const parts: string[] = [];
  if (ring) parts.push(`${lit} of ${ROLL.shots} ticks lit`);
  if (strip) parts.push(`the strip: ${strip.dataset.dmStrip}`);
  if (count) parts.push(`the count reads "${count}"`);
  return parts.length ? parts.join("; ") : null;
};

/** The phone's prompt, and the page's own line under it. */
const alertSays: Reader = (root) => {
  const asks = textOf(root.querySelector("[data-dm-alert] [data-dm-say]"));
  if (!asks) return null;
  const note = textOf(root.querySelector("[data-dm-note]"));
  return note
    ? `The phone asks: ${asks}; under it: "${note}"`
    : `The phone asks: ${asks}`;
};
const refusedSays = said(
  "[data-dm-refused] [data-dm-say]",
  (w) => `She reads: "${w}"`,
);

/** What the waiting room holds in its middle, read off its own marks. */
const roomHolds: Reader = (root) => {
  const count = textOf(root.querySelector("[data-dm-count] p"));
  if (!count) return null;
  const stack = root.querySelector<HTMLElement>("[data-dm-stack]");
  const tray = root.querySelector<HTMLElement>("[data-dm-tray]");
  const pile = root.querySelector<HTMLElement>("[data-dm-pile]");
  const roll = root.querySelector<HTMLElement>("[data-dm-roll]");
  const middle = roll
    ? `her roll, ${roll.dataset.dmRoll} frames exposed`
    : stack
      ? `her ${stack.dataset.dmStack} face down`
      : tray
        ? `her ${tray.dataset.dmTray} coming up in the tray`
        : pile
          ? `a pile of ${pile.querySelectorAll(".dm-pile-print").length} backs standing for ${count}, ${pile.querySelectorAll("[data-mine]").length} of them folded hers`
          : "nothing";
  return `The count: ${count}; in the middle, ${middle}`;
};

const hersSays: Reader = (root) => {
  const n = root.querySelectorAll("[data-dm-hers]").length;
  const del = root.querySelectorAll("[data-dm-delete]").length;
  return n ? `${n} of hers face up, ${del} with a Delete` : null;
};

const sheetSays = said(
  "[data-dm-sheet] [data-dm-say]",
  (w) => `The sheet asks: "${w}"`,
);

/** The wall's own words: the count, the arrival, the glimpse. */
const wallSays: Reader = (root) => {
  const count = textOf(root.querySelector("[data-dm-count] p"));
  const arrival = [...root.querySelectorAll("[data-dm-arrival]")]
    .map((e) => textOf(e))
    .join(", ");
  const glimpse =
    root.querySelector<HTMLElement>("[data-dm-glimpse]")?.dataset.dmGlimpse;
  const line = textOf(root.querySelector("[data-dm-say]"));
  const parts: string[] = [];
  if (count) parts.push(`the count: ${count}`);
  if (glimpse) parts.push(`the shot: ${glimpse}`);
  if (arrival) parts.push(`arrivals: ${arrival}`);
  if (line) parts.push(`"${line}"`);
  return parts.length ? parts.join("; ") : null;
};

/** What the host's album area shows, off its own mark. */
const albumSays: Reader = (root) => {
  const area = root.querySelector<HTMLElement>("[data-dm-album]");
  if (!area) return null;
  const tiles = area.querySelectorAll("[data-dm-tile]").length;
  const flag = area.querySelector("[data-dm-flag]") !== null;
  const line = textOf(area.querySelector("[data-dm-say]"));
  const review = textOf(
    root.querySelector('[data-dm-room-card="review"] span:last-child'),
  );
  const shows =
    area.dataset.dmAlbum === "open"
      ? `${tiles} photographs${flag ? ", one flagged" : ""}`
      : area.dataset.dmAlbum === "covered"
        ? "a cover"
        : "the darkroom";
  return `Her album: ${shows}; "${line}"; Review: ${review}`;
};

const viewerSays = said(
  "[data-dm-viewer] [data-dm-say]",
  (w) => `Under the photo: "${w}"`,
);
const reviewSays = said("[data-dm-review] [data-dm-say]", (w) => `"${w}"`);
const confirmSays = said(
  "[data-dm-confirm] [data-dm-say]",
  (w) => `She reads: "${w}"`,
);

/** Create's length and what the step shows. */
const createSays: Reader = (root) => {
  const card = root.querySelector("[data-dm-create]");
  if (!card) return null;
  const steps = card.querySelectorAll("[data-dm-steps] li").length;
  const defaults = card.querySelectorAll("[data-dm-defaults] > span").length;
  const pictures = card.querySelectorAll("[data-dm-thumb]").length;
  return `Create: ${steps} steps; this one shows ${pictures} picture${pictures === 1 ? "" : "s"}${defaults ? ` and the camera's ${defaults} defaults` : ""}`;
};

/* ── 1. The camera ────────────────────────────────────────────────────── */

function cameraPreview(s: BoardState, id: CameraId): ReactNode {
  const look = stockOf(s.stock);
  const name = LABEL("camera", id);
  return (
    <Story>
      <Scene
        id={`dm-camera-${id}-framing`}
        title={`${name}: framing her seventh`}
        measure={both(reach("The shutter"), rollSays)}
      >
        <Camera id={id} phase="framing" look={look} still={SCENE} left={LEFT} />
      </Scene>
      <Scene
        id={`dm-camera-${id}-after`}
        title={`${name}: the moment after`}
        measure={rollSays}
      >
        <Camera
          id={id}
          phase="after"
          look={look}
          still={NEXT_SCENE}
          left={LEFT - 1}
          taken={PARTY.hers + 1}
        />
      </Scene>
      <Scene
        id={`dm-camera-${id}-ask`}
        title={`${name}: 7:48 pm, her first press`}
        measure={alertSays}
      >
        <Camera
          id={id}
          phase="ask"
          look={look}
          still={SCENE}
          left={ROLL.shots}
        />
      </Scene>
      <Scene
        id={`dm-camera-${id}-refused`}
        title={`${name}: she tapped Don't Allow`}
        measure={refusedSays}
      >
        <Camera
          id={id}
          phase="refused"
          look={look}
          still={SCENE}
          left={ROLL.shots}
        />
      </Scene>
      <Scene
        id={`dm-camera-${id}-again`}
        title={`${name}: 10:40 pm, her iPhone asks again`}
        measure={alertSays}
      >
        <Camera id={id} phase="again" look={look} still={SCENE} left={LEFT} />
      </Scene>
    </Story>
  );
}

/* ── 2. The waiting room ──────────────────────────────────────────────── */

type WaitingId = "stack" | "tray" | "pile" | "strip";

function waitingPreview(s: BoardState, id: WaitingId): ReactNode {
  const look = stockOf(s.stock);
  const screen = screenOf(s.screen);
  const wide = screen === "1440";
  const name = LABEL("waiting", id);
  const latent = id === "tray";
  const room =
    id === "stack" ? (
      <StackRoom />
    ) : id === "tray" ? (
      <TrayRoom look={look} />
    ) : id === "pile" ? (
      <PileRoom />
    ) : (
      <StripRoom />
    );
  const lead =
    id === "tray"
      ? "Still coming up, even for you"
      : `${PARTY.hers} of ${ROLL.shots} · only you see these`;
  return (
    <Story screen={screen}>
      <Scene
        id={`dm-waiting-${id}-room`}
        screen={screen}
        title={`${name}: ${PARTY.time}`}
        measure={roomHolds}
      >
        <WaitingScreen wide={wide}>{room}</WaitingScreen>
      </Scene>
      <Scene
        id={`dm-waiting-${id}-hers`}
        screen={screen}
        title={`${name}: her shots, opened`}
        measure={hersSays}
      >
        <WaitingScreen wide={wide}>
          <HerShots look={look} latent={latent} lead={lead} />
        </WaitingScreen>
      </Scene>
      <Scene
        id={`dm-waiting-${id}-delete`}
        screen={screen}
        title={`${name}: deleting one`}
        measure={sheetSays}
      >
        <WaitingScreen wide={wide}>
          <DeleteShot look={look} latent={latent} />
        </WaitingScreen>
      </Scene>
    </Story>
  );
}

/* ── 3. The room's screen ─────────────────────────────────────────────── */

type WallId = "darkroom" | "slideshow" | "glimpse";

function wallFor(
  id: WallId,
  look: ReturnType<typeof stockOf>,
  landing: boolean,
) {
  if (id === "darkroom") return <DarkroomWall landing={landing} />;
  if (id === "slideshow")
    return <SlideshowWall look={look} landing={landing} />;
  return <GlimpseWall look={look} landing={landing} />;
}

function screenPreview(s: BoardState, id: WallId): ReactNode {
  const look = stockOf(s.stock);
  const name = LABEL("wall", id);
  return (
    <Story screen="wall">
      <Scene
        id={`dm-wall-${id}-rest`}
        screen="wall"
        title={`${name}: ${PARTY.time}`}
        measure={wallSays}
      >
        {wallFor(id, look, false)}
      </Scene>
      <Scene
        id={`dm-wall-${id}-lands`}
        screen="wall"
        title={`${name}: 10:41 pm, Priya's shot lands`}
        measure={wallSays}
      >
        {wallFor(id, look, true)}
      </Scene>
    </Story>
  );
}

/* ── 4. The host's peek ───────────────────────────────────────────────── */

type PeekId = "lands" | "covered" | "waits";

/** Held for her approval at 10:40 pm, with review on. */
const PENDING = 9;

/** Develop now, confirmed: the one door a host who waits has. */
function DevelopConfirm({ screen }: { screen: ReturnType<typeof screenOf> }) {
  return (
    <Hub
      screen={screen}
      review={false}
      area={<WaitCard review={false} pending={0} />}
      overlay={
        <>
          <div className="fixed inset-0 z-50 bg-black/40" aria-hidden />
          <div
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border bg-popover p-5 text-popover-foreground shadow-layer"
            data-dm-confirm
          >
            <p className="font-heading text-card-title" data-dm-say>
              Develop the roll now?
            </p>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              {`Everyone sees all ${PARTY.shots} shots and the reel premieres on every phone. New shots join the album straight away after that.`}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <span className="flex h-9 items-center justify-center rounded-action-sm border text-sm font-medium">
                Not yet
              </span>
              <span className="flex h-9 items-center justify-center rounded-action-sm bg-primary text-sm font-medium text-primary-foreground">
                Develop now
              </span>
            </div>
          </div>
        </>
      }
    />
  );
}

function peekPreview(s: BoardState, id: PeekId): ReactNode {
  const screen = screenOf(s.screen);
  const review = reviewOf(s.review);
  const look = stockOf(s.stock);
  const pending = review ? PENDING : 0;
  const name = LABEL("peek", id);
  const area =
    id === "lands" ? (
      <OpenAlbum look={look} screen={screen} />
    ) : id === "covered" ? (
      <CoverCard />
    ) : (
      <WaitCard review={review} pending={pending} />
    );
  const next =
    id === "lands" ? (
      <Scene
        id={`dm-peek-lands-out`}
        screen={screen}
        title={`${name}: taking a shot out`}
        measure={viewerSays}
      >
        <HostViewer look={look} />
      </Scene>
    ) : id === "covered" ? (
      <Scene
        id={`dm-peek-covered-look`}
        screen={screen}
        title={`${name}: after Look anyway`}
        measure={albumSays}
      >
        <Hub
          screen={screen}
          review={review}
          pending={pending}
          area={<OpenAlbum look={look} screen={screen} early />}
        />
      </Scene>
    ) : review ? (
      <Scene
        id={`dm-peek-waits-review`}
        screen={screen}
        title={`${name}: her Review queue`}
        measure={reviewSays}
      >
        <ReviewQueue look={look} pending={pending} screen={screen} />
      </Scene>
    ) : (
      <Scene
        id={`dm-peek-waits-develop`}
        screen={screen}
        title={`${name}: Develop now`}
        measure={confirmSays}
      >
        <DevelopConfirm screen={screen} />
      </Scene>
    );
  return (
    <Story screen={screen}>
      <Scene
        id={`dm-peek-${id}-hub`}
        screen={screen}
        title={`${name}: her hub at ${PARTY.time}`}
        measure={albumSays}
      >
        <Hub screen={screen} review={review} pending={pending} area={area} />
      </Scene>
      {next}
    </Story>
  );
}

/* ── 5. Create's step ─────────────────────────────────────────────────── */

function createPreview(s: BoardState, shape: CreateShape): ReactNode {
  const screen = screenOf(s.screen);
  const look = stockOf(s.stock);
  const camera = cameraOf(s.camera);
  const name = LABEL("create", shape);
  return (
    <Story screen={screen}>
      <Scene
        id={`dm-create-${shape}-open`}
        screen={screen}
        title={`${name}: the step as it opens`}
        measure={createSays}
      >
        <CreateStep
          screen={screen}
          shape={shape}
          picked="album"
          camera={camera}
          look={look}
        />
      </Scene>
      <Scene
        id={`dm-create-${shape}-camera`}
        screen={screen}
        title={`${name}: the camera picked`}
        measure={createSays}
      >
        <CreateStep
          screen={screen}
          shape={shape}
          picked="camera"
          camera={camera}
          look={look}
        />
      </Scene>
    </Story>
  );
}

/* ── 6. Taking a video ────────────────────────────────────────────────── */

function videoPreview(s: BoardState, way: VideoWay): ReactNode {
  const look = stockOf(s.stock);
  const camera = cameraOf(s.camera);
  const name = LABEL("video", way);
  return (
    <Story>
      <Scene
        id={`dm-video-${way}-framing`}
        title={`${name}: framing, on a paid event`}
        measure={both(
          reach("The shutter"),
          said("[data-dm-hint]", (w) => `"${w}"`),
        )}
      >
        <Camera
          id={camera}
          phase="framing"
          look={look}
          still={NEXT_SCENE}
          left={LEFT}
          video={way}
        />
      </Scene>
      <Scene
        id={`dm-video-${way}-recording`}
        title={`${name}: four seconds into a video`}
        measure={said(
          "[data-dm-rec], [data-dm-camera] [data-dm-say]",
          (w) => `It reads "${w}"`,
        )}
      >
        <Camera
          id={camera}
          phase="recording"
          look={look}
          still={NEXT_SCENE}
          left={LEFT}
          video={way}
          seconds={4}
        />
      </Scene>
      <Scene
        id={`dm-video-${way}-mic`}
        title={`${name}: her first press asks for the microphone too`}
        measure={alertSays}
      >
        <Camera
          id={camera}
          phase="ask"
          look={look}
          still={SCENE}
          left={ROLL.shots}
          video={way}
          mic
        />
      </Scene>
    </Story>
  );
}

/* ── 7. What a video costs ────────────────────────────────────────────── */

/** Her counts before and after a six second video, by what a video costs. */
const COUNTS: Record<
  VideoCount,
  { after: number; videos?: [number, number]; lead: string }
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
    videos: [2, 1],
    lead: `5 photos of ${ROLL.shots} · 1 video of 3`,
  },
};

function costPreview(s: BoardState, count: VideoCount): ReactNode {
  const look = stockOf(s.stock);
  const camera = cameraOf(s.camera);
  const way = videoOf(s);
  const name = LABEL("cost", count);
  const c = COUNTS[count];
  return (
    <Story>
      <Scene
        id={`dm-cost-${count}-after`}
        title={`${name}: just after a six second video`}
        measure={rollSays}
      >
        <Camera
          id={camera}
          phase="after"
          look={look}
          still={SCENE}
          left={c.after}
          taken={PARTY.hers + 1}
          video={way}
          count={count}
          videosLeft={c.videos?.[1]}
          afterVideo
        />
      </Scene>
      <Scene
        id={`dm-cost-${count}-hers`}
        title={`${name}: her shots, the video among them`}
        measure={said(
          "[data-dm-room] p.text-micro",
          (w) => `Her shots: "${w}"`,
        )}
      >
        <HerShots look={look} lead={c.lead} shots={HER_SHOTS} />
      </Scene>
    </Story>
  );
}

/* ── 8. Saving the look ───────────────────────────────────────────────── */

function savePreview(s: BoardState, id: SaveId): ReactNode {
  const look = stockOf(s.stock);
  const screen = screenOf(s.screen);
  const wide = screen === "1440";
  const name = LABEL("save", id);
  return (
    <Story screen={screen}>
      <Scene
        id={`dm-save-${id}-viewer`}
        screen={screen}
        title={`${name}: Save, at 9:02 am`}
        measure={viewerSays}
      >
        <GuestViewer save={id} look={look} wide={wide} />
      </Scene>
      {!wide && (
        <Scene
          id={`dm-save-${id}-photos`}
          title={`${name}: what lands in her Photos`}
          measure={said("[data-dm-photos] [data-dm-say]", (w) => `"${w}"`)}
        >
          <SavedPhoto save={id} look={look} />
        </Scene>
      )}
      <Scene
        id={`dm-save-${id}-all`}
        screen={screen}
        title={`${name}: Download all`}
        measure={said("[data-dm-download] [data-dm-say]", (w) => `"${w}"`)}
      >
        <DownloadMenu save={id} look={look} wide={wide} />
      </Scene>
    </Story>
  );
}

/* ── the map ──────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof DISPOSABLE_MODE> = {
  "camera.viewfinder": (s) => cameraPreview(s, "viewfinder"),
  "camera.body": (s) => cameraPreview(s, "body"),
  "camera.reel": (s) => cameraPreview(s, "reel"),
  "camera.wrapper": (s) => cameraPreview(s, "wrapper"),

  "waiting.stack": (s) => waitingPreview(s, "stack"),
  "waiting.tray": (s) => waitingPreview(s, "tray"),
  "waiting.pile": (s) => waitingPreview(s, "pile"),
  "waiting.strip": (s) => waitingPreview(s, "strip"),

  "wall.darkroom": (s) => screenPreview(s, "darkroom"),
  "wall.slideshow": (s) => screenPreview(s, "slideshow"),
  "wall.glimpse": (s) => screenPreview(s, "glimpse"),

  "peek.lands": (s) => peekPreview(s, "lands"),
  "peek.covered": (s) => peekPreview(s, "covered"),
  "peek.waits": (s) => peekPreview(s, "waits"),

  "create.cards": (s) => createPreview(s, "cards"),
  "create.phone": (s) => createPreview(s, "phone"),
  "create.compare": (s) => createPreview(s, "compare"),

  "video.hold": (s) => videoPreview(s, "hold"),
  "video.switch": (s) => videoPreview(s, "switch"),
  "video.button": (s) => videoPreview(s, "button"),

  "cost.one": (s) => costPreview(s, "one"),
  "cost.three": (s) => costPreview(s, "three"),
  "cost.own": (s) => costPreview(s, "own"),

  "save.original": (s) => savePreview(s, "original"),
  "save.save": (s) => savePreview(s, "save"),
  "save.ask": (s) => savePreview(s, "ask"),
  "save.always": (s) => savePreview(s, "always"),
};

export function DisposableModeBoard() {
  return (
    <ExplorationBoard
      spec={DISPOSABLE_MODE}
      previews={PREVIEWS}
      dock={() => <MeasureButton />}
    />
  );
}

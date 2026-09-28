"use client";

import "./disposable-mode.css";

import type { ReactNode } from "react";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import { optionId, optionLabel } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { BodyCamera, NativeCamera, NativeReview, Viewfinder } from "./camera";
import {
  EVENT_PASS,
  FRAMES,
  FULL_SHOT_BYTES,
  type Frame,
  freeRolls,
  freeShots,
  FREE_BYTES,
  HER_STILLS,
  HOST,
  LAB_SHOT_BYTES,
  LAST_HOUR,
  MB,
  MORNING,
  NEXT_SCENE,
  PARTY,
  POV_FREE_GUESTS,
  ROLL,
  ROLL_STILLS,
  SCENE,
} from "./fixtures";
import { LOOK_NAME, type LookId, lookFor } from "./film";
import {
  AlbumHead,
  AlbumPage,
  AreaHead,
  Bleed,
  CameraRow,
  Darkroom,
  FrameRows,
  ReelTile,
  StillRows,
} from "./guest";
import {
  CameraBlock,
  CreatePage,
  type CreateShape,
  HubOffer,
  PlanCover,
  type RevealId,
  SettingsSurface,
} from "./host";
import { screenOf, shotsOf } from "./knobs";
import { both, type Reader, reach, Scene, Story, textOf } from "./scene";
import { DISPOSABLE_MODE } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option drawn whole on the surface it
 * ships on, a phone at 375 for everything a guest meets, Create and Settings
 * at 375 with 1440 on the knob. Every frame is titled with its option's own
 * name, read off the spec, and every caption is read off the frame.
 *
 * ★ A STAGED DECISION IS DRAWN IN THE WORLD IT WAITS ON (`exploration.ts`'s
 * `Preview`): the look in the camera he picked, what the album shows while it
 * develops in the wait he picked, Create's one line saying the defaults his
 * other answers set, and the price in the Create he picked. Until he answers,
 * each wears its parent's recommendation, the kit's own rule.
 */

/* ── reading the board's state ────────────────────────────────────────── */

const pick = <T extends string>(
  all: readonly T[],
  v: unknown,
  fallback: T,
): T => (all.includes(v as T) ? (v as T) : fallback);

type CameraId = "phone" | "viewfinder" | "body";
type WaitingId = "count" | "frames" | "hers";
type PriceId = "full" | "lab" | "guests" | "paid";
type LookAnswer = "clean" | "film" | "stocks";

const cameraOf = (s: BoardState) =>
  pick<CameraId>(["phone", "viewfinder", "body"], s.camera, "viewfinder");
const revealOf = (s: BoardState) =>
  pick<RevealId>(["morning", "host", "hour", "live"], s.reveal, "morning");
const waitingOf = (s: BoardState) =>
  pick<WaitingId>(["count", "frames", "hers"], s.waiting, "frames");
const lookAnswerOf = (s: BoardState) =>
  pick<LookAnswer>(["clean", "film", "stocks"], s.look, "film");
const pickOf = (s: BoardState) =>
  pick<CreateShape>(["line", "cards", "step", "settings"], s.pick, "line");

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

/** Her shots left, as the album's chip says them. */
const leftChip = said("[data-dm-left]", (w) => `Beside the button: "${w}"`);

/** What the camera's count says, as she reads it. */
const countSays = said("[data-dm-say]", (w) => `The count reads "${w}"`);

/** The look the first photograph wears, read off its own marks. */
const wears: Reader = (root) => {
  const film = root.querySelector<HTMLElement>("[data-dm-look]");
  if (!film) return null;
  const look = film.dataset.dmLook as LookId;
  const stamp =
    film.querySelector<HTMLElement>("[data-dm-stamp]")?.dataset.dmStamp;
  return `It wears ${LOOK_NAME[look] ?? look}${stamp ? ` (${stamp})` : ""}`;
};

/** When the page says it develops, or that nothing waits. */
const whenSays: Reader = (root) => {
  if (!root.querySelector("[data-dm-stats]")) return null;
  const when = textOf(root.querySelector("[data-dm-when]"));
  return when
    ? `Under the count: "${when}"`
    : "Nothing on the page says a wait";
};

/** The reel tile's own line, where the reveal opens. */
const reelSays: Reader = (root) => {
  if (!root.querySelector("[data-dm-stats]")) return null;
  const line = textOf(root.querySelector("[data-dm-reel] .text-micro"));
  const when = textOf(root.querySelector("[data-dm-when]"));
  if (!line) return when ? `Under the count: "${when}"` : null;
  return when ? `"${when}"; the reel: "${line}"` : `The reel: "${line}"`;
};

/** What the album's first rows hold for her: photographs, frames, the darkroom. */
const albumHolds: Reader = (root) => {
  if (!root.querySelector("[data-dm-stats]")) return null;
  const photos = root.querySelectorAll("[data-dm-rows] .dm-film").length;
  const frames = root.querySelectorAll("[data-dm-frame]").length;
  const dark = root.querySelector("[data-dm-darkroom]") !== null;
  const parts = [
    `${photos} photograph${photos === 1 ? "" : "s"}`,
    `${frames} undeveloped frame${frames === 1 ? "" : "s"}`,
  ];
  return `Her album's first rows: ${parts.join(", ")}${dark ? ", and the darkroom's count" : ""}`;
};

/** Create's length and what its screen asks for. */
const createCounts: Reader = (root) => {
  const card = root.querySelector("[data-dm-create]");
  if (!card) return null;
  const steps = card.querySelectorAll("[data-dm-steps] li").length;
  const controls = card.querySelectorAll("[data-dm-control]").length;
  return `Create: ${steps} steps, ${controls} control${controls === 1 ? "" : "s"} on this screen`;
};

/** The camera's rows in Guest uploads, as the host meets them. */
const settingsRows: Reader = (root) => {
  const block = root.querySelector("[data-dm-camera-block]");
  if (!block) return null;
  const rows = block.querySelectorAll("[data-dm-row]").length;
  const locked = block.querySelector("[data-dm-lock]") !== null;
  if (locked) return "Guest uploads: the camera behind the Event Pass's lock";
  return `Guest uploads opens on the camera: ${rows} row${rows === 1 ? "" : "s"}, each changeable`;
};

const estimateSays = said("[data-dm-estimate]", (w) => `It says: "${w}"`);
const outSays = said("[data-dm-say]", (w) => `She reads: "${w}"`);
const offerSays = said(
  "[data-dm-offer] [data-dm-say]",
  (w) => `Under the cards: "${w}"`,
);
const planSays = said(
  "[data-dm-plan] [data-dm-say]",
  (w) => `The sheet leads: "${w}"`,
);

/* ── the world at 10:40 pm and the morning after ──────────────────────── */

const WHEN_PARTY: Record<RevealId, string | undefined> = {
  morning: `Develops tomorrow at ${ROLL.develops}`,
  host: `Develops when ${HOST.displayName} says`,
  hour: "Each shot develops an hour after it is taken",
  live: undefined,
};

/** Her new frame, the shot the camera decision just took. */
const JUST_TAKEN: Frame = {
  id: "f143",
  time: "10:41",
  ratio: 2 / 3,
  mine: true,
};

/**
 * THE ALBUM'S AREA WHILE THE ROLL DEVELOPS, as the `waiting` answer draws it
 * in the `reveal` world (`hour` develops an hour behind, so its rows are the
 * developed roll with the last hour waiting at their head).
 */
function WaitingArea({
  waiting,
  reveal,
  look,
  frames = FRAMES,
  shots = PARTY.shots,
}: {
  waiting: WaitingId;
  reveal: RevealId;
  look: LookId;
  frames?: readonly Frame[];
  /** The roll so far, which the area's own head says. */
  shots?: number;
}) {
  const when =
    reveal === "host" ? `when ${HOST.displayName} says` : `at ${ROLL.develops}`;
  if (reveal === "live") {
    return (
      <Bleed>
        <AlbumHead count={`${shots} shots`} />
        <StillRows stills={ROLL_STILLS} look={look} />
      </Bleed>
    );
  }
  if (reveal === "hour") {
    const developed = (
      <div className="mt-6">
        <AlbumHead count="138 developed" />
        <StillRows stills={ROLL_STILLS.slice(2)} look={look} />
      </div>
    );
    if (waiting === "count")
      return (
        <Bleed>
          <Darkroom
            shots={LAST_HOUR.length}
            when="From the last hour. The next develops at 11:12 pm."
            hers="One of them is yours."
          />
          {developed}
        </Bleed>
      );
    if (waiting === "hers")
      return (
        <Bleed>
          <AreaHead left="Yours, developed for you" right="2" />
          <StillRows stills={HER_STILLS.slice(0, 2)} look={look} />
          <p className="mt-3 px-0.5 text-working text-muted-foreground">
            3 more from the last hour, developing.
          </p>
          {developed}
        </Bleed>
      );
    return (
      <Bleed>
        <AreaHead
          left="4 from the last hour, developing"
          right="next 11:12 pm"
        />
        <FrameRows frames={LAST_HOUR} />
        {developed}
      </Bleed>
    );
  }
  if (waiting === "count")
    return (
      <Bleed>
        <Darkroom
          shots={shots}
          when={`The roll develops ${reveal === "host" ? `when ${HOST.displayName} says` : `tomorrow at ${ROLL.develops}`}.`}
          hers={`${PARTY.hers} of them are yours.`}
        />
      </Bleed>
    );
  if (waiting === "hers")
    return (
      <Bleed>
        <AreaHead left="Yours, developed for you" right={String(PARTY.hers)} />
        <StillRows stills={HER_STILLS} look={look} />
        <p className="mt-3 px-0.5 text-working text-muted-foreground">
          {`${shots - PARTY.hers} more developing, ${when}.`}
        </p>
      </Bleed>
    );
  return (
    <Bleed>
      <AreaHead
        left={`${shots} shots developing`}
        right={
          reveal === "host" ? `${HOST.displayName} develops it` : ROLL.develops
        }
      />
      <FrameRows frames={frames} />
    </Bleed>
  );
}

/** 10:40 pm at the party: the page, her count, and the roll developing. */
function PartyAlbum({
  reveal,
  waiting,
  look,
  left = ROLL.shots - PARTY.hers,
  frames,
  scroll,
}: {
  reveal: RevealId;
  waiting: WaitingId;
  look: LookId;
  left?: number;
  frames?: readonly Frame[];
  scroll?: boolean;
}) {
  return (
    <AlbumPage
      stats={`${PARTY.shots} shots from ${PARTY.guests} guests`}
      when={WHEN_PARTY[reveal]}
      camera={<CameraRow left={left} />}
      scroll={scroll}
    >
      {reveal === "live" && (
        <ReelTile
          still={ROLL_STILLS[0]}
          look={look}
          line="Live: every shot as it lands"
        />
      )}
      <WaitingArea
        waiting={waiting}
        reveal={reveal}
        look={look}
        frames={frames}
      />
    </AlbumPage>
  );
}

/** The whole roll, developed: the reel first, then the album in its look. */
function DevelopedAlbum({
  stats,
  when,
  reel,
  count,
  look,
  left,
}: {
  stats: string;
  when?: string;
  reel: string;
  count: string;
  look: LookId;
  left: number;
}) {
  return (
    <AlbumPage stats={stats} when={when} camera={<CameraRow left={left} />}>
      <ReelTile still={ROLL_STILLS[0]} look={look} line={reel} />
      <Bleed className="mt-3">
        <AlbumHead count={count} />
        <StillRows stills={ROLL_STILLS} look={look} />
      </Bleed>
    </AlbumPage>
  );
}

/* ── 1. The guest's camera ────────────────────────────────────────────── */

function cameraPreview(s: BoardState, option: CameraId): ReactNode {
  const look = lookFor(s.look);
  const name = LABEL("camera", option);
  const left = ROLL.shots - PARTY.hers;
  const back = (
    <Scene
      id={`dm-camera-${option}-back`}
      title={`${name}: back in the album`}
      measure={leftChip}
    >
      <PartyAlbum
        reveal={revealOf(s) === "live" ? "live" : revealOf(s)}
        waiting={waitingOf(s)}
        look={look}
        left={left - 1}
        frames={[JUST_TAKEN, ...FRAMES]}
      />
    </Scene>
  );
  if (option === "phone")
    return (
      <Story>
        <Scene
          id="dm-camera-phone-open"
          title={`${name}: it opens`}
          measure={reach("Its shutter")}
        >
          <NativeCamera still={SCENE} />
        </Scene>
        <Scene
          id="dm-camera-phone-review"
          title={`${name}: after the shot`}
          measure={reach("Retake")}
        >
          <NativeReview still={SCENE} />
        </Scene>
        {back}
      </Story>
    );
  if (option === "body")
    return (
      <Story>
        <Scene
          id="dm-camera-body-open"
          title={`${name}: framing her seventh`}
          measure={reach("The shutter")}
        >
          <BodyCamera still={SCENE} look={look} left={left} />
        </Scene>
        <Scene
          id="dm-camera-body-after"
          title={`${name}: after the shot`}
          measure={both(reach("The wheel"), countSays)}
        >
          <BodyCamera still={NEXT_SCENE} look={look} left={left} wind />
        </Scene>
      </Story>
    );
  return (
    <Story>
      <Scene
        id="dm-camera-viewfinder-open"
        title={`${name}: framing her seventh`}
        measure={reach("The shutter")}
      >
        <Viewfinder still={SCENE} look={look} left={left} />
      </Scene>
      <Scene
        id="dm-camera-viewfinder-after"
        title={`${name}: the moment after`}
        measure={countSays}
      >
        <Viewfinder
          still={NEXT_SCENE}
          look={look}
          left={left - 1}
          taken={PARTY.hers + 1}
        />
      </Scene>
    </Story>
  );
}

/* ── 2. The camera's look ─────────────────────────────────────────────── */

function lookPreview(s: BoardState, option: LookAnswer): ReactNode {
  const look: LookId =
    option === "clean" ? "clean" : option === "film" ? "warm" : "mono";
  const camera = cameraOf(s);
  const name = LABEL("look", option);
  const left = ROLL.shots - PARTY.hers;
  const framing =
    camera === "phone" ? (
      <NativeReview still={SCENE} look="clean" />
    ) : camera === "body" ? (
      <BodyCamera still={SCENE} look={look} left={left} />
    ) : (
      <Viewfinder still={SCENE} look={look} left={left} />
    );
  return (
    <Story>
      <Scene
        id={`dm-look-${option}-framing`}
        title={
          camera === "phone"
            ? `${name}: the phone's camera shows it plain`
            : `${name}: as she frames it`
        }
        measure={wears}
      >
        {framing}
      </Scene>
      <Scene
        id={`dm-look-${option}-album`}
        title={`${name}: the morning after`}
        measure={wears}
      >
        <DevelopedAlbum
          stats={`${MORNING.shots} shots from ${MORNING.guests} guests`}
          when={`Developed this morning at ${ROLL.develops}`}
          reel={`The roll, developed: ${MORNING.shots} shots`}
          count={`${MORNING.shots} shots`}
          look={look}
          left={4}
        />
      </Scene>
      {option === "stocks" && (
        <Scene
          id="dm-look-stocks-host"
          title={`${name}: the host picks it`}
          measure={settingsRows}
        >
          <SettingsSurface
            screen="375"
            camera={
              <CameraBlock
                control={pickOf(s) === "line" ? "switch" : "choice"}
                reveal={revealOf(s)}
                look="stocks"
              />
            }
          />
        </Scene>
      )}
    </Story>
  );
}

/* ── 3. When it develops ──────────────────────────────────────────────── */

function revealPreview(s: BoardState, option: RevealId): ReactNode {
  const look = lookFor(s.look);
  const waiting = waitingOf(s);
  const name = LABEL("reveal", option);
  const party = (
    <Scene
      id={`dm-reveal-${option}-party`}
      title={`${name}: ${PARTY.time}, at the party`}
      measure={whenSays}
    >
      <PartyAlbum reveal={option} waiting={waiting} look={look} />
    </Scene>
  );
  const moment: Record<RevealId, ReactNode> = {
    morning: (
      <Scene
        id="dm-reveal-morning-moment"
        title={`${name}: ${MORNING.time}, the next morning`}
        measure={reelSays}
      >
        <DevelopedAlbum
          stats={`${MORNING.shots} shots from ${MORNING.guests} guests`}
          when={`Developed this morning at ${ROLL.develops}`}
          reel={`The roll, developed: ${MORNING.shots} shots`}
          count={`${MORNING.shots} shots`}
          look={look}
          left={4}
        />
      </Scene>
    ),
    host: (
      <Scene
        id="dm-reveal-host-moment"
        title={`${name}: 11:48 pm, ${HOST.displayName} develops it`}
        measure={reelSays}
      >
        <DevelopedAlbum
          stats={`${MORNING.shots} shots from ${MORNING.guests} guests`}
          when={`${HOST.displayName} developed the roll at 11:48 pm`}
          reel={`The roll, developed: ${MORNING.shots} shots`}
          count={`${MORNING.shots} shots`}
          look={look}
          left={4}
        />
      </Scene>
    ),
    hour: (
      <Scene
        id="dm-reveal-hour-moment"
        title={`${name}: 11:41 pm, her 10:41 shot develops`}
        measure={reelSays}
      >
        <DevelopedAlbum
          stats="171 shots from 13 guests"
          when={WHEN_PARTY.hour}
          reel="The reel, an hour behind: up to 10:41 pm"
          count="167 developed"
          look={look}
          left={12}
        />
      </Scene>
    ),
    live: (
      <Scene
        id="dm-reveal-live-moment"
        title={`${name}: ${MORNING.time}, the next morning`}
        measure={reelSays}
      >
        <DevelopedAlbum
          stats={`${MORNING.shots} shots from ${MORNING.guests} guests`}
          reel={`${MORNING.shots} shots, as they were taken`}
          count={`${MORNING.shots} shots`}
          look={look}
          left={4}
        />
      </Scene>
    ),
  };
  return (
    <Story>
      {party}
      {moment[option]}
    </Story>
  );
}

/* ── 4. While it develops ─────────────────────────────────────────────── */

function waitingPreview(s: BoardState, option: WaitingId): ReactNode {
  const look = lookFor(s.look);
  // Asked of a roll that waits: where he picked one that develops straight
  // away, the question is drawn at the set time (its context says so).
  const reveal = revealOf(s) === "live" ? "morning" : revealOf(s);
  return (
    <Scene
      id={`dm-waiting-${option}`}
      title={`${LABEL("waiting", option)}: ${PARTY.time}`}
      measure={albumHolds}
    >
      <PartyAlbum reveal={reveal} waiting={option} look={look} />
    </Scene>
  );
}

/* ── 5. Turning it on ─────────────────────────────────────────────────── */

/** The one line Create says once the camera is on, in the world his other answers set. */
function defaultsLine(s: BoardState, shots: number = ROLL.shots): string {
  const reveal = revealOf(s);
  const look = lookAnswerOf(s);
  const develops: Record<RevealId, string> = {
    morning: `developed at ${ROLL.develops} the next morning`,
    host: "developed when you say",
    hour: "each developed an hour after it is taken",
    live: "in the album as they are taken",
  };
  const wearing =
    look === "film"
      ? " in the film look"
      : look === "stocks"
        ? " in the look you pick"
        : "";
  return `${shots} shots each on the album's own camera${wearing}, ${develops[reveal]}. Settings changes any of it.`;
}

function pickPreview(s: BoardState, option: CreateShape): ReactNode {
  const screen = screenOf(s.screen);
  const name = LABEL("pick", option);
  const block = (
    <CameraBlock
      control={option === "line" ? "switch" : "choice"}
      reveal={revealOf(s)}
      look={lookAnswerOf(s)}
    />
  );
  const settings = (
    <Scene
      id={`dm-pick-${option}-settings`}
      screen={screen}
      title={`${name}: Settings, afterwards`}
      measure={settingsRows}
    >
      <SettingsSurface screen={screen} camera={block} />
    </Scene>
  );
  return (
    <Story screen={screen}>
      <Scene
        id={`dm-pick-${option}-create`}
        screen={screen}
        title={`${name}: Create`}
        measure={createCounts}
      >
        <CreatePage screen={screen} shape={option} defaults={defaultsLine(s)} />
      </Scene>
      {option === "settings" && (
        <Scene
          id="dm-pick-settings-offer"
          screen={screen}
          title={`${name}: the new event offers it`}
          measure={offerSays}
        >
          <HubOffer screen={screen} />
        </Scene>
      )}
      {settings}
    </Story>
  );
}

/* ── 6. Its price ─────────────────────────────────────────────────────── */

/** "one guest's roll", "ten guests' rolls", "not one guest's roll". */
const rollsWords = (n: number) =>
  n === 0
    ? "not one guest's roll"
    : n === 1
      ? "one guest's roll"
      : `${n} guests' rolls`;

/** The one line the price decision adds under Shots each, at the knob's length. */
function Estimate({ option, shots }: { option: PriceId; shots: number }) {
  const pass = `An ${EVENT_PASS.name} (${EVENT_PASS.price}) develops any party.`;
  let words: string;
  if (option === "full")
    words = `At a phone's full size, Free develops about ${freeShots(FULL_SHOT_BYTES)} shots: ${rollsWords(freeRolls(FULL_SHOT_BYTES, shots))} of ${shots}. ${pass}`;
  else if (option === "lab")
    words = `Free develops about ${freeShots(LAB_SHOT_BYTES)} shots: ${rollsWords(freeRolls(LAB_SHOT_BYTES, shots))} of ${shots}. ${pass}`;
  else if (option === "guests") {
    const need = Math.ceil((POV_FREE_GUESTS * shots * LAB_SHOT_BYTES) / MB);
    words =
      need <= FREE_BYTES / MB
        ? `Free: up to ${POV_FREE_GUESTS} guests shoot on it, ${shots} each. An ${EVENT_PASS.name} (${EVENT_PASS.price}) opens it to everyone.`
        : `${POV_FREE_GUESTS} rolls of ${shots} need ${need} MB, past Free's ${FREE_BYTES / MB} MB, so ${shots} each needs an ${EVENT_PASS.name} (${EVENT_PASS.price}).`;
  } else
    words = `An ${EVENT_PASS.name} (${EVENT_PASS.price}) turns it on for this event, or any Pro plan.`;
  return (
    <p data-dm-estimate className="text-sm text-pretty text-muted-foreground">
      {words}
    </p>
  );
}

/** When the roll develops, as the end of a sentence about it. */
const DEVELOPS_TAIL: Record<RevealId, string> = {
  morning: `develops at ${ROLL.develops}`,
  host: `develops when ${HOST.displayName} says`,
  hour: "develops an hour after it was taken",
  live: "is already in the album",
};

/** Where a guest meets the end of a Free camera, by the lever that ends it. */
function endOf(option: Exclude<PriceId, "paid">, reveal: RevealId) {
  const tail = DEVELOPS_TAIL[reveal];
  if (option === "guests")
    return {
      title: "9:30 pm, the eleventh guest arrives",
      shots: 96,
      stats: `96 shots from ${POV_FREE_GUESTS} guests`,
      out: `${HOST.displayName}'s camera is full: ${POV_FREE_GUESTS} guests are shooting on it. ${
        reveal === "live"
          ? "You can still see everything they shoot."
          : reveal === "hour"
            ? "You'll see each shot an hour after it is taken."
            : `You'll see the roll when it ${tail}.`
      }`,
    };
  const shots = Math.floor(
    FREE_BYTES / (option === "full" ? FULL_SHOT_BYTES : LAB_SHOT_BYTES),
  );
  return {
    title:
      option === "full"
        ? "8:10 pm, the camera runs out"
        : "11:52 pm, the camera runs out",
    shots,
    stats: `${shots} shots from ${option === "full" ? 6 : 13} guests`,
    out: `${HOST.displayName}'s camera has run out of film. Everything shot so far ${tail}.`,
  };
}

function pricePreview(s: BoardState, option: PriceId): ReactNode {
  const shots = shotsOf(s.shots);
  const look = lookFor(s.look);
  const name = LABEL("price", option);
  const setup = (
    <Scene
      id={`dm-price-${option}-setup`}
      title={`${name}: ${HOST.displayName}, on Free, turns it on`}
      measure={option === "paid" ? settingsRows : estimateSays}
    >
      <SettingsSurface
        screen="375"
        camera={
          <CameraBlock
            control={pickOf(s) === "line" ? "switch" : "choice"}
            reveal={revealOf(s)}
            look={lookAnswerOf(s)}
            shots={shots}
            locked={option === "paid"}
            estimate={<Estimate option={option} shots={shots} />}
          />
        }
      />
    </Scene>
  );
  if (option === "paid")
    return (
      <Story>
        {setup}
        <Scene
          id="dm-price-paid-plan"
          title={`${name}: the lock opens the plan`}
          measure={planSays}
        >
          <PlanCover />
        </Scene>
      </Story>
    );
  const end = endOf(option, revealOf(s));
  return (
    <Story>
      {setup}
      <Scene
        id={`dm-price-${option}-end`}
        title={`${name}: ${end.title}`}
        measure={outSays}
      >
        <AlbumPage
          stats={end.stats}
          when={WHEN_PARTY[revealOf(s) === "live" ? "morning" : revealOf(s)]}
          camera={<CameraRow left={0} out={end.out} />}
        >
          <WaitingArea
            waiting={waitingOf(s)}
            reveal={revealOf(s) === "live" ? "morning" : revealOf(s)}
            look={look}
            shots={end.shots}
          />
        </AlbumPage>
      </Scene>
    </Story>
  );
}

/* ── the map ──────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof DISPOSABLE_MODE> = {
  "camera.phone": (s) => cameraPreview(s, "phone"),
  "camera.viewfinder": (s) => cameraPreview(s, "viewfinder"),
  "camera.body": (s) => cameraPreview(s, "body"),

  "look.clean": (s) => lookPreview(s, "clean"),
  "look.film": (s) => lookPreview(s, "film"),
  "look.stocks": (s) => lookPreview(s, "stocks"),

  "reveal.morning": (s) => revealPreview(s, "morning"),
  "reveal.host": (s) => revealPreview(s, "host"),
  "reveal.hour": (s) => revealPreview(s, "hour"),
  "reveal.live": (s) => revealPreview(s, "live"),

  "waiting.count": (s) => waitingPreview(s, "count"),
  "waiting.frames": (s) => waitingPreview(s, "frames"),
  "waiting.hers": (s) => waitingPreview(s, "hers"),

  "pick.line": (s) => pickPreview(s, "line"),
  "pick.cards": (s) => pickPreview(s, "cards"),
  "pick.step": (s) => pickPreview(s, "step"),
  "pick.settings": (s) => pickPreview(s, "settings"),

  "price.full": (s) => pricePreview(s, "full"),
  "price.lab": (s) => pricePreview(s, "lab"),
  "price.guests": (s) => pricePreview(s, "guests"),
  "price.paid": (s) => pricePreview(s, "paid"),
};

export function DisposableModeBoard() {
  return <ExplorationBoard spec={DISPOSABLE_MODE} previews={PREVIEWS} />;
}

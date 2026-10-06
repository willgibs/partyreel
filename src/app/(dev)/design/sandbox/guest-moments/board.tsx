"use client";

import "./guest-moments.css";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";

import { type AlbumTile, GuestAlbum, type Loop, type Mark } from "./album";
import {
  CameraScreen,
  doneLine,
  type Limit,
  RESHOOTS,
  ShotsScreen,
  shotsCount,
  spentLine,
  takeBackLine,
} from "./camera";
import {
  ALBUM,
  BATCH,
  HER_FIRST,
  HER_SECOND,
  HER_SHOTS,
  HER_THIRD,
  type Photo,
  ROLL,
} from "./fixtures";
import { type Screen, screenOf } from "./knobs";
import { type Beat, type Opening, ReelOpening } from "./reel";
import {
  find,
  findAll,
  parts,
  type Reader,
  Scene,
  Story,
  textOf,
} from "./scene";
import { GUEST_MOMENTS } from "./spec";

/**
 * THE PREVIEWS, one per option, each a moment drawn as its beats: the moving
 * frame first (the moment on a loop, held at its end under reduced motion),
 * then the instants that decide it, held still and titled with their time.
 * `spec.ts` says what each decision is; `album.tsx`, `camera.tsx` and
 * `reel.tsx` say what each drawing is production's and what is a stand-in.
 *
 * At 1440 an option draws the moving frame and its one deciding instant (two
 * laptops are a stage's width); the camera is a phone's whatever the knob.
 */

/* ── what the frames read ──────────────────────────────────────────────── */

const readAlbum: Reader = (root) => {
  const tiles = findAll(root, "[data-gm-tile]");
  if (!tiles.length) return null;
  const marked = tiles
    .filter((t) => t.dataset.gmMark || t.dataset.gmLoop)
    .map(
      (t) =>
        `${t.dataset.gmTile} (${t.dataset.gmMark ?? `loops ${t.dataset.gmLoop}`})`,
    );
  const pill = find(root, "[data-gm-pill]");
  const word = find(root, "[data-gm-word]");
  return parts(
    `${tiles.length} photographs laid`,
    marked.length ? `lit: ${marked.join(", ")}` : "nothing lit",
    pill ? `the pill says "${textOf(pill)}"` : undefined,
    word ? `a tile says "${textOf(word)}"` : undefined,
  );
};

const readShots: Reader = (root) => {
  const list = find(root, "[data-cam-your-shots]");
  if (!list) return null;
  const xs = findAll(root, ".cam-shot-remove").length;
  const removing = findAll(root, "[data-removing]").length;
  return parts(
    `Your shots, "${textOf(find(root, "#cam-your-shots-title + p"))}"`,
    `${xs} shots with an X`,
    removing ? `${removing} Removing` : undefined,
    textOf(list.querySelector(".cam-shots-body > p:last-child")),
  );
};

const readCamera: Reader = (root) => {
  const cam = find(root, "[data-gm-camera]");
  const caption = find(root, "[data-cam-caption]");
  if (!cam || !caption) return null;
  const done = find(root, "[data-cam-done]");
  const sheet = find(root, "[data-gm-take-back]");
  return parts(
    `"${textOf(find(root, "[data-cam-count]"))}" beside the shutter`,
    `"${textOf(caption)}"`,
    done ? `the roll's end: "${textOf(done)}"` : undefined,
    sheet ? `over the picture: "${textOf(sheet)}"` : undefined,
  );
};

const readReel: Reader = (root, win) => {
  const reel = find(root, "[data-gm-reel]");
  if (!reel) return null;
  // Seen at this instant: no layer between it and the screen is faded out
  // (a moving frame's beats stand one over another, each showing in its turn).
  const seen = (el: HTMLElement | null) => {
    for (let n = el; n && n !== reel; n = n.parentElement)
      if (Number(win.getComputedStyle(n).opacity) < 0.5) return false;
    return !!el;
  };
  const bars = findAll(root, "[data-gm-bar]").filter(seen);
  return parts(
    seen(find(root, "[data-gm-first]")) ? "the first photograph" : "black",
    bars.length
      ? `the bar ${bars.map((b) => b.dataset.gmBar).join(", ")}`
      : "no bar",
    seen(find(root, "[data-gm-close]")) ? "Close" : undefined,
  );
};

/* ── own: her photo landing ────────────────────────────────────────────── */

type Own = "sweep" | "glow" | "first" | "quiet";

/** What her first photo wears at its brightest, and what her third wears. */
const FIRST_MARK: Record<Own, Mark | undefined> = {
  sweep: "sweep",
  glow: "glow",
  first: "first",
  quiet: undefined,
};
const LATER_MARK: Record<Own, Mark | undefined> = {
  sweep: "sweep",
  glow: "glow",
  first: "sweep",
  quiet: undefined,
};
const OWN_LOOP: Record<Own, Loop | undefined> = {
  sweep: "sweep",
  glow: "glow",
  first: "first",
  quiet: undefined,
};

const tile = (p: Photo, mark?: Mark, loop?: Loop): AlbumTile => ({
  ...p,
  mark,
  loop,
});

function OwnStory({ own, screen }: { own: Own; screen: Screen }) {
  return (
    <Story screen={screen}>
      <Scene
        id={`gm-own-loop-${own}`}
        screen={screen}
        title="Her first photo landing, playing"
        measure={readAlbum}
      >
        <GuestAlbum
          screen={screen}
          tiles={[tile(HER_FIRST, undefined, OWN_LOOP[own]), ...ALBUM]}
        />
      </Scene>
      <Scene
        id={`gm-own-first-${own}`}
        screen={screen}
        title="Her first photo, at its brightest"
        measure={readAlbum}
      >
        <GuestAlbum
          screen={screen}
          tiles={[tile(HER_FIRST, FIRST_MARK[own]), ...ALBUM]}
        />
      </Scene>
      {screen === "375" ? (
        <Scene
          id={`gm-own-third-${own}`}
          screen={screen}
          title="Her third, an hour on"
          measure={readAlbum}
        >
          <GuestAlbum
            screen={screen}
            tiles={[
              tile(HER_THIRD, LATER_MARK[own]),
              HER_SECOND,
              HER_FIRST,
              ...ALBUM,
            ]}
          />
        </Scene>
      ) : null}
    </Story>
  );
}

/* ── batch: others' photos landing ─────────────────────────────────────── */

type Batch = "push" | "settle" | "file" | "pill";

/** The batch, each tile marked; the sixth is the slow one. */
const batchOf = (mark: (i: number) => Mark | undefined, loop?: Loop) =>
  BATCH.map((p, i) => tile(p, mark(i), loop));

/** The rows 0.15 s after the batch enters, as each option lays them. */
function batchEarly(batch: Batch): AlbumTile[] {
  if (batch === "push")
    return [...batchOf((i) => (i === 5 ? "grey" : "wipe")), ...ALBUM];
  if (batch === "settle") return [...batchOf(() => "glow"), ...ALBUM];
  if (batch === "file") return [tile(BATCH[0]!, "glow"), ...ALBUM];
  return [...ALBUM];
}

/** The rows a second on (the pill's: after her press). */
function batchLate(batch: Batch): AlbumTile[] {
  if (batch === "push")
    return [...batchOf((i) => (i === 5 ? "grey" : "glow-late")), ...ALBUM];
  if (batch === "file")
    return [...batchOf((i) => (i < 3 ? "glow-late" : "glow")), ...ALBUM];
  if (batch === "pill") return [...batchOf(() => "glow"), ...ALBUM];
  return [...batchOf(() => "glow-late"), ...ALBUM];
}

function BatchStory({ batch, screen }: { batch: Batch; screen: Screen }) {
  const pill = batch === "pill";
  return (
    <Story screen={screen}>
      <Scene
        id={`gm-batch-loop-${batch}`}
        screen={screen}
        title="Six land at once, playing"
        measure={readAlbum}
      >
        {pill ? (
          <GuestAlbum
            screen={screen}
            pill={BATCH.length}
            before={ALBUM}
            tiles={[...batchOf(() => undefined, "settle"), ...ALBUM]}
          />
        ) : (
          <GuestAlbum
            screen={screen}
            tiles={[...batchOf(() => undefined, batch), ...ALBUM]}
          />
        )}
      </Scene>
      <Scene
        id={`gm-batch-early-${batch}`}
        screen={screen}
        title="0.15 s after they land"
        measure={readAlbum}
      >
        <GuestAlbum
          screen={screen}
          tiles={batchEarly(batch)}
          pill={pill ? BATCH.length : undefined}
        />
      </Scene>
      {screen === "375" ? (
        <Scene
          id={`gm-batch-late-${batch}`}
          screen={screen}
          title={pill ? "After her press" : "A second on"}
          measure={readAlbum}
        >
          <GuestAlbum screen={screen} tiles={batchLate(batch)} />
        </Scene>
      ) : null}
    </Story>
  );
}

/* ── limit: how many re-shoots ─────────────────────────────────────────── */

const limitOf = (v: string | undefined): Limit =>
  v === "three" || v === "roll" ? v : "rolls";

function LimitStory({ limit }: { limit: Limit }) {
  const spent = spentLine(limit);
  return (
    <Story screen="375">
      <Scene
        id={`gm-limit-shots-${limit}`}
        screen="375"
        title="Your shots, one taken back"
        measure={readShots}
      >
        <ShotsScreen count={shotsCount(limit, HER_SHOTS.length, 1)} />
      </Scene>
      <Scene
        id={`gm-limit-end-${limit}`}
        screen="375"
        title={`The roll's end, after ${RESHOOTS[limit]} re-shoots`}
        measure={readCamera}
      >
        <CameraScreen
          used={ROLL}
          done={{
            line: spent ? `${doneLine()} ${spent}` : doneLine(),
            freeAFrame: false,
          }}
        />
      </Scene>
    </Story>
  );
}

/* ── where: the take-back's door ───────────────────────────────────────── */

const NEWEST = HER_SHOTS[HER_SHOTS.length - 1]!;

function WhereStory({
  where,
  limit,
}: {
  where: "list" | "reel";
  limit: Limit;
}) {
  const count = shotsCount(limit, HER_SHOTS.length, 0);
  if (where === "list")
    return (
      <Story screen="375">
        <Scene
          id={`gm-where-list-open-${limit}`}
          screen="375"
          title="A press on the reel opens Your shots"
          measure={readShots}
        >
          <ShotsScreen count={count} />
        </Scene>
        <Scene
          id={`gm-where-list-take-${limit}`}
          screen="375"
          title="The X on her newest, pressed"
          measure={readShots}
        >
          <ShotsScreen count={count} removing={NEWEST.key} />
        </Scene>
      </Story>
    );
  return (
    <Story screen="375">
      <Scene
        id={`gm-where-reel-open-${limit}`}
        screen="375"
        title="A press on the reel's newest frame"
        measure={readCamera}
      >
        <CameraScreen
          used={HER_SHOTS.length}
          sheet={{ shot: NEWEST, line: takeBackLine(limit) }}
        />
      </Scene>
      <Scene
        id={`gm-where-reel-take-${limit}`}
        screen="375"
        title="Taken back: the camera, a frame freed"
        measure={readCamera}
      >
        <CameraScreen used={HER_SHOTS.length - 1} />
      </Scene>
    </Story>
  );
}

/* ── opening: the reel's first second ──────────────────────────────────── */

const BEATS: readonly { beat: Beat; title: string }[] = [
  { beat: "loop", title: "Opening, playing (a slow phone's second)" },
  { beat: "press", title: "The press" },
  { beat: "wait", title: "Half a second on" },
  { beat: "play", title: "The reel playing" },
];

function OpeningStory({ way, screen }: { way: Opening; screen: Screen }) {
  const beats =
    screen === "1440"
      ? BEATS.filter((b) => b.beat === "loop" || b.beat === "wait")
      : BEATS;
  return (
    <Story screen={screen}>
      {beats.map(({ beat, title }) => (
        <Scene
          key={beat}
          id={`gm-opening-${beat}-${way}`}
          screen={screen}
          title={title}
          measure={readReel}
        >
          <ReelOpening way={way} beat={beat} />
        </Scene>
      ))}
    </Story>
  );
}

/* ── the map ───────────────────────────────────────────────────────────── */

const at = (s: BoardState) => screenOf(s.screen);
const lim = (s: BoardState) => limitOf(s.limit);

const PREVIEWS: PreviewsFor<typeof GUEST_MOMENTS> = {
  "own.sweep": (s) => <OwnStory own="sweep" screen={at(s)} />,
  "own.glow": (s) => <OwnStory own="glow" screen={at(s)} />,
  "own.first": (s) => <OwnStory own="first" screen={at(s)} />,
  "own.quiet": (s) => <OwnStory own="quiet" screen={at(s)} />,
  "batch.push": (s) => <BatchStory batch="push" screen={at(s)} />,
  "batch.settle": (s) => <BatchStory batch="settle" screen={at(s)} />,
  "batch.file": (s) => <BatchStory batch="file" screen={at(s)} />,
  "batch.pill": (s) => <BatchStory batch="pill" screen={at(s)} />,
  "limit.rolls": <LimitStory limit="rolls" />,
  "limit.three": <LimitStory limit="three" />,
  "limit.roll": <LimitStory limit="roll" />,
  "where.list": (s) => <WhereStory where="list" limit={lim(s)} />,
  "where.reel": (s) => <WhereStory where="reel" limit={lim(s)} />,
  "opening.black": (s) => <OpeningStory way="black" screen={at(s)} />,
  "opening.still": (s) => <OpeningStory way="still" screen={at(s)} />,
  "opening.mark": (s) => <OpeningStory way="mark" screen={at(s)} />,
};

export function GuestMomentsBoard() {
  return <ExplorationBoard spec={GUEST_MOMENTS} previews={PREVIEWS} />;
}

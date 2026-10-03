"use client";

import "./the-wait.css";

import type { ReactNode } from "react";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";

import {
  DEVELOP_MS,
  type DevelopId,
  DevelopFrame,
  TURN_MS,
} from "./develop";
import { FIRST_OPEN_MS, SECOND_OPEN_MS } from "./fixtures";
import { screenOf, type ScreenId } from "./knobs";
import { held, LIVE, Play } from "./motion";
import { OPEN_MS, OPEN_TURN_MS, OpenFrame } from "./place";
import { PREMIERE_MS, PREMIERE_TURN_MS, PremiereFrame } from "./premiere";
import { opacityOf, type Reader, Scene, Story, textOf } from "./scene";
import { THE_WAIT } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each option drawn whole on production's page
 * as a guest meets it the morning after, four frames left to right as her week
 * runs: her first open after the develop, playing; the same held at the moment
 * the sheet turns into the album; the reduced-motion pass, its own drawing; and
 * Monday, her second open, the album's regular open. A phone first, a laptop on
 * the Screen knob. Every frame is titled with its option's own name, read off
 * the spec, and every caption is read off the frame.
 */

type ArrivalId = DevelopId | "premiere" | "place";

/** An option's own name, off the spec, so a frame's title and its tab agree. */
const LABEL = (option: string) => {
  const found = THE_WAIT.asks
    .find((a) => a.id === "arrival")
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/* ── what the frames read ─────────────────────────────────────────────── */

const s1 = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

/** How many of these are drawn more than half there this instant. */
const shown = (els: Iterable<Element>, win: Window) =>
  [...els].filter((el) => opacityOf(el, win) > 0.5).length;

/**
 * THE FRAME, READ: the take and how long it runs, what the sheet draws (its
 * squares, the folded, hers), what grows or drops into the album, the Skip,
 * what the album and the cover say; and a held frame's state at its moment
 * (how many squares have come up, how much of the well remains, which of the
 * reel's frames shows, how many tiles have risen).
 */
const frameSays: Reader = (root, win) => {
  const play = root.querySelector<HTMLElement>(".tw-play");
  const page = root.querySelector("[data-tw-page]");
  if (!play || !page) return null;
  const parts: string[] = [];
  const reduced = play.dataset.twMotion === "reduced";
  const heldAt = play.dataset.twHeld;
  parts.push(
    `${play.dataset.twTake}${reduced ? ", opacity only" : ""}${heldAt === undefined ? `, plays ${s1(Number(play.dataset.twMs))}` : `, held at ${s1(Number(heldAt))}`}`,
  );

  const squares = root.querySelectorAll("[data-tw-sq], [data-tw-slot]");
  const grows = root.querySelectorAll("[data-tw-grow]");
  if (squares.length) {
    const hers =
      root.querySelectorAll("[data-tw-sq][data-hers]").length +
      root.querySelectorAll("[data-tw-grow][data-hers]").length;
    const folded = Number(
      root.querySelector<HTMLElement>("[data-tw-folded]")?.dataset.twFolded ??
        0,
    );
    const where = root.querySelector("[data-tw-darkroom]")
      ? "full screen"
      : "over the album";
    parts.push(
      `the sheet ${where}: ${squares.length} squares${folded ? ` and +${folded} folded` : ""}, ${hers} of hers lit`,
    );
    if (heldAt !== undefined) {
      const pictures = [
        ...root.querySelectorAll("[data-tw-sq]:not([data-hers]) img"),
        ...root.querySelectorAll("[data-tw-grow]:not([data-hers]) img"),
      ];
      const lit = root.querySelectorAll(".tw-lit");
      if (pictures.length)
        parts.push(`${shown(pictures, win)} of ${pictures.length} come up`);
      else if (lit.length)
        parts.push(`${shown(lit, win)} of ${lit.length} turned to light`);
      const ground = root.querySelector(".wait-well");
      if (ground)
        parts.push(
          `the well ${Math.round(opacityOf(ground.parentElement, win) * 100)}% there`,
        );
    }
  }
  if (grows.length)
    parts.push(`${grows.length} grow into the album's first rows`);

  const premiere = root.querySelector<HTMLElement>("[data-tw-premiere]");
  if (premiere) {
    const frames = root.querySelectorAll("[data-tw-frame]");
    if (premiere.dataset.twPremiere === "paused")
      parts.push("the reel waits on its first photograph, paused, its dock up");
    else if (heldAt !== undefined) {
      const on = [...frames].findIndex((f) => opacityOf(f, win) > 0.5);
      parts.push(`the reel on frame ${on + 1} of ${frames.length}`);
    } else
      parts.push(
        `the reel plays ${frames.length} photographs, the newest drops into its tile`,
      );
  }
  const skip = textOf(root.querySelector("[data-tw-skip]"));
  if (skip) parts.push(`Skip: "${skip}"`);

  const tiles = [...root.querySelectorAll<HTMLElement>("[data-tw-rows] > [data-tw-tile]")];
  if (tiles.length) {
    const perRow = tiles.filter((t) => t.style.top === "0px").length;
    const count = textOf(root.querySelector("[data-tw-album-count]"));
    if (heldAt !== undefined && !squares.length && !premiere)
      parts.push(`${shown(tiles, win)} of ${tiles.length} tiles risen`);
    parts.push(`the album "${count}", ${perRow} a row`);
  }
  const eyebrow = textOf(root.querySelector("[data-cover-eyebrow]"));
  if (eyebrow) parts.push(`the cover "${eyebrow}"`);
  return parts.join("; ");
};

/* ── the arrival ──────────────────────────────────────────────────────── */

/** Each option's drawing of her first open, and how long it runs and where it turns. */
const TAKES: Record<
  ArrivalId,
  {
    first: (screen: ScreenId) => ReactNode;
    ms: { full: number; reduced: number };
    turn: number;
    /** What the held frame shows, in a few words. */
    turnWords: string;
  }
> = {
  "in-place": {
    first: (screen) => <DevelopFrame take="in-place" screen={screen} />,
    ms: DEVELOP_MS["in-place"],
    turn: TURN_MS["in-place"],
    turnWords: "the squares growing into the rows",
  },
  darkroom: {
    first: (screen) => <DevelopFrame take="darkroom" screen={screen} />,
    ms: DEVELOP_MS.darkroom,
    turn: TURN_MS.darkroom,
    turnWords: "the roll developing, full screen",
  },
  light: {
    first: (screen) => <DevelopFrame take="light" screen={screen} />,
    ms: DEVELOP_MS.light,
    turn: TURN_MS.light,
    turnWords: "the album rising out of the light",
  },
  premiere: {
    first: (screen) => <PremiereFrame screen={screen} />,
    ms: PREMIERE_MS,
    turn: PREMIERE_TURN_MS,
    turnWords: "the reel playing, The album in reach",
  },
  place: {
    first: (screen) => (
      <OpenFrame screen={screen} nowMs={FIRST_OPEN_MS} />
    ),
    ms: OPEN_MS,
    turn: OPEN_TURN_MS,
    turnWords: "the album rising into its rows",
  },
};

/** What each take is called in its frame's caption. */
const TAKE_WORDS: Record<ArrivalId, string> = {
  "in-place": "It develops where it stood",
  darkroom: "The darkroom first",
  light: "Out of the light",
  premiere: "The premiere first",
  place: "The regular open",
};

function arrivalPreview(s: BoardState, option: ArrivalId): ReactNode {
  const screen = screenOf(s.screen);
  const name = LABEL(option);
  const take = TAKES[option];
  const id = `tw-arrival-${option}`;
  return (
    <Story screen={screen}>
      <Scene
        id={`${id}-first`}
        screen={screen}
        title={`${name}: Sunday 9:40 am, her first open`}
        measure={frameSays}
      >
        <Play clock={LIVE} length={take.ms.full} take={TAKE_WORDS[option]}>
          {take.first(screen)}
        </Play>
      </Scene>
      <Scene
        id={`${id}-turn`}
        screen={screen}
        title={`${name}: ${take.turnWords}`}
        measure={frameSays}
      >
        <Play
          clock={held(take.turn)}
          length={take.ms.full}
          take={TAKE_WORDS[option]}
        >
          {take.first(screen)}
        </Play>
      </Scene>
      <Scene
        id={`${id}-reduced`}
        screen={screen}
        title={`${name}: reduced motion`}
        measure={frameSays}
      >
        <Play
          clock={LIVE}
          forceReduced
          length={take.ms.reduced}
          take={TAKE_WORDS[option]}
        >
          {take.first(screen)}
        </Play>
      </Scene>
      <Scene
        id={`${id}-second`}
        screen={screen}
        title={`${name}: Monday, her second open`}
        measure={frameSays}
      >
        <Play clock={LIVE} length={OPEN_MS.full} take="Her second open">
          <OpenFrame screen={screen} nowMs={SECOND_OPEN_MS} />
        </Play>
      </Scene>
    </Story>
  );
}

/* ── the map ──────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof THE_WAIT> = {
  "arrival.in-place": (s) => arrivalPreview(s, "in-place"),
  "arrival.darkroom": (s) => arrivalPreview(s, "darkroom"),
  "arrival.light": (s) => arrivalPreview(s, "light"),
  "arrival.premiere": (s) => arrivalPreview(s, "premiere"),
  "arrival.place": (s) => arrivalPreview(s, "place"),
};

export function TheWaitBoard() {
  return <ExplorationBoard spec={THE_WAIT} previews={PREVIEWS} />;
}

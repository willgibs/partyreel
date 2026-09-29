"use client";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
} from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import type { WelcomeAt } from "./door-props";
import { Door, NATURAL, type ShapeId } from "./family";
import { READERS, type ReaderId } from "./fixtures";
import { AlbumHuesProvider, useAlbumHues } from "./furniture";
import { screenOf, Strip, type StripFrame } from "./scene";
import { LOCKED_DOOR } from "./spec";
import type { DirectionId, WaitId } from "./words";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the door as a guest meets it,
 * in real frames at the width the Screen knob names, drawn by the direction's
 * own file (`today.tsx`, `host.tsx`, `lit.tsx`, `doorway.tsx`) through one
 * entry point (`family.tsx`'s `Door`) from `words.ts`.
 *
 * ★ `family` DRAWS EACH DIRECTION IN ITS OWN SHAPE (`NATURAL`); every later ask
 * is drawn in the direction the step hands it (the pick, the recommendation
 * until then) and the shape `shape` holds, so the four knobs are one world:
 * the wait is judged in the door it will live in, and the 404 beside the shut
 * door it would follow.
 *
 * ★ THE KNOBS MOVE WHO IS READING AND NOTHING ELSE: `at` swaps the newcomer at
 * the shut door (off the code, turned away, not on the list), `was` swaps
 * Priya for Dom. Neither changes a word of the shut door's message, which is
 * what the frames' captions let a reader check.
 */

const pick = <T extends string>(ids: readonly T[], v: unknown, d: T): T =>
  (ids as readonly string[]).includes(v as string) ? (v as T) : d;

const FAMILIES = ["today", "host", "lit", "doorway"] as const;
const SHAPES = ["shared", "split", "bespoke"] as const;
const WAITS = ["still", "live", "pick"] as const;

const familyOf = (s: BoardState): DirectionId =>
  pick(FAMILIES, s.family, "doorway");
const shapeOf = (s: BoardState): ShapeId => pick(SHAPES, s.shape, "split");
const waitOf = (s: BoardState): WaitId => pick(WAITS, s.wait, "still");

/** The newcomer at the shut door (`at`) and who was in (`was`). */
const AT: Record<string, ReaderId> = {
  code: "newcomer",
  declined: "lena-declined",
  unlisted: "lena-unlisted",
};
const atOf = (s: BoardState): ReaderId => AT[s.at] ?? "newcomer";
const welcomeOf = (s: BoardState): WelcomeAt =>
  s.welcome === "gate" ? "gate" : "public";
const wasOf = (s: BoardState): ReaderId => (s.was === "dom" ? "dom" : "priya");

/** An option's own name off the spec, so a row's lede and the stage head agree. */
const LABEL = (ask: string, option: string) => {
  const found = LOCKED_DOOR.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/** Hues that land after layout, so a lit frame's caption is read again. */
function useAgain(): string {
  return useAlbumHues().map(Math.round).join();
}

/* ── 1 and 2. the family, whole: four states in one row ───────────────────── */

function FamilyStrip({
  s,
  direction,
  shape,
}: {
  s: BoardState;
  direction: DirectionId;
  shape: ShapeId;
}) {
  const screen = screenOf(s);
  const wait = waitOf(s);
  const again = useAgain();
  const shut = READERS[atOf(s)];
  const was = READERS[wasOf(s)];
  const welcomeAt = welcomeOf(s);
  const key = `ld-${direction}-${shape}-${wait}`;
  const frames: StripFrame[] = [
    {
      id: `${key}-welcome-${welcomeAt}`,
      title:
        welcomeAt === "gate"
          ? "The welcome, a password album's gate"
          : "The welcome, a Public album",
      again,
      node: (
        <Door
          direction={direction}
          shape={shape}
          state="welcome"
          reader="newcomer"
          wait={wait}
          welcomeAt={welcomeAt}
        />
      ),
    },
    {
      id: `${key}-wait`,
      title: "The wait, while Maya decides",
      node: (
        <Door
          direction={direction}
          shape={shape}
          state="wait"
          reader="lena"
          wait={wait}
        />
      ),
    },
    {
      id: `${key}-shut-${shut.id}`,
      title: `The shut door: ${shut.cause}`,
      node: (
        <Door
          direction={direction}
          shape={shape}
          state="shut"
          reader={shut.id}
          wait={wait}
        />
      ),
    },
    {
      id: `${key}-was-${was.id}`,
      title: `The shut door: ${was.cause}`,
      node: (
        <Door
          direction={direction}
          shape={shape}
          state="was-in"
          reader={was.id}
          wait={wait}
        />
      ),
    },
  ];
  return (
    <Strip
      screen={screen}
      frames={frames}
      lede={`${LABEL("family", direction)}, ${LABEL("shape", shape).toLowerCase()}: the welcome, the wait, the shut door, and the shut door for someone who was in.`}
    />
  );
}

/* ── 3. the wait, and the moment it opens itself ──────────────────────────── */

function WaitPair({ s, wait }: { s: BoardState; wait: WaitId }) {
  const direction = familyOf(s);
  const shape = shapeOf(s);
  const again = useAgain();
  const key = `ld-wait-${direction}-${shape}-${wait}`;
  return (
    <Strip
      screen={screenOf(s)}
      lede={`${LABEL("wait", wait)}, in ${LABEL("family", direction).toLowerCase()}: Lena waiting, then the moment Maya lets her in.`}
      frames={[
        {
          id: `${key}-wait`,
          title: "Lena waits while Maya decides",
          node: (
            <Door
              direction={direction}
              shape={shape}
              state="wait"
              reader="lena"
              wait={wait}
            />
          ),
        },
        {
          id: `${key}-beat`,
          title: "Maya lets her in, and the door opens itself",
          again,
          node: (
            <Door
              direction={direction}
              shape={shape}
              state="beat"
              reader="lena"
              wait={wait}
            />
          ),
        },
      ]}
    />
  );
}

/* ── 4. the 404, beside the shut door it would follow ─────────────────────── */

function LostPair({ s, lost }: { s: BoardState; lost: "own" | "follows" }) {
  const direction = familyOf(s);
  const shape = shapeOf(s);
  const shut = READERS[atOf(s)];
  const key = `ld-lost-${direction}-${shape}-${lost}`;
  return (
    <Strip
      screen={screenOf(s)}
      lede={`${LABEL("lost", lost)}, beside the shut door of ${LABEL("family", direction).toLowerCase()}.`}
      frames={[
        {
          id: `${key}-404`,
          title: "A link that opens nothing (the 404)",
          node: (
            <Door
              direction={lost === "own" ? "today" : direction}
              shape={shape}
              state="lost"
              reader="newcomer"
              wait="still"
            />
          ),
        },
        {
          id: `${key}-shut-${shut.id}`,
          title: `The shut door: ${shut.cause}`,
          node: (
            <Door
              direction={direction}
              shape={shape}
              state="shut"
              reader={shut.id}
              wait="still"
            />
          ),
        },
      ]}
    />
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

/** A direction in its own shape (`family`); the held direction in one shape (`shape`). */
const inOwnShape = (s: BoardState, direction: DirectionId) => (
  <FamilyStrip s={s} direction={direction} shape={NATURAL[direction]} />
);
const inShape = (s: BoardState, value: ShapeId) => (
  <FamilyStrip s={s} direction={familyOf(s)} shape={value} />
);

const PREVIEWS: PreviewsFor<typeof LOCKED_DOOR> = {
  "family.today": (s) => inOwnShape(s, "today"),
  "family.host": (s) => inOwnShape(s, "host"),
  "family.lit": (s) => inOwnShape(s, "lit"),
  "family.doorway": (s) => inOwnShape(s, "doorway"),

  "shape.shared": (s) => inShape(s, "shared"),
  "shape.split": (s) => inShape(s, "split"),
  "shape.bespoke": (s) => inShape(s, "bespoke"),

  "wait.still": (s) => <WaitPair s={s} wait="still" />,
  "wait.live": (s) => <WaitPair s={s} wait="live" />,
  "wait.pick": (s) => <WaitPair s={s} wait="pick" />,

  "lost.own": (s) => <LostPair s={s} lost="own" />,
  "lost.follows": (s) => <LostPair s={s} lost="follows" />,
};

export function LockedDoorBoard() {
  return (
    <AlbumHuesProvider>
      <ExplorationBoard spec={LOCKED_DOOR} previews={PREVIEWS} />
    </AlbumHuesProvider>
  );
}

"use client";

import { useMemo } from "react";

import { ExplorationBoard } from "@/components/lab";
import {
  type BoardState,
  optionId,
  optionLabel,
} from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";
import { hueOfOklch } from "@/lib/guest/door-light";
import { useSampledPalette } from "@/lib/shared/sampled-palette";

import { COVER, READER_ORDER, READERS, type ReaderId } from "./fixtures";
import { LockScreen } from "./parts";
import {
  measureLock,
  Scene,
  SCREENS,
  type ScreenId,
  screenOf,
  Trio,
  useReaderProbe,
} from "./scene";
import { LOCKED_DOOR } from "./spec";
import { type LineId, type LockId, wordsFor } from "./words";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the album link's first
 * screen for somebody the door stops, in a real frame at the width the Screen
 * knob names, drawn by `parts.tsx` from `words.ts`.
 *
 * ★ `lock` READS WHO IS AT THE DOOR (the `who` knob), and `previous` DRAWS ALL
 * THREE, because the two questions are about opposite things: the screen is
 * judged as one person meets it, and the previous guest's line is judged by
 * whether three people's words agree where they must.
 *
 * ★ `previous` IS DRAWN IN THE SCREEN `lock` HOLDS (the step hands it the
 * picked answer, the recommendation until then), so its lines are read in the
 * form they will wear, and `lock` wears whatever `previous` holds for Priya and
 * Dom: the two knobs are one world.
 */

const pick = <T extends string>(ids: readonly T[], v: unknown, d: T): T =>
  (ids as readonly string[]).includes(v as string) ? (v as T) : d;

const LOCKS = ["today", "lit", "door", "host", "cover"] as const;
const LINES = ["one", "private", "changed"] as const;
const WHO = ["newcomer", "priya", "dom"] as const;

const lockOf = (s: BoardState): LockId => pick(LOCKS, s.lock, "host");
const lineOf = (s: BoardState): LineId => pick(LINES, s.previous, "one");
const whoOf = (s: BoardState): ReaderId => pick(WHO, s.who, "newcomer");

/** An option's own name off the spec, so the frame's title and the stage head agree. */
const LABEL = (ask: string, option: string) => {
  const found = LOCKED_DOOR.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/**
 * THE COVER'S HUES, SAMPLED OFF THE PHOTOGRAPH, never typed: the sampler the
 * album's own lamp uses (`useSampledPalette`, the URL form), kept as hues so the
 * register stays the stylesheet's, exactly as `album-light.tsx` hands them to
 * the door. Asked for only by the one option that shows a photograph.
 */
function useCoverHues(on: boolean): readonly number[] | null {
  const colors = useSampledPalette(on ? [COVER.src] : null, "dark");
  return useMemo(() => {
    const hues = (colors ?? [])
      .map(hueOfOklch)
      .filter((h): h is number => h !== null);
    return hues.length >= 3 ? hues : null;
  }, [colors]);
}

/* ── 1. the locked screen, as one person meets it ─────────────────────────── */

function LockPreview({ s, lock }: { s: BoardState; lock: LockId }) {
  const scr: ScreenId = screenOf(s);
  const reader = READERS[whoOf(s)];
  const hues = useCoverHues(lock === "cover");
  return (
    <Scene
      id={`ld-lock-${lock}-${reader.id}`}
      screen={scr}
      title={`${LABEL("lock", lock)}: ${reader.title}`}
      measure={measureLock(SCREENS[scr].h)}
      again={hues?.map(Math.round).join()}
    >
      <LockScreen
        lock={lock}
        reader={reader}
        words={wordsFor(lock, lineOf(s), reader.wasIn)}
        hues={hues}
      />
    </Scene>
  );
}

/* ── 2. a previous guest's line, as all three read it ─────────────────────── */

function ReaderFrame({
  id,
  lock,
  line,
  scr,
  hues,
}: {
  id: ReaderId;
  lock: LockId;
  line: LineId;
  scr: ScreenId;
  hues: readonly number[] | null;
}) {
  const reader = READERS[id];
  const measure = useReaderProbe(id);
  return (
    <Scene
      id={`ld-prev-${line}-${lock}-${id}`}
      screen={scr}
      short
      title={reader.title}
      measure={measure}
      again={hues?.map(Math.round).join()}
    >
      <LockScreen
        lock={lock}
        reader={reader}
        words={wordsFor(lock, line, reader.wasIn)}
        hues={hues}
      />
    </Scene>
  );
}

function PreviousPreview({ s, line }: { s: BoardState; line: LineId }) {
  const scr = screenOf(s);
  const lock = lockOf(s);
  const hues = useCoverHues(lock === "cover");
  return (
    <Trio screen={scr}>
      {READER_ORDER.map((id) => (
        <ReaderFrame
          key={id}
          id={id}
          lock={lock}
          line={line}
          scr={scr}
          hues={hues}
        />
      ))}
    </Trio>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof LOCKED_DOOR> = {
  "lock.today": (s) => <LockPreview s={s} lock="today" />,
  "lock.lit": (s) => <LockPreview s={s} lock="lit" />,
  "lock.door": (s) => <LockPreview s={s} lock="door" />,
  "lock.host": (s) => <LockPreview s={s} lock="host" />,
  "lock.cover": (s) => <LockPreview s={s} lock="cover" />,

  "previous.one": (s) => <PreviousPreview s={s} line="one" />,
  "previous.private": (s) => <PreviousPreview s={s} line="private" />,
  "previous.changed": (s) => <PreviousPreview s={s} line="changed" />,
};

export function LockedDoorBoard() {
  return <ExplorationBoard spec={LOCKED_DOOR} previews={PREVIEWS} />;
}

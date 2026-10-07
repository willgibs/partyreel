"use client";

import { useEffect, useRef, useState } from "react";

import {
  type CellState,
  type PictureShown,
  pictureCells,
  shownAt,
} from "@/components/app/event-settings/camera-settings-style-picture";
import type { AlbumStyle } from "@/lib/disposable/album-style";

/**
 * A STYLE'S STORY, PLAYED ONCE ON THE PICKED CARD (create-wizard r5's `previews=one`, Will 2026-10-07: "Maybe one can
 * play the live visual demo of the active selection, while the others stay still until selected to preview
 * themselves"). Three cards rest on the one moment they differ (`camera-settings-style-picture.tsx`'s rest); only the
 * picked one plays its album through the three moments, its moment named on it, then returns to its rest and stays.
 *
 * ★ FRAME BY FRAME, NEVER LEFT TO RIGHT: arriving (every album empty, the Disposable dark, its camera holding the roll),
 * the party (the frames that change landing one at a time, in `LANDING`'s order), next morning (Review's waiting frames
 * let in one by one; the Disposable's dark frames developing together in one slower fade), then the rest. Every change
 * is a state the picture's own transitions carry (its 320ms fade), so a story stopped half way leaves nothing behind.
 *
 * ★ A PICK STANDS BEFORE IT PLAYS (`STANDS_MS`), so arrows walking the radio group play nothing on the cards they pass;
 * a press on the picked card plays it again; and as the step first opens the picked card (Live, as Create opens) plays
 * once. Under reduced motion nothing plays: the rest stands, the page complete.
 */

/** The story's clock: about five seconds, the party held longest (the r5 helper's pace). */
export type StoryPace = {
  /** When the party starts landing, the morning comes, and the picture returns to its rest (ms from the start). */
  party: number;
  morning: number;
  rest: number;
  /** Between one frame landing and the next. */
  step: number;
};

export const STORY_PACE: StoryPace = {
  party: 900,
  morning: 2900,
  rest: 4700,
  step: 140,
};

/** A pick stands this long before its story starts. */
export const STANDS_MS = 280;

/** The order frames land in: never left to right (the r5 helper's 2, 6, 4, 1, 5, 3). */
const LANDING = [1, 5, 3, 0, 4, 2] as const;

function motionWelcome(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * THE STORY, ONCE: while `run` is a number (a press's count), the picture plays from arriving to its rest; a new number
 * plays it again from the start; null stands it at rest.
 */
export function useStory(
  style: AlbumStyle,
  run: number | null,
  pace: StoryPace = STORY_PACE,
): PictureShown {
  // The run this picture plays: its style and its count, so a new count (or another card's) starts it afresh.
  const key = run === null ? null : `${style}:${run}`;
  const [frame, setFrame] = useState<{
    key: string;
    shown: PictureShown;
  } | null>(null);

  useEffect(() => {
    if (key === null || !motionWelcome()) return;
    const timers: number[] = [];
    // Each change is a function of the frame before it, the arriving album the first.
    const at = (ms: number, next: (s: PictureShown) => PictureShown) =>
      timers.push(
        window.setTimeout(
          () =>
            setFrame((f) => ({
              key,
              shown: next(
                f && f.key === key ? f.shown : shownAt(style, "arrive", true),
              ),
            })),
          ms,
        ),
      );
    const arrive = pictureCells(style, "arrive");
    const rest = pictureCells(style, "party");
    const land = (s: PictureShown, i: number, to: CellState) => {
      const cells = [...s.cells];
      cells[i] = to;
      return { ...s, cells };
    };
    // The party: each frame that changes lands on its own turn.
    at(pace.party, (s) => ({
      ...s,
      at: "party",
      moment: "party",
      roll: false,
    }));
    LANDING.filter((i) => arrive[i] !== rest[i]).forEach((i, k) =>
      at(pace.party + k * pace.step, (s) => land(s, i, rest[i]!)),
    );
    // Next morning: what waited comes in (Review's, one by one); the Disposable's dark frames develop together.
    at(pace.morning, (s) => ({ ...s, at: "morning", moment: "morning" }));
    if (style === "disposable") {
      at(pace.morning, (s) => ({
        ...s,
        developing: true,
        cells: pictureCells(style, "morning"),
      }));
      at(pace.morning + 600, (s) => ({ ...s, play: true }));
    } else {
      const waiting = LANDING.filter((i) => rest[i] !== "lit");
      waiting.forEach((i, k) =>
        at(pace.morning + k * pace.step, (s) => land(s, i, "lit")),
      );
      at(pace.morning + waiting.length * pace.step + 240, (s) => ({
        ...s,
        play: true,
      }));
    }
    // Back to the rest, where it stays: every frame at once, the mark and the word gone.
    at(pace.rest, () => shownAt(style, "party"));
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [key, style, pace]);

  if (key === null || !motionWelcome()) return shownAt(style, "party");
  // Arriving, until the story's first change: the album empty (the Disposable dark, its camera holding the roll).
  return frame && frame.key === key
    ? frame.shown
    : shownAt(style, "arrive", true);
}

/** Which card's story runs, and its count: a new count plays it again from the start. */
export type StoryRun = { style: AlbumStyle; n: number } | null;

/** The count a card plays on: its own run's, or null (its rest) while another card's runs or none does. */
export const runOf = (run: StoryRun, style: AlbumStyle): number | null =>
  run && run.style === style ? run.n : null;

/**
 * WHICH CARD PLAYS, AND HOW MANY TIMES IT HAS BEEN ASKED: the picked style's run, started once as the step first opens
 * in this Create, when a pick has stood its moment, and on a second press of the picked card. The run names its card,
 * so the card just picked never plays a frame of the run that was the last card's.
 */
export function useStoryRuns(
  style: AlbumStyle,
  played: boolean,
  onPlayed: () => void,
): { run: StoryRun; again: () => void } {
  // As the step first opens in this Create, the picked card plays once.
  const [run, setRun] = useState<StoryRun>(() =>
    played ? null : { style, n: 1 },
  );
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    if (!played) onPlayed();
  }, [played, onPlayed]);

  // A pick that stands its moment plays; arrows passing over a card play nothing.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = window.setTimeout(
      () => setRun((r) => ({ style, n: (r?.n ?? 0) + 1 })),
      STANDS_MS,
    );
    return () => window.clearTimeout(timer);
  }, [style]);

  return {
    run,
    again: () => setRun((r) => ({ style, n: (r?.n ?? 0) + 1 })),
  };
}

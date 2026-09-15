"use client";

import { useCallback, useState } from "react";

/**
 * THE BOARD'S TWO MOTION CONTROLS, so no board writes them again.
 *
 * `useReplay` is the one-shot runner. Every arrival, sweep and beat on a board
 * is a CSS animation that has already finished by the time a reviewer reaches
 * it, and the honest way to run one again is to remount the element: an
 * incrementing key does that, and an `animationend` listener plus a class
 * toggle does not (it races the compositor and leaves the element in whichever
 * state the last frame happened to be). The key is the whole mechanism.
 *
 * `useMotionState` is Live or Rest, board-wide. "Every lamp's rest state
 * designed, not absent" is a claim about the page, so a per-specimen toggle
 * would let it be true in one place and quietly false in the next.
 *
 * ★ REST IS AN ATTRIBUTE, NOT `animation: none`. The hook hands back the
 * attribute for the board's root and the board's own sheet decides what it
 * freezes, deliberately narrowly. A blanket freeze also stops the marketing
 * reveal grammar on the real sections it renders, whose pre-animation state is
 * opacity 0, and the whole board then reads as broken rather than at rest.
 */
export function useReplay(): { runId: number; replay: () => void } {
  const [runId, setRunId] = useState(0);
  const replay = useCallback(() => setRunId((n) => n + 1), []);
  return { runId, replay };
}

export function useMotionState(): {
  rest: boolean;
  setRest: (rest: boolean) => void;
  /** Spread onto the board's root: `<div {...restProps}>`. */
  restProps: { "data-lab-rest"?: "" };
} {
  const [rest, setRest] = useState(false);
  return {
    rest,
    setRest,
    restProps: rest ? { "data-lab-rest": "" as const } : {},
  };
}

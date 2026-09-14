"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useState } from "react";

import {
  BoardMeta,
  CANVAS,
  Stage,
  Toggle,
  type Mode,
} from "@/components/dev/board";

import { Variant } from "../variant-frame";

/**
 * THE FLOATING-SURFACES BOARD (the review wave, 2026-09-14). A STUB: the Orchestrator registered
 * the board so the `floating-surfaces` track owns only this directory; the track
 * replaces everything below. The brief, the facts and the lane are in
 * docs/tracks/floating-surfaces.md; the shell (Stage, Toggle, BoardMeta) is
 * src/components/dev/board/. Keyframes live in board.css under `flt-`.
 * No font-mono and no MonoCaption anywhere on a board (bible 7 is retiring).
 *
 * Rising tides (bible 22): judge the system from the ground up. The candidates
 * span tune-to-replace, a departure is flagged in BoardMeta rather than
 * buried, and the asks are worded so Will's ruling is a few words.
 */
const QUESTION =
  "Every floating primitive on every ground: which radius, which entrance, and light or shadow in dark, with the outliers (select, drawer, sheet) brought onto whichever contract wins.";

const ASKS = [
  "The contract: radius, entrance, light or shadow in dark",
  "The outliers: select, drawer and sheet onto the contract, or dropped",
];

export function FloatingSurfacesBoard() {
  const [mode, setMode] = useState<Mode>("desktop");

  return (
    <div className="flex flex-col gap-6 py-4">
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        {QUESTION}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Toggle
          ariaLabel="Viewport"
          options={[
            { id: "desktop" as Mode, label: "Desktop" },
            { id: "phone" as Mode, label: "Phone 375" },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>

      <Variant
        n={0}
        name="The canvas"
        rationale="The stub's stage on the cinema ground; the track's candidates replace it."
        framed={false}
      >
        <Stage mode={mode} ground="cinema" height={CANVAS[mode].h / 2}>
          <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
            The floating-surfaces board is being built on its own preview;
            candidates land here.
          </div>
        </Stage>
      </Variant>

      <BoardMeta question={QUESTION} asks={ASKS} />
    </div>
  );
}

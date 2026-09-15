"use client";

import "./board.css";

import { RotateCcw } from "lucide-react";
import { useState } from "react";

import {
  BoardDock,
  BoardMeta,
  type Mode,
  Stage,
  Toggle,
} from "@/components/dev/board";
import { DEMO_EVENT_URL } from "@/lib/demo";

import { river } from "./river";

/**
 * THE RIVER, A FEATURE VISUAL (round four of the review wave, 2026-09-15). Will's ruling:
 * "4 can be killed as a hero, but the river animation could be
 * streamlined to drop down in one flow rather than two, and saved to our lab
 * design bank to hopefully use another time as a feature visual."
 *
 * This is the SEED board the `river-visual` track replaces: it renders the
 * concept as it left the home hero, at 1:1 on the cinema ground, with the
 * shell's dock and meta panel, so the desk has a real surface while the track
 * builds. The brief is docs/tracks/river-visual.md.
 */
export function RiverVisualBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [runId, setRunId] = useState(0);
  const qrUrl = DEMO_EVENT_URL ?? null;
  return (
    <div className="rvr-board pt-2">
      <BoardDock
        aside={
          <button
            type="button"
            onClick={() => setRunId((n) => n + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3" /> Replay
          </button>
        }
      >
        <Toggle
          ariaLabel="Canvas"
          options={[
            { id: "desktop" as Mode, label: "Desktop 1440" },
            { id: "phone" as Mode, label: "Phone 375" },
          ]}
          value={mode}
          onChange={setMode}
        />
      </BoardDock>
      <div className="mt-4 space-y-4">
        <Stage mode={mode} ground="cinema" bodySkin key={`${mode}-${runId}`}>
          {river.render({ mode, copy: "ruled", scrim: false, qrUrl, runId })}
        </Stage>
        <BoardMeta
          question="The river as a section-scale feature visual: one stream dropping out of the code, at three sizes, in three real placements, banked with its props and its cost. Where would it go first?"
          candidates={[
            {
              name: "The seed",
              rationale:
                "The river exactly as it left the home hero board after three rounds (two banks around a lockup, the fan over the first third of the fall): the mechanics the one-flow version is cut from.",
            },
          ]}
          asks={["Not yet: the track fills the asks with its first handoff."]}
          departures={[]}
          assets={[]}
        />
      </div>
    </div>
  );
}

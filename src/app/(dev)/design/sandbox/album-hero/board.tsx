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

import { burst } from "./burst";

/**
 * THE ALBUM PAGE'S HERO (round four of the review wave, 2026-09-15). Will's ruling:
 * "3 can be killed as the home hero, but the background (images
 * emanating) would be beautiful for the /features/album hero for the live
 * album... It doesn't need the QR code for the new version."
 *
 * This is the SEED board the `album-hero` track replaces: it renders the
 * concept as it left the home hero, at 1:1 on the cinema ground, with the
 * shell's dock and meta panel, so the desk has a real surface while the track
 * builds. The brief is docs/tracks/album-hero.md.
 */
export function AlbumHeroBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [runId, setRunId] = useState(0);
  const qrUrl = DEMO_EVENT_URL ?? null;
  return (
    <div className="alb-board pt-2">
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
          {burst.render({ mode, copy: "ruled", scrim: false, qrUrl, runId })}
        </Stage>
        <BoardMeta
          question="The burst's field as the live album's hero: looped for the live feel, no code, the album product as a calmer wide visual below it. What does the top of /features/album become?"
          candidates={[
            {
              name: "The seed",
              rationale:
                "The burst exactly as it left the home hero board after three rounds (the code still at the centre until the track removes it): the field every frame is born into and radiates out of, with its acceptance walk and quiet zone.",
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

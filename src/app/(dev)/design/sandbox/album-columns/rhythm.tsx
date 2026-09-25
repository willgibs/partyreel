"use client";

import { useEffect, useState } from "react";

import type { BoardState } from "@/components/lab/board-spec";

import { ALBUM, RowsAlbum } from "./album";
import { Canvas, Ground, readRows } from "./canvas";
import { screenOf } from "./screens";

export type RhythmOption = "plain" | "double" | "solo";

/**
 * THE FIRST VISIT'S SEED, fixed so the two feature options open on the same
 * picks (one decision's options are compared on the same photographs), and
 * chosen so a feature row sits in the first screen at every width. "Another
 * visit" deals a new one, which is what a guest coming back would see.
 */
const FIRST_VISIT = 25;

function RhythmShowcase({
  option,
  report,
}: {
  option: RhythmOption;
  report: (text: string) => void;
}) {
  const [seed, setSeed] = useState(FIRST_VISIT);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);

  // What stands out, as the browser drew it: rows well above the album's
  // usual height (the oldest row, which may run tall to hold the leftovers,
  // is left out). 1.4 times the usual height, because a phone's plain rows
  // of two already vary by a third with the shapes in them.
  useEffect(() => {
    if (!root) return;
    const t = setTimeout(() => {
      const rows = readRows(root).slice(0, -1);
      if (rows.length === 0) return;
      const heights = rows.map((r) => r.height).sort((a, b) => a - b);
      const median = heights[Math.floor(heights.length / 2)];
      const tall = rows.filter((r) => r.height >= median * 1.4).length;
      report(
        `${tall} of ${rows.length + 1} rows stand 1.4 times the usual height, measured`,
      );
    }, 600);
    return () => clearTimeout(t);
  }, [root, seed, report]);

  return (
    <div ref={setRoot} className="min-h-full">
      <Ground>
        {option !== "plain" && (
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setSeed((s) => s + 1)}
              className="inline-flex h-8 items-center rounded-action border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.97]"
            >
              Another visit
            </button>
          </div>
        )}
        <RowsAlbum
          items={ALBUM}
          rhythm={option === "plain" ? undefined : option}
          seed={seed}
        />
      </Ground>
    </div>
  );
}

const TITLE: Record<RhythmOption, string> = {
  plain: "Plain rows",
  double: "Now and then, a taller row",
  solo: "Now and then, one across",
};

export function rhythmPreview(state: BoardState, option: RhythmOption) {
  const screen = screenOf(state.screen);
  return (
    <Canvas id={`rhythm-${option}`} screen={screen} title={TITLE[option]}>
      {(report) => <RhythmShowcase option={option} report={report} />}
    </Canvas>
  );
}

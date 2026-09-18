"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * WHAT A CANDIDATE COSTS, MEASURED HERE, NOW (generalised from the light board,
 * round three, 2026-09-14).
 *
 * Almost every number on a board is a value someone chose. The cost of running
 * an effect is not: it has to be measured or it is worth nothing, and "it feels
 * smooth on my machine" is the claim this exists to replace.
 *
 * ★ THE MEASUREMENT MUST ISOLATE ITS SPECIMEN. A frame time taken with twenty
 * other lamps running measures the BOARD, not the proposal. The board sets
 * `data-lab-solo` on <html> while a run is in flight and its own sheet hides
 * every animated thing except the one inside `[data-lab-solo-target]`, which is
 * the specimen directly above the meter. Without that the numbers are noise
 * that happens to have three decimal places.
 *
 * ★ AND IT REPORTS WHAT IT CANNOT SEE. A frame gap counts the frames the page
 * MISSED; it cannot see how hard the GPU worked to make the ones it hit. So the
 * static half (the filtered area, the layer count) is the part that carries to
 * a slower machine, and the line under the table says so rather than letting a
 * clean 60 read as "free".
 *
 * ★ A HIDDEN TAB THROTTLES rAF AND THE STAGE PAUSES ITS LOOPS, so a run taken
 * with the board behind another window measures neither the candidate nor the
 * browser. The meter says so rather than printing a catastrophe.
 */
export type CostPhase = {
  id: string;
  label: string;
  /** Put the board into this phase; awaited settle happens after. */
  enter?: () => void;
  /** `none` hides every animated thing; `target` solos the specimen. */
  solo?: "none" | "target";
};

type Row = {
  label: string;
  mean: number;
  worst: number;
  dropped: number;
  frames: number;
};

function sampleFrames(ms: number): Promise<number[]> {
  return new Promise((resolve) => {
    const gaps: number[] = [];
    let last = performance.now();
    const start = last;
    const step = (now: number) => {
      gaps.push(now - last);
      last = now;
      if (now - start < ms) requestAnimationFrame(step);
      // The first gap spans the call itself; drop it.
      else resolve(gaps.slice(1));
    };
    requestAnimationFrame(step);
  });
}

export function CostMeter({
  phases,
  /** One line read off the specimen itself: layers, filtered area, megapixels. */
  statics,
  sampleMs = 1800,
  className,
}: {
  phases: readonly CostPhase[];
  statics?: string | null;
  sampleMs?: number;
  className?: string;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  async function run() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setRows(null);
    const out: Row[] = [];
    const root = document.documentElement;
    try {
      for (const p of phases) {
        p.enter?.();
        root.dataset.labSolo = p.solo ?? "target";
        // One beat for React to commit the phase and for the compositor to
        // settle; a sample taken across the switch measures the switch.
        await new Promise((r) => window.setTimeout(r, 650));
        const gaps = await sampleFrames(sampleMs);
        const mean = gaps.reduce((a, b) => a + b, 0) / (gaps.length || 1);
        out.push({
          label: p.label,
          mean: Number(mean.toFixed(1)),
          worst: Number(Math.max(...gaps, 0).toFixed(1)),
          dropped: gaps.filter((g) => g > 17).length,
          frames: gaps.length,
        });
      }
    } finally {
      delete root.dataset.labSolo;
      setRows(out);
      setBusy(false);
      running.current = false;
    }
  }

  const seconds = Math.round((phases.length * (sampleMs + 650)) / 1000);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className={cn(
            "h-8 rounded-[var(--radius-action-sm)] px-3 text-[12px] font-medium transition-[transform,background-color,color] duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none",
            busy
              ? "border border-border bg-card text-muted-foreground"
              : "bg-foreground text-background",
          )}
        >
          {busy
            ? `Measuring, about ${seconds} seconds`
            : `Measure the ${phases.length} states`}
        </button>
        <span className="text-[11px] text-muted-foreground">
          {(sampleMs / 1000).toFixed(1)} second samples on the specimen above,
          everything else on the board hidden while it runs.
        </span>
      </div>

      {statics ? (
        <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">
            What is on the screen:{" "}
          </span>
          {statics}
        </p>
      ) : null}

      {rows ? (
        <div className="max-w-2xl overflow-x-auto">
          <table className="w-full text-left text-[11px] tabular-nums">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 pr-4 font-medium">State</th>
                <th className="py-1 pr-4 font-medium">Mean frame</th>
                <th className="py-1 pr-4 font-medium">Longest</th>
                <th className="py-1 font-medium">Frames over 17ms</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-border">
                  <td className="py-1.5 pr-4 text-foreground">{r.label}</td>
                  <td className="py-1.5 pr-4">{r.mean} ms</td>
                  <td className="py-1.5 pr-4">{r.worst} ms</td>
                  <td className="py-1.5">
                    {r.dropped} of {r.frames}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            A frame gap counts what the page MISSED, so clean sixteens mean the
            candidate is inside budget on this machine, not that it is free: the
            work it does is raster these numbers cannot see. The static line is
            the half that carries to a slower one.
          </p>
          {rows.some((r) => r.mean > 40) ? (
            <p className="mt-1 text-[11px] leading-relaxed text-foreground">
              Those gaps are far too long to be the candidate. This tab was
              behind something while it ran, which throttles frames and pauses
              every loop on the board. Run it again with the board in front.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

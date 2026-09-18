"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * TWO STATES OF ONE THING, TOUCHING.
 *
 * ★ `differs` IS REQUIRED, AND THAT IS THE WHOLE CONTRACT. A comparison with no
 * statement of what differs is a picture, and a reviewer has to reverse-engineer
 * the claim from the pixels. Every Compare says, in one line, the single thing
 * that is different between A and B; if the author cannot write that line the
 * comparison is not ready to be on a board.
 *
 * Three modes, and the choice is about the SIZE of the difference:
 *
 *  - `side`: the honest default. Two of the thing, the same size, the same
 *    place, read left to right. Right for a difference the eye can hold across
 *    a gap: a corner, a weight, a colour.
 *  - `wipe`: one of the thing, A left of the handle and B right of it. Right
 *    for a difference at the edge of perception, which is exactly where a
 *    printed pair 800px apart fails: it asks a reviewer to hold a very quiet
 *    field in his memory while he scrolls. The seam down the middle IS the
 *    difference.
 *    ★ IT IS A RANGE INPUT ON PURPOSE. A custom drag handle needs pointer
 *    capture, a keyboard story and a focus ring to be operable at all; a range
 *    has all three for free, and the board is judged on the specimen rather
 *    than on its own chrome.
 *  - `stack`: A and B in the same box, B faded over A on a slider. Right for a
 *    difference in POSITION or SIZE, where side-by-side hides the very thing
 *    being judged (a two pixel shift reads as two identical cards).
 */
export type CompareMode = "side" | "wipe" | "stack";

export function Compare({
  mode = "side",
  differs,
  a,
  b,
  labels = ["Today", "The candidate"],
  cols,
  className,
}: {
  mode?: CompareMode;
  /** The one thing that is different. Required. */
  differs: string;
  a: React.ReactNode;
  b: React.ReactNode;
  labels?: [string, string];
  /**
   * The `side` columns as a NUMBER the board computes from its canvas
   * (`mode === "desktop" ? 2 : 1`), because a breakpoint prefix inside a
   * Stage reads the real browser window, not the canvas (stage.tsx's
   * landmine): on a wide window the 375 stage laid two 160px halves where a
   * phone has room for one (the river-visual migration, 2026-09-15). Left
   * out, the responsive default holds for a Compare outside any stage.
   */
  cols?: 1 | 2;
  className?: string;
}) {
  const [at, setAt] = useState(50);
  const id = useId();
  const [left, right] = labels;

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      {mode === "side" ? (
        <div
          className={cn(
            "grid min-w-0 gap-4",
            cols === undefined && "grid-cols-1 sm:grid-cols-2",
          )}
          style={
            cols === undefined
              ? undefined
              : { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
          }
        >
          <Half label={left}>{a}</Half>
          <Half label={right}>{b}</Half>
        </div>
      ) : (
        <>
          <div className="relative min-w-0 overflow-hidden">
            <div>{a}</div>
            <div
              aria-hidden
              className="absolute inset-0"
              style={
                mode === "wipe"
                  ? { clipPath: `inset(0 0 0 ${at}%)` }
                  : { opacity: at / 100 }
              }
            >
              {b}
            </div>
            {mode === "wipe" ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-px bg-foreground/40"
                style={{ left: `${at}%` }}
              />
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor={id}
              className="text-[11px] font-medium text-muted-foreground"
            >
              {left}
            </label>
            <input
              id={id}
              type="range"
              min={0}
              max={100}
              step={1}
              value={at}
              onChange={(e) => setAt(Number(e.target.value))}
              style={{ accentColor: "var(--foreground)" }}
              className="h-4 w-64 cursor-ew-resize"
            />
            <span className="text-[11px] font-medium text-muted-foreground">
              {right}
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {at}%
            </span>
          </div>
        </>
      )}
      <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">What differs: </span>
        {differs}
      </p>
    </div>
  );
}

function Half({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      {children}
      <p className="mt-2 text-[11px] leading-snug font-medium text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

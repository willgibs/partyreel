"use client";

import { useEffect, useRef } from "react";

import type { BoardState } from "@/components/lab/board-spec";

import { RowsAlbum, useLiveAlbum } from "./album";
import { Canvas, Ground, readRows } from "./canvas";
import { screenOf } from "./screens";

export type ArrivalOption = "rise" | "push" | "beats" | "snap";

/**
 * ONE ARRIVAL DIRECTION, ON THE REAL ROWS. Every option is the same album, the
 * same engine and the same glide; what differs is only how the new photograph
 * enters and whether the rows glide or land, and that lives in the board's
 * sheet (`album-columns.css`, keyed on `data-arrival`) plus one variable the
 * grid already reads (`--arrival-glide-ms`). The picked one moves into
 * production at the wiring; the rest retire with the board.
 *
 * ★ THE CAPTION COUNTS WHAT MOVED, READ OFF THE FRAME. A beat after each
 * arrival settles, the rows the browser drew are compared with the rows it drew
 * a beat after the last one: a row whose photographs changed re-broke, a row
 * that kept every photograph held. The engine promises no more than four
 * re-break; this is the check that the page agrees.
 */
function ArrivalShowcase({
  option,
  report,
}: {
  option: ArrivalOption;
  report: (text: string) => void;
}) {
  const { items, arrived } = useLiveAlbum();
  const root = useRef<HTMLDivElement | null>(null);
  const settled = useRef<string[] | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    // Past the glide (450ms) and the two-beat landing (450 + 320ms).
    const t = setTimeout(() => {
      const rows = readRows(el).map((r) => r.ids.join(","));
      const prev = settled.current;
      settled.current = rows;
      if (!prev) {
        report(`${rows.length} rows, waiting for the first arrival`);
        return;
      }
      const now = new Set(rows);
      const rebroke = prev.filter((r) => !now.has(r)).length;
      report(
        `Last arrival: ${rebroke} row${rebroke === 1 ? "" : "s"} re-broke, ${prev.length - rebroke} kept every photo, measured`,
      );
    }, 1000);
    return () => clearTimeout(t);
  }, [items, report]);

  return (
    <div ref={root} data-arrival={option} className="min-h-full">
      <Ground>
        <RowsAlbum items={items} arrivedIds={arrived} />
      </Ground>
    </div>
  );
}

const TITLE: Record<ArrivalOption, string> = {
  rise: "Rise, rows glide",
  push: "Push in",
  beats: "Make room, then land",
  snap: "Snap, glow only",
};

export function arrivalPreview(state: BoardState, option: ArrivalOption) {
  const screen = screenOf(state.screen);
  return (
    <Canvas id={`arrival-${option}`} screen={screen} title={TITLE[option]}>
      {(report) => <ArrivalShowcase option={option} report={report} />}
    </Canvas>
  );
}

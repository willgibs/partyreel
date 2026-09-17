"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import {
  AppliedBadge,
  ApplyToSite,
  BoardPage,
  Paste,
  type BoardState,
  type Mode,
} from "@/components/lab";

import { LIGHT_CANDIDATES } from "./candidates";
import { DepthStage, type DepthPick } from "./depth";
import { FaceStage } from "./face";
import { LandingStage, type Placement } from "./landing";
import { BloomStage, HaloStage, SweepStage } from "./marks";
import { LIGHT } from "./spec";

/**
 * THE LIGHT BOARD (round eight, 2026-09-17): six steps Will can see.
 *
 * ★ THE BOARD IS A FORM, AND EACH SECTION IS ONE STEP'S PICTURE. What it ASKS
 * lives in `spec.ts` and only there. What is here is the evidence for each
 * declared section, as a function of the declared state, and the review draws
 * it twice over: once per option as a tile (the option's own state), and once
 * under the tiles as the stage (the state being shown). So a section draws ONE
 * state, never a row of them: a stage that drew its own three-up would be drawn
 * nine times.
 *
 * ★ A TILE AND THE STAGE WANT DIFFERENT PICTURES OF THE SAME SECTION, which is
 * `fit.tsx`'s second star: every stage here renders a tight true-pixel crop for
 * the tile and the whole scene for the stage, and board.css shows one of them.
 *
 * ★ REST IS SERVED BY board.css, THROUGH THE TEMPLATE'S ATTRIBUTE. The template
 * writes every declared control onto the board's root, so the sheet selects
 * `[data-motion="rest"]`. It is deliberately narrow (the engine's two animated
 * layers and this board's one-shot) because a blanket `animation: none` would
 * also freeze the marketing reveal grammar on the real section the first step
 * renders, whose pre-animation state is opacity 0.
 *
 * ★ AND A REPLAY IS A REMOUNT. Every specimen that runs a one-shot owns its own
 * (marks.tsx). An incrementing key is the whole mechanism; the engine re-keys
 * only a bloom, which is half of why round seven's sweep never replayed.
 */

/** Everything the dock is claiming, resolved once per render. */
function read(state: BoardState) {
  return {
    mode: (state.canvas ?? "desktop") as Mode,
    landing: (state.landing ?? "both") as Placement,
    depth: (state.depth ?? "both") as DepthPick,
    outline: (state.outline ?? "on") === "on",
    surface: (state.surface ?? "on") === "on",
    face: (state.face ?? "keep") === "keep",
    sweep: (state.sweep ?? "keep") === "keep",
    bloom: (state.bloom ?? "keep") === "keep",
    halo: (state.halo ?? "keep") === "keep",
  };
}

export function LightBoard() {
  return (
    <BoardPage
      spec={LIGHT}
      // Which block stands on the site, and its clear. Absent until one stands,
      // so the dock does not carry an empty slot.
      dock={() => <AppliedBadge />}
      evidence={(id, state) => {
        const s = read(state);

        switch (id) {
          case "landing":
            return <LandingStage mode={s.mode} landing={s.landing} />;

          case "depth":
            return (
              <DepthStage
                s={{ depth: s.depth, outline: s.outline, surface: s.surface }}
              />
            );

          case "face":
            return <FaceStage lit={s.face} />;

          case "sweep":
            return <SweepStage on={s.sweep} />;

          case "bloom":
            return <BloomStage rests={s.bloom} />;

          case "halo":
            return <HaloStage on={s.halo} />;

          /* ── What a wiring round lands ──────────────────────────────── */
          case "paste":
            return (
              <div className="flex flex-col gap-6">
                {LIGHT_CANDIDATES.map((c) => (
                  <div key={c.label} className="flex flex-col gap-2">
                    <ApplyToSite block={c} />
                    <Paste label={c.label} code={c.css} />
                  </div>
                ))}
              </div>
            );

          default:
            return null;
        }
      }}
    />
  );
}

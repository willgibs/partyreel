"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import {
  AppliedBadge,
  BoardPage,
  type Ground,
  type Mode,
  ReplayButton,
  useReplay,
} from "@/components/lab";

import { ComposerPart, type Register } from "./composer";
import { DepthPart } from "./depth";
import { DoctrinePart } from "./doctrine";
import { EvidencePart } from "./evidence";
import { InfusionPart } from "./infusion";
import { KitBlock } from "./kit-block";
import { LIGHT } from "./spec";
import { TreatmentsPart } from "./treatments";

/**
 * THE LIGHT BOARD (the review wave, 2026-09-14; on the kit's template since the
 * Library x Lab round, 2026-09-15).
 *
 * What the board ARGUES lives in `spec.ts` now, and only there: the question,
 * the verdict, the nine one-word calls, the candidates, the departures and the
 * two assets. What is left here is what a board should be and nothing else: the
 * evidence for each declared section, as a function of the declared state.
 *
 * Round four turned the board inside out into a kit with the arguments
 * underneath it as evidence. Round five moves the PRESENTATION of that onto the
 * template, so the verdict and the calls are the reviewer's first screen rather
 * than his last. Nothing about the light changed.
 *
 * ★ REST IS SERVED BY board.css SECTION 4, THROUGH THE TEMPLATE'S ATTRIBUTE.
 * The template writes every declared control onto the board's root, so the sheet
 * selects `[data-motion="rest"]`. It is deliberately narrow (the engine's two
 * animated layers, this board's phase marker, the publish beat) because a
 * blanket `animation: none` would also freeze the marketing reveal grammar on
 * the real sections, whose pre-animation state is opacity 0, and the board would
 * read as broken rather than at rest.
 *
 * ★ AND REPLAY IS A REMOUNT. The sweep's arrival and the three publish beats are
 * one-shots; `useReplay`'s incrementing key is the whole mechanism, and an
 * animationend listener would race the compositor.
 */
export function LightBoard() {
  const { runId, replay } = useReplay();

  return (
    <BoardPage
      spec={LIGHT}
      dock={() => (
        <>
          {/* Which block stands on the site, and its clear. Absent until one
              stands, so the dock does not carry an empty slot. */}
          <AppliedBadge />
          <ReplayButton runId={runId} onReplay={replay} />
        </>
      )}
      evidence={(id, state) => {
        const mode = state.canvas as Mode;
        const ground = state.ground as Ground;
        const register = state.register as Register;
        switch (id) {
          case "kit":
            return <KitBlock />;
          case "treatments":
            return <TreatmentsPart mode={mode} ground={ground} runId={runId} />;
          case "composer":
            return (
              <ComposerPart mode={mode} ground={ground} register={register} />
            );
          case "separate":
            return <DepthPart mode={mode} ground={ground} />;
          case "evidence":
            return (
              <EvidencePart mode={mode} ground={ground} register={register} />
            );
          case "infusion":
            return <InfusionPart />;
          case "paste":
            return <DoctrinePart />;
          default:
            return null;
        }
      }}
    />
  );
}

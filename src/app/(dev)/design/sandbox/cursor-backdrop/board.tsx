"use client";

import "./cursor-backdrop.css";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { POOL, type LegibilityId } from "./backdrop";
import type { Config, EntranceId, PathId, TriggerId } from "./backdrop-engine";
import {
  CELLS,
  type GroundId,
  Room,
  SECTIONS,
  type SectionId,
  sectionOf,
} from "./sections";
import { CURSOR_BACKDROP } from "./spec";
import { ChapterStrip, rhythmOf } from "./strip";

/**
 * THE PREVIEWS: every option is a shipped home-page section, at 1440 or 375, in
 * a real viewport, with the backdrop's rules on it.
 *
 * ★ EVERY TILE IS A FUNCTION OF THE BOARD'S STATE. The section is the first
 * decision and everything after it is drawn ON the section he picked; the
 * trigger is drawn at the travel distance on the knob, the entrance at the pace
 * on the knob, the copy's treatment on the ground on the knob. Going back to an
 * earlier decision redraws it in the world he has chosen since, rather than in
 * the one the board defaulted to.
 *
 * ★ A TILE IS ALIVE UNTIL HE POINTS AT IT, AND THEN IT IS HIS. `drive="auto"`
 * runs the scripted path so a tile nobody is touching still shows what its
 * option does (and so a capture is evidence); the moment a real pointer enters
 * the room it takes over, and the simulated ring goes. This is the whole reason
 * the pointer is an argument to a pure function rather than an event handler.
 */

const triggerOf = (v: string | undefined): TriggerId =>
  v === "travel" ? "travel" : v === "cells" ? "cells" : "band";
const entranceOf = (v: string | undefined): EntranceId =>
  v === "wipe" ? "wipe" : v === "cut" ? "cut" : "slide";
const legibilityOf = (v: string | undefined): LegibilityId =>
  v === "scrim" ? "scrim" : v === "half" ? "half" : "plate";
const groundOf = (v: string | undefined): GroundId =>
  v === "paper" ? "paper" : "cinema";
const numberOf = (v: string | undefined, fallback: number) =>
  v && Number.isFinite(Number(v)) ? Number(v) : fallback;

function cfgFrom(
  s: BoardState,
  over: Partial<Config> = {},
): Omit<Config, "box"> {
  return {
    pool: POOL.length,
    trigger: triggerOf(s.trigger),
    entrance: entranceOf(s.entrance),
    travel: numberOf(s.travel, 180),
    pace: numberOf(s.pace, 680),
    cells: CELLS,
    ...over,
  };
}

/**
 * ★ THE HEIGHTS ARE MEASURED, NOT CHOSEN. A `Frame` is a real viewport and
 * needs a number before anything has rendered, so these are the sections' own
 * rendered heights, read off the running board at 1440 and at 375 and recorded
 * in `docs/tracks/cursor-backdrop.md`. The caption under every frame then
 * reports what the section ACTUALLY measured inside it: if the two disagree,
 * the caption is the truth (the rule gallery-width paid for).
 */
const H: Record<SectionId, { desktop: number; phone: number }> = {
  "full-quality": { desktop: 536, phone: 812 },
  "no-app": { desktop: 712, phone: 858 },
  "pricing-teaser": { desktop: 672, phone: 1004 },
};

/** A plate adds its own padding above and below the section. */
const PLATE_PAD = 112;
/** A paper chapter under lg compresses its sections' padding (PaperChapter). */
const heightOf = (
  section: SectionId,
  at: "desktop" | "phone",
  legibility: LegibilityId,
) => H[section][at] + (legibility === "plate" ? PLATE_PAD : 0);

/**
 * THE POOL'S COST, measured with Chrome over the running board at 1440 (the
 * method and the date are in the track's manifest). Over the wire it is the
 * eight optimised files `next/image` serves; decoded, it is what the compositor
 * holds while the section is on screen, and that is the number that decides how
 * big a pool a full-bleed section may have.
 */
export const POOL_COST = {
  files: 8,
  overTheWireKb: 752,
  decodedMb: 17.3,
  servedWidth: 900,
};

const costLine = `The pool: ${POOL_COST.files} photographs, ${POOL_COST.overTheWireKb} KB over the wire, about ${POOL_COST.decodedMb} MB decoded while the section is on screen.`;

/* ── the measurement under every frame ───────────────────────────────────── */

/** Reads the section's own laid-out height from inside the frame's document. */
function Measured({
  onMeasure,
  children,
}: {
  onMeasure: (h: number) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument?.defaultView;
    if (!el || !win) return;
    const read = () => onMeasure(Math.round(el.getBoundingClientRect().height));
    read();
    // ★ THE OBSERVER IS THE FRAME'S, NOT THE BOARD'S: the subtree lives in the
    // iframe's document, and it re-flows when the copied stylesheets land.
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onMeasure]);
  return <div ref={ref}>{children}</div>;
}

type SceneProps = {
  id: string;
  state: BoardState;
  at?: "desktop" | "phone";
  section?: SectionId;
  backdrop?: boolean;
  over?: Partial<Config>;
  legibility?: LegibilityId;
  ground?: GroundId;
  path?: PathId;
  entranceAt?: number;
  rail?: boolean;
  ghost?: boolean;
  note?: string;
};

function Scene({
  id,
  state,
  at = "desktop",
  section,
  backdrop = true,
  over,
  legibility,
  ground,
  path,
  entranceAt,
  rail,
  ghost,
  note,
}: SceneProps) {
  const [h, setH] = useState<number | null>(null);
  const pick = section ?? sectionOf(state.section);
  const leg = legibility ?? legibilityOf(state.legibility);
  const grd = ground ?? groundOf(state.ground);
  const w = at === "desktop" ? 1440 : 375;
  const entry = SECTIONS[pick];
  return (
    <Frame
      id={id}
      w={w}
      // With no backdrop there is no plate, so the section keeps its own height.
      h={heightOf(pick, at, backdrop ? leg : "scrim")}
      title={at === "desktop" ? "1440" : "375"}
      caption={
        <>
          {entry.name} — {entry.where}. Measured in the frame:{" "}
          {h === null ? "…" : `${h} px tall`}. {backdrop ? costLine : null}{" "}
          {note}
        </>
      }
    >
      <Measured onMeasure={setH}>
        <Room
          section={pick}
          backdrop={backdrop}
          cfg={cfgFrom(state, over)}
          drive={backdrop ? "auto" : "still"}
          entranceAt={entranceAt}
          path={path}
          legibility={leg}
          ground={grd}
          rail={rail}
          ghost={ghost}
        />
      </Measured>
    </Frame>
  );
}

/** The rhythm's evidence: the page's chapters, then the section at 1:1. */
function PageScene({ id, state }: { id: string; state: BoardState }) {
  const rhythm = rhythmOf(state.rhythm);
  const pick = sectionOf(state.section);
  const leg = legibilityOf(state.legibility);
  const on = rhythm === "swap-paper" ? "paper" : "cinema";
  return (
    <Frame
      id={id}
      w={1440}
      h={480 + heightOf(pick, "desktop", leg)}
      title="1440"
      caption={`The home page's fifteen sections at their measured share of its height, then the section at 1:1 on the ground this option puts it on. ${costLine}`}
    >
      <div className="dark bg-background px-10 py-10" data-mkt="">
        <ChapterStrip rhythm={rhythm} height={400} />
      </div>
      <Room
        section={pick}
        backdrop
        cfg={cfgFrom(state)}
        drive="auto"
        legibility={leg}
        ground={on}
        rail={triggerOf(state.trigger) === "band"}
      />
    </Frame>
  );
}

const PREVIEWS: PreviewsFor<typeof CURSOR_BACKDROP> = {
  "section.full-quality": (s) => (
    <Scene id="cb-sec-fq" state={s} section="full-quality" rail />
  ),
  "section.no-app": (s) => (
    <Scene id="cb-sec-na" state={s} section="no-app" rail />
  ),
  "section.pricing-teaser": (s) => (
    <Scene id="cb-sec-pt" state={s} section="pricing-teaser" rail />
  ),
  "section.none": (s) => (
    <Scene
      id="cb-sec-none"
      state={s}
      backdrop={false}
      note="Today: the section as it ships, with whatever light it already has."
    />
  ),

  "legibility.plate": (s) => (
    <Scene
      id="cb-leg-plate"
      state={s}
      legibility="plate"
      note="Worst photograph in the pool: the copy reads at 9.4:1 over the pane."
    />
  ),
  "legibility.scrim": (s) => (
    <Scene
      id="cb-leg-scrim"
      state={s}
      legibility="scrim"
      note="Worst photograph in the pool: the copy reads at 6.1:1 through the scrim."
    />
  ),
  "legibility.half": (s) => (
    <Scene
      id="cb-leg-half"
      state={s}
      legibility="half"
      note="The copy is on the section's own ground, so contrast is the page's own 15.9:1."
    />
  ),

  "trigger.band": (s) => (
    <Scene
      id="cb-trg-band"
      state={s}
      over={{ trigger: "band" }}
      rail
      ghost
      note="The rail at the foot is the proposed delight: eight ticks, the live one lit, only while the pointer is in the room."
    />
  ),
  "trigger.travel": (s) => (
    <Scene id="cb-trg-travel" state={s} over={{ trigger: "travel" }} ghost />
  ),
  "trigger.cells": (s) => (
    <Scene id="cb-trg-cells" state={s} over={{ trigger: "cells" }} ghost />
  ),

  "entrance.slide": (s) => (
    <Scene
      id="cb-ent-slide"
      state={s}
      over={{ entrance: "slide" }}
      entranceAt={0.42}
    />
  ),
  "entrance.wipe": (s) => (
    <Scene
      id="cb-ent-wipe"
      state={s}
      over={{ entrance: "wipe" }}
      entranceAt={0.42}
    />
  ),
  "entrance.cut": (s) => (
    <Scene
      id="cb-ent-cut"
      state={s}
      over={{ entrance: "cut" }}
      entranceAt={0.42}
    />
  ),

  "rhythm.swap-dark": (s) => <PageScene id="cb-rhy-dark" state={s} />,
  "rhythm.swap-paper": (s) => <PageScene id="cb-rhy-paper" state={s} />,
  "rhythm.insert": (s) => <PageScene id="cb-rhy-insert" state={s} />,

  "phone.scroll": (s) => (
    <Scene id="cb-ph-scroll" state={s} at="phone" path="scroll" />
  ),
  "phone.cycle": (s) => (
    <Scene id="cb-ph-cycle" state={s} at="phone" path="cycle" />
  ),
  "phone.still": (s) => (
    <Scene id="cb-ph-still" state={s} at="phone" path="rest" />
  ),
};

export function CursorBackdropBoard() {
  return <ExplorationBoard spec={CURSOR_BACKDROP} previews={PREVIEWS} />;
}

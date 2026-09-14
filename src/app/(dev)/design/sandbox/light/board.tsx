"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useState } from "react";

import { BoardMeta, Toggle, type Mode } from "@/components/dev/board";

import { AuroraPart } from "./aurora";
import { CadencePart, VioletPart } from "./beats";
import { DepthPart } from "./depth";

/**
 * THE LIGHT BOARD (the review wave, 2026-09-14).
 *
 * Bible 10 was rewritten and bible 11 is retiring, which leaves the light
 * doctrine with a hole in the middle of it, and the honest way to fill the hole
 * is not to patch the two laws that broke. Rising tides (bible 22): if light,
 * shadow and lamp were one system designed today, what would it be?
 *
 * ── WHAT THE BOARD ARGUES ──
 *
 * The system today is organised around WHERE LIGHT COMES FROM. SPILL is light
 * from a lit thing; BEAM is a lit thing; the elevation contract is a separate
 * section about shadows and lives one mode at a time. Three consequences, all
 * visible in the repo: the footer's seam, the lamp Will likes most, is illegal
 * under the law that opens the doctrine; dark has no shadow even where two
 * photographs plainly need one; and the ring lift, the fourth depth technique
 * with 77 uses, is in no document at all.
 *
 * Organise it around WHAT THE LIGHT IS DOING instead and the same parts fall
 * into three jobs that do not overlap:
 *
 *   SEPARATE  achromatic, static. Tells you one object is in front of another.
 *             Surface step, hairline, ring, shadow, lit face. This is the
 *             elevation contract, and it belongs INSIDE the light doctrine
 *             rather than beside it. Part A.
 *   FILL      chromatic, slow, behind everything. Gives a room a temperature.
 *             Spill, and the aurora it grows into. Parts B and C.
 *   MARK      chromatic, bounded, ends when the state ends. The beam, and the
 *             publish moment. Part D.
 *
 * The rule that replaces "name the lamp or there is no spill" falls out of the
 * FILL job: a lamp needs a PLACE, not an object. An edge, a boundary, a screen,
 * a plate, a horizon. The footer seam has one; a pill's rim does not; every
 * verdict the old law got right, it still gets right.
 *
 * ── HOW TO READ IT ──
 *
 * Each part carries its own grounds and its own toggles, because each part is
 * judged on a different set of them, and ends in the proposal it lands on.
 * Nothing on this board is production: the doctrine is drafted in the track
 * manifest's Record and the Orchestrator lands it in design-system.md at the
 * ruling. Keyframes live in board.css under `lgt-`.
 */
const QUESTION =
  "Light, shadow and lamp as one system, the aurora infused as identity: where shadows return in dark, how a lamp lights a section without media, and what replaces the source-and-direction law.";

const CANDIDATES = [
  {
    name: "Tune",
    rationale:
      "Keep SPILL and BEAM and their eight laws; amend law 1 so a boundary counts as a source, and let a shadow into dark for overlapping media. The smallest change that makes the footer legal.",
  },
  {
    name: "Regroup (the board's recommendation)",
    rationale:
      "One doctrine in three jobs: separate, fill, mark. The elevation contract moves inside it and stops being per mode; the lamp needs a place rather than an object; the aurora is named as the fill register at chapter scale.",
  },
  {
    name: "Replace",
    rationale:
      "The aurora becomes the primary layer: every chapter carries a temperature drawn from the five, spill becomes an aurora anchored to an object, and the laws collapse to two, place and falloff. Candidate C in part B is what that looks like.",
  },
];

const ASKS = [
  "Depth in dark: the cue set for stacked media cards, a layer over content and a flat card",
  "Lamps without media: the section aurora, yes or no, and its register on cinema and on paper",
  "The cadence: 8s or 11s",
  "The publish beat's violet",
  "The lit surface ([data-lit]): adopt, adapt or drop",
];

const DEPARTURES = [
  "Part A proposes a shadow family in DARK (--lgt-lift, --lgt-float, board.css). The elevation contract still reads 'Dark: NO shadows anywhere' and --shadow-float is zeroed in .dark; bible 10's rewrite anticipates this, the values are new.",
  "Part A moves the ring lift into the contract. It has 77 uses across the app and appears in no document; naming it makes a fourth technique official.",
  "Part B lets a section retune --lamp-* for everything inside it. The engine already documents the hook and bible 3 still holds (light, never UI), but a per-chapter temperature is a new licence and it is the aurora's whole identity claim.",
  "Part B candidate C is the fill globals.css warns against by name ('a seam is a band, not a fill'). On the board so the warning can be tested rather than quoted.",
  "Part B proposes a hand-tuned paper five, replacing SPILL_REGISTER.paper's single flat row. design-system.md calls that an open design task; this is a proposal for it.",
  "Part D changes a ratified beat: the publish flourish's oklch(0.62 0.2 300) becomes the lamp set's 305, and the beat decays to a base instead of returning to nothing.",
  "Part B ships a grain layer over the aurora. An 8-bit gradient at that size bands; the grain is the fix and it is currently a generated stand-in.",
];

const ASSETS = [
  "A grain tile, so the aurora stops banding: seamless monochrome noise, 256x256 PNG-8, fine grain (roughly 1px), neutral, mean 50 percent grey, to be used at about 5 percent over the light. Replaces the inline feTurbulence stand-in in board.css ([data-lgt-grain]).",
  "A worst-case pair of overlapping photographs for part A: two images whose touching edges are both dark and low contrast (a night reception, a dim dance floor), 1200px long edge, JPG, so the depth cue is judged against the case it exists for rather than a lucky one. Replaces the reception-hall and wedding-toast pair in depth.tsx.",
];

export function LightBoard() {
  const [mode, setMode] = useState<Mode>("desktop");

  return (
    <div className="flex flex-col gap-10 py-4">
      <div className="max-w-2xl space-y-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          The doctrine is organised around where light comes from. That is why
          the footer seam, the one lamp with nothing emitting and the one named
          as the model, is illegal under the law that opens it; why dark has no
          shadow even where two photographs need separating; and why the ring
          lift, with 77 uses, is written down nowhere.
        </p>
        <p>
          This board argues for organising it around what the light is doing
          instead. Three jobs that do not overlap. SEPARATE is achromatic and
          static and tells you one object is in front of another, which makes
          the elevation contract part of the light doctrine rather than a
          section beside it. FILL is chromatic and slow and sits behind
          everything, giving a room a temperature: spill, and the aurora it
          grows into. MARK is chromatic and bounded and ends when the state
          ends: the beam, and the publish moment.
        </p>
        <p>
          The replacement for name-the-lamp falls out of the second job. A lamp
          needs a place, not an object: an edge, a boundary, a screen, a plate,
          a horizon. The footer seam has one. A pill{"'"}s rim does not. Every
          case the old law killed, the new one still kills.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Toggle
          ariaLabel="Viewport"
          options={[
            { id: "desktop" as Mode, label: "Desktop 1440" },
            { id: "phone" as Mode, label: "Phone 375" },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>

      <DepthPart mode={mode} />
      <AuroraPart mode={mode} />
      <CadencePart mode={mode} />
      <VioletPart mode={mode} />

      <BoardMeta
        question={QUESTION}
        candidates={CANDIDATES}
        asks={ASKS}
        departures={DEPARTURES}
        assets={ASSETS}
      />
    </div>
  );
}

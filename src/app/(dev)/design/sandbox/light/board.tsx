"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useState } from "react";

import {
  BoardDock,
  BoardMeta,
  Toggle,
  type Ground,
  type Mode,
} from "@/components/dev/board";

import { ComposerPart, type Register } from "./composer";
import { DepthPart } from "./depth";
import { DoctrinePart } from "./doctrine";
import { EvidencePart } from "./evidence";
import { InfusionPart } from "./infusion";
import { KitBlock } from "./kit-block";
import { AppliedBanner, Knob, RuleIndex, type Ask } from "./shared";
import { TreatmentsPart } from "./treatments";

/**
 * THE LIGHT BOARD (the review wave, 2026-09-14; round four, 2026-09-15).
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
 * into three jobs that do not overlap: SEPARATE (achromatic, static), FILL
 * (chromatic, slow, behind everything) and MARK (chromatic, bounded, ends with
 * its state). The rule that replaces "name the lamp or there is no spill" falls
 * out of the FILL job: a lamp needs a PLACE, not an object.
 *
 * ── WHAT ROUND FOUR CHANGED, AND WHY ──
 *
 * Will's review of round three: "This currently feels more like a fun research
 * report without many applicable takeaways to carry into the platform. We have
 * so many beautiful designs from the spill doctrine and spill placements
 * explorations as well ... the three explorations set our future visual
 * identity that will be progressively infused into the new marketing site. We
 * should find the best way to begin that infusion. With all that said, the
 * section configurator for aurora placements looks super promising."
 *
 * So the board was turned inside out. It used to be four arguments ending in a
 * doctrine; it is now a KIT, with the arguments underneath it as evidence:
 *
 *   01 THE KIT          twelve treatments across three jobs, each with its
 *                       place, its sections, its frequency and its mount; the
 *                       fences; and the seven things a wiring round types into
 *                       files. The first thing on the board, not the last.
 *   02 THE TREATMENTS   six of them on the real production sections that wear
 *                       them, at 1:1, with the lamp card that admits each and
 *                       the mount beside it. Three already ship.
 *   03 THE COMPOSER     the centrepiece Will named: light for any section. Nine
 *                       real sections, four treatments, five placements, the
 *                       register, the temperature and the clock, with the paste
 *                       and the mount exported for every configuration.
 *   04 SEPARATE         the depth cues, which are the achromatic half of the
 *                       kit and the first phase of the plan.
 *   05 THE EVIDENCE     the instruments that decided the numbers, each ending
 *                       in the line it produced. Anything that decided nothing
 *                       was cut.
 *   06 THE INFUSION     the order the identity enters the site, and why that
 *                       order and not another.
 *   07 THE RULING       the doctrine in design-system.md's own shape, so the
 *                       ruling is a paste rather than a translation.
 *
 * ── THE DOCK ──
 *
 * Will: "For any pagewide configs, the GUI control should be fixed so that
 * variants can be toggled on different previews anywhere on the page." Four
 * switches change everything on this board (the canvas, the ground, the
 * register, the motion state) and one command runs everything (Replay), so all
 * five live in the shell's BoardDock and nothing else does. Every other control
 * changes exactly one specimen and sits beside it.
 */
const QUESTION =
  "Light, shadow and lamp as one system, and the kit that carries it into the platform: what the treatments are, where each belongs, what is never done, and the order the identity enters the marketing site.";

const CANDIDATES = [
  {
    name: "The kit (the board's recommendation)",
    rationale:
      "One doctrine in three jobs, with twelve named treatments under it, each carrying a place, a section list, a frequency and a mount. The elevation contract moves inside the light doctrine and stops being per mode; the lamp needs a place rather than an object; the aurora is named as the fill register at chapter scale and gets a component. The infusion plan is the order it lands in.",
  },
  {
    name: "Tune",
    rationale:
      "Keep SPILL and BEAM and their eight laws; amend law 1 so a boundary counts as a source, and let a shadow into dark for overlapping media. The smallest change that makes the footer legal. It leaves the ring undocumented, the elevation contract outside the light doctrine, the five shapes unnamed as treatments, and nothing said about which section gets which.",
  },
  {
    name: "Replace (withdrawn in round three, and why)",
    rationale:
      "Round one's third column: the aurora becomes the primary layer, spill becomes an aurora anchored to an object, the laws collapse to place and falloff. Two rounds of specimens took it apart. The half that survived is on the board as options rather than as a doctrine (the identity register, the room), and the half that did not was never built, because an anchored aurora is a spill with a different name.",
  },
];

/**
 * THE CALLS. Nine, each answered in a word, and the FIRST TWO are the whole
 * board: the kit as written, and the order it lands in. The seven under them
 * are the places to differ. `at` is the block that argues each one: the index
 * at the top, each block's own header and the meta panel all read this array.
 */
const ASKS: Ask[] = [
  { at: "kit", text: "The kit, as written: land it, or name what to change" },
  {
    at: "infusion",
    text: "The infusion plan: begin at phase 1, or name the order",
  },
  {
    at: "composer",
    text: "The aurora: no, the seam, both boundaries, or the room",
  },
  { at: "composer", text: "Its register: accent or identity" },
  {
    at: "separate",
    text: "Depth in dark: the family (lift and float), lift only, or neither",
  },
  { at: "separate", text: "The lit face: adopt, adapt or drop" },
  { at: "evidence", text: "The cadence: 8s or 11s" },
  {
    at: "evidence",
    text: "The paper five: hand-tuned, the flat row, or the dark set",
  },
  {
    at: "treatments",
    text: "The publish beat: 300 as shipped, the house five, or 305",
  },
];

const rulesFor = (at: string) =>
  ASKS.filter((a) => a.at === at).map((a) => a.text);

const DEPARTURES = [
  "The kit proposes a shadow family in DARK (--shadow-lift, --shadow-layer). The elevation contract still reads 'Dark: NO shadows anywhere' and --shadow-float is zeroed in .dark; bible 10's rewrite anticipates this, the values are new. On a LIGHT ground lift is today's shipped value to the byte, so paper does not move.",
  "The kit moves the ring lift into the contract. It has 77 uses across the app and appears in no document; naming it makes a fourth technique official.",
  "The aurora lets a section retune --lamp-* for everything inside it. The engine already documents the hook and bible 3 still holds (light, never UI), but a per-section temperature is a new licence and it is the aurora's whole identity claim.",
  "The kit proposes a hand-tuned paper five declared on .surface-paper. design-system.md calls that an open design task; this is a proposal for it, and it is the first time --lamp-* would be re-declared per ground.",
  "The kit asks for a new production component, SectionLight, beside screen-lamp.tsx. It is the first marketing-system component whose whole job is light, and the composer exports its exact call for every configuration.",
  "The kit asks for one line of the ENGINE, and it is a law 4 fix rather than a feature: if the field takes the cheap transform drive, glw-drift-x's from-keyframe (translate: 32% 0) has to be declared outside the reduced-motion block, or a reduced-motion visitor gets the comet parked dead centre at full strength. Nobody has seen the defect because no shipped lamp uses that drive.",
  "The treatments block changes a ratified beat: the publish flourish's oklch(0.62 0.2 300) becomes the lamp set's 305, and the beat decays to a base instead of returning to nothing.",
  "The kit records that the QR plate's shipped light is a MARK and not spill (a bloom centred at 50 by 50, with no vector at all). Under law 2 a vectorless field is the even rim the doctrine refuses; naming which job a light is doing is what makes both legal, and that naming is new.",
];

const ASSETS = [
  "A grain tile, so the aurora stops banding: seamless monochrome noise, 256x256 PNG-8, fine grain (one tile pixel), neutral, mean 50 percent grey, used at about 5 percent over the light AND laid out at 128 CSS px on a 2x screen (one tile pixel per device pixel; laid out at 256 it doubles and the band returns). Replaces the inline feTurbulence stand-in in board.css ([data-lgt-grain]).",
  "A worst-case pair of overlapping photographs for the separate job: two images whose touching edges are both dark and low contrast (a night reception, a dim dance floor), 1200px long edge, JPG, so the depth cue is judged against the case it exists for rather than a lucky one. Replaces the reception-hall and wedding-toast pair in depth.tsx.",
];

const GROUNDS: { id: Ground; label: string }[] = [
  { id: "cinema", label: "Cinema" },
  { id: "paper", label: "Paper" },
  { id: "app-dark", label: "App dark" },
];

export function LightBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [ground, setGround] = useState<Ground>("cinema");
  const [register, setRegister] = useState<Register>("accent");
  // ★ THE REST STATE IS A BOARD-WIDE SWITCH, NOT A PER-PART TOGGLE. "Every
  // lamp's rest state designed, not absent" is a claim about the whole system,
  // and a per-part control would let it be true in one place and quietly false
  // in the next. board.css section 4 does the work; it is deliberately narrow
  // (the engine's two animated layers, this board's phase marker, the publish
  // beat) because a blanket animation:none would also freeze the marketing
  // reveal grammar on the real sections, whose pre-animation state is opacity
  // 0, and the board would read as broken.
  const [rest, setRest] = useState(false);
  // One replay for every one-shot on the board: the sweep's arrival and the
  // three publish beats. A one-shot fires by remount here, never by an
  // animationend listener, so a single incrementing key is the whole mechanism.
  const [runId, setRunId] = useState(0);

  return (
    <div
      className="flex flex-col gap-10 py-4"
      data-lgt-rest={rest ? "" : undefined}
    >
      <BoardDock
        label="The light board's page-wide controls"
        aside={
          <button
            type="button"
            onClick={() => setRunId((n) => n + 1)}
            className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {runId === 0 ? "Replay" : `Replay ${runId}`}
          </button>
        }
      >
        <Knob label="Canvas">
          <Toggle
            ariaLabel="Canvas"
            options={[
              { id: "desktop" as Mode, label: "1440" },
              { id: "phone" as Mode, label: "375" },
            ]}
            value={mode}
            onChange={setMode}
          />
        </Knob>
        <Knob label="Ground">
          <Toggle
            ariaLabel="Ground"
            options={GROUNDS}
            value={ground}
            onChange={setGround}
          />
        </Knob>
        <Knob label="Register">
          <Toggle
            ariaLabel="Register"
            options={[
              { id: "accent" as Register, label: "Accent" },
              { id: "identity" as Register, label: "Identity" },
            ]}
            value={register}
            onChange={setRegister}
          />
        </Knob>
        <Knob label="Motion">
          <Toggle
            ariaLabel="Motion"
            options={[
              { id: "live", label: "Live" },
              { id: "rest", label: "Rest" },
            ]}
            value={rest ? "rest" : "live"}
            onChange={(v) => setRest(v === "rest")}
          />
        </Knob>
      </BoardDock>

      <div className="max-w-2xl space-y-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          Three explorations set this identity: the spill doctrine named the
          shapes, the spill placements decided where a light is earned, and this
          board asked what the whole system would be if it were designed today.
          Round four makes them one kit, and proposes the order it enters the
          site in.
        </p>
        <p>
          The doctrine as it stands is organised around where light comes from.
          That is why the footer seam, the one lamp with nothing emitting and
          the one named as the model, is illegal under the law that opens it;
          why dark has no shadow even where two photographs need separating; and
          why the ring lift, with 77 uses, is written down nowhere. Organise it
          around what the light is DOING and the same parts fall into three jobs
          that do not overlap, and the replacement for name-the-lamp falls out
          of the second one: a lamp needs a place, not an object. An edge, a
          boundary, a screen, a plate, a horizon. The footer seam has one. A
          pill{"'"}s rim does not.
        </p>
        <p>
          <span className="font-medium text-foreground">
            What the board does beyond arguing.
          </span>{" "}
          Every treatment is shown on the production component that will wear
          it, at true pixels. The composer builds a configuration on any of nine
          real sections and exports both halves of what a wiring round needs,
          the CSS and the JSX. Where a candidate is CSS it carries an Apply to
          the site button, which hands the whole site the exact block a ruling
          would land, so the shadow family can be judged on the real dashboard
          and the paper five on the real paper chapter. The last block is the
          doctrine in design-system.md{"'"}s own shape, so the ruling is a paste
          rather than a translation.
        </p>
      </div>

      <RuleIndex asks={ASKS} />

      <AppliedBanner />

      <KitBlock />

      <TreatmentsPart
        mode={mode}
        ground={ground}
        runId={runId}
        rules={rulesFor("treatments")}
      />

      <ComposerPart
        mode={mode}
        ground={ground}
        register={register}
        rules={rulesFor("composer")}
      />

      <DepthPart mode={mode} ground={ground} rules={rulesFor("separate")} />

      <EvidencePart
        mode={mode}
        ground={ground}
        register={register}
        rules={rulesFor("evidence")}
      />

      <InfusionPart rules={rulesFor("infusion")} />

      <DoctrinePart rules={rulesFor("paste")} />

      <BoardMeta
        question={QUESTION}
        candidates={CANDIDATES}
        asks={ASKS.map((a) => a.text)}
        departures={DEPARTURES}
        assets={ASSETS}
      />
    </div>
  );
}

"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useState } from "react";

import {
  AppliedBadge,
  ApplyToSite,
  BoardPage,
  CANVAS,
  Catalog,
  CellLabel,
  Frame,
  FrameRow,
  Knob,
  Labeled,
  Paste,
  Toggle,
  type BoardState,
  type Mode,
} from "@/components/lab";

import { blockFor, noBlockBecause } from "./blocks";
import { ENGINE_DRIVE_FIX, LIGHT_CANDIDATES, PUBLISH_LEAN } from "./candidates";
import { type Placement } from "./composer";
import { FENCES, LANDS, type TreatmentId } from "./kit";
import { BeforeAfter, Usages } from "./previews";
import {
  AuroraStage,
  BeatStage,
  ClockStage,
  HuesStage,
  OrderStage,
} from "./stages";
import { LIGHT } from "./spec";

/**
 * THE LIGHT BOARD (round seven, the stepped review, 2026-09-16).
 *
 * ★ THE BOARD IS A WALK NOW. Will stopped his sitting here: "are each of these
 * individually proposed treatments? How will each be applied platform wide?
 * Some I can't even tell what the 'treatment' is from the comparison", and then
 * the shape he wanted, in his own words: "1 at a time may be more helpful
 * here", with "where it'll be used, a couple demo usages". So a card is one
 * screen: the same specimen twice (as today, then with it), what keeping it
 * lands as platform-wide, and the real surfaces already wearing it. Twelve
 * cards, then five steps that each bring their own context.
 *
 * What the board ARGUES lives in `spec.ts` and only there. What is left here is
 * the evidence for each declared section, as a function of the declared state.
 *
 * ★ FOUR OF THE SEVEN CONTROLS ARE A STEP'S OWN TILES. Landing, Cadence, Hues
 * and Beat each serve exactly one question, so the review draws every option on
 * that step's one specimen and the reviewer never meets the switch; the stage
 * below reads the state the tile set. That is why each of those sections draws
 * ONE state and never a row of them: a stage that drew its own three-up would
 * be drawn nine times.
 *
 * ★ REST IS SERVED BY board.css SECTION 4, THROUGH THE TEMPLATE'S ATTRIBUTE.
 * The template writes every declared control onto the board's root, so the
 * sheet selects `[data-motion="rest"]`. It is deliberately narrow (the engine's
 * two animated layers, the publish beat) because a blanket `animation: none`
 * would also freeze the marketing reveal grammar on the real sections, whose
 * pre-animation state is opacity 0, and the board would read as broken rather
 * than at rest.
 *
 * ★ AND A REPLAY IS A REMOUNT. Every specimen that runs a one-shot owns its own
 * (previews.tsx, stages.tsx). An incrementing key is the whole mechanism, and
 * an animationend listener races the compositor.
 */

/** Everything the dock is claiming, resolved once per render. */
function read(state: BoardState) {
  const mode = (state.canvas ?? "desktop") as Mode;
  const picked =
    state.treatment && state.treatment !== "none"
      ? (state.treatment as TreatmentId)
      : null;
  return {
    mode,
    desktop: mode === "desktop",
    landing: (state.landing ?? "both") as Placement,
    cadence: state.cadence ?? "8s",
    hues: state.hues ?? "hand-tuned",
    beat: state.beat ?? "305",
    picked,
    block: picked ? blockFor(picked) : null,
  };
}

const WALK = LIGHT.links.pages ?? [];

export function LightBoard() {
  const [page, setPage] = useState<string>(WALK[0]?.path ?? "/");
  // ★ ONE FRAME BY DEFAULT, AND THAT IS NOT LAZINESS. A frame is a REAL 1440
  // viewport, so two of them side by side are 2880 pixels and the second one is
  // off the right edge of a 1440 screen: it loads on approach, and approach
  // never happens, so the frame wearing the ruling is the one nobody sees.
  // Nothing picked shows the site as built; pick a card and this frame wears
  // its block; turn Today on and scroll the row when a seam needs both.
  const [split, setSplit] = useState<"on" | "off">("off");

  return (
    <BoardPage
      spec={LIGHT}
      dock={(state) => {
        const s = read(state);
        return (
          <>
            {/* Which block stands on the site, and its clear. Absent until one
                stands, so the dock does not carry an empty slot. */}
            <AppliedBadge />
            {s.block ? (
              <ApplyToSite block={s.block} />
            ) : s.picked ? (
              <span className="text-[11px] text-muted-foreground">
                {noBlockBecause(s.picked)}
              </span>
            ) : null}
          </>
        );
      }}
      evidence={(id, state, api) => {
        const s = read(state);

        switch (id) {
          /* ── The twelve ─────────────────────────────────────────────── */
          case "catalog":
            return (
              // One column, and that is the whole reading. A card is the same
              // real specimen drawn twice, and a chapter specimen is a window
              // onto 1440: two cards abreast would halve both halves and hand
              // back the unreadable comparison this round exists to end.
              <Catalog
                spec={LIGHT}
                state={state}
                setState={api.setState}
                minWidth={900}
                render={(candidate) => (
                  <div className="flex flex-col gap-4">
                    <BeforeAfter
                      id={candidate.id as TreatmentId}
                      mode={s.mode}
                      landing={s.landing}
                    />
                    <Usages id={candidate.id as TreatmentId} mode={s.mode} />
                  </div>
                )}
              />
            );

          /* ── Where the aurora lands ─────────────────────────────────── */
          case "aurora":
            return <AuroraStage mode={s.mode} landing={s.landing} />;

          /* ── How slowly a lamp breathes ─────────────────────────────── */
          case "clock":
            return <ClockStage mode={s.mode} cadence={s.cadence} />;

          /* ── The five hues, on paper ────────────────────────────────── */
          case "hues":
            return <HuesStage mode={s.mode} hues={s.hues} />;

          /* ── The publish flourish ───────────────────────────────────── */
          case "beat":
            return <BeatStage mode={s.mode} beat={s.beat} />;

          /* ── What lands second ──────────────────────────────────────── */
          case "order":
            return <OrderStage />;

          /* ── The real pages ─────────────────────────────────────────── */
          case "pages": {
            const { w, h } = CANVAS[s.mode];
            const target = WALK.find((p) => p.path === page) ?? WALK[0];
            const together = split === "on";
            const css = s.block?.css ?? "";
            return (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Knob label="Page">
                    <Toggle
                      ariaLabel="Page"
                      options={WALK.map((p) => ({
                        id: p.path,
                        label: p.label,
                      }))}
                      value={page}
                      onChange={setPage}
                    />
                  </Knob>
                  <Knob label="Today beside it">
                    <Toggle
                      ariaLabel="Today beside it"
                      options={[
                        { id: "on" as const, label: "On" },
                        { id: "off" as const, label: "Off" },
                      ]}
                      value={split}
                      onChange={setSplit}
                    />
                  </Knob>
                </div>
                <FrameRow lock={together && !!css}>
                  {together && css ? (
                    <Frame
                      id="lgt-today"
                      src={target.path}
                      w={w}
                      h={h}
                      title="Today"
                      caption="The page as it ships, no sheet written into it."
                      onApproach
                    />
                  ) : null}
                  <Frame
                    id="lgt-picked"
                    src={target.path}
                    w={w}
                    h={h}
                    css={css}
                    title={s.block?.label ?? "Nothing picked"}
                    caption={
                      css
                        ? "The picked treatment's paste, written into this document. Scroll the row for Today beside it."
                        : "Nothing picked, so this is the site as built. Press Pick on a card above."
                    }
                    onApproach
                  />
                </FrameRow>
                <CellLabel className="max-w-2xl">{target.note}</CellLabel>
              </div>
            );
          }

          /* ── The ruling, as a paste ─────────────────────────────────── */
          case "paste":
            return (
              <div className="flex flex-col gap-5">
                <Labeled
                  name="The blocks"
                  note="The same CSS a Pick hands the site, plus the one engine line no button applies."
                >
                  <div className="flex flex-col gap-4">
                    {LIGHT_CANDIDATES.map((c) => (
                      <Paste key={c.label} label={c.label} code={c.css} />
                    ))}
                    <Paste label={PUBLISH_LEAN.label} code={PUBLISH_LEAN.css} />
                    <Paste
                      label="Light: the engine's one line (the transform drive's rest state)"
                      code={ENGINE_DRIVE_FIX}
                    />
                  </div>
                </Labeled>

                {/* Folded, both of them: a bill of materials is for the author
                    of the wiring round and a fence list is for the reader who
                    disagrees, and neither is what a reviewer is here to read.
                    The smoke counts what is not folded. */}
                <details className="text-[11px] leading-relaxed">
                  <summary className="cursor-pointer text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none">
                    The seven things a wiring round types into a file
                  </summary>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {LANDS.map((l) => (
                      <li key={l.what} className="text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {l.what}
                        </span>{" "}
                        in {l.where}. {l.is}
                      </li>
                    ))}
                  </ul>
                </details>

                <details className="text-[11px] leading-relaxed">
                  <summary className="cursor-pointer text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none">
                    What is never done, and the case behind each one
                  </summary>
                  <ul className="mt-2 flex flex-col gap-2">
                    {FENCES.map((f) => (
                      <li key={f.rule} className="text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {f.rule}
                        </span>{" "}
                        {f.because}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            );

          default:
            return null;
        }
      }}
    />
  );
}

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
  CompareTwo,
  Frame,
  FrameRow,
  GroundBox,
  Knob,
  Labeled,
  Paste,
  ReplayButton,
  Toggle,
  useMountOnApproach,
  useReplay,
  type BoardState,
  type Ground,
  type Mode,
} from "@/components/lab";
import { Glow } from "@/components/shared/glow";

import { blockFor, noBlockBecause } from "./blocks";
import { ENGINE_DRIVE_FIX, LIGHT_CANDIDATES, PUBLISH_LEAN } from "./candidates";
import { Light, type Placement, type Register } from "./composer";
import { FENCES, LANDS, treatmentById, type TreatmentId } from "./kit";
import { OpenPart } from "./open";
import { useCentredCrop } from "./shared";
import { CatalogNote, TreatmentPreview } from "./previews";
import { sectionById, type SectionId } from "./sections";
import { LIGHT } from "./spec";

/**
 * THE LIGHT BOARD (round six, the revamp, 2026-09-16).
 *
 * ★ THE BOARD IS A CATALOG NOW, AND WILL'S TWO NON-ANSWERS ARE WHY. Round five
 * asked nine questions and he could not answer two of them, both because the
 * board showed him an argument where it owed him a picture: "hard to visibly
 * tell what Family and Lift are from the previews", and "am I being asked what
 * aurora placement within the footer? Or what aurora replacement looks better
 * in general?". So the depth cues are two of the twelve cards (keep both, keep
 * one, kill both) and the aurora's landing is a page-wide switch with a two-way
 * compare under it. Neither is a question with token options any more.
 *
 * What the board ARGUES lives in `spec.ts` and only there. What is left here is
 * the evidence for each declared section, as a function of the declared state.
 *
 * ★ REST IS SERVED BY board.css SECTION 4, THROUGH THE TEMPLATE'S ATTRIBUTE.
 * The template writes every declared control onto the board's root, so the
 * sheet selects `[data-motion="rest"]`. It is deliberately narrow (the engine's
 * two animated layers, the publish beat) because a blanket `animation: none`
 * would also freeze the marketing reveal grammar on the real sections, whose
 * pre-animation state is opacity 0, and the board would read as broken rather
 * than at rest.
 *
 * ★ AND A REPLAY IS A REMOUNT. Every card that runs a one-shot owns its own
 * (previews.tsx); the dock's drives the compare below. An incrementing key is
 * the whole mechanism, and an animationend listener races the compositor.
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
    ground: (state.ground ?? "cinema") as Ground,
    landing: (state.landing ?? "both") as Placement,
    register: (state.register ?? "accent") as Register,
    picked,
    block: picked ? blockFor(picked) : null,
  };
}

/* ── The compare: one real section under two treatments ──────────────────── */

/** The sections a section-scale light can be judged on. A per-specimen switch,
 *  so it sits beside its specimen rather than in the dock. */
const COMPARE_SECTIONS: SectionId[] = ["guests", "closer", "privacy", "strip"];

/** Which of the twelve live at SECTION scale. The rest are a card-scale cue or
 *  a mount on one object, and drawing a whole chapter twice to show a hairline
 *  would be a comparison of two identical pages. */
const AT_SECTION_SCALE: Partial<
  Record<TreatmentId, "seam" | "throw" | "aurora">
> = {
  seam: "seam",
  throw: "throw",
  aurora: "aurora",
};

function SectionUnder({
  treatment,
  section,
  mode,
  ground,
  landing,
  register,
  runId,
}: {
  treatment: TreatmentId;
  section: SectionId;
  mode: Mode;
  ground: Ground;
  landing: Placement;
  register: Register;
  runId: number;
}) {
  const [box, near] = useMountOnApproach();
  const s = sectionById(section);
  const width = CANVAS[mode].w;
  const height = Math.min(s.h[mode], 720);
  useCentredCrop(box, near, width);
  const shape = AT_SECTION_SCALE[treatment];
  const refused = s.refuses?.[treatment];

  return (
    <div ref={box} className="overflow-x-auto">
      <GroundBox
        ground={s.ships}
        className="relative overflow-hidden rounded-lg"
        style={{ width, height }}
      >
        {near ? (
          <div
            data-inview="true"
            className="relative isolate h-full w-full overflow-hidden"
          >
            {shape && !refused ? (
              <Light
                treatment={shape}
                placement={
                  shape === "aurora"
                    ? landing
                    : shape === "throw"
                      ? "behind"
                      : "bottom"
                }
                ground={ground}
                register={register}
                clock={shape === "aurora" ? "aurora" : "lamp"}
                height={height}
                grain={shape === "aurora"}
                drive="mask"
              />
            ) : null}
            {treatment === "sweep" ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ "--glw-radius": "0px" } as React.CSSProperties}
              >
                <Glow
                  shape="sweep"
                  edge
                  runId={runId}
                  vars={{
                    "--glw-dur": "6s",
                    "--glw-strength": "0.6",
                    "--glw-base": "0.35",
                  }}
                />
              </div>
            ) : null}
            <div className="relative">{s.render()}</div>
          </div>
        ) : null}
      </GroundBox>
    </div>
  );
}

/** What a card-scale treatment has to say for itself at section scale. */
function scaleNote(treatment: TreatmentId, section: SectionId): string | null {
  const s = sectionById(section);
  const refused = s.refuses?.[treatment];
  if (refused) return refused;
  if (AT_SECTION_SCALE[treatment] || treatment === "sweep") return null;
  return `${treatmentById(treatment).name} is a cue on one object rather than a light on a chapter, so this half is ${s.label} exactly as it ships. Read it on its own card above.`;
}

/* ── The real pages ──────────────────────────────────────────────────────── */

const WALK = LIGHT.links.pages ?? [];

export function LightBoard() {
  const { runId, replay } = useReplay();
  const [section, setSection] = useState<SectionId>("guests");
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
            <ReplayButton runId={runId} onReplay={replay} />
          </>
        );
      }}
      evidence={(id, state, api) => {
        const s = read(state);

        switch (id) {
          /* ── The twelve ─────────────────────────────────────────────── */
          case "catalog":
            return (
              <>
                {/* 520 puts the grid at two columns on a 1440 lab page, which
                    is the narrowest a card can be and still be a useful WINDOW
                    onto a 1440 canvas: at three columns the seam card showed
                    440 pixels of a centred chapter and the aurora's own
                    boundaries fell outside it. */}
                <Catalog
                  spec={LIGHT}
                  state={state}
                  setState={api.setState}
                  minWidth={520}
                  render={(candidate) => (
                    <TreatmentPreview
                      id={candidate.id as TreatmentId}
                      ground={s.ground}
                      mode={s.mode}
                      landing={s.landing}
                      register={s.register}
                    />
                  )}
                />
                <CatalogNote />
              </>
            );

          /* ── Any two, on one real section ───────────────────────────── */
          case "compare":
            return (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Knob label="Section">
                    <Toggle
                      ariaLabel="Section"
                      options={COMPARE_SECTIONS.map((c) => ({
                        id: c,
                        label: sectionById(c).label,
                      }))}
                      value={section}
                      onChange={setSection}
                    />
                  </Knob>
                  <CellLabel className="mt-0 max-w-md">
                    Beside its specimen, because it changes the compare and
                    nothing else. Landing is in the dock: it moves every aurora
                    on the page at once.
                  </CellLabel>
                </div>
                {/* Two columns on the wide canvas, one on the phone, as a
                    NUMBER rather than a breakpoint: a Tailwind prefix inside a
                    fixed-width canvas reads the browser's width, not the
                    canvas's. Side by side is the whole point of the section:
                    stacked, the reviewer holds a very quiet field in his memory
                    across 700 pixels of scroll. */}
                <CompareTwo
                  spec={LIGHT}
                  state={state}
                  mode="side"
                  cols={s.desktop ? 2 : 1}
                  differs={`${sectionById(section).label}, under two of the twelve. The footer keeps its own seam under every one of them.`}
                  render={(candidate) => (
                    <div className="flex flex-col gap-1.5">
                      <SectionUnder
                        treatment={candidate.id as TreatmentId}
                        section={section}
                        mode={s.mode}
                        ground={s.ground}
                        landing={s.landing}
                        register={s.register}
                        runId={runId}
                      />
                      {scaleNote(candidate.id as TreatmentId, section) ? (
                        <CellLabel className="mt-0 max-w-2xl">
                          {scaleNote(candidate.id as TreatmentId, section)}
                        </CellLabel>
                      ) : null}
                    </div>
                  )}
                />
              </div>
            );

          /* ── The four calls left ────────────────────────────────────── */
          case "open":
            return <OpenPart mode={s.mode} register={s.register} />;

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

                {/* Folded, both of them: a bill of materials is for the
                    author of the wiring round and a fence list is for the
                    reader who disagrees, and neither is what a reviewer is here
                    to read. The smoke counts what is not folded. */}
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

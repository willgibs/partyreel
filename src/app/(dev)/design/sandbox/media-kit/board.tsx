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
  GroundBox,
  Knob,
  Toggle,
  WalkPages,
  type BoardSpec,
  type BoardState,
  type Mode,
} from "@/components/lab";
import { Caption } from "@/components/marketing/system/caption";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

import { ContactStrip, EntryFacts, SourceSwap } from "./preview";
import { SOURCES, type SourceCard, type Vertical } from "./sources";
import { MEDIA_KIT } from "./spec";
import { EXPOSURE_CSS, swapCoverage, swapCss } from "./swap";

/**
 * THE MEDIA-KIT BOARD (round seven, the stepped review, 2026-09-16).
 *
 * ★ THE ROUND RESHAPES ROUND SIX FOR THE WALK AND PROPOSES NOTHING NEW. The
 * same thirteen places and the same four calls; what changed is that each of
 * the four now has a specimen of its OWN rather than sharing one 1,298-word
 * page, and that every card is drawn against the frame it would replace. The
 * side-by-side section left with its twenty-six compare pills: the one
 * comparison it existed for (a free conference floor beside a released room)
 * is the crowds step now, where it is the question rather than a section.
 *
 * ★ FIVE SECTIONS, AND FOUR OF THEM ARE ONE STEP'S EVIDENCE. `catalog` is the
 * gallery the cards are ruled in; `entry` is the rule, drawn; `crowds` is one
 * conference card from whichever half of the catalog the `faces` switch names;
 * `bill` is the two lines that sum to the bridge; `pages` is the real routes
 * wearing the pick. A reviewer meets exactly one of them per question.
 *
 * ★ THE LINE IS DRAWN BY RENDERING THE CATALOG TWICE. `Catalog` maps the
 * board's candidates in one grid, and this board's whole ranking is a line
 * across that grid: above it the board would use the place, below it would not.
 * The two calls take the SAME spec with a different `candidates` array, so
 * every card keeps the same Pick control, the same A and B, the same verdict
 * row and the same round, and the divider is a real element between two grids
 * rather than a card pretending to be a rule. Nothing outside this file knows:
 * the desk, the ledger and `pnpm lab:review` all read the spec, never the DOM.
 *
 * ★ BREAKPOINTS DO NOT WORK INSIDE A STAGE OR A GROUNDBOX, but they are honest
 * here: the catalog is not in a stage, so its grid uses real ones. Everything
 * whose SIZE is being judged is a literal pixel box in a scroller instead (see
 * preview.tsx), because a zoomed or fitted specimen is the one thing Will's
 * round-four note forbids.
 *
 * Keyframes live in board.css under `mk-`, and there are none: the develop beat
 * is marketing.css's own, tuned here in clock only, so a reduced-motion reader
 * gets the settled composition with nothing to undo. No mono face anywhere.
 */

/** Everything the dock is claiming, resolved once per render. */
function read(state: BoardState) {
  const mode = (state.canvas ?? "desktop") as Mode;
  const vertical = (state.vertical ?? "weddings") as Vertical;
  const faces = state.faces ?? "subjects";
  // "none" is nothing picked: the pages below show the site as built, and Apply
  // offers the exposure instead of an answer.
  const pickedId =
    state.source && state.source !== "none" ? state.source : null;
  const picked = pickedId ? (byId.get(pickedId) ?? null) : null;
  return {
    mode,
    desktop: mode === "desktop",
    vertical,
    faces,
    picked,
    css: picked ? swapCss(picked.id) : "",
    covers: picked ? swapCoverage(picked.id) : 0,
  };
}

const byId = new Map(SOURCES.map((s) => [s.id, s]));

/** The two halves of the board's own line, in the spec's order. */
const KEPT = MEDIA_KIT.candidates.filter((c) => c.verdict !== "kill");
const KILLED = MEDIA_KIT.candidates.filter((c) => c.verdict === "kill");

/** The spec with one half of the cards, so one grid can be drawn per half. */
function half(candidates: BoardSpec["candidates"]): BoardSpec {
  return { ...MEDIA_KIT, candidates };
}

/**
 * ★ TWO COLUMNS, BECAUSE THE PAIR HAS TO FIT. A card now draws the frame on the
 * site today beside the place's own, and at three columns (a 437px content box)
 * the second plate was 93 pixels wide with the rest behind a horizontal scroll:
 * the comparison this round exists for, hidden on every card. 660 gives two
 * columns of about 695 at 1440, whose 671px content box holds 320 + 24 + 320
 * exactly, so the pair is always whole and the place's SECOND frame is the
 * thing one nudge of the scroller brings in.
 */
const CARD_MIN = 660;

/** How many of a place's frames ride beside today's: the first is the compare. */
const SWAP_FRAMES = 2;

/**
 * THE TWO PLACES THE CROWDS QUESTION IS BETWEEN, and the two lines that sum to
 * the bridge. Ids rather than cards, resolved through the same map everything
 * else on this board goes through, so a renamed source fails here loudly
 * instead of drawing a blank.
 */
const FREE_CROWD = "websummit-flickr";
const RELEASED = "unsplash-plus";

/** The bridge, as the two frames it is: the month, and the rooms it misses. */
const BILL: readonly { id: string; cost: string; vertical?: Vertical }[] = [
  { id: RELEASED, cost: "$20, the month. Every kind of event but one." },
  {
    id: "istock",
    cost: "$36, three conference rooms at $12 each.",
    vertical: "corporate",
  },
];

/** The real pages a frame can load, and what to read on each. */
const PAGES = [
  { id: "blog", label: "The blog", path: "/blog", h: 1500 },
  { id: "home", label: "Home", path: "/", h: 1200 },
  { id: "pricing", label: "Pricing", path: "/pricing", h: 1200 },
  { id: "album", label: "The album feature", path: "/features/album", h: 1200 },
] as const;
type PageId = (typeof PAGES)[number]["id"];

export function MediaKitBoard() {
  // Switches that change ONE section each, so they stay beside it rather than
  // in the dock (the dock's rule: a page-wide switch is declared in the spec).
  const [pageId, setPageId] = useState<PageId>("blog");
  const [split, setSplit] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <BoardPage
      spec={MEDIA_KIT}
      dock={(state) => {
        const s = read(state);
        return (
          <>
            <AppliedBadge />
            <ApplyToSite
              block={
                s.picked
                  ? {
                      label: `Media kit: ${s.picked.name}`,
                      css: s.css,
                      what: `Dresses every marketing still with ${s.picked.name}'s own frames.`,
                      pages: "the blog, home, pricing, the album feature",
                    }
                  : {
                      label: "Media kit: the exposure",
                      css: EXPOSURE_CSS,
                      what: "Nothing picked, so this outlines every frame we cannot name instead.",
                      pages: "any marketing page",
                    }
              }
            />
          </>
        );
      }}
      evidence={(id, state, api) => {
        const s = read(state);
        const page = PAGES.find((p) => p.id === pageId) ?? PAGES[0];
        const { w, h } = CANVAS[s.mode];

        switch (id) {
          /* ── The places ─────────────────────────────────────────────── */
          case "catalog":
            return (
              <>
                <Catalog
                  spec={half(KEPT)}
                  state={state}
                  setState={api.setState}
                  minWidth={CARD_MIN}
                  ground="paper"
                  render={(candidate) => (
                    <SourceSwap
                      source={byId.get(candidate.id)!}
                      vertical={s.vertical}
                      mode={s.mode}
                      count={SWAP_FRAMES}
                    />
                  )}
                />

                {/* The line the board's verdicts draw. */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="h-px flex-1 bg-destructive/40" />
                  <Caption className="text-[11px] text-destructive">
                    Below the line: {KILLED.length} the board would not use
                  </Caption>
                  <span className="h-px flex-1 bg-destructive/40" />
                </div>

                <Catalog
                  spec={half(KILLED)}
                  state={state}
                  setState={api.setState}
                  minWidth={CARD_MIN}
                  ground="paper"
                  render={(candidate) => (
                    <SourceSwap
                      source={byId.get(candidate.id)!}
                      vertical={s.vertical}
                      mode={s.mode}
                      count={SWAP_FRAMES}
                    />
                  )}
                />
              </>
            );

          /* ── What an entry would have to say ────────────────────────── */
          case "entry":
            return (
              <GroundBox
                ground="paper"
                className="rounded-lg p-4 ring-1 ring-foreground/10"
              >
                <EntryFacts mode={s.mode} />
              </GroundBox>
            );

          /* ── A crowd, or a room that signed ─────────────────────────── */
          case "crowds": {
            // The two answers, drawn: the free archive's conference floor, and
            // the released catalogue's room, in the same three-card row the
            // blog lays out at 1440. One kind of event, one difference.
            //
            // ★ THREE CARDS, NOT ONE, AND THE TILE IS WHY. A step draws each
            // option inside a 1440 canvas scaled to the tile (step.tsx's
            // `FitStage mode="desktop" fit="zoom"`), so a lone 320px card fills
            // a fifth of the canvas and lands as a thumbnail with an acre of
            // ground beside it. The blog's own row at 1440 is three of them,
            // which fills the canvas with the real thing rather than padding.
            const crowd = byId.get(FREE_CROWD)!;
            const signed = byId.get(RELEASED)!;
            const shown = s.faces === "all-faces" ? signed : crowd;
            return (
              <GroundBox
                ground="paper"
                className="rounded-lg p-4 ring-1 ring-foreground/10"
              >
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Caption className="text-[11px]">
                    {s.faces === "all-faces"
                      ? `${signed.name}: everyone in frame signed.`
                      : `${crowd.name}: nobody in frame signed.`}
                  </Caption>
                  <ContactStrip
                    source={shown}
                    vertical={s.vertical}
                    mode={s.mode}
                    count={s.desktop ? 3 : 1}
                  />
                </div>
              </GroundBox>
            );
          }

          /* ── What the bridge buys ───────────────────────────────────── */
          case "bill":
            return (
              <GroundBox
                ground="paper"
                className="rounded-lg p-4 ring-1 ring-foreground/10"
              >
                <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
                  {BILL.map((line) => (
                    <figure
                      key={line.id}
                      className="flex min-w-0 flex-col gap-1.5"
                    >
                      <ContactStrip
                        source={byId.get(line.id)!}
                        vertical={line.vertical ?? s.vertical}
                        mode={s.mode}
                        count={1}
                      />
                      <figcaption className="text-[11px] text-muted-foreground">
                        {line.cost}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </GroundBox>
            );

          /* ── The real pages, wearing the pick ───────────────────────── */
          case "pages":
            return (
              <>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <Knob label="Page">
                    <Toggle
                      ariaLabel="The page"
                      options={PAGES.map((p) => ({
                        id: p.id,
                        label: p.label,
                      }))}
                      value={pageId}
                      onChange={setPageId}
                    />
                  </Knob>
                  <Knob label="Beside today">
                    <Toggle
                      ariaLabel="Beside today"
                      options={[
                        { id: "on", label: "On" },
                        { id: "off", label: "Off" },
                      ]}
                      value={split ? "on" : "off"}
                      onChange={(v) => setSplit(v === "on")}
                    />
                  </Knob>
                  <button
                    type="button"
                    onClick={() => setReloadKey((n) => n + 1)}
                    className="h-7 rounded-[var(--radius-action-sm)] border border-border px-2.5 text-[11px] font-medium transition-transform duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none"
                  >
                    Reload
                  </button>
                </div>
                <CellLabel className="mt-0 max-w-2xl">
                  {s.picked
                    ? `${s.picked.name} dresses ${s.covers} of the ${MARKETING_IMAGES.length} stills. A link inside a frame navigates it; Reload brings it back.`
                    : "Nothing picked, so both frames are the site as built."}
                </CellLabel>
                <FrameRow>
                  {split && (
                    <Frame
                      id="today"
                      src={page.path}
                      w={w}
                      h={h}
                      title={`${page.label}, as built`}
                      caption="As built"
                      reloadKey={reloadKey}
                      onApproach
                    />
                  )}
                  <Frame
                    id="candidate"
                    src={page.path}
                    w={w}
                    h={h}
                    css={s.css}
                    title={`${page.label}, wearing ${s.picked?.name ?? "nothing"}`}
                    caption={s.picked ? s.picked.name : "Nothing picked"}
                    reloadKey={reloadKey}
                    onApproach
                  />
                </FrameRow>
                <WalkPages pages={MEDIA_KIT.links.pages ?? []} />
              </>
            );

          default:
            return null;
        }
      }}
    />
  );
}

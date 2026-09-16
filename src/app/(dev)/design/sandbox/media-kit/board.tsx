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
  Toggle,
  WalkPages,
  type BoardSpec,
  type BoardState,
  type Mode,
} from "@/components/lab";
import { Caption } from "@/components/marketing/system/caption";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

import { ContactStrip, firstFrame, ShareCard } from "./preview";
import { SOURCES, type SourceCard, type Vertical } from "./sources";
import { MEDIA_KIT } from "./spec";
import { EXPOSURE_CSS, swapCoverage, swapCss } from "./swap";

/**
 * THE MEDIA-KIT BOARD (round six, the catalog, 2026-09-16).
 *
 * ★ THE ROUND IS A SUBTRACTION AND THE BOARD IS ITS RECEIPT. Round five was
 * eleven sections and 15,004 words, the heaviest board in the lab, and Will's
 * note on the round was that every exploration "feels like a small research
 * paper" where "designing a few variations will always beat a mountain of
 * research text". So the thirteen places are CARDS with their own photographs
 * at the real card size, and the plan table, the blog bridge, the exposure
 * table, the free-licence survey, the gap survey, the six-facts suite and the
 * call sheet are folded, quoted in four facts, or in docs/specs/media-kit.md.
 * Nothing that was found was withdrawn; it is underneath, which is where an
 * argument belongs once there is an answer above it.
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
  // "none" is nothing picked: the pages below show the site as built, and Apply
  // offers the exposure instead of an answer.
  const pickedId =
    state.source && state.source !== "none" ? state.source : null;
  const picked = pickedId ? (byId.get(pickedId) ?? null) : null;
  return {
    mode,
    desktop: mode === "desktop",
    vertical,
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
          /* ── The places, ranked ─────────────────────────────────────── */
          case "catalog":
            return (
              <>
                <CellLabel className="max-w-2xl">
                  Pick drives the whole page; A and B set the comparison under
                  it; Kind of event is in the dock and every strip follows it.
                  Rule each place in its own row.
                </CellLabel>

                <Catalog
                  spec={half(KEPT)}
                  state={state}
                  setState={api.setState}
                  minWidth={360}
                  ground="paper"
                  render={(candidate) => (
                    <ContactStrip
                      source={byId.get(candidate.id)!}
                      vertical={s.vertical}
                      mode={s.mode}
                    />
                  )}
                />

                {/* The line the board's verdicts draw. */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="h-px flex-1 bg-destructive/40" />
                  <Caption className="text-[11px] text-destructive">
                    Below the line: {KILLED.length} places the board would not
                    use
                  </Caption>
                  <span className="h-px flex-1 bg-destructive/40" />
                </div>

                <Catalog
                  spec={half(KILLED)}
                  state={state}
                  setState={api.setState}
                  minWidth={360}
                  ground="paper"
                  render={(candidate) => (
                    <ContactStrip
                      source={byId.get(candidate.id)!}
                      vertical={s.vertical}
                      mode={s.mode}
                    />
                  )}
                />
              </>
            );

          /* ── Two catalogues, side by side ───────────────────────────── */
          case "compare":
            return (
              <>
                <CompareTwo
                  spec={MEDIA_KIT}
                  state={state}
                  cols={s.desktop ? 2 : 1}
                  differs="The same kind of event, from two catalogues, in the card the blog actually renders."
                  render={(candidate) => (
                    <Stack
                      source={byId.get(candidate.id)!}
                      vertical={s.vertical}
                      mode={s.mode}
                    />
                  )}
                />
                <Labeled
                  name="the share card, 1200 by 630"
                  note="Centre-cropped, no ladder: the surface a stranger meets first, in a message from a friend."
                >
                  <CompareTwo
                    spec={MEDIA_KIT}
                    state={state}
                    cols={1}
                    differs="The same two catalogues in the one geometry nothing on the site can tune per frame."
                    render={(candidate) => (
                      <Share
                        source={byId.get(candidate.id)!}
                        vertical={s.vertical}
                      />
                    )}
                  />
                </Labeled>
              </>
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

/**
 * One side of the comparison: three of a place's frames as the card the blog
 * renders, on the ground the blog renders it on, at true pixels in a scroller.
 *
 * ★ IT CARRIES NO NAME OF ITS OWN. `CompareTwo` labels each half with the
 * candidate's name already, and the strip prints the kind of event and the
 * size, so a caption here was a third name for one thing, in a second wording
 * lifted from `sources.ts` ("Web Summit's Flickr archive" under a card called
 * "Web Summit"). One name, one home.
 */
function Stack({
  source,
  vertical,
  mode,
}: {
  source: SourceCard;
  vertical: Vertical;
  mode: Mode;
}) {
  return (
    <GroundBox
      ground="paper"
      className="rounded-lg p-4 ring-1 ring-foreground/10"
    >
      <ContactStrip source={source} vertical={vertical} mode={mode} count={3} />
    </GroundBox>
  );
}

/** The other side of the same two, at 1200 by 630 in a scroller of its own. */
function Share({
  source,
  vertical,
}: {
  source: SourceCard;
  vertical: Vertical;
}) {
  const frame = firstFrame(source.id, vertical);
  return (
    <GroundBox ground="cinema" className="rounded-lg p-4">
      {frame ? (
        <div data-lab-bleed className="overflow-x-auto pb-1">
          <ShareCard frame={frame} />
        </div>
      ) : (
        <div className="grid h-40 place-items-center rounded border border-dashed border-border">
          <Caption className="text-[11px]">
            No frames, so there is nothing honest to crop.
          </Caption>
        </div>
      )}
    </GroundBox>
  );
}

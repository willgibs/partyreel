"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useId, useState } from "react";

import {
  AppliedBadge,
  ApplyToSite,
  type BoardApi,
  BoardPage,
  type BoardState,
  CANVAS,
  Catalog,
  DOCK_PILL,
  Frame,
  FrameRow,
  labScenePath,
  type Mode,
  Paste,
  useDesignKey,
  WalkPages,
} from "@/components/lab";
import { env } from "@/lib/env";

import {
  candidateCss,
  ladderById,
  type LadderId,
  pageById,
  themeBlock,
} from "./ladders";
import { DeadLinkSpecimen, LadderSpecimen, SpacingSpecimen } from "./specimens";
import { TYPE_SCALE } from "./spec";

/**
 * THE TYPE-SCALE BOARD (round seven, the stepped review, 2026-09-16).
 *
 * What the board ARGUES lives in `spec.ts` and only there. What is here is the
 * evidence for each declared section, as a function of the declared state, and
 * there are four of them, one per step of the walk plus the stage:
 *
 *   01 items      the five ladders as five type specimens (the winner's tiles)
 *   02 pages      ONE real page at true pixels, wearing the card being pressed
 *   03 spacing    today's sizes under one tracking value or under the law
 *   04 dead-link  the production dead end, its title on the set and off it
 *
 * ── WHAT ROUND SEVEN DELETED, AND WHY ──
 * Round six drew three pages twice for a comparison and five more under the
 * pick: eleven frames, six of them off the side of a 1440 window, and the open
 * question it handed on was exactly that sideways scroll. The stage now shows
 * ONE page, chosen on the step's config strip, and the ladder lands in that
 * page's own document with no reload, so pressing through the five cards
 * re-types the same page in the same place. `against` lays a second copy of it
 * UNDER the first on a fade, which is two ladders on one real page inside one
 * canvas width. That is the round-six question settled.
 *
 * ★ AND THE CANDIDATE BLOCK IS CACHED BY LADDER ID. `candidateCss` is pure but
 * it builds a new string on every call, and `Frame` re-adopts its stylesheet
 * whenever that string changes by identity: generating it inside render would
 * re-inject on every keystroke in a note field. Five ladders, five strings,
 * built once.
 */

/* ───────────────────────── The block, built once ──────────────────────── */

/**
 * The board settles a frame's entrances, because a page mid-animation reports
 * sizes and tracking that belong to no candidate.
 *
 * ★ DELIBERATELY NARROW: a blanket `animation: none` would also freeze the
 * marketing reveal grammar, whose pre-animation state is opacity 0, and the
 * page would read as broken rather than at rest.
 *
 * ★ AND THE MASTHEAD'S SQUEEZE IS CLOSED BY HAND. marketing.css and the
 * candidate both close it through a `[data-inview="true"]` selector, which
 * cannot match in a settled frame, so without CLOSED every ladder would show
 * the same open tracking and the comparison would be two identical claims.
 * CLOSED spends the candidate's OWN display token rather than a literal, so no
 * number is duplicated, and it runs at (0,3,0) after the candidate in one
 * adopted sheet, which beats marketing.css's (0,2,0) open rule and
 * ties-then-wins against its (0,3,0) settled one.
 */
const SETTLED = `/* The board settles the frame's entrances; see board.tsx. */
[data-mkt] [data-mkt-reveal],
[data-mkt][data-mkt-reveal] { opacity: 1; transform: none; transition: none; }
[data-mkt] [data-mkt-cut] { animation: none; opacity: 1; transform: none; }
[data-mkt] .mkt-line { opacity: 1; transform: none; filter: none; transition: none; }`;

const CLOSED = `/* The masthead's squeeze, closed onto the candidate's own display tracking. */
@media (prefers-reduced-motion: no-preference) {
  [data-mkt][data-mkt] .mkt-name {
    letter-spacing: var(--text-display--letter-spacing, -0.03em);
    transition: none;
  }
}`;

const CACHE = new Map<string, string>();

/** The block a ladder would land, settled for a frame. One string per id. */
function framedCss(id: LadderId | "none" | "off"): string {
  if (id === "none" || id === "off") return "";
  const hit = CACHE.get(id);
  if (hit) return hit;
  const css = `${SETTLED}\n\n${candidateCss(ladderById(id))}\n\n${CLOSED}`;
  CACHE.set(id, css);
  return css;
}

/** The board's own recommendation, for a specimen asked to draw "on the set"
 *  before any card has been picked. */
const FALLBACK: LadderId = "b";

/* ───────────────────────────── The board ──────────────────────────────── */

export function TypeScaleBoard() {
  // The frames are same-origin documents a reader can navigate away from, so
  // one dock button brings every one of them back. Not a declared control: it
  // is an action, and there is no state a shared link should carry.
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <BoardPage
      spec={TYPE_SCALE}
      dock={() => (
        <>
          <AppliedBadge />
          <button
            type="button"
            onClick={() => setReloadKey((n) => n + 1)}
            className={DOCK_PILL}
          >
            Reload frames
          </button>
        </>
      )}
      evidence={(id, state, api) => (
        <Evidence id={id} state={state} api={api} reloadKey={reloadKey} />
      )}
    />
  );
}

function Evidence({
  id,
  state,
  api,
  reloadKey,
}: {
  id: string;
  state: BoardState;
  api: BoardApi;
  reloadKey: number;
}) {
  const mode = (state.canvas ?? "desktop") as Mode;
  const picked = (state.ladder ?? "none") as LadderId | "none";

  switch (id) {
    case "items":
      return (
        <Catalog
          spec={TYPE_SCALE}
          state={state}
          setState={api.setState}
          ground="paper"
          minWidth={mode === "phone" ? 300 : 330}
          render={(candidate) => (
            <LadderSpecimen
              ladder={ladderById(candidate.id as LadderId)}
              mode={mode}
              className="p-3"
            />
          )}
        />
      );

    case "spacing":
      return (
        <SpacingSpecimen mode={mode} tracking={state.tracking ?? "keep"} />
      );

    case "dead-link":
      return (
        <DeadLinkSpecimen
          mode={mode}
          // A title cannot join a set before one is picked, and a blank tile
          // would be a worse answer than the board's own recommendation: it
          // draws at B until a card wins, and the caption says so.
          ladder={ladderById(picked === "none" ? FALLBACK : picked)}
          onSet={(state["dead-link"] ?? "leave-off") === "on-ladder"}
        />
      );

    case "pages":
      return (
        <PageStage
          state={state}
          mode={mode}
          picked={picked}
          reloadKey={reloadKey}
        />
      );

    default:
      return null;
  }
}

/* ───────────────────── One real page, two ladders deep ────────────────── */

/**
 * THE STAGE: one route at true pixels, wearing the card being pressed, with a
 * second copy of the same route under it on a fade.
 *
 * ★ ONE CANVAS WIDE, WHICH IS THE WHOLE POINT. Two frames side by side are
 * 2,880 pixels and half the comparison lives off the right edge of a 1440
 * window; two frames STACKED are 1,440, and the two ladders land on the same
 * words in the same place, which is also the only honest way to read a
 * difference in SIZE (the kit's own `Compare` says so about its `stack` mode).
 * The pair share a scroll lock, so dragging one drags the other and the fade
 * keeps meaning what it says wherever the reader has scrolled to.
 *
 * ★ THE UNDERLAY IS THE ONE THAT TAKES THE POINTER. The overlay is inert, so a
 * scroll or a click reaches the frame in normal flow and the lock carries it
 * up to the one on top; an interactive overlay would swallow every gesture at
 * any opacity above zero.
 */
function PageStage({
  state,
  mode,
  picked,
  reloadKey,
}: {
  state: BoardState;
  mode: Mode;
  picked: LadderId | "none";
  reloadKey: number;
}) {
  const key = useDesignKey();
  const fadeId = useId();
  const [at, setAt] = useState(100);
  const { w, h } = CANVAS[mode];
  const page = pageById(state.page ?? "");
  const against = (state.against ?? "off") as LadderId | "off";
  const demo = env.NEXT_PUBLIC_DEMO_QR_TOKEN;

  // Nothing to fade against when the under layer is off, when it is the card
  // already on top, or when nothing is picked (the site as built IS today).
  const paired = against !== "off" && against !== picked && picked !== "none";

  const src = page.scene
    ? labScenePath(
        "/design/sandbox/type-scale/screen",
        { screen: page.href },
        key ?? null,
      )
    : page.demo
      ? demo
        ? `/e/${demo}`
        : ""
      : page.href;

  const nameOf = (l: LadderId | "none" | "off") =>
    l === "none" || l === "off" ? "the site as built" : ladderById(l).name;

  if (!src)
    return (
      <p className="max-w-2xl text-sm text-muted-foreground">
        The demo album needs NEXT_PUBLIC_DEMO_QR_TOKEN in .env.local. Pick
        another page on the strip.
      </p>
    );

  // ★ ONE CAPTION FOR THE PAIR, AND IT BELONGS TO THE FRAME IN FLOW. The
  // overlay's own figcaption is hidden but still takes its space, so the two
  // canvases line up to the pixel; a caption printed there as well would ghost
  // over this one at every opacity between the ends.
  const frame = (ladder: LadderId | "none" | "off", under: boolean) => (
    <Frame
      id={`${page.id}${under ? "-under" : ""}`}
      src={src}
      w={w}
      h={h}
      css={framedCss(ladder)}
      gated={page.scene}
      reloadKey={reloadKey}
      title={
        under
          ? `${page.label}: ${nameOf(picked)} over ${nameOf(against)}`
          : `${page.label}: ${nameOf(ladder)}`
      }
      caption={under || !paired ? page.why : undefined}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      {paired && (
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor={fadeId}
            className="text-[11px] font-medium text-muted-foreground"
          >
            {nameOf(against)}
          </label>
          <input
            id={fadeId}
            type="range"
            min={0}
            max={100}
            step={1}
            value={at}
            onChange={(e) => setAt(Number(e.target.value))}
            style={{ accentColor: "var(--foreground)" }}
            className="h-4 w-56 cursor-ew-resize"
          />
          <span className="text-[11px] font-medium">{nameOf(picked)}</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {at}%
          </span>
        </div>
      )}

      <FrameRow>
        <div className="relative" style={{ width: w }}>
          {paired ? frame(against, true) : frame(picked, false)}
          {paired && (
            <div
              className="pointer-events-none absolute inset-0 [&_figcaption]:invisible"
              style={{ opacity: at / 100 }}
            >
              {frame(picked, false)}
            </div>
          )}
        </div>
      </FrameRow>

      {page.reach && (
        <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
          {page.reach}
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3">
        {picked === "none" ? (
          <p className="max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
            Press a card above to wear it on this page, and the block it would
            land appears here.
          </p>
        ) : (
          <>
            <Paste
              code={candidateCss(ladderById(picked))}
              label={`The block a ruling would land: ${ladderById(picked).name}`}
            />
            <Paste
              code={themeBlock(ladderById(picked))}
              label={`The bake: ${ladderById(picked).name}`}
            />
            <ApplyToSite
              block={{
                label: `type-scale: ${ladderById(picked).name}`,
                css: candidateCss(ladderById(picked)),
                what: "Hands every page with a design island this exact set, so a ladder can be walked signed in on the surfaces no frame here reaches.",
                pages: "the home, /pricing, the dashboard and the admin portal",
              }}
            />
            <WalkPages pages={TYPE_SCALE.links.pages ?? []} />
          </>
        )}
      </div>
    </div>
  );
}

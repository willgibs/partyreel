"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useState } from "react";

import {
  AppliedBadge,
  ApplyToSite,
  type BoardApi,
  BoardPage,
  type BoardState,
  CANVAS,
  Catalog,
  CellLabel,
  comparePair,
  DOCK_PILL,
  Frame,
  FrameRow,
  labScenePath,
  Labeled,
  type Mode,
  Paste,
  useDesignKey,
  useMountOnApproach,
  WalkPages,
} from "@/components/lab";
import { env } from "@/lib/env";

import { LadderSpecimen, TrackingStrip } from "./catalog";
import {
  candidateCss,
  COMPARED,
  ladderById,
  type LadderId,
  type RealPage,
  themeBlock,
  WORN,
} from "./ladders";
import { TYPE_SCALE } from "./spec";

/**
 * THE TYPE-SCALE BOARD (round six, the catalog rebuild, 2026-09-16).
 *
 * What the board ARGUES lives in `spec.ts` and only there. What is here is the
 * evidence for each declared section, as a function of the declared state, and
 * there are three of them:
 *
 *   01 the five ladders as five type specimens, side by side in one row
 *   02 any two of them on the same real page at once, scrolled together
 *   03 the picked one worn by five real routes, and the block it would land
 *
 * ── WHAT ROUND SIX DELETED, AND WHY ──
 * Round five carried eight sections, two register switches, two glance tables,
 * a nine-row token table and four asks. Will's note was that a track should
 * return "a few different scales side by side" on real UI with "no variable
 * lists", ruled card by card. So the tables went (a size is judged by looking
 * at it, and the numbers that survive are four facts on a card), the two
 * switches became one pick (a card is a whole-site answer), and every composed
 * app stage became a real frame: the routes for marketing and the guest album,
 * and a lab SCREEN route for the dashboard, which a frame cannot sign in to.
 *
 * ★ AND THE CANDIDATE BLOCK IS CACHED BY LADDER ID. `candidateCss` is pure but
 * it builds a new string on every call, and `Frame` re-adopts its stylesheet
 * whenever that string changes by identity: generating it inside render would
 * re-inject into six frames on every keystroke in a note field. Five ladders
 * means five strings, built once.
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
function framedCss(id: LadderId | "none"): string {
  if (id === "none") return "";
  const hit = CACHE.get(id);
  if (hit) return hit;
  const css = `${SETTLED}\n\n${candidateCss(ladderById(id))}\n\n${CLOSED}`;
  CACHE.set(id, css);
  return css;
}

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

/**
 * ONE SURFACE UNDER TWO LADDERS: two frames of one route, side by side in one
 * scroll group, so dragging either drags the other.
 *
 * ★ THE ROW IS WHAT APPROACHES, NOT THE FRAME. `Frame`'s own `onApproach`
 * observes the frame, and an IntersectionObserver reports an element clipped
 * out of an ancestor's scrollport as NOT intersecting whatever the root margin
 * says. The second frame of a pair sits past the right edge of this row, so it
 * would never mount until the reader scrolled it in, and a reader who never
 * scrolled sideways would read a comparison with one half missing (measured,
 * 2026-09-16). So the approach is taken here, on the row, which is in the
 * page's normal flow, and the frames inside it mount eagerly.
 *
 * ★ AND TWO 1440 FRAMES DO NOT FIT A 1440 WINDOW, WHICH IS THE HONEST COST OF
 * 1:1. The row takes the page's gutter back and then scrolls sideways rather
 * than shrinking either frame, and the walk opens this section at 375, where
 * both halves stand on screen at once.
 */
function ComparedRow({
  caption,
  height,
  children,
}: {
  caption: string;
  /** The canvas height, so the page does not jump when the row mounts. */
  height: number;
  children: React.ReactNode;
}) {
  const [box, near] = useMountOnApproach();
  return (
    <div ref={box} className="flex min-w-0 flex-col">
      {near ? (
        <FrameRow>{children}</FrameRow>
      ) : (
        <div style={{ height }} aria-hidden />
      )}
      <CellLabel>{caption}</CellLabel>
    </div>
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
  const key = useDesignKey();
  const mode = state.canvas as Mode;
  const { w, h } = CANVAS[mode];
  const picked = (state.ladder ?? "none") as LadderId | "none";
  const demo = env.NEXT_PUBLIC_DEMO_QR_TOKEN;

  /** One real page in a frame, wearing one ladder. */
  const frameFor = (
    page: RealPage,
    ladder: LadderId | "none",
    suffix = "",
    caption?: string,
  ) => {
    const src = page.scene
      ? labScenePath(
          "/design/sandbox/type-scale/screen",
          { screen: page.href },
          key ?? null,
        )
      : page.demo
        ? `/e/${demo}`
        : page.href;
    const name = ladder === "none" ? "" : ladderById(ladder).name;
    return (
      <Frame
        key={`${page.id}${suffix}`}
        id={`${page.id}${suffix}`}
        src={src}
        w={w}
        h={h}
        css={framedCss(ladder)}
        gated={page.scene}
        reloadKey={reloadKey}
        onApproach={!suffix}
        title={name ? `${page.label}: ${name}` : page.label}
        caption={caption}
      />
    );
  };

  switch (id) {
    case "items":
      return (
        <div className="flex flex-col gap-6">
          <Catalog
            spec={TYPE_SCALE}
            state={state}
            setState={api.setState}
            ground="paper"
            minWidth={mode === "phone" ? 330 : 380}
            render={(candidate) => (
              <LadderSpecimen
                ladder={ladderById(candidate.id as LadderId)}
                mode={mode}
                className="p-3"
              />
            )}
          />
          <Labeled
            name="Letter spacing, on its own"
            note="No size moves between the halves, which is what makes it its own ruling."
          >
            <div data-lab-specimen="" className="min-w-0">
              <TrackingStrip mode={mode} />
            </div>
          </Labeled>
        </div>
      );

    case "compare": {
      // ★ NOT THE KIT'S `CompareTwo`, AND THE REASON IS A MEASUREMENT. Its
      // `Compare` lays the two halves in a grid of `minmax(0, 1fr)` columns,
      // which is right for a specimen that can shrink and wrong for a frame
      // that must not: inside a 1440 page the columns resolved to 712px each
      // while the frames stayed 1440 wide, so the right frame painted over the
      // right half of the left one and the comparison was half a lie. A frame
      // is a fixed viewport, so the row scrolls sideways instead, which is
      // exactly what `FrameRow` is for, and the two frames scroll together.
      const compared = comparePair(TYPE_SCALE, state);
      if (!compared) return null;
      const { a, b } = compared;
      return (
        <div className="flex flex-col gap-8">
          {COMPARED.map((page) => (
            <ComparedRow
              key={page.id}
              height={h}
              caption={
                a.id === b.id
                  ? `A and B are both ${a.name}. Press B on another card for the second half.`
                  : `${page.label}, twice at ${w} pixels, scrolled together. ${page.why}`
              }
            >
              {frameFor(page, a.id as LadderId, "-a")}
              {a.id === b.id ? null : frameFor(page, b.id as LadderId, "-b")}
            </ComparedRow>
          ))}
        </div>
      );
    }

    case "pages":
      return (
        <div className="flex flex-col gap-6">
          {/* A COLUMN, NOT A ROW, and that is the difference between these five
              and the compared pair. Five different routes have no scroll to
              share, so a row would only push four of them off the side; a
              column keeps each one at its own full width and lets the frames
              load as the reader arrives. */}
          <div className="flex flex-col gap-6">
            {WORN.filter((page) => !page.demo || demo).map((page) =>
              frameFor(page, picked, "", page.why),
            )}
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3">
            {picked === "none" ? (
              <p className="max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
                Pick a card for the block it would land.
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
                    pages:
                      "the home, /pricing, the dashboard and the admin portal",
                  }}
                />
                <WalkPages pages={TYPE_SCALE.links.pages ?? []} />
              </>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
}

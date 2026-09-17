"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useState, type CSSProperties } from "react";
import { useTheme } from "next-themes";

import {
  AppliedBadge,
  ApplyToSite,
  type BoardApi,
  BoardPage,
  type BoardState,
  CANVAS,
  Catalog,
  CellLabel,
  CompareTwo,
  Frame,
  FrameRow,
  type Ground,
  GroundBox,
  type Mode,
  Paste,
  useMountOnApproach,
  useDesignKey,
  useFrameLock,
  WalkPages,
} from "@/components/lab";
import { clearCandidate } from "@/components/dev/candidate-style";
import { Button } from "@/components/ui/button";

import {
  type ActionRung,
  ANSWER,
  blockFor,
  blockLabel,
  familyById,
  gapFor,
  ladderCss,
  type LadderId,
  px,
  RECOMMENDED,
  rungById,
  SURFACES,
  type SurfaceCandidate,
} from "./candidates";
import { pageById, pathFor } from "./frames";
import { ROUNDING } from "./spec";
import {
  AlbumGrid,
  ButtonBench,
  DeadRungs,
  FamilyStrip,
  StepLadder,
} from "./specimens";

/**
 * THE ROUNDING BOARD, ROUND SEVEN: A STEPPED REVIEW (2026-09-16).
 *
 * What the board ARGUES lives in `spec.ts` and only there. What is here is the
 * evidence for each declared section, as a function of the declared state, and
 * there are seven of them: one per step of the walk, plus the stage and the
 * pair.
 *
 *   01 catalog   the six families as six strips at 1:1 (the winner's tiles)
 *   02 pages     ONE real page at true pixels, wearing the card being pressed
 *   03 buttons   the four heights, over the guest door that borrows the token
 *   04 steps     the seven derived steps, drawn whole under each ladder
 *   05 rungs     the panel and the Badge, the only users of the top two steps
 *   06 album     nine bright photographs, the gap pinned and fixed
 *   07 compare   any two families on one real page (off the walk)
 *
 * ── WHAT ROUND SEVEN DELETED, AND WHY ──
 *
 *  ★ SIX IFRAMES LEFT THE FIRST STEP. Every catalog card carried a real 375
 *    viewport as well as its strip, so the one screen where every option has to
 *    be visible at once was six documents tall and six documents slow. The real
 *    page is the STAGE under the tiles now, wearing whichever card is pressed:
 *    the same evidence once instead of six times, and the card is the family's
 *    four corners at a phone's own pixels, which is what a card is for.
 *
 *  ★ AND THE `calls` SECTION BECAME FOUR SPECIMENS. It stacked three tables and
 *    a grid of arithmetic under one heading, and all four questions pointed at
 *    it, so a reviewer met "the four calls a family does not settle" and had to
 *    find which third of it his question was about. Each question now owns one
 *    small specimen, drawn once per answer as a tile and once full size as the
 *    stage: the comparison is two pictures rather than a column of numbers.
 *
 *  ★ NOTHING IN A TILE IS SCALED. The step draws every option inside a
 *    zoom-fitted 1440 canvas, which would render an 8px corner at two pixels
 *    and make all six families identical, so each specimen sits in `TrueScale`
 *    and comes back to 1:1 (`true-scale.tsx`).
 *
 * TWO THINGS THE ROUND-FIVE SWEEP FOUND, both fixed by subtraction and both
 * still true: the board mounts no tuner panel (the radius knobs already ride
 * the real marketing pages and the app, which is where dragging one is useful),
 * and it never measures the page (the shell owns the 1:1 bleed through
 * `data-lab-bleed`; a board that also pulled its own rows left had the left
 * edge of its widest evidence silently cut off).
 */

/** A family's tokens as inline custom properties, which is how one subtree on
 *  this page can be drawing a different product from the one beside it. */
function tokensOf(c: SurfaceCandidate, a: ActionRung): CSSProperties {
  return {
    "--radius": px(c.values.radius),
    "--radius-float": px(c.values.float),
    "--radius-tile": px(c.values.tile),
    "--gap-gallery": px(c.values.gap),
    "--radius-action": px(a.values.action),
    "--radius-action-lg": px(a.values.lg),
    "--radius-action-sm": px(a.values.sm),
  } as CSSProperties;
}

/** The site as it ships, for the half of a comparison that never moves. */
const TODAY = SURFACES[0];

/** The board's own answer, drawn by a specimen asked to show a corner before
 *  any card has been picked. A ladder, a dead rung and a gap are all multiples
 *  of the card's corner, so at today's 2px card both answers to all three land
 *  within half a pixel of each other and the question cannot be looked at.
 *  Every specimen that falls back to this prints the family's name. */
const FALLBACK = familyById(RECOMMENDED) ?? TODAY;

/**
 * THE GROUND THE APP IS JUDGED ON, which is whichever mode the reader is in.
 *
 * A marketing route inside a frame runs next-themes in its own document and
 * follows him for free; a specimen is drawn in THIS document and this lane's
 * screen route has to be told. Without it a card showed a light strip above a
 * dark phone, which reads as two products rather than two views of one corner.
 */
function useAppGround(): Ground {
  const { resolvedTheme } = useTheme();
  // Dark is the fallback because it is what the server rendered and what the
  // lab opens in, so the first paint does not flash.
  return resolvedTheme === "light" ? "app-light" : "app-dark";
}

/**
 * ONE CATALOG CARD: a family's four corners in one piece of product, at a
 * phone's own pixels.
 *
 * ★ THE GROUND IS PAINTED HERE RATHER THAN BY THE KIT'S `ground` PROP, because
 * the kit paints it `overflow-hidden`: at 375 the lab column is narrower than
 * the 375 this is drawn at, and a hidden box would CLIP the right edge off
 * every card. A specimen whose size is being judged is never scaled and never
 * cut, so it scrolls inside its own card instead, and only at widths that
 * cannot hold a phone.
 */
function CardPreview({
  family,
  action,
  ladder,
  ground,
}: {
  family: SurfaceCandidate;
  action: ActionRung;
  ladder: LadderId;
  ground: Ground;
}) {
  return (
    <GroundBox
      // ★ THE GROUND IS PART OF THIS BOX'S IDENTITY, NOT JUST A PROP, AND THAT
      // KEY IS NOT SUPERSTITION. next-themes resolves one tick AFTER hydration
      // (undefined, then the real mode), and on that one re-render React
      // patched the contents and left the box's own class and `data-ground` on
      // the server's value: a dark strip in a light lab, measured on the board.
      // A key makes the change a remount rather than a patch, which is honest
      // anyway: a different ground is a different specimen.
      key={ground}
      ground={ground}
      className="overflow-x-auto rounded-lg ring-1 ring-foreground/10"
    >
      <div
        style={tokensOf(family, action)}
        data-rnd-ladder={ladder}
        className="flex justify-center"
      >
        <FamilyStrip />
      </div>
    </GroundBox>
  );
}

/** A specimen on the app's own ground, wearing one family and one rung. Every
 *  tile step's evidence goes through here, so a tile and the stage under it
 *  cannot be drawing two different products. */
function Bench({
  family,
  action,
  ground,
  children,
}: {
  family: SurfaceCandidate;
  action: ActionRung;
  ground: Ground;
  children: React.ReactNode;
}) {
  return (
    <GroundBox
      key={ground}
      ground={ground}
      className="rounded-lg ring-1 ring-foreground/10"
      style={tokensOf(family, action)}
    >
      {children}
    </GroundBox>
  );
}

/**
 * A ROW OF FRAMES, MOUNTED WHEN THE READER IS NEARLY AT THE ROW.
 *
 * ★ IT IS GATED AS A ROW, NOT FRAME BY FRAME. The kit's `onApproach` watches
 * each frame's own box against the VIEWPORT, which is right for a catalog that
 * flows down the page and wrong for a row that scrolls sideways: the second
 * half of a 1440 pair sits 1,464px to the right of the window, never
 * intersects, and stayed an empty box until the reader scrolled the row, which
 * is the one moment he wants it already there.
 *
 * ★ AND THE GATE IS A COMPONENT, NOT A HOOK IN THE BOARD. State belongs in the
 * component that renders the thing it gates; `children` is a function so the
 * frames are not built at all until the row is live.
 */
function LazyRow({
  children,
  fallback,
  className,
  bleed = false,
}: {
  children: () => React.ReactNode;
  fallback: React.ReactNode;
  className?: string;
  bleed?: boolean;
}) {
  const [box, near] = useMountOnApproach("400px");
  return (
    <div
      ref={box}
      className={className}
      {...(bleed ? { "data-lab-bleed": "" } : {})}
    >
      {near ? children() : fallback}
    </div>
  );
}

export function RoundingBoard() {
  // The frames are same-origin documents a reader can navigate away from, so
  // one dock button brings every one of them back. Not a declared control: it
  // is an action, and there is no state a shared link should carry.
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <>
      {/* The retuned ladder, scoped so one subtree can wear it. The same
          function writes the unscoped block the paste carries. */}
      <style>{ladderCss("quarters", '[data-rnd-ladder="quarters"] ')}</style>

      <BoardPage
        spec={ROUNDING}
        dock={(state, api) => (
          <>
            <AppliedBadge />
            <Button
              size="xs"
              variant="outline"
              onClick={() => setReloadKey((n) => n + 1)}
            >
              Reload frames
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                api.setState({
                  family: ANSWER.family,
                  action: ANSWER.action,
                  ladder: ANSWER.ladder,
                })
              }
            >
              Pick the answer
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                clearCandidate();
                api.setState({ family: "none" });
              }}
            >
              Clear
            </Button>
          </>
        )}
        evidence={(id, state, api) => (
          <Evidence id={id} state={state} api={api} reloadKey={reloadKey} />
        )}
      />
    </>
  );
}

/**
 * ONE SECTION'S EVIDENCE, IN WHATEVER STATE IT IS HANDED.
 *
 * ★ A COMPONENT, NOT JSX BUILT IN THE BOARD, AND THAT IS LOAD-BEARING. A step
 * draws a section in a state of its OWN (the option's tile) which is not the
 * board's, so every value has to be read where it is used; and the memo
 * boundary the kit's template puts in between does not reliably carry a change
 * that only an outer element reads (a ground box kept the server's
 * `data-ground` while the frame inside it had already switched, measured on
 * this board). A value read where it is used has no boundary to cross.
 */
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
  const ground = useAppGround();
  const picked = familyById(state.family);
  const action = rungById(state.action);
  const ladder = (state.ladder ?? "stock") as LadderId;
  // The specimens whose whole subject is a multiple of the card's corner draw
  // at the board's own answer until a card wins, and print which family that
  // is; the ones that do not draw at the site as it ships.
  const shown = picked ?? FALLBACK;

  switch (id) {
    case "catalog":
      return (
        <Catalog
          spec={ROUNDING}
          state={state}
          setState={api.setState}
          // 375 of strip plus the card's own 12px of padding on each side, so
          // the phone column is never squeezed and never scaled.
          minWidth={404}
          render={(candidate) => {
            const family = familyById(candidate.id);
            if (!family) return null;
            return (
              <CardPreview
                family={family}
                action={action}
                ladder={ladder}
                ground={ground}
              />
            );
          }}
        />
      );

    case "pages":
      return (
        <PageStage
          state={state}
          ground={ground}
          picked={picked}
          action={action}
          ladder={ladder}
          reloadKey={reloadKey}
        />
      );

    case "buttons":
      return (
        <Bench family={picked ?? TODAY} action={action} ground={ground}>
          <ButtonBench action={action} />
        </Bench>
      );

    case "steps":
      return (
        <Bench family={shown} action={action} ground={ground}>
          <StepLadder
            base={shown.values.radius}
            ladder={ladder}
            family={shown.name}
          />
        </Bench>
      );

    case "rungs":
      return (
        <Bench family={shown} action={action} ground={ground}>
          <DeadRungs
            base={shown.values.radius}
            ladder={ladder}
            drop={(state["dead-rungs"] ?? "keep") === "drop"}
          />
        </Bench>
      );

    case "album": {
      const pinned = (state.gap ?? "free") === "pinned";
      const tile = shown.values.tile;
      return (
        <Bench family={shown} action={action} ground={ground}>
          <AlbumGrid
            tile={tile}
            gap={pinned ? gapFor(tile) : 3}
            pinned={pinned}
            family={shown.name}
          />
        </Bench>
      );
    }

    case "compare":
      return (
        <CompareEvidence
          state={state}
          action={action}
          ladder={ladder}
          ground={ground}
          reloadKey={reloadKey}
        />
      );

    default:
      return null;
  }
}

/* ───────────────────── One real page, wearing the pick ────────────────── */

/**
 * THE STAGE: one route at true pixels, wearing the card being pressed.
 *
 * ★ ONE PAGE, NOT THREE. Round six drew the home, the guest album and the
 * host's own screen side by side under the pick: three documents, two of them
 * off the right edge of a 1440 window, all showing the same ruling. The page is
 * a strip control on the winner's step now, so the reader carries the pick
 * across the site one canvas at a time and the comparison that matters (two
 * families on one page) stays where it belongs, in the pair below.
 */
function PageStage({
  state,
  ground,
  picked,
  action,
  ladder,
  reloadKey,
}: {
  state: BoardState;
  ground: Ground;
  picked: SurfaceCandidate | null;
  action: ActionRung;
  ladder: LadderId;
  reloadKey: number;
}) {
  const key = useDesignKey();
  const mode = (state.canvas ?? "desktop") as Mode;
  const page = pageById(state.page);
  const { w, h } = CANVAS[mode];

  return (
    <div className="flex flex-col gap-4">
      <FrameRow lock={false}>
        <Frame
          id={`page-${page.id}`}
          src={pathFor(page.id, key ?? null, ground)}
          gated={page.gated}
          // Not `onApproach`: this is ONE frame and it is the stage of the
          // winner's step, six tall cards below the press. Mounted lazily, a
          // press at the top of the step changed a box that did not exist yet.
          w={w}
          h={h}
          css={picked ? blockFor(picked, action, ladder) : ""}
          title={`${page.label}: ${picked ? picked.name : "as it ships"}`}
          caption={page.note}
          reloadKey={reloadKey}
        />
      </FrameRow>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3">
        {picked ? (
          <>
            <Paste
              code={blockFor(picked, action, ladder)}
              label={`The block a ruling would land: ${picked.name}`}
            />
            <ApplyToSite
              block={{
                label: blockLabel(picked, action, ladder),
                css: blockFor(picked, action, ladder),
                what: "Hands every page with a design island this exact block, so a family can be walked signed in.",
                pages: "/, /pricing, /features/album, and the app",
              }}
            />
            <WalkPages pages={ROUNDING.links.pages ?? []} />
          </>
        ) : (
          <CellLabel className="max-w-2xl">
            Press a card above to wear it on this page, and the block it would
            land appears here.
          </CellLabel>
        )}
      </div>
    </div>
  );
}

/* ───────────────────── Any two, on the same real page ─────────────────── */

function CompareEvidence({
  state,
  action,
  ladder,
  ground,
  reloadKey,
}: {
  state: BoardState;
  action: ActionRung;
  ladder: LadderId;
  ground: Ground;
  reloadKey: number;
}) {
  const key = useDesignKey();
  const mode = (state.canvas ?? "desktop") as Mode;
  const page = pageById(state.page);
  const { w, h } = CANVAS[mode];
  const src = pathFor(page.id, key ?? null, ground);
  // One lock for this pair and only this pair: the stage above is a different
  // page and must not scroll with them.
  const lock = useFrameLock(true);

  return (
    <>
      {/* ★ THE PAIR SCROLLS AS ONE ROW, NEVER AS TWO COLUMNS OF THE PAGE. Two
          1440 documents side by side are 2,900 pixels and the lab column is
          about 1,300, so a plain two-column grid would hand each half a 600px
          cell and the shell would clip the right one at the window. The row is
          a bleed scroller with an explicit floor of both canvases, so the two
          halves stay the same size and the same distance apart at 1440 and at
          375, and the scroll lock keeps them on the same part of the page. */}
      <LazyRow
        bleed
        className="overflow-x-auto pb-2"
        fallback={<CellLabel>Loading both halves of the page.</CellLabel>}
      >
        {() => (
          <div style={{ minWidth: 2 * w + 24 }}>
            <CompareTwo
              spec={ROUNDING}
              state={state}
              cols={2}
              differs="One page twice at true pixels, scrolled together, each family written into its own document as the block a ruling lands."
              render={(candidate, side) => {
                const family = familyById(candidate.id);
                if (!family) return null;
                return (
                  <Frame
                    id={`compare-${side}`}
                    src={src}
                    gated={page.gated}
                    lock={lock}
                    w={w}
                    h={h}
                    css={blockFor(family, action, ladder)}
                    title={family.name}
                    caption={family.one}
                    reloadKey={reloadKey}
                  />
                );
              }}
            />
          </div>
        )}
      </LazyRow>
    </>
  );
}

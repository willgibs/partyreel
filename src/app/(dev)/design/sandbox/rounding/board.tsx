"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useCallback, useState, type CSSProperties } from "react";
import { useTheme } from "next-themes";

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
  type Ground,
  GroundBox,
  type Mode,
  Paste,
  useMountOnApproach,
  useBoardState,
  useDesignKey,
  useFrameLock,
  WalkPages,
} from "@/components/lab";
import { clearCandidate } from "@/components/dev/candidate-style";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  ACTIONS,
  type ActionRung,
  ANSWER,
  blockFor,
  blockLabel,
  cardMultiplier,
  familyById,
  LADDERS,
  ladderCss,
  type LadderId,
  px,
  rungById,
  STEP_CALL_SITES,
  STEPS,
  stepValue,
  SURFACES,
  type SurfaceCandidate,
} from "./candidates";
import { PAGES, pageById, pathFor } from "./frames";
import { ROUNDING } from "./spec";
import {
  EntrySheetSpecimen,
  FamilyStrip,
  GapPair,
  StepSpecimen,
} from "./specimens";

/**
 * THE ROUNDING BOARD, ROUND SIX: A CATALOG (2026-09-16).
 *
 * Will, on the round before this one: "each exploration page feels like a small
 * research paper into its track... a few of our best concepts created for
 * review, pick the best direction and refine for production polish", and
 * "designing a few variations always beats a mountain of research text".
 *
 * Round five had every measurement this board needed and no ANSWER a reader
 * could point at: three independent axes, five switches, seven lettered parts,
 * 4,859 words outside its folds. It asked a reviewer to assemble a proposal out
 * of a machine. This round proposes six.
 *
 * WHAT CHANGED, structurally:
 *
 *  1. A FAMILY IS A WHOLE ANSWER. Six named families, each naming every corner
 *     at once, ruled card by card with keep, refine or kill. The two axes that
 *     are true whichever family wins (the button rung and the derived ladder)
 *     survive as asks, not as a third of the answer.
 *  2. EVERY CARD IS THE PRODUCT, NOT A SWATCH BOOK. The preview is one piece of
 *     the app at a phone's own width, carrying the photographs, the card, the
 *     menu over it and the buttons under it at 1:1, with a real 375 viewport
 *     under it wearing the same paste.
 *  3. THE PICK IS PAGE WIDE, and the real pages below wear it. A and B are set
 *     from the cards too, so any two families can be put on the same real page
 *     without scrolling back to a dock.
 *  4. THE ARGUMENT IS UNDER THE EVIDENCE. Every paragraph rounds one to five
 *     wrote is either folded into a section's argument or deleted.
 *
 * TWO THINGS THE ROUND-FIVE SWEEP FOUND, both fixed by subtraction:
 *
 *  ★ THE BOARD NO LONGER MOUNTS THE TUNER PANEL. It was fixed over the bottom
 *    right and opened OPEN, so at 375 the first screen of the board was a
 *    320px panel rather than the board. Nothing here needs it: the radius knobs
 *    ride the real marketing pages and the app already (MARKETING_TUNER_CONTROLS
 *    in marketing-motion-tuner.tsx, ROUNDING_TUNER_CONTROLS in
 *    app-design-island.tsx), which is where dragging a radius is actually
 *    useful, and the catalog's Pick is the picker now.
 *
 *  ★ AND IT NO LONGER PULLS ITS OWN ROWS PAST THE COLUMN. `.rnd-wide` widened
 *    a row by a measured `--rnd-grow-left` inside a column the shell already
 *    pads, and the shell now clips that overhang (design.css), so the pull was
 *    silently cutting the left edge off the widest evidence on the board. The
 *    kit's own mechanism is the 1:1 bleed: `FrameRow` marks itself
 *    `data-lab-bleed` and the shell gives it the gutter back at Fit. A board
 *    never measures the page any more, which also retires the panel-measuring
 *    effect the panel above made pointless.
 */

/** Every height an action ships at, and the token each one wears. h-10 and
 *  h-12 are here because the tokens are named for them and both are nearly
 *  empty in the product, which is half of the button ask's finding. */
const HEIGHTS: {
  label: string;
  where: string;
  px: number;
  token: string;
  sample: string;
  radius: (a: ActionRung) => number;
}[] = [
  {
    label: "32px (h-8), the default",
    where: "every Button in the app",
    px: 32,
    token: "var(--radius-action-sm)",
    sample: "Add photos",
    radius: (a) => a.values.sm,
  },
  {
    label: "40px (h-10)",
    where: "--radius-action itself. The reel, the footer CTA",
    px: 40,
    token: "var(--radius-action)",
    sample: "Save to phone",
    radius: (a) => a.values.action,
  },
  {
    label: "44px (h-11), the marketing button",
    where: "size lg forced to h-11, in 26 files",
    px: 44,
    token: "calc(var(--radius-action) * 0.9)",
    sample: "Create your event",
    radius: (a) => a.values.action * 0.9,
  },
  {
    label: "48px (h-12)",
    where: "--radius-action-lg. One call site, at h-11",
    px: 48,
    token: "var(--radius-action-lg)",
    sample: "Publish the reel",
    radius: (a) => a.values.lg,
  },
];

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

/**
 * THE GROUND THE APP IS JUDGED ON, which is whichever mode the reader is in.
 *
 * A marketing route inside a frame runs next-themes in its own document and
 * follows him for free; the strip is drawn in THIS document and this lane's
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
 * ONE CATALOG CARD'S PREVIEW: the four corners at 1:1, over a real 375 viewport
 * wearing the same block.
 *
 * ★ IT IS A COMPONENT, NOT JSX BUILT IN THE BOARD, AND THAT IS LOAD-BEARING.
 * The board hands its evidence to the kit's template as VALUES, through two
 * callbacks, and the memo boundary in between does not reliably carry a change
 * that only the outer element reads: built inline, the ground box kept
 * `data-ground="app-dark"` and its dark class in a light lab while the frame it
 * contained had already switched to the light screen, measured on the board.
 * A value read where it is used has no boundary to cross. (The same lesson as
 * `LazyRow` above: state and the thing it drives belong in one component.)
 *
 * ★ AND THE GROUND IS PAINTED HERE RATHER THAN BY THE KIT'S `ground` PROP,
 * because the kit paints it `overflow-hidden`: at 375 the lab column is
 * narrower than the 375 this is drawn at, and a hidden box would CLIP the right
 * edge off every card. A specimen whose size is being judged is never scaled
 * and never cut, so it scrolls inside its own card instead, and only at widths
 * that cannot hold a phone.
 */
function CardPreview({
  family,
  action,
  ladder,
  reloadKey,
}: {
  family: SurfaceCandidate;
  action: ActionRung;
  ladder: LadderId;
  reloadKey: number;
}) {
  const ground = useAppGround();
  const key = useDesignKey();
  return (
    <GroundBox
      // ★ THE GROUND IS PART OF THIS BOX'S IDENTITY, NOT JUST A PROP, AND THAT
      // KEY IS NOT SUPERSTITION. next-themes resolves one tick AFTER hydration
      // (undefined, then the real mode), and on that one re-render React
      // patched the frame's src inside this box and left the box's own class
      // and `data-ground` on the server's value: a dark strip in a light lab,
      // measured on the board, while a LATER theme toggle updated it correctly.
      // A key makes the change a remount rather than a patch, which is honest
      // anyway: a different ground is a different specimen.
      key={ground}
      ground={ground}
      className="overflow-x-auto rounded-lg ring-1 ring-foreground/10"
    >
      <div
        style={tokensOf(family, action)}
        data-rnd-ladder={ladder}
        className="flex w-[375px] flex-col items-center gap-3 py-1"
      >
        <FamilyStrip />
        <Frame
          id={`card-${family.id}`}
          src={pathFor("app", key ?? null, ground)}
          gated
          onApproach
          lock={null}
          w={375}
          h={430}
          css={blockFor(family, action, ladder)}
          title={`${family.name}, on a phone`}
          caption={family.phone}
          reloadKey={reloadKey}
        />
      </div>
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
 * ★ AND THE GATE IS A COMPONENT, NOT A HOOK IN THE BOARD. The board hands its
 * evidence to the kit's template as values, so a `seen` flag held in the BOARD
 * has to travel back down through a memoised child to reach the row; it did
 * not, and both rows sat on "loading" for ever with the observer firing
 * correctly the whole time. State belongs in the component that renders the
 * thing it gates. `children` is a function so the frames are not built at all
 * until the row is live.
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
  // ★ THE DECLARED STATE IS READ HERE AS WELL AS IN THE TEMPLATE, AND THAT IS
  // SAFE BECAUSE IT IS NOT STATE. `useBoardState` derives its value from the
  // URL through an external store, so two callers read one source and cannot
  // drift; threading the template's state down through five evidence blocks
  // would have made every part a function of a prop it did not need.
  const { state, setState } = useBoardState(ROUNDING);
  const picked = familyById(state.family);
  const action = rungById(state.action);
  const ladder = state.ladder as LadderId;
  const mode = state.canvas as Mode;
  const page = pageById(state.page);
  const key = useDesignKey();
  const [reloadKey, setReloadKey] = useState(0);

  const appGround = useAppGround();

  // One lock for the compare's pair and only that pair: the pages row below is
  // three different pages and must not scroll with them.
  const compareLock = useFrameLock(true);

  const w = CANVAS[mode].w;
  const h = CANVAS[mode].h;
  const src = pathFor(page.id, key ?? null, appGround);

  /** The paste one family lands, which is also what every frame wears: a frame
   *  and the copy button can therefore never disagree. */
  const cssFor = useCallback(
    (c: SurfaceCandidate | null) => (c ? blockFor(c, action, ladder) : ""),
    [action, ladder],
  );

  const applyAnswer = useCallback(() => {
    setState({
      family: ANSWER.family,
      action: ANSWER.action,
      ladder: ANSWER.ladder,
    });
  }, [setState]);

  /* ── The catalog ──────────────────────────────────────────────────── */

  const CatalogEvidence = (
    <Catalog
      spec={ROUNDING}
      state={state}
      setState={setState}
      // 375 of strip plus the card's own 12px of padding on each side, so the
      // phone column is never squeezed and never scaled.
      minWidth={404}
      render={(candidate) => {
        const family = familyById(candidate.id);
        if (!family) return null;
        return (
          <CardPreview
            family={family}
            action={action}
            ladder={ladder}
            reloadKey={reloadKey}
          />
        );
      }}
    />
  );

  /* ── Any two, on the same real page ───────────────────────────────── */

  const CompareEvidence = (
    <>
      <CellLabel className="max-w-2xl">{page.note}</CellLabel>
      {/* ★ THE PAIR SCROLLS AS ONE ROW, NEVER AS TWO COLUMNS OF THE PAGE. Two
          1440 documents side by side are 2,900 pixels and the lab column is
          about 1,300, so a plain two-column grid would hand each half a 600px
          cell and the shell would clip the right one at the window (design.css
          clips a wide page's overhang). The row is a bleed scroller with an
          explicit floor of both canvases, so the two halves stay the same size
          and the same distance apart at 1440 and at 375, and the scroll lock
          keeps them on the same part of the page. */}
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
                    lock={compareLock}
                    w={w}
                    h={h}
                    css={cssFor(family)}
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

  /* ── The real pages, wearing the pick ─────────────────────────────── */

  const PagesEvidence = (
    <>
      <CellLabel>
        {picked
          ? `Wearing ${picked.name}. Press its card again to take it off.`
          : "Nothing picked: the pages as they ship. Press Pick on a card above."}
      </CellLabel>
      <LazyRow fallback={<CellLabel>Loading the three pages.</CellLabel>}>
        {() => (
          <FrameRow lock={false}>
            {PAGES.filter((p) => p.id !== "pricing" && p.id !== "album").map(
              (p) => (
                <Frame
                  key={p.id}
                  id={`page-${p.id}`}
                  src={pathFor(p.id, key ?? null, appGround)}
                  gated={p.gated}
                  w={w}
                  h={h}
                  css={cssFor(picked)}
                  title={`${p.label}: ${picked ? picked.name : "as it ships"}`}
                  caption={p.note}
                  reloadKey={reloadKey}
                />
              ),
            )}
          </FrameRow>
        )}
      </LazyRow>
      <div className="flex flex-wrap items-center gap-4">
        <ApplyToSite
          block={{
            label: blockLabel(picked ?? TODAY, action, ladder),
            css: blockFor(picked ?? TODAY, action, ladder),
            what: "Hands every page with a design island this exact block.",
            pages: "/, /pricing, /features/album, and the app",
          }}
        />
        <WalkPages pages={ROUNDING.links.pages ?? []} />
      </div>
    </>
  );

  /* ── The four calls a family does not settle ──────────────────────── */

  const base = picked ? picked.values.radius : TODAY.values.radius;
  const tile = picked ? picked.values.tile : TODAY.values.tile;
  const gap = picked ? picked.values.gap : TODAY.values.gap;

  const CallsEvidence = (
    <>
      <CellLabel className="max-w-2xl">
        Read at{" "}
        {picked
          ? `${picked.name}, a ${px(base)} card`
          : `today's ${px(base)} card`}
        . Pick another family above and every number follows it.
      </CellLabel>

      {/* 1. The button rung, at every height a button ships at. */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[12px] font-medium">
          Buttons, at every height they ship at
        </h3>
        {/* No `data-lab-bleed` here, and that is the shell's own rule: at 1:1 a
            wide page gives its gutter back to what is JUDGED, and this grid is
            mostly words. Bled, the first column's labels sat flush against the
            window edge and read as clipped. A frame row bleeds; a table does
            not. */}
        <div className="overflow-x-auto pb-1">
          <div className="grid min-w-[44rem] grid-cols-[10rem_repeat(3,minmax(0,1fr))] gap-x-4 gap-y-5">
            <div />
            {ACTIONS.map((a) => (
              <div key={a.id} className="flex flex-col gap-1.5">
                <p className="text-sm font-medium">
                  {a.name}
                  {a.id === ANSWER.action ? (
                    <span className="ml-1.5 rounded-action-sm bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">
                      the answer
                    </span>
                  ) : null}
                </p>
                <Button
                  size="xs"
                  className="w-fit"
                  variant={state.action === a.id ? "default" : "outline"}
                  onClick={() => setState({ action: a.id })}
                >
                  Take it board wide
                </Button>
              </div>
            ))}

            {HEIGHTS.map((row) => (
              <div key={row.label} className="contents">
                <div className="pt-1">
                  <p className="text-[11px] font-medium text-foreground">
                    {row.label}
                  </p>
                  <CellLabel className="mt-0.5">{row.where}</CellLabel>
                </div>
                {ACTIONS.map((a) => {
                  const r = row.radius(a);
                  return (
                    <div
                      key={a.id}
                      style={tokensOf(picked ?? TODAY, a)}
                      className="flex min-w-0 flex-col gap-1.5"
                    >
                      <span
                        className="inline-flex w-fit items-center bg-primary font-medium text-primary-foreground"
                        style={{
                          height: row.px,
                          paddingInline: Math.round(row.px * 0.45),
                          borderRadius: row.token,
                          fontSize: row.px >= 40 ? 15 : 13,
                        }}
                      >
                        {row.sample}
                      </span>
                      <CellLabel>
                        {r >= 100
                          ? "a pill at every height"
                          : `${px(r)}, ${Math.round((r / row.px) * 100) / 100} x height`}
                      </CellLabel>
                    </div>
                  );
                })}
              </div>
            ))}

            <div className="pt-1">
              <p className="text-[11px] font-medium text-foreground">
                The guest entry sheet
              </p>
              <CellLabel className="mt-0.5">
                entry-shell.tsx, at 1.4 x the button token. Not a button
              </CellLabel>
            </div>
            {ACTIONS.map((a) => (
              <div
                key={a.id}
                style={tokensOf(picked ?? TODAY, a)}
                className="min-w-0"
              >
                <EntrySheetSpecimen action={a.values.action} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. The seven derived steps, today's beside even quarters. */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[12px] font-medium">
          The seven corner steps, and the two nobody uses
        </h3>
        <div className="overflow-x-auto pb-1">
          <div className="grid min-w-[44rem] grid-cols-[3rem_minmax(0,11rem)_minmax(0,11rem)_1fr] items-center gap-x-4 gap-y-4">
            <CellLabel className="font-medium text-foreground">Step</CellLabel>
            <CellLabel className="font-medium text-foreground">
              As they are today, at {px(base)}
            </CellLabel>
            <CellLabel className="font-medium text-foreground">
              Even quarters, at {px(base)}
            </CellLabel>
            <CellLabel className="font-medium text-foreground">
              Where it lands
            </CellLabel>

            {STEPS.map((step) => {
              const site = STEP_CALL_SITES[step];
              const dead = site.uses <= 2;
              const cell = { "--radius": `${base}px` } as CSSProperties;
              return (
                <div key={step} className="contents">
                  <CellLabel
                    className={cn("font-medium", !dead && "text-foreground")}
                  >
                    {step}
                  </CellLabel>
                  <div
                    style={cell}
                    data-rnd-ladder="stock"
                    className="flex min-w-0 items-center"
                  >
                    <StepSpecimen step={step} />
                  </div>
                  <div
                    style={cell}
                    data-rnd-ladder="quarters"
                    className="flex min-w-0 items-center"
                  >
                    <StepSpecimen step={step} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <CellLabel>
                      {LADDERS.stock[step]}x ={" "}
                      {px(stepValue(base, "stock", step))}
                      {"  |  "}
                      {LADDERS.quarters[step]}x ={" "}
                      {px(stepValue(base, "quarters", step))}
                    </CellLabel>
                    <CellLabel>
                      {site.uses} {site.uses === 1 ? "use" : "uses"}:{" "}
                      {site.where}
                      {dead ? ". One of the two a drop removes." : ""}
                    </CellLabel>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <CellLabel>
          Card is rounded-xl, so its corner is the xl step:{" "}
          {cardMultiplier(ladder)}x of {px(base)} ={" "}
          {px(stepValue(base, ladder, "xl"))}.
        </CellLabel>
      </div>

      {/* 3. The gap between photographs. */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[12px] font-medium">
          The gap between photographs, in the guest album
        </h3>
        <GapPair tile={tile} gap={gap} />
      </div>
    </>
  );

  /* ── The ruling, as a paste ───────────────────────────────────────── */

  const PasteEvidence = (
    <>
      <Paste
        label={
          picked
            ? `${picked.name}, ${action.short}${ladder === "quarters" ? ", even quarters" : ""}`
            : "Nothing picked: the block the board's own answer would land"
        }
        code={blockFor(picked ?? familyById(ANSWER.family)!, action, ladder)}
      />
      <CellLabel className="max-w-2xl">
        The radius tokens live on :root alone, so nothing here is theme
        dependent. A retuned ladder rides along as utility overrides, because
        @theme inline bakes each step into its utility and no token reaches it.
      </CellLabel>
    </>
  );

  return (
    <>
      {/* The retuned ladder, scoped so one subtree can wear it. The same
          function writes the unscoped block the paste carries. */}
      <style>{ladderCss("quarters", '[data-rnd-ladder="quarters"] ')}</style>

      <BoardPage
        spec={ROUNDING}
        dock={() => (
          <>
            <AppliedBadge />
            <Button
              size="xs"
              variant="outline"
              onClick={() => setReloadKey((n) => n + 1)}
            >
              Reload frames
            </Button>
            <Button size="xs" variant="outline" onClick={applyAnswer}>
              Pick the answer
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                clearCandidate();
                setState({ family: "none" });
              }}
            >
              Clear
            </Button>
          </>
        )}
        evidence={(id: string) => {
          switch (id) {
            case "catalog":
              return CatalogEvidence;
            case "compare":
              return CompareEvidence;
            case "pages":
              return PagesEvidence;
            case "calls":
              return CallsEvidence;
            case "paste":
              return PasteEvidence;
            default:
              return null;
          }
        }}
      />
    </>
  );
}

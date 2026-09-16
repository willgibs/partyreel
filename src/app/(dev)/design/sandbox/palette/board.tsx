"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useState } from "react";

import {
  AppliedBadge,
  ApplyToSite,
  BoardPage,
  CANVAS,
  CellLabel,
  Compare,
  Knob,
  Labeled,
  Paste,
  Stage,
  Toggle,
  WalkPages,
  type BoardState,
  type Mode,
} from "@/components/lab";
import {
  setCandidateCss,
  useTunerCandidate,
} from "@/components/dev/candidate-style";

import { AccentWall } from "./call-sites";
import { DarkTable, LadderRulers, LightTable } from "./ladders";
import { SITE_PAGES, SiteFrames, type PageId } from "./live";
import { ModelBlock } from "./model";
import { RealFloating } from "./real-ui";
import {
  ACCENT_BY_ID,
  accentBlock,
  accentStyle,
  applyCss,
  applyLabel,
  blockFor,
  BRAND_FILES,
  BRAND_HITS,
  DARK_BY_ID,
  DARKS,
  FAINT_ALPHAS,
  FAINT_USES,
  LIGHT_BY_ID,
  LIGHTS,
  lOf,
  MAT_ALPHAS,
  MAT_HOVER_USES,
  MAT_USES,
  pairStyle,
  papersOf,
  REACHES,
  resolvePair,
  RING_USES,
  roomsOf,
  stageGround,
  tokenBlock,
  type AccentId,
  type BoardGround,
  type CardMode,
  type DarkId,
  type LightId,
  type Pair,
  type ReachId,
} from "./registers";
import { InkLeaf, MarketingChapter, PanelBand, SurfaceStack } from "./sections";
import { PALETTE } from "./spec";
import {
  AppDashboard,
  AppEvent,
  DepthRow,
  GroundsRow,
  GuestAlbum,
  PhotoCards,
  TextSteps,
} from "./specimens";

/**
 * THE PALETTE BOARD (round four, 2026-09-15; on the kit's template since the
 * Library x Lab migration wave). Bible 1 and 16 under exploration.
 *
 * What the board ARGUES lives in `spec.ts` now, and only there: the question,
 * the model, the eight one-word calls, the five registers as candidates, the
 * six departures and the two asset asks. What is left here is what a board
 * should be and nothing else: the evidence for each declared section, as a
 * function of the declared state.
 *
 * THREE THINGS THE MIGRATION CHANGED IN THE EVIDENCE, each because the kit does
 * the job better than this board's hand-built version did:
 *
 *  1 THE LIVE SECTIONS BECAME LIVE PAGES. `TrueViewport` and the four imported
 *    production sections retired to the kit's `Frame` loading the real routes,
 *    today beside the pair and scrolled together. live.tsx says what that
 *    bought and what went with it (the settling sheet, the scoped stylesheet).
 *  2 THE PAIR FRAME BECAME A WIPE. Round three was right about the problem (a
 *    0.02 step is not a memory test) and fixed the join at the middle; the kit's
 *    `Compare` in wipe mode is the same one canvas with the seam on a slider, so
 *    the join can be dragged over the exact surface in question.
 *  3 THE TWO SET CARDS BECAME TWO TABLES. Round four printed only the set the
 *    dock was already on, so comparing two darks was a press, a scroll and a
 *    memory test. `SelectTable` puts all six in one table and the ROW is the
 *    control.
 *
 * Board mechanics worth knowing before editing:
 *  - a pair is applied as INLINE custom properties on a wrapper inside the
 *    Stage, never by swapping a class, so the Stage keeps the real `.dark` /
 *    `.surface-paper` class that the `dark:` variants in production components
 *    need. See pairStyle() in registers.ts. A FRAME is the other way round: the
 *    paste is written into its document with the real selectors, which is why
 *    the live pages need no wrapper at all and why the accent reaches the mark
 *    in the footer there without anything scoped to a stage id.
 *  - breakpoints do not work inside a Stage (a 375 wide stage in a 1440
 *    viewport still matches `sm:`), so every hand-built section branches on the
 *    canvas control; anything carrying production prefixes belongs in a frame.
 *  - what the board renders and what the paste prints both read the RESOLVED
 *    pair, so the two can never disagree.
 */

/**
 * ★ ONE PLACE ANSWERS THE DOCK. Every block this board renders goes through
 * here, so no section can show an answer the dock is not claiming and no switch
 * in the dock can be decorative. A section that resolved for itself is exactly
 * how the missing step went decorative in round two: it reached the paste and
 * one specimen and not the ladder, which is the evidence the ask is ABOUT.
 */
function read(state: BoardState) {
  const mode = (state.canvas ?? "desktop") as Mode;
  const darkId = (state.dark ?? "ember") as DarkId;
  const lightId = (state.light ?? "paper") as LightId;
  const accent = ACCENT_BY_ID[(state.accent ?? "flare") as AccentId];
  const reach = (state.reach ?? "all") as ReachId;
  const cardMode = (state.card ?? "declared") as CardMode;
  const matRegister = (state.mat ?? "register") === "register";
  const faintOnDimmed = (state.faint ?? "in") === "in";
  const resolve = (p: Pair) => resolvePair(p, cardMode, faintOnDimmed);
  const pair = resolve({
    dark: DARK_BY_ID[darkId],
    light: LIGHT_BY_ID[lightId],
  });
  const todayPair = resolve({
    dark: DARK_BY_ID.today,
    light: LIGHT_BY_ID.today,
  });
  return {
    mode,
    desktop: mode === "desktop",
    darkId,
    lightId,
    accent,
    reach,
    cardMode,
    matRegister,
    faintOnDimmed,
    resolve,
    pair,
    todayPair,
    opts: { accent, reach, matRegister, faintOnDimmed },
  };
}

/**
 * A stage under one pair's tokens.
 *
 * `extra` lands on the SAME element as the pair, which matters for the accent
 * on the slab: `.surface-ink` declares --brand itself, and a class rule outranks
 * a custom property inherited from a wrapper outside the stage, so an accent set
 * on an ancestor would silently not reach the leaf. Inline on the element wins.
 */
function PairStage({
  pair,
  ground,
  mode,
  height,
  extra,
  children,
}: {
  pair: Pair;
  ground: BoardGround;
  mode: Mode;
  height: number;
  extra?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <Stage mode={mode} ground={stageGround(ground)} height={height}>
      <div
        data-pal-swap
        data-pal-cues
        className="h-full w-full overflow-hidden bg-background text-foreground"
        style={{ ...pairStyle(pair, ground), ...extra }}
      >
        {children}
      </div>
    </Stage>
  );
}

/**
 * The five surfaces of one block, as a line. It is read off the SAME strings
 * the canvas above it paints, so a number here cannot drift from a colour there,
 * and it sits under the canvas rather than on it: under a wipe, two lines of
 * numbers one over the other would be sliced down the middle and read as
 * garbled (they used to be drawn inside each half, one block each).
 */
function steps(
  pair: Pair,
  ground: BoardGround,
  tone: "light" | "dark",
): string {
  const block = blockFor(pair, ground);
  const at = (token: string) => {
    const l = lOf(block[token] ?? "", block);
    return l === null ? "none" : l.toFixed(3);
  };
  return `${tone === "dark" ? "room" : "paper"} ${at("--background")}, ${
    tone === "dark" ? "panel" : "mat"
  } ${at("--muted")}, card ${at("--card")}, menu ${at("--popover")}, hover ${at(
    "--secondary",
  )}`;
}

/**
 * TODAY AND THE CANDIDATE IN ONE CANVAS, WITH THE SEAM ON A SLIDER.
 *
 * ★ THE ROW IS THE SCROLLER, NOT EACH HALF. `Compare` stacks B over A
 * absolutely, so the two layers have to share one scroll box: two 1:1 Stages
 * each with their own `overflow-x-auto` would drift apart the moment a 1440
 * canvas was scrolled sideways in a narrower column, and the wipe would then be
 * joining two different parts of the page. The row scrolls once, at the canvas
 * width, and both Stages sit inside it with nothing left of their own to scroll.
 *
 * ★ AND A PAIR OF ONE SET IS NOT A COMPARISON. "Today" is one of the answers
 * both switches offer, and picking it makes B the same block as A: the canvas
 * renders ONCE instead, with a line saying which press brings the wipe back.
 */
function PairWipe({
  todayPair,
  pair,
  ground,
  mode,
  height,
  tone,
  sameSet,
  differs,
  hint,
}: {
  todayPair: Pair;
  pair: Pair;
  ground: BoardGround;
  mode: Mode;
  height: number;
  tone: "light" | "dark";
  sameSet: boolean;
  differs: string;
  hint: string;
}) {
  const { w } = CANVAS[mode];
  const half = (p: Pair) => (
    <Stage mode={mode} ground={stageGround(ground)} height={height} fit="true">
      <div
        data-pal-swap
        className="h-full w-full overflow-hidden bg-background text-foreground"
        style={pairStyle(p, ground)}
      >
        <SurfaceStack mode={mode} tone={tone} />
      </div>
    </Stage>
  );
  return (
    <div className="overflow-x-auto pb-2">
      <div style={{ width: w }} className="shrink-0">
        {sameSet ? (
          <>
            {half(todayPair)}
            <CellLabel>{hint}</CellLabel>
          </>
        ) : (
          <Compare
            mode="wipe"
            differs={differs}
            labels={[
              "Today",
              tone === "dark" ? pair.dark.label : pair.light.label,
            ]}
            a={half(todayPair)}
            b={half(pair)}
          />
        )}
      </div>
    </div>
  );
}

/** The board writes its counts in words, so a derived number still reads like
 *  the sentence around it. */
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven"];
const inWords = (n: number) => WORDS[n] ?? String(n);

const WALK_PAGES = PALETTE.links.pages ?? [];

export function PaletteBoard() {
  // The switches that change ONE section each, so they stay beside it rather
  // than in the dock (the dock's rule: a page-wide switch is declared in the
  // spec, a per-specimen one sits with its specimen).
  const [pageId, setPageId] = useState<PageId>("home");
  const [split, setSplit] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [accentGround, setAccentGround] = useState<"cinema" | "paper">(
    "cinema",
  );
  const applied = useTunerCandidate();

  return (
    <BoardPage
      spec={PALETTE}
      dock={(state) => {
        const { pair, opts } = read(state);
        return (
          <>
            {/* Which block stands on the site, and its clear. Absent until one
                stands, so the dock does not carry an empty slot. */}
            <AppliedBadge />
            <ApplyToSite
              block={{
                label: applyLabel(pair, opts),
                css: applyCss(pair, opts),
                what: "Hands the whole site the pair, the accent and both switches.",
                pages: "the home arc, pricing, help, contact, the dashboard",
              }}
            />
          </>
        );
      }}
      evidence={(id, state, api) => {
        const s = read(state);
        const {
          mode,
          desktop,
          pair,
          todayPair,
          accent,
          reach,
          cardMode,
          matRegister,
          faintOnDimmed,
          resolve,
        } = s;
        const h = (d: number, p: number) => (desktop ? d : p);
        const page = SITE_PAGES.find((p) => p.id === pageId) ?? SITE_PAGES[0];
        const apply = () =>
          setCandidateCss(applyLabel(pair, s.opts), applyCss(pair, s.opts));

        switch (id) {
          /* ── The model ──────────────────────────────────────────────── */
          case "model":
            return <ModelBlock pair={pair} />;

          /* ── The two ladders ────────────────────────────────────────── */
          case "ladders":
            return (
              <>
                <DarkTable
                  value={s.darkId}
                  onChange={(dark) => api.setState({ dark })}
                />
                <LightTable
                  value={s.lightId}
                  onChange={(light) => api.setState({ light })}
                />
                <LadderRulers resolve={resolve} pair={pair} />
              </>
            );

          /* ── A menu over a card ─────────────────────────────────────── */
          case "stack":
            return (
              <>
                <Labeled
                  name={`the stack, the room · today beside ${pair.dark.label}`}
                  note={
                    <>
                      <span className="block tabular-nums">
                        Today: {steps(todayPair, "app-dark", "dark")}. Five
                        surfaces inside 0.11, two of them the wrong way round.
                      </span>
                      <span className="block tabular-nums">
                        {pair.dark.label}: {steps(pair, "app-dark", "dark")}.
                      </span>
                    </>
                  }
                >
                  <PairWipe
                    todayPair={todayPair}
                    pair={pair}
                    ground="app-dark"
                    mode={mode}
                    height={h(440, 545)}
                    tone="dark"
                    sameSet={s.darkId === "today"}
                    differs={`Today's dark ladder against ${pair.dark.label}'s, on the same five surfaces and nothing else.`}
                    hint="The dark set is Today, so both halves would be the same block. Pick any other dark in the dock for the wipe."
                  />
                </Labeled>
                <Labeled
                  name={`the stack, the paper · today beside ${pair.light.label}`}
                  note={
                    <>
                      <span className="block tabular-nums">
                        Today: {steps(todayPair, "app-light", "light")}. Five
                        surfaces inside 0.037, so a card is its hairline and
                        nothing else.
                      </span>
                      <span className="block tabular-nums">
                        {pair.light.label}: {steps(pair, "app-light", "light")}.
                      </span>
                    </>
                  }
                >
                  <PairWipe
                    todayPair={todayPair}
                    pair={pair}
                    ground="app-light"
                    mode={mode}
                    height={h(440, 545)}
                    tone="light"
                    sameSet={s.lightId === "today"}
                    differs={`Today's light ladder against ${pair.light.label}'s, on the same five surfaces.`}
                    hint="The light set is Today, so both halves would be the same block. Pick any other light in the dock for the wipe."
                  />
                </Labeled>
              </>
            );

          /* ── The registers, counted ─────────────────────────────────── */
          case "registers":
            return (
              <>
                <Labeled
                  name={`paper · ${pair.dark.label} dark, ${pair.light.label} light`}
                  note="The lightbox backdrop (a literal black, not a token at all), the media well and the slab, on paper, because the slab's whole job is to sit on a light page."
                >
                  <PairStage
                    pair={pair}
                    ground="paper"
                    mode={mode}
                    height={h(560, 1240)}
                  >
                    <GroundsRow mode={mode} pair={pair} />
                  </PairStage>
                </Labeled>
                <Labeled
                  name={`the slab hosting a card and a menu · ${pair.dark.label} · ${accent.label}`}
                  note="The two things an incomplete slab actually breaks. On Today they render near white on a dark ground, because .surface-ink declares no --card and no --popover."
                >
                  <PairStage
                    pair={pair}
                    ground="ink"
                    mode={mode}
                    height={h(610, 1120)}
                    extra={accentStyle(accent, true)}
                  >
                    <InkLeaf mode={mode} complete={s.darkId !== "today"} />
                  </PairStage>
                </Labeled>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {DARKS.map((d) => {
                    const set = resolve({ dark: d, light: pair.light }).dark;
                    return (
                      <div key={d.id} className="space-y-1.5">
                        <p className="truncate text-[11px] font-medium">
                          {d.label}
                          <span className="ml-1.5 font-normal text-muted-foreground">
                            dark
                          </span>
                        </p>
                        <div className="flex h-24 overflow-hidden rounded-lg border border-border">
                          {roomsOf(set).map((room) => {
                            const l = lOf(room.value, set.room);
                            return (
                              <div
                                key={room.name}
                                className="flex flex-1 flex-col items-center justify-end gap-0.5 pb-1.5"
                                style={{ background: room.value }}
                              >
                                <span className="text-[10px] text-white tabular-nums">
                                  {l !== null ? l.toFixed(3) : ""}
                                </span>
                                <span className="text-[9px] text-white/60">
                                  {room.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {LIGHTS.map((li) => {
                    const set = resolve({ dark: pair.dark, light: li }).light;
                    return (
                      <div key={li.id} className="space-y-1.5">
                        <p className="truncate text-[11px] font-medium">
                          {li.label}
                          <span className="ml-1.5 font-normal text-muted-foreground">
                            light
                          </span>
                        </p>
                        <div className="flex h-24 overflow-hidden rounded-lg border border-border">
                          {papersOf(set).map((sheet) => {
                            const l = lOf(sheet.value, set.paper);
                            return (
                              <div
                                key={sheet.name}
                                className="flex flex-1 flex-col items-center justify-end gap-0.5 pb-1.5"
                                style={{ background: sheet.value }}
                              >
                                <span className="text-[10px] text-black tabular-nums">
                                  {l !== null ? l.toFixed(3) : ""}
                                </span>
                                <span className="text-[9px] text-black/50">
                                  {sheet.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );

          /* ── The real site ──────────────────────────────────────────── */
          case "pages":
            return (
              <>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <Knob label="Page">
                    <Toggle
                      ariaLabel="The page"
                      options={SITE_PAGES.map((p) => ({
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
                    Reload both frames
                  </button>
                </div>
                <CellLabel className="mt-0 max-w-2xl">
                  These three change this section only, so they stay beside it.
                  A link clicked inside a frame navigates that frame; Reload
                  brings it back.
                </CellLabel>
                <CellLabel className="mt-0 max-w-2xl">{page.note}</CellLabel>
                <SiteFrames
                  page={page}
                  mode={mode}
                  split={split}
                  candidateCss={applyCss(pair, s.opts)}
                  candidateLabel={`${pair.dark.label} dark, ${pair.light.label} light, ${accent.label.toLowerCase()}`}
                  reloadKey={reloadKey}
                />
              </>
            );

          /* ── The host app ───────────────────────────────────────────── */
          case "app":
            return (
              <>
                <Labeled
                  name={`an event, the room · ${pair.dark.label}`}
                  note="The header, the stat band, the config chips, the command strip on the panel, the review queue and the grid: four crushed dark surfaces at once."
                >
                  <PairStage
                    pair={pair}
                    ground="app-dark"
                    mode={mode}
                    height={h(1090, 780)}
                  >
                    <AppEvent mode={mode} />
                  </PairStage>
                </Labeled>
                <Labeled name={`an event, the paper · ${pair.light.label}`}>
                  <PairStage
                    pair={pair}
                    ground="app-light"
                    mode={mode}
                    height={h(1090, 780)}
                  >
                    <AppEvent mode={mode} />
                  </PairStage>
                </Labeled>
                <Labeled
                  name={`the dashboard, the room · ${pair.dark.label}`}
                  note="The real filter chips, the storage track, the event cards, and a panel inside a card."
                >
                  <PairStage
                    pair={pair}
                    ground="app-dark"
                    mode={mode}
                    height={h(820, 960)}
                  >
                    <AppDashboard mode={mode} />
                  </PairStage>
                </Labeled>
                <Labeled
                  name={`the dashboard, the paper · ${pair.light.label}`}
                >
                  <PairStage
                    pair={pair}
                    ground="app-light"
                    mode={mode}
                    height={h(820, 960)}
                  >
                    <AppDashboard mode={mode} />
                  </PairStage>
                </Labeled>
              </>
            );

          /* ── The guest album ────────────────────────────────────────── */
          case "album":
            return (
              <>
                <Labeled
                  name={`the guest album, the paper · ${pair.light.label}`}
                  note="The well is identical in both modes by design, so the only thing that moves between these two is the chrome around it."
                >
                  <PairStage
                    pair={pair}
                    ground="app-light"
                    mode={mode}
                    height={h(960, 900)}
                  >
                    <GuestAlbum mode={mode} />
                  </PairStage>
                </Labeled>
                <Labeled
                  name={`the guest album, the room · ${pair.dark.label}`}
                >
                  <PairStage
                    pair={pair}
                    ground="app-dark"
                    mode={mode}
                    height={h(960, 900)}
                  >
                    <GuestAlbum mode={mode} />
                  </PairStage>
                </Labeled>
              </>
            );

          /* ── The floating layer ─────────────────────────────────────── */
          case "floating":
            return (
              <RealFloating onApply={apply} applied={applied?.label ?? null} />
            );

          /* ── Depth, and the card over a photograph ──────────────────── */
          case "depth":
            return (
              <>
                <Labeled
                  name={`the cues, the room · ${pair.dark.label}`}
                  note={`The ring is the elevation system nobody wrote down, measured: ring-foreground/5 at ${RING_USES.faint} sites, ring-foreground/10 at ${RING_USES.firm}, ring-white/70 at ${RING_USES.onMedia} on media.`}
                >
                  <PairStage
                    pair={pair}
                    ground="app-dark"
                    mode={mode}
                    height={h(465, 875)}
                  >
                    <DepthRow mode={mode} />
                  </PairStage>
                </Labeled>
                <Labeled name={`the cues, the paper · ${pair.light.label}`}>
                  <PairStage
                    pair={pair}
                    ground="app-light"
                    mode={mode}
                    height={h(465, 875)}
                  >
                    <DepthRow mode={mode} />
                  </PairStage>
                </Labeled>
                <Labeled
                  name={`over a photograph, the room · ${pair.dark.label} · card ${cardMode}`}
                  note="Left: the card as this dark set declares it, under the card switch in the dock. Right: today's 62 percent, fixed, so the difference is a look and not a footnote."
                >
                  <PairStage
                    pair={pair}
                    ground="app-dark"
                    mode={mode}
                    height={h(460, 470)}
                  >
                    <PhotoCards mode={mode} />
                  </PairStage>
                </Labeled>
              </>
            );

          /* ── The mat ────────────────────────────────────────────────── */
          case "mat":
            return (
              <>
                {/* Measured, with the command that produced it in registers.ts. */}
                <CellLabel className="mt-0 max-w-2xl">
                  {MAT_ALPHAS.map((a) => `${a.alpha} percent x${a.uses}`).join(
                    ", ",
                  )}
                  {` = ${MAT_USES} panels, plus ${MAT_HOVER_USES} hover fills wearing the same utility, which the switch leaves alone.`}
                </CellLabel>
                <Labeled
                  name={`the paper · ${pair.light.label} · ${matRegister ? "the mat as a register" : "today's alphas"}`}
                >
                  <PairStage
                    pair={pair}
                    ground="paper"
                    mode={mode}
                    height={h(575, 900)}
                  >
                    <PanelBand mode={mode} single={matRegister} />
                  </PairStage>
                </Labeled>
                <Labeled
                  name={`the room · ${pair.dark.label} · ${matRegister ? "the mat as a register" : "today's alphas"}`}
                  note="The app's dark panels wear the same utility, so the switch reaches them too."
                >
                  <PairStage
                    pair={pair}
                    ground="app-dark"
                    mode={mode}
                    height={h(575, 900)}
                  >
                    <PanelBand mode={mode} single={matRegister} />
                  </PairStage>
                </Labeled>
                <Labeled
                  name={`three chapter cards, the room · ${pair.dark.label}`}
                  note="The no-photograph case on the room: a card on a dark page with nothing but a step to separate it."
                >
                  <PairStage
                    pair={pair}
                    ground="cinema"
                    mode={mode}
                    height={h(800, 1220)}
                  >
                    <MarketingChapter mode={mode} />
                  </PairStage>
                </Labeled>
              </>
            );

          /* ── The text steps ─────────────────────────────────────────── */
          case "text":
            return (
              <>
                <Labeled
                  name={`the paper · ${pair.light.label} · ${faintOnDimmed ? "faint in" : "faint out"}`}
                >
                  <PairStage
                    pair={pair}
                    ground="paper"
                    mode={mode}
                    height={h(350, 840)}
                  >
                    <TextSteps mode={mode} faint={faintOnDimmed} />
                  </PairStage>
                </Labeled>
                <Labeled
                  name={`the room · ${pair.dark.label} · ${faintOnDimmed ? "faint in" : "faint out"}`}
                >
                  <PairStage
                    pair={pair}
                    ground="cinema"
                    mode={mode}
                    height={h(350, 840)}
                  >
                    <TextSteps mode={mode} faint={faintOnDimmed} />
                  </PairStage>
                </Labeled>
                {/* The count is the same either way, because it is a
                    measurement; what changes is what the third line in each
                    canvas above is MADE of. */}
                <CellLabel className="max-w-2xl">
                  {FAINT_ALPHAS.map(
                    (a) => `${a.alpha} percent x${a.uses}`,
                  ).join(", ")}
                  {` = ${FAINT_USES} sites dimming the second step by hand, ${FAINT_ALPHAS[3].uses} of them at exactly the 70 percent --faint is.`}
                </CellLabel>
              </>
            );

          /* ── The accent ─────────────────────────────────────────────── */
          case "accent":
            return (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Knob label="Ground">
                    <Toggle
                      ariaLabel="Ground"
                      options={[
                        { id: "cinema" as const, label: "The room" },
                        { id: "paper" as const, label: "The paper" },
                      ]}
                      value={accentGround}
                      onChange={setAccentGround}
                    />
                  </Knob>
                  <CellLabel className="mt-0">
                    {`This one stays beside its specimen: it changes this wall and nothing else. A hue ruling is two token values reaching ${BRAND_HITS} utilities in ${BRAND_FILES} files.`}
                  </CellLabel>
                </div>
                <div className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-sm font-semibold">{accent.name}</p>
                  <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                    {accent.why}
                  </p>
                  <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                    The risk: {accent.risk}
                  </p>
                  <p className="mt-1.5 max-w-3xl text-xs text-muted-foreground">
                    <span className="text-foreground">The reach:</span>{" "}
                    {REACHES.find((r) => r.id === reach)?.note}
                  </p>
                </div>
                <Labeled
                  name={`${accentGround === "cinema" ? "the room" : "the paper"} · all four hues · reach: ${reach}`}
                  note="A job outside the ruled reach renders on ink, which is what the ruling lands."
                >
                  <PairStage
                    pair={pair}
                    ground={accentGround}
                    mode={mode}
                    height={h(1480, 1800)}
                  >
                    <AccentWall
                      mode={mode}
                      dark={accentGround === "cinema"}
                      reach={reach}
                    />
                  </PairStage>
                </Labeled>
              </>
            );

          /* ── The paste ──────────────────────────────────────────────── */
          case "paste": {
            const paste = [tokenBlock(pair), accentBlock(accent, reach)]
              .filter(Boolean)
              .join("\n\n");
            return (
              <>
                <ApplyToSite
                  block={{
                    label: applyLabel(pair, s.opts),
                    css: applyCss(pair, s.opts),
                    what: `Hands the site ${pair.dark.label} dark and ${pair.light.label} light, the accent, and both switches.`,
                    pages:
                      "the home arc, pricing, help, contact, the dashboard",
                  }}
                />
                <WalkPages pages={WALK_PAGES} />
                <CellLabel className="max-w-2xl">
                  {inWords(WALK_PAGES.length)} links, each opening with the
                  block standing. It persists in this browser until Clear, and
                  the tuner panel on any of those pages clears it too. The event
                  page needs the signed-in host, so the walk goes to the
                  dashboard and the event is one click on.
                </CellLabel>
                {/* The RESOLVED pair, which is the point: the two sets, the dark
                    card and the missing step are all already in `pair`, so this
                    block is the paste this dock's answers land and it cannot
                    drift from what every canvas above is rendering. The mat
                    switch is the one answer that is not here, and it cannot be:
                    it moves call sites rather than values. */}
                <Paste
                  label={`globals.css and marketing.css · ${pair.dark.label} dark, ${pair.light.label} light, ${accent.label.toLowerCase()}`}
                  code={paste}
                  lines={14}
                />
                <ul className="max-w-2xl space-y-1 text-[11px] text-muted-foreground">
                  {faintOnDimmed ? (
                    <li>
                      theme.css needs{" "}
                      <span className="text-foreground">
                        --color-faint: var(--faint);
                      </span>{" "}
                      in its @theme inline block before a text-faint utility
                      exists. The board reaches the token with an arbitrary
                      value, so nothing here depends on that line landing first.
                    </li>
                  ) : (
                    <li>
                      The missing step is ruled OUT, so the block above declares
                      no <span className="text-foreground">--faint</span>{" "}
                      anywhere and theme.css needs nothing: the {FAINT_USES}{" "}
                      sites keep compositing an alpha of the second step by
                      hand.
                    </li>
                  )}
                  <li>
                    <span className="text-foreground">.surface-mat</span> is a
                    new class. The token block lands with the paste; the{" "}
                    {MAT_USES} sites that write bg-muted/N today become sections
                    that carry the class, which is a mechanical follow-up rather
                    than part of this ruling. The mat switch emulates it with
                    one rule, on the walk and in the live frames.
                  </li>
                </ul>
              </>
            );
          }

          default:
            return null;
        }
      }}
    />
  );
}

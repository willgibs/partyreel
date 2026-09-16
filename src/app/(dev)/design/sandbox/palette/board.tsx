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
import { PalettePreview } from "./catalog";
import { SITE_PAGES, SiteFrames, type PageId } from "./live";
import { resolvePalette } from "./palettes";
import { RealFloating } from "./real-ui";
import {
  accentBlock,
  applyCss,
  applyLabel,
  blockFor,
  BRAND_FILES,
  BRAND_HITS,
  FAINT_ALPHAS,
  FAINT_USES,
  lOf,
  MAT_USES,
  pairStyle,
  resolvePair,
  RING_USES,
  stageGround,
  tokenBlock,
  type AccentMode,
  type BoardGround,
  type CardMode,
  type Pair,
  type ReachId,
} from "./registers";
import { SurfaceStack } from "./sections";
import {
  AppDashboard,
  AppEvent,
  GuestAlbum,
  PhotoCards,
  TextSteps,
} from "./specimens";
import { PALETTE } from "./spec";

/**
 * THE PALETTE BOARD (round six, the clarity round, 2026-09-15). Bible 1 and 16
 * under exploration.
 *
 * ★ THE ROUND IS A SUBTRACTION AND THE BOARD IS ITS RECEIPT. Rounds one to five
 * built a machine: thirteen sections, eight asks, seven switches, thirty pairs.
 * Will read it and said what it actually was ("it almost feels like I'm reading
 * a PhD on color theory... then I end up with six configs that aren't clearly
 * explained"). So the board is now six sections, four asks and ONE candidate
 * switch, and the first of them is a catalog of twelve finished palettes that
 * can be compared without touching a control at all.
 *
 * ★ WHAT LEFT, AND WHY NONE OF IT IS LOST. `ladders.tsx` (the oklab rulers and
 * the two set tables), `model.tsx` (the register diagram) and three quarters of
 * `sections.tsx` are gone. Every finding they rendered is a collapsed
 * `argument` paragraph on the catalog section in `spec.ts`: the crush, the
 * 0.455 hole, the panel that ships lighter than its card, and why cinema and
 * ink are not two darks. An argument earns a canvas when it is the thing being
 * decided; once it is settled evidence it earns a paragraph.
 *
 * Board mechanics worth knowing before editing:
 *  - a palette is applied as INLINE custom properties on a wrapper (PairStage
 *    here, ScopedTokens in catalog.tsx), never by swapping a class, so the
 *    element keeps the real `.dark` / `.surface-paper` class that the `dark:`
 *    variants in production components need. A FRAME is the other way round:
 *    the paste is written into its document with the real selectors, which is
 *    why the accent reaches the mark in the footer there with nothing scoped.
 *  - breakpoints do not work inside a Stage (a 375 wide stage in a 1440
 *    viewport still matches `sm:`), so every hand-built composition branches on
 *    the canvas control. The catalog is NOT in a stage, so its grid uses real
 *    breakpoints and they are honest.
 *  - what the board renders and what the paste prints both read the RESOLVED
 *    palette, so the two can never disagree.
 */

/** Everything the dock is claiming, resolved once per render. */
function read(state: BoardState) {
  const mode = (state.canvas ?? "desktop") as Mode;
  // "none" is nothing picked: the real pages below wear the site as built.
  const paletteId =
    state.palette && state.palette !== "none" ? state.palette : "today";
  const reach = (state.reach ?? "all") as ReachId;
  const cardMode = (state.card ?? "declared") as CardMode;
  const faint = (state.faint ?? "in") === "in";
  // ★ THE ACCENT IS A PAGE-WIDE SWITCH AND IT IS OFF BY DEFAULT (Will,
  // 2026-09-16). Off resolves to `ink`, which is the alias that ships, so every
  // renderer, the label and the paste all get the achromatic answer from this
  // one line and nothing downstream has to know the switch exists.
  const accentMode = (state.accent ?? "none") as AccentMode;

  const picked = resolvePalette(paletteId, accentMode);
  const pair = resolvePair(picked.pair, cardMode, faint);
  // The two the wipe joins, from the catalog's own A and B controls. The kit
  // resolves them again for the Compare itself; these are here so the labels
  // and the printed lightnesses above the canvas name the same two.
  const a = resolvePalette(state["compare-a"] ?? "ladder", accentMode);
  const b = resolvePalette(state["compare-b"] ?? "graphite", accentMode);

  const opts = {
    accent: picked.accent,
    reach,
    matRegister: picked.def.mat,
    faintOnDimmed: faint,
  };
  return {
    mode,
    desktop: mode === "desktop",
    def: picked.def,
    accent: picked.accent,
    declared: picked.declared,
    accentMode,
    accentOn: accentMode === "own",
    reach,
    cardMode,
    faint,
    pair,
    a: a.def,
    b: b.def,
    aPair: resolvePair(a.pair, cardMode, faint),
    bPair: resolvePair(b.pair, cardMode, faint),
    // The card that reads "Picked": none while nothing is picked, even though
    // the pages below wear Today (Will, 2026-09-16: a pick must be clearable).
    pickedId: state.palette && state.palette !== "none" ? state.palette : null,
    opts,
    label: applyLabel(pair, opts, picked.def.name),
    css: applyCss(pair, opts),
  };
}

/**
 * A stage under one palette's tokens.
 *
 * `extra` lands on the SAME element as the palette, which matters for the
 * accent on the slab: `.surface-ink` declares --brand itself, and a class rule
 * outranks a custom property inherited from a wrapper outside the stage, so an
 * accent set on an ancestor would silently not reach the leaf.
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
 * The five surfaces of one block, as a line. Read off the SAME strings the
 * canvas above it paints, so a number here cannot drift from a colour there,
 * and it sits UNDER the canvas rather than on it: under a wipe, two lines of
 * numbers one over the other would be sliced down the middle.
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
  } ${at("--muted")}, card ${at("--card")}, menu ${at("--popover")}`;
}

/**
 * ANY TWO PALETTES IN ONE CANVAS, WITH THE SEAM ON A SLIDER.
 *
 * ★ THE KIT RESOLVES A AND B; THIS RESOLVES THE PIXELS. `CompareTwo` reads the
 * two declared compare controls (set from the catalog's own cards) and refuses
 * to draw a thing against itself; what is left here is the one thing the kit
 * cannot know, which is what a palette LOOKS like: a 1:1 stage on the right
 * ground wearing that candidate's resolved tokens.
 *
 * ★ THE ROW IS THE SCROLLER, NOT EACH HALF. `Compare` stacks B over A
 * absolutely, so the two layers have to share one scroll box: two 1:1 Stages
 * each with their own `overflow-x-auto` would drift apart the moment a 1440
 * canvas was scrolled sideways in a narrower column, and the wipe would then be
 * joining two different parts of the page.
 */
function PaletteStack({
  id,
  ground,
  mode,
  height,
  tone,
  cardMode,
  faint,
}: {
  id: string;
  ground: BoardGround;
  mode: Mode;
  height: number;
  tone: "light" | "dark";
  cardMode: CardMode;
  faint: boolean;
}) {
  const { pair: raw } = resolvePalette(id);
  const pair = resolvePair(raw, cardMode, faint);
  return (
    <Stage mode={mode} ground={stageGround(ground)} height={height} fit="true">
      <div
        data-pal-swap
        className="h-full w-full overflow-hidden bg-background text-foreground"
        style={pairStyle(pair, ground)}
      >
        <SurfaceStack mode={mode} tone={tone} />
      </div>
    </Stage>
  );
}

/** The wipe's own scroll box, so both halves scroll as one canvas. */
function Canvas({ mode, children }: { mode: Mode; children: React.ReactNode }) {
  return (
    <div data-lab-bleed className="overflow-x-auto pb-2">
      <div style={{ width: CANVAS[mode].w }} className="shrink-0">
        {children}
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
        const s = read(state);
        return (
          <>
            {/* Which block stands on the site, and its clear. Absent until one
                stands, so the dock does not carry an empty slot. */}
            <AppliedBadge />
            <ApplyToSite
              block={{
                label: s.label,
                css: s.css,
                what: `Hands the whole site ${s.def.name} and every answer above.`,
                pages: "the home arc, pricing, help, contact, the dashboard",
              }}
            />
          </>
        );
      }}
      evidence={(id, state, api) => {
        const s = read(state);
        const { mode, desktop, pair, accent, reach, cardMode } = s;
        const h = (d: number, p: number) => (desktop ? d : p);
        const page = SITE_PAGES.find((p) => p.id === pageId) ?? SITE_PAGES[0];

        switch (id) {
          /* ── The catalog ────────────────────────────────────────────── */
          case "catalog":
            return (
              <>
                {/* The kit's grid and card. The only thing this board brings is
                    the PREVIEW, because only this board has palettes; 320 is
                    the narrowest a card can be with two real product fragments
                    in it side by side. */}
                <Catalog
                  spec={PALETTE}
                  state={state}
                  setState={api.setState}
                  minWidth={320}
                  render={(candidate) => (
                    <PalettePreview
                      id={candidate.id}
                      cardMode={cardMode}
                      faint={s.faint}
                      accentMode={s.accentMode}
                    />
                  )}
                />
                <CellLabel className="max-w-2xl">
                  Pick drives the whole page, A and B the wipe under it, Accent
                  the hue each card declares.
                </CellLabel>
              </>
            );

          /* ── Any two, side by side ──────────────────────────────────── */
          case "compare":
            return (
              <>
                <Labeled
                  name={`the room · ${s.a.name} against ${s.b.name}`}
                  note={`${s.a.name}: ${steps(s.aPair, "app-dark", "dark")}. ${s.b.name}: ${steps(s.bPair, "app-dark", "dark")}.`}
                >
                  <Canvas mode={mode}>
                    <CompareTwo
                      spec={PALETTE}
                      state={state}
                      mode="wipe"
                      differs="The dark ladder: the page, the panel, the card and the menu over it."
                      render={(candidate) => (
                        <PaletteStack
                          id={candidate.id}
                          ground="app-dark"
                          mode={mode}
                          height={h(560, 700)}
                          tone="dark"
                          cardMode={cardMode}
                          faint={s.faint}
                        />
                      )}
                    />
                  </Canvas>
                </Labeled>
                <Labeled
                  name={`the paper · ${s.a.name} against ${s.b.name}`}
                  note={`${s.a.name}: ${steps(s.aPair, "paper", "light")}. ${s.b.name}: ${steps(s.bPair, "paper", "light")}.`}
                >
                  <Canvas mode={mode}>
                    <CompareTwo
                      spec={PALETTE}
                      state={state}
                      mode="wipe"
                      differs="The light ladder: five surfaces inside 0.037 on Today, against a page a card can lift from."
                      render={(candidate) => (
                        <PaletteStack
                          id={candidate.id}
                          ground="paper"
                          mode={mode}
                          height={h(560, 700)}
                          tone="light"
                          cardMode={cardMode}
                          faint={s.faint}
                        />
                      )}
                    />
                  </Canvas>
                </Labeled>
              </>
            );

          /* ── The three calls left ───────────────────────────────────── */
          case "calls":
            return (
              <>
                {/* 1. The accent, by the job it does. */}
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
                    {`An accent is two token values reaching ${BRAND_HITS} utilities in ${BRAND_FILES} files.`}
                  </CellLabel>
                </div>
                <div className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-sm font-semibold">
                    {s.def.name} declares {s.declared.name}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {s.accentOn ? "worn" : "not worn"}
                    </span>
                  </p>
                  <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                    {s.def.pairs}
                  </p>
                </div>
                <Labeled
                  name={`${accentGround === "cinema" ? "the room" : "the paper"} · none beside ${s.def.name}'s own · reach: ${reach}`}
                  note="Every job twice: the achromatic site left, the declared hue right. A job outside the reach renders on near-black."
                >
                  <PairStage
                    pair={pair}
                    ground={accentGround}
                    mode={mode}
                    // Measured, not guessed: the wall's own content height at
                    // each canvas, plus a hair. A Stage clips, and round seven
                    // added a row while it was removing two columns.
                    height={h(1740, 2180)}
                  >
                    <AccentWall
                      mode={mode}
                      dark={accentGround === "cinema"}
                      accent={s.declared}
                      reach={reach}
                      on={s.accentOn}
                    />
                  </PairStage>
                </Labeled>

                {/* 2. The card over a photograph. */}
                <Labeled
                  name={`over a photograph, the room · ${s.def.name} · card ${cardMode}`}
                  note={`Left: as this palette declares it. Right: today's 62 percent, fixed. The ring is the elevation nobody wrote down, at ${RING_USES.faint} sites and ${RING_USES.onMedia} on media.`}
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

                {/* 3. The third text step. */}
                <Labeled
                  name={`the text steps, the paper · ${s.def.name} · ${s.faint ? "the third colour in" : "fading by hand"}`}
                >
                  <PairStage
                    pair={pair}
                    ground="paper"
                    mode={mode}
                    height={h(350, 840)}
                  >
                    <TextSteps mode={mode} faint={s.faint} />
                  </PairStage>
                </Labeled>
                <Labeled
                  name={`the text steps, the room · ${s.def.name} · ${s.faint ? "the third colour in" : "fading by hand"}`}
                >
                  <PairStage
                    pair={pair}
                    ground="cinema"
                    mode={mode}
                    height={h(350, 840)}
                  >
                    <TextSteps mode={mode} faint={s.faint} />
                  </PairStage>
                </Labeled>
                {/* The count is the same either way, because it is a
                    measurement; what changes is what the third line in each
                    canvas above is MADE of. */}
                <CellLabel className="max-w-2xl">
                  {FAINT_ALPHAS.map(
                    (a) => `${a.alpha} percent x${a.uses}`,
                  ).join(", ")}
                  {` = ${FAINT_USES} sites dimming by hand.`}
                </CellLabel>
              </>
            );

          /* ── The real pages ─────────────────────────────────────────── */
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
                  These three change this section only. A link clicked inside a
                  frame navigates that frame; Reload brings it back.
                </CellLabel>

                <CellLabel className="mt-0 max-w-2xl">{page.note}</CellLabel>
                <SiteFrames
                  page={page}
                  mode={mode}
                  split={split}
                  candidateCss={s.css}
                  candidateLabel={s.def.name}
                  reloadKey={reloadKey}
                />
              </>
            );

          /* ── The app, and the guest album ───────────────────────────── */
          case "app":
            return (
              <>
                <Labeled
                  name={`an event, the room · ${s.def.name}`}
                  note="The header, the stat band, the chips, the command strip, the review queue and the grid: four crushed dark surfaces at once."
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
                <Labeled name={`an event, the paper · ${s.def.name}`}>
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
                  name={`the dashboard, the room · ${s.def.name}`}
                  note="The filter chips, the storage track, the event cards, and a panel inside a card."
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
                <Labeled name={`the dashboard, the paper · ${s.def.name}`}>
                  <PairStage
                    pair={pair}
                    ground="app-light"
                    mode={mode}
                    height={h(820, 960)}
                  >
                    <AppDashboard mode={mode} />
                  </PairStage>
                </Labeled>
                <Labeled
                  name={`the guest album, the paper · ${s.def.name}`}
                  note="The well is identical in both modes, so only the chrome around it moves between these two."
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
                <Labeled name={`the guest album, the room · ${s.def.name}`}>
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

          /* ── The paste ──────────────────────────────────────────────── */
          case "paste": {
            const paste = [tokenBlock(pair), accentBlock(accent, reach)]
              .filter(Boolean)
              .join("\n\n");
            return (
              <>
                <ApplyToSite
                  block={{
                    label: s.label,
                    css: s.css,
                    what: `Hands the site ${s.def.name} and every answer above.`,
                    pages:
                      "the home arc, pricing, help, contact, the dashboard",
                  }}
                />
                <WalkPages pages={WALK_PAGES} />
                <CellLabel className="max-w-2xl">
                  {inWords(WALK_PAGES.length)} links, each opening with the
                  block standing, until Clear.
                </CellLabel>
                {/* The RESOLVED palette, which is the point: the sets, the card
                    call and the third text step are all already in `pair`, so
                    this block is the paste this dock's answers land and it
                    cannot drift from what every canvas above is rendering. The
                    mat is the one answer that is not here, and it cannot be: it
                    moves call sites rather than values. */}
                <Paste
                  label={`globals.css and marketing.css · ${s.def.name}`}
                  code={paste}
                  lines={14}
                />
                <ul className="max-w-2xl space-y-1 text-[11px] text-muted-foreground">
                  {s.faint ? (
                    <li>
                      theme.css needs{" "}
                      <span className="text-foreground">
                        --color-faint: var(--faint);
                      </span>{" "}
                      before a text-faint utility exists.
                    </li>
                  ) : (
                    <li>
                      Ruled OUT, so the block declares no{" "}
                      <span className="text-foreground">--faint</span> and the{" "}
                      {FAINT_USES} sites keep fading by hand.
                    </li>
                  )}
                  <li>
                    <span className="text-foreground">.surface-mat</span> is a
                    new class, and the {MAT_USES} sites writing bg-muted/N
                    become sections that carry it.
                  </li>
                </ul>
                <RealFloating
                  onApply={() => setCandidateCss(s.label, s.css)}
                  applied={applied?.label ?? null}
                />
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

"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useState, useSyncExternalStore } from "react";

import {
  BoardDock,
  BoardMeta,
  Stage,
  Toggle,
  clearCandidate,
  setCandidateCss,
  useTunerCandidate,
  type Mode,
} from "@/components/dev/board";

import { env } from "@/lib/env";

import { AccentWall } from "./call-sites";
import { ModelBlock } from "./model";
import { RealChapters, RealFloating, RealFooter, RealPricing } from "./real-ui";
import {
  ACCENTS,
  ACCENT_BY_ID,
  BRAND_FILES,
  BRAND_HITS,
  DARKS,
  DARK_BY_ID,
  DARK_LADDER,
  FAINT_ALPHAS,
  FAINT_USES,
  LIGHTS,
  LIGHT_BY_ID,
  LIGHT_LADDER,
  MAT_ALPHAS,
  MAT_HOVER_USES,
  MAT_USES,
  REACHES,
  RECOMMENDATION,
  RING_USES,
  WALK,
  accentBlock,
  accentStyle,
  alphaOf,
  applyCss,
  applyLabel,
  blockFor,
  keepsCinemaOverride,
  keepsSlabRegister,
  lOf,
  pairStyle,
  papersOf,
  resolvePair,
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
  type TokenMap,
} from "./registers";
import { InkLeaf, MarketingChapter, PanelBand, SurfaceStack } from "./sections";
import {
  AppDashboard,
  AppEvent,
  DepthRow,
  GroundsRow,
  GuestAlbum,
  PhotoCards,
  StateRow,
  TextSteps,
} from "./specimens";

/**
 * THE PALETTE BOARD, ROUND FOUR (the review wave, 2026-09-15). Bible 1 under
 * exploration.
 *
 * WHAT ROUND FOUR CHANGED, and why. Rounds one to three proved the ramp is
 * wrong and made a letter rulable from a walk. Will's review of round three
 * asked the question none of them had answered: "what's the difference between
 * cinema and ink?", and behind it, "didn't know if we were incorrectly
 * elevating a bad color system we were stuck in or if this is actually the best
 * way to do it". Three rounds had inherited the shape of the thing they were
 * judging.
 *
 *  1 THE MODEL IS THE FIRST BLOCK AND THE FIRST ASK. Two modes, two grounds
 *    inside each (dark: the room and the slab; light: the paper and the mat),
 *    and one media well that belongs to neither because it is always dark.
 *    Cinema is the room, not a third value; ink is the slab. Every candidate
 *    below is an answer INSIDE that model rather than a rival to it, and the
 *    five unnamed grounds plus a literal become four registers and a bed.
 *  2 THE DARK AND THE LIGHT ARE RULED SEPARATELY. Six dark sets, five light
 *    ones, thirty pairs, two switches in the dock, and one paste generated from
 *    whichever pair is up. This is what Will asked for, and it immediately paid
 *    for itself: see RECOMMENDATION in registers.ts, which is a pair no earlier
 *    round could have named.
 *  3 THE TEMPERATURE STOPPED BEING A SWITCH AND BECAME CANDIDATES. Round three
 *    demoted candidate C to a switch because it moved no step. A switch over
 *    the WHOLE system could only ask "warm or not" about both modes at once,
 *    which is the wrong question. Ember, Slate, Warm and Cool each move their
 *    own lightnesses as well as their cast, so each is a set. The transform
 *    that generates them is still C's published table at gain 1, pinned by
 *    registers.test.ts, so nothing Will was shown became unavailable.
 *  4 THE SURFACES ARE LIVE PRODUCTION SECTIONS, not replicas: the real
 *    marketing footer, the real pricing pair, four real home-arc chapters, and
 *    the real Dialog, DropdownMenu and Popover. See real-ui.tsx for the two
 *    mechanics that took (a class rule beats an inherited custom property; a
 *    portal leaves the stage).
 *  5 EVERY PAGE-WIDE SWITCH IS IN THE DOCK, so a pair can be flipped beside any
 *    row instead of scrolling back to the top, which was Will's note on every
 *    board this round. A control that changes one specimen stays beside it.
 *  6 THE ACCENT'S REACH FINALLY MOVES A PIXEL. It had been an ask for two
 *    rounds with no control anywhere, which is exactly the failure round three
 *    found in the faint switch and fixed. A job outside the reach renders on
 *    ink on the accent wall, which is what the ruling lands.
 *
 * Board mechanics worth knowing before editing:
 *  - a pair is applied as INLINE custom properties on a wrapper inside the
 *    Stage, never by swapping a class, so the Stage keeps the real `.dark` /
 *    `.surface-paper` class that the `dark:` variants in production components
 *    need. See pairStyle() in registers.ts.
 *  - breakpoints do not work inside a Stage (a 375 wide stage in a 1440
 *    viewport still matches `sm:`), so every hand-built section branches on
 *    `mode`; a real production section is judged with the prefixes it ships.
 *  - what the board renders and what the paste prints both read the RESOLVED
 *    pair, so the two can never disagree.
 */

const QUESTION =
  "What is the perfect ground system for a product with a dark marketing site, a light marketing body, a footer slab, an app with two modes and a guest surface that is the host's? Then, inside it: the achromatic ladder in both modes, the accent's role where there is no media, and the set-apart panel as a real register.";

/** The rows, in walking order; the nav under the dock renders these and each
 *  Row carries the matching id. */
const ROWS = [
  { n: "01", name: "the ladders" },
  { n: "02", name: "today beside the pair" },
  { n: "03", name: "the registers" },
  { n: "04", name: "the app" },
  { n: "05", name: "the guest album" },
  { n: "06", name: "the footer slab, live" },
  { n: "07", name: "the home arc, live" },
  { n: "08", name: "cards, live" },
  { n: "09", name: "the floating layer, live" },
  { n: "10", name: "depth" },
  { n: "11", name: "the card over a photograph" },
  { n: "12", name: "the mat" },
  { n: "13", name: "the text steps" },
  { n: "14", name: "the accent" },
  { n: "15", name: "the paste" },
];

/**
 * EIGHT, and every one takes one word.
 *
 * Seven in round three, and the arithmetic of the change is worth reading: the
 * model arrives as the first ask (+1), the ramp splits into a dark half and a
 * light half (+1), and the temperature leaves as an ask because it is four
 * candidates now rather than a switch over everything (-1). The reach stays,
 * but for the first time there is a control for it.
 */
const ASKS = [
  "The model: registers, or today's five grounds.",
  "The dark: today, ladder, one room, ember, slate or lift.",
  "The light: today, paper, bright, warm or cool.",
  "The accent: ink, blue, violet or flare.",
  "The accent's reach: all three, attention only, or identity only.",
  "The mat: a register, or the alphas.",
  "The missing step: faint in, or out.",
  "The dark card: declared, opaque, or the veil.",
];

/**
 * SIX, and every one of them is a ruling.
 *
 * A departure is a thing Will has to RULE on, not a thing the next agent has to
 * remember. Round three curated this list down from ten by moving the notes to
 * where they are read; round four keeps that discipline and rewrites three of
 * the six, because the register model changed what they say.
 */
const DEPARTURES = [
  "The model itself is the departure, and it is the first ask. Bible 16 counts four grounds. Counted by the job they do there are five plus a literal (cinema 0.110, the app 0.140, the leaf 0.155, paper 0.990, the contact card's panel, and media-lightbox.tsx:617's bg-black/90), and the model says there should be four registers and one well: cinema is the room, ink is the slab, the panel becomes the mat, and the well is the only surface that belongs to no mode. Ruling it in means a new class (.surface-mat) and a renamed idea, not a new palette.",
  "Four of the eleven sets carry a cast, which re-opens a decision globals.css records as closed: zero-chroma purity IS the brand point, and saturating the neutrals was consciously declined. Round three argued it as one switch over both modes. The split is what makes it answerable: the case for a warm room and the case for a warm page are not the same case, and this board's recommendation takes one and refuses the other.",
  "Round three cut candidate C on the grounds that it moved no step. Round four does not bring it back as a letter: the cast is a property four sets carry, each moving its own lightnesses too, and the transform at gain 1 still reproduces C's five published blocks token for token (registers.test.ts). Nothing Will was shown became unavailable, and warm on a derived set is one press rather than a fourth column.",
  "Lift argues that dark needs ONE register, not two. Every other set lifts the slab above the room because a 0.14 room dropped into paper reads as a hole; Lift starts the room at 0.195, where that stops being true, and declares the slab equal to it. It is the only candidate that contradicts the model's dark half, which is why it is on the board rather than in a comment.",
  "The accent has to be written into the slab or it never reaches the footer. Today the leaf declares --brand: var(--gallery-foreground), and a class rule outranks a value inherited from the page around it, so a hue ruled for the whole site would reach every surface in the product except the mark at the bottom of every page. The accent paste carries a third block, and every set's slab keeps a --brand line of its own. Row 06 shows the real footer with the mark on it.",
  "Round one's departure list said only the derived set kept the system's one translucent surface. That was wrong: a color-mix off the room is fully opaque, so every candidate retires the veil and none of them said so. Row 11 renders both answers over a photograph and the card ask makes it a ruling rather than a side effect.",
];

const ASSETS = [
  "Four hard cases inside the kit the media-kit track already asked for (its 36 masters replace all twelve stand-ins by id, so this is a line on that shot list, not a second delivery) · one high key (a white dress against a white wall), one low key (a dance floor lit by one lamp), one candle-warm, one stage-cool, four of the 36 at 1600 px long edge, landscape, one grade · replaces the four this board renders most (wedding-golden, party-balloons, concert-confetti, reception-table)",
  "A portrait pair for the guest masonry · two of the same 36 at 1600 px long edge, PORTRAIT, same grade · replaces the hand-set tile ratios in specimens.tsx (every stand-in in the kit but one is landscape, so the column flow the guest album actually ships is being faked)",
  "Why a palette board needs them, and more so this round: four of the eleven sets carry a cast, and a cast is only ever wrong against media that fights it. Every stand-in here is mid-key and warm, so the high-key end of Warm and the candle-lit end of Slate are both going untested",
];

/* ── Board furniture ────────────────────────────────────────────────────── */

/** A control with a VISIBLE name. Round three's walk found four unlabelled
 *  segmented controls in a row, two of them unreadable without the file open;
 *  the dock has more controls than that, so every one of them is named. */
function Knob({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {children}
    </span>
  );
}

function Row({
  n,
  name,
  reading,
  children,
}: {
  n: string;
  name: string;
  reading: string;
  children: React.ReactNode;
}) {
  return (
    // The id is the walk's index. The dock writes its own height to
    // scroll-padding-top on <html>, so an anchor lands under the dock rather
    // than beneath it; the scroll margin here is the extra breath above.
    <section id={`pal-${n}`} className="flex scroll-mt-6 flex-col gap-3">
      <div>
        <p className="text-sm font-semibold">
          <span className="mr-2 inline-flex size-5 items-center justify-center rounded-md bg-foreground text-[11px] text-background tabular-nums">
            {n}
          </span>
          {name}
        </p>
        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
          {reading}
        </p>
      </div>
      {children}
    </section>
  );
}

/**
 * A stage under one pair's tokens.
 *
 * `extra` lands on the SAME element as the pair, which matters for the accent
 * on the slab: `.surface-ink` declares --brand itself, and a class rule outranks
 * a custom property inherited from a wrapper outside the stage, so an accent set
 * on an ancestor would silently not reach the leaf. Inline on the element wins.
 *
 * `scope` gives the stage an id so a production component that carries a
 * register as a CLASS can be repainted by ScopedTokens (real-ui.tsx).
 */
function Frame({
  pair,
  ground,
  mode,
  height,
  label,
  extra,
  scope,
  children,
}: {
  pair: Pair;
  ground: BoardGround;
  mode: Mode;
  height: number;
  label: string;
  extra?: React.CSSProperties;
  scope?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <Stage mode={mode} ground={stageGround(ground)} height={height}>
        <div
          id={scope}
          data-pal-swap
          className="h-full w-full overflow-hidden bg-background text-foreground"
          style={{ ...pairStyle(pair, ground), ...extra }}
        >
          {children}
        </div>
      </Stage>
    </div>
  );
}

/**
 * TWO SETS IN ONE CANVAS (round three, kept).
 *
 * Where the question IS a step, a toggle makes the reader hold a lightness in
 * memory while the whole page repaints, which is the one thing an eye is worst
 * at. So the frame that carries the ladder argument shows today and the
 * candidate side by side inside a single Stage.
 *
 * Two wrappers, not two Stages: at 1:1 two stages would each demand a full
 * canvas of width. Inside one canvas each half declares its own token block and
 * paints its own `bg-background`, which is the whole trick: the ground class is
 * shared and correct for both.
 *
 * ★ A PAIR OF ONE SET IS NOT A COMPARISON. "Today" is one of the answers both
 * switches offer, and picking it on the side being judged makes the candidate
 * the same block as the left half: the frame then printed "Today" beside
 * "Today" and two children on one React key. It renders ONCE instead, with a
 * line under it saying which press brings the second half back.
 */
function PairFrame({
  todayPair,
  pair,
  ground,
  mode,
  height,
  label,
  tone,
  sameSet,
  hint,
}: {
  todayPair: Pair;
  pair: Pair;
  ground: BoardGround;
  mode: Mode;
  height: number;
  label: string;
  tone: "light" | "dark";
  sameSet: boolean;
  hint: string;
}) {
  const desktop = mode === "desktop";
  const halves: { key: string; name: string; pair: Pair }[] = sameSet
    ? [{ key: "today", name: "Today", pair: todayPair }]
    : [
        { key: "today", name: "Today", pair: todayPair },
        {
          key: "candidate",
          name: tone === "dark" ? pair.dark.name : pair.light.name,
          pair,
        },
      ];
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <Stage mode={mode} ground={stageGround(ground)} height={height}>
        <div className={`flex h-full w-full ${desktop ? "" : "flex-col"}`}>
          {halves.map((half, i) => (
            <div
              key={half.key}
              data-pal-swap
              className="relative min-w-0 flex-1 overflow-hidden bg-background text-foreground"
              style={pairStyle(half.pair, ground)}
            >
              <SurfaceStack
                mode={mode}
                paired={halves.length > 1}
                block={blockFor(half.pair, ground)}
                tone={tone}
              />
              <span className="absolute top-3 left-4 text-[11px] text-muted-foreground">
                {i === 0 ? "Today" : half.name}
              </span>
            </div>
          ))}
        </div>
      </Stage>
      {sameSet ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/* ── The ladders ────────────────────────────────────────────────────────── */

function Ladder({
  block,
  label,
  sub,
  tone,
}: {
  block: TokenMap;
  label: string;
  sub: string;
  tone: "light" | "dark";
}) {
  const spec = tone === "light" ? LIGHT_LADDER : DARK_LADDER;
  // Deltas are derived up front rather than tracked through the map: the React
  // compiler rejects a variable reassigned during render, and a step's distance
  // from the one above it is the whole reason this table exists.
  const rows = spec.map((row, i) => {
    const value = block[row.token];
    const l = value ? lOf(value, block) : null;
    const above = spec
      .slice(0, i)
      .map((r) => (block[r.token] ? lOf(block[r.token], block) : null))
      .filter((x): x is number => x !== null)
      .pop();
    return {
      ...row,
      value,
      l,
      alpha: value ? alphaOf(value) : null,
      delta: l !== null && above !== undefined ? l - above : null,
    };
  });
  return (
    // The real theme CLASS as well as the candidate's inline block, so the state
    // hues under the table are the ones that ship in this mode: they are not
    // part of any candidate, and a dark chip judged against a light
    // `--destructive` would be a lie.
    <div
      data-pal-swap
      className={`${tone === "dark" ? "dark" : "surface-paper"} rounded-lg border border-border bg-background p-3 text-foreground`}
      style={block as React.CSSProperties}
    >
      <p className="mb-2 truncate text-[11px] font-medium">
        {label}
        <span className="ml-1.5 font-normal text-muted-foreground">{sub}</span>
      </p>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.token} className="flex items-center gap-1.5">
            <span
              className="size-5 shrink-0 rounded-sm border border-border"
              style={{
                background: row.value ? `var(${row.token})` : "transparent",
                backgroundImage: row.value
                  ? undefined
                  : "repeating-linear-gradient(45deg, var(--muted-foreground) 0 1px, transparent 1px 4px)",
              }}
            />
            <span className="w-[86px] shrink-0 truncate text-[10px] text-muted-foreground">
              {row.role}
              {row.alpha !== null ? ` at ${Math.round(row.alpha * 100)}%` : ""}
            </span>
            <span className="w-10 shrink-0 text-[10px] tabular-nums">
              {row.l !== null ? row.l.toFixed(3) : "none"}
            </span>
            <span className="w-11 shrink-0 text-[10px] text-muted-foreground tabular-nums">
              {row.delta !== null
                ? `${row.delta > 0 ? "+" : ""}${row.delta.toFixed(3)}`
                : ""}
            </span>
          </div>
        ))}
      </div>
      {/* A set is not finished until the six colours it must never be confused
          with still read on it. */}
      <div className="mt-2.5 border-t border-border pt-2.5">
        <StateRow compact />
      </div>
    </div>
  );
}

/** Every value of a block plotted on the black-to-white line: the hole and the
 *  crush are geometry, not opinion, so they belong on a ruler. */
function Spectrum({
  name,
  blocks,
}: {
  name: string;
  blocks: { block: TokenMap; color: string }[];
}) {
  // A white veil (a dark border at 12 percent) has a lightness of 1 and no place
  // on a ruler of surfaces, so it is dropped rather than plotted at the far
  // right where it would read as a surface nobody can see.
  const plot = (block: TokenMap) =>
    Object.entries(block)
      .map(([token, value]) => ({
        token,
        l: lOf(value, block),
        veil: alphaOf(value) !== null && (lOf(value, block) ?? 0) >= 0.99,
      }))
      .filter(
        (t): t is { token: string; l: number; veil: boolean } =>
          t.l !== null && !t.veil,
      );
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium">{name}</p>
      {/* The ruler interpolates IN OKLAB, so a tick's position is its lightness.
          In sRGB the same gradient puts L 0.6 at the halfway mark and the whole
          reading would be a lie. */}
      <div
        className="relative h-7 rounded-sm"
        style={{
          background:
            "linear-gradient(to right in oklab, oklch(0 0 0), oklch(1 0 0))",
        }}
      >
        {blocks.map(({ block, color }, bi) =>
          plot(block).map((t) => (
            <span
              key={`${bi}-${t.token}`}
              title={`${t.token} ${t.l.toFixed(3)}`}
              className={
                bi === 0
                  ? "absolute top-0 h-3.5 w-px"
                  : "absolute bottom-0 h-3.5 w-px"
              }
              style={{ left: `${t.l * 100}%`, background: color }}
            />
          )),
        )}
      </div>
    </div>
  );
}

/** One half of the ruling, as a card: the set, its moves, its trade, and what
 *  picking it already decides so nothing is asked twice. */
function SetCard({
  kind,
  name,
  thesis,
  moves,
  trade,
  decides,
  notes,
}: {
  kind: string;
  name: string;
  thesis: string;
  moves: string[];
  trade: string;
  decides: [string, string][];
  notes: string[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div>
        <p className="text-[11px] text-muted-foreground">{kind}</p>
        <p className="text-sm font-semibold">{name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{thesis}</p>
      </div>
      <ul className="space-y-1">
        {moves.map((m) => (
          <li key={m} className="text-xs text-muted-foreground">
            {m}
          </li>
        ))}
        <li className="text-xs text-muted-foreground italic">
          The trade: {trade}
        </li>
      </ul>
      <div className="rounded-lg border border-border px-3 py-2.5">
        <p className="text-[11px] font-medium">
          What this word already decides
        </p>
        <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
          {decides.map(([label, line]) => (
            <li key={label}>
              <span className="text-foreground">{label}:</span> {line}
            </li>
          ))}
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── The board ──────────────────────────────────────────────────────────── */

/** The board writes its counts in words, so a derived number still reads like
 *  the sentence around it. */
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven"];
const inWords = (n: number) => WORDS[n] ?? String(n);

const subscribeNever = () => () => {};
const readLabKey = () => {
  const key = new URLSearchParams(window.location.search).get("key");
  return key ? `?key=${encodeURIComponent(key)}` : "";
};

const TICK_LIGHT = "oklch(0.62 0.22 330)";
const TICK_DARK = "oklch(0.72 0.15 252)";

export function PaletteBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [darkId, setDarkId] = useState<DarkId>(RECOMMENDATION.dark);
  const [lightId, setLightId] = useState<LightId>(RECOMMENDATION.light);
  const [accentId, setAccentId] = useState<AccentId>("flare");
  const [reach, setReach] = useState<ReachId>("all");
  const [accentGround, setAccentGround] = useState<"cinema" | "paper">(
    "cinema",
  );
  const [cardMode, setCardMode] = useState<CardMode>("declared");
  const [matRegister, setMatRegister] = useState(true);
  const [faintOnDimmed, setFaintOnDimmed] = useState(true);

  const declaredDark = DARK_BY_ID[darkId];
  const declaredLight = LIGHT_BY_ID[lightId];
  // ★ ONE PLACE ANSWERS THE DOCK. Every block this board renders goes through
  // here, so no row can show an answer the dock is not claiming and no switch in
  // the dock can be decorative. A row that resolved for itself is exactly how
  // the missing step went decorative in round two: it reached the paste and one
  // specimen and not the ladder, which is the row the ask is ABOUT.
  const resolve = (p: Pair) => resolvePair(p, cardMode, faintOnDimmed);
  const pair = resolve({ dark: declaredDark, light: declaredLight });
  const todayPair = resolve({
    dark: DARK_BY_ID.today,
    light: LIGHT_BY_ID.today,
  });
  const accent = ACCENT_BY_ID[accentId];
  const desktop = mode === "desktop";
  const h = (d: number, p: number) => (desktop ? d : p);

  // Row 02 is a PAIR only while there is a second set to pair. A ruling of
  // "today" on either side makes the candidate the left half on that ground.
  const darkPaired = darkId !== "today";
  const lightPaired = lightId !== "today";
  const pairHeight = (paired: boolean) => (paired ? h(440, 1060) : h(440, 545));

  // The lab key, read off THIS page rather than written into the file, so the
  // walk's links carry it without the board holding a secret.
  //
  // useSyncExternalStore rather than an effect: the server has no query string,
  // so the value has to arrive after hydration, and setting state inside an
  // effect to do that is a cascading render the lint rule refuses (rightly).
  const labKey = useSyncExternalStore(subscribeNever, readLabKey, () => "");
  const demoToken = env.NEXT_PUBLIC_DEMO_QR_TOKEN;
  const walk = WALK.filter((w) => !w.demo || demoToken);

  const applied = useTunerCandidate();
  const opts = { accent, reach, matRegister, faintOnDimmed };
  const apply = () =>
    setCandidateCss(applyLabel(pair, opts), applyCss(pair, opts));

  const paste = [tokenBlock(pair), accentBlock(accent, reach)]
    .filter(Boolean)
    .join("\n\n");

  const matL = lOf(
    declaredLight.mat["--background"] ?? "",
    declaredLight.paper,
  );
  const paperL = lOf(
    declaredLight.paper["--background"] ?? "",
    declaredLight.paper,
  );

  return (
    <div className="flex flex-col gap-10 py-4">
      {/* EVERY PAGE-WIDE SWITCH, ALWAYS ON SCREEN. Will's note: "the GUI control
          should be fixed so that variants can be toggled on different previews
          anywhere on the page for better back-and-forth comparisons. Having to
          scroll back to the top makes it very hard to review differences." The
          two candidate switches lead, because they are the ruling; the four
          sub-rulings follow; the viewport sits with them because it repaints
          every stage. The only control NOT here is the accent wall's own ground
          toggle, which changes one specimen. */}
      <BoardDock
        label="The palette board's controls"
        aside={
          <>
            <button
              type="button"
              onClick={apply}
              className="rounded-lg bg-foreground px-2.5 py-1 text-[11px] font-medium text-background transition-opacity hover:opacity-90"
            >
              Apply the pair
            </button>
            <button
              type="button"
              onClick={() => clearCandidate()}
              className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear
            </button>
          </>
        }
      >
        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2">
          <Knob label="Dark">
            <Toggle
              ariaLabel="The dark set"
              options={DARKS.map((d) => ({ id: d.id, label: d.label }))}
              value={darkId}
              onChange={setDarkId}
            />
          </Knob>
          <Knob label="Light">
            <Toggle
              ariaLabel="The light set"
              options={LIGHTS.map((l) => ({ id: l.id, label: l.label }))}
              value={lightId}
              onChange={setLightId}
            />
          </Knob>
          <Knob label="Accent">
            <Toggle
              ariaLabel="The accent"
              options={ACCENTS.map((a) => ({ id: a.id, label: a.label }))}
              value={accentId}
              onChange={setAccentId}
            />
          </Knob>
        </div>
        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2">
          <Knob label="Reach">
            <Toggle
              ariaLabel="The accent's reach"
              options={REACHES.map((r) => ({ id: r.id, label: r.label }))}
              value={reach}
              onChange={setReach}
            />
          </Knob>
          <Knob label="The mat">
            <Toggle
              ariaLabel="The mat"
              options={[
                { id: "register", label: "A register" },
                { id: "alphas", label: "The alphas" },
              ]}
              value={matRegister ? "register" : "alphas"}
              onChange={(v) => setMatRegister(v === "register")}
            />
          </Knob>
          <Knob label="The missing step">
            <Toggle
              ariaLabel="The missing step"
              options={[
                { id: "on", label: "In" },
                { id: "off", label: "Out" },
              ]}
              value={faintOnDimmed ? "on" : "off"}
              onChange={(v) => setFaintOnDimmed(v === "on")}
            />
          </Knob>
          <Knob label="The dark card">
            <Toggle
              ariaLabel="The dark card"
              options={[
                { id: "declared" as CardMode, label: "Declared" },
                { id: "opaque" as CardMode, label: "Opaque" },
                { id: "veil" as CardMode, label: "Veil 62%" },
              ]}
              value={cardMode}
              onChange={setCardMode}
            />
          </Knob>
          <Knob label="Viewport">
            <Toggle
              ariaLabel="Viewport"
              options={[
                { id: "desktop" as Mode, label: "Desktop 1440" },
                { id: "phone" as Mode, label: "Phone 375" },
              ]}
              value={mode}
              onChange={setMode}
            />
          </Knob>
        </div>
      </BoardDock>

      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
        <span className="text-foreground">How to rule from here.</span> Read the
        model first: it is the only ask whose answer changes what the other
        seven mean. Then set the dark and the light in the dock, independently,
        and read row 02 for the same frame under today and your pair. Rows 06 to
        09 are live production sections, so they are where a pair either holds
        or does not. Then press Apply and walk the {inWords(walk.length)} links
        at row 15. Eight asks at the foot, each one word.
      </p>

      {/* The walk, in one line. A board this long is only judgeable if a row can
          be reached and re-reached without scrolling past the other fourteen. */}
      <nav
        aria-label="The rows"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground"
      >
        <a
          href="#pal-model"
          className="transition-colors hover:text-foreground"
        >
          the model
        </a>
        {ROWS.map((r) => (
          <a
            key={r.n}
            href={`#pal-${r.n}`}
            className="transition-colors hover:text-foreground"
          >
            <span className="tabular-nums">{r.n}</span> {r.name}
          </a>
        ))}
      </nav>

      <ModelBlock pair={pair} />

      {/* THE TWO CANDIDATES, AND WHAT EACH WORD ALREADY DECIDES. */}
      <div className="grid gap-3 lg:grid-cols-2">
        <SetCard
          kind="The dark set"
          name={declaredDark.name}
          thesis={declaredDark.thesis}
          moves={declaredDark.moves}
          trade={declaredDark.trade}
          decides={[
            ["The rooms", declaredDark.decides.rooms],
            ["The well", declaredDark.decides.well],
          ]}
          notes={[
            keepsCinemaOverride(declaredDark)
              ? "It keeps the cinema override in marketing.css, so marketing and the app are two values."
              : "It deletes the cinema override in marketing.css: the room is cinema.",
            keepsSlabRegister(declaredDark)
              ? "It keeps the slab as a register of its own, lifted above the room."
              : "It collapses the slab into the room: one dark ground, no second register.",
          ]}
        />
        <SetCard
          kind="The light set"
          name={declaredLight.name}
          thesis={declaredLight.thesis}
          moves={declaredLight.moves}
          trade={declaredLight.trade}
          decides={[["The mat", declaredLight.decides.mat]]}
          notes={[
            `The mat sits at ${matL === null ? "no value" : matL.toFixed(3)} under a page at ${paperL === null ? "no value" : paperL.toFixed(3)}, a step of ${
              matL === null || paperL === null
                ? "none"
                : (paperL - matL).toFixed(3)
            }.`,
          ]}
        />
      </div>

      <div className="rounded-lg border border-border bg-muted px-4 py-3">
        <p className="text-xs font-medium">
          If this board had to rule, it would rule{" "}
          {DARK_BY_ID[RECOMMENDATION.dark].label} on the dark side and{" "}
          {LIGHT_BY_ID[RECOMMENDATION.light].label} on the light one
        </p>
        <p className="mt-1.5 max-w-4xl text-xs text-muted-foreground">
          {RECOMMENDATION.why}
        </p>
      </div>

      <Row
        n="01"
        name="The ladders, where they are empty, and what has to survive on them"
        reading="Every value of each set on the black-to-white line, then the tables. The dark sets first, then the light ones. Today's shows the whole system at a glance, a crowd at each end and a 0.455 hole in the middle where 37 call sites reach for a step by dimming the one above it. Under each table, the six state hues on that set in that mode: a set is not finished until the colours it must never be confused with still read on it."
      >
        <div className="space-y-2.5">
          {DARKS.map((d) => {
            const p = resolve({ dark: d, light: declaredLight });
            return (
              <Spectrum
                key={d.id}
                name={`${d.name} · the room above, the slab below`}
                blocks={[
                  { block: p.dark.room, color: TICK_DARK },
                  { block: p.dark.slab, color: TICK_LIGHT },
                ]}
              />
            );
          })}
          {LIGHTS.map((li) => {
            const p = resolve({ dark: declaredDark, light: li });
            return (
              <Spectrum
                key={li.id}
                name={`${li.name} · the paper above, the mat below`}
                blocks={[
                  { block: p.light.paper, color: TICK_LIGHT },
                  {
                    block: { ...p.light.paper, ...p.light.mat },
                    color: TICK_DARK,
                  },
                ]}
              />
            );
          })}
        </div>
        {/* The board's OWN chrome keys off the real viewport, not the stage
            toggle: these tables are not inside a Stage, so a breakpoint is
            honest here, and six 77px columns at 375 is unreadable. */}
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DARKS.map((d) => {
            const p = resolve({ dark: d, light: declaredLight });
            return (
              <Ladder
                key={d.id}
                block={p.dark.room}
                label={d.label}
                sub="the room"
                tone="dark"
              />
            );
          })}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LIGHTS.map((li) => {
            const p = resolve({ dark: declaredDark, light: li });
            return (
              <Ladder
                key={li.id}
                block={p.light.paper}
                label={li.label}
                sub="the paper"
                tone="light"
              />
            );
          })}
        </div>
      </Row>

      <Row
        n="02"
        name="A menu over a card, today beside the pair"
        reading="The frame both halves are judged on, with today on the left and the selected set on the right, because a step of 0.02 is exactly the thing an eye cannot hold across a toggle press. The room first: today's is 0.14, card 0.21 at 62 percent, panel 0.245, menu 0.23, hover 0.25, which is five surfaces inside 0.11 with two of them the wrong way round. Then the same frame on paper, where today's five sit inside 0.037 and a card is its hairline and nothing else. The numbers under each half are that half's own."
      >
        <PairFrame
          todayPair={todayPair}
          pair={pair}
          ground="app-dark"
          mode={mode}
          height={pairHeight(darkPaired)}
          tone="dark"
          sameSet={!darkPaired}
          label={
            darkPaired
              ? `the stack, the room · today beside ${pair.dark.label}`
              : "the stack, the room · today, with no candidate beside it"
          }
          hint="The dark set is Today, so both halves would be the same block. Pick any other dark in the dock for the pair."
        />
        <PairFrame
          todayPair={todayPair}
          pair={pair}
          ground="app-light"
          mode={mode}
          height={pairHeight(lightPaired)}
          tone="light"
          sameSet={!lightPaired}
          label={
            lightPaired
              ? `the stack, the paper · today beside ${pair.light.label}`
              : "the stack, the paper · today, with no candidate beside it"
          }
          hint="The light set is Today, so both halves would be the same block. Pick any other light in the dock for the pair."
        />
      </Row>

      <Row
        n="03"
        name="The registers, counted by the job they do"
        reading="The model's claim, rendered. Three surfaces that all read as the dark one and want different things: the lightbox backdrop (a literal black, not a token at all), the media well, and the slab. On paper, because the slab's whole job is to sit on a light page. Then every set's four dark grounds and every set's two light ones, with their lightnesses printed, because an eye cannot see 0.015 on an unlabelled swatch."
      >
        <Frame
          pair={pair}
          ground="paper"
          mode={mode}
          height={h(560, 1240)}
          label={`paper · ${pair.dark.label} dark, ${pair.light.label} light`}
        >
          <GroundsRow mode={mode} pair={pair} />
        </Frame>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {DARKS.map((d) => {
            const set = resolve({ dark: d, light: declaredLight }).dark;
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
            const set = resolve({ dark: declaredDark, light: li }).light;
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
      </Row>

      <Row
        n="04"
        name="The host app, in both modes"
        reading="The densest chrome in the product: an event page's header, its stat band and config chips, the command strip on the panel, the review queue, the grid; then the dashboard with the real filter chips, the storage track, the real event cards and a panel inside a card. Four crushed dark surfaces are visible here at once, and Will's note opens the app's UI to this lane, so judge the layout as well as the colour."
      >
        <div className="flex flex-col gap-4">
          <Frame
            pair={pair}
            ground="app-dark"
            mode={mode}
            height={h(1090, 780)}
            label={`an event, the room · ${pair.dark.label}`}
          >
            <AppEvent mode={mode} />
          </Frame>
          <Frame
            pair={pair}
            ground="app-light"
            mode={mode}
            height={h(1090, 780)}
            label={`an event, the paper · ${pair.light.label}`}
          >
            <AppEvent mode={mode} />
          </Frame>
          <Frame
            pair={pair}
            ground="app-dark"
            mode={mode}
            height={h(820, 960)}
            label={`the dashboard, the room · ${pair.dark.label}`}
          >
            <AppDashboard mode={mode} />
          </Frame>
          <Frame
            pair={pair}
            ground="app-light"
            mode={mode}
            height={h(820, 960)}
            label={`the dashboard, the paper · ${pair.light.label}`}
          >
            <AppDashboard mode={mode} />
          </Frame>
        </div>
      </Row>

      <Row
        n="05"
        name="The guest album, on the well"
        reading="The surface every guest sees, and the one the well exists for: the masonry at 3px gaps and 3px tile radius, one tile still uploading, one well with nothing in it yet. The well is identical in both modes by design, so the only thing that moves between these two frames is the chrome around it, which is the model's claim about the well made visible."
      >
        <div className="flex flex-col gap-4">
          <Frame
            pair={pair}
            ground="app-light"
            mode={mode}
            height={h(960, 900)}
            label={`the guest album, the paper · ${pair.light.label}`}
          >
            <GuestAlbum mode={mode} />
          </Frame>
          <Frame
            pair={pair}
            ground="app-dark"
            mode={mode}
            height={h(960, 900)}
            label={`the guest album, the room · ${pair.dark.label}`}
          >
            <GuestAlbum mode={mode} />
          </Frame>
        </div>
      </Row>

      <Row
        n="06"
        name="The footer slab, the real one"
        reading="The production MarketingFooter, imported from the file the site renders, on a paper page: the case the slab register exists for. It carries .surface-ink on its own root, and a class rule beats an inherited custom property, so the pair's slab block is written into this stage with the real selector (real-ui.tsx). The accent is written into the slab too, which is why the mark at the bottom carries it. Under it, the hand-built leaf, because it hosts a Card and a menu and those are the two things an incomplete slab actually breaks: on Today they render near white on a dark ground."
      >
        <Frame
          pair={pair}
          ground="ink"
          mode={mode}
          height={h(900, 1500)}
          label={`the real footer on a paper page · ${pair.dark.label} slab · ${accent.label}`}
          extra={accentStyle(accent, true)}
          scope="pal-footer-stage"
        >
          <RealFooter pair={pair} scope="pal-footer-stage" />
        </Frame>
        <Frame
          pair={pair}
          ground="ink"
          mode={mode}
          height={h(610, 1120)}
          label={`the slab hosting a card and a menu · ${pair.dark.label} · ${accent.label}`}
          extra={accentStyle(accent, true)}
        >
          <InkLeaf mode={mode} complete={darkId !== "today"} />
        </Frame>
      </Row>

      <Row
        n="07"
        name="The home arc, four real chapters"
        reading="Four production sections from the home arc, in one canvas, on the room and then on the paper. They are the quiet ones on purpose: a chapter with a photograph is carried by the photograph, and the question this board asks is what a section looks like when there is no media to carry it, which is the case rule 1 was rewritten for. These are live components, so what you are reading is the real type, the real rhythm and the real reveal grammar."
      >
        <div className="flex flex-col gap-4">
          <Frame
            pair={pair}
            ground="cinema"
            mode={mode}
            height={h(2050, 2450)}
            label={`the room · ${pair.dark.label}`}
          >
            <RealChapters />
          </Frame>
          <Frame
            pair={pair}
            ground="paper"
            mode={mode}
            height={h(2050, 2450)}
            label={`the paper · ${pair.light.label}`}
          >
            <RealChapters />
          </Frame>
        </div>
      </Row>

      <Row
        n="08"
        name="Cards, the real ones, on the paper and on the mat"
        reading="The production pricing pair: two cards, one featured with a beam, a price pop and a real checkout button. It is the densest card in the product and the place a card-versus-page step is most visible. First on the paper, then on the MAT, which is the model's new register and the ground a pricing band actually wants. The hand-built trio under them keeps the no-photograph case on the room."
      >
        <div className="flex flex-col gap-4">
          <Frame
            pair={pair}
            ground="paper"
            mode={mode}
            height={h(900, 1560)}
            label={`the real pricing cards, the paper · ${pair.light.label}`}
          >
            <RealPricing mode={mode} />
          </Frame>
          <Frame
            pair={pair}
            ground="mat"
            mode={mode}
            height={h(900, 1560)}
            label={`the real pricing cards, the mat · ${pair.light.label}`}
          >
            <RealPricing mode={mode} />
          </Frame>
          <Frame
            pair={pair}
            ground="cinema"
            mode={mode}
            height={h(800, 1220)}
            label={`three chapter cards, the room · ${pair.dark.label}`}
          >
            <MarketingChapter mode={mode} />
          </Frame>
        </div>
      </Row>

      <Row
        n="09"
        name="The floating layer, the real dialog, menu and popover"
        reading="The production Dialog, DropdownMenu and Popover. They portal to the body, which is outside every stage, so they cannot be painted by a canvas at all: each button applies the pair to this page first and then opens, which is exactly what a menu in production is painted by. This is the one place a set with no card step still has to work, because a floating surface has nothing but --popover, the ring and --shadow-float to separate it from the page."
      >
        <RealFloating onApply={apply} applied={applied?.label ?? null} />
      </Row>

      <Row
        n="10"
        name="Depth with the set"
        reading="A shadow has to be darker than what it falls on, so a cue and a step fail together. The light exploration's proposed family (lift on two overlapping photographs, float on a menu over a card) plus the ring nobody wrote down, rendered on this pair's grounds. These values are not in this board's paste: depth is that track's lane."
      >
        <div className="flex flex-col gap-4">
          <Frame
            pair={pair}
            ground="app-dark"
            mode={mode}
            height={h(465, 875)}
            label={`the cues, the room · ${pair.dark.label}`}
          >
            <DepthRow mode={mode} />
          </Frame>
          <Frame
            pair={pair}
            ground="app-light"
            mode={mode}
            height={h(465, 875)}
            label={`the cues, the paper · ${pair.light.label}`}
          >
            <DepthRow mode={mode} />
          </Frame>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {`The ring is the elevation system nobody wrote down, measured: ring-foreground/5 at ${RING_USES.faint} sites, ring-foreground/10 at ${RING_USES.firm}, ring-white/70 at ${RING_USES.onMedia} on media.`}
        </p>
      </Row>

      <Row
        n="11"
        name="The card over a photograph: opaque, or the veil"
        reading="Today ships exactly one translucent surface in the whole system and no document says so. Left: the card as this dark set declares it, under the card switch in the dock. Right: today's 62 percent, fixed, so the difference is a look and not a footnote."
      >
        <Frame
          pair={pair}
          ground="app-dark"
          mode={mode}
          height={h(460, 470)}
          label={`over a photograph, the room · ${pair.dark.label} · card ${cardMode}`}
        >
          <PhotoCards mode={mode} />
        </Frame>
      </Row>

      <Row
        n="12"
        name="The mat, on its real sites"
        reading="The set-apart ground of bible 16, on the sites it ships on. Today it is --muted at six alphas, a token that also does hover, and on a 0.99 page 40 percent is a one percent step. The switch in the dock puts every one of those sites on the ruled MAT instead, which is the model's light half: a register with its own block rather than an alpha of something else. On the paper first, then on the room, because the app's dark panels wear the same utility."
      >
        {/* Measured, with the command that produced it in registers.ts. */}
        <p className="text-[11px] text-muted-foreground">
          {MAT_ALPHAS.map((a) => `${a.alpha} percent x${a.uses}`).join(", ")}
          {` = ${MAT_USES} panels, plus ${MAT_HOVER_USES} hover fills wearing the same utility, which the switch leaves alone.`}
        </p>
        <Frame
          pair={pair}
          ground="paper"
          mode={mode}
          height={h(575, 900)}
          label={`the paper · ${pair.light.label} · ${matRegister ? "the mat as a register" : "today's alphas"}`}
        >
          <PanelBand mode={mode} single={matRegister} />
        </Frame>
        <Frame
          pair={pair}
          ground="app-dark"
          mode={mode}
          height={h(575, 900)}
          label={`the room · ${pair.dark.label} · ${matRegister ? "the mat as a register" : "today's alphas"}`}
        >
          <PanelBand mode={mode} single={matRegister} />
        </Frame>
      </Row>

      <Row
        n="13"
        name="The text steps, in real copy"
        reading="Every text step with a real line at it, on the grounds type lands on: the page, a card, the panel. The hole in the light ladder is only a hole once you try to write the third line, and --faint is the step these sites are already compositing to by hand."
      >
        <div className="flex flex-col gap-4">
          <Frame
            pair={pair}
            ground="paper"
            mode={mode}
            height={h(350, 840)}
            label={`the paper · ${pair.light.label} · ${faintOnDimmed ? "faint in" : "faint out"}`}
          >
            <TextSteps mode={mode} faint={faintOnDimmed} />
          </Frame>
          <Frame
            pair={pair}
            ground="cinema"
            mode={mode}
            height={h(350, 840)}
            label={`the room · ${pair.dark.label} · ${faintOnDimmed ? "faint in" : "faint out"}`}
          >
            <TextSteps mode={mode} faint={faintOnDimmed} />
          </Frame>
        </div>
        {/* The count is the same either way, because it is a measurement; what
            changes is what the third line in each frame above is MADE of. */}
        <p className="text-[11px] text-muted-foreground">
          {FAINT_ALPHAS.map((a) => `${a.alpha} percent x${a.uses}`).join(", ")}
          {` = ${FAINT_USES} sites dimming the second step by hand, ${FAINT_ALPHAS[3].uses} of them at exactly the 70 percent --faint is. `}
          <span className="text-foreground">
            {faintOnDimmed
              ? "In: the third line is one token, so it is the same grey on the page, on a card and on the mat, and the ladders at row 01 have a rung at it."
              : "Out: the third line stays 70 percent of the second, so it composites against whatever is behind it and the grounds in each frame give different faints. The rung at row 01 is hatched, which is where today already is."}
          </span>
        </p>
      </Row>

      <Row
        n="14"
        name="The accent, by the job it does, at every hue at once"
        reading="Rule 1 gives the accent a mandate where there is no media, so the first question is not which hue but which job. Today one token does three: identity, attention, and standing in for a photograph. All four candidates render side by side on each job, with the state hues at the foot, because four hues cannot be ruled on from memory. The reach switch in the dock is new: a job outside the ruled reach renders on ink, which is what the ruling lands."
      >
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
          <p className="text-[11px] text-muted-foreground">
            {`This one stays beside its specimen: it changes this wall and nothing else. A hue ruling is two token values reaching ${BRAND_HITS} utilities in ${BRAND_FILES} files.`}
          </p>
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
        <Frame
          pair={pair}
          ground={accentGround}
          mode={mode}
          height={h(1480, 1800)}
          label={`${accentGround === "cinema" ? "the room" : "the paper"} · all four hues · reach: ${reach}`}
        >
          <AccentWall
            mode={mode}
            dark={accentGround === "cinema"}
            reach={reach}
          />
        </Frame>
      </Row>

      <Row
        n="15"
        name="The ruling, as a paste"
        reading="The selected pair as the block that lands in globals.css and marketing.css, with the card question, the missing step and the accent folded in exactly as the board is showing them. Both halves are here because both are ruled: the dark set writes .dark, .surface-ink and the well; the light set writes :root, .surface-paper and the new .surface-mat."
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={apply}
            className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] font-medium text-background transition-opacity hover:opacity-90"
          >
            Apply {pair.dark.label} and {pair.light.label} to the site
          </button>
          <button
            type="button"
            onClick={() => clearCandidate()}
            className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-secondary"
          >
            Clear
          </button>
          <span className="text-[11px] text-muted-foreground">
            {applied ? applied.label : "nothing applied"}
          </span>
        </div>
        {/* ★ THE WALK, CLICKABLE. The key comes from THIS page's own query
            string rather than being written into the file, so nothing here is a
            secret and a board opened without a key hands out URLs without one.
            Each opens in its own tab: the candidate lives in the browser, not in
            the page, so a new tab wears it and this board stays where it was. */}
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
          {walk.map((w) => {
            const href = w.demo ? `/e/${demoToken}` : w.href;
            return (
              <a
                key={w.href}
                href={`${href}${labKey}`}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col gap-0.5 text-[12px]"
              >
                <span className="font-medium underline decoration-border underline-offset-4 transition-colors group-hover:decoration-foreground">
                  {w.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {href} · {w.note}
                </span>
              </a>
            );
          })}
        </div>
        <p className="max-w-3xl text-[11px] text-muted-foreground">
          The block persists in this browser until Clear, and the tuner panel on
          any of those pages clears it too. The event page needs the signed-in
          host, so its link goes to the dashboard and the event is one click on.
        </p>
        {/* The paste's prerequisites, printed where the paste is rather than
            carried as departures: --faint is a new custom property and Tailwind
            only grows a `text-faint` utility once theme.css maps it, and
            .surface-mat is a new class nothing in production carries yet. */}
        <ul className="max-w-3xl space-y-1 text-[11px] text-muted-foreground">
          {faintOnDimmed ? (
            <li>
              theme.css needs{" "}
              <span className="text-foreground">
                --color-faint: var(--faint);
              </span>{" "}
              in its @theme inline block before a text-faint utility exists. The
              board reaches the token with an arbitrary value, so nothing here
              depends on that line landing first.
            </li>
          ) : (
            <li>
              The missing step is ruled OUT, so the block below declares no{" "}
              <span className="text-foreground">--faint</span> anywhere and
              theme.css needs nothing: the {FAINT_USES} sites keep compositing
              an alpha of the second step by hand.
            </li>
          )}
          <li>
            <span className="text-foreground">.surface-mat</span> is a new
            class. The token block lands with the paste; the {MAT_USES} sites
            that write bg-muted/N today become sections that carry the class,
            which is a mechanical follow-up rather than part of this ruling. The
            dock&apos;s mat switch emulates it on the walk with one rule.
          </li>
        </ul>
        {/* The RESOLVED pair, which is the point: the two sets, the dark card
            and the missing step are all already in `pair`, so this block is the
            paste this dock's answers land and it cannot drift from what every
            frame above is rendering. The mat switch is the one answer that is
            not here, and it cannot be: it moves call sites rather than values. */}
        <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/40 p-4 font-sans text-[11px] leading-relaxed whitespace-pre tabular-nums">
          {paste}
        </pre>
      </Row>

      {/* WHAT THIS BOARD TOOK FROM THE OTHER BOARDS (the wave rule: use what
          sharpens your board and say so). A panel rather than a departure,
          because none of it is a thing Will rules on. */}
      <div className="rounded-lg border border-border px-4 py-3">
        <p className="text-xs font-medium">From the other boards</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>
            The light exploration&apos;s proposed shadow family and its named
            ring (docs/specs/light.md) are rendered on the pair&apos;s grounds
            in row 10, so the ladder and the depth cue are judged together. They
            are not in this board&apos;s paste: that ruling lands in that lane.
          </li>
          <li>
            That board&apos;s handoff notes that every set here re-declares the
            shipped <span className="text-foreground">--shadow-float</span> zero
            on .surface-ink, which is a token its own ruling moves. Both pastes
            touch the same line, so they land in one pass. The zero stays here,
            because a slab that inherits the paper float is the bug the line was
            written for.
          </li>
          <li>
            The guest page is on the walk because launch-prep mounted the design
            island in the (guest) layout (fb395fe), the one shell line rounds
            two and three asked for. Round four&apos;s own shell ask is in the
            manifest.
          </li>
          <li>
            The media-kit track&apos;s shot list carries both of this
            board&apos;s asset asks, so they are lines on an existing delivery
            rather than a second one. The type, voice, rounding, floating and
            hero boards propose nothing that moves a colour token.
          </li>
        </ul>
      </div>

      <BoardMeta
        question={QUESTION}
        candidates={[
          ...DARKS.filter((d) => d.id !== "today").map((d) => ({
            name: `Dark, ${d.name}`,
            rationale: d.thesis,
          })),
          ...LIGHTS.filter((l) => l.id !== "today").map((l) => ({
            name: `Light, ${l.name}`,
            rationale: l.thesis,
          })),
        ]}
        asks={ASKS}
        departures={DEPARTURES}
        assets={ASSETS}
      />
    </div>
  );
}

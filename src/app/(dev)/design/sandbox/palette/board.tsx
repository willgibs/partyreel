"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useState, useSyncExternalStore } from "react";

import {
  BoardMeta,
  Stage,
  Toggle,
  clearCandidate,
  setCandidateCss,
  useTunerCandidate,
  type Ground,
  type Mode,
} from "@/components/dev/board";

import { env } from "@/lib/env";

import { AccentWall } from "./call-sites";
import {
  ACCENTS,
  ACCENT_BY_ID,
  BRAND_FILES,
  BRAND_HITS,
  DARK_LADDER,
  FAINT_ALPHAS,
  FAINT_USES,
  LIGHT_LADDER,
  PANEL_ALPHAS,
  PANEL_HOVER_USES,
  PANEL_USES,
  RAMPS,
  RAMP_BY_ID,
  RING_USES,
  TEMPERATURE,
  WALK,
  accentBlock,
  accentStyle,
  alphaOf,
  applyCss,
  applyLabel,
  lOf,
  rampStyle,
  resolveRamp,
  rooms,
  tokenBlock,
  type AccentId,
  type CardMode,
  type Ramp,
  type RampId,
  type Temperature,
} from "./ramps";
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
 * THE PALETTE BOARD, ROUND THREE (the review wave, 2026-09-14). Bible 1 under
 * exploration.
 *
 * WHAT ROUND THREE CHANGED, and why. Round two made the board a ruling surface;
 * round three walked it cold, the way Will will, and spent itself on the places
 * a stranger stumbles and on the asks he should not have to answer:
 *
 *  1 CANDIDATE C IS CUT, and no value it held is lost. Its own move list said
 *    the quiet part: "The spacing is A's exactly, so a ruling between A and C
 *    is a ruling on temperature alone and nothing else moves". A column that
 *    moves no step is a switch wearing a letter, so it became one (`warm()` in
 *    ramps.ts; temperature.test.ts pins warm(A) to C's published blocks token
 *    for token). The board gets a third of its width back, the ramp ask drops
 *    to three, and warm B (which could never be asked before) is one click.
 *  2 TWO ASKS WERE CONSEQUENCES, not rulings. "The dark grounds: a ladder or
 *    one room" and "the canvas and the ink slab: split or one" are both
 *    ANSWERED by the letter: A is a ladder with the canvas split out, B is one
 *    room with one dark. They are now a line under the candidate saying what
 *    the letter already decides, and the asks are down from eight to seven
 *    while gaining an answer (warm B) that could not be asked before.
 *  3 The flip stopped being a memory test where a STEP is the question. Row 12
 *    learned this for the accent in round two ("four hues cannot be ruled on
 *    from memory"); row 02 now puts today beside the candidate inside one
 *    canvas, which is also what the 1000px of empty ground beside that card
 *    was for.
 *  4 The numbers are re-measured, and two were wrong: the panel ships at 35
 *    sites, not 45, and the ring nobody wrote down is at 37, not 77. Every
 *    count now lives in ramps.ts beside the command that produced it.
 *  5 The walk is clickable, and it is seven pages rather than six: the pages
 *    with the lab key on the end were printed as prose, so ruling meant
 *    retyping URLs; they are links now, they carry this page's own key, and the
 *    guest page joined them when launch-prep mounted the design island in the
 *    (guest) layout (fb395fe), which is the one shell line rounds two and three
 *    both asked for. Nothing counts the pages in prose any more.
 *  6 The stale captions are gone (the ink leaf said "today this is near white"
 *    under a candidate that had just fixed it), the rooms strip prints its
 *    lightness instead of four black bars, and the stages that were clipping or
 *    running half empty were resized.
 *  7 The fix pass after the read-only review: row 02 cannot pair a set with
 *    itself any more (pressing Today, which is one of the three answers, made
 *    the candidate the left half and the frame argued with itself), the
 *    departures are the six Will must RULE on rather than ten with four notes
 *    in them, and the accent wall's toast stops clipping 8px past the phone
 *    stage.
 *
 * WHAT ROUND TWO CHANGED, and why. Round one proved with a ruler that the ramp
 * is wrong; Will's read was that a single round was not enough context for any
 * board to be ruled on from a walk. So that round stopped being a proof and
 * became a ruling surface:
 *
 *  1 A candidate leaves the board. Every candidate is offered as the paste its
 *    ruling would land, handed to the WHOLE site through the shell's
 *    setCandidateCss, with the pages to walk listed beside the buttons. Two of
 *    the asks (the panel, --faint) are utility classes rather than token
 *    values, so they ride along as optional rules and can be judged on the real
 *    /help and /contact rather than only on a stage.
 *  2 The judged surfaces widened to the ones the product is actually made of:
 *    the host event page's stat band and review queue, the dashboard, the guest
 *    album on the canvas, the footer leaf hosting a card and a menu, the text
 *    steps in real copy, the state hues under every ramp in both modes.
 *  3 Depth is judged WITH the ramp (docs/specs/light.md's shadow family and the
 *    ring), because a cue and a step fail together.
 *  4 The five-grounds finding got sharper and changed: the deepest surface in
 *    the product is a literal, not a token (media-lightbox.tsx:617's
 *    bg-black/90), so --gallery is the media WELL and the ink SLAB, and bible
 *    16's count is wrong in a different way than round one said.
 *  5 The accent is a comparison, not a memory test: all four hues at once, on
 *    every job, with the state hues in the same look.
 *  6 The asks now take one-word answers.
 *
 * Board mechanics worth knowing before editing:
 *  - a ramp is applied as INLINE custom properties on a wrapper inside the
 *    Stage, never by swapping a class, so the Stage keeps the real `.dark` /
 *    `.surface-paper` class that the `dark:` variants in production components
 *    need. See rampStyle() in ramps.ts.
 *  - breakpoints do not work inside a Stage (a 375 wide stage in a 1440
 *    viewport still matches `sm:`), so every section branches on `mode`.
 *  - the menu specimens are hand-placed: a real DropdownMenu portals to the
 *    body and would escape both the zoom and the token overrides.
 *  - what the board renders and what the paste prints both read the RESOLVED
 *    ramp (the card question folded in), so the two can never disagree.
 */

const QUESTION =
  "The achromatic ramp between black and white in both modes, the accent's role where there is no media, and the muted panel as a real register: what would the perfect version be if none of today's greys existed?";

/** The rows, in walking order; the nav under the control bar renders these and
 *  each Row carries the matching id. */
const ROWS = [
  { n: "01", name: "the ladder" },
  { n: "02", name: "the same frame, both ramps" },
  { n: "03", name: "the grounds" },
  { n: "04", name: "the app" },
  { n: "05", name: "the guest album" },
  { n: "06", name: "the ink leaf" },
  { n: "07", name: "depth" },
  { n: "08", name: "the card over a photograph" },
  { n: "09", name: "the panel" },
  { n: "10", name: "the text steps" },
  { n: "11", name: "a marketing chapter" },
  { n: "12", name: "the accent" },
  { n: "13", name: "the paste" },
];

/**
 * SEVEN, down from eight, and every one takes one word.
 *
 * Two of round two's asks were not rulings at all: the dark grounds and the
 * canvas-versus-slab question are both ANSWERED by the letter (A is a ladder
 * with the canvas split out and sent deeper, B is one room and one dark), so
 * asking them again invited a contradiction between the answer and the paste.
 * They are a line under the candidate now, printed as what the letter already
 * decides. The temperature takes one of the two freed slots, which is a trade
 * worth naming: it used to cost a whole candidate column and could only be
 * asked about one ramp.
 */
const ASKS = [
  "The ramp: today, A or B.",
  "The temperature: neutral, or warm.",
  "The accent: ink, blue, violet or flare.",
  "The accent's reach: all three jobs, attention only, or identity only.",
  "The panel: one token, or the alphas.",
  "The missing step: faint in, or out.",
  "The dark card: declared, opaque, or the veil.",
];

/**
 * SIX, and every one of them is a ruling.
 *
 * Round three curated this list the way it curated the asks. A departure is a
 * thing Will has to RULE on, not a thing the next agent has to remember, and
 * four of round two's ten were the second kind: the one line theme.css needs
 * before a text-faint utility exists, the light board's shadow values borrowed
 * for row 07, the fact that both candidates complete .surface-ink, and the
 * guest layout's missing design island. Each of those now sits where it is
 * actually read (row 13 beside the paste, row 07's own caption, row 06's, and
 * launch-prep, which mounted the island at fb395fe so the guest page joined the
 * walk), and the manifest carries the two that are the Orchestrator's to do.
 * What is left is six decisions, each of which changes what ships.
 */
const DEPARTURES = [
  "Round three cut candidate C, and no value it held is lost. C was A's ladder at a temperature, and its own move list said so: the spacing was A's exactly, so a ruling between A and C was a ruling on temperature alone. A column that moves no step is a switch wearing a letter, so it is a switch now, and the one question it could never answer (does B want warming too) is one click. warm(A) still produces C's five published blocks token for token, pinned by temperature.test.ts, with one correction recorded there: C left the dark ring cold while writing the ink ring warm, at the same job on the same ground.",
  "Round one's departure list said only candidate B kept the system's one translucent surface. That was wrong: B's card is a color-mix off the room, which is fully opaque, so every candidate retires the veil and none of them said so. Row 08 renders both answers over a photograph and the card ask makes it a ruling rather than a side effect.",
  "A finding against bible 16, sharpened and changed. Counted by the job it does, the deepest dark surface in the product is not a token at all: the lightbox paints its backdrop with a literal bg-black/90 (media-lightbox.tsx:617). What --gallery actually does is the media WELL (a tile before its image decodes, a coverless event card, the reel frame) and, through .surface-ink, the footer SLAB, and those two want opposite things. Rule 16 counts four grounds; there are at least six surfaces and one of them is a literal. Row 03.",
  "Warm re-opens a decision globals.css records as closed: zero-chroma purity IS the brand point, and saturating the neutrals was consciously declined. The switch is that decision re-argued at 0.002 to 0.008 chroma, on the board rather than in a comment, and now on whichever ramp is selected rather than on one of them.",
  "The accent has to be written into .surface-ink or it never reaches the footer. Today the leaf declares --brand: var(--gallery-foreground), and a class rule outranks a value inherited from the page around it, so a hue ruled for the whole site would reach every surface in the product except the mark that sits at the bottom of every page. The accent paste therefore carries a third block, and every candidate's ink map keeps a --brand line of its own so a ruling of ink alone cannot leave the leaf inheriting the PAPER ink onto a dark slab. Row 06 shows the mark on the leaf.",
  "B deletes the cinema override in marketing.css, the skin block's only surface value. The cinema-to-footer seam then belongs entirely to light, which is the light board's lane.",
];

const ASSETS = [
  "Four hard cases inside the kit the media-kit track already asked for (its 36 masters replace all twelve stand-ins by id, so this is a line on that shot list, not a second delivery) · one high key (a white dress against a white wall), one low key (a dance floor lit by one lamp), one candle-warm, one stage-cool, four of the 36 at 1600 px long edge, landscape, one grade · replaces the four this board renders most (wedding-golden, party-balloons, concert-confetti, reception-table)",
  "A portrait pair for the guest masonry · two of the same 36 at 1600 px long edge, PORTRAIT, same grade · replaces the hand-set tile ratios in specimens.tsx (every stand-in in the kit but one is landscape, so the column flow the guest album actually ships is being faked)",
  "Why a palette board needs them: a ramp is only ever wrong against media that fights it, and the stand-ins here are mid-key and warm, so the light end of every candidate is going untested",
];

/* ── Board furniture ────────────────────────────────────────────────────── */

/** A control with a VISIBLE name. Four unlabelled segmented controls in a row
 *  is a puzzle, and two of the four ("Today A B", "Declared Opaque Veil")
 *  are unreadable without the file open. */
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
    // The id and the scroll margin are the walk's index: the control bar is
    // sticky, so a jump that lands a heading at y=0 would land it UNDER the bar.
    <section id={`pal-${n}`} className="flex scroll-mt-32 flex-col gap-3">
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
 * A stage under one candidate's tokens.
 *
 * `extra` lands on the SAME element as the ramp, which matters for the accent
 * on ink: `.surface-ink` declares --brand itself, and a class rule outranks a
 * custom property inherited from a wrapper outside the stage, so an accent set
 * on an ancestor would silently not reach the leaf. Inline on the element wins.
 */
function Frame({
  ramp,
  ground,
  mode,
  height,
  label,
  extra,
  children,
}: {
  ramp: Ramp;
  ground: Ground;
  mode: Mode;
  height: number;
  label: string;
  extra?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <Stage mode={mode} ground={ground} height={height}>
        <div
          data-pal-swap
          className="h-full w-full overflow-hidden bg-background text-foreground"
          style={{ ...rampStyle(ramp, ground), ...extra }}
        >
          {children}
        </div>
      </Stage>
    </div>
  );
}

/**
 * TWO RAMPS IN ONE CANVAS (round three).
 *
 * Where the question IS a step, a toggle makes the reader hold a lightness in
 * memory while the whole page repaints, which is the one thing an eye is worst
 * at. So the frame that carries the dark-ramp argument shows today and the
 * candidate side by side inside a single Stage.
 *
 * Two wrappers, not two Stages: a Stage lays out at 1440 and zoom-fits to its
 * box, so two of them in a two-column grid would each be scaled to about a
 * third and the type would be unreadable. Inside one canvas each half declares
 * its own token block and paints its own `bg-background`, which is the whole
 * trick: the ground class (`.dark`) is shared and correct for both.
 */
function PairFrame({
  left,
  right,
  ground,
  mode,
  height,
  label,
  render,
}: {
  left: Ramp;
  right: Ramp;
  ground: Ground;
  mode: Mode;
  height: number;
  label: string;
  render: (ramp: Ramp, paired: boolean) => React.ReactNode;
}) {
  const desktop = mode === "desktop";
  // ★ A PAIR OF ONE SET IS NOT A COMPARISON. `today` is one of the three
  // answers the ramp toggle offers (ask 1), and pressing it makes the candidate
  // the same object as the left half: the frame then printed "Today" beside
  // "Today", the same five lightnesses under each, and two children on one key.
  // It renders ONCE instead, in the unpaired composition (a wider card and the
  // plain caption), with a line under it saying which press brings the second
  // half back. The row's own argument survives: today alone is exactly what a
  // ruling of "today" lands.
  const halves = left.id === right.id ? [left] : [left, right];
  const paired = halves.length > 1;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <Stage mode={mode} ground={ground} height={height}>
        <div className={`flex h-full w-full ${desktop ? "" : "flex-col"}`}>
          {halves.map((r, i) => (
            <div
              key={r.id}
              data-pal-swap
              className="relative min-w-0 flex-1 overflow-hidden bg-background text-foreground"
              style={rampStyle(r, ground)}
            >
              {render(r, paired)}
              <span className="absolute top-3 left-4 text-[11px] text-muted-foreground">
                {i === 0 ? "Today" : r.name}
              </span>
            </div>
          ))}
        </div>
      </Stage>
      {paired ? null : (
        <p className="text-[11px] text-muted-foreground">
          {`The ramp is set to ${left.label}, so the candidate and this half are the same set and there is nothing to set beside it. Press A or B in the bar above for the pair.`}
        </p>
      )}
    </div>
  );
}

/* ── The ladder ─────────────────────────────────────────────────────────── */

function Ladder({ ramp, tone }: { ramp: Ramp; tone: "light" | "dark" }) {
  const block = tone === "light" ? ramp.light : ramp.dark;
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
    // The real theme CLASS as well as the candidate's inline block, so the
    // state hues under the table are the ones that ship in this mode: they are
    // not part of any candidate, and a dark chip judged against a light
    // `--destructive` would be a lie.
    <div
      data-pal-swap
      className={`${tone === "dark" ? "dark" : "surface-paper"} rounded-lg border border-border bg-background p-3 text-foreground`}
      style={block as React.CSSProperties}
    >
      <p className="mb-2 text-[11px] font-medium">
        {ramp.label}
        <span className="ml-1.5 text-muted-foreground">
          {tone === "light" ? "light" : "dark"}
        </span>
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
      {/* Round two: the state row under every ramp in both modes. A ramp is not
          finished until the six colours it must never be confused with still
          read on it. */}
      <div className="mt-2.5 border-t border-border pt-2.5">
        <StateRow compact />
      </div>
    </div>
  );
}

/** Every value of one ramp plotted on the black-to-white line: the hole and the
 *  crush are geometry, not opinion, so they belong on a ruler. */
function Spectrum({ ramp }: { ramp: Ramp }) {
  // A white veil (a dark border at 12 percent) has a lightness of 1 and no
  // place on a ruler of surfaces, so it is dropped rather than plotted at the
  // far right where it would read as a surface nobody can see.
  const plot = (block: Record<string, string>) =>
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
  const light = plot(ramp.light);
  const dark = plot(ramp.dark);
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium">{ramp.name}</p>
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
        {light.map((t) => (
          <span
            key={`l-${t.token}`}
            title={`${t.token} ${t.l.toFixed(3)}`}
            className="absolute top-0 h-3.5 w-px bg-[oklch(0.62_0.22_330)]"
            style={{ left: `${t.l * 100}%` }}
          />
        ))}
        {dark.map((t) => (
          <span
            key={`d-${t.token}`}
            title={`${t.token} ${t.l.toFixed(3)}`}
            className="absolute bottom-0 h-3.5 w-px bg-[oklch(0.72_0.15_252)]"
            style={{ left: `${t.l * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── The board ──────────────────────────────────────────────────────────── */

/** The board writes its counts in words, so a derived number still reads like
 *  the sentence around it ("the seven links", beside "Seven asks"). */
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven"];
const inWords = (n: number) => WORDS[n] ?? String(n);

const subscribeNever = () => () => {};
const readLabKey = () => {
  const key = new URLSearchParams(window.location.search).get("key");
  return key ? `?key=${encodeURIComponent(key)}` : "";
};

export function PaletteBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [rampId, setRampId] = useState<RampId>("a");
  const [temperature, setTemperature] = useState<Temperature>("neutral");
  const [accentId, setAccentId] = useState<AccentId>("flare");
  const [accentGround, setAccentGround] = useState<"cinema" | "paper">(
    "cinema",
  );
  const [cardMode, setCardMode] = useState<CardMode>("declared");
  const [panelSingle, setPanelSingle] = useState(true);
  const [faintOnDimmed, setFaintOnDimmed] = useState(true);

  const declared = RAMP_BY_ID[rampId];
  // ★ ONE PLACE ANSWERS THE BAR. Every ramp this board renders goes through
  // here, so no row can show an answer the bar is not claiming and no switch in
  // the bar can be decorative. A row that called `resolveRamp` for itself is
  // exactly how the missing step went decorative: it reached the paste and row
  // 10 and not the ladder at row 01, which is the row the ask is ABOUT.
  const resolved = (r: Ramp) =>
    resolveRamp(r, cardMode, temperature, faintOnDimmed);
  const ramp = resolved(declared);
  // Today, resolved the same way, so a row that pairs the two is comparing two
  // ramps and not a ramp against an unanswered card question.
  const todayRamp = resolved(RAMP_BY_ID.today);
  // Row 02 is a PAIR only while there are two sets to pair. A ruling of "today"
  // is one of the three answers, and it makes the candidate the left half, so
  // the frame renders once and takes a single half's height and its own label.
  const pairedRow = rampId !== "today";
  const accent = ACCENT_BY_ID[accentId];
  const desktop = mode === "desktop";
  const h = (d: number, p: number) => (desktop ? d : p);
  // A phone pair stacks its two halves, so the unpaired frame is half as tall;
  // on desktop the halves sit side by side and the height does not move.
  const pairHeight = pairedRow ? h(440, 1060) : h(440, 545);
  const pairLabel = pairedRow
    ? `today beside ${ramp.label}`
    : "today, with no candidate beside it";

  // The lab key, read off THIS page rather than written into the file, so the
  // walk's links carry it without the board holding a secret.
  //
  // useSyncExternalStore rather than an effect: the server has no query string,
  // so the value has to arrive after hydration, and setting state inside an
  // effect to do that is a cascading render the lint rule refuses (rightly).
  // The subscribe is a no-op because the key cannot change without a
  // navigation, and the snapshot is a string, so React's identity check on it
  // is a value comparison and settles on the first read.
  const labKey = useSyncExternalStore(subscribeNever, readLabKey, () => "");
  // The demo event's token, so the walk's guest row is a real link. It is a
  // NEXT_PUBLIC value baked at build time, so it needs no hydration dance; when
  // no demo event is configured the row drops out rather than linking to /e/.
  const demoToken = env.NEXT_PUBLIC_DEMO_QR_TOKEN;
  // The walk's pages, counted from the list rather than written into the prose
  // in three places: round three's own finding was that a number quoted in more
  // than one file goes stale in one of them, and this one just did (the guest
  // page made six seven).
  const walk = WALK.filter((w) => !w.demo || demoToken);

  const applied = useTunerCandidate();
  const opts = {
    accent,
    panelOneToken: panelSingle,
    faintOnDimmed,
    temperature,
  };
  const apply = (id: RampId) => {
    const r = resolved(RAMP_BY_ID[id]);
    setCandidateCss(applyLabel(r, opts), applyCss(r, opts));
  };

  return (
    <div className="flex flex-col gap-10 py-4">
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
        <span className="text-foreground">How to rule from here.</span> Set the
        ramp and the switches in the bar, read row 01 for the ladder and row 02
        for the same frame under both, then put it on the real pages and walk
        the {inWords(walk.length)} links at row 13. Seven asks at the foot, each
        one word. The question, the departures and the asks are in the meta
        panel at the bottom; this page is the evidence for them.
      </p>

      {/* The control bar follows the walk: every stage below repaints from it,
          so it has to stay reachable at row 12 as well as row 01.

          ★ Round three labelled every group. A walk found four unlabelled
          segmented controls in a row, two of which ("Today A B", "Declared
          Opaque Veil 62%") mean nothing at all to someone who has not read the
          file, and one of which changes the answer to an ask. An aria-label is
          not a label: nobody reading this board is using a screen reader.

          ★ Every knob here repaints the board. The second fix pass found the
          faint switch was reaching the paste and nothing else, so its label
          was a claim the page did not honour; a control that names an ask has
          to move a pixel in the evidence for that ask. */}
      <div className="pal-walk-bar sticky top-0 z-20 -mx-4 flex flex-col gap-2.5 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Knob label="The ramp">
            <Toggle
              ariaLabel="The ramp"
              options={RAMPS.map((r) => ({ id: r.id, label: r.label }))}
              value={rampId}
              onChange={setRampId}
            />
          </Knob>
          <Knob label="Temperature">
            <Toggle
              ariaLabel="Temperature"
              options={[
                { id: "neutral" as Temperature, label: "Neutral" },
                { id: "warm" as Temperature, label: "Warm" },
              ]}
              value={temperature}
              onChange={setTemperature}
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
          <Knob label="The panel">
            <Toggle
              ariaLabel="The panel"
              options={[
                { id: "single", label: "One token" },
                { id: "alphas", label: "The alphas" },
              ]}
              value={panelSingle ? "single" : "alphas"}
              onChange={(v) => setPanelSingle(v === "single")}
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

        {/* APPLY TO THE SITE: the paste, worn by the real pages. Everything set
            above rides along, which is why the buttons sit under the switches
            rather than beside them. */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium">
            Put it on the real pages
          </span>
          {RAMPS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => apply(r.id)}
              className="rounded-lg border border-border px-2.5 py-1 text-[12px] font-medium transition-colors hover:bg-secondary"
            >
              {r.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => clearCandidate()}
            className="rounded-lg px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
          <span className="text-[11px] text-muted-foreground">
            {`then walk the ${inWords(walk.length)} pages at row 13.`}
          </span>
        </div>

        <p className="truncate text-[11px] text-muted-foreground">
          {applied ? (
            <>
              <span className="font-medium text-foreground">
                Applied: {applied.label}.
              </span>{" "}
              This page wears it too, so the board&apos;s own chrome is that
              candidate while each stage stays on the ramp toggle above.
            </>
          ) : (
            `Nothing applied yet. Everything below is a stage; the ${inWords(walk.length)} real pages are one click away at row 13.`
          )}
        </p>
      </div>

      {/* The walk, in one line. A board this long is only judgeable if a row can
          be reached and re-reached without scrolling past the other twelve. */}
      <nav
        aria-label="The rows"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground"
      >
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

      {/* THE CANDIDATE, AND WHAT ITS LETTER ALREADY DECIDES. Round two asked
          the dark grounds and the canvas-versus-slab question as two more asks;
          they are not asks, they are what A and B each answer, and printing
          them here removes the chance of a ruling that contradicts its own
          paste. */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm font-semibold">
            {declared.name}
            {temperature === "warm" ? (
              <span className="ml-2 font-normal text-muted-foreground">
                warm
              </span>
            ) : null}
          </p>
          <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
            {declared.thesis}
          </p>
          <ul className="mt-2.5 space-y-1">
            {declared.moves.map((m) => (
              <li key={m} className="text-xs text-muted-foreground">
                {m}
              </li>
            ))}
            <li className="text-xs text-muted-foreground italic">
              The trade: {declared.trade}
            </li>
          </ul>
          {temperature === "warm" ? (
            <div className="mt-3 border-t border-border pt-2.5">
              <p className="text-xs font-medium">{TEMPERATURE.name}</p>
              <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                {TEMPERATURE.thesis}
              </p>
              <ul className="mt-2 space-y-1">
                {TEMPERATURE.moves.map((m) => (
                  <li key={m} className="text-xs text-muted-foreground">
                    {m}
                  </li>
                ))}
                <li className="text-xs text-muted-foreground italic">
                  The trade: {TEMPERATURE.trade}
                </li>
              </ul>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-border px-4 py-3">
            <p className="text-xs font-medium">
              What the letter already decides
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              <li>
                <span className="text-foreground">The dark grounds:</span>{" "}
                {declared.decides.grounds}
              </li>
              <li>
                <span className="text-foreground">
                  The canvas and the ink slab:
                </span>{" "}
                {declared.decides.canvas}
              </li>
            </ul>
            <p className="mt-2 text-[11px] text-muted-foreground italic">
              Both were asks in round two. They are consequences, so answering
              them separately could only contradict the letter.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted px-4 py-3">
            <p className="text-xs font-medium">
              If this board had to rule, it would rule A
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              A is the only set where every specimen on this page improves and
              nothing regresses, and its one cost (a paper body at 0.977 instead
              of near white) is visible on rows 09 and 11. B is the better IDEA
              and the worse ramp today: one room is right, and it buys the
              tuning by flattening cinema into the app, which rows 03 and 11
              show as a chapter that has stopped being a room of its own.
            </p>
          </div>
        </div>
      </div>

      <Row
        n="01"
        name="The ladder, where it is empty, and what has to survive on it"
        reading="Every value of each set on the black-to-white line: light above, dark below. Today's shows the whole system at a glance, a crowd at each end and a 0.455 hole in the middle where 37 call sites reach for a step by dimming the one above it. Under each table, the six state hues on that ramp in that mode: a ramp is not finished until the colours it must never be confused with still read on it."
      >
        <div className="space-y-2.5">
          {RAMPS.map((r) => (
            <Spectrum key={r.id} ramp={resolved(r)} />
          ))}
        </div>
        {/* The board's OWN chrome keys off the real viewport, not the stage
            toggle: these tables are not inside a Stage, so a breakpoint is
            honest here, and four 77px columns at 375 is unreadable. */}
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RAMPS.map((r) => (
            <Ladder key={`${r.id}-light`} ramp={resolved(r)} tone="light" />
          ))}
          {RAMPS.map((r) => (
            <Ladder key={`${r.id}-dark`} ramp={resolved(r)} tone="dark" />
          ))}
        </div>
      </Row>

      <Row
        n="02"
        name="A menu over a card, today beside the candidate"
        reading="The frame both ramps are judged on, with today on the left and the candidate on the right, because a step of 0.02 is exactly the thing an eye cannot hold across a toggle press. Dark first: ground 0.14, card 0.21 at 62 percent, panel 0.245, menu 0.23, hover 0.25, which is five surfaces inside 0.11 with two of them the wrong way round. Then the same frame on paper, where the five sit inside 0.037 and a card is its hairline and nothing else. The numbers under each half are that half's own, and with the ramp set to today the frame renders once, because a ruling of today is this half with nothing beside it."
      >
        {/* ★ THE PAIR. Round two learned this for the accent ("four hues cannot
            be ruled on from memory") and left every surface row on a toggle. A
            LIGHTNESS STEP is the harder memory test of the two, so the frame
            that carries the whole dark-ramp argument shows both answers at
            once. One Stage, two token wrappers: the ground class is shared (it
            is the same .dark either way) and each half paints its own
            --background, which is the only honest way to put two grounds in one
            canvas. */}
        <PairFrame
          left={todayRamp}
          right={ramp}
          ground="app-dark"
          mode={mode}
          height={pairHeight}
          label={`the stack, dark · ${pairLabel}`}
          render={(r, paired) => (
            <SurfaceStack mode={mode} paired={paired} ramp={r} />
          )}
        />
        {/* The same proof on paper, because the light ramp fails the same way
            and the numbers are smaller: five surfaces inside 0.037, so a card
            is its hairline and nothing else. */}
        <PairFrame
          left={todayRamp}
          right={ramp}
          ground="app-light"
          mode={mode}
          height={pairHeight}
          label={`the stack, paper · ${pairLabel}`}
          render={(r, paired) => (
            <SurfaceStack mode={mode} paired={paired} ramp={r} tone="light" />
          )}
        />
      </Row>

      <Row
        n="03"
        name="The grounds, counted by the job they do"
        reading="Bible 16 names four. Counted by job there are more, and the deepest is not a token: the lightbox paints bg-black/90 as a literal. What --gallery actually does is the media well and, through .surface-ink, the footer slab, and those two want opposite things. On paper, because the slab's whole job is to sit on a light page."
      >
        <Frame
          ramp={ramp}
          ground="paper"
          mode={mode}
          height={h(560, 1240)}
          label={`paper · ${ramp.label}`}
        >
          <GroundsRow mode={mode} ramp={ramp} />
        </Frame>
        <p className="text-[11px] text-muted-foreground">
          The four dark values of each set, side by side: A answers a ladder
          with the canvas sent deeper than any room, B answers one room for all
          of them, today answers four numbers with no reason written down.
        </p>
        {/* ★ Round three prints the value on each room. Four near-black bars
            side by side is not a reading: the whole question here is whether
            0.11, 0.14 and 0.155 are three decisions or one accident, and an eye
            cannot see 0.015 of lightness on an unlabelled swatch. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {RAMPS.map((r) => {
            const set = resolved(r);
            return (
              <div key={r.id} className="space-y-1.5">
                <p className="text-[11px] font-medium">{set.label}</p>
                <div className="flex h-24 overflow-hidden rounded-lg border border-border">
                  {rooms(set).map((room) => {
                    const l = lOf(room.value, set.dark);
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
        </div>
      </Row>

      <Row
        n="04"
        name="The host app, in both modes"
        reading="The densest chrome in the product, and the composition round one never showed: an event page's header, its stat band and config chips, the command strip on the panel, the review queue, the grid; then the dashboard with the real filter chips, the storage track, the event cards and a panel inside a card. Four crushed dark surfaces are visible here at once."
      >
        <div className="flex flex-col gap-4">
          <Frame
            ramp={ramp}
            ground="app-dark"
            mode={mode}
            height={h(1090, 780)}
            label={`an event, dark · ${ramp.label}`}
          >
            <AppEvent mode={mode} />
          </Frame>
          <Frame
            ramp={ramp}
            ground="app-light"
            mode={mode}
            height={h(1090, 780)}
            label={`an event, light · ${ramp.label}`}
          >
            <AppEvent mode={mode} />
          </Frame>
          <Frame
            ramp={ramp}
            ground="app-dark"
            mode={mode}
            height={h(820, 960)}
            label={`the dashboard, dark · ${ramp.label}`}
          >
            <AppDashboard mode={mode} />
          </Frame>
          <Frame
            ramp={ramp}
            ground="app-light"
            mode={mode}
            height={h(820, 960)}
            label={`the dashboard, light · ${ramp.label}`}
          >
            <AppDashboard mode={mode} />
          </Frame>
        </div>
      </Row>

      <Row
        n="05"
        name="The guest album, on the canvas"
        reading="The surface every guest sees, and the one the canvas token is for: the masonry at 3px gaps and 3px tile radius, one tile still uploading, one well with nothing in it yet. The canvas is identical in both modes by design, so the only thing that moves between these two frames is the chrome around it."
      >
        <div className="flex flex-col gap-4">
          <Frame
            ramp={ramp}
            ground="app-light"
            mode={mode}
            height={h(960, 900)}
            label={`the guest album, light · ${ramp.label}`}
          >
            <GuestAlbum mode={mode} />
          </Frame>
          <Frame
            ramp={ramp}
            ground="app-dark"
            mode={mode}
            height={h(960, 900)}
            label={`the guest album, dark · ${ramp.label}`}
          >
            <GuestAlbum mode={mode} />
          </Frame>
        </div>
      </Row>

      <Row
        n="06"
        name="The ink leaf, hosting a card and a menu"
        reading="The footer's set, rendered the way it ships: on a paper page, so the gap shows. Today .surface-ink declares no --card and no --popover, which is why on Today the card and the menu at the foot of this frame are near white on a dark slab; both candidates complete the set, and the two captions down there say which you are looking at. The accent selected below is written into the leaf, so the mark at the bottom of every page carries it too."
      >
        <Frame
          ramp={ramp}
          ground="ink"
          mode={mode}
          height={h(610, 1120)}
          label={`ink on a paper page · ${ramp.label} · ${accent.label}`}
          extra={accentStyle(accent, true)}
        >
          <InkLeaf mode={mode} complete={rampId !== "today"} />
        </Frame>
      </Row>

      <Row
        n="07"
        name="Depth with the ramp"
        reading="A shadow has to be darker than what it falls on, so a cue and a step fail together. The light exploration's proposed family (lift on two overlapping photographs, float on a menu over a card) plus the ring nobody wrote down, rendered on this candidate's grounds. These values are not in this board's paste: depth is that track's lane."
      >
        <div className="flex flex-col gap-4">
          <Frame
            ramp={ramp}
            ground="app-dark"
            mode={mode}
            height={h(465, 875)}
            label={`the cues, dark · ${ramp.label}`}
          >
            <DepthRow mode={mode} />
          </Frame>
          <Frame
            ramp={ramp}
            ground="app-light"
            mode={mode}
            height={h(465, 875)}
            label={`the cues, light · ${ramp.label}`}
          >
            <DepthRow mode={mode} />
          </Frame>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {`The ring is the elevation system nobody wrote down, measured: ring-foreground/5 at ${RING_USES.faint} sites, ring-foreground/10 at ${RING_USES.firm}, ring-white/70 at ${RING_USES.onMedia} on media. Round two said 77 for the first of those and the number is ${RING_USES.faint}.`}
        </p>
      </Row>

      <Row
        n="08"
        name="The card over a photograph: opaque, or the veil"
        reading="Today ships exactly one translucent surface in the whole system and no document says so. Round one's departure list said only B kept it; that was wrong, because B's card is a color-mix off the room, which is opaque. Left: the card as this candidate declares it, under the card toggle above. Right: today's 62 percent, fixed, so the difference is a look and not a footnote."
      >
        <Frame
          ramp={ramp}
          ground="app-dark"
          mode={mode}
          height={h(460, 470)}
          label={`over a photograph, dark · ${ramp.label} · card ${cardMode}`}
        >
          <PhotoCards mode={mode} />
        </Frame>
      </Row>

      <Row
        n="09"
        name="The panel, on its real sites"
        reading="The set-apart block of bible 16, on the sites it ships on. It ships at six alphas of --muted, a token that also does hover, and on paper 40 percent over 0.99 is a one percent step. The toggle in the bar swaps every one of them for the ruled ramp's --muted at full strength, on the board and on the walk."
      >
        {/* Measured, with the command that produced it in ramps.ts. Round two
            printed 45 here and the real number is {PANEL_USES}: a count nobody
            re-ran is a stand-in wearing a number's clothes. */}
        <p className="text-[11px] text-muted-foreground">
          {PANEL_ALPHAS.map((a) => `${a.alpha} percent x${a.uses}`).join(", ")}
          {` = ${PANEL_USES} panels, plus ${PANEL_HOVER_USES} hover fills wearing the same utility, which the switch leaves alone.`}
        </p>
        <Frame
          ramp={ramp}
          ground="paper"
          mode={mode}
          height={h(575, 900)}
          label={`paper · ${ramp.label} · ${panelSingle ? "one token" : "today's alphas"}`}
        >
          <PanelBand mode={mode} single={panelSingle} />
        </Frame>
        <Frame
          ramp={ramp}
          ground="app-dark"
          mode={mode}
          height={h(575, 900)}
          label={`the app, dark · ${ramp.label} · ${panelSingle ? "one token" : "today's alphas"}`}
        >
          <PanelBand mode={mode} single={panelSingle} />
        </Frame>
      </Row>

      <Row
        n="10"
        name="The text steps, in real copy"
        reading="Every text step with a real line at it, on the three grounds type lands on: the page, a card, the panel. The hole in the light ramp is only a hole once you try to write the third line, and --faint is the step these sites are already compositing to by hand."
      >
        <div className="flex flex-col gap-4">
          <Frame
            ramp={ramp}
            ground="paper"
            mode={mode}
            height={h(350, 840)}
            label={`paper · ${ramp.label} · ${faintOnDimmed ? "faint in" : "faint out"}`}
          >
            <TextSteps mode={mode} faint={faintOnDimmed} />
          </Frame>
          <Frame
            ramp={ramp}
            ground="cinema"
            mode={mode}
            height={h(350, 840)}
            label={`cinema · ${ramp.label} · ${faintOnDimmed ? "faint in" : "faint out"}`}
          >
            <TextSteps mode={mode} faint={faintOnDimmed} />
          </Frame>
        </div>
        {/* The count is the same either way, because it is a measurement; what
            changes is what the third line in each frame above is MADE of, and
            the switch in the bar is the thing that changes it. */}
        <p className="text-[11px] text-muted-foreground">
          {FAINT_ALPHAS.map((a) => `${a.alpha} percent x${a.uses}`).join(", ")}
          {` = ${FAINT_USES} sites dimming the second step by hand, ${FAINT_ALPHAS[3].uses} of them at exactly the 70 percent --faint is. `}
          <span className="text-foreground">
            {faintOnDimmed
              ? "In: the third line is one token, so it is the same grey on the page, on a card and on the panel, and the ladder at row 01 has a rung at it."
              : "Out: the third line stays 70 percent of the second, so it composites against whatever is behind it and the three grounds in each frame give three different faints. The rung at row 01 is hatched, which is where today already is."}
          </span>
        </p>
      </Row>

      <Row
        n="11"
        name="A marketing chapter, on cinema and on paper"
        reading="Three cards on each room: one with a photograph, one with none (the case rule 1 was rewritten for), one all type. On cinema, watch the card edge and whether the secondary button is a surface or a rumour. On paper, today the card is 0.007 above the page, so it is its hairline and nothing else."
      >
        <div className="flex flex-col gap-4">
          <Frame
            ramp={ramp}
            ground="cinema"
            mode={mode}
            height={h(800, 1220)}
            label={`cinema · ${ramp.label}`}
          >
            <MarketingChapter mode={mode} />
          </Frame>
          <Frame
            ramp={ramp}
            ground="paper"
            mode={mode}
            height={h(800, 1220)}
            label={`paper · ${ramp.label}`}
          >
            <MarketingChapter mode={mode} />
          </Frame>
        </div>
      </Row>

      <Row
        n="12"
        name="The accent, by the job it does, at every hue at once"
        reading="Rule 1 gives the accent a mandate where there is no media, so the first question is not which hue but which job. Today one token does three: identity, attention, and standing in for a photograph. All four candidates render side by side on each job, with the state hues at the foot, because four hues cannot be ruled on from memory."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            ariaLabel="Accent"
            options={ACCENTS.map((a) => ({ id: a.id, label: a.label }))}
            value={accentId}
            onChange={setAccentId}
          />
          <Toggle
            ariaLabel="Ground"
            options={[
              { id: "cinema" as const, label: "Cinema" },
              { id: "paper" as const, label: "Paper" },
            ]}
            value={accentGround}
            onChange={setAccentGround}
          />
          <p className="text-[11px] text-muted-foreground">
            {`The wall shows all four. The toggle picks the one that rides the walk and the paste, and a hue ruling is two token values reaching ${BRAND_HITS} utilities in ${BRAND_FILES} files.`}
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
        </div>
        <Frame
          ramp={ramp}
          ground={accentGround}
          mode={mode}
          height={h(1480, 1800)}
          label={`${accentGround} · ${ramp.label} · all four hues`}
        >
          <AccentWall mode={mode} dark={accentGround === "cinema"} />
        </Frame>
      </Row>

      <Row
        n="13"
        name="The ruling, as a paste"
        reading="The selected candidate as the block that lands in globals.css and marketing.css, with the card question, the temperature, the missing step and the accent folded in exactly as the board is showing them. The manifest carries the same blocks in writing (A and B neutral, the warm form of each, and what the card ruling lands per letter), so a ruling is a few words and the Orchestrator pastes rather than rewrites."
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => apply(rampId)}
            className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] font-medium text-background transition-opacity hover:opacity-90"
          >
            Apply {declared.label} to the site
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
        {/* ★ THE WALK, CLICKABLE (round three). These were printed as
            prose, so walking a candidate meant retyping every path and
            remembering to hang the lab key off each one. They are links now,
            and the key comes from THIS page's own query string rather than
            being written into the file, so nothing here is a secret and a
            board opened without a key hands out URLs without one. Each opens
            in its own tab: the candidate lives in the browser, not in the page,
            so a new tab wears it and this board stays where it was. */}
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
          The guest page is on the walk since launch-prep mounted the design
          island in the guest layout, which is the one shell line rounds two and
          three both asked for; row 05 keeps the album on the board beside it.
        </p>
        {/* The paste's one prerequisite, printed where the paste is rather than
            carried as a departure: --faint is a new custom property and Tailwind
            only grows a `text-faint` utility once theme.css maps it. The board
            itself reaches the token with an arbitrary value, so nothing here
            depends on that line landing first.

            It is conditional because the block below is: a ruling of "faint
            out" prints no --faint line in any of the three blocks (the ramp
            itself loses the token, `withoutFaint` in ramps.ts), and a
            prerequisite for a token nobody is declaring is noise. */}
        <p className="max-w-3xl text-[11px] text-muted-foreground">
          {faintOnDimmed ? (
            <>
              One line goes with it, for the Orchestrator rather than for the
              ruling: theme.css needs{" "}
              <span className="text-foreground">
                --color-faint: var(--faint);
              </span>{" "}
              in its @theme inline block before a text-faint utility exists.
            </>
          ) : (
            <>
              The missing step is ruled OUT, so the block below declares no{" "}
              <span className="text-foreground">--faint</span> in any of its
              three sets and theme.css needs nothing: the {FAINT_USES + " "}
              sites keep compositing an alpha of the second step by hand.
            </>
          )}
        </p>
        {/* The RESOLVED ramp, which is the point: the letter, the temperature,
            the dark card and the missing step are all already in `ramp`, so
            this block is the paste that this bar's answers land and it cannot
            drift from what every frame above is rendering. The panel switch is
            the one answer that is not here, and it cannot be: it deletes an
            alpha at six call sites rather than moving a value (the walk
            emulates it with a stylesheet, which is scaffolding and not
            shippable CSS). */}
        <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/40 p-4 font-sans text-[11px] leading-relaxed whitespace-pre tabular-nums">
          {[tokenBlock(ramp), accentBlock(accent)].filter(Boolean).join("\n\n")}
        </pre>
      </Row>

      {/* WHAT THIS BOARD TOOK FROM THE OTHER BOARDS (the wave rule: use what
          sharpens your board and say so). It is a panel rather than a
          departure, because none of it is a thing Will rules on: the
          departures are the six decisions and nothing else. */}
      <div className="rounded-lg border border-border px-4 py-3">
        <p className="text-xs font-medium">From the other boards</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>
            The light exploration&apos;s proposed shadow family and its named
            ring (docs/specs/light.md) are rendered on every candidate&apos;s
            grounds in row 07, so the ramp and the depth cue are judged
            together. They are not in this board&apos;s paste: that ruling lands
            in that lane.
          </li>
          <li>
            That board&apos;s round-three handoff notes that every candidate
            here re-declares the shipped{" "}
            <span className="text-foreground">--shadow-float</span> zero on
            .surface-ink, which is a token its own ruling moves. Both pastes
            touch the same line, so they land in one pass rather than
            overwriting each other. The zero stays here, because an ink leaf
            that inherits the paper float is the bug the line was written for.
          </li>
          <li>
            The guest page is on the walk because launch-prep mounted the design
            island in the (guest) layout (fb395fe), which is the one shell line
            this track asked for in rounds two and three. It wears a candidate
            now, proven on the demo album.
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
        candidates={RAMPS.filter((r) => r.id !== "today").map((r) => ({
          name: r.name,
          rationale: r.thesis,
        }))}
        asks={ASKS}
        departures={DEPARTURES}
        assets={ASSETS}
      />
    </div>
  );
}

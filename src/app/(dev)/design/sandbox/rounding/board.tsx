"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";

import {
  BoardMeta,
  clearCandidate,
  type Ground,
  type Mode,
  setCandidateCss,
  Stage,
  Toggle,
  useTunerCandidate,
} from "@/components/dev/board";
import { MotionTuner } from "@/components/dev/motion-tuner";
import {
  ROUNDING_TUNER_CONTROLS,
  type TunerControl,
} from "@/components/dev/motion-tuner-config";
import {
  clearTunerValues,
  getTunerServerSnapshot,
  getTunerSnapshot,
  setTunerValue,
  subscribeTuner,
  type TunerCandidate,
  type TunerOverrides,
} from "@/components/dev/tuner-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  ACTIONS,
  ACTION_SITES,
  type ActionRung,
  ANSWER,
  blockFor,
  blockLabel,
  LADDERS,
  ladderCss,
  type LadderId,
  px,
  STEP_CALL_SITES,
  STEPS,
  stepValue,
  SURFACES,
  type SurfaceCandidate,
} from "./candidates";
import {
  Composition,
  COMPOSITION_OPTIONS,
  type CompositionId,
} from "./compositions";
import {
  ActionRingSpecimen,
  ActionSpecimen,
  CellLabel,
  EntrySheetSpecimen,
  FloatSpecimen,
  Labeled,
  NestedSpecimen,
  Part,
  Proposal,
  StepSpecimen,
  SurfaceSpecimen,
  TileSpecimen,
} from "./specimens";

/**
 * THE ROUNDING BOARD, ROUND THREE (2026-09-14).
 *
 * Round two split six numbers into the three decisions they are and rendered
 * every comparison at 1:1. Round three is the walk Will is about to take,
 * taken first, and the cold walk found four things a stranger stumbles on.
 * All four are fixed here and all four were structural:
 *
 * 1. ★ THE TUNER PANEL COVERED THE EVIDENCE. The shell's panel is fixed at
 *    the bottom right, 320px wide, and it opens open: at 1440 it sat over the
 *    D and Live columns of part A, over both specimen columns of part D (the
 *    only two cells in that part that are not numbers), over the third action
 *    rung in part E and over the third phone in part F. Round two answered
 *    that in prose, in the fourth paragraph of the lede. The board measures
 *    the panel now and keeps every part clear of it, live, so closing the
 *    panel or sending it left widens the board again (usePanelInset below).
 *
 * 2. THE BOARD DID NOT SAY WHAT IT THOUGHT UNTIL YOU HAD SCROLLED SIX PARTS.
 *    Every part ended in a Proposal and nothing gathered them. The answer is
 *    the first thing on the board now: five one-word rulings, the two shapes
 *    that decide the first one at true size, and one button that puts the
 *    whole paste on the site.
 *
 * 3. THE LIVE COLUMN WAS A FIFTH COLUMN UNDER THE PANEL THAT DROVE IT. It
 *    cost a fifth of every comparison part, a whole 375 composition in part F,
 *    and it showed what the panel already shows. It is one band under the
 *    matrix now, with the tokens measured off the page.
 *
 * 4. A STAGE THAT GUESSES ITS HEIGHT IS A STAGE WITH A HOLE IN IT. Part B's
 *    marketing composition sat in 300px of empty ground. The stage takes its
 *    height from its content now (FitStage, the doctrine the brand-voice board
 *    wrote at the same review wave).
 *
 * What the round found, on the board rather than in a comment: the guest
 * gallery's gap is a literal, so the one grid every guest sees opens corner
 * holes the moment the tile goes above 3; the guest ENTRY SHEET, the first
 * surface any guest meets, takes its corner from the ACTION token at 1.4x, so
 * the action rung decides the shape of a floating sheet; --radius-action-lg
 * has exactly one call site; every marketing CTA is size lg forced to h-11,
 * which puts it at 0.33 x height while globals.css documents 0.4; and the top
 * two rungs of the derived ladder have three uses between them.
 */

const QUESTION =
  "The radius system as three decisions rather than six numbers: the surface family (A to D), the action rung (today, pill or quiet) and the derived ladder (stock or quarters), each judged at true size on the components that ship them, and applied to the real site for the walk.";

/** The four fixed candidates. The tuner's column is a band of its own now. */
const CANDIDATES = SURFACES.filter((c) => c.values);
const LIVE = SURFACES.find((c) => !c.values)!;

function overrideStyle(
  c: SurfaceCandidate,
  a: ActionRung,
): CSSProperties | undefined {
  if (!c.values) return undefined;
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

/* ── Keeping the board out from under the tuner panel ──────────────────── */

/**
 * ★ THE PANEL IS MEASURED, NOT ASSUMED (round three).
 *
 * The tuner is portalled to <body> as `[data-motion-tuner]`, fixed at the
 * bottom of one side, 320px wide when open and a pill when collapsed, and it
 * opens OPEN on the right. Round two grew the board into both page gutters
 * with a CSS expression that had to know the lab's sidebar width, and it was
 * wrong at every width its own QA did not sit at; worse, the widest parts then
 * reached UNDER the panel, so the board's own evidence was the thing hidden.
 *
 * This measures three real rectangles instead, once per layout change: the
 * board's own column, the viewport, and the panel. It writes two lengths the
 * sheet consumes (board.css), so a part can grow into the gutters and stop at
 * the panel, and a stage can give the panel its room back. Nothing here reads
 * a breakpoint or a sidebar width, so the shell can move either.
 *
 * No loop is possible: the vars change the width of blocks INSIDE the column,
 * never the column, and the right edge never passes the viewport, so no
 * scrollbar appears to change the viewport back.
 */
const PAGE_PAD = 12; // what stays between the block and whatever bounds it
const MIN_WIDE = 640; // a floor: below this a part scrolls rather than shrinks

/**
 * The box the board may grow into.
 *
 * ★ IT IS NOT THE VIEWPORT. The first cut of this measured the window and slid
 * the block 100px under the lab's sticky sidebar, which is exactly the failure
 * the CSS version made twice. It is not "the first ancestor that is wider"
 * either: that is the page's own px-4 wrapper, 32px of padding.
 *
 * The test that works without knowing anything about the shell is SYMMETRY.
 * Growing into a gutter is safe precisely while the layout is centred on the
 * board: every ancestor from the column up to the lab's content cell shares
 * the column's centre line, and the grid that adds the sidebar does not. So
 * climb while the centre holds and stop at the first ancestor that moves it.
 * Below the sidebar's breakpoint every ancestor is centred, and the climb ends
 * at the body, which is the right answer there too.
 */
function boundsOf(root: HTMLElement): DOMRect {
  let box = root.getBoundingClientRect();
  const centre = box.left + box.width / 2;
  let el: HTMLElement | null = root.parentElement;
  while (el) {
    const r = el.getBoundingClientRect();
    if (Math.abs(r.left + r.width / 2 - centre) > 1) break;
    box = r;
    if (el === document.body) break;
    el = el.parentElement;
  }
  return box;
}

function usePanelAwareWidth(): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const sync = () => {
      const vw = document.documentElement.clientWidth;
      const col = root.getBoundingClientRect();
      // ★ Do not write a width from a half-built layout. The lab wraps its
      // sidebar in a Suspense boundary, so for a moment during hydration the
      // content cell is the grid's FIRST column (232px) and the board measures
      // itself at 200. A value written then stood for several seconds until
      // something else nudged the observer, and the whole board sat at its
      // 640px floor while it did.
      if (col.width < 400 && vw >= 700) return;
      const box = boundsOf(root);
      // The panel eats room only when it is open, on the right, and beside the
      // board rather than over it: at 375 it is 320 of the window and the
      // answer is to collapse it, not to squeeze the board into 43px.
      const panel = document.querySelector<HTMLElement>("[data-motion-tuner]");
      const p = panel?.getBoundingClientRect();
      const onRight = !!p && p.left > vw / 2 && p.width > 120;
      const limit = Math.min(box.right, onRight ? p!.left : vw) - PAGE_PAD;

      const gutter = Math.max(0, (box.width - col.width) / 2 - PAGE_PAD);
      const growLeft = Math.max(
        0,
        Math.min(gutter, col.left - box.left - PAGE_PAD),
      );
      let growRight = Math.min(gutter, limit - col.right);
      if (col.width + growLeft + growRight < MIN_WIDE) {
        growRight = MIN_WIDE - col.width - growLeft;
      }
      root.style.setProperty("--rnd-grow-left", `${Math.round(growLeft)}px`);
      root.style.setProperty("--rnd-grow-right", `${Math.round(growRight)}px`);
    };

    sync();
    // The observer alone is not enough on the first paint: the settle that
    // follows hydration did not always reach it for several seconds.
    const frame = requestAnimationFrame(sync);
    const settle = window.setTimeout(sync, 300);
    document.fonts?.ready.then(sync).catch(() => {});

    const ro = new ResizeObserver(sync);
    ro.observe(root);
    const panel = document.querySelector<HTMLElement>("[data-motion-tuner]");
    // Open/collapse swaps the panel's child; the flip swaps its class.
    const mo = panel ? new MutationObserver(sync) : null;
    if (panel && mo) {
      ro.observe(panel);
      mo.observe(panel, { childList: true, attributes: true });
    }
    window.addEventListener("resize", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      ro.disconnect();
      mo?.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return ref;
}

/* ── A stage that takes its height from its content ────────────────────── */

/**
 * ★ A STAGE NEVER GUESSES ITS HEIGHT (the doctrine the brand-voice board wrote
 * at this review wave; this is that pattern in this lane). Round two passed
 * 980 and 900 as literals and part B's marketing composition sat in 300px of
 * empty ground, which on a board about SURFACES reads as a surface.
 *
 * offsetHeight, not a rect: the Stage fits the lab column with `zoom` and a
 * rect is in the zoomed frame while the height prop is not. The slack covers
 * two mechanical facts rather than the content: the stage is border-box, so
 * its 1px border comes out of the height it is handed, and the fractional zoom
 * rounds at the device pixel.
 */
const FIT_SLACK = 4;

function FitStage({
  mode,
  ground,
  swapKey,
  children,
}: {
  mode: Mode;
  ground: Ground;
  /** Anything that changes the content's height without changing the DOM. */
  swapKey?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () =>
      setHeight(
        Math.ceil(Math.max(el.offsetHeight, el.scrollHeight)) + FIT_SLACK,
      );
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener("resize", sync);
    document.fonts?.ready.then(sync).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [mode, swapKey]);

  return (
    <Stage mode={mode} ground={ground} height={height}>
      {/* flow-root so a child's margin cannot collapse out of the measured
          box; data-inview because marketing.css holds [data-mkt-reveal] at
          opacity 0 until an ancestor says it is in view, and a radius board
          has no business animating an entrance. */}
      <div ref={ref} className="flow-root" data-inview="true">
        {children}
      </div>
    </Stage>
  );
}

/* ── The live column's real numbers ────────────────────────────────────── */

const PROBES = [
  "--radius",
  "--radius-float",
  "--radius-tile",
  "--radius-action",
  "--radius-action-lg",
  "--radius-action-sm",
] as const;

type Live = Record<string, number> | null;

/**
 * What the tokens actually resolve to on <html> right now, and the probe that
 * measures them (the caller renders it; a measurement with nothing in the tree
 * is worse than no measurement).
 *
 * ★ MEASURED, NEVER PARSED. getComputedStyle hands a custom property back as
 * it was DECLARED ("0.125rem", "1rem"), so reading the variables would mean
 * re-implementing unit conversion and getting it wrong the first time someone
 * writes an em. A probe with `border-radius: var(--x)` resolves to used
 * pixels, so the live band prints the browser's answer rather than ours.
 */
function useLiveTokens(
  overrides: TunerOverrides,
  applied: TunerCandidate | null,
): { live: Live; probe: React.ReactNode } {
  const ref = useRef<HTMLDivElement | null>(null);
  const [live, setLive] = useState<Live>(null);

  useEffect(() => {
    const read = () => {
      const box = ref.current;
      if (!box) return;
      const next: Record<string, number> = {};
      PROBES.forEach((name, i) => {
        const el = box.children[i] as HTMLElement | undefined;
        if (el) {
          next[name] = parseFloat(getComputedStyle(el).borderTopLeftRadius);
        }
      });
      const gapEl = box.children[PROBES.length] as HTMLElement | undefined;
      if (gapEl) {
        next["--gap-gallery"] = parseFloat(getComputedStyle(gapEl).columnGap);
      }
      setLive(next);
    };
    read();
    // The tuner writes its inline values on <html> from its own effect; one
    // frame later is after it in every ordering reachable from here.
    const id = requestAnimationFrame(read);
    return () => cancelAnimationFrame(id);
  }, [overrides, applied]);

  const probe = (
    <div ref={ref} aria-hidden className="rnd-probe">
      {PROBES.map((name) => (
        <span key={name} style={{ borderRadius: `var(${name})` }} />
      ))}
      <span style={{ columnGap: "var(--gap-gallery)" }} />
    </div>
  );
  return { live, probe };
}

/* ── Part A's rows ─────────────────────────────────────────────────────── */

type Row = {
  token: string;
  label: string;
  note: string;
  cell: (c: SurfaceCandidate, live: Live, a: ActionRung) => React.ReactNode;
};

const ROWS: Row[] = [
  {
    token: "--radius",
    label: "Surfaces",
    note: "The base every derived step is a multiple of. 154 files carry one. Card is 1.4x of it, Input and every plate 1x.",
    cell: (c, live) => (
      <SurfaceSpecimen
        radius={c.values ? c.values.radius : (live?.["--radius"] ?? null)}
      />
    ),
  },
  {
    token: "--radius-float",
    label: "The floating layer",
    note: "Menus, popovers, dialogs, toasts. Rows sit in 4px of padding.",
    cell: (c, live) => (
      <FloatSpecimen
        float={c.values ? c.values.float : (live?.["--radius-float"] ?? null)}
      />
    ),
  },
  {
    token: "--radius-tile",
    label: "Media tiles",
    note: "Every gallery grid, with --gap-gallery pinned to it.",
    cell: (c, live) => (
      <TileSpecimen
        tile={c.values ? c.values.tile : (live?.["--radius-tile"] ?? null)}
        gap={c.values ? c.values.gap : (live?.["--gap-gallery"] ?? null)}
      />
    ),
  },
  {
    token: "--radius-action",
    label: "Actions",
    note: "The rung is the second axis, ruled in part E. Every column wears the rung the rail is set to.",
    cell: (c, live, a) => (
      <ActionSpecimen
        action={c.values ? a.values.action : (live?.["--radius-action"] ?? null)}
        sm={c.values ? a.values.sm : (live?.["--radius-action-sm"] ?? null)}
      />
    ),
  },
];

/** Every height an action ships at, and the token each one wears. h-10 and
 *  h-12 are here because the tokens are named for them and both are nearly
 *  empty in the product, which is half of part E's finding. */
const HEIGHTS: {
  label: string;
  where: string;
  px: number;
  token: string;
  sample: string;
  radius: (a: ActionRung) => number;
}[] = [
  {
    label: "h-8, the default",
    where: "every Button in the app, on --radius-action-sm",
    px: 32,
    token: "var(--radius-action-sm)",
    sample: "Add photos",
    radius: (a) => a.values.sm,
  },
  {
    label: "h-9, size lg",
    where: "0.9 x --radius-action",
    px: 36,
    token: "calc(var(--radius-action) * 0.9)",
    sample: "Share",
    radius: (a) => a.values.action * 0.9,
  },
  {
    label: "h-10",
    where: "--radius-action itself. The reel's buttons and the footer CTA",
    px: 40,
    token: "var(--radius-action)",
    sample: "Save to phone",
    radius: (a) => a.values.action,
  },
  {
    label: "h-11, the CTA",
    where: "size lg plus a className, in 26 files. Every marketing CTA",
    px: 44,
    token: "calc(var(--radius-action) * 0.9)",
    sample: "Create your event",
    radius: (a) => a.values.action * 0.9,
  },
  {
    label: "h-12",
    where: "--radius-action-lg. One call site, the reel builder, at h-11",
    px: 48,
    token: "var(--radius-action-lg)",
    sample: "Publish the reel",
    radius: (a) => a.values.lg,
  },
];

const ASKS = [
  "The surfaces: A, B, C or D (--radius, --radius-float and --radius-tile move together)",
  "The actions: today, pill or quiet",
  "The derived ladder: stock or quarters",
  "The dead rungs (rounded-3xl, rounded-4xl, --radius-action-lg): keep or drop",
  "The gallery gap: pinned to the tile, or free",
];

const DEPARTURES = [
  "The guest gallery's gap is a literal. guest-masonry.tsx, gallery-skeleton.tsx and ghost-grid.tsx write gap-[3px] while their tiles ride var(--radius-tile), so any tile above 3 opens corner holes on the one grid every guest sees and nowhere else. Bible 8, second clause. Part B shows the pair; the fix is in another track's lane.",
  "The guest ENTRY SHEET wears the action token. entry-shell.tsx draws the first surface any guest meets with rounded-t-[calc(var(--radius-action)*1.4)], so the action rung, not the floating rung, decides the corner of a sheet: 22.4px today, and a half circle under the pill. Part E draws it. Either the sheet moves to the floating layer's token (which is the floating-surfaces board's --radius-float-lg) or the action rung is ruled knowing it owns a sheet.",
  "The float rung is being ruled on two boards. This one sets --radius-float; the floating-surfaces proposal adds --radius-float-item (the panel minus its row padding) and --radius-float-lg. They have to agree, and bible 9 says the item token is right: today a menu draws an 8px panel around 1.6px rows sitting in 4px of padding.",
  "--radius-action-lg has exactly one call site, the reel builder, on an h-11. Every marketing CTA is size lg forced to h-11 with a className in 26 files, so the loudest action on the site wears 0.9 x --radius-action at 0.33 of its height while globals.css documents the ladder as 0.4. The proposal is a cta size on the Button (h-11 at 1.1 x --radius-action) and the retirement of a token named for a height nothing uses.",
  "The derived ladder cannot be retuned with a token. @theme inline substitutes each step into its utility at build time, so --radius-xl is empty at runtime and part D renders the retune as utility overrides. The ruling lands on the multipliers in theme.css, one line a step, which is the Orchestrator's file.",
];

const ASSETS = [
  "A worst-case tile set for the gallery gap: four photographs whose edges are near-white and bright (a white tablecloth, an overexposed sky, a white dress against a window) - 1200px long edge, JPG, four of them - so a corner hole between tiles is judged at maximum contrast instead of against the dark stills the board borrows. Replaces the wedding-golden, party-dj and festival-lights set in part B's guest grid.",
];

/* ── The board ─────────────────────────────────────────────────────────── */

export function RoundingBoard() {
  const [surfaceId, setSurfaceId] = useState<SurfaceCandidate["id"]>("today");
  const [actionId, setActionId] = useState<ActionRung["id"]>("today");
  const [ladder, setLadder] = useState<LadderId>("stock");
  const [composition, setComposition] = useState<CompositionId>("marketing");
  const [mode, setMode] = useState<Mode>("desktop");
  const [ground, setGround] = useState<Ground>("app-light");
  // Part F is its own pair of toggles on purpose: it sits five parts below B
  // and a reader who lands on it from the anchor should not have to scroll up
  // to find out what it is showing.
  const [phoneComposition, setPhoneComposition] =
    useState<CompositionId>("guest");
  const [phoneGround, setPhoneGround] = useState<Ground>("app-light");

  const rootRef = usePanelAwareWidth();

  const overrides = useSyncExternalStore(
    subscribeTuner,
    getTunerSnapshot,
    getTunerServerSnapshot,
  );
  const applied = useTunerCandidate();
  const { live, probe } = useLiveTokens(overrides, applied);

  // The lab's gate key, read without a state-in-effect: the search string is
  // a primitive and never changes under this board, so an external-store read
  // is both SSR-safe and stable (the same shape the tuner's mounted guard
  // uses).
  const search = useSyncExternalStore(
    () => () => {},
    () => window.location.search,
    () => "",
  );
  const designKey = new URLSearchParams(search).get("key");

  const surface = SURFACES.find((s) => s.id === surfaceId) ?? SURFACES[0];
  const action = ACTIONS.find((a) => a.id === actionId) ?? ACTIONS[0];

  const applyToSite = useCallback(
    (s: SurfaceCandidate, a: ActionRung, l: LadderId) => {
      if (!s.values) return;
      setCandidateCss(blockLabel(s, a, l), blockFor(s, a, l));
      // The tuner writes INLINE on <html>, and an inline declaration beats the
      // :root block the candidate renders, so a standing knob would silently
      // mask the applied value. Move the knobs with it: the panel then reads
      // what the site is wearing and a drag starts from there.
      const byVar = new Map<string, TunerControl>(
        ROUNDING_TUNER_CONTROLS.map((c) => [c.cssVar, c]),
      );
      const pairs: [string, number][] = [
        ["--radius", s.values.radius],
        ["--radius-float", s.values.float],
        ["--radius-tile", s.values.tile],
        ["--radius-action", a.values.action],
        ["--radius-action-lg", a.values.lg],
        ["--radius-action-sm", a.values.sm],
      ];
      for (const [cssVar, value] of pairs) {
        const control = byVar.get(cssVar);
        if (!control || control.kind !== "range") continue;
        // A value the slider cannot express (the pill rung is 999 against a
        // max of 24) stays in the block only: writing it would leave the panel
        // in a state a drag cannot return to.
        if (value < control.min || value > control.max) {
          clearTunerValues([control]);
          continue;
        }
        setTunerValue(control, value);
      }
    },
    [],
  );

  /** The whole answer, as one paste: the rail moves with it so every part
   *  below is showing what the site is now wearing. */
  const applyAnswer = useCallback(() => {
    const s = SURFACES.find((c) => c.id === ANSWER.surface)!;
    const a = ACTIONS.find((c) => c.id === ANSWER.action)!;
    setSurfaceId(s.id);
    setActionId(a.id);
    setLadder(ANSWER.ladder);
    applyToSite(s, a, ANSWER.ladder);
  }, [applyToSite]);

  const clearAll = useCallback(() => {
    clearCandidate();
    clearTunerValues(ROUNDING_TUNER_CONTROLS);
  }, []);

  const walk = (path: string) =>
    designKey ? `${path}?key=${designKey}` : path;
  const liveRadius = live?.["--radius"] ?? 2;
  const base = surface.values ? surface.values.radius : liveRadius;
  const today = CANDIDATES[0];
  const answer = SURFACES.find((c) => c.id === ANSWER.surface)!;
  const todayRung = ACTIONS[0];

  return (
    <div ref={rootRef} className="flex flex-col gap-10 py-4">
      {probe}
      {/* The retuned ladder, scoped so one column can wear it. The same
          function writes the unscoped block the paste carries. */}
      <style>{ladderCss("quarters", '[data-rnd-ladder="quarters"] ')}</style>

      <div className="max-w-2xl space-y-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          Six tokens, three decisions. The surface family (A to D) moves{" "}
          <span className="text-foreground">--radius</span>, the floating layer
          and the media tile together; the action rung moves the three action
          tokens, because bible 8 says round actions without saying how round;
          the ladder is the seven derived steps, whose multipliers were chosen
          against a 2px base and stop making sense somewhere above 8.
        </p>
        <p>
          Every comparison is at 1:1, because the only honest size for a corner
          is its own. Part B is the exception and says so: there the question is
          the layout, so it keeps the shell&apos;s zoom-fitted stage.
        </p>
      </div>

      {/* ── The answer, first ──────────────────────────────────────────── */}
      <section
        id="rnd-answer"
        className="rnd-answer flex scroll-mt-6 flex-col gap-4 rounded-lg border border-border bg-muted/25 p-5"
      >
        <div>
          <h2 className="text-sm font-semibold tracking-tight">
            What the board answers
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Five one-word rulings. The evidence for each is the part named
            beside it; the button puts all five on the site at once, as the
            paste the ruling would land.
          </p>
        </div>

        <div className="rnd-answer-grid">
          {ANSWER.lines.map((l, i) => (
            <div key={l.ask} className="flex flex-col gap-1">
              <p className="text-[11px] font-medium text-muted-foreground">
                {l.ask}
                <a
                  href={`#rnd-${["a", "e", "d", "d", "b"][i]}`}
                  className="ml-1.5 underline underline-offset-2 hover:text-foreground"
                >
                  part {["A", "E", "D", "D", "B"][i]}
                </a>
              </p>
              <p className="text-sm font-medium">{l.value}</p>
              <CellLabel>{l.why}</CellLabel>
            </div>
          ))}
        </div>

        {/* The one comparison the first ruling turns on, at true size. */}
        <div className="flex flex-wrap items-start gap-6 border-t border-border pt-4">
          {[today, answer].map((c) => (
            <div
              key={c.id}
              style={overrideStyle(c, todayRung)}
              data-rnd-ladder={c.id === answer.id ? ANSWER.ladder : "stock"}
              className="flex w-[15rem] flex-col gap-2"
            >
              <p className="text-sm font-medium">
                {c.id === today.id ? "Today" : "The answer"}
                <span className="ml-1.5 text-muted-foreground tabular-nums">
                  {c.values!.radius} / {c.values!.float} / {c.values!.tile}
                </span>
              </p>
              <SurfaceSpecimen radius={c.values!.radius} />
              <TileSpecimen
                tile={c.values!.tile}
                gap={c.values!.gap}
                count={3}
              />
            </div>
          ))}
          <div className="flex max-w-xs flex-col gap-2 self-center">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={applyAnswer}>Apply the answer to the site</Button>
              <Button variant="ghost" onClick={clearAll}>
                Clear
              </Button>
            </div>
            <CellLabel>
              {applied ? (
                <>
                  On the site now:{" "}
                  <span className="text-foreground">{applied.label}</span>. It
                  rides every lab page, every marketing page and the app, with
                  the key.
                </>
              ) : (
                "Nothing applied. The site is on its baked values."
              )}
            </CellLabel>
            <CellLabel>
              Then walk{" "}
              {(
                [
                  ["/", "the home arc"],
                  ["/pricing", "pricing"],
                  ["/help", "help"],
                  ["/contact", "contact"],
                  ["/dashboard", "the dashboard"],
                ] as const
              ).map(([href, label], i, all) => (
                <span key={href}>
                  <a
                    href={walk(href)}
                    className="text-foreground underline underline-offset-2"
                  >
                    {label}
                  </a>
                  {i < all.length - 1 ? ", " : ""}
                </span>
              ))}
              , an event page and the demo guest page. The app pages want the
              host signed in, and the key rides the query string.
            </CellLabel>
          </div>
        </div>
      </section>

      {/* ── The rail: the three axes ───────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <CellLabel>
          Every part below is drawn at the rail&apos;s setting. The four
          candidates each apply on their own from part A.
        </CellLabel>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Labeled label="Surfaces">
            <Toggle
              ariaLabel="Surface candidate"
              options={CANDIDATES.map((c) => ({ id: c.id, label: c.letter }))}
              value={surfaceId}
              onChange={setSurfaceId}
            />
          </Labeled>
          <Labeled label="Actions">
            <Toggle
              ariaLabel="Action rung"
              options={ACTIONS.map((a) => ({
                id: a.id,
                label: a.name.split(",")[0],
              }))}
              value={actionId}
              onChange={setActionId}
            />
          </Labeled>
          <Labeled label="Ladder">
            <Toggle
              ariaLabel="Derived ladder"
              options={[
                { id: "stock" as LadderId, label: "Stock" },
                { id: "quarters" as LadderId, label: "Quarters" },
              ]}
              value={ladder}
              onChange={setLadder}
            />
          </Labeled>
          <Button
            variant="outline"
            onClick={() => applyToSite(surface, action, ladder)}
            disabled={!surface.values}
          >
            Apply this rail to the site
          </Button>
        </div>
      </div>

      <Part
        n="A"
        title="The six tokens, at true size"
        lede={
          <>
            <p>
              Four rows, one per token family, on the components that carry
              them. The line under each cell is the arithmetic a ruling
              inherits: a card is 1.4x the base, a menu row nests only at the
              panel minus its 4px of padding, and the gallery gap follows the
              tile.
            </p>
            <p>
              The action row shows the shipped pair: the h-8 Button on
              --radius-action-sm, and the marketing CTA, which is size lg forced
              to h-11 and therefore wears 0.9 x --radius-action at a height the
              ladder never planned for.
            </p>
          </>
        }
      >
        <div className="rnd-wide">
          <div className="overflow-x-auto pb-1">
            <div className="grid min-w-[46rem] grid-cols-[6.5rem_repeat(4,minmax(0,1fr))] gap-x-4 gap-y-7">
              <div />
              {CANDIDATES.map((c) => (
                <div key={c.id} className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium">
                    {c.letter}
                    <span className="ml-1.5 text-muted-foreground tabular-nums">
                      {c.values!.radius} / {c.values!.float} / {c.values!.tile}
                    </span>
                    {c.id === ANSWER.surface ? (
                      <span className="ml-1.5 rounded-action-sm bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">
                        the answer
                      </span>
                    ) : null}
                  </p>
                  <CellLabel className="min-h-[5rem]">{c.rationale}</CellLabel>
                  <Button
                    size="xs"
                    className="w-fit"
                    variant={surfaceId === c.id ? "default" : "outline"}
                    onClick={() => {
                      setSurfaceId(c.id);
                      const next = c.wants ?? ladder;
                      setLadder(next);
                      applyToSite(c, action, next);
                    }}
                  >
                    Apply {c.letter}
                  </Button>
                </div>
              ))}

              {ROWS.map((row) => (
                <div key={row.token} className="contents">
                  <div className="pt-1">
                    <p className="text-[11px] font-medium text-foreground">
                      {row.label}
                    </p>
                    <CellLabel className="mt-0.5">{row.token}</CellLabel>
                    <CellLabel className="mt-1.5">{row.note}</CellLabel>
                  </div>
                  {CANDIDATES.map((c) => (
                    <div
                      key={c.id}
                      style={overrideStyle(c, action)}
                      data-rnd-ladder={ladder}
                      className="min-w-0"
                    >
                      {row.cell(c, live, action)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* The tuner's own column, as a band: it used to be a fifth column
            sitting under the panel that drives it. */}
        <div className="rnd-wide">
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-sm font-medium">Live, from the tuner</p>
              <CellLabel className="max-w-lg">
                {LIVE.rationale} The numbers are read off the page, not parsed
                out of the variables.
              </CellLabel>
            </div>
            <div className="flex flex-wrap items-start gap-6">
              {ROWS.map((row) => (
                <div key={row.token} className="w-[13rem] min-w-0">
                  <CellLabel className="mb-1.5">{row.token}</CellLabel>
                  {row.cell(LIVE, live, action)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Proposal>
          The board lands on C for the surfaces. A is a corner nobody can see,
          which makes the sharp half of bible 8 a claim rather than a look; B is
          the honest version of that claim and reads like a spreadsheet next to
          photographs; D gives up the contrast the law exists for. C keeps the
          contrast at two to one, which is enough to read, and lets a card have
          a corner.
        </Proposal>
      </Part>

      <Part
        n="B"
        title="The real surfaces"
        lede={
          <>
            <p>
              Four compositions built from the shipped components: a marketing
              chapter&apos;s card row and its CTA, the dashboard&apos;s event
              grid, the guest gallery, and the floating layer over content.
              Switch candidates on the rail to flicker between them. This is the
              shell&apos;s stage, so on desktop the corner is drawn at about two
              thirds of its true size, and on the phone canvas at 1:1. Part F is
              the same phone canvas with every candidate side by side.
            </p>
            <p>
              The guest composition carries the round&apos;s worst finding at
              the bottom: the same grid twice, once on the token and once as the
              guest gallery ships it, with a literal 3px gap that no tile value
              can move.
            </p>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Labeled label="Composition">
            <Toggle
              ariaLabel="Composition"
              options={COMPOSITION_OPTIONS}
              value={composition}
              onChange={setComposition}
            />
          </Labeled>
          <Labeled label="Canvas">
            <Toggle
              ariaLabel="Viewport"
              options={[
                { id: "desktop" as Mode, label: "Desktop 1440" },
                { id: "phone" as Mode, label: "Phone 375" },
              ]}
              value={mode}
              onChange={setMode}
            />
          </Labeled>
          <Labeled label="Ground">
            <Toggle
              ariaLabel="Ground"
              options={[
                { id: "app-light" as Ground, label: "Light" },
                { id: "app-dark" as Ground, label: "Dark" },
                { id: "cinema" as Ground, label: "Cinema" },
              ]}
              value={ground}
              onChange={setGround}
            />
          </Labeled>
        </div>
        <div className="rnd-fit flex flex-col gap-2">
          <p className="text-sm font-medium">
            {surface.letter}, {action.name.split(",")[0].toLowerCase()} actions
            {ladder === "quarters" ? ", quarter ladder" : ""}
          </p>
          <CellLabel className="max-w-2xl">{surface.rationale}</CellLabel>
          <div
            style={overrideStyle(surface, action)}
            data-rnd-ladder={ladder}
            className="mt-1"
          >
            <FitStage
              mode={mode}
              ground={ground}
              swapKey={`${composition}-${surfaceId}-${actionId}-${ladder}`}
            >
              <Composition id={composition} mode={mode} />
            </FitStage>
          </div>
        </div>
      </Part>

      <Part
        n="C"
        title="Nested corners"
        lede={
          <>
            <p>
              Bible 9: anything drawn around an object takes the object&apos;s
              radius plus its offset. It costs nothing at a 2px base and it is
              the first thing that breaks when the base goes round. The pair
              below is the rail&apos;s candidate at reading size: the left half
              does the subtraction, the right half reuses the token, and at
              today&apos;s base the two are the same picture.
            </p>
            <p>
              The strip under it is the same failure at all four bases, which is
              the actual argument: the rule is free to follow and the error
              grows with whatever this board rules. The third specimen is the
              rule around an action, which wanted to be the beam, the case the
              system already gets right (BorderBeam takes no radius prop and
              reads its child&apos;s computed one), and is a plain ring instead
              because a beam here would add a call site to a set pinned in a
              file this track does not own.
            </p>
          </>
        }
      >
        <div className="rnd-fit flex flex-col gap-4">
          <div
            style={overrideStyle(surface, action)}
            data-rnd-ladder={ladder}
            className="flex flex-col gap-3"
          >
            <p className="text-sm font-medium">
              {surface.letter}
              <span className="ml-1.5 text-muted-foreground tabular-nums">
                base {px(base)}, card {px(base * 1.4)}
              </span>
            </p>
            <div className="max-w-[34rem]">
              <NestedSpecimen radius={surface.values ? base : null} />
            </div>
            <div className="max-w-[26rem]">
              <ActionRingSpecimen
                radius={
                  surface.values
                    ? action.values.sm
                    : (live?.["--radius-action-sm"] ?? null)
                }
              />
            </div>
          </div>
        </div>
        <div className="rnd-wide">
          <div className="overflow-x-auto pb-1">
            <div className="grid min-w-[42rem] grid-cols-[6.5rem_repeat(4,minmax(0,1fr))] gap-x-4">
              <div className="pt-1">
                <p className="text-[11px] font-medium text-foreground">
                  The same ring, every base
                </p>
                <CellLabel className="mt-1.5">
                  A ring at 6px offset should be the radius plus 6. The right
                  half of each pair is the object&apos;s own radius.
                </CellLabel>
              </div>
              {CANDIDATES.map((c) => (
                <div
                  key={c.id}
                  style={overrideStyle(c, action)}
                  data-rnd-ladder={ladder}
                  className="min-w-0"
                >
                  <p className="mb-2 text-sm font-medium">{c.letter}</p>
                  <NestedSpecimen radius={c.values!.radius} ringOnly />
                </div>
              ))}
            </div>
          </div>
        </div>
        <Proposal>
          Whatever the surfaces are ruled at, the nesting is arithmetic and
          belongs in a token: a plate inside a card at the card&apos;s own
          padding is the same subtraction every time. The floating-surfaces
          board asks for exactly this on the floating layer
          (--radius-float-item, the panel minus its padding). One ruling should
          cover both.
        </Proposal>
      </Part>

      <Part
        n="D"
        title="The derived ladder"
        lede={
          <>
            <p>
              Seven steps, each a multiplier of the base, compiled into their
              utilities at build time. At today&apos;s 2px base the whole ladder
              spans four pixels and nobody has ever had to think about it. Under
              C it spans fifteen, under D twenty-two, and the step that carries
              the pricing cards is 1.8x, which is where a card starts to look
              like a lozenge.
            </p>
            <p>
              The quarter ladder is the alternative: an even quarter a step.
              Note what it does at today&apos;s base, in the two columns of
              numbers: nothing. It is a change that costs nothing now and is the
              difference between a plan card at{" "}
              {px(stepValue(14, "stock", "2xl"))} and{" "}
              {px(stepValue(14, "quarters", "2xl"))} if the base ever moves.
            </p>
          </>
        }
      >
        <div className="rnd-wide">
          <div className="overflow-x-auto pb-1">
            <div className="grid min-w-[44rem] grid-cols-[3rem_minmax(0,11rem)_minmax(0,11rem)_1fr] items-center gap-x-4 gap-y-4">
              <CellLabel className="font-medium text-foreground">
                Step
              </CellLabel>
              <CellLabel className="font-medium text-foreground">
                Stock, at {px(base)}
              </CellLabel>
              <CellLabel className="font-medium text-foreground">
                Quarters, at {px(base)}
              </CellLabel>
              <CellLabel className="font-medium text-foreground">
                Where it lands
              </CellLabel>

              {STEPS.map((step) => {
                const site = STEP_CALL_SITES[step];
                const dead = site.uses <= 2;
                const cellStyle: CSSProperties = surface.values
                  ? (overrideStyle(surface, action) as CSSProperties)
                  : ({ "--radius": `${base}px` } as CSSProperties);
                return (
                  <div key={step} className="contents">
                    <CellLabel
                      className={cn("font-medium", !dead && "text-foreground")}
                    >
                      {step}
                    </CellLabel>
                    <div
                      style={cellStyle}
                      data-rnd-ladder="stock"
                      className="flex min-w-0 items-center"
                    >
                      <StepSpecimen step={step} />
                    </div>
                    <div
                      style={cellStyle}
                      data-rnd-ladder="quarters"
                      className="flex min-w-0 items-center"
                    >
                      <StepSpecimen step={step} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <CellLabel>
                        {LADDERS.stock[step]}x = {px(stepValue(base, "stock", step))}
                        {"  |  "}
                        {LADDERS.quarters[step]}x ={" "}
                        {px(stepValue(base, "quarters", step))}
                      </CellLabel>
                      <CellLabel>
                        {site.uses} uses: {site.where}
                        {dead ? ". A candidate for deletion." : ""}
                      </CellLabel>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <Proposal>
          Quarters, and delete the top two rungs. rounded-3xl has one call site
          and rounded-4xl has two, one of which is the Badge, which wants a pill
          and should say so with rounded-full rather than borrowing 2.6x of a
          base that is about to move.
        </Proposal>
      </Part>

      <Part
        n="E"
        title="The action ladder, as it ships"
        lede={
          <>
            <p>
              The three action tokens name a 40px, a 48px and a 32px button, and
              only the 32px one is the product: the default Button is h-8, and
              the in-between sizes derive from --radius-action at 0.6, 0.7 and
              0.9. Counted on this tree, --radius-action has{" "}
              {ACTION_SITES.derived + ACTION_SITES.raw} raw uses in{" "}
              {ACTION_SITES.files} files, {ACTION_SITES.derived} of them inside
              button.tsx; --radius-action-lg has {ACTION_SITES.lg}. Every
              marketing CTA is size lg forced to h-11, so it wears 0.9x of a
              token defined for a height it does not have.
            </p>
            <p>
              The last row is the finding: the guest entry sheet is not a button
              and it wears the action token anyway, at 1.4x. Each rung is
              applied to every shipped height at once with the ratio printed.
              The pill is the only rung whose shape does not depend on the
              height, which is what makes the h-11 CTA a non-issue under it and
              a half circle of the guest sheet.
            </p>
          </>
        }
      >
        <div className="rnd-wide">
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
                  <CellLabel className="min-h-[4rem]">{a.rationale}</CellLabel>
                  <Button
                    size="xs"
                    className="w-fit"
                    variant={actionId === a.id ? "default" : "outline"}
                    onClick={() => {
                      setActionId(a.id);
                      applyToSite(surface, a, ladder);
                    }}
                  >
                    Apply with {surface.letter}
                  </Button>
                </div>
              ))}

              {HEIGHTS.map((h) => (
                <div key={h.label} className="contents">
                  <div className="pt-1">
                    <p className="text-[11px] font-medium text-foreground">
                      {h.label}
                    </p>
                    <CellLabel className="mt-0.5">{h.where}</CellLabel>
                  </div>
                  {ACTIONS.map((a) => {
                    const r = h.radius(a);
                    return (
                      <div
                        key={a.id}
                        style={overrideStyle(surface, a)}
                        className="flex min-w-0 flex-col gap-1.5"
                      >
                        <span
                          className="inline-flex w-fit items-center bg-primary font-medium text-primary-foreground"
                          style={{
                            height: h.px,
                            paddingInline: Math.round(h.px * 0.45),
                            borderRadius: h.token,
                            fontSize: h.px >= 40 ? 15 : 13,
                          }}
                        >
                          {h.sample}
                        </span>
                        <CellLabel>
                          {r >= 100
                            ? "a pill at every height"
                            : `${px(r)}, ${Math.round((r / h.px) * 100) / 100} x height`}
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
                  entry-shell.tsx, at 1.4 x --radius-action. Not a button, and
                  the first surface every guest meets
                </CellLabel>
              </div>
              {ACTIONS.map((a) => (
                <div
                  key={a.id}
                  style={overrideStyle(surface, a)}
                  className="min-w-0"
                >
                  <EntrySheetSpecimen action={a.values.action} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <Proposal>
          Today&apos;s rung, and give the CTA a real size. The pill is a
          different product and quiet gives up the second half of bible 8; what
          is actually broken is that the loudest action on the site is an ad-hoc
          h-11 with a className, and that a sheet is wearing a button&apos;s
          token. The ruling should add a cta size to the Button (h-11 at 1.1 x
          --radius-action), retire --radius-action-lg, and move the entry sheet
          onto the floating layer.
        </Proposal>
      </Part>

      <Part
        n="F"
        title="Every candidate on the phone"
        lede={
          <>
            <p>
              The four candidates, each on its own 375 canvas at 1:1, because
              the phone is where most of these corners are actually seen: the
              guest gallery is a phone surface first, and a 6px tile is a
              different object beside a 180px photograph than beside a 340px
              one. Part B walks one candidate at a time on a phone; this is the
              row.
            </p>
            <p>
              Phones at true size do not fit across the lab column and shrinking
              one to make it fit is the error this board was rebuilt to remove,
              so they wrap: three to a row where there is room, two beside an
              open tuner panel.
            </p>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Labeled label="Composition">
            <Toggle
              ariaLabel="Phone composition"
              options={COMPOSITION_OPTIONS}
              value={phoneComposition}
              onChange={setPhoneComposition}
            />
          </Labeled>
          <Labeled label="Ground">
            <Toggle
              ariaLabel="Phone ground"
              options={[
                { id: "app-light" as Ground, label: "Light" },
                { id: "app-dark" as Ground, label: "Dark" },
                { id: "cinema" as Ground, label: "Cinema" },
              ]}
              value={phoneGround}
              onChange={setPhoneGround}
            />
          </Labeled>
        </div>
        <div className="rnd-wide">
          <div className="flex flex-wrap gap-4">
            {CANDIDATES.map((c) => (
              <div key={c.id} className="flex w-[375px] shrink-0 flex-col gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {c.letter}
                    <span className="ml-1.5 text-muted-foreground tabular-nums">
                      {c.values!.radius} / {c.values!.float} / {c.values!.tile}
                    </span>
                  </p>
                  <CellLabel>{c.phone}</CellLabel>
                </div>
                <Stage mode="phone" ground={phoneGround} height={700}>
                  {/* data-inview for the same reason as part B: the marketing
                      card is held at opacity 0 by marketing.css until an
                      ancestor says it is in view. */}
                  <div
                    className="h-full overflow-y-auto"
                    style={overrideStyle(c, action)}
                    data-rnd-ladder={ladder}
                    data-inview="true"
                  >
                    <Composition id={phoneComposition} mode="phone" />
                  </div>
                </Stage>
              </div>
            ))}
          </div>
        </div>
        <Proposal>
          The phone is what settles the tile. On the guest canvas A&apos;s 3px
          disappears into the gap and D&apos;s 6px, with the 6px gap it pins,
          takes a visible slice out of every photograph at the width a guest
          actually holds. That is the second argument for C: at 4px the corner
          still reads and the image keeps its edges.
        </Proposal>
      </Part>

      <BoardMeta
        question={QUESTION}
        candidates={[
          ...CANDIDATES.map((s) => ({
            name: `Surfaces ${s.letter}, ${s.name}`,
            rationale: s.rationale,
          })),
          ...ACTIONS.map((a) => ({
            name: `Actions, ${a.name}`,
            rationale: a.rationale,
          })),
          {
            name: "The ladder, quarters",
            rationale:
              "0.5 / 0.75 / 1 / 1.25 / 1.5 / 1.75 / 2 in place of 0.6 / 0.8 / 1 / 1.4 / 1.8 / 2.2 / 2.6. Within half a pixel of stock at today's base; the difference is only visible once the base is round.",
          },
        ]}
        asks={ASKS}
        departures={DEPARTURES}
        assets={ASSETS}
      />

      <MotionTuner controls={ROUNDING_TUNER_CONTROLS} />
    </div>
  );
}

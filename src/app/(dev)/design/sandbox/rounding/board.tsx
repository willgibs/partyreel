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
  BoardDock,
  BoardMeta,
  CANVAS,
  clearCandidate,
  type Ground,
  type Mode,
  setCandidateCss,
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
  cardMultiplier,
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
  PageFrame,
  PageFrames,
  ROUTE_OPTIONS,
  ROUTES,
  type RouteId,
  screenPath,
} from "./frames";
import {
  SCREEN_NOTE,
  SCREEN_OPTIONS,
  type ScreenId,
} from "./screen-ids";
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
 * THE ROUNDING BOARD, ROUND FOUR (2026-09-15).
 *
 * Will, after a scroll through every board: "I'd like more UI to preview the
 * variations on. Barely a single screen with a few components doesn't really
 * give a real feel of the marketing site or actual app rounding, or how the
 * different rounding groups work together."
 *
 * He is right, and the reason is structural rather than a matter of adding a
 * few more specimens. Rounds one to three judged the radius on COMPOSITIONS:
 * real components, arranged by this board, standing in for pages. A
 * composition is honest about a component and dishonest about a page, because
 * what a radius has to survive is the rest of the page: the photograph beside
 * the card, the CTA under the chapter, the plan card in the band, the tile in
 * the grid. And a composition inside the shell's Stage is dishonest twice
 * over, because a Stage is a div: a Tailwind breakpoint prefix in it reads the
 * BROWSER's width rather than the canvas's, and a radix panel portals out of
 * it entirely. Every earlier round worked around both by hand.
 *
 * ROUND FOUR STOPS ARRANGING AND LOADS THE PAGES.
 *
 * 1. PART A IS THE SITE. A same-origin iframe laid out at exactly 1440x930 or
 *    375x760, with the route in it and the rail written INTO that document as
 *    the same paste a ruling would land (frames.tsx). Real components, real
 *    breakpoints, real scroll, true pixels, no zoom and no transform. Split
 *    puts today beside the rail and scrolls the two together; single re-skins
 *    one page in place as the dock flips, with no reload and no scroll lost.
 * 2. PART B IS THE APP, which is behind a sign-in and cannot be loaded from a
 *    route, so this lane serves it from one of its own (screen/page.tsx): the
 *    production MasonryColumns, EventCard, Dialog, DropdownMenu and the guest
 *    EntryShell, each in a viewport of its own. Will's round-four note opens
 *    the app's UI to the lab; this is the app as it ships, at the size it
 *    ships, which is the thing a ruling has to be made against first.
 * 3. PART G IS THE FOUR CANDIDATES AT ONCE, four 375 viewports side by side,
 *    which is where the tile is settled.
 * 4. THE DOCK CARRIES EVERY PAGE-WIDE SWITCH (the shell's BoardDock, new this
 *    round): the candidate, the action rung, the ladder, the canvas, the
 *    ground and the paste. Will's note on the wave: "Having to scroll back to
 *    the top makes it very hard to review differences." Nothing that changes
 *    the whole page is left beside one specimen.
 *
 * What rounds two and three built is kept and moved under the evidence it
 * explains: the answer block first (five one-word rulings and one button),
 * then the matrix at true size, the nested-corner rule, the derived ladder and
 * the action ladder. Those parts are the arithmetic; parts A, B and G are what
 * the arithmetic looks like on the product.
 *
 * The findings this board carries, all on its face rather than in a comment:
 * the guest gallery's gap is a literal in three files while its tiles ride the
 * token, so the one grid every guest sees opens corner holes above a 3px tile;
 * the guest ENTRY SHEET, the first surface any guest meets, takes its corner
 * from the ACTION token at 1.4x; --radius-action-lg has exactly one call site;
 * every marketing CTA is size lg forced to h-11, which puts it at 0.33 x
 * height while globals.css documents 0.4; the top two rungs of the derived
 * ladder have three uses between them; and 64 corners in 28 files are px
 * literals no candidate can move, 52 of them photographs.
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
      // The floor may take room back FROM THE PANEL, which the reader can
      // move, but never from the page: at 375 the same floor pushed the block
      // 277px past the window and took the whole document into a horizontal
      // scroll, which is the bug the two CSS versions had in a new place.
      if (col.width + growLeft + growRight < MIN_WIDE) {
        growRight = Math.min(
          MIN_WIDE - col.width - growLeft,
          box.right - PAGE_PAD - col.right,
        );
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
      const cardEl = box.children[PROBES.length + 1] as HTMLElement | undefined;
      if (cardEl) {
        next.card = parseFloat(getComputedStyle(cardEl).borderTopLeftRadius);
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
      {/* The CARD's corner, measured for the same reason as the tokens. It is
          not a token at all: @theme inline bakes rounded-xl into its utility,
          and an applied candidate can rewrite that utility, so the only
          honest card number for the live band is the browser's. */}
      <span className="rounded-xl" />
    </div>
  );
  return { live, probe };
}

/* ── Part A's rows ─────────────────────────────────────────────────────── */

type Row = {
  token: string;
  label: string;
  /** The ladder is an argument because the note prints the card's multiplier
   *  and the matrix can be wearing either ladder. */
  note: (l: LadderId) => string;
  cell: (
    c: SurfaceCandidate,
    live: Live,
    l: LadderId,
    a: ActionRung,
  ) => React.ReactNode;
};

const ROWS: Row[] = [
  {
    token: "--radius",
    label: "Surfaces",
    note: (l) =>
      `154 files carry one. Card is ${cardMultiplier(l)}x of it, Input and every plate 1x.`,
    // The live band is outside every scoped ladder, so it is handed the
    // MEASURED card rather than a multiplier it would have to guess.
    cell: (c, live, l) =>
      c.values ? (
        <SurfaceSpecimen radius={c.values.radius} ladder={l} />
      ) : (
        <SurfaceSpecimen
          radius={live?.["--radius"] ?? null}
          card={live?.card ?? null}
        />
      ),
  },
  {
    token: "--radius-float",
    label: "The floating layer",
    note: () => "Menus, dialogs, toasts. Rows sit in 4px of padding.",
    cell: (c, live) => (
      <FloatSpecimen
        float={c.values ? c.values.float : (live?.["--radius-float"] ?? null)}
      />
    ),
  },
  {
    token: "--radius-tile",
    label: "Media tiles",
    note: () => "Every gallery grid, with --gap-gallery pinned to it.",
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
    note: () =>
      "The rung is the rail's, the same in every column. What changes is the contrast, printed under each.",
    cell: (c, live, l, a) => (
      <ActionSpecimen
        action={
          c.values ? a.values.action : (live?.["--radius-action"] ?? null)
        }
        sm={c.values ? a.values.sm : (live?.["--radius-action-sm"] ?? null)}
        card={
          c.values ? stepValue(c.values.radius, l, "xl") : (live?.card ?? null)
        }
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
  "The guest group cannot wear a candidate. CandidateStyle mounts in the lab layout, the marketing island and the app island, and (guest)/layout.tsx mounts none of them, so /e/<token> ignores every paste this board offers. The floating-surfaces board asks for the same one line, and this board is the second reason: the surface part E turns on is on that page.",
  "Sixty-four corners on the site are literals rather than tokens, and the walk is where that shows. rounded-[2px], -[3px] and -[4px] account for 52 of them across 24 non-lab files (the film strip, the live demo, the decomposition frames, the album grids, the reel filmstrip), so under any candidate but A a photograph keeps today's corner while the card around it moves: the home page alone holds 48 corners at 2px and 22 at 3px with the answer applied, beside cards at 10 and 12. They are the same argument as the gallery gap, one layer out, and they want var(--radius-tile). A ruling of C is a ruling to sweep them.",
];

const ASSETS = [
  "A worst-case tile set for the gallery gap: four photographs whose edges are near-white and bright (a white tablecloth, an overexposed sky, a white dress against a window) - 1200px long edge, JPG, four of them - so a corner hole between tiles is judged at maximum contrast instead of against the dark stills the board borrows. Replaces the wedding-golden, party-dj and festival-lights set in part B's guest grid.",
];

/* ── The board ─────────────────────────────────────────────────────────── */

const FRAME_W: Record<Mode, number> = {
  desktop: CANVAS.desktop.w,
  phone: CANVAS.phone.w,
};
const FRAME_H: Record<Mode, number> = {
  desktop: CANVAS.desktop.h,
  phone: CANVAS.phone.h,
};

/** Part G's four phones are four page loads, so they wait until the reader is
 *  actually there. Nothing else on the board costs enough to gate. */
function useSeen(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setSeen(true);
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen];
}

export function RoundingBoard() {
  const [surfaceId, setSurfaceId] = useState<SurfaceCandidate["id"]>("today");
  const [actionId, setActionId] = useState<ActionRung["id"]>("today");
  const [ladder, setLadder] = useState<LadderId>("stock");
  // Page-wide since round four: the dock owns the canvas and the ground, so a
  // reader compares two candidates on one page without scrolling to find the
  // switch that changes them (Will's note on the wave).
  const [mode, setMode] = useState<Mode>("desktop");
  const [ground, setGround] = useState<Ground>("app-light");
  const [routeId, setRouteId] = useState<RouteId>("home");
  const [screen, setScreen] = useState<ScreenId>("dashboard");
  const [split, setSplit] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [phonesRef, phonesSeen] = useSeen();

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
  // uses). Every frame's URL carries it, because every lab route is gated.
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

  // The three axes as the paste a ruling lands, written once and handed to
  // every frame on the page: what a frame wears and what a ruling pastes can
  // therefore never disagree.
  const railCss = surface.values ? blockFor(surface, action, ladder) : "";
  const railLabel = `${surface.letter}, ${action.name.split(",")[0].toLowerCase()} actions${ladder === "quarters" ? ", quarter ladder" : ""}`;
  const todayCss = blockFor(today, todayRung, "stock");
  const route = ROUTES.find((r) => r.id === routeId) ?? ROUTES[0];
  const screenUrl = screenPath(screen, ground, designKey);
  const w = FRAME_W[mode];
  const h = FRAME_H[mode];

  return (
    <div ref={rootRef} className="flex flex-col gap-10 pb-4">
      {probe}
      {/* The retuned ladder, scoped so one column can wear it. The same
          function writes the unscoped block the paste carries. */}
      <style>{ladderCss("quarters", '[data-rnd-ladder="quarters"] ')}</style>

      {/* ── The dock: every switch that changes the whole page ─────────── */}
      <BoardDock
        label="The rounding board's rail"
        aside={
          <>
            <Button
              size="xs"
              variant="outline"
              onClick={() => applyToSite(surface, action, ladder)}
              disabled={!surface.values}
            >
              Apply to the site
            </Button>
            <Button size="xs" variant="ghost" onClick={clearAll}>
              Clear
            </Button>
          </>
        }
      >
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
        <Labeled label="Canvas">
          <Toggle
            ariaLabel="Canvas"
            options={[
              { id: "desktop" as Mode, label: "1440" },
              { id: "phone" as Mode, label: "375" },
            ]}
            value={mode}
            onChange={setMode}
          />
        </Labeled>
        <Labeled label="App ground">
          <Toggle
            ariaLabel="App ground"
            options={[
              { id: "app-light" as Ground, label: "Light" },
              { id: "app-dark" as Ground, label: "Dark" },
              { id: "cinema" as Ground, label: "Cinema" },
            ]}
            value={ground}
            onChange={setGround}
          />
        </Labeled>
      </BoardDock>

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
          Everything is at 1:1, and since round four the judged surfaces are the
          real pages rather than compositions of them: parts A and B load the
          site and the app into a viewport of their own and write the rail into
          that document, so a candidate is worn by the real components, at the
          real breakpoints, at true pixels. Flip a switch in the dock and the
          page in front of you re-skins where it stands.
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
                  href={`#rnd-${["c", "f", "e", "e", "b"][i]}`}
                  className="ml-1.5 underline underline-offset-2 hover:text-foreground"
                >
                  part {["C", "F", "E", "E", "B"][i]}
                </a>
              </p>
              <p className="text-sm font-medium">{l.value}</p>
              <CellLabel>{l.why}</CellLabel>
            </div>
          ))}
        </div>

        {/* The one comparison the first ruling turns on, at true size. */}
        <div className="flex flex-wrap items-start gap-6 border-t border-border pt-4">
          {[today, answer].map((c) => {
            // One value for the attribute AND the caption: the answer column
            // wears the ruled ladder, so its card is 1.25x and must not be
            // captioned at the stock 1.4x.
            const columnLadder: LadderId =
              c.id === answer.id ? ANSWER.ladder : "stock";
            return (
              <div
                key={c.id}
                style={overrideStyle(c, todayRung)}
                data-rnd-ladder={columnLadder}
                className="flex w-[15rem] flex-col gap-2"
              >
                <p className="text-sm font-medium">
                  {c.id === today.id ? "Today" : "The answer"}
                  <span className="ml-1.5 text-muted-foreground tabular-nums">
                    {c.values!.radius} / {c.values!.float} / {c.values!.tile}
                  </span>
                </p>
                <SurfaceSpecimen
                  radius={c.values!.radius}
                  ladder={columnLadder}
                />
                <TileSpecimen
                  tile={c.values!.tile}
                  gap={c.values!.gap}
                  count={3}
                />
              </div>
            );
          })}
          <div className="flex max-w-xs flex-col gap-2 self-center">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={applyAnswer}>
                Apply the answer to the site
              </Button>
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
              Parts A and B do not need it: a frame is handed the rail
              directly, so it shows this column whatever the site is wearing.
              The button is for the walk you take in your own tabs.
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
              ))}{" "}
              and an event page. The app pages want the host signed in, and the
              key rides the query string.
            </CellLabel>
          </div>
        </div>
      </section>

      {/* ── A: the real site ───────────────────────────────────────────── */}
      <Part
        n="A"
        title="The real site, at 1:1"
        lede={
          <>
            <p>
              Not a composition of the site: the site. Each frame is a real
              viewport at {w} by {h} with the route loaded into it, and the
              rail is written into that document as the same paste a ruling
              would land, so the page in front of you is the production
              components at their own breakpoints wearing this column&apos;s
              radius. Scroll inside a frame and it is the real arc; click a
              link and the frame follows it.
            </p>
            <p>
              Split puts today beside the rail and scrolls them together, which
              is the only way a four pixel difference in a corner is visible at
              all. Single is one frame that re-skins in place when you flip the
              dock, with no reload and no scroll lost: that is the
              back-and-forth, and it is the fastest read on the board.
            </p>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Labeled label="Page">
            <Toggle
              ariaLabel="Page"
              options={ROUTE_OPTIONS}
              value={routeId}
              onChange={setRouteId}
            />
          </Labeled>
          <Labeled label="Compare">
            <Toggle
              ariaLabel="Compare"
              options={[
                { id: "split", label: "Today beside it" },
                { id: "single", label: "One frame" },
              ]}
              value={split ? "split" : "single"}
              onChange={(v) => setSplit(v === "split")}
            />
          </Labeled>
          <Button
            size="xs"
            variant="outline"
            onClick={() => setReloadKey((n) => n + 1)}
          >
            Reload the frames
          </Button>
          <a
            href={walk(route.path)}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Open {route.label} in a tab
          </a>
        </div>
        <CellLabel className="max-w-2xl">{route.note}</CellLabel>
        <div className="rnd-wide rnd-frames">
          <PageFrames
            route={route}
            w={w}
            h={h}
            split={split}
            railCss={railCss}
            railLabel={railLabel}
            todayCss={todayCss}
            reloadKey={reloadKey}
          />
        </div>
        <Proposal>
          The home arc is where the four groups meet, and it is the one place
          the ruling can be judged as a whole: a card corner at the chapters, a
          photograph corner in the film strip, a plan card at the band, and a
          CTA at every one of them. Take it at 1440 and then at 375 with the
          dock, on C, and the second read is the one that settles the tile.
        </Proposal>
      </Part>

      {/* ── B: the app ─────────────────────────────────────────────────── */}
      <Part
        n="B"
        title="The app, at 1:1"
        lede={
          <>
            <p>
              The app is behind a sign-in, so it cannot be loaded from a route
              the way the marketing pages can. These are the production
              components in a viewport of their own instead: the real
              MasonryColumns, the real EventCard, the real Dialog and
              DropdownMenu, and the real guest EntryShell, each on the page
              that carries it. A frame is a document, so radix panels portal
              into the canvas rather than over the lab, and a component&apos;s
              own responsive classes resolve against the canvas rather than
              against your browser. That was the fiction in every earlier round
              of this board, and it is why the app read better here than it
              does on a phone.
            </p>
            <p>
              Will&apos;s round four note opens the app&apos;s UI to the lab.
              Nothing here is a redesign yet: it is the app as it ships, at the
              size it ships, so the radius can be ruled on before the app
              tracks start.
            </p>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Labeled label="Screen">
            <Toggle
              ariaLabel="App screen"
              options={SCREEN_OPTIONS}
              value={screen}
              onChange={setScreen}
            />
          </Labeled>
          <a
            href={screenUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Open this screen in a tab
          </a>
        </div>
        <CellLabel className="max-w-2xl">{SCREEN_NOTE[screen]}</CellLabel>
        <div className="rnd-wide rnd-frames">
          <div className="overflow-x-auto pb-2">
            <div className="flex w-fit gap-4">
              {split ? (
                <PageFrame
                  id="app-left"
                  path={screenUrl}
                  w={w}
                  h={h}
                  css={todayCss}
                  title="Today"
                  caption="2 / 8 / 3, stock ladder."
                  reloadKey={reloadKey}
                />
              ) : null}
              <PageFrame
                id="app-right"
                path={screenUrl}
                w={w}
                h={h}
                css={railCss}
                title={railLabel}
                caption="The rail, written into this document."
                reloadKey={reloadKey}
              />
            </div>
          </div>
        </div>
        <Proposal>
          The gap screen is the round&apos;s worst finding and it is not a
          candidate: the guest gallery writes its column gap as a literal 3px
          in three files while its tiles ride the token, so every candidate
          above a 3px tile opens corner holes on the one grid every guest sees.
          The door screen is the second: the entry sheet takes its top corners
          from the ACTION token at 1.4x, so the action rung, not the floating
          rung, decides the shape of the first surface any guest meets. Put the
          rail on the pill and look at it.
        </Proposal>
      </Part>

      {/* ── C: the matrix ──────────────────────────────────────────────── */}
      <Part
        n="C"
        title="The six tokens, at true size"
        lede={
          <>
            <p>
              Four rows, one per token family, on the components that carry
              them. This is the arithmetic behind parts A and B: the line under
              each cell is what a ruling inherits, so a card is{" "}
              {cardMultiplier(ladder)}x the base on the rail&apos;s ladder, a
              menu row nests only at the panel minus its 4px of padding, and
              the gallery gap follows the tile.
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
                    Take {c.letter} to the rail
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
                    <CellLabel className="mt-1.5">{row.note(ladder)}</CellLabel>
                  </div>
                  {CANDIDATES.map((c) => (
                    <div
                      key={c.id}
                      style={overrideStyle(c, action)}
                      data-rnd-ladder={ladder}
                      className="min-w-0"
                    >
                      {row.cell(c, live, ladder, action)}
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
                  {row.cell(LIVE, live, ladder, action)}
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

      {/* ── D: nested corners ──────────────────────────────────────────── */}
      <Part
        n="D"
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
                base {px(base)}, card at {cardMultiplier(ladder)}x ={" "}
                {px(stepValue(base, ladder, "xl"))}
              </span>
            </p>
            <div className="max-w-[34rem]">
              <NestedSpecimen
                radius={surface.values ? base : null}
                outerMultiplier={cardMultiplier(ladder)}
              />
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
                  <NestedSpecimen
                    radius={c.values!.radius}
                    outerMultiplier={cardMultiplier(ladder)}
                    ringOnly
                  />
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

      {/* ── E: the derived ladder ──────────────────────────────────────── */}
      <Part
        n="E"
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
              {px(stepValue(8, "stock", "2xl"))} and{" "}
              {px(stepValue(8, "quarters", "2xl"))} at C&apos;s 8px base, and
              between {px(stepValue(14, "stock", "2xl"))} and{" "}
              {px(stepValue(14, "quarters", "2xl"))} at D&apos;s. Part A&apos;s
              pricing frame is where to see it on the page that carries it.
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
                        {LADDERS.stock[step]}x ={" "}
                        {px(stepValue(base, "stock", step))}
                        {"  |  "}
                        {LADDERS.quarters[step]}x ={" "}
                        {px(stepValue(base, "quarters", step))}
                      </CellLabel>
                      <CellLabel>
                        {site.uses} {site.uses === 1 ? "use" : "uses"}:{" "}
                        {site.where}
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

      {/* ── F: the action ladder ───────────────────────────────────────── */}
      <Part
        n="F"
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
              a half circle of the guest sheet. Part B&apos;s door screen is the
              real one, drawn by the production shell at a real viewport.
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
                    Take it to the rail
                  </Button>
                </div>
              ))}

              {HEIGHTS.map((h2) => (
                <div key={h2.label} className="contents">
                  <div className="pt-1">
                    <p className="text-[11px] font-medium text-foreground">
                      {h2.label}
                    </p>
                    <CellLabel className="mt-0.5">{h2.where}</CellLabel>
                  </div>
                  {ACTIONS.map((a) => {
                    const r = h2.radius(a);
                    return (
                      <div
                        key={a.id}
                        style={overrideStyle(surface, a)}
                        className="flex min-w-0 flex-col gap-1.5"
                      >
                        <span
                          className="inline-flex w-fit items-center bg-primary font-medium text-primary-foreground"
                          style={{
                            height: h2.px,
                            paddingInline: Math.round(h2.px * 0.45),
                            borderRadius: h2.token,
                            fontSize: h2.px >= 40 ? 15 : 13,
                          }}
                        >
                          {h2.sample}
                        </span>
                        <CellLabel>
                          {r >= 100
                            ? "a pill at every height"
                            : `${px(r)}, ${Math.round((r / h2.px) * 100) / 100} x height`}
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
                  the first surface every guest meets. The production shell
                  itself is part B&apos;s door screen; this row is the three
                  rungs at once
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

      {/* ── G: four candidates at once ─────────────────────────────────── */}
      <Part
        n="G"
        title="Every candidate at once, on a phone"
        lede={
          <>
            <p>
              The four candidates, each in its own 375 viewport with part
              B&apos;s screen loaded into it, because the phone is where most of
              these corners are actually seen and a 4px tile is a different
              object beside a 180px photograph than beside a 340px one. Parts A
              and B compare two; this is the row, and it is the read that
              settles the tile.
            </p>
            <p>
              Four viewports are four page loads, so the row waits until you
              reach it. They scroll together.
            </p>
          </>
        }
      >
        <div ref={phonesRef} className="rnd-wide rnd-frames">
          {phonesSeen ? (
            <PhoneRow
              path={screenPath(screen, ground, designKey)}
              ladder={ladder}
              action={action}
              reloadKey={reloadKey}
            />
          ) : (
            <CellLabel>Loading the four phones.</CellLabel>
          )}
        </div>
        <Proposal>
          The phone is what settles the tile. On the guest canvas A&apos;s 3px
          disappears into the gap and D&apos;s 6px, with the 6px gap it pins,
          takes a visible slice out of every photograph at the width a guest
          actually holds. That is the second argument for C: at 4px the corner
          still reads and the image keeps its edges.
        </Proposal>
      </Part>

      <div className="rnd-fit">
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
      </div>

      <MotionTuner controls={ROUNDING_TUNER_CONTROLS} />
    </div>
  );
}

/** The four candidates side by side at 375, each frame wearing its own paste.
 *  Its own component so the four frames mount and unmount together with the
 *  row rather than on every rail change above them. */
function PhoneRow({
  path,
  ladder,
  action,
  reloadKey,
}: {
  path: string;
  ladder: LadderId;
  action: ActionRung;
  reloadKey: number;
}) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex w-fit gap-4">
        {CANDIDATES.map((c) => (
          <PageFrame
            key={c.id}
            id={`phone-${c.id}`}
            path={path}
            w={CANVAS.phone.w}
            h={CANVAS.phone.h}
            css={blockFor(c, action, c.wants ?? ladder)}
            title={`${c.letter}, ${c.values!.radius} / ${c.values!.float} / ${c.values!.tile}`}
            caption={c.phone}
            reloadKey={reloadKey}
          />
        ))}
      </div>
    </div>
  );
}

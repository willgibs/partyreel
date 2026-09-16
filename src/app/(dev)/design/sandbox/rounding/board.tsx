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
  AppliedBadge,
  BoardPage,
  CANVAS,
  CellLabel,
  Frame,
  FrameRow,
  type Ground,
  Knob,
  type Mode,
  Toggle,
  useBoardState,
  WalkPages,
} from "@/components/lab";
import {
  clearCandidate,
  setCandidateCss,
  useTunerCandidate,
} from "@/components/dev/candidate-style";
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
  PageFrames,
  screenPath,
  ROUTE_OPTIONS,
  ROUTES,
  type RouteId,
  ScreenFrames,
} from "./frames";
import { SCREEN_NOTE, SCREEN_OPTIONS, type ScreenId } from "./screen-ids";
import { ROUNDING } from "./spec";
import {
  ActionRingSpecimen,
  ActionSpecimen,
  EntrySheetSpecimen,
  FloatSpecimen,
  NestedSpecimen,
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
 *    round): the candidate, the action rung, the ladder, the canvas, Compare,
 *    the app screen, the app ground and the paste. Will's note on the wave:
 *    "Having to scroll back to the top makes it very hard to review
 *    differences." Nothing that changes more than one part is left beside a
 *    part. The one control still beside a part is part A's page picker, which
 *    chooses that part's one specimen and nothing else; the app screen looked
 *    like its twin and is not, because part G loads it too.
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
 *  empty in the product, which is half of part F's finding. */
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
    where: "every Button in the app, on --radius-action-sm",
    px: 32,
    token: "var(--radius-action-sm)",
    sample: "Add photos",
    radius: (a) => a.values.sm,
  },
  {
    label: "36px (h-9), size lg",
    where: "0.9 x --radius-action",
    px: 36,
    token: "calc(var(--radius-action) * 0.9)",
    sample: "Share",
    radius: (a) => a.values.action * 0.9,
  },
  {
    label: "40px (h-10)",
    where: "--radius-action itself. The reel's buttons and the footer CTA",
    px: 40,
    token: "var(--radius-action)",
    sample: "Save to phone",
    radius: (a) => a.values.action,
  },
  {
    label: "44px (h-11), the marketing button",
    where: "size lg plus a className, in 26 files. Every marketing CTA",
    px: 44,
    token: "calc(var(--radius-action) * 0.9)",
    sample: "Create your event",
    radius: (a) => a.values.action * 0.9,
  },
  {
    label: "48px (h-12)",
    where: "--radius-action-lg. One call site, the reel builder, at h-11",
    px: 48,
    token: "var(--radius-action-lg)",
    sample: "Publish the reel",
    radius: (a) => a.values.lg,
  },
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
  // ★ THE DECLARED STATE IS READ HERE AS WELL AS IN THE TEMPLATE, AND THAT IS
  // SAFE BECAUSE IT IS NOT STATE. `useBoardState` derives its value from the
  // URL through an external store, so two callers read one source and cannot
  // drift; the alternative, threading the template's state down through seven
  // evidence blocks, would have made every part a function of a prop it did not
  // need. The five here are the page-wide switches the dock renders.
  const { state, setState } = useBoardState(ROUNDING);
  const surfaceId = state.surface as SurfaceCandidate["id"];
  const actionId = state.action as ActionRung["id"];
  const ladder = state.ladder as LadderId;
  const mode = state.canvas as Mode;
  const split = state.compare === "split";
  // Not declared, and deliberately: the app ground and the screen belong to
  // this board rather than to a ruling, so they ride the dock as the board's
  // own cluster and stay out of the shareable URL.
  const [ground, setGround] = useState<Ground>("app-light");
  const [routeId, setRouteId] = useState<RouteId>("home");
  const [screen, setScreen] = useState<ScreenId>("dashboard");
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

  // A gated frame must not be server rendered (the key is browser-only), and
  // the kit's Frame holds one until the browser has answered: `gated` on parts
  // B and G is the whole of what this board used to do by hand.

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
    setState({ surface: s.id, action: a.id, ladder: ANSWER.ladder });
    applyToSite(s, a, ANSWER.ladder);
  }, [applyToSite, setState]);

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
  // ★ THE LABEL IS THE OPTIONS' WORDS (the clarity round). It captions every
  // frame on the board, so it says "C, soft, today's buttons" rather than a
  // letter and an id a reader would have to map back to an ask.
  const railLabel = `${surface.name}, ${action.short}${ladder === "quarters" ? ", even quarters" : ""}`;
  const todayCss = blockFor(today, todayRung, "stock");
  const route = ROUTES.find((r) => r.id === routeId) ?? ROUTES[0];
  const w = FRAME_W[mode];
  const h = FRAME_H[mode];

  const SiteEvidence = (
    <>
      <div className="rnd-controls">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Knob label="Page">
            <Toggle
              ariaLabel="Page"
              options={ROUTE_OPTIONS}
              value={routeId}
              onChange={setRouteId}
            />
          </Knob>
          <a
            href={walk(route.path)}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Open {route.label} in a tab
          </a>
        </div>
      </div>
      <CellLabel className="max-w-2xl">{route.note}</CellLabel>
      <CellLabel className="max-w-2xl">
        A 1440 canvas does not fit in a 1440 window beside a fixed tuner panel,
        so the row scrolls inside itself rather than taking the page with it.
        Collapse the panel (its cross) or send it left (its arrow) and the row
        widens live to the whole column.
      </CellLabel>
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
        The home page is where all four groups meet, and it is the one place the
        ruling can be judged as a whole: a card corner at the chapters, a
        photograph in the film strip, a plan card at the band, and a button
        under every one of them. Take it at 1440 and then at 375 on C, soft, and
        the second read is the one that settles the photograph. Then take the
        guest album on D, one family: the photographs come up to 6px while the
        gap stays at the 3px the album hard-codes, which is the round&apos;s
        worst finding drawn by the real page rather than argued about.
      </Proposal>
    </>
  );
  const AppEvidence = (
    <>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <CellLabel>
          The screen is picked in the dock, beside the app ground: part G loads
          the same one into its four phones, so it is a page-wide switch rather
          than this part&apos;s.
        </CellLabel>
        <a
          href={screenPath(screen, ground, designKey)}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Open this screen in a tab
        </a>
      </div>
      <CellLabel className="max-w-2xl">{SCREEN_NOTE[screen]}</CellLabel>
      <div className="rnd-wide rnd-frames">
        <ScreenFrames
          screen={screen}
          ground={ground}
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
        The gap screen is the round&apos;s worst finding, and it is not a
        candidate: the guest album writes its gap as a fixed 3px in three files
        while the photographs take their corner from the token, so any corner
        above 3 opens holes on the one grid every guest sees. That is the
        question &quot;Should the gap between photographs follow their
        corner?&quot;, drawn rather than argued. The door screen is the second
        finding: the sheet a guest meets first takes its top corners from a
        BUTTON, at 1.4 times its corner. Set Buttons to A full pill and look at
        it.
      </Proposal>
    </>
  );
  const TokensEvidence = (
    <>
      {/* The one comparison the first ruling turns on, at true size, kept at
          the head of the evidence it belongs to rather than in the answer: the
          answer block states the ruling, this shows it. */}
      <div className="flex flex-wrap items-start gap-6">
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
                {c.name}
                <span className="ml-1.5 text-muted-foreground tabular-nums">
                  {c.values!.radius} / {c.values!.float} / {c.values!.tile}
                </span>
                {c.id === ANSWER.surface ? (
                  <span className="ml-1.5 rounded-action-sm bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">
                    the answer
                  </span>
                ) : null}
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
          <CellLabel>
            {applied ? (
              <>
                On the site now:{" "}
                <span className="text-foreground">{applied.label}</span>. It
                rides every lab page, every marketing page and the app, with the
                key.
              </>
            ) : (
              "Nothing applied. The site is on its baked values. Apply the answer from the dock."
            )}
          </CellLabel>
          <CellLabel>
            Parts A and B do not need it: a frame is handed the rail directly,
            so it shows this column whatever the site is wearing. The button is
            for the walk you take in your own tabs.
          </CellLabel>
          <WalkPages pages={ROUNDING.links.pages ?? []} />
        </div>
      </div>

      <div className="rnd-wide">
        <div className="overflow-x-auto pb-1">
          <div className="grid min-w-[46rem] grid-cols-[6.5rem_repeat(4,minmax(0,1fr))] gap-x-4 gap-y-7">
            <div />
            {CANDIDATES.map((c) => (
              <div key={c.id} className="flex flex-col gap-1.5">
                <p className="text-sm font-medium">
                  {c.name}
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
                    const next = c.wants ?? ladder;
                    setState({ surface: c.id, ladder: next });
                    applyToSite(c, action, next);
                  }}
                >
                  Put {c.name} on the pages
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
              {LIVE.rationale} The numbers are read off the page, not parsed out
              of the variables.
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
        The board lands on C, soft. A, today is a corner nobody can see, which
        makes the sharp half of bible 8 a claim rather than a look; B, square is
        the honest version of that claim and reads like a spreadsheet next to
        photographs; D, one family gives up the difference between a surface and
        a button that the law exists for. C keeps that difference at two to one,
        which is enough to read, and lets a card have a corner.
      </Proposal>
    </>
  );
  const NestedEvidence = (
    <>
      <div className="rnd-fit flex flex-col gap-4">
        <div
          style={overrideStyle(surface, action)}
          data-rnd-ladder={ladder}
          className="flex flex-col gap-3"
        >
          <p className="text-sm font-medium">
            {surface.name}
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
                A ring at 6px offset should be the radius plus 6. The right half
                of each pair is the object&apos;s own radius.
              </CellLabel>
            </div>
            {CANDIDATES.map((c) => (
              <div
                key={c.id}
                style={overrideStyle(c, action)}
                data-rnd-ladder={ladder}
                className="min-w-0"
              >
                <p className="mb-2 text-sm font-medium">{c.name}</p>
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
        belongs in a token: a plate inside a card at the card&apos;s own padding
        is the same subtraction every time. The floating-surfaces board asks for
        exactly this on the floating layer (--radius-float-item, the panel minus
        its padding). One ruling should cover both.
      </Proposal>
    </>
  );
  const LadderEvidence = (
    <>
      <div className="rnd-wide">
        <div className="overflow-x-auto pb-1">
          <div className="grid min-w-[44rem] grid-cols-[3rem_minmax(0,11rem)_minmax(0,11rem)_1fr] items-center gap-x-4 gap-y-4">
            <CellLabel className="font-medium text-foreground">Step</CellLabel>
            <CellLabel className="font-medium text-foreground">
              The steps as they are today, at {px(base)}
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
                      {dead
                        ? '. One of the two "Drop the top two steps" removes.'
                        : ""}
                    </CellLabel>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Proposal>
        Even quarters, and drop the top two steps. The largest step but one has
        a single use in the product and the largest has two, one of which is the
        Badge, which wants a full pill and should say so rather than borrowing
        2.6 times a card corner that is about to move.
      </Proposal>
    </>
  );
  const ActionsEvidence = (
    <>
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
                    setState({ action: a.id });
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
                entry-shell.tsx, at 1.4 x --radius-action. Not a button, and the
                first surface every guest meets. The production shell itself is
                part B&apos;s door screen; this row is the three rungs at once
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
        Today, 0.4 of the height, and give the marketing button a real size. A
        full pill is a different product, and Quiet, 0.2 of the height gives up
        the second half of bible 8. What is actually broken is that the loudest
        button on the site is a 44px one assembled by hand, and that a sheet is
        wearing a button&apos;s corner. The ruling should add a cta size to the
        Button (44px at 1.1 x --radius-action), retire --radius-action-lg, and
        move the entry sheet onto the floating layer.
      </Proposal>
    </>
  );
  const PhonesEvidence = (
    <>
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
        The phone is what settles the photograph. At the width a guest actually
        holds, A, today&apos;s 3px disappears into the gap, and D, one
        family&apos;s 6px, with the 6px gap it pins, takes a visible slice out
        of every photograph. That is the second argument for C, soft: at 4px the
        corner still reads and the image keeps its edges.
      </Proposal>
    </>
  );

  return (
    <div ref={rootRef}>
      {probe}
      {/* The retuned ladder, scoped so one column can wear it. The same
          function writes the unscoped block the paste carries. */}
      <style>{ladderCss("quarters", '[data-rnd-ladder="quarters"] ')}</style>

      <BoardPage
        spec={ROUNDING}
        dock={() => (
          <>
            {/* The two switches that are this board's own rather than a
                declared state: part B's screen (part G loads it into all four
                phones, so it is page wide) and the app's ground. */}
            <div className="rnd-dock-wide">
              <Knob label="App screen">
                <Toggle
                  ariaLabel="App screen"
                  options={SCREEN_OPTIONS}
                  value={screen}
                  onChange={setScreen}
                  wrap
                />
              </Knob>
            </div>
            <Knob label="App ground">
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
            </Knob>
            <AppliedBadge />
            <Button
              size="xs"
              variant="outline"
              onClick={() => setReloadKey((n) => n + 1)}
            >
              Reload frames
            </Button>
            <Button size="xs" variant="outline" onClick={applyAnswer}>
              Apply the answer
            </Button>
            <Button size="xs" variant="ghost" onClick={clearAll}>
              Clear
            </Button>
          </>
        )}
        evidence={(id: string) => {
          switch (id) {
            case "site":
              return SiteEvidence;
            case "app":
              return AppEvidence;
            case "tokens":
              return TokensEvidence;
            case "nested":
              return NestedEvidence;
            case "ladder":
              return LadderEvidence;
            case "actions":
              return ActionsEvidence;
            case "phones":
              return PhonesEvidence;
            default:
              return null;
          }
        }}
      />

      {/* The board's own tuner panel: the "Tuner" surface candidate IS this
          panel, so the board mounts it rather than borrowing the lab's. The
          panel now sets data-lab-panel and --lab-panel-w on <html> and
          design.css pads a wide page clear of it (landed at the kit's
          integration, 2026-09-15); usePanelAwareWidth above still measures it
          because it also grows the wide parts into the gutters, and its panel
          half is the migration wave's to retire. */}
      <MotionTuner controls={ROUNDING_TUNER_CONTROLS} />
    </div>
  );
}

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
  // One lock for this row, and only this row: the site pair and the app pair
  // have their own, so the four phones move together and with nothing else.
  return (
    <FrameRow>
      {CANDIDATES.map((c) => (
        <Frame
          key={c.id}
          id={`phone-${c.id}`}
          src={path}
          gated
          w={CANVAS.phone.w}
          h={CANVAS.phone.h}
          css={blockFor(c, action, c.wants ?? ladder)}
          title={`${c.name}: ${c.values!.radius} / ${c.values!.float} / ${c.values!.tile}`}
          caption={c.phone}
          reloadKey={reloadKey}
        />
      ))}
    </FrameRow>
  );
}

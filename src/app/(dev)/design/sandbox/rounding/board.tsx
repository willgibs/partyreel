"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import {
  useCallback,
  useEffect,
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

import { Variant } from "../variant-frame";
import {
  ACTIONS,
  type ActionRung,
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
  ActionSpecimen,
  CellLabel,
  FloatSpecimen,
  NestedSpecimen,
  Part,
  Proposal,
  StepSpecimen,
  SurfaceSpecimen,
  TileSpecimen,
} from "./specimens";

/**
 * THE ROUNDING BOARD, ROUND TWO (2026-09-14).
 *
 * Round one put one kit in four columns inside a zoom-fitted stage and asked
 * four questions at once. Judged from the ground up (bible 22), three things
 * were wrong with it, and all three are structural:
 *
 * 1. A RADIUS CANNOT BE JUDGED AT 69 PERCENT. The shell's Stage fits a 1440
 *    canvas into the lab's 992px column with `zoom`, which scales paint as
 *    well as layout, so every corner on that board rendered a third sharper
 *    than the number printed under it. Parts A, C, D and E are at 1:1 now
 *    (.rnd-wide widens them past the lab column, board.css) and part B keeps
 *    the Stage, where the question is the layout and the distortion is stated.
 *
 * 2. SIX NUMBERS IN ONE COLUMN IS NOT A RULING. The tokens are three
 *    independent decisions: the surface family, the action rung and the
 *    derived ladder. Split, they are three one-word answers, and a candidate
 *    is a letter plus a rung plus a ladder that combine into one paste.
 *
 * 3. A KIT IS NOT THE PRODUCT. Part B renders four surfaces the product
 *    actually has, from the components that draw them, and Apply hands the
 *    whole site the same block a ruling lands, so the real judgement happens
 *    on the walk.
 *
 * What the round found, on the board rather than in a comment: the guest
 * gallery's gap is a literal, so the one grid every guest sees opens corner
 * holes the moment the tile goes above 3; --radius-action names a 40px button
 * that ships nowhere and --radius-action-lg has exactly one call site; every
 * marketing CTA is size lg forced to h-11, which puts it at 0.33 x height
 * while globals.css documents 0.4; and the top two rungs of the derived ladder
 * have three uses between them.
 */

const QUESTION =
  "The radius system as three decisions rather than six numbers: the surface family (A to D), the action rung (today, pill or quiet) and the derived ladder (stock or quarters), each judged at true size on the components that ship them, and applied to the real site for the walk.";

/** The columns of every comparison part: the four fixed candidates and live. */
const COLUMNS = SURFACES;

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
 * pixels, so the live column prints the browser's answer rather than ours.
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
  cell: (c: SurfaceCandidate, live: Live) => React.ReactNode;
};

const ROWS: Row[] = [
  {
    token: "--radius",
    label: "Surfaces",
    note: "288 uses in 140 files. Card is 1.4x of it, Input and every plate 1x.",
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
    note: "The rung is the second axis, ruled in part E.",
    cell: (c, live) => (
      <ActionSpecimen
        action={c.values ? null : (live?.["--radius-action"] ?? null)}
        sm={c.values ? null : (live?.["--radius-action-sm"] ?? null)}
      />
    ),
  },
];

/** Every height an action ships at, and the token each one wears. h-10 and
 *  h-12 are here because the tokens are named for them and both are empty in
 *  the product, which is half of part E's finding. */
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
    where: "--radius-action itself. Three call sites, all in the reel",
    px: 40,
    token: "var(--radius-action)",
    sample: "Save to phone",
    radius: (a) => a.values.action,
  },
  {
    label: "h-11, the CTA",
    where: "size lg plus a className. Every marketing CTA on the site",
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
  "--radius-action names a 40px button that ships nowhere (its three call sites are the reel's h-10 buttons) and --radius-action-lg has exactly one, the reel builder, on an h-11. Every marketing CTA is size lg forced to h-11 with a className, so it wears 0.9 x --radius-action at 0.33 of its height while globals.css documents the ladder as 0.4.",
  "The derived ladder cannot be retuned with a token. @theme inline substitutes each step into its utility at build time, so --radius-xl is empty at runtime and part D renders the retune as utility overrides. The ruling lands on the multipliers in theme.css, one line a step, which is the Orchestrator's file.",
  "The float rung is being ruled on two boards. This one sets --radius-float; the floating-surfaces proposal adds --radius-float-item (the panel minus its row padding) and --radius-float-lg. They have to agree, and bible 9 says the item token is right: today a menu draws an 8px panel around 1.6px rows sitting in 4px of padding.",
  "Part A leaves the shell's Stage. A radius judged at the stage's zoom reads a third sharper than its number, which is a defect in the round-one board rather than in the stage: the stage is right for a hero. Offered to the shell's owner as a fit={false} escape hatch or a TrueSize wrapper, so the next board that judges a dimension does not have to invent .rnd-wide again.",
  "The pill rung is outside the tuner's range. ROUNDING_TUNER_CONTROLS caps the action knobs at 24px, so Apply writes the pill into the block and clears the knob rather than leaving the panel in a state a drag cannot return to. If the pill is ruled, that max moves.",
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

  const clearAll = useCallback(() => {
    clearCandidate();
    clearTunerValues(ROUNDING_TUNER_CONTROLS);
  }, []);

  const walk = (path: string) =>
    designKey ? `${path}?key=${designKey}` : path;
  const liveRadius = live?.["--radius"] ?? 2;
  const base = surface.values ? surface.values.radius : liveRadius;

  return (
    <div className="flex flex-col gap-10 py-4">
      {probe}
      {/* The retuned ladder, scoped so one column can wear it. The same
          function writes the unscoped block the paste carries. */}
      <style>{ladderCss("quarters", '[data-rnd-ladder="quarters"] ')}</style>

      <div className="max-w-2xl space-y-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          Six tokens, three decisions. The surface family (A to D) moves{" "}
          <span className="text-foreground">--radius</span>, the floating layer
          and the media tile together. The action rung moves the three action
          tokens, and it is a separate question because bible 8 says round
          actions without saying how round. The ladder is the seven derived
          steps, whose multipliers were chosen against a 2px base and stop
          making sense somewhere above 8.
        </p>
        <p>
          Every comparison part is at 1:1. The shell&apos;s stage fits 1440 into
          this column with <span className="text-foreground">zoom</span>, which
          scales the corner along with the layout, so the kit in round one
          rendered a third sharper than its own numbers. Part B keeps the stage,
          because there the question is the layout.
        </p>
        <p>
          Apply a candidate and the whole site wears the block a ruling would
          land, so the real answer comes from the walk:{" "}
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
          , an event page and the demo guest page. The app pages want the host
          signed in, and the key rides the query string.
        </p>
      </div>

      {/* The rail: the three axes, then what is applied. */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            ariaLabel="Surface candidate"
            options={COLUMNS.map((c) => ({ id: c.id, label: c.letter }))}
            value={surfaceId}
            onChange={setSurfaceId}
          />
          <Toggle
            ariaLabel="Action rung"
            options={ACTIONS.map((a) => ({
              id: a.id,
              label: a.name.split(",")[0],
            }))}
            value={actionId}
            onChange={setActionId}
          />
          <Toggle
            ariaLabel="Derived ladder"
            options={[
              { id: "stock" as LadderId, label: "Stock ladder" },
              { id: "quarters" as LadderId, label: "Quarters" },
            ]}
            value={ladder}
            onChange={setLadder}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => applyToSite(surface, action, ladder)}
            disabled={!surface.values}
          >
            Apply {surface.letter} to the site
          </Button>
          <Button variant="ghost" onClick={clearAll}>
            Clear
          </Button>
          <CellLabel className="max-w-md">
            {applied ? (
              <>
                Applied site-wide:{" "}
                <span className="text-foreground">{applied.label}</span>. It
                rides every lab page, every marketing page and the app, with the
                key.
              </>
            ) : (
              "Nothing applied. The site is on its baked values."
            )}
          </CellLabel>
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
              tile. The live column reads the tuner, so a knob moves it and
              every real page together.
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
            <div className="grid min-w-[64rem] grid-cols-[7rem_repeat(5,minmax(0,1fr))] gap-x-4 gap-y-7">
              <div />
              {COLUMNS.map((c) => (
                <div key={c.id} className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium">
                    {c.letter}
                    {c.values ? (
                      <span className="ml-1.5 text-muted-foreground tabular-nums">
                        {c.values.radius} / {c.values.float} / {c.values.tile}
                      </span>
                    ) : null}
                  </p>
                  <CellLabel className="min-h-[4.5rem]">
                    {c.rationale}
                  </CellLabel>
                  {c.values ? (
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
                  ) : (
                    <CellLabel>Drag a knob in the panel.</CellLabel>
                  )}
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
                  {COLUMNS.map((c) => (
                    <div
                      key={c.id}
                      style={overrideStyle(c, action)}
                      data-rnd-ladder={ladder}
                      className="min-w-0"
                    >
                      {row.cell(c, live)}
                    </div>
                  ))}
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
              Switch candidates to flicker between them. This is a stage, so on
              desktop the corner is drawn at about 69 percent of its true size,
              and on the phone canvas at 1:1.
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
        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            ariaLabel="Composition"
            options={COMPOSITION_OPTIONS}
            value={composition}
            onChange={setComposition}
          />
          <Toggle
            ariaLabel="Viewport"
            options={[
              { id: "desktop" as Mode, label: "Desktop 1440" },
              { id: "phone" as Mode, label: "Phone 375" },
            ]}
            value={mode}
            onChange={setMode}
          />
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
        </div>
        <Variant
          n={1}
          name={`${surface.letter}, ${action.name.split(",")[0].toLowerCase()} actions`}
          rationale={surface.rationale}
          framed={false}
        >
          <Stage
            mode={mode}
            ground={ground}
            height={mode === "phone" ? 900 : 780}
          >
            <div
              className="h-full overflow-y-auto"
              style={overrideStyle(surface, action)}
              data-rnd-ladder={ladder}
            >
              <Composition id={composition} mode={mode} />
            </div>
          </Stage>
        </Variant>
      </Part>

      <Part
        n="C"
        title="Nested corners"
        lede={
          <>
            <p>
              Bible 9: anything drawn around an object takes the object&apos;s
              radius plus its offset. It costs nothing at a 2px base and it is
              the first thing that breaks when the base goes round, so each
              candidate draws the same two shapes twice, once with the
              arithmetic and once with the token reused. The right half of each
              pair is what a card with a full-bleed plate and a ring at an
              offset look like when nobody does the subtraction.
            </p>
            <p>
              The beam is the case that already gets this right: BorderBeam
              reads its child&apos;s computed radius instead of taking a
              literal, which is why the pro card&apos;s ring will follow
              whatever this board rules, and why it must never be passed a
              number.
            </p>
          </>
        }
      >
        <div className="rnd-wide">
          <div className="overflow-x-auto pb-1">
            <div className="grid min-w-[64rem] grid-cols-[7rem_repeat(5,minmax(0,1fr))] gap-x-4">
              <div className="pt-1">
                <p className="text-[11px] font-medium text-foreground">
                  Concentric, or not
                </p>
                <CellLabel className="mt-1.5">
                  inner = outer minus the padding. A ring at 6px offset = the
                  radius plus 6.
                </CellLabel>
              </div>
              {COLUMNS.map((c) => (
                <div
                  key={c.id}
                  style={overrideStyle(c, action)}
                  data-rnd-ladder={ladder}
                  className="min-w-0"
                >
                  <p className="mb-2 text-sm font-medium">{c.letter}</p>
                  <NestedSpecimen
                    radius={
                      c.values ? c.values.radius : (live?.["--radius"] ?? null)
                    }
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
              Note what it does at today&apos;s base, in the first two columns
              of numbers: nothing. It is a change that costs nothing now and is
              the difference between a plan card at{" "}
              {px(stepValue(14, "stock", "2xl"))} and{" "}
              {px(stepValue(14, "quarters", "2xl"))} if the base ever moves.
            </p>
          </>
        }
      >
        <div className="rnd-wide">
          <div className="overflow-x-auto pb-1">
            <div className="grid min-w-[60rem] grid-cols-[3.5rem_7rem_7rem_1fr_minmax(0,10rem)_minmax(0,10rem)] items-center gap-x-4 gap-y-4">
              <CellLabel className="font-medium text-foreground">
                Step
              </CellLabel>
              <CellLabel className="font-medium text-foreground">
                Stock at {px(base)}
              </CellLabel>
              <CellLabel className="font-medium text-foreground">
                Quarters at {px(base)}
              </CellLabel>
              <CellLabel className="font-medium text-foreground">
                Where it lands
              </CellLabel>
              <CellLabel className="font-medium text-foreground">
                Stock
              </CellLabel>
              <CellLabel className="font-medium text-foreground">
                Quarters
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
                    <CellLabel>
                      {LADDERS.stock[step]}x ={" "}
                      {px(stepValue(base, "stock", step))}
                    </CellLabel>
                    <CellLabel>
                      {LADDERS.quarters[step]}x ={" "}
                      {px(stepValue(base, "quarters", step))}
                    </CellLabel>
                    <CellLabel>
                      {site.uses} uses: {site.where}
                      {dead ? ". A candidate for deletion." : ""}
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
              The three action tokens name a 40px, a 48px and a 32px button.
              Only the 32px one is the product: the default Button is h-8, and
              the in-between sizes derive from --radius-action at 0.6, 0.7 and
              0.9. --radius-action itself has three call sites, all in the reel,
              and --radius-action-lg has one. Every marketing CTA on the site is
              size lg forced to h-11, so it wears 0.9x of a token defined for a
              height it does not have.
            </p>
            <p>
              Each rung below is applied to every shipped height at once with
              the ratio printed. The pill is the only rung whose shape does not
              depend on the height, which is what makes the h-11 CTA a non-issue
              under it and a rounding error under the other two.
            </p>
          </>
        }
      >
        <div className="rnd-wide">
          <div className="overflow-x-auto pb-1">
            <div className="grid min-w-[52rem] grid-cols-[11rem_repeat(3,minmax(0,1fr))] gap-x-4 gap-y-5">
              <div />
              {ACTIONS.map((a) => (
                <div key={a.id} className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium">{a.name}</p>
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
            </div>
          </div>
        </div>
        <Proposal>
          Today&apos;s rung, and give the CTA a real size. The pill is a
          different product and quiet gives up the second half of bible 8; what
          is actually broken is that the loudest action on the site is an ad-hoc
          h-11 with a className, so the ruling should add a cta size to the
          Button (h-11 at 1.1 x --radius-action) and retire --radius-action-lg,
          which names a height nothing uses.
        </Proposal>
      </Part>

      <BoardMeta
        question={QUESTION}
        candidates={[
          ...SURFACES.filter((s) => s.values).map((s) => ({
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

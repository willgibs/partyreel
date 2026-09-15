"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useRef, useState, useSyncExternalStore } from "react";

import {
  BoardMeta,
  Toggle,
  clearCandidate,
  setCandidateCss,
  useTunerCandidate,
  type Ground,
  type Mode,
} from "@/components/dev/board";
import { withDesignKey } from "@/lib/design-gate/links";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

import { BIBLE } from "../../rules/bible";
import {
  REDUCED_MOTION_CSS,
  contractCss,
  contractLabel,
  entranceCss,
  lightCss,
  radiusCss,
  type EntranceRung,
  type LightRung,
  type RadiusRung,
} from "./candidates";
import {
  RAMPS,
  RAMP_LABEL,
  RUNGS,
  WALK,
  type Dim,
  type Ramp,
} from "./constants";
import { Frame, MountProvider, useMountOnApproach } from "./frame";

/** A ladder asks for exactly the width its rungs need, so it renders 1:1 in the
 *  lab column: judging a 6px corner against a 12px one at half scale judges the
 *  scale. Above 768, so `sm:` still resolves on the desktop side. */
const ladderWidth = (dim: Dim) => Math.max(800, RUNGS[dim].length * 230);

/**
 * THE FLOATING-SURFACES BOARD, rounds two and three (2026-09-14).
 *
 * ROUND THREE walked it the way Will will and spent itself on one thing: making
 * the ruling cheap. Four changes.
 *
 * 1  THE BOARD OPENS WITH WHERE IT LANDS. Five lines, one recommended answer
 *    each, and one button that applies the whole recommendation to the site. The
 *    rows below are the evidence for those five lines, in the order they carry
 *    weight, so a ruling can be "all five" in two words or a rung name in one.
 * 2  THREE RUNGS WERE CUT, because a rung has to be a different ANSWER. The
 *    "lighter is closer" light rung WAS today (its block set the declaration the
 *    panel already carries, so the ladder showed one column twice); the lit-edge
 *    rung is ruled out by the light board's own doctrine (the lit face is
 *    material, not elevation); and "origin true" answers how a panel moves
 *    rather than how fast, which is not the question rule 12 and rule 15
 *    disagree about. candidates.ts says each in full where the rung used to be.
 * 3  THE COST IS MEASURED AND CUT. Nineteen documents cost 1020 requests and
 *    5.7s to settle, which is a slow first paint before the first row says
 *    anything. Frames now mount BY ROW, a viewport ahead of arrival (frame.tsx);
 *    the corner strip dropped 96 photographs it was hiding its own corners
 *    behind; the entrance ladder went with its rung. Every frame smaller than
 *    its canvas says so on its face, so nobody rules on a size nobody ships.
 * 4  THE ASKS ARE ONE WORD EACH, and every departure left standing is one Will
 *    has to rule on. The build findings moved to the manifest, where the
 *    Orchestrator reads them.
 *
 * THE BOARD, round two (2026-09-14).
 *
 * Round one put all the primitives on one canvas and found that the contract
 * misses bible 9 inside itself. It was a good finding badly shown: the
 * arithmetic was in a caption, the candidates were stage-local CSS that only
 * resembled what a ruling would land, and the surface most people on this
 * product actually touch was not on the board at all.
 *
 * Round two rebuilt it from the ground up around three changes.
 *
 * 1  EVERY RUNG IS ITS OWN PASTE. candidates.ts generates each candidate as real
 *    CSS against the primitives' own data-slots, in three scopes, and the board
 *    renders the very same string it hands the site through setCandidateCss. So
 *    "Apply to the site" is not a demo of a candidate, it IS the candidate, and
 *    Will rules it on the real header nav, a real dropdown, a real dialog and
 *    the guest surface rather than only on a stage.
 * 2  THE GUEST SURFACE IS THE PRIMARY SPECIMEN, because it is the floating
 *    layer this product is mostly made of: every guest who scans a QR meets it
 *    at 375 before they see anything else. It is also a tenth primitive nobody
 *    counted, a raw vaul drawer inside guest/entry-shell.tsx that never goes
 *    through ui/drawer.tsx and carries a literal radius.
 * 3  THE FINDING IS MEASURED, NOT ASSERTED. Row 2 reads the panel's radius, its
 *    padding and the lit row's radius off the live DOM and draws all three at
 *    6x, so the rule-9 miss is a picture and a number rather than a claim, and
 *    a rung that says it nests is checked by the board proposing it.
 *
 * Nothing under src/components/ui is edited: every candidate reaches the
 * primitives from outside, exactly as the paste would.
 */

const QUESTION =
  "If the floating layer were designed today, what is its radius, its entrance and its light on every ground, what happens to the primitives that stand outside it, and does the contract reach the surface a guest actually meets?";

/** WHERE THE BOARD LANDS. One recommended answer per ask, in the order the rows
 *  below argue them, so the walk can be "yes to all five" and the rows are the
 *  evidence rather than the decision. Each line names the rung, the reason in
 *  one sentence, and what it costs, because a recommendation with no cost in it
 *  is a sales pitch. */
const LANDING: { ask: string; answer: string; why: string; row: number }[] = [
  {
    ask: "Radius",
    answer: "nested",
    why: "The only rung that changes one number: today's 8px container stays ratified and the rows rise 4px to nest inside it, which is the miss row 2 measures. Sharp and round both move the container as well, and neither buys anything the nest does not.",
    row: 2,
  },
  {
    ask: "Entrance",
    answer: "by frequency",
    why: "Rule 12 is the house's motion doctrine and a tooltip is opened fifty times in an evening: 90ms with no zoom is right for it and sluggish for a dialog. The finding underneath is a wording one, and it is Will's: rule 15's one entrance is one LANGUAGE (a fade, origin-aware, exits faster than enters), and rule 12 sets the clock inside it. Read that way the two rules never disagreed.",
    row: 5,
  },
  {
    ask: "Light in dark",
    answer: "today",
    why: "It follows the light board rather than being ruled twice: the shadow rung is --lgt-float from docs/specs/light.md to the byte, so if a shadow comes back in dark there, this family takes it at those numbers. Until then today stands, because the popover already sits lighter than the card it opens from.",
    row: 4,
  },
  {
    ask: "The edge family",
    answer: "the drawer",
    why: "Vaul is in the product whatever is ruled, because the guest surface needs the drag, so keeping the drawer is what lets the tenth surface join the family instead of staying a bespoke one. The cost is real and named: the marketing mobile menu changes primitive (its one call site) and ui/sheet.tsx goes.",
    row: 7,
  },
  {
    ask: "The select",
    answer: "keep",
    why: "A form field is a listbox, and a dropdown with radio items is a menu wearing one: typeahead, the value semantics and the label all come free in the primitive and have to be rebuilt in the replacement. Five lines bring it onto the contract. Row 7 shows both, so the cheaper answer is there to take.",
    row: 7,
  },
];

const CANDIDATES = [
  {
    name: "Radius, nested (what this board recommends)",
    rationale:
      "Today's ratified container, corrected: the 8px stays and the rows rise to 4px so the lit row nests inside the corner. The smallest true change, and it follows the rounding round's retune of --radius-float by itself.",
  },
  {
    name: "Radius, sharp",
    rationale:
      "A floating layer is a surface, so it keeps the sharp family: rows at the 1.6px surface radius, the panel at rows plus their 4px padding, big boxes at double. The panel is only as round as what it holds.",
  },
  {
    name: "Radius, round",
    rationale:
      "A menu is a cluster of things you press, so the rows take the action family at row height (8px) and the container follows at 12px. Ties menus to buttons instead of to cards.",
  },
  {
    name: "Entrance, by frequency (what this board recommends)",
    rationale:
      "Rule 12 taken literally, applied to the family rather than to one control: a tooltip or a menu is opened fifty times in an evening, so it lands in 90ms with no zoom, while a dialog or a toast stays occasional at 220ms. Two clocks, one language.",
  },
  {
    name: "Entrance, one clock",
    rationale:
      "Rule 15 taken literally: one origin-aware zoom-fade for the whole family, 175ms in and 120ms out on the emphasis curve. One entrance is the half of the rule that is easiest to keep, and the half a fifty-times-an-evening surface pays for.",
  },
  {
    name: "Light in dark, a soft shadow",
    rationale:
      "The light board's own --lgt-float family, adopted here rather than invented: one geometry, two sizes, one alpha ramp per ground. Two boards proposing two dark shadows would be the exact failure rule 15 exists to prevent, so this rung makes the two rulings one. The alternative is what ships: nothing casts in dark and the ring draws the edge.",
  },
  {
    name: "The reduced-motion patch (free, optional, competes with nothing)",
    rationale:
      "Not a candidate, and not the hole round one called it. globals.css has carried a global reduce guard since 2026-06-11 that clamps every animation and transition to 0.01ms, so the floating layer does not animate for a reader who asked for less motion. What the layer lacks is bible 14's FIRST line, a gate of its own, and this paste is that: a stop rather than a clamp.",
  },
];

/** One word each, and the recommendation is on the board above them. */
const ASKS = [
  "The radius: sharp, nested or round (this board says nested)",
  "The entrance: one clock or by frequency (this board says by frequency, and that rule 15 means one language)",
  "The light in dark: today or the shadow (this board says whatever the light board is ruled, since the numbers are the same)",
  "The edge family: sheet or drawer (this board says drawer, and the guest entry shell adopts it)",
  "The select: keep or drop (this board says keep, on the contract)",
];

/** Only what Will has to rule on. The findings the build turned up (the ring a
 *  bare box-shadow deletes, the panel-scoped dark values, the eager backdrops,
 *  the nav viewport's width, the iframe stage) are in the manifest, where the
 *  Orchestrator reads them: they are true whatever is ruled here and none of
 *  them is a choice. */
const DEPARTURES = [
  "The family is TEN surfaces, not nine. guest/entry-shell.tsx renders a raw vaul drawer that never goes through ui/drawer.tsx, and it is the floating layer most people on this product will ever see. It carries a literal radius, calc(var(--radius-action) * 1.4), the second literal on the layer after the tooltip arrow's. Every rung here reaches it through [data-entry-drawer], and the edge ask decides whether it joins the family or stays bespoke.",
  "Today's contract misses bible 9 inside itself: an 8px panel around 1.6px rows in 4px of padding does not nest. Row 2 measures it off the live DOM at 6x. Every rung fixes it; the ruling is which end to anchor.",
  "A FINDING AGAINST RULE 15, not a quiet choice. Rule 15's one entrance and rule 12's animate-by-frequency disagree on this family as they are written. The board recommends reading rule 15's line as one entrance LANGUAGE (a fade beside whatever else moves, an origin-aware transform-origin, exits faster than enters) with rule 12 setting the clock inside it. That is a bible edit and it is Will's to make.",
  "The shadow rung puts a shadow in DARK, which the shipped elevation contract still forbids by name (--shadow-float is zeroed in .dark and .surface-ink). It is the light board's proposed family verbatim (docs/specs/light.md), so the two boards are one ruling and not two.",
];

const GROUNDS: { id: Ground; label: string }[] = [
  { id: "cinema", label: "Cinema" },
  { id: "paper", label: "Paper" },
  { id: "ink", label: "Ink" },
  { id: "app-dark", label: "App dark" },
  { id: "app-light", label: "App light" },
];

type SceneId = "family" | "overlay" | "edge";
type Outlier = "select" | "sheet" | "drawer";

function rule(n: number): string {
  return BIBLE.find((r) => r.n === n)?.statement ?? "";
}

function Row({
  n,
  name,
  note,
  eager = false,
  children,
}: {
  n: number;
  name: string;
  note: string;
  /** The rows a reader meets before they can scroll; everything else mounts a
   *  viewport before it arrives (frame.tsx, Mount). */
  eager?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const mounted = useMountOnApproach(ref, eager);
  return (
    <section
      ref={ref}
      className="flex scroll-mt-40 flex-col gap-3"
      id={`flt-row-${n}`}
    >
      <div>
        <p className="text-sm font-semibold">
          <span className="mr-2 inline-flex size-5 items-center justify-center rounded-md bg-foreground text-[11px] tabular-nums text-background">
            {n}
          </span>
          {name}
        </p>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {note}
        </p>
      </div>
      <MountProvider value={mounted}>{children}</MountProvider>
    </section>
  );
}

/** THE APPLY BUTTON: one candidate, as the paste a ruling would land, handed to
 *  the whole site. The label is the identity, so a second press on the applied
 *  one clears it and pressing another replaces it. */
function Apply({ label, css }: { label: string; css: string }) {
  const candidate = useTunerCandidate();
  const on = candidate?.label === label;
  return (
    <button
      type="button"
      onClick={() => (on ? clearCandidate() : setCandidateCss(label, css))}
      aria-pressed={on}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]",
        on
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {on ? "Applied to the site, clear" : "Apply to the site"}
    </button>
  );
}

/** A ladder's rungs, each with its own paste. The row of buttons sits under the
 *  frame in the rungs' own order, so the button under a rung is that rung. */
function ApplyRow({
  dim,
  build,
}: {
  dim: Dim;
  build: (value: string) => { label: string; css: string } | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {RUNGS[dim].map((r) => {
        const value = r.id ? r.id.slice(6) : "";
        const built = value ? build(value) : null;
        return (
          <div key={r.label} className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">{r.label}</span>
            {built ? (
              <Apply label={built.label} css={built.css} />
            ) : (
              <span className="text-[11px] text-muted-foreground/60">
                is what ships
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** The lab's key, read from the address bar rather than through
 *  `useSearchParams()`. The dispatcher that renders this board (design/c) owns no
 *  Suspense boundary for it, and a client component that reads search params
 *  without one suspends its subtree: the lab nav's own boundary was left hanging
 *  and every frame stayed unmounted. An effect costs one render and needs
 *  nothing from anyone else's tree. */
const noop = () => () => {};
const readKey = () => new URLSearchParams(window.location.search).get("key");
// undefined = not read yet. A frame must not load before then: on the preview
// the scene route is gated, so a keyless first src would 404 and then reload.
// useSyncExternalStore rather than an effect, so the value arrives with the
// first post-hydration render instead of one render later.
const noKeyYet = () => undefined;

function useDesignKey(): string | null | undefined {
  return useSyncExternalStore(noop, readKey, noKeyYet);
}

/** Whether this reader asked for less motion. Not a nicety: with the preference
 *  on, every entrance on this board is a jump cut (globals.css clamps animation
 *  and transition to 0.01ms), so "Replay every entrance" is a button that does
 *  nothing visible, and a board that lets a stranger press it twice and doubt
 *  the board is a board with a broken control. It says so instead. */
const REDUCE = "(prefers-reduced-motion: reduce)";
function subscribeReduce(cb: () => void) {
  const mq = window.matchMedia(REDUCE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduce,
    () => window.matchMedia(REDUCE).matches,
    () => false,
  );
}

export function FloatingSurfacesBoard() {
  const designKey = useDesignKey();
  const candidate = useTunerCandidate();

  const [mode, setMode] = useState<Mode>("desktop");
  const [ground, setGround] = useState<Ground>("cinema");
  const [ramp, setRamp] = useState<Ramp>("today");
  const [scene, setScene] = useState<SceneId>("family");
  const [variant, setVariant] = useState<"sheet" | "drawer">("sheet");
  // The three knobs OPEN on what the board recommends (LANDING above), so the
  // first thing on screen is the proposal and every rung is the alternative.
  const [radius, setRadius] = useState("nested");
  const [entrance, setEntrance] = useState("by-frequency");
  const [light, setLight] = useState("off");
  const [outlier, setOutlier] = useState<Outlier>("select");
  const [replay, setReplay] = useState(0);
  const reduced = useReducedMotion();
  const boardRef = useRef<HTMLDivElement | null>(null);

  /** "Replay every entrance" has to DO something from wherever it is pressed.
   *  Below sm the control bar is static at the top of the document (sticky, it
   *  stands 310px tall and covers the specimen), so the press can land with no
   *  frame on screen at all, and round three's first pass then dropped it: a
   *  control that did nothing visible, which is the exact stumble this round set
   *  out to remove. Two halves fix it. `Frame` remembers a press it could not
   *  run and plays it the moment the frame arrives; this half carries you to the
   *  nearest frame, so the arrival is the press rather than a scroll away. When
   *  a frame IS on screen nothing moves, which is every press at 1440. */
  const replayEverything = () => {
    setReplay((n) => n + 1);
    const root = boardRef.current;
    if (!root) return;
    const frames = Array.from(root.querySelectorAll("iframe"));
    const vh = window.innerHeight;
    const anyOnScreen = frames.some((f) => {
      const r = f.getBoundingClientRect();
      return r.bottom > 0 && r.top < vh;
    });
    if (anyOnScreen) return;
    const next =
      frames.find((f) => f.getBoundingClientRect().top >= 0) ?? frames.at(-1);
    next?.scrollIntoView({
      block: "center",
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const knobs = { radius, entrance, light };
  const phone = mode === "phone";
  const contract = {
    radius: radius as RadiusRung | "off",
    entrance: entrance as EntranceRung | "off",
    light: light as LightRung | "off",
  };
  const demo = env.NEXT_PUBLIC_DEMO_QR_TOKEN;
  // A select opens beside its trigger near the top of the canvas and needs no
  // more canvas than that; an edge panel needs the whole phone to enter across.
  // Round two gave all three 520 and two thirds of the select column was empty.
  const outlierHeight = outlier === "select" ? 360 : 520;

  /** The recommendation as one paste: the two knobs the board actually
   *  recommends changing. The light stays as it ships, because that ruling
   *  belongs to the light board and the numbers are already the same. */
  const recommended = {
    radius: "nested" as RadiusRung,
    entrance: "by-frequency" as EntranceRung,
    light: "off" as const,
  };

  return (
    <div ref={boardRef} className="flex flex-col gap-10 py-4">
      {/* The board's own question is NOT repeated here. The touchpoint header
          above states the subject, BoardMeta carries the question in full at the
          foot, and a third paragraph between them was pushing the one thing a
          reader needs first below the fold. */}
      {/* WHERE THIS LANDS, before anything that needs scrolling. The rows are
          the evidence for these five lines; the number beside each one is the
          row that argues it. */}
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">Where this board lands</p>
          <p className="text-[11px] text-muted-foreground">
            Five answers, one word each. The rows below are the evidence, in the
            order they carry weight.
          </p>
        </div>
        <dl className="flex flex-col gap-2">
          {LANDING.map((l) => (
            <div
              key={l.ask}
              className="grid gap-x-3 gap-y-1 sm:grid-cols-[11rem_minmax(0,1fr)]"
            >
              <dt className="text-xs">
                <span className="text-muted-foreground">{l.ask}: </span>
                <strong className="font-semibold">{l.answer}</strong>
              </dt>
              <dd className="text-xs leading-relaxed text-muted-foreground">
                {l.why}{" "}
                <a
                  className="whitespace-nowrap underline underline-offset-2"
                  href={`#flt-row-${l.row}`}
                >
                  Row {l.row}
                </a>
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-[11px] text-muted-foreground">
            The two knobs this recommends, as one paste:
          </span>
          <Apply
            label={contractLabel(recommended)}
            css={contractCss(recommended, "site")}
          />
          <span className="text-[11px] text-muted-foreground">
            Then walk the pages in row 9. The light is not in it on purpose:
            that ruling belongs to the light board, at the same numbers.
          </span>
        </div>
      </section>

      {/* The bar is sticky from sm up and static on a phone: at 375 it stands
          310px tall, which is 38 percent of the viewport, and a control bar that
          covers the specimen is worse than one you scroll back to. What static
          costs is that Replay can be pressed with no frame on screen; that is
          paid for in `replayEverything` above and in Frame's deferred replay,
          not by covering the specimen. */}
      <div className="z-20 -mx-4 flex flex-col gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:sticky sm:top-0">
        <div className="flex flex-wrap items-center gap-2">
          <Toggle
            ariaLabel="Radius"
            options={[
              { id: "off", label: "Radius: today" },
              { id: "sharp", label: "sharp" },
              { id: "nested", label: "nested" },
              { id: "round", label: "round" },
            ]}
            value={radius}
            onChange={setRadius}
          />
          <Toggle
            ariaLabel="Entrance"
            options={[
              { id: "off", label: "Entrance: today" },
              { id: "one-clock", label: "one clock" },
              { id: "by-frequency", label: "by frequency" },
            ]}
            value={entrance}
            onChange={setEntrance}
          />
          <Toggle
            ariaLabel="Light"
            options={[
              { id: "off", label: "Light: today, nothing casts in dark" },
              { id: "shadow", label: "a soft shadow" },
            ]}
            value={light}
            onChange={setLight}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle
            ariaLabel="Ground"
            options={GROUNDS}
            value={ground}
            onChange={setGround}
          />
          <Toggle
            ariaLabel="Ramp"
            options={RAMPS.map((r) => ({ id: r, label: RAMP_LABEL[r] }))}
            value={ramp}
            onChange={setRamp}
          />
          <Toggle
            ariaLabel="Viewport"
            options={[
              { id: "desktop" as Mode, label: "1440" },
              { id: "phone" as Mode, label: "375" },
            ]}
            value={mode}
            onChange={setMode}
          />
          <button
            type="button"
            onClick={replayEverything}
            className="rounded-lg border border-border px-3 py-1 text-[12px] font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted active:scale-[0.97]"
          >
            Replay every entrance
          </button>
          {reduced ? (
            <span className="text-[11px] text-muted-foreground">
              Reduced motion is on, so every entrance here is a jump cut by
              design and Replay will look like it did nothing. That is bible 14
              holding; row 8 says how.
            </span>
          ) : null}
          {/* Distinct from the landing block's button on purpose: that one is
              fixed to the recommendation, this one follows whatever the three
              knobs are set to right now. */}
          <span className="text-[11px] text-muted-foreground">
            The knobs as you have them, as one paste:
          </span>
          <Apply
            label={contractLabel(contract)}
            css={contractCss(contract, "site")}
          />
        </div>
        {candidate ? (
          <p className="text-[11px] text-muted-foreground">
            On the site now: <strong>{candidate.label}</strong>. It rides every
            lab page, every marketing page and the host app (all with the key),
            and it stays until you clear it. The frames on this board are
            deliberately excluded, so the rungs below keep telling the truth.
          </p>
        ) : null}
      </div>

      <Row
        n={1}
        eager
        name="The guest surface at 375, the one most people meet"
        note="Not ui/sheet.tsx: guest/entry-shell.tsx renders a raw vaul drawer with its own radius literal, and it is the first thing every guest sees after the QR. The contract has to reach it or it is not a contract. Beside it is the house sheet on its real side: its one product call site is the marketing mobile menu, which enters from the TOP, so the two corners that stay on screen there are the bottom two."
      >
        <div className="flex flex-wrap gap-4">
          <div
            className="flex min-w-0 max-w-full flex-col gap-2"
            style={{ flexBasis: 375 }}
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              The real EntryShell, on the knobs above
            </p>
            <Frame
              label="The guest entry surface"
              scene="guest"
              ground={ground}
              ramp={ramp}
              mode="phone"
              fit={375}
              replay={replay}
              designKey={designKey}
              {...knobs}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              ui/sheet.tsx as it is actually used: the marketing mobile menu,
              which enters from the TOP
            </p>
            <Frame
              label="The house sheet at 375"
              scene="edge"
              variant="sheet"
              side="top"
              ground={ground}
              ramp={ramp}
              mode="phone"
              fit={375}
              replay={replay}
              designKey={designKey}
              {...knobs}
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          The big box under each rung, on the side the product actually uses: a
          top sheet at 375, its two bottom corners at 1:1. The ground is calm
          here rather than photographic, because a corner is read at the corner
          and a photograph behind an 8px arc hides the thing being compared.
        </p>
        <div className="flex flex-wrap gap-3">
          {RUNGS.radius.map((r) => (
            <div
              key={r.label}
              className="flex min-w-0 max-w-full flex-col gap-1"
              style={{ flexBasis: 375 }}
            >
              <span className="text-[11px] font-medium">
                {r.id ? r.label : "today, as it ships"}
              </span>
              <Frame
                label={`Sheet corners, ${r.label}`}
                scene="edge"
                variant="sheet"
                side="top"
                compact
                rung={r.id || undefined}
                ground={ground}
                ramp={ramp}
                mode="phone"
                height={200}
                fit={375}
                replay={replay}
                designKey={designKey}
              />
            </div>
          ))}
        </div>
      </Row>

      <Row
        n={2}
        name="The corner, measured"
        note="The finding the round turned on, at 6x, read off the live DOM rather than claimed in a caption. The solid outer arc is the panel, the solid inner arc is the lit row, and the dashed arc is where the row's corner has to sit for the two to share a centre (bible 9: the container is the object plus its offset). On today's rung the dashed arc and the row's arc are different lines, and they are the same line on all three candidates. That is the whole argument for changing anything."
      >
        <div className="flex flex-wrap gap-3">
          {RUNGS.radius.map((r) => (
            <div
              key={r.label}
              className="flex min-w-0 max-w-full flex-col gap-1"
              style={{ flexBasis: 236 }}
            >
              <span className="text-[11px] font-medium">{r.label}</span>
              <Frame
                label={`Corner, ${r.label}`}
                scene="nest"
                rung={r.id || undefined}
                ground={ground}
                ramp={ramp}
                mode="desktop"
                width={236}
                height={330}
                fit={236}
                replay={replay}
                designKey={designKey}
              />
            </div>
          ))}
        </div>
      </Row>

      <Row
        n={3}
        name="The radius ladder"
        note="The same menu, four rungs, one frame, so the families can be compared rather than the numbers. Each rung obeys rule 9 from a different end: the surface family, today's container corrected, or the action family. Every rung is a complete paste: press the button under it and the real header nav, a real dropdown, the dialogs and the guest drawer all take it."
      >
        <Frame
          label="Radius ladder"
          scene="ladder"
          dim="radius"
          ground={ground}
          ramp={ramp}
          mode={mode}
          width={phone ? undefined : ladderWidth("radius")}
          // Shorter than the light ladder on purpose: this one stands on a calm
          // ground (a corner is read at the corner), so the room under the menus
          // is dead space rather than the content the panel floats over.
          height={phone ? 430 : 250}
          replay={replay}
          designKey={designKey}
        />
        <ApplyRow
          dim="radius"
          build={(v) => ({
            label: `Floating radius: ${v}`,
            css: radiusCss(v as RadiusRung, "site"),
          })}
        />
      </Row>

      <Row
        n={4}
        name="The light in dark, over the palette's ramps"
        note="A floating layer's light in dark is a question about the ground it floats over, so the ramp is a knob. Today's dark popover sits lighter than the card it opens from (0.245 over 0.21, the palette board's finding), and that gap is the whole reason nothing needs to cast; ramp A widens it, ramp B makes every dark surface one room. Walk both answers on today, then on A, then on B, and check on paper that whichever wins leaves the light side standing. Round three cut two rungs here: 'lighter is closer' WAS today (its paste set the declaration the panel already carries), and the lit edge belongs to the light board's material face, not to a layer over content."
      >
        <Frame
          label="Light ladder"
          scene="ladder"
          dim="light"
          ground={ground}
          ramp={ramp}
          mode={mode}
          width={phone ? undefined : ladderWidth("light")}
          height={phone ? 470 : 300}
          replay={replay}
          designKey={designKey}
        />
        <ApplyRow
          dim="light"
          build={(v) => ({
            label: `Floating light: ${v}`,
            css: lightCss(v as LightRung, "site"),
          })}
        />
      </Row>

      <Row
        n={5}
        name="The entrance: rule 12 against rule 15"
        note="Not a number, a principle. Two ratified rules disagree on this family as they are written, and the two frames below are each rule taken literally on the same three primitives: the tooltip (the highest-frequency surface on the site), the menu, and the dialog. Press Replay and watch them together. Rule 15 asks the family to move as one; rule 12 asks each surface to move at the rate a person meets it. The board's reading is that rule 15 means one entrance LANGUAGE, and that a wording change to it is the whole disagreement: a third rung, origin true, was here in round two and is cut, because it answers how a panel moves rather than how fast."
      >
        <div className="grid gap-2 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground sm:grid-cols-2">
          <p>
            <strong className="text-foreground">Rule 12.</strong> {rule(12)}
          </p>
          <p>
            <strong className="text-foreground">Rule 15.</strong> {rule(15)}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {(["one-clock", "by-frequency"] as const).map((e) => (
            <div key={e} className="flex flex-col gap-1">
              <span className="text-[11px] font-medium">
                {e === "one-clock"
                  ? "One clock, rule 15: the family moves as one"
                  : "By frequency, rule 12: the tooltip and the menu land in 90ms, the dialog keeps its beat"}
              </span>
              <Frame
                label={`Entrance, ${e}`}
                scene="trio"
                rung={`flt-e-${e}`}
                ground={ground}
                ramp={ramp}
                mode="desktop"
                width={900}
                height={300}
                fit={900}
                replay={replay}
                designKey={designKey}
              />
            </div>
          ))}
        </div>
        <ApplyRow
          dim="entrance"
          build={(v) => ({
            label: `Floating entrance: ${v}`,
            css: entranceCss(v as EntranceRung, "site"),
          })}
        />
      </Row>

      <Row
        n={6}
        name="The contract, live"
        note="The whole family held open together on the ground being judged, so a stray one reads as a stray one. This is the canvas rule 15 is actually about. The knobs at the top drive it; a ruling here is three words."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Toggle
            ariaLabel="Family"
            options={[
              { id: "family" as SceneId, label: "Menus" },
              { id: "overlay" as SceneId, label: "Overlays" },
              { id: "edge" as SceneId, label: "Edges" },
            ]}
            value={scene}
            onChange={setScene}
          />
          {scene === "edge" ? (
            <Toggle
              ariaLabel="Edge primitive"
              options={[
                { id: "sheet" as const, label: "Sheet" },
                { id: "drawer" as const, label: "Drawer" },
              ]}
              value={variant}
              onChange={setVariant}
            />
          ) : null}
        </div>
        <Frame
          label="The contract, live"
          scene={scene}
          ground={ground}
          ramp={ramp}
          mode={mode}
          variant={variant}
          replay={replay}
          designKey={designKey}
          {...knobs}
        />
      </Row>

      <Row
        n={7}
        name="The outliers, and what replaces them"
        note="Three columns, so the ask is a choice between two real things rather than a word. Left is as it ships, middle is the same primitive on the contract you have set above, right is the answer if it is dropped: the surface that takes its work, already on the contract. Select has one product call site, the sheet has one (the marketing mobile menu), and ui/drawer.tsx has none at all, so the honest version of the ask is which ONE edge primitive survives and whether the guest entry shell then adopts it."
      >
        <Toggle
          ariaLabel="Outlier"
          options={[
            { id: "select" as Outlier, label: "Select" },
            { id: "sheet" as Outlier, label: "Sheet" },
            { id: "drawer" as Outlier, label: "Drawer" },
          ]}
          value={outlier}
          onChange={setOutlier}
        />
        {/* The three wrap below ~1100: two 375 canvases in a 343 column would
            each be scaled to a third, which judges the scale rather than the
            primitive. */}
        <div className="flex flex-wrap gap-3">
          <div
            className="flex min-w-0 grow flex-col gap-2"
            style={{ flexBasis: 300 }}
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              As it ships
            </p>
            <Frame
              label="Outlier today"
              scene={outlier === "select" ? "select" : "edge"}
              variant={outlier === "drawer" ? "drawer" : "sheet"}
              ground={ground}
              ramp={ramp}
              mode="phone"
              height={outlierHeight}
              replay={replay}
              designKey={designKey}
            />
          </div>
          <div
            className="flex min-w-0 grow flex-col gap-2"
            style={{ flexBasis: 300 }}
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              On the contract
            </p>
            <Frame
              label="Outlier on the contract"
              scene={outlier === "select" ? "select" : "edge"}
              variant={outlier === "drawer" ? "drawer" : "sheet"}
              ground={ground}
              ramp={ramp}
              mode="phone"
              height={outlierHeight}
              replay={replay}
              designKey={designKey}
              {...knobs}
            />
          </div>
          <div
            className="flex min-w-0 grow flex-col gap-2"
            style={{ flexBasis: 300 }}
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              {outlier === "select"
                ? "Dropped: the dropdown with radio items"
                : outlier === "sheet"
                  ? "Dropped: the drawer takes the bottom case"
                  : "Dropped: the sheet takes the bottom case"}
            </p>
            <Frame
              label="The replacement"
              scene={outlier === "select" ? "radio" : "edge"}
              variant={outlier === "drawer" ? "sheet" : "drawer"}
              ground={ground}
              ramp={ramp}
              mode="phone"
              height={outlierHeight}
              replay={replay}
              designKey={designKey}
              {...knobs}
            />
          </div>
        </div>
      </Row>

      <Row
        n={8}
        name="Bible 14: the net holds, the first line is missing"
        note="Round one called this a hole. It is not one, and the correction is the useful part. Bible 14 says every animation lives inside the reduced-motion block; tw-animate-css, which every primitive's entrance rides, ships no such block of its own. But globals.css has carried a global guard since 2026-06-11 that clamps every animation and transition to 0.01ms under the preference, with !important, so it wins over the utility. Measured on this board with the preference forced: all 30 floating surfaces across the 18 frames come back at 0.01ms. What the layer lacks is the FIRST line that guard's own comment asks for, a gate on the family itself, and the button hands it over as a paste: a stop rather than a clamp. It competes with nothing above, it is optional, and it is safe (radix unmounts a panel immediately when its animation name computes to none)."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Apply
            label="Floating layer: the reduced-motion patch"
            css={REDUCED_MOTION_CSS}
          />
          <span className="text-[11px] text-muted-foreground">
            Turn reduced motion on in the OS, then reload a marketing page with
            it applied. What changes against today is a clamp becoming a stop,
            not motion becoming stillness.
          </span>
        </div>
      </Row>

      <Row
        n={9}
        name="Where to walk a candidate"
        note="A candidate is applied to the whole site, so it is judged where the family actually lives. One block at a time; the newest replaces the last, and the tuner panel clears it too. The lab frames on this board are excluded on purpose, so the rungs above stay honest while a candidate is on. One page is missing: the guest group has no design island, so the event page cannot wear a candidate, and the surface row 1 makes primary is the one page a sitting cannot walk. That is one line in the guest layout and it is in the manifest."
      >
        <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
          {WALK.map((w) => {
            const href =
              w.href.startsWith("/e/") && demo ? `/e/${demo}` : w.href;
            const linkable = !href.includes("[");
            return (
              <li key={w.href} className="flex flex-wrap items-baseline gap-2">
                {w.carries ? null : (
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                    no island
                  </span>
                )}
                {linkable ? (
                  <a
                    className="font-medium text-foreground underline underline-offset-2"
                    href={withDesignKey(href, designKey ?? null)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {href}
                  </a>
                ) : (
                  <span className="font-medium text-foreground">{href}</span>
                )}
                <span>{w.what}</span>
              </li>
            );
          })}
        </ul>
      </Row>

      <BoardMeta
        question={QUESTION}
        candidates={CANDIDATES}
        asks={ASKS}
        departures={DEPARTURES}
      />
    </div>
  );
}

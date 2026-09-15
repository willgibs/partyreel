"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useRef, useState, useSyncExternalStore } from "react";

import {
  BoardDock,
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
import {
  DIRECTIONS,
  DIRECTION_META,
  directionCss,
  directionLabel,
  type Direction,
} from "./directions";
import { Frame, MountProvider, useMountOnApproach } from "./frame";

/** A ladder asks for exactly the width its rungs need, and renders at those
 *  pixels: judging a 6px corner against a 12px one at half scale judges the
 *  scale. Above 768 so `sm:` still resolves on the desktop side. */
const ladderWidth = (dim: Dim) => Math.max(800, RUNGS[dim].length * 230);

/**
 * THE FLOATING-SURFACES BOARD, round four (2026-09-15).
 *
 * THE BOARD CHANGED PURPOSE, because Will's review changed the question.
 * Rounds one to three asked what today's floating layer should be TUNED to and
 * answered it well: three radius rungs, two entrances, one shadow, each a real
 * paste. His note on this board says that is the wrong thing to spend the track
 * on: "Overall, I don't really love our app design in general, dropdown/nested
 * menus included... I prefer to use this track to explore new dropdown menu
 * designs and variants of our existing floating surfaces, rather than nailing
 * the exact details of the current options."
 *
 * So round four asks the ground-up question (bible 22): if this product had no
 * menus, no popovers and no sheets, what would the floating layer be? Three
 * directions answer it, and they are three different KINDS of answer rather
 * than three shades of one (directions.ts): card changes the ANATOMY, glass
 * changes the MATERIAL, command changes the MODEL. Each is a working component
 * on the real primitives (menus.tsx), on the real grounds, at true pixels, with
 * its own motion.
 *
 * FOUR THINGS ROUND FOUR CHANGED, each against a line of the review.
 *
 * 1  THE DIRECTION IS A DOCK SWITCH, and so is every other page-wide control.
 *    Will: "For any pagewide configs, the GUI control should be fixed so that
 *    variants can be toggled on different previews anywhere on the page."
 *    Comparing two directions is now a click from wherever you are standing
 *    rather than a scroll to the top, and the whole board answers the switch,
 *    so a direction is judged on eleven surfaces at once and not on one.
 * 2  NOTHING IS SCALED. Will: "The iFrame previews throw off anything related
 *    to size." Every frame renders its canvas at real pixels and scrolls
 *    sideways if the column is narrower; the shell's Fit control still fits one
 *    for a glance at the whole, and 1:1 is the default (frame.tsx).
 * 3  MORE REAL UI. Will: "I'd love to see more UI examples for comparison,
 *    especially if they can be live production components." The specimens are
 *    whole surfaces now: a host's desk at 1440 with the header panel, the event
 *    menu and the account menu open together; the same host on a phone; the
 *    guest's own entry drawer; the dialog, the tooltip, the toast and the field.
 * 4  ROUND THREE'S ANSWER SURVIVES AS ONE SECTION. The three knobs still work,
 *    still paste, and still measure the corner off the live DOM. They are the
 *    ruling for today's primitives if no direction wins, and they are the
 *    second half of the ask rather than the whole of it.
 */

const QUESTION =
  "If this product had no menus, no popovers and no sheets, what would the floating layer be for a host on a laptop and a guest on a phone, and what does today's layer become while that is being built?";

/** WHERE THE BOARD LANDS. A recommendation with a cost in it, or it is a sales
 *  pitch. Round four's first line is the direction; the three knobs follow it
 *  as the answer for today's primitives whichever way the direction goes. */
const LANDING: { ask: string; answer: string; why: string; row: number }[] = [
  {
    ask: "The direction",
    answer: "card",
    why: "It fixes the thing the review actually names. Today's menus are anonymous lists: no subject, no groups, no separation between Download everything and Delete the event. Card gives a floating surface a title, labelled sections, an icon rail, a trailing column for state and a footer rail under the action that cannot be undone, and it does it on every surface at once. Glass is the prettiest of the three and buys nothing on a flat app ground, which row 6 shows rather than argues. Command is the biggest idea and the wrong product for it: a host opens the event menu a dozen times in their life, not a dozen times an hour.",
    row: 1,
  },
  {
    ask: "The one thing to take from command",
    answer: "delete the submenu",
    why: "Three mutually exclusive values are a group, not a tree. Who can upload is the only nested menu in the product and it exists to hold three radio rows behind a hover and a wait. Card should carry them inline under their own label, which is command's argument without command's field. Row 3 is the two side by side.",
    row: 3,
  },
  {
    ask: "The radius",
    answer: "nested",
    why: "Unchanged from round three and still the only rung that changes one number: today's 8px container stays and the rows rise 4px to nest inside it. The card direction IS this rung, so a ruling for card rules this line too.",
    row: 8,
  },
  {
    ask: "The entrance",
    answer: "by frequency",
    why: "Rule 12 is the house's motion doctrine and a tooltip is opened fifty times in an evening. The finding underneath is a wording one and it is Will's: rule 15's one entrance is one LANGUAGE (a fade, origin-aware, exits faster than enters) with rule 12 setting the clock inside it. Read that way the two rules never disagreed.",
    row: 10,
  },
  {
    ask: "The light in dark",
    answer: "follow the light board",
    why: "The shadow rung is the light board's own --lgt-float family to the byte, and every direction that casts, casts that. So this line is ruled once, on that board, and this family takes the answer.",
    row: 9,
  },
];

const CANDIDATES = [
  {
    name: "Direction: card, the object (what this board recommends)",
    rationale: DIRECTION_META.card.thesis,
  },
  {
    name: "Direction: glass, the room",
    rationale: DIRECTION_META.glass.thesis,
  },
  {
    name: "Direction: command, the model",
    rationale: DIRECTION_META.command.thesis,
  },
  {
    name: "Today's primitives: radius nested, entrance by frequency",
    rationale:
      "Rounds one to three's answer, kept whole. The three knobs are independent, each is a real paste, and they are what today's layer becomes if no direction is ruled yet. The card direction already carries the radius line.",
  },
  {
    name: "The reduced-motion patch (free, optional, competes with nothing)",
    rationale:
      "Not a candidate and not a hole: globals.css has clamped every animation and transition to 0.01ms under the preference since 2026-06-11. What the family lacks is bible 14's FIRST line, a gate of its own, and this paste is that: a stop rather than a clamp.",
  },
];

/** One word each. The direction leads now; the knobs follow it. */
const ASKS = [
  "The direction: today, card, glass or command (this board says card)",
  "The submenu: keep it, or delete it and let the three values be a group (this board says delete)",
  "The radius: sharp, nested or round (this board says nested, which is what card carries)",
  "The entrance: one clock or by frequency (this board says by frequency, and that rule 15 means one language)",
  "The light in dark: today or the shadow (this board says whatever the light board is ruled, since the numbers are the same)",
];

/** Only what Will has to rule on. The findings the build turned up are in the
 *  manifest, where the Orchestrator reads them: they are true whatever is ruled
 *  and none of them is a choice. */
const DEPARTURES = [
  "A SHIPPED BUG, found on this board and true whatever is ruled: a nested submenu is INVISIBLE in the product. ui/dropdown-menu.tsx renders DropdownMenuSubContent with no Portal while DropdownMenuContent carries overflow-x-hidden and overflow-y-auto, so the submenu is a DOM descendant of a box that clips it. Measured here: it opens at the right x and y, computes visible at opacity 1, and paints nothing, because elementFromPoint at its own centre returns the page behind it. No product surface opens a submenu yet, which is why nobody has seen it. The fix is one wrapper in the primitive; this board composes it from outside so a direction can be judged on a submenu that exists. If the submenu is deleted instead (the second ask), the bug goes with it.",
  "A DIRECTION IS TWO HALVES, and only one of them is a paste. The material, the radius and the motion are CSS over the primitives' own data-slots, so Apply to the site puts them on the real header nav, the real dashboard menus and the guest drawer. The anatomy (a header row, an icon rail, a footer rail) and the model (a field, and the deleted submenu) are components, so a ruling for card or command is a change to src/components/ui/dropdown-menu.tsx that the wiring round lands. The board says which is which on every row rather than blurring them.",
  "A FINDING AGAINST RULE 15, not a quiet choice. Rule 15's one entrance and rule 12's animate-by-frequency disagree on this family as they are written. The board recommends reading rule 15's line as one entrance LANGUAGE with rule 12 setting the clock inside it. That is a bible edit and it is Will's to make.",
  "The family is TEN surfaces, not nine. guest/entry-shell.tsx renders a raw vaul drawer that never goes through ui/drawer.tsx, and it is the floating layer most people on this product will ever see. Every direction reaches it through [data-entry-drawer], and row 4 shows it wearing each one.",
  "Today's contract misses bible 9 inside itself: an 8px panel around 1.6px rows in 4px of padding does not nest. Row 8 measures it off the live DOM at 6x. The card direction fixes it by being the nested rung; glass and command fix it at their own corners.",
  "The glass direction puts a BACKDROP BLUR on every open panel, and the shadow rung puts a shadow in DARK, which the shipped elevation contract still forbids by name. Both are the light board's territory as much as this one's, and row 6 shows where glass stops paying for itself.",
];

const GROUNDS: { id: Ground; label: string }[] = [
  { id: "cinema", label: "Cinema" },
  { id: "paper", label: "Paper" },
  { id: "ink", label: "Ink" },
  { id: "app-dark", label: "App dark" },
  { id: "app-light", label: "App light" },
];

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
          <span className="mr-2 inline-flex size-5 items-center justify-center rounded-md bg-foreground text-[11px] text-background tabular-nums">
            {n}
          </span>
          {name}
        </p>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
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
function Apply({
  label,
  css,
  children,
}: {
  label: string;
  css: string;
  children?: string;
}) {
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
      {on ? "Applied to the site, clear" : (children ?? "Apply to the site")}
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
 *  `useSearchParams()`. The dispatcher that renders this board (design/c) owns
 *  no Suspense boundary for it, and a client component that reads search params
 *  without one suspends its subtree. */
const noop = () => () => {};
const readKey = () => new URLSearchParams(window.location.search).get("key");
// undefined = not read yet. A frame must not load before then: on the preview
// the scene route is gated, so a keyless first src would 404 and then reload.
const noKeyYet = () => undefined;

function useDesignKey(): string | null | undefined {
  return useSyncExternalStore(noop, readKey, noKeyYet);
}

/** Whether this reader asked for less motion. Not a nicety: with the preference
 *  on, every entrance on this board is a jump cut, so "Replay" is a button that
 *  does nothing visible, and a board that lets a stranger press it twice and
 *  doubt the board is a board with a broken control. It says so instead. */
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

/** The three knobs plus the palette ramp: the controls for rows 8 to 11, which
 *  ride the dock on a desktop and sit with their own rows on a phone. */
function KnobRow({
  radius,
  setRadius,
  entrance,
  setEntrance,
  light,
  setLight,
  ramp,
  setRamp,
  contract,
}: {
  radius: string;
  setRadius: (v: string) => void;
  entrance: string;
  setEntrance: (v: string) => void;
  light: string;
  setLight: (v: string) => void;
  ramp: Ramp;
  setRamp: (v: Ramp) => void;
  contract: {
    radius: RadiusRung | "off";
    entrance: EntranceRung | "off";
    light: LightRung | "off";
  };
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] text-muted-foreground">
        Today&rsquo;s primitives, rows 8 to 11:
      </span>
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
          { id: "off", label: "Light: today" },
          { id: "shadow", label: "a soft shadow" },
        ]}
        value={light}
        onChange={setLight}
      />
      <Toggle
        ariaLabel="Ramp"
        options={RAMPS.map((r) => ({ id: r, label: RAMP_LABEL[r] }))}
        value={ramp}
        onChange={setRamp}
      />
      <Apply
        label={contractLabel(contract)}
        css={contractCss(contract, "site")}
      >
        Apply the knobs
      </Apply>
    </div>
  );
}

export function FloatingSurfacesBoard() {
  const designKey = useDesignKey();
  const candidate = useTunerCandidate();

  // The board OPENS on what it recommends, so the first thing on screen is the
  // proposal and every other direction is the alternative.
  const [direction, setDirection] = useState<Direction>("card");
  const [mode, setMode] = useState<Mode>("desktop");
  const [ground, setGround] = useState<Ground>("cinema");
  const [ramp, setRamp] = useState<Ramp>("today");
  const [radius, setRadius] = useState("nested");
  const [entrance, setEntrance] = useState("by-frequency");
  const [light, setLight] = useState("off");
  const [outlier, setOutlier] = useState<Outlier>("select");
  const [replay, setReplay] = useState(0);
  const reduced = useReducedMotion();
  const boardRef = useRef<HTMLDivElement | null>(null);

  /** "Replay every entrance" has to DO something from wherever it is pressed.
   *  Below sm the dock is static at the top of the document, so the press can
   *  land with no frame on screen at all. Two halves fix it: `Frame` remembers
   *  a press it could not run and plays it the moment the frame arrives, and
   *  this half carries you to the nearest frame. When a frame IS on screen
   *  nothing moves, which is every press at 1440. */
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
  const outlierHeight = outlier === "select" ? 360 : 520;
  const meta = DIRECTION_META[direction];

  return (
    <div ref={boardRef} className="flex flex-col gap-10 py-4">
      {/* WHERE THIS LANDS, before anything that needs scrolling. */}
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">
            Three floating layers, and the one this board would build
          </p>
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
            The recommendation as one paste, which carries card&rsquo;s
            material, radius and motion but not its anatomy:
          </span>
          <Apply
            label={directionLabel("card")}
            css={directionCss("card", "site")}
          >
            Apply card to the site
          </Apply>
          <span className="text-[11px] text-muted-foreground">
            Then walk the pages in row 12.
          </span>
        </div>
      </section>

      {/* THE DOCK: every switch that changes the whole page, always on screen.
          The shell's BoardDock (round four) replaced this board's own sticky
          bar, which Will called "a great example of how the fixed/sticky
          configurator works": it sticks from sm up, stays static on a phone
          where a tall bar would cover the specimen, writes its height to
          scroll-padding-top so the row links land under it, and carries the
          shell's Fit/1:1, Sidebar and Desk controls at its right end. */}
      <BoardDock
        label="The floating-surfaces controls"
        aside={
          <button
            type="button"
            onClick={replayEverything}
            className="rounded-lg border border-border px-3 py-1 text-[11px] font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted active:scale-[0.97]"
          >
            Replay
          </button>
        }
      >
        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* A spacer, not decoration. With the sidebar tucked away the lab
                chrome renders a fixed "Sidebar" pill at top-left (design.css,
                `html[data-lab-bleed] .lab-sidebar-pill`), which sits exactly on
                top of the dock's first control once the dock is sticky at
                top 0. The dock carries its own Sidebar button at its right end,
                so the pill is redundant here; until the shell decides that, the
                first row starts clear of it. Named in the Handoff as a shell
                ask rather than left as a mystery indent. */}
            <span className="hidden sm:block sm:w-16" aria-hidden />
            <Toggle
              ariaLabel="Direction"
              options={DIRECTIONS.map((d) => ({
                id: d,
                label: DIRECTION_META[d].label,
              }))}
              value={direction}
              onChange={setDirection}
            />
            {direction === "today" ? (
              <span className="text-[11px] text-muted-foreground">
                The layer as it ships, kept on the dock so every comparison has
                a floor.
              </span>
            ) : (
              <Apply
                label={directionLabel(direction)}
                css={directionCss(direction, "site")}
              >
                {`Apply ${meta.label.toLowerCase()} to the site`}
              </Apply>
            )}
            <Toggle
              ariaLabel="Ground"
              options={GROUNDS}
              value={ground}
              onChange={setGround}
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
          </div>
          {/* The knobs belong to rows 8 to 11 rather than to the whole board, and
              below sm the dock is static anyway, so its back-and-forth value is
              gone: at 375 this row moves down to the section it drives and the
              dock loses 200px of the viewport. One control, rendered where it
              is useful. */}
          <div className="hidden w-full sm:block">
            <KnobRow
              radius={radius}
              setRadius={setRadius}
              entrance={entrance}
              setEntrance={setEntrance}
              light={light}
              setLight={setLight}
              ramp={ramp}
              setRamp={setRamp}
              contract={contract}
            />
          </div>
          {reduced ? (
            <p className="text-[11px] text-muted-foreground">
              Reduced motion is on, so every entrance here is a jump cut by
              design and Replay will look like it did nothing. That is bible 14
              holding; row 11 says how.
            </p>
          ) : null}
          {candidate ? (
            <p className="text-[11px] text-muted-foreground">
              On the site now: <strong>{candidate.label}</strong>. It rides
              every lab page, every marketing page, the host app and the guest
              album (all with the key), and it stays until you clear it. The
              frames on this board are deliberately excluded, so the rows below
              keep telling the truth.
            </p>
          ) : null}
        </div>
      </BoardDock>

      {/* -- THE DIRECTIONS ------------------------------------------------ */}

      <section className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-sm font-semibold">
            The {meta.label.toLowerCase()} direction
          </p>
          <p className="text-xs text-muted-foreground">{meta.thesis}</p>
        </div>
        <ul className="flex flex-col gap-1">
          {meta.changes.map((c) => (
            <li
              key={c}
              className="text-xs leading-relaxed text-muted-foreground"
            >
              {c}
            </li>
          ))}
        </ul>
        <p className="text-xs leading-relaxed">
          <strong className="font-semibold">The cost. </strong>
          <span className="text-muted-foreground">{meta.cost}</span>
        </p>
        <p className="text-[11px] text-muted-foreground">
          <strong className="font-medium text-foreground">
            What the paste carries.{" "}
          </strong>
          {meta.paste}
        </p>
      </section>

      <Row
        n={1}
        eager
        name="The host's desk, at 1440"
        note="The three menus a host meets in one session, open together on the ground they open over: the header's panel, the event's actions menu and the account menu, with the tooltip beside them. This is the canvas rule 15 is about, and it is where a direction either reads as one language or does not. Flip the direction on the dock and watch the whole desk change: that is the comparison, and it costs a click from wherever you are standing."
      >
        <Frame
          label="The host's desk"
          scene="desk"
          direction={direction}
          ground={ground}
          ramp={ramp}
          mode="desktop"
          replay={replay}
          designKey={designKey}
        />
      </Row>

      <Row
        n={2}
        name="The four answers, side by side, at true pixels"
        note="The same event menu under each direction, each frame at its own real pixels, so a 4px corner is a 4px corner. Today is an anonymous list: no subject, no groups, and Delete the event one row from Download everything. Card gives it a title, sections, a rail and a footer. Glass takes the boxes out and lets the room through. Command replaces the list with a field. The canvas is 328 wide and says so on its face, because it is a detail frame and not a phone, and because four of them plus their gaps have to clear the lab column at 1440."
      >
        <div className="flex flex-wrap gap-3">
          {DIRECTIONS.map((d) => (
            <div key={d} className="flex max-w-full min-w-0 flex-col gap-1">
              <span className="text-[11px] font-medium">
                {DIRECTION_META[d].label}
                {d === direction ? " (on the dock now)" : ""}
              </span>
              <Frame
                label={`The event menu, ${d}`}
                scene="menu"
                direction={d}
                ground={ground}
                ramp={ramp}
                mode="phone"
                // 328, not 340: four of these plus their gaps and borders have
                // to clear the lab column at 1440 MINUS the vertical scrollbar,
                // which is what pushed the fourth answer onto a second line and
                // turned a four-way comparison into a three-way one.
                width={328}
                height={420}
                replay={replay}
                designKey={designKey}
              />
            </div>
          ))}
        </div>
      </Row>

      <Row
        n={3}
        name="The nested branch, kept and deleted"
        note="The only nested menu in the product is Who can upload, and it exists to hold three mutually exclusive values behind a hover and a wait. Left: card opens a second panel, which is the best version of the tree, and it only exists here because this board wraps it in a portal: shipped, a submenu is invisible (the departure below). Right: command has no submenu at all, so the same three rows are a group in the one list and two letters is how you reach them. The board's recommendation takes the right-hand idea into the left-hand anatomy: card's panel, with those three values inline under their own label, and no branch anywhere in the product. Which also makes the bug moot, which is the cheapest way to fix anything."
      >
        <div className="flex flex-wrap gap-3">
          <div className="flex max-w-full min-w-0 flex-col gap-1">
            <span className="text-[11px] font-medium">
              Card: the submenu, done properly
            </span>
            <Frame
              label="The nested branch, card"
              scene="sub"
              direction="card"
              ground={ground}
              ramp={ramp}
              mode="desktop"
              width={680}
              height={380}
              replay={replay}
              designKey={designKey}
            />
          </div>
          <div className="flex max-w-full min-w-0 flex-col gap-1">
            <span className="text-[11px] font-medium">
              Command: no submenu, two letters typed
            </span>
            <Frame
              label="The nested branch, command"
              scene="sub"
              direction="command"
              ground={ground}
              ramp={ramp}
              mode="desktop"
              width={680}
              height={380}
              replay={replay}
              designKey={designKey}
            />
          </div>
        </div>
      </Row>

      <Row
        n={4}
        name="The phone, where most of this product happens"
        note="A direction has to answer 375 as well as 1440. Left is the host's own phone under the direction on the dock: command answers it differently on purpose, because a field with no keyboard is a bottom sheet with big rows. Right is the guest's entry drawer, the tenth floating surface and the first thing anyone sees after the QR, wearing the same direction through its own attribute. If a direction cannot reach that one, it is not a contract."
      >
        <div className="flex flex-wrap gap-4">
          <div className="flex max-w-full min-w-0 flex-col gap-1">
            <span className="text-[11px] font-medium">
              The host&rsquo;s phone, {meta.label.toLowerCase()}
            </span>
            <Frame
              label="The host's phone"
              scene="pocket"
              direction={direction}
              ground={ground}
              ramp={ramp}
              mode="phone"
              replay={replay}
              designKey={designKey}
            />
          </div>
          <div className="flex max-w-full min-w-0 flex-col gap-1">
            <span className="text-[11px] font-medium">
              The guest&rsquo;s entry drawer, the real EntryShell
            </span>
            <Frame
              label="The guest entry surface"
              scene="guest"
              direction={direction}
              ground={ground}
              ramp={ramp}
              mode="phone"
              replay={replay}
              designKey={designKey}
            />
          </div>
        </div>
      </Row>

      <Row
        n={5}
        name="The rest of the family under the direction"
        note="A direction that only answers the menu is half an answer. The dialog over its scrim, the tooltip, the real sonner toast, the field, and the edge panel entering from the side the product actually uses. These are the surfaces that make the layer a family, and a stray one reads as a bug."
      >
        <div className="flex flex-wrap gap-3">
          <div className="flex max-w-full min-w-0 flex-col gap-1">
            <span className="text-[11px] font-medium">
              The dialog, the tooltip and the toast
            </span>
            <Frame
              label="The covering family"
              scene="surfaces"
              direction={direction}
              ground={ground}
              ramp={ramp}
              mode="phone"
              replay={replay}
              designKey={designKey}
            />
          </div>
          <div className="flex max-w-full min-w-0 flex-col gap-1">
            <span className="text-[11px] font-medium">
              The field: a listbox in three directions, a search in the fourth
            </span>
            <Frame
              label="The field"
              scene="field"
              direction={direction}
              ground={ground}
              ramp={ramp}
              mode="phone"
              height={420}
              replay={replay}
              designKey={designKey}
            />
          </div>
          <div className="flex max-w-full min-w-0 flex-col gap-1">
            <span className="text-[11px] font-medium">
              The edge panel: ui/sheet.tsx on its one real side, the top
            </span>
            <Frame
              label="The edge panel"
              scene="edge"
              direction={direction}
              variant="sheet"
              side="top"
              ground={ground}
              ramp={ramp}
              mode="phone"
              replay={replay}
              designKey={designKey}
            />
          </div>
        </div>
      </Row>

      <Row
        n={6}
        name="Where glass stops paying for itself"
        note="The honest cost of the prettiest direction, shown rather than argued. A backdrop blur earns its compositing layer when there is a room behind the panel: over the album, over a photograph, over the cinema ground. Over a flat app surface there is nothing to let through, so glass is a slightly rounder panel with a fainter edge and a blur the GPU still pays for. The first two frames are the same direction on two grounds; the third is card on the flat one, for the comparison. If the first is worth it and the second is not, that is an argument for a material that varies by ground, which is a question for rule 15."
      >
        <div className="flex flex-wrap gap-3">
          <div className="flex max-w-full min-w-0 flex-col gap-1">
            <span className="text-[11px] font-medium">
              Glass over the album (cinema)
            </span>
            <Frame
              label="Glass on cinema"
              scene="menu"
              direction="glass"
              ground="cinema"
              ramp={ramp}
              mode="phone"
              width={340}
              height={420}
              replay={replay}
              designKey={designKey}
            />
          </div>
          <div className="flex max-w-full min-w-0 flex-col gap-1">
            <span className="text-[11px] font-medium">
              Glass over a flat app ground (app light)
            </span>
            <Frame
              label="Glass on app light"
              scene="menu"
              direction="glass"
              ground="app-light"
              ramp={ramp}
              mode="phone"
              width={340}
              height={420}
              replay={replay}
              designKey={designKey}
            />
          </div>
          <div className="flex max-w-full min-w-0 flex-col gap-1">
            <span className="text-[11px] font-medium">
              Card over the same flat ground
            </span>
            <Frame
              label="Card on app light"
              scene="menu"
              direction="card"
              ground="app-light"
              ramp={ramp}
              mode="phone"
              width={340}
              height={420}
              replay={replay}
              designKey={designKey}
            />
          </div>
        </div>
      </Row>

      <Row
        n={7}
        name="Every direction, and what it costs"
        note="The three theses beside each other, so the ruling can be made from the words once the frames above have made it from the pixels. Each card applies its direction to the whole site, or puts it on the board."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {(["card", "glass", "command"] as const).map((d) => (
            <div
              key={d}
              className={cn(
                "flex flex-col gap-2 rounded-lg border px-3 py-3",
                d === direction ? "border-foreground" : "border-border",
              )}
            >
              <p className="text-xs font-semibold">{DIRECTION_META[d].label}</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {DIRECTION_META[d].thesis}
              </p>
              <p className="text-[11px] leading-relaxed">
                <strong className="font-medium">The cost. </strong>
                <span className="text-muted-foreground">
                  {DIRECTION_META[d].cost}
                </span>
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                <Apply label={directionLabel(d)} css={directionCss(d, "site")}>
                  {`Apply ${DIRECTION_META[d].label.toLowerCase()}`}
                </Apply>
                <button
                  type="button"
                  onClick={() => setDirection(d)}
                  className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-foreground active:scale-[0.97]"
                >
                  Put it on the board
                </button>
              </div>
            </div>
          ))}
        </div>
      </Row>

      {/* -- TODAY'S PRIMITIVES, ROUNDS ONE TO THREE'S ANSWER -------------- */}

      <section className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3">
        <p className="text-sm font-semibold">
          Today&rsquo;s primitives: the three knobs, kept whole
        </p>
        <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Rounds one to three asked what today&rsquo;s layer should be tuned to
          and answered it in three independent knobs, each a real paste against
          the primitives&rsquo; own data-slots. That answer stands whichever way
          the direction goes: if a direction wins it carries the radius line
          with it, and if none does, these four rows are the ruling. The knobs
          sit on the dock at the end of its second line, and on a phone they sit
          here, where the dock is static and a control beside its own rows is
          worth more than a control at the top of the document.
        </p>
        <div className="sm:hidden">
          <KnobRow
            radius={radius}
            setRadius={setRadius}
            entrance={entrance}
            setEntrance={setEntrance}
            light={light}
            setLight={setLight}
            ramp={ramp}
            setRamp={setRamp}
            contract={contract}
          />
        </div>
      </section>

      <Row
        n={8}
        name="The corner, measured"
        note="The finding rounds one to three turned on, at 6x, read off the live DOM rather than claimed in a caption. The solid outer arc is the panel, the solid inner arc is the lit row, and the dashed arc is where the row's corner has to sit for the two to share a centre (bible 9). On today's rung the dashed arc and the row's arc are different lines, and they are the same line on all three candidates. The card direction is the nested rung, so it fixes this by being itself."
      >
        <div className="flex flex-wrap gap-3">
          {RUNGS.radius.map((r) => (
            <div
              key={r.label}
              className="flex max-w-full min-w-0 flex-col gap-1"
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
                replay={replay}
                designKey={designKey}
              />
            </div>
          ))}
        </div>
        <ApplyRow
          dim="radius"
          build={(v) => ({
            label: `Floating radius: ${v}`,
            css: radiusCss(v as RadiusRung, "site"),
          })}
        />
      </Row>

      <Row
        n={9}
        name="The light in dark, over the palette's ramps"
        note="A floating layer's light in dark is a question about the ground it floats over, so the ramp is a knob on the dock. Today's dark popover sits lighter than the card it opens from (0.245 over 0.21, the palette board's finding), and that gap is the whole reason nothing needs to cast; ramp A widens it, ramp B makes every dark surface one room. The shadow rung is the light board's own --lgt-float family to the byte, so the two boards propose one shadow and this line is ruled once."
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
        n={10}
        name="The entrance: rule 12 against rule 15"
        note="Not a number, a principle. Two ratified rules disagree on this family as they are written, and the two frames below are each rule taken literally on the same three primitives: the tooltip (the highest-frequency surface on the site), the menu, and the dialog. Press Replay and watch them together. The board's reading is that rule 15 means one entrance LANGUAGE, and that a wording change to it is the whole disagreement."
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
            <div key={e} className="flex max-w-full min-w-0 flex-col gap-1">
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
        n={11}
        name="The outliers, and bible 14's missing first line"
        note="Three columns, so the outlier ask is a choice between real things: as it ships, the same primitive on the knobs you have set, and the surface that takes its work if it is dropped. Select has one product call site, the sheet has one, and ui/drawer.tsx has none at all. Under the directions this ask changes shape, because command answers the select by replacing it with a field (row 5). Below the columns is the reduced-motion patch, which competes with nothing: globals.css has clamped every animation under the preference since June, and what the family lacks is a gate of its own."
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
        <div className="flex flex-wrap gap-3">
          <div className="flex max-w-full min-w-0 flex-col gap-1">
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
          <div className="flex max-w-full min-w-0 flex-col gap-1">
            <p className="text-[11px] font-medium text-muted-foreground">
              On the knobs above
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
          <div className="flex max-w-full min-w-0 flex-col gap-1">
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
        <div className="flex flex-wrap items-center gap-2">
          <Apply
            label="Floating layer: the reduced-motion patch"
            css={REDUCED_MOTION_CSS}
          />
          <span className="text-[11px] text-muted-foreground">
            Turn reduced motion on in the OS, then reload a marketing page with
            it applied. What changes against today is a clamp becoming a stop.
          </span>
        </div>
      </Row>

      <Row
        n={12}
        name="Where to walk a candidate"
        note="A direction or a knob set is applied to the whole site, so it is judged where the family actually lives. One block at a time; the newest replaces the last, and the tuner panel clears it too. The lab frames on this board are excluded on purpose, so the rows above stay honest while a candidate is on. Remember what a paste can and cannot carry: the material, the radius and the motion reach these pages, and the header row, the icon rail and the field do not until the wiring round lands them."
      >
        <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
          {WALK.map((w) => {
            const href =
              w.href.startsWith("/e/") && demo ? `/e/${demo}` : w.href;
            const linkable = !href.includes("[");
            return (
              <li key={w.href} className="flex flex-wrap items-baseline gap-2">
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

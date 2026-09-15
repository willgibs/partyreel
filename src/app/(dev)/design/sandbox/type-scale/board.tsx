"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

import {
  BoardDock,
  BoardMeta,
  CANVAS,
  clearCandidate,
  setCandidateCss,
  Stage,
  Toggle,
  useLabPrefs,
  useTunerCandidate,
  type Ground,
  type Mode,
} from "@/components/dev/board";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

import { Variant } from "../variant-frame";
import {
  ASK_404,
  askOrdinal,
  ASKS,
  candidateCss,
  composePair,
  DEFAULT_PAIR,
  FIXED_TOKENS,
  FIXES,
  fixes,
  ISLANDS_LANDED,
  ladderById,
  LADDERS,
  LAW_ONLY,
  moved,
  NO_ISLAND,
  REAL_PAGES,
  RECOMMENDED,
  REGISTER_CALL,
  STEPS,
  SURFACE_LABEL,
  themeBlock,
  tokenTable,
  WALK,
  type Ladder,
  type LadderId,
  type Pair,
  type Spec,
  type Surface,
} from "./ladders";
import {
  AdminPage,
  Dashboard,
  EventPage,
  MissingMiddle,
  NotFoundStage,
  TrackingLaw,
} from "./pages";

/**
 * THE TYPE-SCALE BOARD (the review wave; round four, 2026-09-15).
 *
 * Bible 5 holds: one heading face on one site ladder. What was never nailed is
 * the ladder's numbers, so this board writes them, on the real pages, at both
 * canvases, as a token table the wiring round bakes.
 *
 * ── ROUND FOUR, AND THE THREE NOTES IT WAS BUILT TO ──
 * Will walked every board on the 15th and left this one three notes.
 *
 * 1. "I can't actually judge the font sizes in usage themselves scaled down."
 *    The stages were zoom-fitted into the lab column at about 0.7x, which is
 *    fatal to a board whose whole subject is size. Every stage renders at 1:1
 *    now (the shell's own preference since round four), and the board scales
 *    nothing of its own: a 1440 canvas is 1440 pixels and scrolls sideways on a
 *    narrower window, which is correct.
 * 2. "A fixed configurator for easier comparisons per UI section, as well as
 *    more UI previews themselves." Every page-wide switch is in the dock now,
 *    so a comparison is a flip beside whatever you are looking at rather than a
 *    scroll to the top. And the marketing surfaces are no longer
 *    reconstructions: they are the ROUTES, in frames exactly the canvas wide,
 *    with the selected pair injected into each frame's document. A frame gets
 *    three things a stage cannot: the canvas's own breakpoints, an EVALUATED
 *    clamp rather than one resolved by hand, and everything else on the page
 *    moving with the step, which is the reach of the ruling made visible.
 * 3. "Marketing and app will have different type scales. Your call on
 *    separating them into two distinct sets or combining them all into one.
 *    I'd like to select them separately in the lab." The dock carries two
 *    switches, so any marketing ladder pairs with any app ladder and the pair
 *    is what the paste, the token table and the bake are generated from. The
 *    call on the shape is made and argued: one set, two registers
 *    (REGISTER_CALL in ladders.ts, and on the board under the glance).
 *
 * ── HOW TO READ IT ──
 * The answer is at the top. Pick a pair in the dock and everything below
 * re-lays itself: the stages are the PRODUCTION components with three custom
 * properties handed to them, and the frames are the production PAGES.
 *
 * ── THE THREE CANDIDATES SPAN THE RANGE (bible 22) ──
 * A keeps every desktop number the site ships and fixes only what is broken.
 * B throws the numbers away and rebuilds from a rung set, with marketing and
 * the app as two distances along one ladder. C says one ladder is the wrong
 * abstraction and splits the site into an editorial register and an instrument
 * register. They are not three shades of one answer, and since round four they
 * need not be taken whole: B's marketing with C's app is a real block.
 *
 * Rising tides: the departures are on BoardMeta, not in a footnote. No mono
 * face and no mono caption atom anywhere on a board (bible 7 is retiring).
 */

const QUESTION =
  "One heading ladder for marketing and one for the app, chosen separately, on the real pages at 1440 and 375 and pasteable at the whole site: which sizes, line-heights and tracking, proposed as one token set the wiring round bakes?";

/**
 * THE DEPARTURES WILL MUST RULE ON, AND THE WAVE'S OWN INPUTS.
 *
 * Round three flagged six; round four adds the register call, which is a
 * decision the brief handed to the board rather than an ask, so it is stated
 * here with its argument instead of taking a line in "Rule on".
 *
 * The last line is the wave's standing rule (round two: say on the board what
 * another board's work changed here).
 */
const DEPARTURES = [
  `${REGISTER_CALL.headline}, and it was the board's call to make rather than Will's ask. ${REGISTER_CALL.body}`,
  "C collapses marketing's six heading steps to five and folds the 24/30 prose tier into the section step, so /about's story sections and /press's sections move up a tier. That contradicts design-system.md's documented three-tier h2 ladder; it is C's argument, not an oversight.",
  "B states bible 2 as arithmetic: marketing travels four rungs between 375 and 1440 and the app travels one. That turns 'marketing may be louder' from a judgement into a rule, which is a bible finding if B is adopted, and B is what the board recommends for both registers.",
  `Bible 5 says one heading face on one site ladder, and the 404's h1 has always been outside both: Inter at 600, the only page title on the site that is not the heading face. Every paste puts it on the ladder, which is a change no ruling has made yet, so it is the ${askOrdinal(ASK_404)} ask rather than a silent fix.`,
  "The pairing is NOT departed from, and it is no longer an ask. Inter with Urbanist survives the loudest step once tracking runs inverse to size: what reads wrong at 160px and again at 16px is the constant -0.03em, not the face. The evidence sits under the tracking law on the last stage, and a face round would be its own ruling.",
  "Every candidate closes the masthead's tracking squeeze (.mkt-name opens to +0.022em) onto the display step's OWN tracking, between -0.04em and -0.05em, rather than the shared -0.03em constant it lands on today. The paste closes it in marketing.css's own two places and leaves the squeeze itself running.",
  "What the other boards changed here (the wave's specs and every open track's handoff, re-read in round four). One thing moved and it is the shell's: admin and the guest routes mount a design island now, which is the one-line change this board, the floating-surfaces board and the rounding board all asked for, so the portal and the guest album can be walked with a block applied and this board's unreachable list is down to the root 404. Two things stand from round three: the kill-mono sweep put the stat register on the heading face at 30 / 36, a size no hook reaches, so the wiring round takes it as a step and not as a class; and the lab compiles no responsive heading rung, which is exactly why the marketing surfaces are frames now rather than stages, since a frame runs the page's own stylesheet at the canvas's own width. Palette, light, floating-surfaces and media-kit still move no size, leading or tracking.",
];

/* ──────────────────────────── The board's frame ───────────────────────── */

/** Every stage's inner frame: `data-tsc` for the sheet to hook, a hand-resolved
 *  gutter (a 1440 canvas sits inside a real window, so `lg:px-8` would read the
 *  window even at 1:1), and data-inview so the production entrances land
 *  settled instead of waiting on an observer. The two attributes sit on two
 *  nested elements on purpose: board.css needs `[data-tsc] [data-tsc-page]` to
 *  clear marketing.css's own (0,2,0) rules without an !important. */
function Frame({
  mode,
  ground,
  height,
  children,
}: {
  mode: Mode;
  ground: Ground;
  height?: number;
  children: ReactNode;
}) {
  return (
    <Stage mode={mode} ground={ground} height={height}>
      <div
        data-tsc
        className="h-full"
        style={
          {
            "--tsc-gutter": mode === "phone" ? "16px" : "32px",
          } as CSSProperties
        }
      >
        <div
          data-tsc-page
          data-inview="true"
          className="h-full overflow-hidden"
        >
          {children}
        </div>
      </div>
    </Stage>
  );
}

/** One act's header. A reviewer who knows which argument he is in can rule on
 *  one and move on. */
function Act({
  n,
  name,
  question,
}: {
  n: number;
  name: string;
  question: string;
}) {
  return (
    <div className="mt-4 border-t border-border pt-5">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Act {n}
      </p>
      <p className="mt-1 text-sm font-semibold">{name}</p>
      <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{question}</p>
    </div>
  );
}

/* ─────────────────────────── The board's answer ───────────────────────── */

/**
 * THE BOARD ANSWERS BEFORE IT ASKS (round three; kept).
 *
 * Two rounds of this board were a menu: four ladders, six asks, no opinion. A
 * board that has walked its own candidates on the real site should say which
 * one it would ship, because then a ruling is "yes" or "no, C" rather than an
 * afternoon. Each row carries the one thing that would change the board's mind,
 * so disagreeing is also a few words.
 */
function TheAnswer() {
  return (
    <div className="rounded-lg border border-foreground/30 bg-card px-4 py-3">
      <p className="text-[11px] font-medium text-foreground">
        The board&rsquo;s answer, if you want the short version
      </p>
      <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
        Four rulings. Each is one word, each has the board&rsquo;s own answer
        beside it, and each names the single thing that would change it. The two
        ladder rulings are independent now: the dock picks a marketing ladder
        and an app ladder separately, and any pair is a real block.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {ASKS.map((a) => (
          <div
            key={a.ask}
            className="grid grid-cols-1 gap-x-4 gap-y-1 border-t border-border pt-2 sm:grid-cols-[13rem_minmax(0,1fr)]"
          >
            <div>
              <p className="font-heading text-lg leading-tight">{a.answer}</p>
              <p className="text-[11px] text-muted-foreground">{a.ask}</p>
            </div>
            <div className="text-[11px] leading-relaxed text-muted-foreground">
              <p>{a.because}</p>
              <p className="mt-1">
                <span className="text-foreground">Overrule it with </span>
                {a.overrule}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── The ladders at a glance, per register ────────────── */

/**
 * THE COMPARISON, WITHOUT TOGGLING (round three), SPLIT IN TWO (round four).
 *
 * The cold walk found the board's worst stumble: to compare two ladders a
 * reviewer had to flip a toggle and hold nine sizes in his head, and two of the
 * four columns are close enough at one canvas that flipping between them looked
 * like a broken control. Round four splits the table by register, because the
 * two halves are ruled separately now: clicking a column in the marketing table
 * sets the marketing ladder and leaves the app alone, which is the fastest way
 * to find a pair.
 *
 * Every number here is the ladder data at the selected canvas, and the ticks
 * per column are computed by `fixes()` from that data, never declared beside
 * it: a column cannot claim a fix it does not make.
 */
function Glance({
  mode,
  surface,
  selected,
  onSelect,
}: {
  mode: Mode;
  surface: Surface;
  selected: LadderId;
  onSelect: (id: LadderId) => void;
}) {
  const end = mode === "phone" ? "phone" : "desktop";
  const steps = STEPS.filter((s) => s.surface === surface);
  const rows = FIXES.filter((f) => f.surfaces.includes(surface));
  // ★ The cold walk's worst stumble, said out loud: at 1440 A. Tuned keeps
  // every size today ships, so its column IS today's column and toggling
  // between them reads as a dead control. Computed, never asserted, so it
  // appears at whichever canvas and register it happens to be true at.
  const flat = LADDERS.filter((l) => {
    if (l.id === "today") return false;
    const count = moved(l, end, surface);
    return count.moved === 0 && count.added === 0;
  })
    .map((l) => l.name)
    .join(" and ");
  const specOf = (l: Ladder, step: (typeof STEPS)[number]): Spec | null => {
    const value = l.steps[step.id];
    return value ? value[end] : null;
  };

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-medium text-foreground">
          {SURFACE_LABEL[surface]}: the four ladders at a glance, at{" "}
          {mode === "phone" ? 375 : 1440}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Click a column to put that ladder on this register only.
        </p>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="w-[13rem] py-1 text-left font-medium text-muted-foreground">
                The step, and where it lives
              </th>
              {LADDERS.map((l) => {
                const on = l.id === selected;
                return (
                  <th key={l.id} className="p-0 align-bottom">
                    <button
                      type="button"
                      onClick={() => onSelect(l.id as LadderId)}
                      className={cn(
                        "w-full rounded-t-md px-2 py-1.5 text-left transition-colors",
                        on
                          ? "bg-foreground/10 text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="block font-medium">{l.name}</span>
                      <span className="block text-[10px] font-normal">
                        {l.id === RECOMMENDED
                          ? "the board would ship this"
                          : l.id === "today"
                            ? "the control"
                            : " "}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {steps.map((step) => {
              const widest = Math.max(
                ...LADDERS.map((l) => specOf(l, step)?.px ?? 0),
              );
              return (
                <tr key={step.id} className="border-t border-border">
                  <td className="py-1.5 pr-3 align-top">
                    <span className="text-foreground">{step.label}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      {step.where}
                    </span>
                  </td>
                  {LADDERS.map((l) => {
                    const spec = specOf(l, step);
                    const folded = Boolean(l.aliases?.[step.id]);
                    const on = l.id === selected;
                    return (
                      <td
                        key={l.id}
                        className={cn(
                          "px-2 py-1.5 align-top",
                          on && "bg-foreground/[0.06]",
                        )}
                      >
                        <span
                          className={cn(
                            "tabular-nums",
                            spec && !folded
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {spec ? spec.px : "no step"}
                          {folded ? ", folded" : ""}
                        </span>
                        {spec && (
                          <span
                            aria-hidden
                            className="mt-1 block h-1 rounded-full bg-foreground/35"
                            style={{ width: `${(spec.px / widest) * 100}%` }}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {rows.map((fix, i) => (
              <tr
                key={fix.id}
                className={cn(
                  "border-t border-border",
                  i === 0 && "border-t-2 border-t-foreground/20",
                )}
              >
                <td className="py-1 pr-3 align-top">
                  <span className="text-foreground">{fix.label}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {fix.fault}
                  </span>
                </td>
                {LADDERS.map((l) => {
                  const on = l.id === selected;
                  const fixed = fixes(l, surface)[fix.id];
                  return (
                    <td
                      key={l.id}
                      className={cn(
                        "px-2 py-1 align-top",
                        on && "bg-foreground/[0.06]",
                        fixed ? "text-foreground" : "text-muted-foreground/60",
                      )}
                    >
                      {fixed ? "fixed" : "not fixed"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tfoot>
        </table>
      </div>
      {flat.length > 0 && (
        <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
          <span className="text-foreground">
            At {mode === "phone" ? 375 : 1440} the {flat} column is
            today&rsquo;s column here.
          </span>{" "}
          It carries every size the site already ships on this register, so
          switching to it moves only the leading and the tracking. Its argument
          is at the other canvas: flip the viewport in the dock.
        </p>
      )}
    </div>
  );
}

/* ───────────────── One token set, two registers: the call ─────────────── */

function RegisterCall() {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-medium text-foreground">
        The pair, chosen separately: {REGISTER_CALL.headline}
      </p>
      <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
        {REGISTER_CALL.body}
      </p>
    </div>
  );
}

/* ───────────────────────── Apply it to the site ───────────────────────── */

/** The lab's own gate key, read off this page's URL so the walk links carry it
 *  and nothing writes it down. Through useSyncExternalStore rather than an
 *  effect: the server snapshot is null, so the first client render matches and
 *  the links fill in on hydration with no mismatch and no cascading render. */
const NEVER_CHANGES = () => () => {};
const readKey = () => new URLSearchParams(window.location.search).get("key");
const NO_KEY = () => null;

/**
 * THE DOCK'S RIGHT-HAND CLUSTER: the pair, handed to the whole site.
 *
 * `setCandidateCss` renders the block as a style element after every stylesheet
 * on every page with a design island, so the ruling can also be made in a real
 * tab, signed in, on the surfaces a frame on this page cannot reach. It is the
 * same generated block the frames wear, so the two can never disagree.
 *
 * ★ APPLY THE PAIR (Today, Today) IF YOU WANT THE CONTROL: it is the shipped
 * ladder resolved, so if the paste is honest the site does not move at 1440 or
 * at 375. That is the block's own proof. (In between those widths it will move,
 * on purpose: a clamp is smooth where a four-breakpoint ramp steps.)
 */
function ApplyPair({
  ladder,
  css,
  active,
}: {
  ladder: Ladder;
  css: string;
  active: string | null;
}) {
  const label = `type-scale: ${ladder.name}`;
  const on = active === label;
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setCandidateCss(label, css)}
        className={cn(
          "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors",
          on
            ? "border-foreground bg-foreground text-background"
            : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        {on ? "Applied to the site" : "Apply the pair to the site"}
      </button>
      {active && (
        <button
          type="button"
          onClick={() => clearCandidate()}
          className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  );
}

/** What an applied block reaches in a real tab, and what it does not. Not a
 *  page-wide switch, so it stays out of the dock. */
function Reach({
  ladder,
  css,
  active,
}: {
  ladder: Ladder;
  css: string;
  active: string | null;
}) {
  const key = useSyncExternalStore(NEVER_CHANGES, readKey, NO_KEY);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
    } catch {
      // A lab affordance: a browser that refuses the clipboard just does not
      // flash "copied", and the whole block is still under the token table.
    }
  };
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="text-foreground">
          {active ? `${active.replace("type-scale: ", "")} is applied.` : null}{" "}
          Walk the pair signed in on
        </span>
        {WALK.map((p) => (
          <span key={p.href}>
            {key ? (
              <a
                href={`${p.href}?key=${encodeURIComponent(key)}`}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                {p.label}
              </a>
            ) : (
              p.label
            )}
          </span>
        ))}
        <button
          type="button"
          onClick={() => void copy()}
          className="underline underline-offset-2 hover:text-foreground"
        >
          {copied ? "copied the block" : `copy ${ladder.name} as CSS`}
        </button>
      </p>
      <p className="max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
        <span className="text-foreground">{ISLANDS_LANDED}</span> The one
        surface still outside every island:{" "}
        {NO_ISLAND.map((n) => (
          <span key={n.where}>
            <span className="text-foreground">{n.where}</span> ({n.why})
          </span>
        ))}
        .{" "}
        <span className="text-foreground">
          Three tiers move with the wiring round rather than with a paste
        </span>
        , and a heading that does not budge is one of them, not a broken block:
        the app&rsquo;s section heading, which production writes as a label
        inside an h2 with no class worth aiming at; sixteen hand-rolled
        marketing headings at 30 / 36 (the four feature families, careers, the
        footer, the reel, the error screen and the stat register) that stop one
        rung short of SectionShell&rsquo;s ramp; and, found in round four when
        the guest album became a frame, the guest entry title, written inline as
        font-heading text-[28px]. Aiming a step at any of the three would move
        the real site under the Today pair, which is the control this whole
        board rests on, so all three are the sweep and not a hook.
      </p>
    </div>
  );
}

/* ─────────────── The real pages, at the pixels they ship ──────────────── */

/**
 * ★ THE FRAME SHOWS THE PAGE SETTLED, exactly as every stage on this board
 * does. marketing.css keys its entrances off `data-inview`, and `.mkt-name`
 * transitions its tracking over 760ms from an OPEN squeeze (+0.022em) to the
 * settled value: measured inside a frame before the page's own observer had
 * flipped anything, the /about masthead reported +3.52px of tracking, which is
 * a number no candidate proposes and which a screenshot taken then would have
 * shown as the ruling. So the board flips `data-inview` on and stops that one
 * transition, for the same reason board.css does it for the stages: motion is
 * another board's question, and a size read mid-flight is not a size. The flip
 * is re-applied through a MutationObserver, because the page's own islands set
 * the attribute back to false when they hydrate.
 */
const SETTLE_CSS = `/* The board settles the frame's entrances; see PageFrame.
   ★ The masthead rule must MATCH marketing.css's own shape. A bare .mkt-name
   at (0,1,0) lost to its \`[data-mkt] .mkt-name\` at (0,2,0) whatever the source
   order, and the frozen transition it left behind reported a 200px masthead at
   a 160px ladder's tracking, which is a number no candidate proposes. */
[data-mkt] .mkt-name,
[data-mkt] [data-inview] .mkt-name { transition: none; }
[data-mkt] [data-mkt-cut] { animation: none; opacity: 1; transform: none; }
[data-mkt] .mkt-line { opacity: 1; transform: none; filter: none; transition: none; }`;

/**
 * A ROUTE, AT THE CANVAS'S TRUE PIXELS, WEARING THE SELECTED PAIR.
 *
 * ★ THE FRAME IS THE POINT, NOT A CONVENIENCE. A stage renders the production
 * components, but a Tailwind breakpoint prefix inside one reads the browser
 * WINDOW (the shell's own warning), and a `vw` inside one measures the window
 * too, so the board has always had to resolve each end of every clamp by hand.
 * Inside a frame both read the frame: at 375 the page's real phone layout runs,
 * and the generated clamp is EVALUATED rather than described. That is the
 * difference between showing a proposal and showing the thing the wiring round
 * would land.
 *
 * ★ NO `?key=` ON THE SRC. The key mounts the marketing motion tuner, whose
 * panel would sit on top of the page being judged, and CandidateStyle, which
 * would put whatever block is APPLIED under the pair being previewed. The pair
 * is injected here instead, appended last in the frame's head so it wins every
 * tie on source order exactly as the real paste does, and re-injected on every
 * load so a link followed inside the frame keeps it.
 */
function PageFrame({
  href,
  label,
  mode,
  css,
}: {
  href: string;
  label: string;
  mode: Mode;
  css: string;
}) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [screens, setScreens] = useState(1);
  const [scale, setScale] = useState(1);
  const { w, h } = CANVAS[mode];
  // The dock's own 1:1 / Fit control has to reach the frames too, or it reads
  // as dead on seven of the surfaces on the page. 1:1 is the default and the
  // point of the round; Fit is the shell's deliberate "glance at the whole",
  // and it scales the PAINT only: the frame's document still lays out at the
  // canvas width, so its breakpoints and its clamps do not move.
  const trueScale = useLabPrefs().fit === "true";

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box || trueScale) {
      setScale(1);
      return;
    }
    const sync = () =>
      setScale(Math.min(1, box.getBoundingClientRect().width / w));
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(box);
    return () => observer.disconnect();
  }, [w, trueScale]);

  /**
   * ★ ADOPTED, NOT APPENDED. The first version appended a <style> to the
   * frame's head and it was measured there, out of five sheets, NOT last:
   * the page's own client chunks insert stylesheets after hydration, so the
   * block would have been one Tailwind layer change away from silently losing
   * a tie. A constructed stylesheet in `adoptedStyleSheets` is ordered after
   * every sheet in the document by the cascade's own rules, which is at least
   * as late as production's own CandidateStyle element, so a candidate that
   * wins in a frame wins in a tab.
   */
  const paint = useCallback(() => {
    const frame = ref.current;
    const doc = frame?.contentDocument;
    const view = frame?.contentWindow as (Window & typeof globalThis) | null;
    if (!doc || !view) return;
    try {
      const sheet = new view.CSSStyleSheet();
      sheet.replaceSync(`${SETTLE_CSS}\n\n${css}`);
      doc.adoptedStyleSheets = [sheet];
    } catch {
      // A browser without constructed sheets: the appended element is still
      // after everything in the head, which is enough to read the board.
      const style = doc.createElement("style");
      style.textContent = `${SETTLE_CSS}\n\n${css}`;
      doc.head?.appendChild(style);
    }
    for (const el of doc.querySelectorAll('[data-inview="false"]')) {
      el.setAttribute("data-inview", "true");
    }
  }, [css]);

  useEffect(() => {
    paint();
  }, [paint]);

  // The page's islands set data-inview back to false as they hydrate, and a
  // frame scrolled into view by hand would otherwise reveal a heading in the
  // middle of its entrance. One observer per frame, attribute-filtered.
  useEffect(() => {
    const doc = ref.current?.contentDocument;
    const view = ref.current?.contentWindow as
      | (Window & typeof globalThis)
      | null;
    if (!doc || !view) return;
    const observer = new view.MutationObserver((records) => {
      for (const record of records) {
        const el = record.target as Element;
        if (el.getAttribute("data-inview") === "false") {
          el.setAttribute("data-inview", "true");
        }
      }
    });
    observer.observe(doc.documentElement, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-inview"],
    });
    return () => observer.disconnect();
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="text-foreground tabular-nums">
          {href} at {w}
        </span>
        <button
          type="button"
          onClick={() => setScreens((s) => (s % 3) + 1)}
          className="rounded-md border border-border px-2 py-0.5 transition-colors hover:text-foreground"
        >
          {screens === 1 ? "one screen tall" : `${screens} screens tall`}
        </button>
        <button
          type="button"
          onClick={() => {
            const frame = ref.current;
            if (frame) frame.src = href;
          }}
          className="rounded-md border border-border px-2 py-0.5 transition-colors hover:text-foreground"
        >
          Reload
        </button>
        <span>
          Scroll inside the frame to walk the page. Entrances are settled on
          purpose: a size read mid-transition is not a size.
        </span>
      </div>
      <div
        ref={boxRef}
        data-frame-fit={trueScale ? "true" : "zoom"}
        className={trueScale ? "overflow-x-auto" : "overflow-hidden"}
      >
        <iframe
          ref={ref}
          src={href}
          title={label}
          loading="lazy"
          onLoad={paint}
          className="mx-auto block shrink-0 rounded-lg border border-border bg-background"
          style={{ width: w, height: h * screens, border: 0, zoom: scale }}
        />
      </div>
    </div>
  );
}

/** One word carries every specimen: it is the brand, and its nine letters cover
 *  an ascender, a descender, three rounds and three straights, which is what a
 *  tracking change is judged on. */
const SPECIMEN = "Partyreel";

/** One specimen row: the step, its numbers, the word at that step, and a
 *  hairline the height of today's cap beside it so the delta reads as a shape
 *  before it reads as two numbers. The ghost is dropped when today IS the
 *  selected ladder: a control comparing a thing with itself reads as broken. */
function SpecimenRow({
  label,
  where,
  spec,
  todaySpec,
}: {
  label: string;
  /** Null on the phone canvas: at 375 this caption wraps to three or four
   *  lines under every row and pushed the specimen past 1,400px, and the glance
   *  tables above carry the same line for all nine steps. */
  where: string | null;
  spec: Spec;
  todaySpec: Spec | null;
}) {
  const same = todaySpec?.px === spec.px;
  return (
    <div className="border-t border-foreground/10 pt-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[11px] font-medium">{label}</span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {spec.px}px / {spec.lh} / {spec.ls}em
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {!todaySpec
            ? "no step today"
            : same
              ? "today's size, kept"
              : `today ${todaySpec.px}px`}
        </span>
        {where && (
          <span className="text-[11px] text-muted-foreground">{where}</span>
        )}
      </div>
      <div className="mt-1 flex items-end gap-3">
        {todaySpec && !same && (
          <span
            data-tsc-ghost
            aria-hidden
            className="shrink-0"
            style={{ height: todaySpec.px, width: 10 }}
          />
        )}
        <span
          className="font-heading"
          style={{
            fontSize: spec.px,
            lineHeight: spec.lh,
            letterSpacing: `${spec.ls}em`,
          }}
        >
          {SPECIMEN}
        </span>
      </div>
    </div>
  );
}

function Specimen({
  ladder,
  marketing,
  app,
  mode,
}: {
  ladder: Ladder;
  marketing: Ladder;
  app: Ladder;
  mode: Mode;
}) {
  const today = ladderById("today");
  const end = mode === "phone" ? "phone" : "desktop";
  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <div>
        <p className="text-sm font-medium">{ladder.name}</p>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
          {ladder.law}
        </p>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
          Costs: {ladder.cost}
        </p>
      </div>
      {(["marketing", "app"] as Surface[]).map((surface) => {
        const from = surface === "marketing" ? marketing : app;
        const count = moved(from, end, surface);
        return (
          <div key={surface} className="flex flex-col gap-4">
            <div className="mt-2 border-t-2 border-foreground/20 pt-3">
              <p className="text-[11px] font-medium">
                {SURFACE_LABEL[surface]}: {from.name}
              </p>
              <p className="mt-0.5 max-w-2xl text-[11px] text-muted-foreground tabular-nums">
                {from.id === "today"
                  ? "the shipped register, resolved at this canvas."
                  : `At ${mode === "phone" ? 375 : 1440} this register moves ${count.moved} of today's ${count.of} sizes${count.added > 0 ? ` and adds ${count.added}` : ""}${count.moved === 0 ? ", so only the leading and the tracking change here. Its argument is at the other canvas." : "."}`}
              </p>
            </div>
            {STEPS.filter((s) => s.surface === surface).map((step) => {
              const value = ladder.steps[step.id];
              if (!value) return null;
              const todayPair = today.steps[step.id];
              const folded = ladder.aliases?.[step.id];
              return (
                <SpecimenRow
                  key={step.id}
                  label={
                    folded ? `${step.label}, folded into ${folded}` : step.label
                  }
                  where={mode === "phone" ? null : step.where}
                  spec={value[end]}
                  todaySpec={todayPair ? todayPair[end] : null}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/** The loudness question on its own ground: the masthead at all four ladders,
 *  so C's claim can be ruled on without reading a table. */
function DisplayCompare({ mode }: { mode: Mode }) {
  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      {LADDERS.map((l) => {
        const spec =
          mode === "phone" ? l.steps.display!.phone : l.steps.display!.desktop;
        return (
          <div key={l.id}>
            <p className="text-[11px] text-white/50 tabular-nums">
              {l.name} at {spec.px}px, {spec.ls}em
            </p>
            <p
              className="font-heading whitespace-nowrap text-white"
              style={{
                fontSize: spec.px,
                lineHeight: spec.lh,
                letterSpacing: `${spec.ls}em`,
              }}
            >
              {SPECIMEN}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────────── The token table ────────────────────────── */

function TokenTable({ ladder }: { ladder: Ladder }) {
  const rows = tokenTable(ladder);
  const [shown, setShown] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-medium text-foreground">
          {ladder.name}: the token table the wiring round bakes into theme.css
        </p>
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          {shown ? "Hide the bake" : "Show the @theme bake"}
        </button>
      </div>
      <p className="mt-1 max-w-3xl text-[11px] text-muted-foreground">
        One set, and the register is only which rungs each half stands on, which
        is why a pair bakes as ONE @theme block whichever two ladders it is. One
        clamp per step, so the ladder runs continuously from 375 to 1440 and
        there is no breakpoint left to jump at. Leading is emitted as a rem
        length, because a unitless line-height cannot sit inside a clamp and a
        step whose leading tightens as it grows needs one. Tracking stays in em,
        which already rides the fluid size. The names are Tailwind v4&rsquo;s
        own font-size shape, so a baked step is ONE class: text-title carries
        its size, its leading and its tracking, and the three four-breakpoint
        ramps in page-hero, section-shell and page-heading collapse into it.
      </p>
      <dl className="mt-3 grid grid-cols-[10rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {rows.map((row) => (
          <div key={row.token} className="contents">
            <dt className="text-foreground">{row.token}</dt>
            <dd className="tabular-nums">
              {row.size}
              <span className="text-muted-foreground/70">
                {" "}
                · lh {row.lh} · ls {row.ls} · {SURFACE_LABEL[row.surface]}
              </span>
            </dd>
          </div>
        ))}
        {FIXED_TOKENS.map((row) => (
          <div key={row.token} className="contents">
            <dt className="text-foreground">{row.token}</dt>
            <dd>
              {row.size}
              <span className="text-muted-foreground/70"> · {row.note}</span>
            </dd>
          </div>
        ))}
      </dl>
      {shown && (
        <div className="mt-3 overflow-x-auto rounded-md border border-border bg-background p-3">
          {/* The body face, never a mono one (bible 7 is retiring and there is
              no mono face in the product); whitespace-pre carries the shape. */}
          <p className="text-[11px] leading-relaxed whitespace-pre text-muted-foreground tabular-nums">
            {themeBlock(ladder)}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────── The board ────────────────────────────── */

/** A specimen stage's height, computed from the ladder rather than guessed, so
 *  a candidate that grew is never cropped by a literal. The per-row allowance
 *  is bigger on the phone canvas (the numbers line wraps at 375); round four's
 *  two register headers add one block each. */
function specimenHeight(ladder: Ladder, mode: Mode): number {
  const rows = STEPS.filter((s) => ladder.steps[s.id]);
  const ink = rows.reduce((sum, s) => {
    const pair = ladder.steps[s.id]!;
    const spec = mode === "phone" ? pair.phone : pair.desktop;
    return sum + Math.max(spec.px * spec.lh, spec.px);
  }, 0);
  const furniture = mode === "phone" ? 320 : 270;
  return Math.round(
    ink + rows.length * (mode === "phone" ? 60 : 52) + furniture,
  );
}

function displayHeight(mode: Mode): number {
  const ink = LADDERS.reduce((sum, l) => {
    const spec =
      mode === "phone" ? l.steps.display!.phone : l.steps.display!.desktop;
    return sum + spec.px * spec.lh;
  }, 0);
  return Math.round(ink + LADDERS.length * 44 + 80);
}

/** The last stage carries the law AND the pairing, and the pairing's two lines
 *  are set at the selected ladder's title step, so they wrap differently under
 *  each one: counted, not assumed, because a stage sized off one line crops. */
function lawHeight(ladder: Ladder, mode: Mode): number {
  const phone = mode === "phone";
  const pair = ladder.steps.title!;
  const spec = phone ? pair.phone : pair.desktop;
  const column = phone ? 335 : 1400;
  const chars = "Every photo, from every guest".length;
  const lines = Math.max(1, Math.ceil((spec.px * 0.45 * chars) / column));
  // The constant is the rest of the stage measured off the DOM (the law rows,
  // the two cards, the paragraphs) plus about forty pixels of slack, so the
  // stage is neither half empty ground nor a crop.
  return Math.round((phone ? 915 : 830) + 2 * lines * spec.px * spec.lh);
}

export function TypeScaleBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  // Both switches open on the board's own recommendation rather than on the
  // control: the first thing a reviewer sees should be the thing proposed.
  const [pair, setPair] = useState<Pair>(DEFAULT_PAIR);
  const marketing = ladderById(pair.marketing);
  const app = ladderById(pair.app);
  const ladder = useMemo(() => composePair(pair), [pair]);
  // The generated block is the paste AND what every frame wears, so a frame and
  // a real tab can never show two different things.
  const css = useMemo(() => candidateCss(ladder), [ladder]);
  const applied = useTunerCandidate();
  const props = { ladder, mode };
  const phone = mode === "phone";
  // The app surfaces are short: a dashboard with three events fills a quarter
  // of a 930px canvas, and empty ground is a lot of scroll between the tiers
  // being compared. Round three measured each stage's ink off the DOM and cut
  // the desktop canvases to it. The phone canvas stays a real viewport:
  // whether an app title reads right on a phone needs the phone.
  const appH = phone ? 760 : 520;
  const dash = phone ? 760 : 330;
  const demo = env.NEXT_PUBLIC_DEMO_QR_TOKEN;
  const marketingPages = REAL_PAGES.filter((p) => !p.demo);
  const album = REAL_PAGES.find((p) => p.demo);

  const ladderOptions = LADDERS.map((l) => ({
    id: l.id as LadderId,
    label: l.name.split(".")[0],
  }));

  return (
    <div className="flex flex-col gap-6 py-4">
      <BoardDock
        label="The type scale board's controls"
        /* The shell's own "Sidebar" pill is `fixed top-2 left-2 z-40` and the
           dock is z-30, so with the sidebar tucked away the pill sits ON TOP of
           whatever control is first in the bar: measured here, it covered the
           left half of the viewport switch. This inset clears it from `sm` up,
           where the dock is sticky. The real fix is the shell's (the pill is
           redundant when a dock is on the page, since the dock carries its own
           Sidebar control) and it is asked for in the handoff. */
        className="sm:pl-20"
        aside={
          <ApplyPair
            ladder={ladder}
            css={css}
            active={applied?.label ?? null}
          />
        }
      >
        <Toggle
          ariaLabel="Viewport"
          options={[
            { id: "desktop" as Mode, label: "Desktop 1440" },
            { id: "phone" as Mode, label: "Phone 375" },
          ]}
          value={mode}
          onChange={setMode}
        />
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">
            Marketing
          </span>
          <Toggle
            ariaLabel="The marketing ladder"
            options={ladderOptions}
            value={pair.marketing}
            onChange={(id) => setPair((p) => ({ ...p, marketing: id }))}
          />
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">
            App
          </span>
          <Toggle
            ariaLabel="The app ladder"
            options={ladderOptions}
            value={pair.app}
            onChange={(id) => setPair((p) => ({ ...p, app: id }))}
          />
        </span>
      </BoardDock>

      <div className="max-w-2xl space-y-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          Bible 5 holds and its numbers were never written. Today&rsquo;s ladder
          hides its phone end inside a class string, and written out that end
          has three distinct sizes doing the work of six: a standard page title
          and a chapter opener are both 36px, and the masthead sits four pixels
          above the home hero. Line-height arrives with whichever Tailwind size
          class a ramp happens to land on, which is why the one hero that needed
          a real value invented a local one. And every heading on the site, from
          a 160px masthead to a 16px card title, is tracked at the same -0.03em,
          against the design system&rsquo;s own rule that letter-spacing and
          line-height run inverse to size.
        </p>
        <p>
          Pick a pair in the dock and everything below re-lays itself. The app
          stages are the production components with three custom properties
          handed to them; the marketing surfaces are the real ROUTES, in frames
          exactly the canvas wide, wearing the same generated block the ruling
          would land. B rebuilds from a rung set where marketing and the app are
          two distances along one ladder. C splits the site into an editorial
          register and an instrument register, pushing marketing past today and
          pulling the app below it. A tunes today and keeps every desktop number
          it ships, which is also its cost.
        </p>
      </div>

      <TheAnswer />

      <Glance
        mode={mode}
        surface="marketing"
        selected={pair.marketing}
        onSelect={(id) => setPair((p) => ({ ...p, marketing: id }))}
      />
      <Glance
        mode={mode}
        surface="app"
        selected={pair.app}
        onSelect={(id) => setPair((p) => ({ ...p, app: id }))}
      />
      <RegisterCall />
      <Reach ladder={ladder} css={css} active={applied?.label ?? null} />

      <Act
        n={1}
        name="The pair, written out"
        question="Are these the steps of each register, and is the top of the marketing one the right loudness?"
      />

      <Variant
        n={1}
        name={`The pair: ${ladder.name}`}
        rationale={ladder.rationale}
        framed={false}
      >
        <Frame mode={mode} ground="paper" height={specimenHeight(ladder, mode)}>
          <Specimen
            ladder={ladder}
            marketing={marketing}
            app={app}
            mode={mode}
          />
        </Frame>
      </Variant>

      <TokenTable ladder={ladder} />

      <Variant
        n={2}
        name="The loudness question"
        rationale="The masthead at all four marketing ladders on one ground, strongest first. B and A keep today's 160; C proposes 200 over a 120 hero, which is the one thing on the board that changes what the front of the site feels like."
        framed={false}
      >
        <Frame mode={mode} ground="cinema" height={displayHeight(mode)}>
          <DisplayCompare mode={mode} />
        </Frame>
      </Variant>

      <Act
        n={2}
        name="Real pages, at the pixels they ship"
        question="Does the marketing register hold across a whole page, and does it separate at both ends where the page is real?"
      />

      <div className="max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
        Each frame below is the ROUTE,{" "}
        {phone ? "exactly 375 pixels wide" : "exactly 1440 pixels wide"}, with
        the pair injected into it. Nothing is scaled, so a size is judged at the
        size it ships; the page&rsquo;s own breakpoints read the frame, so the
        phone end is its real phone end; and every clamp is evaluated rather
        than resolved by hand, so a frame shows the token the wiring round
        bakes. Flip a ladder in the dock and every frame on the page re-lays
        itself where it stands.
      </div>

      {marketingPages.map((page, i) => (
        <Variant
          key={page.id}
          n={3 + i}
          name={page.label}
          rationale={
            page.reach ? `${page.why} Reach: ${page.reach}.` : page.why
          }
          framed={false}
        >
          <PageFrame
            href={page.href}
            label={page.label}
            mode={mode}
            css={css}
          />
        </Variant>
      ))}

      <Act
        n={3}
        name="The app, where the ladder is quiet"
        question="Does the app get a middle tier, and how quiet can its title go before the hierarchy stops working?"
      />

      {album && demo && (
        <Variant
          n={9}
          name={album.label}
          rationale={`${album.why} It is the only app-register surface that is a real page here: nobody signs in to it, so it frames like a marketing page.${album.reach ? ` Reach: ${album.reach}.` : ""}`}
          framed={false}
        >
          <PageFrame
            href={`/e/${demo}`}
            label={album.label}
            mode={mode}
            css={css}
          />
        </Variant>
      )}

      <Variant
        n={10}
        name="The dashboard"
        rationale="PageHeading, the app's section tier and the card row, on the surface a host opens most. Today and A carry no step between the page title and the card, so the section heading renders what production ships: an 11px uppercase label inside an h2. Flip the App switch between today and C here to see the quiet register on a real dashboard."
        framed={false}
      >
        <Frame mode={mode} ground="app-light" height={dash}>
          <Dashboard {...props} />
        </Frame>
      </Variant>

      <Variant
        n={11}
        name="The app's missing middle, judged where it lives"
        rationale="Production writes this tier three ways and none of them is a heading: 11px uppercase inside an h2 on the dashboard and the event feed, 14px in admin, and once sr-only so it is not drawn at all. Beside each, what the selected app ladder puts there."
        framed={false}
      >
        <Frame mode={mode} ground="app-light" height={phone ? 1180 : 590}>
          <MissingMiddle {...props} />
        </Frame>
      </Variant>

      <Variant
        n={12}
        name="An event page, dark"
        rationale="The app's other ground, and the one app title that carries a size override today (text-3xl on PageHeading). Under a named ladder the override has nothing left to do."
        framed={false}
      >
        <Frame mode={mode} ground="app-dark" height={appH}>
          <EventPage {...props} />
        </Frame>
      </Variant>

      <Variant
        n={13}
        name="An admin page"
        rationale="The quietest surface in the product, and where the missing middle is written in its second idiom (a 14px medium h2, not the dashboard's 11px uppercase one). The metric numerals are deliberately off the heading ladder, which is what makes this the one stage where a 20px page title can be seen sitting below the numbers on its own page."
        framed={false}
      >
        <Frame mode={mode} ground="app-light" height={phone ? 900 : 470}>
          <AdminPage {...props} />
        </Frame>
      </Variant>

      <Act
        n={4}
        name="The two rulings a ladder does not settle"
        question="Does the 404's h1 join the ladder, and is the tracking law taken on its own?"
      />

      <Variant
        n={14}
        name="The 404, the one h1 that is not on the ladder"
        rationale={`not-found-screen.tsx renders its title in Inter at 600, with a tracking-tight the theme zeroes. It is the marketing 404, the app 404, the admin 404 and a dead guest link. Putting it on the ladder is the ${askOrdinal(ASK_404)} ask.`}
        framed={false}
      >
        <Frame mode={mode} ground="app-light" height={phone ? 980 : 460}>
          <NotFoundStage {...props} />
        </Frame>
      </Variant>

      <Variant
        n={15}
        name="The tracking law, alone, and the pairing under it"
        rationale="The same word at the masthead size and the same card title at 16, under the flat -0.03em and under the law. No size moves in the top half, which is what makes this a separate ruling: adopt it whichever pair wins. The pairing check sits underneath because it is the same evidence read twice."
        framed={false}
      >
        <Frame mode={mode} ground="paper" height={lawHeight(ladder, mode)}>
          <TrackingLaw {...props} />
        </Frame>
      </Variant>

      <BoardMeta
        question={QUESTION}
        candidates={[...LADDERS, LAW_ONLY].map((l) => ({
          name: l.id === RECOMMENDED ? `${l.name} (the board's pick)` : l.name,
          rationale: l.rationale,
        }))}
        asks={ASKS.map((a) => a.ask)}
        departures={DEPARTURES}
      />
    </div>
  );
}

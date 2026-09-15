"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import {
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

import {
  BoardMeta,
  clearCandidate,
  setCandidateCss,
  Stage,
  Toggle,
  useTunerCandidate,
  type Ground,
  type Mode,
} from "@/components/dev/board";
import { cn } from "@/lib/utils";

import { Variant } from "../variant-frame";
import {
  APP_BODY_PX,
  candidateCss,
  FIXED_TOKENS,
  ladderById,
  LADDERS,
  LAW_ONLY,
  STEPS,
  themeBlock,
  tokenTable,
  type Ladder,
  type LadderId,
  type Spec,
} from "./ladders";
import {
  AboutPaper,
  AdminPage,
  AppRegisters,
  Dashboard,
  EventPage,
  FeaturePage,
  HelpMasthead,
  HeroBoardLockup,
  HomeHero,
  HomeSections,
  MissingMiddle,
  NotFoundStage,
  TrackingLaw,
} from "./pages";

/**
 * THE TYPE-SCALE BOARD (the review wave; round two, 2026-09-14).
 *
 * Bible 5 holds: one heading face on one site ladder. What was never nailed is
 * the ladder's numbers, so this board writes them, on the real pages, at both
 * canvases, as a token table the wiring round bakes.
 *
 * ── WHAT ROUND TWO CHANGED ──
 * Round one proved the ladders on stages. Round two makes each one a PASTE: a
 * candidate is a block of real CSS against the real selectors, applied to the
 * whole site from the bar at the top, so the ruling happens on the home page
 * and the dashboard rather than on a canvas. Around that, four things round one
 * could not answer are now on the board: the app's missing middle judged where
 * it lives (stage 10), the tracking law standing on its own so it can be
 * adopted whichever ladder wins (stage 15), the loudest step judged against the
 * hero board's own lockup rather than PageHero (stage 4), and the 404's h1, the
 * one page title on the site in Inter (stage 14). C's app register was rebuilt
 * from the ground up against a real dashboard (stage 13).
 *
 * ── HOW TO READ IT ──
 * Pick a ladder at the top and every stage below re-lays itself out, because
 * the stages are the PRODUCTION components (PageHero, SectionShell,
 * PageHeading, Card, NotFoundScreen) with three custom properties handed to
 * them; nothing here retypes a page.
 *
 * ── THE THREE CANDIDATES SPAN THE RANGE (bible 22) ──
 * A keeps every desktop number the site ships and fixes only what is broken.
 * B throws the numbers away and rebuilds from a rung set, with marketing and
 * the app as two distances along one ladder. C says one ladder is the wrong
 * abstraction and splits the site into an editorial register and an instrument
 * register. They are not three shades of one answer: A cannot fix the app, B
 * makes the phone middle quieter than today, C doubles the ladders.
 *
 * Rising tides: the departures are on BoardMeta, not in a footnote. No mono
 * face and no mono caption atom anywhere on a board (bible 7 is retiring).
 */

const QUESTION =
  "One heading ladder for marketing and one for the app, on real pages at 1440 and 375 and pasteable at the whole site: which sizes, line-heights and tracking, proposed as tokens the wiring round bakes?";

const ASKS = [
  "The marketing ladder: today, A tuned, B rungs or C registers",
  "The app ladder: today, A tuned, B rungs or C registers",
  "The tracking law, which moves no size and can be taken on its own: adopt, or keep the flat -0.03em",
  `The app's floor (no heading below the ${APP_BODY_PX}px body a card sets, so the card title stops at 16): adopt, or let C's 14 stand`,
  "The 404's h1, the one page title on the site in Inter: put it on the ladder, or leave it off",
  "The face pairing: keep Inter with Urbanist, or open a face round",
];

const DEPARTURES = [
  "The pairing is NOT departed from. Inter with Urbanist survives the loudest step once tracking runs inverse to size: what reads wrong at 160px and again at 16px is the constant -0.03em, not the face. Stage 16 is the evidence, and a face round would be its own ruling.",
  "Every candidate closes the masthead's tracking squeeze (.mkt-name opens to +0.022em) onto the display step's OWN tracking, between -0.04em and -0.05em, rather than the shared -0.03em constant it lands on today. The paste closes it in marketing.css's own two places and leaves the squeeze itself running.",
  "C collapses marketing's six heading steps to five and folds the 24/30 prose tier into the section step, so /about's story sections and /press's sections move up a tier. That contradicts design-system.md's documented three-tier h2 ladder; it is C's argument, not an oversight.",
  "C's app register was rebuilt in round two. The page title at 20 survived a real dashboard (in an app a title is a locator, not a headline); the card title at 14 did not, because a Card sets text-sm on its whole subtree, so 14 is the size of the sentence under the title. C now runs 20 / 18 / 16, and the floor under it is proposed as a law for every ladder, which is the fourth ask.",
  "B states bible 2 as arithmetic: marketing travels four rungs between 375 and 1440 and the app travels one. That turns 'marketing may be louder' from a judgement into a rule, which is a bible finding if B is adopted.",
  "Bible 5 says one heading face on one site ladder, and the 404's h1 has always been outside both: Inter at 600, the only page title on the site that is not the heading face. Every paste puts it on the ladder, which is a change no ruling has made yet, so it is the fifth ask rather than a silent fix.",
];

/** The pages a candidate is walked on once it is applied. The key is carried
 *  from this page's own URL, never written down here. */
const WALK: { href: string; label: string }[] = [
  { href: "/", label: "the home" },
  { href: "/pricing", label: "/pricing" },
  { href: "/features/curation", label: "a feature page" },
  { href: "/help", label: "/help" },
  { href: "/about", label: "/about" },
  { href: "/contact", label: "/contact" },
  { href: "/dashboard", label: "the dashboard" },
  { href: "/admin", label: "/admin" },
  { href: "/nothing-here", label: "a 404" },
];

/* ──────────────────────────── The board's frame ───────────────────────── */

/** Every stage's inner frame: `data-tsc` for the sheet to hook, a hand-resolved
 *  gutter (the canvas is zoomed, so `lg:px-8` would read the browser window),
 *  and data-inview so the production entrances land settled instead of waiting
 *  on an observer inside a zoom. The two attributes sit on two nested elements
 *  on purpose: board.css needs `[data-tsc] [data-tsc-page]` to clear
 *  marketing.css's own (0,2,0) rules without an !important. */
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

/** One act's header. The board is sixteen stages long because the ladder
 *  touches four different arguments, and a reviewer who knows which argument
 *  he is in can rule on one and move on. */
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

/* ───────────────────────── Apply it to the site ───────────────────────── */

/**
 * ROUND TWO'S CENTRE OF GRAVITY. Every candidate is generated as one CSS block
 * against the real selectors (see HOOKS in ladders.ts) and handed to the whole
 * site through the shell's candidate store, so the ruling is made on the real
 * home page, the real /help and the real dashboard.
 *
 * ★ APPLY TODAY FIRST: it is the shipped ladder resolved, so if the paste is
 * honest the site does not move at 1440 or at 375. That is the block's own
 * proof, and it takes one click. (In between those widths it will move, on
 * purpose: a clamp is smooth where a four-breakpoint ramp steps.)
 */
/** The lab's own gate key, read off this page's URL so the walk links carry it
 *  and nothing writes it down. Through useSyncExternalStore rather than an
 *  effect: the server snapshot is null, so the first client render matches and
 *  the links fill in on hydration with no mismatch and no cascading render. */
const NEVER_CHANGES = () => () => {};
const readKey = () => new URLSearchParams(window.location.search).get("key");
const NO_KEY = () => null;

function ApplyBar({ active }: { active: string | null }) {
  const key = useSyncExternalStore(NEVER_CHANGES, readKey, NO_KEY);
  const [copied, setCopied] = useState<string | null>(null);

  const blocks: Ladder[] = [...LADDERS, LAW_ONLY];
  const label = (l: Ladder) => `type-scale: ${l.name}`;

  const copy = async (l: Ladder) => {
    try {
      await navigator.clipboard.writeText(candidateCss(l));
      setCopied(l.id);
    } catch {
      // A lab affordance: a browser that refuses the clipboard just does not
      // flash "copied", and every block is still visible under the table.
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-foreground">
          Apply to the site
        </span>
        {blocks.map((l) => {
          const on = active === label(l);
          return (
            <span key={l.id} className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCandidateCss(label(l), candidateCss(l))}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors",
                  on
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {on ? `${l.name}, applied` : l.name}
              </button>
              <button
                type="button"
                onClick={() => void copy(l)}
                className="rounded-md px-1.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                {copied === l.id ? "copied" : "copy"}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => clearCandidate()}
          className="rounded-md border border-border px-2.5 py-1 text-[12px] text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      </div>

      <p className="max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
        The block lands as a style element after every stylesheet on every page
        with the design key, so it is the candidate on the real site rather than
        on a stage. Apply Today first: it is the shipped ladder resolved, so a
        correct paste moves nothing at 1440 or at 375, which is the
        block&rsquo;s own proof. One thing it cannot reach: the app&rsquo;s
        section heading, which production writes as a label inside an h2 and
        which has no hook to aim at (stage 10 is where that tier is judged).
      </p>

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
        <span className="text-foreground">Walk it on</span>
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
        <span>
          plus an event page and the demo album, which need the signed-in host.
        </span>
      </p>
    </div>
  );
}

/** One word carries every specimen: it is the brand, and its nine letters cover
 *  an ascender, a descender, three rounds and three straights, which is what a
 *  tracking change is judged on. */
const SPECIMEN = "Partyreel";

/** One specimen row: the step, its numbers, the word at that step, and a
 *  hairline the height of today's cap beside it so the delta reads as a shape
 *  before it reads as two numbers. */
function SpecimenRow({
  label,
  where,
  spec,
  todaySpec,
}: {
  label: string;
  where: string;
  spec: Spec;
  todaySpec: Spec | null;
}) {
  return (
    <div className="border-t border-foreground/10 pt-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[11px] font-medium">{label}</span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {spec.px}px / {spec.lh} / {spec.ls}em
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {todaySpec ? `today ${todaySpec.px}px` : "no step today"}
        </span>
        <span className="text-[11px] text-muted-foreground">{where}</span>
      </div>
      <div className="mt-1 flex items-end gap-3">
        {todaySpec && (
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

function Specimen({ ladder, mode }: { ladder: Ladder; mode: Mode }) {
  const today = ladderById("today");
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
      {STEPS.map((step) => {
        const pair = ladder.steps[step.id];
        if (!pair) return null;
        const todayPair = today.steps[step.id];
        const folded = ladder.aliases?.[step.id];
        return (
          <SpecimenRow
            key={step.id}
            label={folded ? `${step.label}, folded into ${folded}` : step.label}
            where={step.where}
            spec={mode === "phone" ? pair.phone : pair.desktop}
            todaySpec={
              todayPair
                ? mode === "phone"
                  ? todayPair.phone
                  : todayPair.desktop
                : null
            }
          />
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

/** The pairing check. The brief holds the pairing outside the question and
 *  outside protection, so it gets one stage and a verdict: the same face at the
 *  same size, the constant tracking against the step's own. */
function PairingCheck({ ladder, mode }: { ladder: Ladder; mode: Mode }) {
  const pair = ladder.steps.title!;
  const spec = mode === "phone" ? pair.phone : pair.desktop;
  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <div>
        <p className="text-[11px] text-muted-foreground">
          Urbanist at the title step, tracked the way it ships: -0.03em at every
          size
        </p>
        <p
          className="font-heading"
          style={{
            fontSize: spec.px,
            lineHeight: spec.lh,
            letterSpacing: "-0.03em",
          }}
        >
          Every photo, from every guest
        </p>
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          The same face and size at this step&rsquo;s own tracking, {spec.ls}em
        </p>
        <p
          className="font-heading"
          style={{
            fontSize: spec.px,
            lineHeight: spec.lh,
            letterSpacing: `${spec.ls}em`,
          }}
        >
          Every photo, from every guest
        </p>
      </div>
      <div className="max-w-2xl border-t border-foreground/10 pt-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Inter underneath, unchanged. The verdict this board reaches: the
          pairing holds. A geometric sans at a poster size wants more negative
          tracking than a UI label does, and the constant is what makes Urbanist
          read loose at 160px and cramped at 16px. Fix the tracking and there is
          no case left for a new face, so no face round is requested here.
        </p>
      </div>
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
        One clamp per step, so the ladder runs continuously from 375 to 1440 and
        there is no breakpoint left to jump at. Leading is emitted as a rem
        length, because a unitless line-height cannot sit inside a clamp and a
        step whose leading tightens as it grows needs one. Tracking stays in em,
        which already rides the fluid size. Round two moved the names into
        Tailwind v4&rsquo;s own font-size shape, so the bake is one @theme block
        and a baked step is ONE class: text-title carries its size, its leading
        and its tracking, and the three four-breakpoint ramps in page-hero,
        section-shell and page-heading collapse into it.
      </p>
      <dl className="mt-3 grid grid-cols-[10rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {rows.map((row) => (
          <div key={row.token} className="contents">
            <dt className="text-foreground">{row.token}</dt>
            <dd className="tabular-nums">
              {row.size}
              <span className="text-muted-foreground/70">
                {" "}
                · lh {row.lh} · ls {row.ls}
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
 *  is bigger on the phone canvas because each row's caption ("where this step
 *  lives") wraps to three or four lines at 375: sized off the ink alone, the
 *  phone specimen lost its last two rows. */
function specimenHeight(ladder: Ladder, mode: Mode): number {
  const rows = STEPS.filter((s) => ladder.steps[s.id]);
  const ink = rows.reduce((sum, s) => {
    const pair = ladder.steps[s.id]!;
    const spec = mode === "phone" ? pair.phone : pair.desktop;
    return sum + Math.max(spec.px * spec.lh, spec.px);
  }, 0);
  return Math.round(ink + rows.length * (mode === "phone" ? 104 : 52) + 150);
}

function displayHeight(mode: Mode): number {
  const ink = LADDERS.reduce((sum, l) => {
    const spec =
      mode === "phone" ? l.steps.display!.phone : l.steps.display!.desktop;
    return sum + spec.px * spec.lh;
  }, 0);
  return Math.round(ink + LADDERS.length * 44 + 80);
}

/** The hero lockup stage, twice over: today's hand-rolled ramp above the step.
 *  Sized off the taller of the two heroes so no candidate is cropped. */
function lockupHeight(ladder: Ladder, mode: Mode): number {
  const pair = ladder.steps.hero!;
  const spec = mode === "phone" ? pair.phone : pair.desktop;
  const today = mode === "phone" ? 48 : 96;
  const lines = mode === "phone" ? 2 : 1;
  const furniture = mode === "phone" ? 250 : 230;
  return Math.round(
    (spec.px * spec.lh + today * 1.02) * lines + 2 * furniture + 40,
  );
}

export function TypeScaleBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [ladderId, setLadderId] = useState<LadderId>("today");
  const ladder = ladderById(ladderId);
  const applied = useTunerCandidate();
  const props = { ladder, mode };
  const phone = mode === "phone";
  const tall = phone ? 760 : 930;
  // The app surfaces are short: a dashboard with three events fills a quarter
  // of a 930px canvas, and three stages of empty ground is a lot of scroll
  // between the tiers being compared. The phone canvas stays a real viewport.
  const app = phone ? 760 : 620;

  return (
    <div className="flex flex-col gap-6 py-4">
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
          Pick a ladder and every stage below re-lays itself out. The stages are
          the production components with three custom properties handed to them,
          so this is the site rather than a mock. A tunes today and keeps every
          desktop number it ships. B rebuilds from a rung set where marketing
          and the app are two distances along one ladder. C splits the site into
          an editorial register and an instrument register, pushing marketing
          past today and pulling the app below it.
        </p>
        <p className="text-foreground">
          If you walk three things: apply B and look at the home page and the
          dashboard, then stage 10 for the tier the app does not have, then
          stage 15 for the tracking law, which stands on its own and is the one
          fault today&rsquo;s sizes can fix without moving.
        </p>
      </div>

      <ApplyBar active={applied?.label ?? null} />

      <div className="flex flex-wrap items-center gap-3">
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
          ariaLabel="Ladder"
          options={LADDERS.map((l) => ({
            id: l.id as LadderId,
            label: l.name,
          }))}
          value={ladderId}
          onChange={setLadderId}
        />
        <span className="max-w-md text-[11px] text-muted-foreground">
          {ladder.law}
        </span>
      </div>

      <Act
        n={1}
        name="The ladder, written out"
        question="Are these the steps, and is the top of it the right loudness?"
      />

      <Variant
        n={1}
        name={`The ladder: ${ladder.name}`}
        rationale={ladder.rationale}
        framed={false}
      >
        <Frame mode={mode} ground="paper" height={specimenHeight(ladder, mode)}>
          <Specimen ladder={ladder} mode={mode} />
        </Frame>
      </Variant>

      <TokenTable ladder={ladder} />

      <Variant
        n={2}
        name="The loudness question"
        rationale="The masthead at all four ladders on one ground. Today is 160 over a 96 hero; C proposes 200 over 120, and an app that drops to 20."
        framed={false}
      >
        <Frame mode={mode} ground="cinema" height={displayHeight(mode)}>
          <DisplayCompare mode={mode} />
        </Frame>
      </Variant>

      <Act
        n={2}
        name="Marketing, on the real pages"
        question="Do the six marketing steps separate at both ends, and does the loudest one hold where it actually lives?"
      />

      <Variant
        n={3}
        name="The home: the hero"
        rationale="PageHero at the hero step with the ruled thesis. The shipped hero hand-rolls this same ramp plus a leading of its own, which is the case for naming one."
        framed={false}
      >
        <Frame mode={mode} ground="cinema" height={tall}>
          <HomeHero {...props} />
        </Frame>
      </Variant>

      <Variant
        n={4}
        name="The same step, as the hero board draws it"
        rationale="The hero concepts do not use PageHero: they resolve the xl step by hand and add a leading-[1.02] of their own. The loudest step on the site is not reached by changing one component, and this is what the step does to that lockup."
        framed={false}
      >
        <Frame mode={mode} ground="cinema" height={lockupHeight(ladder, mode)}>
          <HeroBoardLockup {...props} />
        </Frame>
      </Variant>

      <Variant
        n={5}
        name="The home: the chapter anchor and a body section"
        rationale="The two SectionShell tiers, one above the other. At 375 today gives a chapter opener the same 36px as a page title, and this is where that shows."
        framed={false}
      >
        <Frame mode={mode} ground="cinema" height={tall}>
          <HomeSections {...props} />
        </Frame>
      </Variant>

      <Variant
        n={6}
        name="A feature page: the title and the cards it introduces"
        rationale="Title over section over card: the only stage where three tiers meet in one screen, so a ladder that separates on paper has to separate here."
        framed={false}
      >
        {/* Deliberately taller than a phone viewport: three tiers stacked is
            more than 760px at 375, and a real phone answers that by scrolling.
            Cropping the cards here would hide the step this stage exists for. */}
        <Frame mode={mode} ground="cinema" height={phone ? 1140 : tall}>
          <FeaturePage {...props} />
        </Frame>
      </Variant>

      <Variant
        n={7}
        name="/help: the masthead"
        rationale="The same title step in the blur register, centred, with the front desk's quick links under it."
        framed={false}
      >
        <Frame mode={mode} ground="cinema" height={tall}>
          <HelpMasthead {...props} />
        </Frame>
      </Variant>

      <Variant
        n={8}
        name="/about on paper: the display step over the prose tier"
        rationale="The loudest and the quietest marketing steps on one page. C folds the prose tier away, and this is the stage that shows what that costs."
        framed={false}
      >
        <Frame mode={mode} ground="paper" height={tall}>
          <AboutPaper {...props} />
        </Frame>
      </Variant>

      <Act
        n={3}
        name="The app, where the ladder is quiet"
        question="Does the app get a middle tier, and how quiet can its title go before the hierarchy stops working?"
      />

      <Variant
        n={9}
        name="The dashboard"
        rationale="PageHeading, the app's section tier and the card row, on the surface a host opens most. Today and A carry no step between the page title and the card, so the section heading renders what production ships: an 11px uppercase label inside an h2."
        framed={false}
      >
        <Frame mode={mode} ground="app-light" height={app}>
          <Dashboard {...props} />
        </Frame>
      </Variant>

      <Variant
        n={10}
        name="The app's missing middle, judged where it lives"
        rationale="Production writes this tier three ways and none of them is a heading: 11px uppercase inside an h2 on the dashboard and the event feed, 14px in admin, and once sr-only so it is not drawn at all. Beside each, what the selected ladder puts there."
        framed={false}
      >
        <Frame mode={mode} ground="app-light" height={phone ? 1180 : 660}>
          <MissingMiddle {...props} />
        </Frame>
      </Variant>

      <Variant
        n={11}
        name="An event page, dark"
        rationale="The one app title that carries a size override today (text-3xl on PageHeading). Under a named ladder the override has nothing left to do."
        framed={false}
      >
        <Frame mode={mode} ground="app-dark" height={app}>
          <EventPage {...props} />
        </Frame>
      </Variant>

      <Variant
        n={12}
        name="An admin page"
        rationale="The quietest surface on the site, where C's instrument register either reads composed or reads small."
        framed={false}
      >
        <Frame mode={mode} ground="app-light" height={app}>
          <AdminPage {...props} />
        </Frame>
      </Variant>

      <Variant
        n={13}
        name="C's app register, reconsidered from the ground up"
        rationale="Round one proposed 20 / 16 / 14. On a real dashboard the quiet title held and the 14px card title did not, because a card sets text-sm on its whole subtree, so the title was the size of the sentence under it. What round two ships is on the right, and the floor under it is the fourth ask."
        framed={false}
      >
        <Frame mode={mode} ground="app-light" height={phone ? 1240 : 470}>
          <AppRegisters mode={mode} />
        </Frame>
      </Variant>

      <Variant
        n={14}
        name="The 404, the one h1 that is not on the ladder"
        rationale="not-found-screen.tsx renders its title in Inter at 600, with a tracking-tight the theme zeroes. It is the marketing 404, the app 404, the admin 404 and a dead guest link. Putting it on the ladder is the fifth ask."
        framed={false}
      >
        <Frame mode={mode} ground="app-light" height={phone ? 980 : 520}>
          <NotFoundStage {...props} />
        </Frame>
      </Variant>

      <Act
        n={4}
        name="The two laws under every candidate"
        question="Can the tracking law be taken on its own, and does the face pairing survive the loudest step?"
      />

      <Variant
        n={15}
        name="The tracking law, alone"
        rationale="The same word at the masthead size and the same card title at 16, under the flat -0.03em and under the law. No size moves here, which is what makes this a separate ruling: adopt it whichever ladder wins."
        framed={false}
      >
        <Frame mode={mode} ground="paper" height={phone ? 720 : 760}>
          <TrackingLaw mode={mode} />
        </Frame>
      </Variant>

      <Variant
        n={16}
        name="The pairing check"
        rationale="The pairing is not the question and is not protected either, so it gets one stage: the same face at the same size, the constant tracking against the step's own."
        framed={false}
      >
        <Frame mode={mode} ground="paper" height={phone ? 620 : 560}>
          <PairingCheck ladder={ladder} mode={mode} />
        </Frame>
      </Variant>

      <BoardMeta
        question={QUESTION}
        candidates={[...LADDERS, LAW_ONLY].map((l) => ({
          name: l.name,
          rationale: l.rationale,
        }))}
        asks={ASKS}
        departures={DEPARTURES}
      />
    </div>
  );
}

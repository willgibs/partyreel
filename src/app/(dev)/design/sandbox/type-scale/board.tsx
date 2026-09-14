"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useState, type CSSProperties, type ReactNode } from "react";

import {
  BoardMeta,
  Stage,
  Toggle,
  type Ground,
  type Mode,
} from "@/components/dev/board";

import { Variant } from "../variant-frame";
import {
  FIXED_TOKENS,
  ladderById,
  LADDERS,
  STEPS,
  tokenTable,
  type Ladder,
  type LadderId,
  type Spec,
} from "./ladders";
import {
  AboutPaper,
  AdminPage,
  Dashboard,
  EventPage,
  FeaturePage,
  HelpMasthead,
  HomeHero,
  HomeSections,
} from "./pages";

/**
 * THE TYPE-SCALE BOARD (the review wave, 2026-09-14).
 *
 * Bible 5 holds: one heading face on one site ladder. What was never nailed is
 * the ladder's numbers, so this board writes them, on the real pages, at both
 * canvases, as a token table the wiring round bakes.
 *
 * ── HOW TO READ IT ──
 * Pick a ladder at the top and every stage below re-lays itself out, because
 * the stages are the PRODUCTION components (PageHero, SectionShell,
 * PageHeading, Card) with three custom properties handed to them; nothing here
 * retypes a page. The ladder toggle is the whole comparison.
 *
 * ── THE THREE CANDIDATES SPAN THE RANGE (bible 22) ──
 * A keeps every desktop number the site ships and fixes only what is broken.
 * B throws the numbers away and rebuilds from a rung set, with marketing and
 * the app as two distances along one ladder. C says one ladder is the wrong
 * abstraction and splits the site into an editorial register and an instrument
 * register. They are not three shades of one answer: A cannot fix the app, B
 * makes the phone middle quieter than today, C doubles the ladders.
 *
 * ── THE FINDING UNDER ALL THREE ──
 * `font-heading` tracks every heading at -0.03em, from a 160px masthead to a
 * 16px card title, while the design system's own small-type rule already says
 * letter-spacing and line-height run inverse to size. Every candidate
 * implements the law the system states; today's ladder is the only one that
 * does not. It is a separate ask, because it can be adopted even if today's
 * sizes win.
 *
 * Rising tides: the departures are on BoardMeta, not in a footnote. No mono
 * face and no mono caption atom anywhere on a board (bible 7 is retiring).
 */

const QUESTION =
  "One heading ladder for marketing and one for the app, on real pages at 1440 and 375: which sizes, line-heights and tracking, proposed as tokens the wiring round bakes?";

const ASKS = [
  "The marketing ladder: today, A tuned, B rungs or C registers",
  "The app ladder: today, A tuned, B rungs or C registers",
  "The tracking law (leading and tracking named per step, running inverse to size): adopt, or keep the flat -0.03em",
  "The face pairing: keep Inter with Urbanist, or open a face round",
];

const DEPARTURES = [
  "The pairing is NOT departed from. Inter with Urbanist survives the loudest step once tracking runs inverse to size: what reads wrong at 160px and again at 16px is the constant -0.03em, not the face. Stage 11 is the evidence, and a face round would be its own ruling.",
  "Every candidate closes the masthead's tracking squeeze (.mkt-name opens to +0.022em) onto the display step's OWN tracking, between -0.04em and -0.05em, rather than the shared -0.03em constant it lands on today.",
  "C collapses marketing's six heading steps to five and folds the 24/30 prose tier into the section step, so /about's story sections and /press's sections move up a tier. That contradicts design-system.md's documented three-tier h2 ladder; it is C's argument, not an oversight.",
  "C drops the app page title from 24 to 20 and the card title from 16 to 14, so the app's hierarchy moves off size and onto weight and colour. It is the loudest claim on the board and the first thing to reject if it reads cheap.",
  "B states bible 2 as arithmetic: marketing travels four rungs between 375 and 1440 and the app travels one. That turns 'marketing may be louder' from a judgement into a rule, which is a bible finding if B is adopted.",
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
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-medium text-foreground">
        {ladder.name}: the token table the wiring round bakes into theme.css
      </p>
      <p className="mt-1 max-w-3xl text-[11px] text-muted-foreground">
        One clamp per step, so the ladder runs continuously from 375 to 1440 and
        there is no breakpoint left to jump at. Leading is emitted as a rem
        length, because a unitless line-height cannot sit inside a clamp and a
        step whose leading tightens as it grows needs one. Tracking stays in em,
        which already rides the fluid size.
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
    </div>
  );
}

/* ─────────────────────────────── The board ────────────────────────────── */

/** A specimen stage's height, computed from the ladder rather than guessed, so
 *  a candidate that grew is never cropped by a literal. */
function specimenHeight(ladder: Ladder, mode: Mode): number {
  const rows = STEPS.filter((s) => ladder.steps[s.id]);
  const ink = rows.reduce((sum, s) => {
    const pair = ladder.steps[s.id]!;
    const spec = mode === "phone" ? pair.phone : pair.desktop;
    return sum + Math.max(spec.px * spec.lh, spec.px);
  }, 0);
  return Math.round(ink + rows.length * 52 + 150);
}

function displayHeight(mode: Mode): number {
  const ink = LADDERS.reduce((sum, l) => {
    const spec =
      mode === "phone" ? l.steps.display!.phone : l.steps.display!.desktop;
    return sum + spec.px * spec.lh;
  }, 0);
  return Math.round(ink + LADDERS.length * 44 + 80);
}

export function TypeScaleBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [ladderId, setLadderId] = useState<LadderId>("today");
  const ladder = ladderById(ladderId);
  const props = { ladder, mode };
  const tall = mode === "phone" ? 760 : 930;

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
      </div>

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
          options={LADDERS.map((l) => ({ id: l.id, label: l.name }))}
          value={ladderId}
          onChange={setLadderId}
        />
        <span className="max-w-md text-[11px] text-muted-foreground">
          {ladder.law}
        </span>
      </div>

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
        name="The home: the chapter anchor and a body section"
        rationale="The two SectionShell tiers, one above the other. At 375 today gives a chapter opener the same 36px as a page title, and this is where that shows."
        framed={false}
      >
        <Frame mode={mode} ground="cinema" height={tall}>
          <HomeSections {...props} />
        </Frame>
      </Variant>

      <Variant
        n={5}
        name="A feature page: the title and the cards it introduces"
        rationale="Title over section over card: the only stage where three tiers meet in one screen, so a ladder that separates on paper has to separate here."
        framed={false}
      >
        <Frame mode={mode} ground="cinema" height={tall}>
          <FeaturePage {...props} />
        </Frame>
      </Variant>

      <Variant
        n={6}
        name="/help: the masthead"
        rationale="The same title step in the blur register, centred, with the front desk's quick links under it."
        framed={false}
      >
        <Frame mode={mode} ground="cinema" height={tall}>
          <HelpMasthead {...props} />
        </Frame>
      </Variant>

      <Variant
        n={7}
        name="/about on paper: the display step over the prose tier"
        rationale="The loudest and the quietest marketing steps on one page. C folds the prose tier away, and this is the stage that shows what that costs."
        framed={false}
      >
        <Frame mode={mode} ground="paper" height={tall}>
          <AboutPaper {...props} />
        </Frame>
      </Variant>

      <Variant
        n={8}
        name="The dashboard"
        rationale="PageHeading, the app's section tier and the card row. Today and A carry no step between the page title and the card, so the section heading renders what production actually ships there: a 14px label inside an h2."
        framed={false}
      >
        <Frame mode={mode} ground="app-light" height={tall}>
          <Dashboard {...props} />
        </Frame>
      </Variant>

      <Variant
        n={9}
        name="An event page, dark"
        rationale="The one app title that carries a size override today (text-3xl on PageHeading). Under a named ladder the override has nothing left to do."
        framed={false}
      >
        <Frame mode={mode} ground="app-dark" height={tall}>
          <EventPage {...props} />
        </Frame>
      </Variant>

      <Variant
        n={10}
        name="An admin page"
        rationale="The quietest surface on the site, where C's instrument register either reads composed or reads small."
        framed={false}
      >
        <Frame mode={mode} ground="app-light" height={tall}>
          <AdminPage {...props} />
        </Frame>
      </Variant>

      <Variant
        n={11}
        name="The pairing check"
        rationale="The pairing is not the question and is not protected either, so it gets one stage: the same face at the same size, the constant tracking against the step's own."
        framed={false}
      >
        <Frame mode={mode} ground="paper" height={mode === "phone" ? 620 : 560}>
          <PairingCheck ladder={ladder} mode={mode} />
        </Frame>
      </Variant>

      <TokenTable ladder={ladder} />

      <BoardMeta
        question={QUESTION}
        candidates={LADDERS.map((l) => ({
          name: l.name,
          rationale: l.rationale,
        }))}
        asks={ASKS}
        departures={DEPARTURES}
      />
    </div>
  );
}

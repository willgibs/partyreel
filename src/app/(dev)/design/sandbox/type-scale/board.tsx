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
  ASK_404,
  askOrdinal,
  ASKS,
  candidateCss,
  FIXED_TOKENS,
  FIXES,
  fixes,
  ladderById,
  LADDERS,
  LAW_ONLY,
  moved,
  NO_ISLAND,
  RECOMMENDED,
  STEPS,
  themeBlock,
  tokenTable,
  WALK,
  type Ladder,
  type LadderId,
  type Spec,
} from "./ladders";
import {
  AboutPaper,
  Dashboard,
  EventPage,
  FeaturePage,
  HeroBoardLockup,
  HomeSections,
  MissingMiddle,
  NotFoundStage,
  TrackingLaw,
} from "./pages";

/**
 * THE TYPE-SCALE BOARD (the review wave; round three, 2026-09-14).
 *
 * Bible 5 holds: one heading face on one site ladder. What was never nailed is
 * the ladder's numbers, so this board writes them, on the real pages, at both
 * canvases, as a token table the wiring round bakes.
 *
 * ── THE THREE ROUNDS, AND WHAT EACH ONE WAS FOR ──
 * One wrote the ladder down: today's, resolved from the class strings, beside
 * three candidates spanning tune to replace. Two made every candidate a PASTE,
 * so a ruling happens on the real home page rather than on a canvas. Three
 * walked the board the way Will will and made it RULABLE: the board says what
 * it would ship, four asks instead of six, a glance table that answers "do two
 * of these read the same", and five stages cut because the paste or another
 * stage already told that story. Sixteen stages became eleven, and measured off
 * the DOM at the same 992px lab column the walk came down from 11,847 to 10,450
 * pixels on the desktop canvas and from 17,412 to 14,089 on the phone one, with
 * the whole ruling now inside the first screen and a half instead of nowhere.
 *
 * ── HOW TO READ IT ──
 * The answer is at the top. Under it, apply a candidate and walk the real site.
 * Pick a ladder and every stage below re-lays itself out, because the stages
 * are the PRODUCTION components (PageHero, SectionShell, PageHeading, Card,
 * NotFoundScreen) with three custom properties handed to them; nothing here
 * retypes a page.
 *
 * ── THE THREE CANDIDATES SPAN THE RANGE (bible 22) ──
 * A keeps every desktop number the site ships and fixes only what is broken.
 * B throws the numbers away and rebuilds from a rung set, with marketing and
 * the app as two distances along one ladder. C says one ladder is the wrong
 * abstraction and splits the site into an editorial register and an instrument
 * register. They are not three shades of one answer: A cannot fix the app, B
 * makes the phone middle quieter than today, C doubles the ladders. Where two
 * of them DO read the same (A and today share every desktop size), the glance
 * table counts it rather than letting a reviewer discover it by toggling.
 *
 * Rising tides: the departures are on BoardMeta, not in a footnote. No mono
 * face and no mono caption atom anywhere on a board (bible 7 is retiring).
 */

const QUESTION =
  "One heading ladder for marketing and one for the app, on real pages at 1440 and 375 and pasteable at the whole site: which sizes, line-heights and tracking, proposed as tokens the wiring round bakes?";

/**
 * ROUND THREE: THE DEPARTURES WILL MUST RULE ON, AND THE WAVE'S OWN INPUTS.
 * Round two flagged six. Two of them are settled rather than open (C's app
 * register was rebuilt inside round two, and the floor under it is a law every
 * ladder now obeys), so they are in the manifest's record and not here: a
 * departure a reviewer cannot act on is a paragraph he has to read past.
 *
 * The last line is the wave's standing rule (round two: say on the board what
 * another board's work changed here). It is on the board rather than only in
 * the manifest because "we read the other boards and nothing moved" is itself
 * something a reviewer should be able to check, and two of the four items
 * below DID move something.
 */
const DEPARTURES = [
  "C collapses marketing's six heading steps to five and folds the 24/30 prose tier into the section step, so /about's story sections and /press's sections move up a tier. That contradicts design-system.md's documented three-tier h2 ladder; it is C's argument, not an oversight.",
  "B states bible 2 as arithmetic: marketing travels four rungs between 375 and 1440 and the app travels one. That turns 'marketing may be louder' from a judgement into a rule, which is a bible finding if B is adopted, and B is what the board recommends.",
  `Bible 5 says one heading face on one site ladder, and the 404's h1 has always been outside both: Inter at 600, the only page title on the site that is not the heading face. Every paste puts it on the ladder, which is a change no ruling has made yet, so it is the ${askOrdinal(ASK_404)} ask rather than a silent fix.`,
  "The pairing is NOT departed from, and it is no longer an ask. Inter with Urbanist survives the loudest step once tracking runs inverse to size: what reads wrong at 160px and again at 16px is the constant -0.03em, not the face. The evidence sits under the tracking law on the last stage, and a face round would be its own ruling.",
  "Every candidate closes the masthead's tracking squeeze (.mkt-name opens to +0.022em) onto the display step's OWN tracking, between -0.04em and -0.05em, rather than the shared -0.03em constant it lands on today. The paste closes it in marketing.css's own two places and leaves the squeeze itself running.",
  "What the other boards changed here (the wave's specs and every open track's handoff, re-read in round three). Two things moved. The kill-mono sweep put the stat register on the heading face at 30 / 36 (StatBand, /reel and the help band's neighbours), a heading size no hook on this board reaches, so the wiring round takes it as a step and not as a class. The brand-voice board found that the lab compiles no responsive heading rung, so a hero on a stage can render at its base size: it does not reach these stages, because every size here is handed to the production component as this board's own custom property and is measured step by step at both canvases, which is why the sizes below are the site's and not the lab's. Two things did not move. The voice board's two candidate theses are both about thirty characters, so the lockup stage counts the same lines either way, and the hero-scan board measured the shipped h1 at 96px over 97.92px of leading, which is today's hero step wearing the hand-rolled leading this board calls fault two. Palette, light, floating-surfaces and media-kit move no size, leading or tracking; floating-surfaces' shared wall is the candidate mount named in the walk above.",
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

/** One act's header. Four acts because the ladder touches four arguments, and a
 *  reviewer who knows which argument he is in can rule on one and move on. */
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
 * ROUND THREE'S FIRST CHANGE: THE BOARD ANSWERS BEFORE IT ASKS.
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
        beside it, and each names the single thing that would change it. The
        stages below are the evidence for these four lines and nothing else.
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

/* ─────────────────────── The four ladders at a glance ─────────────────── */

/**
 * ROUND THREE'S SECOND CHANGE: THE COMPARISON, WITHOUT TOGGLING.
 *
 * The cold walk found the board's worst stumble: to compare two ladders a
 * reviewer had to flip a toggle and hold nine sizes in his head, and two of the
 * four columns are close enough at one canvas that flipping between them looked
 * like a broken control. A. Tuned keeps EVERY desktop size the site ships, so
 * at 1440 it moves nothing but the leading and the tracking, and the board now
 * counts that out loud instead of leaving it to be discovered.
 *
 * Every number here is the ladder data at the selected canvas, and the four
 * ticks per column are computed by `fixes()` from that data, never declared
 * beside it: a column cannot claim a fix it does not make.
 */
function Glance({
  mode,
  selected,
  onSelect,
}: {
  mode: Mode;
  selected: LadderId;
  onSelect: (id: LadderId) => void;
}) {
  const end = mode === "phone" ? "phone" : "desktop";
  // ★ The cold walk's worst stumble, said out loud: at 1440 A. Tuned keeps
  // every size today ships, so its column IS today's column and toggling
  // between them reads as a dead control. Computed, never asserted, so it
  // appears at whichever canvas it happens to be true at.
  const flat = LADDERS.filter((l) => {
    if (l.id === "today") return false;
    const count = moved(l, end);
    return count.moved === 0 && count.added === 0;
  })
    .map((l) => l.name)
    .join(" and ");
  const specOf = (l: Ladder, step: (typeof STEPS)[number]): Spec | null => {
    const value = l.steps[step.id];
    return value ? value[end] : null;
  };
  const cell = (l: Ladder, step: (typeof STEPS)[number]) => {
    const spec = specOf(l, step);
    if (!spec) return { text: "no step", px: 0, folded: false };
    const folded = Boolean(l.aliases?.[step.id]);
    return { text: `${spec.px}`, px: spec.px, folded };
  };

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-medium text-foreground">
          The four ladders at a glance, at {mode === "phone" ? 375 : 1440}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Click a column to put that ladder on every stage below.
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
                            : " "}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {STEPS.map((step) => {
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
                    const c = cell(l, step);
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
                            c.px ? "text-foreground" : "text-muted-foreground",
                            c.folded && "text-muted-foreground",
                          )}
                        >
                          {c.text}
                          {c.folded ? ", folded" : ""}
                        </span>
                        {c.px > 0 && (
                          <span
                            aria-hidden
                            className="mt-1 block h-1 rounded-full bg-foreground/35"
                            style={{ width: `${(c.px / widest) * 100}%` }}
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
            {FIXES.map((fix, i) => (
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
                  const fixed = fixes(l)[fix.id];
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
            today&rsquo;s column.
          </span>{" "}
          It carries every size the site already ships, so switching to it here
          moves only the leading and the tracking. Its argument is at the other
          canvas: switch the viewport above.
        </p>
      )}
    </div>
  );
}

/* ───────────────────────── Apply it to the site ───────────────────────── */

/**
 * ROUND TWO'S CENTRE OF GRAVITY, TIDIED IN ROUND THREE. Every candidate is
 * generated as one CSS block against the real selectors (see HOOKS in
 * ladders.ts) and handed to the whole site through the shell's candidate store,
 * so the ruling is made on the real home page, the real /help and the real
 * dashboard.
 *
 * ★ APPLY TODAY FIRST IF YOU WANT THE CONTROL: it is the shipped ladder
 * resolved, so if the paste is honest the site does not move at 1440 or at 375.
 * That is the block's own proof, and it takes one click. (In between those
 * widths it will move, on purpose: a clamp is smooth where a four-breakpoint
 * ramp steps.)
 *
 * ROUND THREE cut ten controls out of this bar: five per-block "copy" buttons
 * became one line that appears only once a block is applied, and the walk list
 * lost two dead links (see WALK and NO_ISLAND in ladders.ts, where the reason is
 * written down).
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
  const [copied, setCopied] = useState(false);

  const blocks: Ladder[] = [...LADDERS, LAW_ONLY];
  const label = (l: Ladder) => `type-scale: ${l.name}`;
  const applied = blocks.find((l) => label(l) === active) ?? null;
  // Deliberately NOT the ladder toggle's own wording: two rows of controls with
  // the same four words is a misclick waiting to happen, and the verb is what
  // says this one leaves the board.
  const verb = (l: Ladder) =>
    l.id === "law" ? "Apply the law alone" : `Apply ${l.name.split(".")[0]}`;

  const copy = async (l: Ladder) => {
    try {
      await navigator.clipboard.writeText(candidateCss(l));
      setCopied(true);
    } catch {
      // A lab affordance: a browser that refuses the clipboard just does not
      // flash "copied", and the whole block is still under the token table.
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
            <button
              key={l.id}
              type="button"
              onClick={() => {
                setCopied(false);
                setCandidateCss(label(l), candidateCss(l));
              }}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors",
                on
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {on ? `${l.name}, applied` : verb(l)}
            </button>
          );
        })}
      </div>

      {applied ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="text-foreground">
            {applied.name} is on every page with the key.
          </span>
          <button
            type="button"
            onClick={() => void copy(applied)}
            className="underline underline-offset-2 hover:text-foreground"
          >
            {copied ? "copied the block" : "copy the block"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCopied(false);
              clearCandidate();
            }}
            className="underline underline-offset-2 hover:text-foreground"
          >
            clear it
          </button>
        </p>
      ) : (
        <p className="max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
          The block lands as a style element after every stylesheet on every
          page with the design key, so it is the candidate on the real site
          rather than on a stage. Apply Today first if you want the control: it
          is the shipped ladder resolved, so a correct paste moves nothing at
          1440 or at 375, which is the block&rsquo;s own proof.
        </p>
      )}

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
      </p>

      <p className="max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
        <span className="text-foreground">
          Not these, and it is the island,{" "}
        </span>
        not the block:{" "}
        {NO_ISLAND.map((n, i) => (
          <span key={n.where}>
            {i > 0 ? "; " : ""}
            <span className="text-foreground">{n.where}</span> ({n.why})
          </span>
        ))}
        . The app&rsquo;s section heading is the other thing a paste cannot
        reach, for a different reason: production writes it as a label inside an
        h2 and there is no class worth aiming at, which is what the
        missing-middle stage is for. Marketing has one of those too, found in
        round three: sixteen hand-rolled headings (the feature sections,
        careers, the footer, the reel, the error screen and the stat register)
        stop one rung short of
        SectionShell&rsquo;s ramp and ship at 30 / 36, so no paste moves them
        and a section that does not budge is the page, not the block. Aiming the
        section step at them would grow them to 48 and make Today move the real
        site, which is the control this whole board rests on, so they are the
        wiring round&rsquo;s sweep rather than a hook.
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
   *  table directly above carries the same line for all nine steps. */
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

function Specimen({ ladder, mode }: { ladder: Ladder; mode: Mode }) {
  const today = ladderById("today");
  const count = moved(ladder, mode === "phone" ? "phone" : "desktop");
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
        {ladder.id !== "today" && (
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground tabular-nums">
            At {mode === "phone" ? 375 : 1440} this ladder moves {count.moved}{" "}
            of today&rsquo;s {count.of} sizes
            {count.added > 0 ? ` and adds ${count.added}` : ""}
            {count.moved === 0
              ? ", so only the leading and the tracking change here. Its argument is at the other canvas."
              : "."}
          </p>
        )}
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
            where={mode === "phone" ? null : step.where}
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
        which already rides the fluid size. The names are Tailwind v4&rsquo;s
        own font-size shape, so the bake is one @theme block and a baked step is
        ONE class: text-title carries its size, its leading and its tracking,
        and the three four-breakpoint ramps in page-hero, section-shell and
        page-heading collapse into it.
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
 *  is still bigger on the phone canvas (the numbers line wraps at 375), but it
 *  came down in round three with the caption the row no longer carries there. */
function specimenHeight(ladder: Ladder, mode: Mode): number {
  const rows = STEPS.filter((s) => ladder.steps[s.id]);
  const ink = rows.reduce((sum, s) => {
    const pair = ladder.steps[s.id]!;
    const spec = mode === "phone" ? pair.phone : pair.desktop;
    return sum + Math.max(spec.px * spec.lh, spec.px);
  }, 0);
  return Math.round(ink + rows.length * (mode === "phone" ? 60 : 52) + 150);
}

function displayHeight(mode: Mode): number {
  const ink = LADDERS.reduce((sum, l) => {
    const spec =
      mode === "phone" ? l.steps.display!.phone : l.steps.display!.desktop;
    return sum + spec.px * spec.lh;
  }, 0);
  return Math.round(ink + LADDERS.length * 44 + 80);
}

/**
 * The hero lockup stage, twice over: today's hand-rolled ramp above the step.
 *
 * ★ COUNT THE LINES, DO NOT ASSUME THEM. Sized off one line each, C's 120px
 * hero overflowed the stage by 58px, because the ruled line wraps at that size
 * and today's 96px one does not: the two lockups can disagree about how many
 * lines they are. The estimate is the line's character count at an average
 * glyph width of 0.45em against the lockup's own clamp, rounded up, which lands
 * on the right count for every candidate at both canvases (checked in the
 * browser under all four).
 */
function lockupHeight(ladder: Ladder, mode: Mode): number {
  const phone = mode === "phone";
  const pair = ladder.steps.hero!;
  const spec = phone ? pair.phone : pair.desktop;
  const column = phone ? 340 : 1000;
  const chars = "The album starts here.".length;
  const ink = (px: number, lh: number) =>
    Math.max(1, Math.ceil((px * 0.45 * chars) / column)) * px * lh;
  const furniture = phone ? 250 : 230;
  return Math.round(
    ink(spec.px, spec.lh) + ink(phone ? 48 : 96, 1.02) + 2 * furniture + 60,
  );
}

/** The last stage carries the law AND the pairing since round three folded the
 *  two together, and the pairing's two lines are set at the selected ladder's
 *  title step, so they wrap differently under each one: counted, not assumed,
 *  for the same reason the lockup counts its lines. */
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
  // Round three opens on the board's own recommendation rather than on the
  // control: the first thing a reviewer sees should be the thing being proposed.
  const [ladderId, setLadderId] = useState<LadderId>(RECOMMENDED);
  const ladder = ladderById(ladderId);
  const applied = useTunerCandidate();
  const props = { ladder, mode };
  const phone = mode === "phone";
  const tall = phone ? 760 : 930;
  // The app surfaces are short: a dashboard with three events fills a quarter
  // of a 930px canvas, and empty ground is a lot of scroll between the tiers
  // being compared. Round three measured each stage's ink off the DOM and cut
  // the desktop canvases to it (the dashboard is 243px of ink, the event page
  // 498), so no stage is more than about a sixth empty ground. The phone canvas
  // stays a real viewport: whether an app title reads right on a phone needs
  // the phone.
  const app = phone ? 760 : 520;
  const dash = phone ? 760 : 330;

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
          so this is the site rather than a mock. B rebuilds from a rung set
          where marketing and the app are two distances along one ladder. C
          splits the site into an editorial register and an instrument register,
          pushing marketing past today and pulling the app below it. A tunes
          today and keeps every desktop number it ships, which is also its cost.
        </p>
      </div>

      <TheAnswer />

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

      <Glance mode={mode} selected={ladderId} onSelect={setLadderId} />

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
        rationale="The masthead at all four ladders on one ground, strongest first. B and A keep today's 160; C proposes 200 over a 120 hero, which is the one thing on the board that changes what the front of the site feels like."
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
        name="The hero step, and the lockup the site actually ships"
        rationale="The hero concepts do not use PageHero: they resolve the xl step by hand and add a leading-[1.02] of their own. The loudest step on the site is not reached by changing one component, and this is what the step does to that lockup."
        framed={false}
      >
        <Frame mode={mode} ground="cinema" height={lockupHeight(ladder, mode)}>
          <HeroBoardLockup {...props} />
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
        rationale="Title over section over card: the only stage where three tiers meet in one screen, so a ladder that separates on paper has to separate here. /help wears the same title step, one click away in the walk."
        framed={false}
      >
        {/* Deliberately taller than a phone viewport: three tiers stacked is
            more than 760px at 375, and a real phone answers that by scrolling.
            Cropping the cards here would hide the step this stage exists for. */}
        <Frame mode={mode} ground="cinema" height={phone ? 960 : tall}>
          <FeaturePage {...props} />
        </Frame>
      </Variant>

      <Variant
        n={6}
        name="/about on paper: the display step over the prose tier"
        rationale="The loudest and the quietest marketing steps on one page, and the only paper ground on the board. C folds the prose tier away, and this is the stage that shows what that costs."
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
        n={7}
        name="The dashboard"
        rationale="PageHeading, the app's section tier and the card row, on the surface a host opens most. Today and A carry no step between the page title and the card, so the section heading renders what production ships: an 11px uppercase label inside an h2. Toggle today against C here to see the quiet register on a real dashboard."
        framed={false}
      >
        <Frame mode={mode} ground="app-light" height={dash}>
          <Dashboard {...props} />
        </Frame>
      </Variant>

      <Variant
        n={8}
        name="The app's missing middle, judged where it lives"
        rationale="Production writes this tier three ways and none of them is a heading: 11px uppercase inside an h2 on the dashboard and the event feed, 14px in admin, and once sr-only so it is not drawn at all. Beside each, what the selected ladder puts there."
        framed={false}
      >
        <Frame mode={mode} ground="app-light" height={phone ? 1180 : 590}>
          <MissingMiddle {...props} />
        </Frame>
      </Variant>

      <Variant
        n={9}
        name="An event page, dark"
        rationale="The app's other ground, and the one app title that carries a size override today (text-3xl on PageHeading). Under a named ladder the override has nothing left to do."
        framed={false}
      >
        <Frame mode={mode} ground="app-dark" height={app}>
          <EventPage {...props} />
        </Frame>
      </Variant>

      <Act
        n={4}
        name="The two rulings a ladder does not settle"
        question="Does the 404's h1 join the ladder, and is the tracking law taken on its own?"
      />

      <Variant
        n={10}
        name="The 404, the one h1 that is not on the ladder"
        rationale={`not-found-screen.tsx renders its title in Inter at 600, with a tracking-tight the theme zeroes. It is the marketing 404, the app 404, the admin 404 and a dead guest link. Putting it on the ladder is the ${askOrdinal(ASK_404)} ask.`}
        framed={false}
      >
        <Frame mode={mode} ground="app-light" height={phone ? 980 : 460}>
          <NotFoundStage {...props} />
        </Frame>
      </Variant>

      <Variant
        n={11}
        name="The tracking law, alone, and the pairing under it"
        rationale="The same word at the masthead size and the same card title at 16, under the flat -0.03em and under the law. No size moves in the top half, which is what makes this a separate ruling: adopt it whichever ladder wins. The pairing check sits underneath because it is the same evidence read twice."
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

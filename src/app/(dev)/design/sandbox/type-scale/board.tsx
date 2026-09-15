"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";

import {
  AppliedBadge,
  ApplyToSite,
  type BoardApi,
  BoardPage,
  type BoardState,
  CANVAS,
  DOCK_PILL,
  FitStage,
  Frame,
  type Ground,
  Labeled,
  type Mode,
  Paste,
  SelectTable,
  useLineCount,
  WalkPages,
} from "@/components/lab";
import { env } from "@/lib/env";

import {
  candidateCss,
  composePair,
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
  STEPS,
  SURFACE_LABEL,
  themeBlock,
  tokenTable,
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
import { TYPE_SCALE } from "./spec";

/**
 * THE TYPE-SCALE BOARD (the review wave; on the kit's template since the
 * Library x Lab migration wave, round five, 2026-09-15).
 *
 * Bible 5 holds: one heading face on one site ladder. What was never nailed is
 * the ladder's numbers, so this board writes them, on the real pages, at both
 * canvases, as a token table the wiring round bakes.
 *
 * What the board ARGUES lives in `spec.ts` now, and only there: the question,
 * the verdict, the four one-word calls, the five candidates, the departures and
 * the walk. What is left here is what a board should be and nothing else: the
 * evidence for each declared section, as a function of the declared state.
 *
 * ── WHAT ROUND FIVE MOVED, AND WHAT IT KEPT ──
 * Round four answered Will's three notes (judge sizes at 1:1, put the
 * configurator in the dock, rule the two registers apart) and none of that is
 * undone: every stage is 1:1, the marketing surfaces are the real ROUTES in
 * frames exactly the canvas wide, and the marketing ladder and the app ladder
 * are two independent switches whose pair composes into one nine-step set.
 * Round five moves the PRESENTATION onto the kit, and four board-local
 * mechanisms retire into it:
 *
 *   TheAnswer   → the template's Answer, off `spec.asks`
 *   Glance      → the kit's SelectTable, turned on its side so a ladder is one
 *                 ROW read across rather than a column held in the head
 *   PageFrame   → the kit's Frame (an adopted sheet built in the frame's own
 *                 realm, the gate key, the reachability banner)
 *   Act         → declared sections, which the dock's menu and the walk drive
 *
 * ★ AND EVERY HAND-COMPUTED STAGE HEIGHT IS GONE, which is the change that
 * deleted the most code. Round three measured each stage's ink off the DOM and
 * wrote the answer down as a literal, and round four then had to keep three
 * height functions in step with four ladders: a candidate that grew a step
 * cropped, and one that lost a step floated in dead ground. `FitStage` measures
 * what it was handed, so the ground ends where the block does at every canvas
 * and under every pair, and the board stops arguing with its own furniture.
 * It also bought back a fact the crop had cost: each step's `where` line prints
 * at 375 again, where round four had to drop it.
 *
 * ★ THE ONE COUNT THAT IS STILL A COUNT IS MEASURED NOW. The law stage's height
 * used to be `ceil(px * 0.45 * chars / column)`, an estimate of how many lines
 * the pairing line wraps to. `useLineCount` reads it off the rendered text
 * instead, after the webfont lands, and the board PRINTS it: how many lines a
 * step takes here is a claim this board makes constantly and had never shown.
 *
 * Rising tides: no mono face and no mono caption atom anywhere a person reads.
 */

/* ───────────────────────── The board's own canvas ─────────────────────── */

/**
 * Every composed stage's inner frame: `data-tsc` for the sheet to hook, and a
 * hand-resolved gutter (a 1440 canvas sits inside a real window, so `lg:px-8`
 * would read the window even at 1:1). The two attributes sit on two nested
 * elements on purpose: board.css needs `[data-tsc] [data-tsc-page]` to clear
 * marketing.css's own (0,2,0) rules without an !important.
 *
 * Named TypeStage rather than Frame: `Frame` is the kit's word and it means a
 * real iframe. This is a composition on a ground, which is a smaller claim.
 */
function TypeStage({
  mode,
  ground,
  swapKey,
  children,
}: {
  mode: Mode;
  ground: Ground;
  /** Re-measures (and remounts) when the pair or the canvas changes. */
  swapKey: string;
  children: ReactNode;
}) {
  return (
    <FitStage mode={mode} ground={ground} swapKey={swapKey}>
      <div
        data-tsc
        style={
          {
            "--tsc-gutter": mode === "phone" ? "16px" : "32px",
          } as CSSProperties
        }
      >
        {/* data-inview so the production entrances land settled instead of
            waiting on an observer: motion is another board's question, and a
            size read mid-flight is not a size. */}
        <div data-tsc-page data-inview="true">
          {children}
        </div>
      </div>
    </FitStage>
  );
}

/* ───────────────── The ladders at a glance, per register ──────────────── */

/**
 * THE COMPARISON AS A CHOOSER (round three's table, on the kit since round
 * five).
 *
 * Round three's finding stands and is why there are two tables: to compare two
 * ladders a reviewer had to flip a toggle and hold nine sizes in his head, and
 * round four split the table by register because the halves are ruled apart.
 * Round five turns each one on its side, which is the kit's shape and also the
 * better one: a ladder is a ROW read left to right, the row IS the control that
 * selects it, and a row a keyboard can reach is a button rather than a click
 * handler on a cell.
 *
 * Every number is the ladder data at the selected canvas, and the fix marks are
 * computed by `fixes()` from that same data, never declared beside it: a ladder
 * cannot claim a fix it does not make.
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
  const faults = FIXES.filter((f) => f.surfaces.includes(surface));
  const canvas = mode === "phone" ? 375 : 1440;

  // ★ The cold walk's worst stumble, said out loud: at 1440 A. Tuned keeps
  // every size today ships, so its row IS today's row and switching between
  // them reads as a dead control. Computed, never asserted, so it appears at
  // whichever canvas and register it happens to be true at.
  const flat = LADDERS.filter((l) => {
    if (l.id === "today") return false;
    const count = moved(l, end, surface);
    return count.moved === 0 && count.added === 0;
  })
    .map((l) => l.name.split(".")[0])
    .join(" and ");

  return (
    <SelectTable<LadderId>
      caption={`${SURFACE_LABEL[surface]} at ${canvas}. The last ${faults.length} columns are today's faults on this register, marked only where the ladder's own numbers fix them.${flat ? ` At ${canvas} the ${flat} row carries every size the site already ships here, so choosing it moves only the leading and the tracking; its argument is at the other canvas.` : ""}`}
      columns={[
        "The ladder",
        ...steps.map((s) => s.label),
        ...faults.map((f) => f.label),
      ]}
      value={selected}
      onChange={onSelect}
      rows={LADDERS.map((l) => {
        const fixed = fixes(l, surface);
        return {
          id: l.id as LadderId,
          recommended: l.id === RECOMMENDED,
          note: l.id === "today" ? "the control" : l.law,
          cells: [
            l.name,
            ...steps.map((step) => {
              const spec: Spec | null = l.steps[step.id]?.[end] ?? null;
              if (!spec) return "no step";
              return l.aliases?.[step.id] ? `${spec.px}, folded` : spec.px;
            }),
            ...faults.map((f) => (fixed[f.id] ? "fixed" : "not fixed")),
          ],
        };
      })}
    />
  );
}

/* ───────────────────── The pair, step by step, at size ────────────────── */

/** One word carries every specimen: it is the brand, and its nine letters cover
 *  an ascender, a descender, three rounds and three straights, which is what a
 *  tracking change is judged on. */
const WORD = "Partyreel";

/** One step: the numbers, the word at that step, and a hairline the height of
 *  today's cap beside it so the delta reads as a shape before it reads as two
 *  numbers. The ghost is dropped when today IS the selected ladder: a control
 *  comparing a thing with itself reads as broken. */
function StepRow({
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
        <span className="text-[11px] text-muted-foreground">{where}</span>
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
          {WORD}
        </span>
      </div>
    </div>
  );
}

/** The whole pair written out: both registers, every step, at this canvas's end
 *  of the ladder. */
function LadderSheet({
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
                <StepRow
                  key={step.id}
                  label={
                    folded ? `${step.label}, folded into ${folded}` : step.label
                  }
                  where={step.where}
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

/** The loudness question on its own ground: the masthead at all four marketing
 *  ladders, so C's claim can be ruled on without reading a table. */
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
              {WORD}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────────── The token set ──────────────────────────── */

function TokenTable({ ladder }: { ladder: Ladder }) {
  const rows = tokenTable(ladder);
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-medium text-foreground">
        {ladder.name}: the token table the wiring round bakes into theme.css
      </p>
      <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
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
    </div>
  );
}

/* ──────────────── A route, at the canvas's true pixels ────────────────── */

/**
 * ★ THE FRAME SHOWS THE PAGE SETTLED, AND ROUND FIVE DOES IT IN CSS ALONE.
 *
 * marketing.css keys its entrances off `data-inview`, and `.mkt-name`
 * transitions its tracking over 760ms from an OPEN squeeze (+0.022em) to the
 * settled value. Measured inside a frame before the page's own observer had
 * flipped anything, the /about masthead reported +3.52px of tracking, which is
 * a number no candidate proposes and which a screenshot taken then would have
 * shown as the ruling. So the board settles the entrances, for the same reason
 * board.css settles them on the composed stages: motion is another board's
 * question, and a size read mid-flight is not a size.
 *
 * Round four did that with a MutationObserver per frame, rewriting every
 * `data-inview="false"` back to true and re-arming as the page's own islands
 * hydrated. The kit's Frame writes a stylesheet and hands back no document, so
 * the settle is expressed as CSS instead, and it is the better mechanism: no
 * observer to leak, no race with hydration, and one sheet whichever route is in
 * the frame.
 *
 * ★ EACH RULE HAS TO OUTSCORE marketing.css's OWN, and the one that bites is
 * the masthead. Both marketing.css and the candidate close the squeeze through
 * a `[data-inview="true"]` selector, which never matches while the attribute
 * stays false, so closing it here is not optional: without CLOSED every ladder
 * would show the same open tracking and the loudness section would be comparing
 * four identical claims. CLOSED spends the candidate's OWN display token rather
 * than a literal, so no number is duplicated, and it runs at (0,3,0) after the
 * candidate in one adopted sheet, which beats marketing.css's (0,2,0) open rule
 * and ties-then-wins against its (0,3,0) settled one.
 */
const SETTLED = `/* The board settles the frame's entrances; see board.tsx.
   Deliberately narrow: a blanket animation:none would also freeze the marketing
   reveal grammar, whose pre-animation state is opacity 0, and the page would
   read as broken rather than at rest. */
[data-mkt] [data-mkt-reveal],
[data-mkt][data-mkt-reveal] { opacity: 1; transform: none; transition: none; }
[data-mkt] [data-mkt-cut] { animation: none; opacity: 1; transform: none; }
[data-mkt] .mkt-line { opacity: 1; transform: none; filter: none; transition: none; }`;

const CLOSED = `/* The masthead's squeeze, closed onto the candidate's own display
   tracking. marketing.css and the candidate both close it through a
   [data-inview="true"] selector, which cannot match in a settled frame, so the
   value is spent here from the token the candidate declares on :root. */
@media (prefers-reduced-motion: no-preference) {
  [data-mkt][data-mkt] .mkt-name {
    letter-spacing: var(--text-display--letter-spacing, -0.03em);
    transition: none;
  }
}`;

const settled = (css: string) => `${SETTLED}\n\n${css}\n\n${CLOSED}`;

/** The law alone: today's sizes with nothing changed but the leading and the
 *  tracking. Nothing on the board moves it, so it is generated once. */
const LAW_CSS = candidateCss(LAW_ONLY);

/* ───────────────────────────── The board ──────────────────────────────── */

export function TypeScaleBoard() {
  // The frames are same-origin documents a reader can navigate away from, so
  // one dock button brings every one of them back. Not a declared control: it
  // is an action, and there is no state a shared link should carry.
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <BoardPage
      spec={TYPE_SCALE}
      dock={() => (
        <>
          {/* Which block stands on the site, and its clear. Applying is a
              per-candidate decision and its button stays beside the candidate
              (the kit's own rule, apply.tsx); seeing that one is live, and
              turning it off, is page-wide and lives here. */}
          <AppliedBadge />
          <button
            type="button"
            onClick={() => setReloadKey((n) => n + 1)}
            className={DOCK_PILL}
          >
            Reload frames
          </button>
        </>
      )}
      evidence={(id, state, api) => (
        <Evidence id={id} state={state} api={api} reloadKey={reloadKey} />
      )}
    />
  );
}

/**
 * One section's evidence, as a component rather than a closure: the generated
 * block is the paste, what every frame wears and what an Apply hands the site,
 * so it is memoised on the pair, and the pairing line's measurement is a hook.
 */
function Evidence({
  id,
  state,
  api,
  reloadKey,
}: {
  id: string;
  state: BoardState;
  api: BoardApi;
  reloadKey: number;
}) {
  // The pairing line, measured rather than estimated. The hook is declared for
  // every section (React's rules) and only the law section renders the node it
  // points at, which is exactly what its null return value is for.
  const [pairingRef, pairingLines] = useLineCount();

  const mode = state.canvas as Mode;
  const pair: Pair = {
    marketing: state.marketing as LadderId,
    app: state.app as LadderId,
  };
  const marketing = ladderById(pair.marketing);
  const app = ladderById(pair.app);
  const ladder = useMemo(
    () => composePair({ marketing: pair.marketing, app: pair.app }),
    [pair.marketing, pair.app],
  );
  // The generated block is the paste AND what every frame wears, so a frame and
  // a real tab can never show two different things.
  const css = useMemo(() => candidateCss(ladder), [ladder]);
  const framed = useMemo(() => settled(css), [css]);

  const props = { ladder, mode };
  const swap = `${pair.marketing}-${pair.app}-${mode}`;
  const { w, h } = CANVAS[mode];
  const demo = env.NEXT_PUBLIC_DEMO_QR_TOKEN;
  const album = REAL_PAGES.find((p) => p.demo);

  switch (id) {
    case "glance":
      return (
        <div className="flex flex-col gap-5">
          <Glance
            mode={mode}
            surface="marketing"
            selected={pair.marketing}
            onSelect={(v) => api.setState({ marketing: v })}
          />
          <Glance
            mode={mode}
            surface="app"
            selected={pair.app}
            onSelect={(v) => api.setState({ app: v })}
          />
        </div>
      );

    case "pair":
      return (
        <Labeled name={`The pair: ${ladder.name}`} note={ladder.rationale}>
          <TypeStage mode={mode} ground="paper" swapKey={swap}>
            <LadderSheet
              ladder={ladder}
              marketing={marketing}
              app={app}
              mode={mode}
            />
          </TypeStage>
        </Labeled>
      );

    case "loudness":
      return (
        <Labeled
          name="The masthead at all four marketing ladders"
          note="Strongest first, on the ground the front of the site actually uses. This one does not move with the dock: it is the four claims side by side."
        >
          <TypeStage mode={mode} ground="cinema" swapKey={mode}>
            <DisplayCompare mode={mode} />
          </TypeStage>
        </Labeled>
      );

    case "tokens":
      return (
        <div className="flex flex-col gap-5">
          <TokenTable ladder={ladder} />
          <Paste
            code={css}
            label={`The block a ruling would land: ${ladder.name}`}
          />
          <Paste
            code={themeBlock(ladder)}
            label={`The @theme bake: ${ladder.name}`}
          />
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <ApplyToSite
              block={{
                label: `type-scale: ${ladder.name}`,
                css,
                what: "Hands every page with a design island this exact pair, so a ladder can be judged signed in on the surfaces no frame here reaches.",
                pages: "the home, /pricing, the dashboard and the admin portal",
              }}
            />
            <WalkPages pages={TYPE_SCALE.links.pages ?? []} />
            <p className="max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
              <span className="text-foreground">{ISLANDS_LANDED}</span> The one
              surface still outside every island:{" "}
              {NO_ISLAND.map((n) => (
                <span key={n.where}>
                  <span className="text-foreground">{n.where}</span> ({n.why})
                </span>
              ))}
              . Apply the pair (Today, Today) if you want the control: it is the
              shipped ladder resolved, so if the paste is honest the site does
              not move at 1440 or at 375. In between those widths it will move,
              on purpose, because a clamp is smooth where a four-breakpoint ramp
              steps.
            </p>
          </div>
        </div>
      );

    case "pages":
      return (
        <div className="flex flex-col gap-6">
          {REAL_PAGES.filter((p) => !p.demo).map((page) => (
            <Frame
              key={page.id}
              id={`page-${page.id}`}
              src={page.href}
              w={w}
              h={h}
              css={framed}
              reloadKey={reloadKey}
              onApproach
              title={`${page.label}, ${page.href} at ${w}`}
              caption={
                page.reach ? `${page.why} Reach: ${page.reach}.` : page.why
              }
            />
          ))}
        </div>
      );

    case "app":
      return (
        <div className="flex flex-col gap-6">
          {album && demo && (
            <Frame
              id="page-album"
              src={`/e/${demo}`}
              w={w}
              h={h}
              css={framed}
              reloadKey={reloadKey}
              onApproach
              title={`${album.label}, the one app-register surface that is a real page`}
              caption={
                album.reach ? `${album.why} Reach: ${album.reach}.` : album.why
              }
            />
          )}
          <Labeled
            name="The dashboard"
            note="PageHeading, the app's section tier and the card row, on the surface a host opens most. Today and A carry no step between the page title and the card, so the section heading renders what production ships: an 11px uppercase label inside an h2."
          >
            <TypeStage mode={mode} ground="app-light" swapKey={swap}>
              <Dashboard {...props} />
            </TypeStage>
          </Labeled>
          <Labeled
            name="The app's missing middle, judged where it lives"
            note="Production writes this tier three ways and none of them is a heading: 11px uppercase inside an h2 on the dashboard and the event feed, 14px in admin, and once sr-only so it is not drawn at all. Beside each, what the selected app ladder puts there."
          >
            <TypeStage mode={mode} ground="app-light" swapKey={swap}>
              <MissingMiddle {...props} />
            </TypeStage>
          </Labeled>
          <Labeled
            name="An event page, dark"
            note="The app's other ground, and the one app title that carries a size override today (text-3xl on PageHeading). Under a named ladder the override has nothing left to do."
          >
            <TypeStage mode={mode} ground="app-dark" swapKey={swap}>
              <EventPage {...props} />
            </TypeStage>
          </Labeled>
          <Labeled
            name="An admin page"
            note="The quietest surface in the product, and where the missing middle is written in its second idiom (a 14px medium h2, not the dashboard's 11px uppercase one). The metric numerals are deliberately off the heading ladder, which is what makes this the one stage where a 20px page title can be seen sitting below the numbers on its own page."
          >
            <TypeStage mode={mode} ground="app-light" swapKey={swap}>
              <AdminPage {...props} />
            </TypeStage>
          </Labeled>
        </div>
      );

    case "not-found":
      return (
        <Labeled
          name="As it ships, and on the ladder"
          note="The same screen twice: Inter at 600 on the left exactly as production renders it, and the selected pair's step beside it. board.css pins the shipped half out of reach of any applied block, or the comparison would quietly become a comparison of one thing with itself."
        >
          <TypeStage mode={mode} ground="app-light" swapKey={swap}>
            <NotFoundStage {...props} />
          </TypeStage>
        </Labeled>
      );

    case "law":
      return (
        <div className="flex flex-col gap-4">
          <Labeled
            name="The flat constant, the law, and the pairing under them"
            note="No size moves in the top half, which is what makes this a separate ruling: adopt it whichever pair wins."
          >
            <TypeStage mode={mode} ground="paper" swapKey={swap}>
              <TrackingLaw {...props} measureRef={pairingRef} />
            </TypeStage>
          </Labeled>
          <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
            <span className="text-foreground">Measured, not estimated: </span>
            at {ladder.name}&rsquo;s title step on the{" "}
            <span className="tabular-nums">
              {mode === "phone" ? 375 : 1440}
            </span>{" "}
            canvas the pairing line sets in{" "}
            <span className="tabular-nums">{pairingLines ?? "?"}</span>{" "}
            {pairingLines === 1 ? "line" : "lines"}. A step that reads as one
            line at 1440 and wraps to three at 375 is a different step, and this
            is read off the rendered text once the webfont has landed rather
            than counted off the string.
          </p>
          <ApplyToSite
            block={{
              label: `type-scale: ${LAW_ONLY.name}`,
              css: LAW_CSS,
              what: "Today's sizes with nothing moved but the leading and the tracking, so this ask can be walked on the real pages with no size moving underneath the answer.",
              pages: "the home, /about and the dashboard",
            }}
          />
        </div>
      );

    default:
      return null;
  }
}

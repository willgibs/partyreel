"use client";

import "./board.css";

import { RotateCcw } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  BoardDock,
  BoardMeta,
  type Ground,
  type Mode,
  Stage,
  Toggle,
} from "@/components/dev/board";
import { GalleryEmptyState } from "@/components/guest/gallery-empty-state";
import { Caption } from "@/components/marketing/system/caption";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FEATURE_PAGES } from "@/lib/constants/feature-pages";
import { marketingImage } from "@/lib/constants/marketing-media";
import { DEMO_EVENT_URL } from "@/lib/demo";

import {
  RIVER_FACTS,
  RIVER_SIZES,
  RiverVisual,
  type RiverOrigin,
  type RiverSizeId,
  riverHeight,
} from "./river";

/**
 * THE RIVER, A FEATURE VISUAL: the bank's board (round one, 2026-09-15).
 *
 * Will killed the river as a home hero and banked it: "the river animation
 * could be streamlined to drop down in one flow rather than two, and saved to
 * our lab design bank to hopefully use another time as a feature visual rather
 * than hero. This would be a cool, smaller alternative presentation of the
 * images emanating from the QR code versus the 1 or 2."
 *
 * A bank entry has to answer four questions, so the board is four rows and
 * nothing else:
 *
 *  1  WHAT IS IT, at the sizes it would actually be used at. Three specimens
 *     side by side at 1:1 (Will's note b: never zoom a specimen whose size is
 *     being judged), on one clock, so the row reads as one visual at three
 *     scales rather than three tunings. The dock switches the ground and the
 *     origin for all three at once (Will's note a: a page wide control is fixed
 *     so variants can be compared without scrolling back).
 *  2  WHERE WOULD IT GO. Three placements, each composed on the REAL production
 *     shells and primitives it would ship inside (Will's note c: live production
 *     components and whole real page sections, not a screen of specimens):
 *     SectionShell + Container on a cinema feature page, the real Card on a
 *     paper doors row, and the guest album's own empty state on the app ground
 *     (Will's note d: the app's UI is open, so the third placement is a
 *     redesign of a shipped app surface rather than a mock of one).
 *  3  WHAT DOES IT COST. Layers, nodes and bytes are derived from the component
 *     rather than claimed, and the frame cost is measured live off the page
 *     that is carrying every instance on this board at once.
 *  4  HOW IS IT MOUNTED. The props, and the paste.
 *
 * Nothing under src/components is edited: every placement reaches the
 * production shells from outside, exactly as a real page would.
 */

const QUESTION =
  "The river, killed as a hero and streamlined to one flow: as a section scale feature visual at three sizes, in three real placements, on cinema, paper and the app's own ground. Where does it go first, and does the code stay in it?";

/** The line printed on the plate under the code. Present tense, one breath. */
const CODE_LINE = "Scan it. The album is live.";

/* ── Row 1: the bank ── */

/** The three sizes, and what each collapses to on a 375 canvas. */
function bankWidth(id: RiverSizeId, mode: Mode) {
  const s = RIVER_SIZES[id];
  return mode === "desktop" ? s.w : s.phoneW;
}

function Specimen({
  id,
  mode,
  ground,
  origin,
  qrUrl,
}: {
  id: RiverSizeId;
  mode: Mode;
  ground: Ground;
  origin: RiverOrigin;
  qrUrl: string | null;
}) {
  const w = bankWidth(id, mode);
  const h = riverHeight(w);
  return (
    <figure className="flex flex-col items-center gap-2">
      <RiverVisual
        width={w}
        origin={origin}
        qrUrl={qrUrl}
        // The line is printed where the plate has room for it. At 240 the
        // code already clamps to its scan floor and eats half the width, and a
        // caption under it wraps to three lines: the thumbnail is exactly the
        // size at which the second ask (the code, in or out) answers itself.
        line={origin === "code" && w >= 400 ? CODE_LINE : null}
        tone={ground === "paper" ? "paper" : "cinema"}
        className="rounded-[var(--radius-float)]"
      />
      <figcaption>
        <Caption className="text-center">
          {RIVER_SIZES[id].label}, {w} by {h}
        </Caption>
      </figcaption>
    </figure>
  );
}

/* ── Row 2, placement one: a feature page's "how it works" step ── */

/** Real copy in the register the feature pages use. Copy is open (bible 21). */
const STEPS = [
  {
    n: "01",
    h: "Put the code where people look.",
    p: "Print it for the tables, prop it at the bar, or put it on the screen behind the band.",
  },
  {
    n: "02",
    h: "Everyone scans it.",
    p: "No app and no account. The camera opens the album and the first upload is about ten seconds later.",
  },
  {
    n: "03",
    h: "The album fills while the night runs.",
    p: "Every phone, every angle, at the quality it was shot, landing in one place you can watch.",
  },
];

function StepPlacement({
  mode,
  origin,
  qrUrl,
}: {
  mode: Mode;
  origin: RiverOrigin;
  qrUrl: string | null;
}) {
  const w = mode === "desktop" ? 460 : 343;
  return (
    <SectionShell
      eyebrow="How it works"
      heading="One object, and the album pours out of it."
      subhead="The code is the whole setup. Everything below it is what the scan produced."
      align="left"
      reveal="standard"
    >
      {/* ★ The board's OWN markup keys off `mode`, never a Tailwind prefix: a
          prefix inside a stage reads the real BROWSER window and not the
          canvas, so `lg:` fires inside the 375 stage on a desktop and the
          phone review is a lie. The production shells inside (SectionShell,
          Container, Card) carry their own prefixes and are judged as they
          ship, which is the shell's documented rule. */}
      <div
        className={
          mode === "desktop"
            ? "mt-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-10"
            : "mt-8 flex flex-col gap-8"
        }
      >
        <ol className="flex flex-col gap-7">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-4">
              <span className="pt-1 font-heading text-lg text-muted-foreground tabular-nums">
                {s.n}
              </span>
              <span className="flex flex-col gap-1.5">
                <span className="font-heading text-xl text-balance">{s.h}</span>
                <span className="text-sm text-pretty text-muted-foreground">
                  {s.p}
                </span>
              </span>
            </li>
          ))}
        </ol>
        <RiverVisual
          width={w}
          origin={origin}
          qrUrl={qrUrl}
          line={origin === "code" ? CODE_LINE : null}
          tone="cinema"
          className="rounded-[var(--radius-float)] justify-self-center"
        />
      </div>
    </SectionShell>
  );
}

/* ── Row 2, placement two: a card's media slot, on paper ── */

/**
 * The real doors row: three Cards at the width the production grid actually
 * gives them (max-w-5xl, three columns, gap-4, so 330 and not the bank's 400),
 * with the middle card's media slot carrying the visual and its neighbours
 * carrying the stills they carry today. The copy is the feature registry's own
 * directory lines, so nothing here can drift from the nav.
 */
/** The two stills the middle slot is judged against. */
const STILLS = ["reception-hall", "party-balloons"] as const;

function CardPlacement({
  mode,
  origin,
}: {
  mode: Mode;
  origin: RiverOrigin;
}) {
  const doors = FEATURE_PAGES.filter((p) =>
    ["album", "qr", "sharing"].includes(p.slug),
  );
  const w = mode === "desktop" ? 330 : 311;
  return (
    <SectionShell
      eyebrow="Related features"
      heading="The card a feature page ends on."
      align="center"
      reveal="standard"
    >
      <div
        className={
          mode === "desktop"
            ? "mx-auto mt-10 grid max-w-5xl grid-cols-3 gap-4"
            : "mx-auto mt-8 flex max-w-5xl flex-col gap-4"
        }
      >
        {doors.map((d, i) => (
          <Card key={d.slug} className="gap-0 overflow-hidden py-0">
            <div
              className="relative w-full overflow-hidden"
              style={{ height: Math.round(w * 0.72) }}
            >
              {i === 1 ? (
                <div className="absolute inset-x-0 top-0">
                  <RiverVisual
                    width={w}
                    height={Math.round(w * 0.72)}
                    origin={origin}
                    tone="paper"
                  />
                </div>
              ) : (
                // The neighbours carry the stills a door carries today, read
                // through the media manifest (bible 18) like every other path.
                <Image
                  src={marketingImage(STILLS[i === 0 ? 0 : 1]).src}
                  alt=""
                  fill
                  sizes={`${w}px`}
                  className="object-cover"
                />
              )}
            </div>
            <CardHeader className="pt-4">
              <CardTitle className="font-heading text-base">
                {d.navLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-muted-foreground">
                {d.directoryLine}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Caption className="mx-auto mt-4 max-w-5xl">
        The middle slot is the visual at the width the real grid gives a door
        (330), beside two stills. A card slot is the hardest of the three
        placements: the box is short, so the flow is read at its top third,
        where the frames are still small, and an object at the top of it eats
        a third of the picture. This is the slot that argues for no object.
      </Caption>
    </SectionShell>
  );
}

/* ── Row 2, placement three: the guest album's empty state (an app surface) ── */

/**
 * THE APP SURFACE, which Will opened this round: "any UI that touches App in an
 * active lab track may be worked on before the dedicated app agents get to it."
 *
 * Today's empty state is a 3 by 3 ghost mosaic of nine grayscale stills at 25
 * percent with the promise floating over it (gallery-empty-state.tsx, composed
 * here unedited as the left column). The candidate keeps its two rules and
 * changes its picture: the promise is a thing arriving, not a grid standing
 * still, so the mosaic becomes the flow, pouring out of the plate the guest
 * just scanned.
 *
 * ★ TWO DEPARTURES THE PLACEMENT OWNS, not the component.
 *  1  THE FLOW IS A GHOST HERE, at the mosaic's own treatment (grayscale, low
 *     alpha). At full luminance a stream of photographs in an EMPTY album
 *     promises pictures that do not exist, which is the one thing an empty
 *     state may not do; production already made this call for the mosaic and
 *     the candidate inherits it rather than inventing a second answer. It is a
 *     filter on the placement's own wrapper, never a layer over the media, so
 *     bible 1 holds.
 *  2  THE PROMISE SITS UNDER THE FLOW, not over it. The hero river could put
 *     type inside the stream because it cut a clearing to the lockup's measured
 *     silhouette; a feature visual has no clearing and never will, so type goes
 *     beside or below. That is the rule for every placement of this visual.
 */
function EmptyStatePlacement({
  mode,
  origin,
}: {
  mode: Mode;
  origin: RiverOrigin;
}) {
  const col = mode === "desktop" ? 340 : 343;
  return (
    <div className="flex flex-col gap-6 px-6 py-8">
      <div>
        <p className="font-heading text-lg">The guest album, before anyone uploads</p>
        <Caption className="mt-1">
          Today on the left, the flow on the right. Both at the gallery&apos;s
          own column width, on the app ground a guest actually meets. The dock
          drives the origin here too, and the recommendation is no object: a
          guest reaches this screen by scanning the code, so putting it back in
          front of them is the one placement where the code is certainly wrong.
        </Caption>
      </div>
      <div className="flex flex-wrap items-start gap-8">
        {mode === "desktop" ? (
          <div style={{ width: col }}>
            <Caption className="mb-3">Today</Caption>
            <GalleryEmptyState onAddFirst={() => {}} />
          </div>
        ) : null}
        <div style={{ width: col }}>
          <Caption className="mb-3">The flow</Caption>
          <div className="relative">
            {/* The ghost treatment, on the placement's wrapper. */}
            <div className="rvr-ghost overflow-hidden rounded-[var(--radius-tile)]">
              <RiverVisual
                width={col}
                height={col}
                origin={origin}
                tone="cinema"
              />
            </div>
            {/* The promise, exactly where production carries it. Type over the
                media is allowed HERE and nowhere else on this board: the flow
                is already a ghost, which is the treatment an empty album needs
                anyway. In every marketing placement the visual is at full
                luminance and the words go beside it. */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="font-heading text-2xl text-balance">
                This is where it all lands
              </p>
              <Button size="lg">Be the first to add a photo</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Row 3: the cost ── */

/**
 * THE FRAME COST, MEASURED, not claimed. One rAF loop samples the gap between
 * frames on the page that is carrying every instance on this board at once, and
 * writes the median and the fps straight to a DOM node twice a second: a
 * measurement that re-rendered React sixty times a second would be measuring
 * itself. The window is the last 180 gaps, about three seconds.
 *
 * ★ Read it in a FOREGROUND tab. rAF does not fire in a hidden one and the
 * stage sets data-paused, so a backgrounded board reports a stopped clock as a
 * perfect one (docs/systems/testing-verification.md).
 */
function CostMeter() {
  const out = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    let raf = 0;
    let last = 0;
    let lastWrite = 0;
    const gaps: number[] = [];
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (last !== 0) {
        gaps.push(now - last);
        if (gaps.length > 180) gaps.shift();
      }
      last = now;
      if (gaps.length < 30 || now - lastWrite < 500) return;
      lastWrite = now;
      const sorted = [...gaps].sort((a, b) => a - b);
      const med = sorted[Math.floor(sorted.length / 2)];
      const node = out.current;
      if (node) {
        node.textContent = `${med.toFixed(1)} ms median frame gap, about ${Math.round(1000 / med)} frames per second`;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <span ref={out} className="tabular-nums">
      sampling
    </span>
  );
}

const PROPS: { name: string; type: string; note: string }[] = [
  {
    name: "width",
    type: "number",
    note: "The box, in px. Every other number is derived from it, so any width is already correct; the bank argues 560, 400 and 240.",
  },
  {
    name: "height",
    type: "number",
    note: `Defaults to width times 1.32. A short box is read at the top of the flow, where the frames are still small.`,
  },
  {
    name: "origin",
    type: '"code" | "plate" | "none"',
    note: "What the album pours out of: the real demo code on its printed card, the same card with no code, or nothing (the flow enters from above the frame).",
  },
  {
    name: "qrUrl",
    type: "string | null",
    note: "The demo event's guest URL. With it the code is a link; without it the code encodes the site and carries none.",
  },
  {
    name: "line",
    type: "string | null",
    note: "One line printed on the plate, or nothing. Ink on white is the scanner contrast exception footer-qr.tsx already documents.",
  },
  {
    name: "tone",
    type: '"cinema" | "paper"',
    note: "The ground it sits on. It changes the lift alphas and the plate's edge and nothing else: one token set (bible 2).",
  },
  {
    name: "eager",
    type: "boolean",
    note: "False by default, which is production truth below the fold. A placement in the first screen passes true.",
  },
];

const PASTE = `import { RiverVisual } from "@/components/marketing/system/river-visual";

<RiverVisual
  width={560}
  origin="code"
  qrUrl={DEMO_EVENT_URL ?? null}
  line="Scan it. The album is live."
  tone="cinema"
/>`;

function BankCard({ instances }: { instances: number }) {
  return (
    <div className="grid gap-4 rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground lg:grid-cols-2">
      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-medium text-foreground">
            What it is
          </p>
          <p className="mt-1">
            One printed object at the top of a box and an album pouring out of
            it: {RIVER_FACTS.cards} frames, born behind the plate, fanning over
            the first third of the distance they fall, growing and straightening
            as they land, dissolving through the bottom and side edges. One
            closed form of the clock drives all of it, so there is no state, no
            timer and no per frame bookkeeping, and the still it rests at is the
            same expression with the clock at zero.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-foreground">
            Where it could go
          </p>
          <p className="mt-1">
            Beside the copy of a how it works step on any feature page (the
            column, 560); in a card&apos;s media slot on a doors row (330 in the
            real grid); as the guest album&apos;s empty state, ghosted (the app
            ground). It is not a hero and should never carry type inside it.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-medium text-foreground">The cost</p>
          <ul className="mt-1 space-y-0.5">
            <li>
              {RIVER_FACTS.layers} promoted layers and {RIVER_FACTS.nodes} DOM
              nodes per instance, derived from the component, times {instances}{" "}
              instances mounted on this board.
            </li>
            <li>
              {RIVER_FACTS.cards} transform writes per instance per frame, and
              an opacity write only when it changed, which at rest is none.
            </li>
            <li>
              The flight is {RIVER_FACTS.flight} ms and a frame launches every{" "}
              {RIVER_FACTS.launch} ms, shared by every size, so instances on one
              page pour in step.
            </li>
            <li>
              Measured here, right now: <CostMeter />.
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-medium text-foreground">The paste</p>
          {/* The body face, deliberately: there is no mono face in the product
              (bible 7), and a bare <pre> still resolves to a mono stack through
              preflight, so it is given font-sans like every other one in src. */}
          <pre className="mt-1 overflow-x-auto rounded-md border border-border bg-background px-3 py-2 font-sans text-[11px] leading-relaxed whitespace-pre">
            {PASTE}
          </pre>
        </div>
      </div>
      <div className="lg:col-span-2">
        <p className="text-[11px] font-medium text-foreground">The props</p>
        <dl className="mt-1 grid gap-x-3 gap-y-1 sm:grid-cols-[10rem_minmax(0,1fr)]">
          {PROPS.map((prop) => (
            <div key={prop.name} className="contents">
              <dt className="text-foreground">
                {prop.name}
                <span className="text-muted-foreground"> {prop.type}</span>
              </dt>
              <dd>{prop.note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/* ── The board ── */

export function RiverVisualBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [ground, setGround] = useState<Ground>("cinema");
  const [origin, setOrigin] = useState<RiverOrigin>("code");
  const [runId, setRunId] = useState(0);
  const qrUrl = DEMO_EVENT_URL ?? null;
  // Three specimens plus one per placement: what the meter in the bank card is
  // measuring, counted rather than guessed. It does not change with the canvas
  // (today's empty state carries no instance, only the candidate does), and it
  // is five more than any real page would mount.
  const instances = 6;

  return (
    <div className="rvr-board pt-2">
      <BoardDock
        aside={
          <button
            type="button"
            onClick={() => setRunId((n) => n + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3" /> Replay
          </button>
        }
      >
        <Toggle
          ariaLabel="Canvas"
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
            { id: "cinema" as Ground, label: "Cinema" },
            { id: "paper" as Ground, label: "Paper" },
          ]}
          value={ground}
          onChange={setGround}
        />
        <Toggle
          ariaLabel="Origin"
          options={[
            { id: "code" as RiverOrigin, label: "The demo code" },
            { id: "plate" as RiverOrigin, label: "A plain plate" },
            { id: "none" as RiverOrigin, label: "No object" },
          ]}
          value={origin}
          onChange={setOrigin}
        />
      </BoardDock>

      <div className="mt-4 space-y-8">
        {/* ROW 1: the bank, three sizes on one clock. */}
        <section className="space-y-2">
          <header>
            <h2 className="font-heading text-lg">
              The visual, at the three sizes it is banked at
            </h2>
            <Caption className="mt-1">
              One clock across all three, so this row is one visual at three
              scales and not three tunings. At 1:1: the row is {mode === "desktop" ? "1264" : "343"} px
              wide and scrolls sideways if the window is narrower, which is
              correct.
            </Caption>
          </header>
          <Stage
            mode={mode}
            ground={ground}
            height={mode === "desktop" ? 860 : 1640}
            key={`bank-${mode}-${ground}-${origin}-${runId}`}
          >
            <div
              className={
                mode === "desktop"
                  ? "flex h-full items-center justify-center gap-8 px-8"
                  : "flex h-full flex-col items-center gap-6 py-6"
              }
            >
              {(["column", "card", "thumb"] as RiverSizeId[]).map((id) => (
                <Specimen
                  key={id}
                  id={id}
                  mode={mode}
                  ground={ground}
                  origin={origin}
                  qrUrl={qrUrl}
                />
              ))}
            </div>
          </Stage>
        </section>

        {/* ROW 2: three real placements. */}
        <section className="space-y-2">
          <header>
            <h2 className="font-heading text-lg">
              Three placements, on the production shells they would ship inside
            </h2>
            <Caption className="mt-1">
              SectionShell, Container, Card and the guest album&apos;s own empty
              state, composed and never edited. A production shell&apos;s own
              breakpoints read the BROWSER window and not the canvas, so the 375
              stage tells the truth about the visual and only approximates the
              shell&apos;s gutters unless the window is narrow too.
            </Caption>
          </header>
          <Stage
            mode={mode}
            ground="cinema"
            height={mode === "desktop" ? 1040 : 1180}
            key={`step-${mode}-${origin}-${runId}`}
          >
            <StepPlacement mode={mode} origin={origin} qrUrl={qrUrl} />
          </Stage>
          <Stage
            mode={mode}
            ground="paper"
            height={mode === "desktop" ? 760 : 1560}
            key={`card-${mode}-${origin}-${runId}`}
          >
            <CardPlacement mode={mode} origin={origin} />
          </Stage>
          <Stage
            mode={mode}
            ground="app-dark"
            height={mode === "desktop" ? 720 : 900}
            key={`empty-${mode}-${origin}-${runId}`}
          >
            <EmptyStatePlacement mode={mode} origin={origin} />
          </Stage>
        </section>

        {/* ROW 3: the bank card. */}
        <section className="space-y-2">
          <header>
            <h2 className="font-heading text-lg">The bank entry</h2>
          </header>
          <BankCard instances={instances} />
        </section>

        <BoardMeta
          question={QUESTION}
          candidates={[
            {
              name: "One flow (the whole board)",
              rationale:
                "The hero's two braided arms, its measured clearing and its held beat are gone; what is left is one stream fanning out of one object, which is the thing Will liked and the only thing a section slot has room for. 210 lines of hero geometry left with them and nothing on screen is poorer for it.",
            },
            {
              name: "Three sizes, one clock",
              rationale:
                "Every number is derived from the box, so 560, 400 and 240 are the same visual at three scales; the flight and the cadence are constants, so instances on one page pour in step. A placement at any other width is already correct.",
            },
            {
              name: "Three origins",
              rationale:
                "The real demo code on its printed card (a link, and a CTA in disguise), the same card blank for a placement whose subject is not the code, or no object at all, where the flow enters from above the frame. The third is the quietest and the first is the loudest.",
            },
          ]}
          asks={[
            "Where it goes first: the how it works column on a feature page (560, the strongest of the three), the doors row card slot (330, the hardest), or the guest album's empty state (the app surface, ghosted).",
            "The code, in or out. In, it is a scannable CTA inside a section visual and every placement inherits a second call to action; out, the plain plate is a white card with a faint field in it, which is quieter and says less.",
            "Whether an empty album may show photographs at all. The candidate ghosts the flow at production's own mosaic treatment for exactly that reason, and the honest alternative is that the guest's empty state carries no picture of other people's events.",
            "The proportion: 1.32 is the visual's default and the only number in it that is taste rather than derivation.",
          ]}
          departures={[
            "THE GHOST IN THE APP PLACEMENT. The guest empty state renders the flow grayscale at low alpha, which is production's own treatment for the ghost mosaic it replaces (gallery-empty-state.tsx): at full luminance a stream of photographs in an empty album promises pictures that do not exist. It is a filter on the placement's wrapper and never a layer over the media, so bible 1 holds; it is listed here because it is the only place on this board where a photograph is not at 100 percent.",
            "BIBLE 13, decorative layer only. The pre pour state (every frame collapsed at the object) lives inside the reduced-motion block, so a reader with JavaScript off who has not asked for less motion sees the flow rest at the object. Nothing that carries meaning is gated by it: this visual holds no type, by design, and every placement's words are plain markup beside it. A reader who asked for less motion gets the flow fully deployed, which is the still the rest state was written to be.",
            "BIBLE 12, the register. A feature visual is occasional, not a hero, so the flight is 7.6 seconds and a frame launches every 611 ms: slow enough to be ambient beside copy, and paused off screen by useAmbientPause the moment this is wired (the lab pauses on a hidden tab only, so the board can be compared side by side).",
            "THE SCAN FLOOR, stated rather than hidden. FooterQr is 33 modules plus its quiet zone, so a plate under about 96 px puts each module below what a phone camera reads off a screen. The geometry clamps there instead of drawing a code nobody can scan, which means the 240 thumbnail's code is nearly half the visual. That is the strongest argument for the plain plate at small sizes and it is what the second ask is really about.",
            "THE PREFIX MOVED, hhv- to rvr-, everywhere in this lane. hhv- meant home hero variation and this is no longer one; keyframe names are document global, so the rename also keeps this sheet from shadowing the hero board's if the two are ever on one page.",
          ]}
          assets={[
            "24 event photographs as 512 by 512 squares, one grade, 6 to 35 KB webp each, framed tight enough to read at 110 px, which is the size a frame is as it leaves the object in the 560 column and larger than it ever gets in the 240 thumbnail. ASSETS row 2, already requested and unchanged, and the same row the media kit's call sheet asks for, so this is one ask across several boards. Replaces the 12 landscape stand ins and retires the per frame crop table in river.tsx.",
            "12 event photographs as 4:5 portraits, 720 by 900, one grade, from the same shoot as the squares. ASSETS row 12, already requested and unchanged. Replaces the portrait cards (wf 0.8), which are cropped out of landscapes today.",
            "Nothing else is a picture. This visual asks for no count, no video and no shell prop: it is twelve photographs, one plate and one clock.",
          ]}
        />
      </div>
    </div>
  );
}

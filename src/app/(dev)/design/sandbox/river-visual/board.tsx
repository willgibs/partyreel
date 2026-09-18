"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import Image from "next/image";
import { useState } from "react";

import {
  BoardPage,
  CANVAS,
  Cell,
  CellLabel,
  Compare,
  CostMeter,
  FitStage,
  type Ground,
  type Mode,
  Paste,
  ReplayButton,
  Specimen,
  useReplay,
} from "@/components/lab";
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
  riverQrReadout,
} from "./river";
import { RIVER_VISUAL } from "./spec";

/**
 * THE RIVER, A FEATURE VISUAL (round two, 2026-09-15: onto the kit's template;
 * the evidence relabelled the same night, the clarity round).
 *
 * What the board ARGUES lives in `spec.ts` now, and only there: the question,
 * the verdict, the four one-word calls, the candidates, the departures and the
 * two assets. What is left here is what a board should be and nothing else, the
 * evidence for each declared section as a function of the declared state.
 *
 * ★ AND THE EVIDENCE CARRIES THE OPTIONS' OWN WORDS (Will, 2026-09-15: a
 * question carries its context). Every caption, comparison label and section
 * title a reviewer judges an ask on now opens with the word the ask offers, so
 * "Keep the code in it" on the pill is "Keep the code in it" under the
 * specimen. Nothing rendered moved: the three placement sections are the three
 * options of the placement ask and are titled that way, the size row's captions
 * open with the code ask's two, the guest comparison labels both halves with
 * the one answer they both are, and the numbers are the same numbers.
 *
 * Round one built the bank entry: one flow out of one printed object, three sizes on
 * one clock, three placements on the production shells they would ship inside.
 * Round two moves the presentation onto the template, and nothing about the
 * river itself changed. Three things the BOARD could not do before, it can now:
 *
 *  1  REST IS A SWITCH. The reduced-motion state was only reachable by deleting
 *     the no-preference blocks out of the live sheets by hand, which cost round
 *     one an hour and is not something a reviewer will ever do. It is the
 *     Motion knob now, driving the visual's own `still` prop, so the state a
 *     reduced-motion reader gets is one click and one shareable URL away.
 *  2  THE COST IS PHASED. Round one's meter was a rolling readout of whatever
 *     the whole board happened to be doing. The kit's runs declared phases with
 *     everything else on the board hidden, so the three numbers a bank entry
 *     owes (the floor, one instance, six at once) are each measured rather than
 *     inferred from one rolling median taken over all of them.
 *  3  THE STAGES MEASURE THEMSELVES. Four hand-typed stage heights are gone:
 *     every stage here is a FitStage, so a placement that grows cannot quietly
 *     clip. Round one shipped a clipped step placement at the phone canvas and
 *     only found it by measuring the DOM two commits later.
 *
 * ★ THE BOARD'S OWN MARKUP KEYS OFF `mode`, NEVER A TAILWIND PREFIX. A prefix
 * inside a stage reads the real BROWSER window and not the canvas, so `lg:`
 * fires inside the 375 stage on a desktop and the phone review is a lie. The
 * production shells rendered inside (SectionShell, Container, Card,
 * GalleryEmptyState) carry their own prefixes and are judged as they ship,
 * which is the shell's documented rule and is what makes them evidence.
 *
 * Nothing under src/components is edited: every placement reaches the production
 * shells from outside, exactly as a real page would.
 */

/** The line printed on the plate under the code. Present tense, one breath. */
const CODE_LINE = "Scan it. The album is live.";

/** The three banked sizes, and what each collapses to on a 375 canvas. */
function bankWidth(id: RiverSizeId, mode: Mode) {
  const s = RIVER_SIZES[id];
  return mode === "desktop" ? s.w : s.phoneW;
}

/** What every part needs off the declared state, passed as one object so a new
 *  knob does not mean seven signature edits. */
type Shared = {
  mode: Mode;
  origin: RiverOrigin;
  still: boolean;
  qrUrl: string | null;
};

/* ────────────────────────────────  THE BANK  ───────────────────────────── */

function BankSpecimen({
  id,
  mode,
  ground,
  origin,
  still,
  qrUrl,
}: Shared & { id: RiverSizeId; ground: Ground }) {
  const w = bankWidth(id, mode);
  const h = riverHeight(w);
  // What the code actually gets in this box, read off the same function the
  // geometry uses. Printed rather than claimed: the scan floor is an absolute
  // number of px, so the smaller the box the more of it the code takes, and
  // that is what the code ask turns on.
  const code = origin === "code" ? riverQrReadout(w, qrUrl) : null;
  return (
    <Cell
      name={`${RIVER_SIZES[id].label}, ${w} by ${h}`}
      // ★ THE CAPTION OPENS WITH THE OPTION'S OWN WORDS (the clarity round,
      // 2026-09-14 ruling, 2026-09-15): the code ask offers "Keep the code in
      // it" and "Take the code out", so a reviewer reading a caption away from
      // the ask sees the answer this specimen IS, then what it cost. The
      // numbers are unchanged.
      note={
        code
          ? `Keep the code in it: ${code.edge} px of code, ${code.perModule.toFixed(1)} px a module, its card ${Math.round(code.plateShare * 100)} percent of the box`
          : origin === "plate"
            ? "Take the code out: the plain card is a fifth of the box at every size"
            : "Take the code out: nothing at the top, and the flow enters from above the frame"
      }
      className="shrink-0"
    >
      <RiverVisual
        width={w}
        origin={origin}
        qrUrl={qrUrl}
        // The line is printed where the plate has room for it. At 240 the
        // scannable code is 123 px and its plate 143, three fifths of the
        // width, and a caption under that wraps to three lines: the thumbnail
        // is exactly the size at which the code ask answers itself.
        line={origin === "code" && w >= 400 ? CODE_LINE : null}
        tone={ground === "paper" ? "paper" : "cinema"}
        still={still}
        className="rounded-[var(--radius-float)]"
      />
    </Cell>
  );
}

const BANK_SIZES: RiverSizeId[] = ["column", "card", "thumb"];

function BankPart({
  ground,
  swapKey,
  ...shared
}: Shared & { ground: Ground; swapKey: string }) {
  const { mode } = shared;
  return (
    <div className="flex flex-col gap-2">
      <FitStage mode={mode} ground={ground} swapKey={swapKey}>
        {/* ★ NOT `Specimen`, and the reason is the 1:1 law. Specimen's grid is
            `repeat(cols, minmax(0,1fr))`, which is right for equal cells and
            wrong for this row: three EQUAL 437px columns inside a 1440 stage
            cannot hold a 560 specimen, and the only ways to make it fit are to
            shrink the specimen or to scale it, both of which the lab forbids
            for a thing whose SIZE is what is being judged. Content-sized cells
            are asked for in the Handoff; until the kit takes them this is a
            flex row of the kit's own Cells, which is what carries the caption
            discipline. */}
        <div
          className={
            mode === "desktop"
              ? "flex items-center justify-center gap-8 px-8 py-6"
              : "flex flex-col items-center gap-6 px-4 py-6"
          }
        >
          {BANK_SIZES.map((id) => (
            <BankSpecimen key={id} id={id} ground={ground} {...shared} />
          ))}
        </div>
      </FitStage>
      <CellLabel>
        One clock across all three, so this row is one visual at three sizes and
        not three tunings. Every box is 1.32 times as tall as it is wide: that
        is the Keep it as it is answer, and Make it taller and Make it squarer
        change that one number and nothing else. At their true size the row is{" "}
        {mode === "desktop" ? "1264" : "343"} px wide and scrolls sideways if
        the window is narrower, which is correct.
      </CellLabel>
    </div>
  );
}

/* ───────────────────  PLACEMENT ONE: A FEATURE PAGE'S STEP  ─────────────── */

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

function StepPlacement({ mode, origin, still, qrUrl }: Shared) {
  // THE BANK'S COLUMN SIZE, read off the bank rather than typed. This
  // placement IS the 560 column (343 on a phone, the same number the bank row
  // collapses to), so the first ask names the number the section actually
  // draws: an earlier draft drew 460 here while the ask said 560, which put a
  // width in front of Will that nothing on the board rendered.
  const w = bankWidth("column", mode);
  return (
    <SectionShell
      eyebrow="How it works"
      heading="One object, and the album pours out of it."
      subhead="The code is the whole setup. Everything below it is what the scan produced."
      align="left"
      reveal="standard"
    >
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
          still={still}
          className="justify-self-center rounded-[var(--radius-float)]"
        />
      </div>
      <Caption className="mt-6">
        Beside a how it works step: the visual at the size the row of three
        banked as its column ({w} here), with the step list taking the rest of
        the container.
      </Caption>
    </SectionShell>
  );
}

/* ──────────────────  PLACEMENT TWO: A CARD SLOT, ON PAPER  ─────────────── */

/**
 * The real doors row: three Cards at the width the production grid actually
 * gives them (max-w-5xl, three columns, gap-4, so 330 and not the bank's 400),
 * with the middle card's media slot carrying the visual and its neighbours
 * carrying the stills they carry today. The copy is the feature registry's own
 * directory lines, so nothing here can drift from the nav.
 */
const STILLS = ["reception-hall", "party-balloons"] as const;

function CardPlacement({ mode, origin, still }: Shared) {
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
                    still={still}
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
              <p className="text-sm text-muted-foreground">{d.directoryLine}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Caption className="mx-auto mt-4 max-w-5xl">
        In a feature card&apos;s picture slot: the middle card carries the
        visual at the width the real three card row gives it ({w} here), beside
        two photographs. The box is short, so the flow is read at its top third,
        where the frames are still small, and an object at the top of it eats a
        third of the picture.
      </Caption>
    </SectionShell>
  );
}

/* ─────────────  PLACEMENT THREE: THE GUEST ALBUM'S EMPTY STATE  ────────── */

/**
 * THE GUEST COLUMN, derived from the page it ships on rather than picked:
 * event-experience.tsx clamps the guest page at max-w-2xl (672) and keeps
 * px-5 gutters, so its gallery is the canvas or 672, whichever is smaller,
 * less the two gutters. Read off the shell's own canvas so it cannot drift
 * from the stage: 632 at 1440, 335 at 375.
 */
const GUEST_PAGE_MAX = 672;
const GUEST_GUTTER = 20;

function guestCol(mode: Mode) {
  return Math.min(CANVAS[mode].w, GUEST_PAGE_MAX) - GUEST_GUTTER * 2;
}

/**
 * THE APP SURFACE, which Will opened this round: "any UI that touches App in an
 * active lab track may be worked on before the dedicated app agents get to it."
 *
 * Today's empty state is a 3 by 3 ghost mosaic of nine grayscale stills at 25
 * percent with the promise floating over it (gallery-empty-state.tsx, composed
 * here unedited as the comparison's first half). The candidate keeps its two
 * rules and changes its picture: the promise is a thing arriving, not a grid
 * standing still, so the mosaic becomes the flow, pouring out of the plate the
 * guest just scanned.
 *
 * ★ TWO DEPARTURES THE PLACEMENT OWNS, not the component.
 *  1  THE FLOW IS A GHOST HERE, at the mosaic's own treatment. At full
 *     luminance a stream of photographs in an EMPTY album promises pictures
 *     that do not exist, which is the one thing an empty state may not do;
 *     production already made this call for the mosaic and the candidate
 *     inherits it rather than inventing a second answer. It is a filter on the
 *     placement's own wrapper, never a layer over the media, so bible 1 holds.
 *  2  THE PROMISE SITS OVER THE FLOW, which no other placement may do. The hero
 *     river could put type inside the stream because it cut a clearing to the
 *     lockup's measured silhouette; a feature visual has no clearing and never
 *     will, so everywhere else the words go beside it. Here the ghost buys it.
 */
function EmptyStatePlacement({ mode, origin, still }: Shared) {
  const col = guestCol(mode);
  return (
    <div
      className={
        // The phone canvas keeps the guest page's OWN px-5 gutter, so the
        // column is not squeezed by a padding the real screen does not have.
        mode === "desktop"
          ? "flex flex-col gap-6 px-6 py-8"
          : "flex flex-col gap-6 px-5 py-8"
      }
    >
      <Compare
        // ★ One column at the phone canvas. Compare's `side` mode splits on
        // `sm:grid-cols-2`, and a breakpoint prefix inside a stage reads the
        // BROWSER window rather than the canvas, so on a wide window the 375
        // stage would show two 160px columns where a phone has room for one.
        // The rule is in board.css and the kit patch is in the Handoff.
        className={mode === "phone" ? "rvr-onecol" : undefined}
        // ★ BOTH HALVES ARE THE SAME ANSWER, AND THE LABELS SAY SO (the clarity
        // round). The ask is whether an empty album may show faint photographs
        // at all: today's grid and the candidate flow are both the "Yes, faded
        // and grey" option, so labelling them "Today" and "The flow" left a
        // reviewer to work out which option either one was. The other answer,
        // "No, words alone", is this screen with the picture taken out, which
        // the board does not draw; the differs line says so rather than
        // pretending one of these halves is it.
        labels={[
          "Yes, faded and grey: today's grid",
          "Yes, faded and grey: the flow",
        ]}
        differs={`The picture an empty album shows: today's 3 by 3 faded grid against the flow pouring out of the card the guest just scanned, both at ${col} px, the width the guest page gives its gallery on this canvas. Both are the faded answer; the words alone answer is this screen with the picture gone. The dock drives what it pours out of here too, and the recommendation is nothing at the top: a guest reached this screen by scanning the code, so putting it back in front of them is the one slot where the code is certainly wrong.`}
        a={
          <div style={{ width: col }}>
            <GalleryEmptyState onAddFirst={() => {}} />
          </div>
        }
        b={
          <div style={{ width: col }} className="relative">
            {/* The ghost treatment, on the placement's wrapper. */}
            <div className="rvr-ghost overflow-hidden rounded-[var(--radius-tile)]">
              <RiverVisual
                width={col}
                height={col}
                origin={origin}
                tone="cinema"
                still={still}
              />
            </div>
            {/* The promise, exactly where production carries it. */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="font-heading text-2xl text-balance">
                This is where it all lands
              </p>
              <Button size="lg">Be the first to add a photo</Button>
            </div>
          </div>
        }
      />
    </div>
  );
}

/* ────────────────────────────────  THE COST  ───────────────────────────── */

/**
 * WHAT ONE OF THESE COSTS, in the three states a bank entry owes: the floor,
 * what a real page pays, and what happens to a page that wants several.
 *
 * ★ THE MEASURED SPECIMEN IS THE ONE ON THE SCREEN. The kit's meter sets
 * `data-lab-solo` while a phase runs and this board's sheet hides every flow
 * outside `[data-lab-solo-target]`, so a frame gap is the candidate's and not
 * the board's. A run taken with the other five instances pouring would be a
 * measurement of the page.
 *
 * ★ AND THE COUNT IS MOUNTED, NOT REVEALED. `display: none` does not stop the
 * loop: the rAF callback still writes a transform to every node it holds, so a
 * hidden instance costs what a visible one does and a stress phase built by
 * un-hiding five would measure six in every phase. The meter's own settle beat
 * covers the mount, and the twelve photographs are already decoded because
 * every other instance on the board drew them.
 */
const COST_COUNT = 6;

function CostPart({
  mode,
  ground,
  origin,
  still,
  qrUrl,
  count,
  setCount,
  setMotion,
  swapKey,
}: Shared & {
  ground: Ground;
  count: number;
  setCount: (n: number) => void;
  setMotion: (v: "live" | "rest") => void;
  swapKey: string;
}) {
  const w = bankWidth("thumb", mode);
  return (
    <div className="flex flex-col gap-4">
      <div data-lab-solo-target>
        <FitStage mode={mode} ground={ground} swapKey={swapKey}>
          <div className={mode === "desktop" ? "px-8 py-6" : "px-4 py-6"}>
            {/* Equal cells at one size, which is exactly what Specimen is for:
                the question here is the COUNT, not the scale, so every cell is
                the same box and the grid is honest. */}
            <Specimen cols={mode === "desktop" ? 4 : 2}>
              {Array.from({ length: count }, (_, i) => (
                <Cell key={i} name={`Instance ${i + 1}`}>
                  <RiverVisual
                    width={w}
                    origin={origin}
                    qrUrl={qrUrl}
                    tone={ground === "paper" ? "paper" : "cinema"}
                    still={still}
                    className="rounded-[var(--radius-float)]"
                  />
                </Cell>
              ))}
            </Specimen>
          </div>
        </FitStage>
      </div>
      <CostMeter
        phases={[
          {
            id: "rest",
            label:
              "The still version (what a reader who asked for less motion gets)",
            enter: () => {
              setCount(1);
              setMotion("rest");
            },
          },
          {
            id: "one",
            label: "One of them running (what a page uses)",
            enter: () => {
              setCount(1);
              setMotion("live");
            },
          },
          {
            id: "six",
            label: `${COST_COUNT} of them running at once (the stress case)`,
            enter: () => {
              setCount(COST_COUNT);
              setMotion("live");
            },
          },
        ]}
        statics={`Per instance: ${RIVER_FACTS.cards} frames, ${RIVER_FACTS.layers} promoted layers, ${RIVER_FACTS.nodes} DOM nodes, ${RIVER_FACTS.cards} transform writes a frame, and an opacity write only when it changed, which at rest is none. No filter, no blur and no mask repaint: two static masks and one rAF loop. The per frame work does not grow with the box; raster does, and a frame gap cannot see it.`}
      />
      <CellLabel>
        The flight is {RIVER_FACTS.flight} ms and a frame launches every{" "}
        {RIVER_FACTS.launch} ms, shared by every size, so instances on one page
        pour in step. The meter leaves the board in the last phase it ran.
      </CellLabel>
    </div>
  );
}

/* ────────────────────────────────  THE MOUNT  ──────────────────────────── */

const PROPS: { name: string; type: string; note: string }[] = [
  {
    name: "width",
    type: "number",
    note: "The box, in px. Every other number is derived from it, so any width is already correct; the bank argues 560, 400 and 240.",
  },
  {
    name: "height",
    type: "number",
    note: "Defaults to width times 1.32. A short box is read at the top of the flow, where the frames are still small.",
  },
  {
    name: "origin",
    type: '"code" | "plate" | "none"',
    note: "What the album pours out of: the real demo code on its printed card, the same card with no code on it, or nothing at all (the flow enters from above the frame). The plain card is a fifth of the width at any size; the code is that or its scan floor, whichever is larger, so under about 615 px (495 with no demo URL) the code is the larger object.",
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
  {
    name: "still",
    type: "boolean",
    note: "Renders the still version: the flow standing at its steady spacing, which is what a reader who asked for less motion, a crawler and the server's own HTML already get. The board's Motion knob drives it; production passes nothing, because the reader's own preference does.",
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

function MountPart() {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div>
        <p className="text-[12px] font-medium">The props</p>
        <dl className="mt-1.5 grid gap-x-3 gap-y-1 text-xs text-muted-foreground sm:grid-cols-[10rem_minmax(0,1fr)]">
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
      {/* Collapsed, like every paste on the kit: the reviewer checks that the
          block exists and says what the section above it said, then copies it.
          Six lines is the kit's own default and the count is on the button. */}
      <Paste code={PASTE} label="The mount" />
    </div>
  );
}

/* ──────────────────────────────  THE BOARD  ────────────────────────────── */

export function RiverVisualBoard() {
  const { runId, replay } = useReplay();
  // The meter's own phase count. Board-local on purpose: it is not a page-wide
  // switch a reviewer flips, it is the instrument's state while it runs, so it
  // has no business in the dock or in a shared link.
  const [count, setCount] = useState(1);
  const qrUrl = DEMO_EVENT_URL ?? null;

  return (
    <BoardPage
      spec={RIVER_VISUAL}
      dock={() => <ReplayButton runId={runId} onReplay={replay} />}
      evidence={(id, state, api) => {
        const mode = state.canvas as Mode;
        const ground = state.ground as Ground;
        const origin = state.origin as RiverOrigin;
        const still = state.motion === "rest";
        const shared = { mode, origin, still, qrUrl };
        // A stage remounts on any state change that has to re-pour, so the
        // entrance is seen rather than inferred; Replay rides the same key.
        const swapKey = `${mode}-${ground}-${origin}-${still}-${runId}`;
        switch (id) {
          case "bank":
            return <BankPart ground={ground} swapKey={swapKey} {...shared} />;
          case "column":
            return (
              <FitStage mode={mode} ground="cinema" swapKey={swapKey}>
                <StepPlacement {...shared} />
              </FitStage>
            );
          case "card":
            return (
              <FitStage mode={mode} ground="paper" swapKey={swapKey}>
                <CardPlacement {...shared} />
              </FitStage>
            );
          case "guest":
            return (
              <FitStage mode={mode} ground="app-dark" swapKey={swapKey}>
                <EmptyStatePlacement {...shared} />
              </FitStage>
            );
          case "cost":
            return (
              <CostPart
                ground={ground}
                count={count}
                setCount={setCount}
                setMotion={(v) => api.setState({ motion: v })}
                swapKey={`${swapKey}-${count}`}
                {...shared}
              />
            );
          case "mount":
            return <MountPart />;
          default:
            return null;
        }
      }}
    />
  );
}

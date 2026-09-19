"use client";

import type { CSSProperties, ReactNode } from "react";

import { HelpPane } from "@/components/marketing/built-for";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { getEventType } from "@/lib/constants/events";
import { cn } from "@/lib/utils";

import { ROOM_BY_TYPE, type TypeFixture } from "./fixtures";
import { AlbumObject, Beat, Pic } from "./pieces";
import { SECOND_GROUND, SecondBody, type SecondShape } from "./second";

/**
 * DECISION 3 ON THE PAGE, THIRD IN THE CHAIN: THE ARC, staged behind the second
 * section.
 *
 * Bible 17: a marketing page is chapters, each opening strong and ramping down
 * until the next opener. A type page runs six beats today and turns to paper
 * exactly once, at the cut straight under the hero, which is the cut Will
 * called out. Move that section and the page's whole rhythm moves with it, so
 * this asks the question once the second section is settled, and DRAWS whichever
 * section won inside each arc rather than a second guess at it.
 *
 * Will's own ruling binds the middle option (2026-09-18, verbatim): "full image
 * backgrounds sections should commonly serve as chapter transitions, so we go
 * straight from dark to light or vice versa less often... However, it isn't
 * required at every transition, else every page with chapters would have full
 * images above and below the paper chapter, which would feel repetitive."
 *
 * ★ THE WHOLE PAGE, SHOWN SMALL, AND EVERY BEAT IS THE REAL ONE. Rhythm cannot
 * be judged one screen at a time. The column lays out at its real width (1440 or
 * 375, viewport breakpoints intact) and is then zoomed down, so proportions are
 * true and nothing here is a diagram of a page. Nothing runs an engine: an arc
 * is a shape, and a live engine inside a zoomed column would be measuring a box
 * that is not the one it is drawn in.
 */
export type ArcShape = "today" | "chapter" | "dark";

/* ── the beats ───────────────────────────────────────────────────────────── */

function HeroBand({ type }: { type: TypeFixture }) {
  const room = ROOM_BY_TYPE[type.slug] ?? [];
  return (
    <section className="pt-14 pb-14">
      <Container className="flex flex-col items-center gap-6 text-center">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Events
        </p>
        <h1 className="max-w-3xl font-heading text-title text-balance">
          {type.headline}
        </h1>
        <p className="max-w-xl text-lg text-balance text-muted-foreground">
          {type.subhead}
        </p>
        <div className="mt-2 flex gap-3">
          <span className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background">
            Start free
          </span>
          <span className="rounded-lg border px-6 py-3 text-sm font-medium">
            See pricing
          </span>
        </div>
        {room.length > 0 ? (
          <div className="mt-8 w-full max-w-3xl">
            <AlbumObject tiles={type.stills.slice(0, 4)} />
          </div>
        ) : null}
      </Container>
    </section>
  );
}

/** The transition: one photograph across the page, carrying the reader out of
 *  the dark chapter and into the light one. */
function TransitionBand({ type }: { type: TypeFixture }) {
  const room = ROOM_BY_TYPE[type.slug] ?? [];
  return (
    <section className="relative h-[420px] overflow-hidden">
      {room.length > 1 ? (
        <Pic id={room[1]} className="absolute inset-0" sizes="100vw" />
      ) : null}
      {/* The line needs a ground of its own: white type over the middle of a
          bright photograph is the legibility failure the plate ruling exists
          for, and a full plate here would make the band a card. */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 50%, rgb(0 0 0 / 0.6), transparent)",
        }}
      />
      <div className="relative flex h-full items-center justify-center px-8">
        <p className="max-w-2xl text-center font-heading text-section text-balance text-white">
          Here is how it works for yours.
        </p>
      </div>
    </section>
  );
}

/** The planning document: the one thing on these pages a reader studies rather
 *  than skims, which is why it is the beat that earns the light ground. */
function PlanningPane({ type }: { type: TypeFixture }) {
  const real = getEventType(type.slug);
  return (
    <SectionShell
      eyebrow="Why Partyreel"
      heading={`Built for ${type.navLabel.toLowerCase()}`}
      reveal="none"
    >
      <HelpPane help={real?.howItHelps ?? []} />
    </SectionShell>
  );
}

/** The proof, still: the door's promise beside the reel's place. */
function ProofBand({ type }: { type: TypeFixture }) {
  return (
    <SectionShell
      eyebrow="See one that is real"
      heading={`Open a ${type.singular} that already happened.`}
      reveal="none"
    >
      <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-12">
        <div className="relative overflow-hidden rounded-2xl border lg:col-span-7">
          <Pic
            id="reception-hall"
            className="aspect-[1/0.7] w-full"
            sizes="640px"
          />
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 to-transparent p-7 pt-16">
            <p className="font-heading text-section text-white">{type.door}</p>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-6 lg:col-span-5">
          <p className="font-heading text-subsection">
            And it ends with a reel.
          </p>
          <div className="mt-5 aspect-9/16 w-[120px] rounded-xl bg-muted" />
        </div>
      </div>
    </SectionShell>
  );
}

function Close() {
  return (
    <CtaBand
      className="border-t"
      heading="Collect every photo from your wedding."
      subhead="Free to start. Your guests need nothing but their phones."
      demoLink
      reveal="none"
    />
  );
}

/* ── the three arcs ──────────────────────────────────────────────────────── */

function Arc({
  shape,
  second,
  type,
}: {
  shape: ArcShape;
  second: SecondShape;
  type: TypeFixture;
}) {
  const body = <SecondBody shape={second} type={type} />;
  const secondIsDark = SECOND_GROUND[second] === "cinema";

  if (shape === "chapter")
    return (
      <>
        <HeroBand type={type} />
        {/* The second beat stays dark whatever ground its own answer chose:
            keeping two openers on cinema before the crossing IS this arc. */}
        {body}
        <TransitionBand type={type} />
        <PaperChapter>
          <PlanningPane type={type} />
        </PaperChapter>
        <ProofBand type={type} />
        <Beat label="Common questions" lines={4} />
        <Close />
      </>
    );

  if (shape === "dark")
    return (
      <>
        <HeroBand type={type} />
        {body}
        <PlanningPane type={type} />
        <ProofBand type={type} />
        <Beat label="Common questions" lines={4} />
        <Close />
      </>
    );

  // today: everything light happens in one chapter directly under the hero.
  return (
    <>
      <HeroBand type={type} />
      {secondIsDark ? body : null}
      <PaperChapter>
        {secondIsDark ? null : body}
        <PlanningPane type={type} />
      </PaperChapter>
      <ProofBand type={type} />
      <Beat label="Common questions" lines={4} />
      <Close />
    </>
  );
}

/** What each arc is made of, read down the rail beside the page. */
export const ARC_BEATS: Record<ArcShape, readonly string[]> = {
  today: ["hero", "paper: the section, then why", "the proof", "FAQ", "close"],
  chapter: [
    "hero",
    "the section, still dark",
    "one photograph, the turn",
    "paper: why",
    "the proof",
    "FAQ",
    "close",
  ],
  dark: ["hero", "the section", "why", "the proof", "FAQ", "close"],
};

export function ArcPreview({
  shape,
  second,
  width,
  type,
}: {
  shape: ArcShape;
  second: SecondShape;
  width: 1440 | 375;
  type: TypeFixture;
}): ReactNode {
  const zoom = width === 1440 ? 0.42 : 0.52;
  return (
    <div className="flex justify-center gap-6 px-6 py-8">
      <ul className="hidden w-[150px] shrink-0 flex-col gap-1 pt-2 sm:flex">
        {ARC_BEATS[shape].map((b, i) => (
          <li key={b} className="text-[11px] text-faint tabular-nums">
            {i + 1}. {b}
          </li>
        ))}
      </ul>
      <div className={cn("overflow-hidden", width === 375 && "mx-auto")}>
        {/* ★ `zoom`, NOT `transform: scale`. A transform leaves the element's
            own box at full size, so the column would need its true height
            written by hand and every option would carry a number that drifts
            the moment a beat changes. `zoom` shrinks the layout box with the
            paint, and because the width is pinned in px the column still lays
            out at 1440 (or 375) with the frame's own viewport breakpoints. */}
        <div style={{ width, zoom } as CSSProperties}>
          <Arc shape={shape} second={second} type={type} />
        </div>
      </div>
    </div>
  );
}

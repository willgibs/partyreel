"use client";

import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { ReelAngleBand } from "@/components/marketing/sections/events/reel-angle-band";
import { InlineReelPlayer } from "@/components/marketing/sections/shared/inline-reel-player";
import { Caption } from "@/components/marketing/system/caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { River } from "@/components/shared/river/river";
import {
  QR_DOOR_FRAMES,
  QR_DOOR_SIZES,
} from "@/components/shared/river/qr-door-frames";
import { Button } from "@/components/ui/button";
import { getEventType } from "@/lib/constants/events";
import { MARKETING_REELS } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { REEL_CLIPS, type TypeFixture } from "./fixtures";
import { Pic, seat } from "./pieces";

/**
 * DECISION 4: THE PROOF.
 *
 * Will picked the demo door as the right content and condemned the drawing in
 * the same line (2026-09-19, verbatim): "This selection makes the most sense,
 * but this section needs a total redesign. All event pages were thrown up as a
 * quick V1 and are nowhere near production grade." And on the same day, about
 * this exact shape elsewhere: "I haven't been liking using a centered mobile
 * portrait video in these sections. It leaves tons of blank space on either
 * side of the reel on desktop. If we're using a portrait, we should fill some
 * of the space to one or both sides. Or we can use landscape videos."
 *
 * Three redesigns answer that sentence three ways, against today measured. Each
 * one carries the demo's promise in `demo-event`'s own recommended words
 * (`doors=named`: the door says what it opens and how full it is), so the two
 * boards do not invent two voices for one door.
 *
 * ★ ONE LIVE ENGINE PER OPTION. `today`, `flanked` and `landscape` are poster
 * first and play nothing until tapped; `door` runs the river and shows the reel
 * as a poster. Nothing here autoplays a video into a capture.
 */
export type ProofShape = "today" | "flanked" | "landscape" | "door";

const PORTRAIT = "hero-candidate-01";
const LANDSCAPE = "hero-candidate-02";

const reelOf = (id: string) => {
  const r = MARKETING_REELS.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown marketing reel id: ${id}`);
  return r;
};

/** demo-event's `named` answer, drawn: what the door opens and how full it is. */
function DemoPromise({
  type,
  className,
}: {
  type: TypeFixture;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div>
        <p className="font-heading text-subsection">{type.door}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Open it and add a photograph. Nothing to sign up for.
        </p>
      </div>
      <Button size="cta" variant="outline" className="shrink-0">
        Explore the demo
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

/* ── today ───────────────────────────────────────────────────────────────── */

/** The shipped band: one portrait player at 300 px in a 1,280 px container, and
 *  a text link to the demo somewhere else on the page. The measurement in the
 *  caption is the complaint, in numbers. */
function TodayProof({ type }: { type: TypeFixture }) {
  const real = getEventType(type.slug);
  return (
    <ReelAngleBand singular={type.singular} angle={real?.reelAngle ?? ""} />
  );
}

/* ── flanked ─────────────────────────────────────────────────────────────── */

/**
 * The portrait keeps the frame the reel is canonically cut in, and the space
 * either side stops being space: it holds the SIX STILLS THE CUT WAS MADE FROM,
 * which is a fact the manifest carries (`hero-candidate-01`'s own recipe lists
 * them). A reader sees the raw material and the result in one row, which is
 * what the section is claiming.
 */
function FlankedProof({ type }: { type: TypeFixture }) {
  const reel = reelOf(PORTRAIT);
  const left = REEL_CLIPS.slice(0, 3);
  const right = REEL_CLIPS.slice(3);
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p
              data-mkt-reveal
              className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase"
              style={seat(0)}
            >
              The highlight reel
            </p>
            <h2
              data-mkt-reveal
              className="mt-4 font-heading text-section text-balance"
              style={seat(1)}
            >
              Every {type.singular} ends with a reel.
            </h2>
          </div>

          <div
            data-mkt-reveal
            className="mt-12 flex items-center justify-center gap-4 lg:gap-8"
            style={seat(2)}
          >
            <div className="hidden flex-1 flex-col gap-4 lg:flex">
              {left.map((id, i) => (
                <Pic
                  key={id}
                  id={id}
                  sizes="240px"
                  className={cn(
                    "aspect-3/2 w-full rounded-xl opacity-60",
                    i === 1 && "ml-8",
                  )}
                />
              ))}
            </div>
            <div className="w-full max-w-[280px] shrink-0 sm:max-w-[320px]">
              <InlineReelPlayer reelId={PORTRAIT} sizes="320px" />
            </div>
            <div className="hidden flex-1 flex-col gap-4 lg:flex">
              {right.map((id, i) => (
                <Pic
                  key={id}
                  id={id}
                  sizes="240px"
                  className={cn(
                    "aspect-3/2 w-full rounded-xl opacity-60",
                    i === 1 && "mr-8",
                  )}
                />
              ))}
            </div>
          </div>

          <Caption
            data-mkt-reveal
            className="mt-5 text-center tabular-nums"
            style={seat(3)}
          >
            A real render, cut from the six frames beside it ·{" "}
            {reel.durationSeconds.toFixed(0)}s
          </Caption>

          <div
            data-mkt-reveal
            className="mx-auto mt-12 max-w-3xl rounded-2xl border bg-card p-6"
            style={seat(4)}
          >
            <DemoPromise type={type} />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ── landscape ───────────────────────────────────────────────────────────── */

/**
 * His other way out of the same sentence: stop using a portrait here. The
 * manifest's landscape render fills the row on its own, the section reads as
 * one wide frame, and the demo door becomes the plate beneath it.
 *
 * ★ THE COST IS NAMED, NOT HIDDEN: a guest watches a reel in portrait, so a
 * landscape band here shows the product in a shape it is not delivered in.
 */
function LandscapeProof({ type }: { type: TypeFixture }) {
  const reel = reelOf(LANDSCAPE);
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p
              data-mkt-reveal
              className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase"
              style={seat(0)}
            >
              The highlight reel
            </p>
            <h2
              data-mkt-reveal
              className="mt-4 font-heading text-section text-balance"
              style={seat(1)}
            >
              Every {type.singular} ends with a reel.
            </h2>
          </div>
          <div
            data-mkt-reveal
            className="mx-auto mt-12 w-full max-w-4xl"
            style={seat(2)}
          >
            <InlineReelPlayer
              reelId={LANDSCAPE}
              sizes="(min-width: 1024px) 896px, 100vw"
            />
            <Caption className="mt-3 text-center tabular-nums">
              A real render · {reel.durationSeconds.toFixed(0)}s
            </Caption>
          </div>
          <div
            data-mkt-reveal
            className="mx-auto mt-10 max-w-4xl rounded-2xl border bg-card p-6"
            style={seat(3)}
          >
            <DemoPromise type={type} />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ── door ────────────────────────────────────────────────────────────────── */

/**
 * The demo stops being a link under the reel and becomes the section: a real
 * door with photographs pouring through it (the ruled river, whose home Will
 * already settled as a card's picture slot), the promise in words beside it,
 * and the reel demoted to the small thing it is on this page, one poster with
 * its own label.
 *
 * It is the largest redesign of the four and the one that stops every event
 * page ending on the same reel, which he named as its own worry: "I don't want
 * every single page to end the same way with the reel. That will feel
 * incredibly repetitive."
 */
function DoorProof({ type }: { type: TypeFixture }) {
  const reel = reelOf(PORTRAIT);
  // Wider than tall: at 1.15 the river filled a column and the words sat in the
  // middle of it with nothing under them. A band gives the flow room across and
  // leaves a solid floor for the promise.
  const DOOR_RATIO = 0.78;
  return (
    <SectionShell
      eyebrow="See one that is real"
      heading={`Open a ${type.singular} that already happened.`}
    >
      <Reveal>
        <div
          data-mkt-reveal
          className="mx-auto mt-12 grid max-w-5xl items-stretch gap-6 lg:grid-cols-12"
          style={seat(2)}
        >
          <div className="lg:col-span-7">
            <div
              className="relative overflow-hidden rounded-2xl border bg-[oklch(0.13_0_0)]"
              style={{ aspectRatio: `1 / ${DOOR_RATIO}` }}
            >
              <River
                className="rvr-ink"
                frames={QR_DOOR_FRAMES}
                ratio={DOOR_RATIO}
                origin={-0.1 * DOOR_RATIO}
                sizes={QR_DOOR_SIZES}
              />
              {/* The floor: half the door, so the promise never sits in the
                  middle of a photograph in flight. */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-linear-to-t from-black from-35% via-black/80 to-transparent p-7 pt-24">
                <p className="font-heading text-page text-balance text-white">
                  {type.door}
                </p>
                <p className="text-sm text-white/75">
                  Open it and add a photograph. Nothing to sign up for.
                </p>
                <Button size="cta" className="mt-2 w-fit">
                  Explore the demo
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="flex h-full flex-col gap-5 rounded-2xl border bg-card p-6">
              <div>
                <p className="font-heading text-subsection">
                  And it ends with a reel.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Every {type.singular} closes with a cut of the night, made
                  from what your guests sent.
                </p>
              </div>
              {/* `flex-1 items-center`: the card stretches to the door beside
                  it, so the reel sits in the middle of what is left rather
                  than leaving a hole under it. */}
              <div className="flex flex-1 items-center gap-4">
                <div className="w-[150px] shrink-0">
                  <InlineReelPlayer reelId={PORTRAIT} sizes="150px" />
                </div>
                <Caption className="tabular-nums">
                  A real render · {reel.durationSeconds.toFixed(0)}s
                </Caption>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}

/* ── the switch ──────────────────────────────────────────────────────────── */

export function ProofPreview({
  shape,
  type,
}: {
  shape: ProofShape;
  type: TypeFixture;
}): ReactNode {
  if (shape === "flanked") return <FlankedProof type={type} />;
  if (shape === "landscape") return <LandscapeProof type={type} />;
  if (shape === "door") return <DoorProof type={type} />;
  return <TodayProof type={type} />;
}

"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

import { InlineReelPlayer } from "@/components/marketing/sections/shared/inline-reel-player";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Caption } from "@/components/marketing/system/caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { River } from "@/components/shared/river/river";
import {
  QR_DOOR_FRAMES,
  QR_DOOR_SIZES,
} from "@/components/shared/river/qr-door-frames";
import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import { MARKETING_REELS } from "@/lib/constants/marketing-media";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

/**
 * THE PROOF: A DOOR WITH PHOTOGRAPHS POURING THROUGH IT, AND THE REEL BESIDE IT.
 *
 * Will ruled `the-proof=door` (2026-09-19, verbatim): "The left side is
 * beautiful with the river, but the real car [card] on the right could use a
 * redesign. Good layout, though. I like the asymmetrical two-column, with demo
 * a bit wider." Behind it, the two sentences the option was built to answer:
 * "this section needs a total redesign", and "I don't want every single page to
 * end the same way with the reel. That will feel incredibly repetitive."
 *
 * So the layout is kept exactly (seven and five, the door wider) and the right
 * column is rebuilt:
 *
 *  - THE BORDERED CARD IS GONE. A 150px player inside a box inside a section is
 *    three frames around one small thing, and it made the reel look like a
 *    thumbnail beside a door. The column now stands on the section's own
 *    ground: a line, the type's own reel angle, the poster as an object with
 *    its own lift, and a door into /reel.
 *  - THE REEL IS THE SECOND OBJECT, NOT THE SECOND HALF. It keeps the portrait
 *    frame a guest actually watches one in, at a size that reads as a phone
 *    rather than as a chip, and the column is centred against the door so the
 *    two sit on one optical line.
 *  - AND THE ANGLE IS THE TYPE'S OWN (`EVENT_TYPES.reelAngle`), so four pages
 *    carrying the same render still say four different things about it.
 *
 * ★ THE PROMISE IS THE SHIPPED SENTENCE, AND IT HAS NO COUNTS. `demo-door.tsx`
 * already says it on /how-it-works: "A real Partyreel album, curated by the
 * host who ran it, open with no sign-up." The board's fixtures promised "128
 * photos from 31 guests" per type, which would have been four different lies
 * about ONE album. The door opens the same demo from every page, so it says the
 * same true thing on every page.
 *
 * ★ NO DEMO CONFIGURED, NO DOOR (the `DemoCtaLink` contract). The river is the
 * demo's own picture, so with the env unset the whole left column goes and the
 * reel takes the section on its own rather than standing next to a dead button.
 *
 * ★ THE RIVER IS DECORATION AND SAYS SO. It is `aria-hidden` inside its own
 * engine and the column's one control is the button, so a keyboard reader meets
 * a heading, a sentence and a link, in that order.
 */

/** The reel the site owns, in the frame a guest watches one in. */
const DOOR_REEL_ID = "hero-candidate-01";

/**
 * Wider than tall. At 1.15 the flow filled a column and the words sat in the
 * middle of it with nothing under them; a band gives the photographs room
 * across and leaves a solid floor for the promise.
 */
const DOOR_RATIO = 0.78;

const PROMISE =
  "A real Partyreel album, curated by the host who ran it, open with no sign-up.";

const seat = (i: number) => ({ "--i": i }) as CSSProperties;

export function EventDoor({
  singular,
  angle,
}: {
  /** The event noun in the headings ("wedding", "trip", "event"). */
  singular: string;
  /** This page's own line about the reel (`EVENT_TYPES.reelAngle`). */
  angle: string;
}) {
  const reel = MARKETING_REELS.find((r) => r.id === DOOR_REEL_ID);
  if (!reel) throw new Error(`Unknown marketing reel id: ${DOOR_REEL_ID}`);

  return (
    <SectionShell
      eyebrow="See one that is real"
      heading={`Open a ${singular} that already happened.`}
      reveal="cinema"
    >
      <Reveal>
        <div
          className={cn(
            "mx-auto mt-14 grid max-w-5xl gap-8 lg:gap-10",
            // Seven and five, the door wider: his layout, kept. With no demo
            // there is no door, so the reel stops pretending to be a column.
            DEMO_EVENT_URL ? "items-center lg:grid-cols-12" : "max-w-xl",
          )}
        >
          {DEMO_EVENT_URL && (
            <div data-mkt-cut style={seat(2)} className="lg:col-span-7">
              {/* ★ THE DOOR IS CAPPED BELOW `lg`, where the grid collapses and
                  it would take the container's whole width. Its ratio is wider
                  than tall by a number the ENGINE reads, so a 760px door is
                  975px of photographs in flight: taller than the viewport it
                  is meant to be one beat of. Capped, a tablet and a phone both
                  meet a door they can see the whole of. */}
              <div
                className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-[oklch(0.13_0_0)] ring-1 ring-white/10 lg:max-w-none"
                style={{ aspectRatio: `1 / ${DOOR_RATIO}` }}
              >
                <River
                  className="rvr-ink"
                  frames={QR_DOOR_FRAMES}
                  ratio={DOOR_RATIO}
                  origin={-0.1 * DOOR_RATIO}
                  sizes={QR_DOOR_SIZES}
                />
                {/* The floor: the bottom third of the door, so the promise
                    never sits in the middle of a photograph in flight. */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 bg-linear-to-t from-black from-30% via-black/80 to-transparent p-6 pt-24 sm:p-8 sm:pt-28">
                  <p className="max-w-md font-heading text-page text-balance text-white">
                    {PROMISE}
                  </p>
                  <Button asChild size="cta" className="mt-1">
                    <Link
                      href="/demo"
                      {...trackAttrs("demo_open", { source: "events-door" })}
                    >
                      Explore the demo
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div
            data-mkt-cut
            style={seat(3)}
            className={cn(
              "flex flex-col gap-5",
              DEMO_EVENT_URL && "lg:col-span-5",
            )}
          >
            <div className="flex flex-col gap-2.5">
              <p className="font-heading text-subsection">
                And it ends with a reel.
              </p>
              <p className="text-sm text-pretty text-muted-foreground">
                {angle}
              </p>
            </div>

            {/* The poster as an OBJECT: no box around it, its own lift, and the
                portrait frame a guest watches one in. Poster-first, so nothing
                here costs a video byte until somebody asks for it. */}
            <div className="flex items-end gap-5">
              <div className="w-[168px] shrink-0 overflow-hidden rounded-[var(--radius-tile)] shadow-lift ring-1 ring-white/10 sm:w-[190px]">
                <InlineReelPlayer reelId={DOOR_REEL_ID} sizes="190px" />
              </div>
              <div className="flex flex-col gap-3 pb-1">
                <Caption className="tabular-nums">
                  A real render · {reel.durationSeconds.toFixed(0)}s
                </Caption>
                <LearnMoreLink href="/reel">See how reels work</LearnMoreLink>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}

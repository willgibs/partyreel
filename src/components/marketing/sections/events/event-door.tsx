"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { requireReel } from "@/components/marketing/sections/shared/inline-reel-player";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { useReelPlayer } from "@/components/marketing/sections/shared/reel-player";
import { DemoDoor } from "@/components/marketing/system/demo-modal/demo-door";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { River } from "@/components/shared/river/river";
import {
  QR_DOOR_FRAMES,
  QR_DOOR_SIZES,
} from "@/components/shared/river/qr-door-frames";
import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import { reelLineFor } from "@/lib/constants/marketing-voice";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

/**
 * THE PROOF: A DOOR WITH PHOTOGRAPHS POURING THROUGH IT, AND THE REEL AS ITS
 * STILL TWIN.
 *
 * The layout is his (`the-proof=door`: "I like the asymmetrical two-column,
 * with demo a bit wider"), seven and five, and the door is the one he called
 * beautiful, its line cut to two (`reel-story` r1 `events=wall`: "only needing
 * shorter copy that reduces it to 2 lines max").
 *
 * ★ THE REEL TAKES THE DOOR'S OWN CARD, AND STAYS STILL (`reel-story` r2
 * `wall=pair`). The same corner, ring, floor and height, so the two read as a
 * designed pair; but "the motion in both cancels each other out, and I prefer
 * the river. Maybe the reel card adds secondary info more statically (maybe a
 * really cool bg image) rather than fighting the river demo card for
 * attention." So the river is the section's only motion: the twin is a strong
 * still (the poster of the film it opens), the type's own line on its floor,
 * and a way to watch that never starts by itself. The press opens the film in
 * the contained player over the page (`../shared/reel-player.tsx`), never a
 * player in the card.
 *
 * ★ THE WORDS ARE THE PAGE'S OWN. The heading is the reel's line with this
 * page's event in it (`reelLineFor`), and the angle is the type's
 * (`EVENT_TYPES.reelAngle`), so four pages showing the same still still say
 * four different things; the link is the one every type page owes /reel.
 *
 * ★ THE PROMISE HAS NO COUNTS. The door opens the same demo from every page,
 * so it says the same true thing on every page; a per-type "N photos from M
 * guests" would be four different lies about ONE album.
 *
 * ★ NO DEMO CONFIGURED, NO DOOR (the `DemoCtaLink` contract). The river is the
 * demo's own picture, so with the env unset the whole left column goes and the
 * twin stands alone at its own shape rather than next to a dead button.
 *
 * ★ THE RIVER IS DECORATION AND SAYS SO. It is `aria-hidden` inside its own
 * engine and the door's one control is the button, so a keyboard reader meets
 * a heading, a sentence and a link, in that order.
 */

/**
 * The film the twin opens, and whose poster it stands on. `hero-candidate-02`
 * is a stand-in render (stock stills, not an event); the still and the film
 * made for these pages replace it by id (docs/ASSETS.md).
 */
const CARD_REEL_ID = "hero-candidate-02";

/**
 * Wider than tall. At 1.15 the flow filled a column and the words sat in the
 * middle of it with nothing under them; a band gives the photographs room
 * across and leaves a solid floor for the promise.
 */
const DOOR_RATIO = 0.78;

/** Two lines at 1440 and at 375 in the door's type (read off the page). */
const PROMISE = "A real album, open with no sign-up.";

/** The pair's shared card: the corner and the ring, capped below `lg`. */
const CARD =
  "relative mx-auto w-full max-w-md overflow-hidden rounded-2xl ring-1 ring-white/10 lg:max-w-none";

/**
 * The pair's shared floor: the bottom of the card, so the words never sit in
 * the middle of a photograph (in flight on the door, still on the twin).
 */
const FLOOR =
  "absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 bg-linear-to-t from-black from-30% via-black/80 to-transparent p-6 pt-24 sm:p-8 sm:pt-28";

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
  const reel = requireReel(CARD_REEL_ID);
  const { open, layer } = useReelPlayer(CARD_REEL_ID);
  const paired = Boolean(DEMO_EVENT_URL);

  return (
    <>
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
              // there is no door, so the twin stops pretending to be a column.
              paired ? "items-center lg:grid-cols-12" : "max-w-xl",
            )}
          >
            {DEMO_EVENT_URL && (
              <div data-mkt-cut style={seat(2)} className="lg:col-span-7">
                {/* ★ THE DOOR IS CAPPED BELOW `lg`, where the grid collapses
                    and it would take the container's whole width. Its ratio is
                    wider than tall by a number the ENGINE reads, so a 760px
                    door is 975px of photographs in flight: taller than the
                    viewport it is meant to be one beat of. Capped, a tablet
                    and a phone both meet a door they can see the whole of. */}
                <div
                  className={cn(CARD, "bg-[oklch(0.13_0_0)]")}
                  style={{ aspectRatio: `1 / ${DOOR_RATIO}` }}
                >
                  <River
                    className="rvr-ink"
                    frames={QR_DOOR_FRAMES}
                    ratio={DOOR_RATIO}
                    origin={-0.1 * DOOR_RATIO}
                    sizes={QR_DOOR_SIZES}
                  />
                  <div className={FLOOR}>
                    <p className="max-w-md font-heading text-page text-balance text-white">
                      {PROMISE}
                    </p>
                    {/* A demo door (`system/demo-modal/`): the demo modal
                        at a desk, the demo in a new tab on a phone. */}
                    <Button asChild size="cta" className="mt-1">
                      <DemoDoor href="/demo" source="events-door">
                        Explore the demo
                      </DemoDoor>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* The twin. At a desk it stretches to the door's height (the
                row's), so the pair shares one top and one floor; below `lg`,
                or alone, it takes a shape of its own under the door. */}
            <div
              data-mkt-cut
              style={seat(3)}
              className={cn(paired && "lg:col-span-5 lg:self-stretch")}
            >
              <div
                data-reel-card=""
                className={cn(
                  CARD,
                  "bg-black",
                  paired
                    ? "aspect-4/5 sm:aspect-square lg:aspect-auto lg:h-full"
                    : "aspect-4/5 sm:aspect-[4/3]",
                )}
              >
                <Image
                  src={reel.poster}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 404px, 448px"
                  className="object-cover"
                />
                <div className={FLOOR}>
                  <p className="max-w-md font-heading text-page text-balance text-white">
                    {reelLineFor(singular)}
                  </p>
                  <p className="max-w-sm text-sm text-pretty text-white/70">
                    {angle}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-3">
                    <Button
                      size="cta"
                      variant="outline"
                      onClick={(e) => open(e.currentTarget)}
                      {...trackAttrs("reel_play", { source: "events-door" })}
                      className="gap-2 border-white/35 bg-white/5 px-5 text-white hover:border-white/50 hover:bg-white/15 hover:text-white"
                    >
                      <Play className="size-4 fill-current" />
                      Watch a reel
                    </Button>
                    <LearnMoreLink
                      href="/reel"
                      className="text-white/85 hover:text-white"
                    >
                      How the reel works
                    </LearnMoreLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </SectionShell>
      {layer}
    </>
  );
}

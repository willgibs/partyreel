"use client";

import "./invite-window.css";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useId } from "react";

import { PROFILE_SETUP_PATH } from "@/app/(app)/account/profile/invite";
import { Button } from "@/components/ui/button";

import { HER_EVENTS, type Party, PRIYA, type Still } from "./fixtures";
import { type Lit, Seam, useHerLight } from "./invite-plate";

/**
 * THE INVITATION'S `window` TAKE: HER EVENTS, WAITING TO SHOW, ON ONE LIT
 * PLATE (redrawn from the creative director's fresh-eyes pass). Her page is
 * paper; the invitation is the one piece of the room it holds, and in its
 * dark: the title first, then her two events' covers as small prints with
 * ONE light falling from them, each captioned "Not shown yet", then the
 * room's own key on to the setup. Her events are the subject; the plate take
 * is the same dark holding light and words alone.
 *
 * ★ WHY THE REDRAW: two open mounts under her head read as an Events section
 * sitting above Your uploads (content, not an invitation); "PRIVATE" in
 * capitals on each print made three locks on one screen, the least inviting
 * word on the most inviting option; and two black mounts and a black key
 * were three dark masses where Aperture asks for one a screen. Now: one dark
 * piece, the title before the prints, and "Not shown yet" with no lock.
 *
 * ★ THE LIGHT IS HERS, READ FROM THESE COVERS, AND THERE IS ONE: the plate
 * take's Seam (`Seam`, its body, glow and lit edge) born at the prints' foot,
 * each cover read on its own (`useHerLight`), its key lighting the half of
 * the edge under it, as production's Seam does ("so the light under the
 * bride is the bride's", `edgeBand`): the wedding's gold under the wedding,
 * the birthday's colour under the birthday, one light along one edge,
 * spent before the captions. On paper nothing of it touches the page.
 *
 * ★ NEVER ALREADY SHOWN: the title and line are conditional, each print says
 * Not shown yet, and the head above says only she can see the page. Nothing
 * here publishes; the one press is the setup, which claims her handle last,
 * at Finish (profiles-social.md).
 */

/** The covers drawn: two at most, the newest first (her events' order). Every event would be a wall. */
const SHOWN_MOST = 2;

/** Each cover as a still the light reads (the stand-ins are 900 by 600; the light reads only `src`). */
const coverOf = (event: Party): Still => ({
  id: event.id,
  src: event.cover,
  ratio: 3 / 2,
});

/**
 * One light from the prints' foot: each cover's key across its own share of
 * the edge's six sixths (three each for two), its fall the same, at the
 * stronger cover's chroma, every pool at full strength (the light under each
 * print is that print's own, never another's fill).
 */
function underEach(reads: readonly Lit[]): Lit {
  const share = 6 / reads.length;
  const run = (hue: number | undefined) =>
    Array.from({ length: share }, () => hue ?? 0);
  return {
    edge: {
      hues: reads.flatMap((read) => run(read.edge.hues[0])),
      c: Math.max(...reads.map((read) => read.edge.c)),
    },
    fall: reads.flatMap((read) => run(read.fall[0])),
    fill: 1,
    from: reads.every((read) => read.from === "photographs")
      ? "photographs"
      : (reads[0]?.from ?? "house"),
  };
}

export function WindowInvite({
  events = HER_EVENTS,
}: {
  /** Her events, the newest first (the board's Photos knob swaps the set). */
  events?: readonly Party[];
}) {
  const title = useId();
  const shown = events.slice(0, SHOWN_MOST);
  const covers = shown.map(coverOf);
  // Each cover read on its own, so its light can stand under it. Unlit until
  // both are read, then the Seam arrives once (`invite-plate.css`).
  const first = useHerLight(covers.slice(0, 1), PRIYA.seed);
  const second = useHerLight(covers.slice(1, 2), PRIYA.seed);
  const reads = covers.length > 1 ? [first, second] : [first];
  const lit = reads.every((read): read is Lit => read !== null)
    ? underEach(reads)
    : null;

  return (
    // Arrives a beat after her head (`ProfileHead` is the first), on the
    // page's own arrival; the light then ignites inside it once it is read.
    <div
      data-arrive
      style={{ "--arrive-i": 1 } as CSSProperties}
      className="mt-6"
    >
      <section
        aria-labelledby={title}
        className="dark amw-plate rounded-2xl text-foreground"
      >
        <div className="amw-words">
          <h2 id={title} className="font-heading text-subsection text-balance">
            Your page, when you&rsquo;re ready
          </h2>
          <p className="mt-1 text-working text-muted-foreground">
            It can show the events you added photos to. Each stays private until
            you pick it.
          </p>
        </div>
        <div
          role="group"
          aria-label="Events your page could show"
          className="amw-events"
        >
          {shown.map((event) => (
            <figure key={event.id} className="amw-event">
              {/* The photograph wears the bright edge, the room's alone (the
                  `dark` variant), as every media surface does. */}
              <div className="amw-photo" data-lit="">
                {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph */}
                <img
                  src={event.cover}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
              </div>
              <figcaption className="amw-caption">
                <span className="truncate text-caption font-medium text-foreground">
                  {event.name}
                </span>
                <span className="text-caption text-muted-foreground">
                  Not shown yet
                </span>
              </figcaption>
            </figure>
          ))}
          <div className="amw-light">
            <Seam lit={lit} />
          </div>
        </div>
        <div className="amw-key">
          <Button asChild size="lg">
            <Link href={PROFILE_SETUP_PATH}>
              Choose what shows
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

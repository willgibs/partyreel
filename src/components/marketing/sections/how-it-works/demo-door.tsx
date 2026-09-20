import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Caption } from "@/components/marketing/system/caption";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { trackAttrs } from "@/lib/analytics/events";
import { marketingImage } from "@/lib/constants/marketing-media";
import { SITE_URL } from "@/lib/constants/site";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

/**
 * THE PROOF: what six steps actually leave you with, and a code that opens one
 * that already happened.
 *
 * ── WHY THE REEL IS NOT HERE ────────────────────────────────────────────────
 *
 * Will, ruling `proof=demo` (2026-09-19): "While this is a great payoff for
 * some pages, I don't want every single page to end the same way with the reel.
 * That will feel incredibly repetitive. Also, I haven't been liking using a
 * centered mobile portrait video in these sections. It leaves tons of blank
 * space on either side of the reel on desktop. If we're using a portrait, we
 * should fill some of the space to one or both sides."
 *
 * So this section makes the album the payoff and the reel a step in the
 * walkthrough above (step six on both sides, with its own picture and its own
 * door to /reel). Nothing here is a 19rem column in the middle of a 1440
 * viewport: photographs run the full width of the band and the code sits ON
 * them, which is the same answer his note asked for and a better one than a
 * portrait video with wings.
 *
 * ── AND WHY THE CODE, ONE SECTION BEFORE A FOOTER THAT HAS ONE ──────────────
 *
 * Three demo affordances close this page: this code, the closing band's line,
 * and the footer's plate. They are a LADDER, not a repeat, and the order is
 * deliberate. Here the demo is the ARGUMENT (a finished album you can hold),
 * scannable off a laptop so the demo opens in a hand while the page stays
 * open; the close offers it as a one-line alternative to signing up; the
 * footer carries it as site chrome on every page. Each is a different object
 * doing a different job, and each is smaller than the one before.
 *
 * ★ THE CODE ENCODES /demo, NEVER THE EVENT LINK (Will, river-card
 * `opens=short`): 25 modules against 33, so the plate can be small and still
 * scan. `/demo` is a 307 to the configured event (src/app/demo/route.ts).
 *
 * ★ NO DEMO CONFIGURED, NO DOOR (the DemoCtaLink contract). With the env
 * unset the album still stands, full width, and the section simply stops
 * promising something it cannot open.
 */

/** The wall's photographs: a slice of the manifest, in the order that keeps
 *  two weddings from landing side by side. */
const BAND = [
  { id: "wedding-golden" },
  { id: "party-balloons" },
  { id: "reception-hall" },
  { id: "festival-crowd" },
  { id: "wedding-toast" },
  { id: "party-dj" },
  { id: "wedding-arch" },
  { id: "concert-confetti" },
];

/**
 * The wall. Four columns above a phone, two below, every tile the same crop,
 * and every other COLUMN dropped by a few pixels.
 *
 * ★ THE OFFSET IS A COLUMN, NOT A TILE. Mixing two aspect ratios in one grid
 * was the first try and it left black holes under every short tile, because a
 * grid row is as tall as its tallest cell; offsetting whole columns by a fixed
 * amount interlocks the top and bottom edges instead, so the wall has a
 * skyline and no gaps. A contact sheet of eight identical squares reads as a
 * component, and an album never does.
 */
function AlbumBand() {
  return (
    <div
      aria-hidden
      data-mkt-cut
      style={{ "--i": 3 } as CSSProperties}
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5"
    >
      {BAND.map(({ id }, i) => {
        const m = marketingImage(id);
        return (
          <span
            key={id}
            className={cn(
              "relative block aspect-[4/5] overflow-hidden rounded-tile ring-1 ring-white/10",
              i % 2 === 1 && "translate-y-4 sm:translate-y-7",
            )}
          >
            <Image
              src={m.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 22vw, 45vw"
              className="object-cover"
            />
          </span>
        );
      })}
    </div>
  );
}

export function DemoDoor() {
  return (
    <SectionShell
      eyebrow="The proof"
      heading="See one that already happened."
      subhead="A real Partyreel album, curated by the host who ran it, open with no sign-up. The same six steps made it."
      reveal="cinema"
      width="wide"
    >
      <div className="mt-14">
        <AlbumBand />
      </div>

      {/* The door UNDER the wall, centred like everything else in the section.
          It sat in a left column beside the photographs for one pass: the
          section's header is centred, so a left-anchored plate put three
          different alignments in one band and left an empty quarter beside the
          heading. Here the argument is the wall and the code is what you do
          about it, in that order. */}
      {DEMO_EVENT_URL && (
        <div
          data-mkt-cut
          style={{ "--i": 4 } as CSSProperties}
          className="mt-10 flex justify-center"
        >
          {/* Scannable off the screen it is drawn on: a host reaches for their
              phone and the demo opens in their hand while this page stays
              where it was. A white plate with a baked quiet zone, because a
              scanner needs both (footer-qr.tsx). */}
          <Link
            href="/demo"
            aria-label="Open the live demo album"
            {...trackAttrs("demo_open", { source: "how-it-works-proof" })}
            className="group flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-5 sm:text-left"
          >
            <span className="rounded-2xl bg-white p-3 ring-1 ring-white/15 transition-transform duration-150 ease-emphasis group-active:scale-[0.98] motion-reduce:transition-none motion-reduce:group-active:scale-100">
              <FooterQr value={`${SITE_URL}/demo`} size={120} />
            </span>
            <span className="flex max-w-xs flex-col gap-1.5">
              <span className="mkt-learn inline-flex items-center gap-1 text-reading font-medium text-foreground">
                Open the demo album
                <LearnChevron />
              </span>
              <Caption>
                <span className="hidden sm:inline">
                  Scan it and the album opens in your hand, exactly the way a
                  guest arrives
                </span>
                <span className="sm:hidden">
                  A real album, exactly the way a guest arrives
                </span>
              </Caption>
            </span>
          </Link>
        </div>
      )}
    </SectionShell>
  );
}

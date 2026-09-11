import Image from "next/image";
import type { CSSProperties } from "react";

import { BrowserFrame } from "@/components/marketing/frames";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";

/**
 * THE PAPER CHAPTER'S OPENER: the host's masthead (Will's second pass,
 * 2026-09-01). Chapter 2 is the morning after, the host's desk, and this
 * section introduces it: a left header a tier up (the home's first
 * left-aligned opener), a host-framed lead, real air, and the album laid on
 * the desk below-right like a print. Product-real chrome over real manifest
 * media (the 2026-08-25 rebalance ruling: the easy media collection co-leads
 * the value, not just the reel). The visual composes BrowserFrame + manifest
 * tiles directly because AlbumFrame / GalleryFrame render fixed placeholder
 * tiles with no media slot.
 *
 * ★ THE STRADDLE CAME OFF THE HOME. For two rounds the card overhung the
 * dark-to-paper cut (a negative top margin, the seam's one signature). Will:
 * the live demo and the album visual sat "very tightly back to back as two
 * huge visuals fighting for attention". So chapter 1 now ends on the live
 * demo with its own air, and this chapter opens on type and air instead of
 * an overhang. The device stays in the vocabulary for other pages' cuts
 * (/about, /help and /blog carry theirs); do not bring it back here.
 *
 * The print is max-w-3xl, not 4xl, on purpose: the live-demo stage one cut
 * above is 896px wide, and a second 896px object right after it recreates the
 * two-visuals problem, only separated. shadow-float is the paper theme's real
 * elevation (a print on the desk); on dark it is zero, so it is unconditional.
 */

const ALBUM_TILE_IDS = [
  "wedding-golden",
  "party-balloons",
  "wedding-toast",
  "festival-crowd",
  "reception-table",
  "party-dj",
  "wedding-petals",
  "concert-confetti",
];

// Host-framed on purpose: chapter 1 already says "nothing to install" and
// "photos land"; this chapter is about what the host does with the album.
const SUBHEAD =
  "Every phone in the room feeds one album, and the album is yours: look through it, tidy it up, and share it when you are ready.";

export function Album() {
  return (
    <SectionShell
      eyebrow="The album"
      heading={SECTION_HEADERS.album.line}
      subhead={SUBHEAD}
      align="left"
      scale="lg"
    >
      {/* ONE CHOREOGRAPHY (R4): the header's three lines hold slots 0-2, the
          pointer lands at 3, and the print closes at 4. */}
      <Reveal>
        <div
          data-mkt-reveal
          className="mt-6"
          style={{ "--i": 3 } as CSSProperties}
        >
          <LearnMoreLink href="/features/album">
            Inside the live album
          </LearnMoreLink>
        </div>
        {/* The print laid on the desk: set below-right under the left masthead
            (the diagonal is the composition). Below lg it runs full width. */}
        <div
          data-mkt-reveal
          className="mt-10 lg:ml-auto lg:max-w-3xl"
          style={{ "--i": 4 } as CSSProperties}
        >
          <AlbumVisual />
        </div>
      </Reveal>
    </SectionShell>
  );
}

function AlbumVisual() {
  return (
    <div aria-hidden>
      <BrowserFrame
        className="shadow-[var(--shadow-float)]"
        label="partyreel.com/a/maya-and-jay"
      >
        <div className="grid grid-cols-4 gap-2">
          {ALBUM_TILE_IDS.map((id) => {
            const m = marketingImage(id);
            return (
              <div
                key={id}
                className="relative aspect-square overflow-hidden rounded-lg"
              >
                <Image
                  src={m.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 180px, 25vw"
                  className="object-cover"
                />
              </div>
            );
          })}
        </div>
      </BrowserFrame>
    </div>
  );
}

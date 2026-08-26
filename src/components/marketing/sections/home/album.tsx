import Image from "next/image";
import type { CSSProperties } from "react";

import { BrowserFrame } from "@/components/marketing/frames";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";

/**
 * MEDIUM (the loud/quiet map): product-real chrome over real manifest media,
 * calm reveals, the collection-depth story (the 2026-08-25 rebalance ruling:
 * the easy media collection co-leads the value, not just the reel). The album
 * visual composes BrowserFrame + manifest tiles directly because AlbumFrame /
 * GalleryFrame render fixed placeholder tiles with no media slot (frames are
 * consumed as-is by contract; the gap is flagged for the orchestrator).
 * The demo CTA recurs here per the IA's cross-cutting demo-link map.
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

const BODY =
  "Every angle of the same moment, from every phone in the room, at full quality. It all lands in one album while the party is still going, nothing to install and nothing to chase.";

export function Album() {
  return (
    <SectionShell>
      <MediaSplit media={<AlbumVisual />} mediaSide="end">
        <Reveal className="flex flex-col gap-3">
          <Eyebrow data-mkt-reveal style={{ "--i": 0 } as CSSProperties}>
            The album
          </Eyebrow>
          <h2
            data-mkt-reveal
            className="font-heading text-3xl text-balance sm:text-4xl"
            style={{ "--i": 1 } as CSSProperties}
          >
            {SECTION_HEADERS.album.line}
          </h2>
          <p
            data-mkt-reveal
            className="text-pretty text-muted-foreground"
            style={{ "--i": 2 } as CSSProperties}
          >
            {BODY}
          </p>
          {/* The ladder pointer (expansion round): this section's depth lives
              at /features/album now; the demo link stays in the hero ticket +
              the CTA bands. */}
          <div data-mkt-reveal style={{ "--i": 3 } as CSSProperties}>
            <LearnMoreLink href="/features/album">
              Inside the live album
            </LearnMoreLink>
          </div>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}

function AlbumVisual() {
  return (
    /* THE STRADDLE (the chapter seam's one signature, lg+): the album card
       overhangs the dark→paper cut so it sits half on the event's dark field,
       half on the morning-after paper — the album arriving out of the event
       into daylight, the chapter doctrine drawn literally. NEGATIVE MARGIN,
       not translate (Will's checkpoint catch): a transform left the layout
       box behind — a phantom gap under the card and the copy centered against
       the untranslated row. The margin genuinely shrinks the grid row, so the
       card's box overhangs the chapter top for real and items-center centers
       the copy against what's visible. relative+z keep it painting over the
       dark section it overhangs. shadow-float is the light theme's real
       elevation, which the paper chapter restores — over the dark field it
       reads as a print laid on the desk. Below lg the split stacks and the
       plain hard cut carries the seam. */
    <div aria-hidden className="relative z-10 lg:-mt-40">
      <BrowserFrame
        className="lg:shadow-[var(--shadow-float)]"
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
                  sizes="(min-width: 1024px) 170px, 25vw"
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

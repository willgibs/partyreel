import Image from "next/image";
import type { CSSProperties } from "react";

import { BrowserFrame } from "@/components/marketing/frames";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
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
          <div data-mkt-reveal style={{ "--i": 3 } as CSSProperties}>
            <DemoCtaLink />
          </div>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}

function AlbumVisual() {
  return (
    <div aria-hidden>
      <BrowserFrame label="partyreel.com/a/maya-and-jay">
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

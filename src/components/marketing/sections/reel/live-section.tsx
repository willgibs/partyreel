import { QrCode } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { BrowserFrame } from "@/components/marketing/frames/browser-frame";
import {
  EVENT_NAME,
  EVENT_URL,
} from "@/components/marketing/sections/how-it-works/picture-parts";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";

import { LiveTile } from "./live-tile";

/**
 * /reel chapter one, THE LIVE REEL (`reel-story` r1 `arc=live-first`: the reel,
 * then the screen, then the clip; the party, then the morning after). It opens
 * on the fact that needs no action: the album plays as its own reel from the
 * second photo, at the top of the album, taking uploads as they land.
 *
 * The picture is the album on a laptop, not a phone: a portrait object centred
 * in a wide column leaves the blank sides Will named twice, and the tile's real
 * shape at a desk is the 21:9 it wears above the album there. The tile is the
 * app's own (live-tile.tsx); the album under it is the site's one fictional
 * event, cropped by the frame the way a first screen crops it.
 */
const ALBUM_TILES = [
  "reception-table",
  "wedding-petals",
  "party-dj",
  "wedding-rings",
  "concert-confetti",
  "wedding-arch",
  "reception-hall",
  "festival-lights",
];

export function LiveSection() {
  // The standard stagger, hand-marked because the header lives inside the
  // split (the guest-share section's grammar, kept when it retired).
  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <SectionShell id="live">
      <MediaSplit
        mediaSide="end"
        media={
          <div aria-hidden>
            <BrowserFrame
              label={
                <>
                  <QrCode className="size-3" />
                  {EVENT_URL}
                </>
              }
            >
              <div className="relative max-h-[26rem] overflow-hidden rounded-xl bg-background p-3 sm:max-h-[30rem] sm:p-4">
                <p className="truncate text-sm font-medium">{EVENT_NAME}</p>
                <div className="mt-3">
                  <LiveTile />
                </div>
                <div className="mt-2 grid grid-cols-4 gap-[var(--gap-gallery)]">
                  {ALBUM_TILES.map((id) => (
                    <span
                      key={id}
                      className="relative block aspect-square overflow-hidden rounded-tile"
                    >
                      <Image
                        src={marketingImage(id).src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 160px, 22vw"
                        className="object-cover"
                      />
                    </span>
                  ))}
                </div>
                {/* The album runs on below the fold; the fade says so. */}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-background to-transparent" />
              </div>
            </BrowserFrame>
          </div>
        }
      >
        <Reveal className="flex flex-col gap-4">
          <Eyebrow {...rise(0)}>The live reel</Eyebrow>
          <h2 {...rise(1)} className="font-heading text-section text-balance">
            It starts at the second photo.
          </h2>
          <p {...rise(2)} className="text-pretty text-muted-foreground">
            Every album plays as its own highlight reel: a looping montage of
            whatever guests can see, at the top of the album on every phone.
            Each upload joins it as it lands, and anything you hide drops out.
          </p>
          <p {...rise(3)} className="text-pretty text-muted-foreground">
            Nobody makes it and nobody waits for it: there is no draft, no
            render and no file. You set the look and the pace everyone starts
            on, and anyone watching can pick their own without touching anyone
            else’s.
          </p>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}

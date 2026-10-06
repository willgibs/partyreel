import { ImageUp, Play, QrCode } from "lucide-react";
import Image, { getImageProps } from "next/image";
import type { CSSProperties } from "react";

import {
  AlbumCover,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { BrowserFrame } from "@/components/marketing/frames/browser-frame";
import {
  EVENT_NAME,
  EVENT_URL,
} from "@/components/marketing/sections/how-it-works/picture-parts";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * /reel chapter one, THE LIVE REEL (`reel-story` r1 `arc=live-first`: the reel,
 * then the screen, then the clip; the party, then the morning after). It opens
 * on the fact that needs no action: the album plays as its own reel from the
 * second photo, taking uploads as they land.
 *
 * The picture is the album on a laptop, not a phone: a portrait object centred
 * in a wide column leaves the blank sides Will named twice. Its head is the
 * album's own cover (`event-experience-head.tsx`'s `AlbumCover` over
 * `HeadStills`, production's parts, not a copy): the reel's photographs
 * dissolving under the event's name, and on it the cover's round that opens
 * the reel (event-experience.tsx's "Watch the highlight reel", pinned by
 * mock-parity), lit with a slow halo because it is the door this chapter is
 * about. The album under it is the site's one fictional event, cropped by the
 * frame the way a first screen crops it. ★ The cover was the retired reel
 * tile's place (`event-header` r1, `guest=cover`), and this picture drew that
 * tile until retired-mocks.
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

/** The reel's opening, which the cover dissolves through (a cover shows the reel's own first pass). */
const COVER_STILLS = [
  "wedding-golden",
  "party-balloons",
  "festival-crowd",
  "wedding-toast",
].map((id) => {
  const still = marketingImage(id);
  // The optimizer's copy at the frame's width: the cover stands under 700px in the column.
  const { src } = getImageProps({
    src: still.src,
    width: 640,
    height: Math.round((640 * still.height) / still.width),
    alt: "",
  }).props;
  return { id, tile: src };
});

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
              <div className="relative max-h-[28rem] overflow-hidden bg-background sm:max-h-[32rem]">
                <AlbumCover
                  // A laptop's screen drawn small: the name a step down the ladder from the page title it is at
                  // full size (the frame is under half the window), the cover a band rather than the screen.
                  className="h-64 sm:h-72 [&_h1]:text-page"
                  ground={<HeadStills stills={COVER_STILLS} />}
                  name={EVENT_NAME}
                  host={{ name: "Maya", avatarUrl: null, seed: "maya" }}
                  date="2026-06-13"
                  description={null}
                  mediaCount={128}
                  mediaKinds={{ photos: 119, videos: 9 }}
                  guestCount={23}
                  actions={
                    <>
                      <Button
                        type="button"
                        variant="on-photo"
                        size="cta"
                        tabIndex={-1}
                        className="min-w-0 flex-1 md:flex-none"
                      >
                        <ImageUp /> Add photos
                      </Button>
                      <span className="relative flex">
                        {/* The door this chapter is about: a slow halo, still under reduced motion. */}
                        <span className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-white/70 motion-safe:animate-pulse" />
                        <Button
                          type="button"
                          variant="glass"
                          size="icon-cta"
                          tabIndex={-1}
                          title="Watch the highlight reel"
                        >
                          <Play className="fill-current" />
                        </Button>
                      </span>
                      <Button
                        type="button"
                        variant="glass"
                        size="icon-cta"
                        tabIndex={-1}
                        title="Invite"
                      >
                        <QrCode />
                      </Button>
                    </>
                  }
                />
                <div className="grid grid-cols-4 gap-[var(--gap-gallery)] p-3 sm:p-4">
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

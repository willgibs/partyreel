import Image from "next/image";
import type { CSSProperties } from "react";

import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * /features/guests section 2: the credited album, up close. A lightbox-style
 * frame (one shot large, the attribution chip under it, the way the real
 * lightbox captions a photo with its uploader's display name) beside the
 * attribution truth: names are public in the album, the verified email behind
 * an upload stays with the host.
 */

export function CreditedAlbum() {
  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  const photo = marketingImage("wedding-toast");

  return (
    <SectionShell>
      <MediaSplit
        mediaSide="end"
        media={
          <Reveal
            aria-hidden
            data-mkt-reveal
            className="mx-auto w-full max-w-xl"
            style={{ "--i": 0 } as CSSProperties}
          >
            <div className="relative overflow-hidden rounded-2xl border ring-1 ring-foreground/5">
              <div className="relative aspect-[3/2]">
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 640px, 92vw"
                  className="object-cover"
                />
              </div>
              {/* The real attribution pill's shape: a floating capsule, bare
                  display name over the "1 of N" position counter. */}
              <div className="absolute inset-x-0 bottom-4 flex justify-center">
                <div className="flex flex-col items-center gap-0.5 rounded-full bg-black/55 px-3.5 py-1.5 text-center backdrop-blur-sm">
                  <span className="text-[11px] leading-4 font-medium text-white/90">
                    Maya
                  </span>
                  <span className="text-[10px] leading-3 text-white/60">
                    1 of 128
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        }
      >
        <Reveal className="flex flex-col gap-4">
          <Eyebrow {...rise(0)}>Every shot credited</Eyebrow>
          <h2
            {...rise(1)}
            className="font-heading text-3xl text-balance sm:text-4xl"
          >
            Names ride with the photos.
          </h2>
          <p {...rise(2)} className="text-pretty text-muted-foreground">
            Signed-in guests pick a display name once, and it travels with
            everything they add: on the tiles, in the lightbox, all through the
            album. No more mystery folders of somebody&rsquo;s cousin&rsquo;s
            shots.
          </p>
          <p {...rise(3)} className="text-pretty text-muted-foreground">
            With accounts required (the default for new events), every upload
            traces back to a verified guest email. The name is what the room
            sees; the email stays with you, the host.
          </p>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}

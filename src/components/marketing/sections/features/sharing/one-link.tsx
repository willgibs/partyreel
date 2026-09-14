import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * Sharing page section 2 (dark): the album experience for everyone with the
 * link. The visual is a lightbox mock (full-screen media on the dark canvas,
 * swipe chevrons, the guest Save action); the copy absorbs the FEATURE_GROUPS
 * share group and routes "the same link the QR carried" to /features/qr.
 */

function LightboxMock() {
  const media = marketingImage("wedding-arch");
  return (
    <div
      aria-hidden
      className="relative overflow-hidden rounded-2xl border bg-black ring-1 ring-foreground/10"
    >
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={media.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 640px, 92vw"
          className="object-cover"
        />
      </div>
      {/* The viewer chrome: counter, close, swipe, save. */}
      <span className="absolute top-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-xs text-white/85 tabular-nums backdrop-blur">
        34 / 200
      </span>
      <span className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/45 text-white/85 backdrop-blur">
        <X className="size-4" />
      </span>
      <span className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
        <ChevronLeft className="size-5" />
      </span>
      <span className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
        <ChevronRight className="size-5" />
      </span>
      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
        <Download className="size-3.5" /> Save
      </span>
    </div>
  );
}

export function OneLink() {
  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <SectionShell>
      {/* R4 / review B14: the copy ran ~200px shorter than the lightbox and sat
          vertically centred, leaving a dead bottom-right quadrant. Same top
          line for both columns, plus a third proof line under the Save control
          the mock is showing. */}
      <MediaSplit className="lg:items-start" media={<LightboxMock />}>
        <Reveal className="flex flex-col gap-4">
          <Eyebrow {...rise(0)}>One link</Eyebrow>
          <h2
            {...rise(1)}
            className="font-heading text-3xl text-balance sm:text-4xl"
          >
            One link, the whole event.
          </h2>
          <p {...rise(2)} className="text-pretty text-muted-foreground">
            There&rsquo;s no second export to send around. The link your QR
            carried during the event is the album afterward, and everyone who
            has it is already in.
          </p>
          <p {...rise(3)} className="text-pretty text-muted-foreground">
            Media first, on a clean, dark canvas: tap any shot to fill the
            screen, swipe to the next, and save the ones you love as you go.
          </p>
          <p {...rise(4)} className="text-pretty text-muted-foreground">
            Save hands back the file that was uploaded, at the resolution it
            arrived at. There is no screen-sized copy anywhere in the album.
          </p>
          <div {...rise(5)}>
            <LearnMoreLink href="/features/qr">
              Where the link begins
            </LearnMoreLink>
          </div>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}

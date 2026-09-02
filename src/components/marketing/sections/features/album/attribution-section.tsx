import { ChevronLeft, ChevronRight, Download, Info, X } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * NAMES ON EVERY SHOT: who a photo came from, and where the album says so.
 * The name lives in the LIGHTBOX (the attribution pill in
 * src/components/shared/media-lightbox.tsx), never on a tile, so the mock is
 * a lightbox with the pill in its three real states: a display name, the
 * host's own uploads with their Host badge, and Anonymous with its (i). The
 * facts answer the questions behind it: where a name comes from (a free
 * account, picked once), what happens without one, and what a guest can do
 * about their own upload later.
 */

const STATES: { name: string; badge?: string; info?: boolean }[] = [
  { name: "Maya" },
  { name: "Jay", badge: "Host" },
  { name: "Anonymous", info: true },
];

export function AttributionSection() {
  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });
  const photo = marketingImage("wedding-arch");

  return (
    <SectionShell>
      <MediaSplit
        className="lg:items-center"
        media={
          <Reveal
            aria-hidden
            data-mkt-reveal
            className="mx-auto w-full max-w-xl"
            style={{ "--i": 0 } as CSSProperties}
          >
            <div className="relative overflow-hidden rounded-2xl border bg-black ring-1 ring-foreground/10">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 640px, 92vw"
                  className="object-cover"
                />
              </div>
              <span className="absolute top-3 left-3 rounded-full bg-black/45 px-2.5 py-1 font-mono text-xs text-white/85 tabular-nums">
                34 / 200
              </span>
              <span className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/45 text-white/85">
                <X className="size-4" />
              </span>
              <span className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white">
                <ChevronLeft className="size-5" />
              </span>
              <span className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white">
                <ChevronRight className="size-5" />
              </span>
              <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-medium text-white">
                <Download className="size-3.5" /> Save
              </span>
              {/* The attribution pill, its three states stacked so the
                  reader sees all of them at once. */}
              <div className="absolute bottom-3 left-3 flex flex-col items-start gap-1.5">
                {STATES.map((s) => (
                  <span
                    key={s.name}
                    className="flex items-center gap-1.5 rounded-2xl bg-black/55 px-3 py-1.5 text-[11px] leading-4 font-medium text-white/90"
                  >
                    {s.name}
                    {s.badge && (
                      <span className="rounded-full bg-white/20 px-1.5 text-[9px] tracking-wide uppercase">
                        {s.badge}
                      </span>
                    )}
                    {s.info && <Info className="size-3 text-white/60" />}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        }
      >
        <Reveal className="flex flex-col gap-4">
          <Eyebrow {...rise(0)}>Names</Eyebrow>
          <h2
            {...rise(1)}
            className="font-heading text-3xl text-balance sm:text-4xl"
          >
            Every shot says who took it.
          </h2>
          <p {...rise(2)} className="max-w-md text-pretty text-muted-foreground">
            Open any photo and the name is right there. Guests pick a display
            name once, with their free account, and it rides on everything
            they add.
          </p>
          <p {...rise(3)} className="max-w-md text-pretty text-muted-foreground">
            Allow anonymous uploads and those show as Anonymous. Your own carry
            a Host badge. A guest who signs in later on the same phone claims
            what they added before.
          </p>
          <p {...rise(4)} className="max-w-md text-pretty text-muted-foreground">
            A signed-in guest can delete their own upload from their dashboard,
            and it leaves the album at once. You can remove anything, any time.
          </p>
          <div {...rise(5)}>
            <LearnMoreLink href="/features/guests">
              Guests, profiles, and the guest list
            </LearnMoreLink>
          </div>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}

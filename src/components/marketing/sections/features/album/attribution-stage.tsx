"use client";

import { ChevronLeft, ChevronRight, Download, Info, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

import { TextSwap } from "@/components/marketing/sections/features/shared/text-swap";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { marketingImage } from "@/lib/constants/marketing-media";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import { NAMES } from "./album-copy";

/**
 * NAMES, as one object: the lightbox with ONE attribution pill cycling its
 * three real states (a display name; the host's own with the Host badge;
 * Anonymous with its info mark), and the index beside it whose active row
 * follows the pill, the same gutter-bar grammar as getting-in so the page's
 * two media-splits rhyme. The pill's anatomy is the app's (src/components/
 * shared/media-lightbox.tsx): name, then "34 of 200" inside the pill in a
 * quieter white, tabular. Reduced motion pins the first state.
 */

const STATES = [
  { name: "Maya", badge: false, info: false },
  { name: "Jay", badge: true, info: false },
  { name: "Anonymous", badge: false, info: true },
] as const;

const HOLD_MS = 2800;

export function AttributionStage() {
  const reduced = usePrefersReducedMotion();
  const { ref, paused } = useAmbientPause<HTMLDivElement>();
  const [tick, setTick] = useState(0);
  const [pinned, setPinned] = useState<number | null>(null);
  const state = reduced ? 0 : (pinned ?? tick % STATES.length);
  const current = STATES[state];

  useEffect(() => {
    if (paused || reduced || pinned !== null) return;
    const id = setTimeout(() => setTick((n) => n + 1), HOLD_MS);
    return () => clearTimeout(id);
  }, [paused, reduced, pinned, tick]);

  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });
  const photo = marketingImage("wedding-arch");

  return (
    <Reveal>
      <div ref={ref}>
        <MediaSplit
          className="lg:items-center"
          media={
            <div aria-hidden {...rise(0)} className="mx-auto w-full max-w-xl">
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
                {/* THE PILL, the app's anatomy: name, badge or mark, the
                    position in a quieter white inside the same capsule. */}
                <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[11px] leading-4 font-medium text-white/90">
                  <span className="inline-flex items-center gap-1.5">
                    <TextSwap value={current.name} />
                    {current.badge && (
                      <span className="inline-flex h-4 items-center rounded-4xl bg-white/20 px-1.5 text-[10px] font-medium">
                        Host
                      </span>
                    )}
                    {current.info && <Info className="size-3 text-white/60" />}
                  </span>
                  <span className="text-white/60 tabular-nums">34 of 200</span>
                </span>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <Eyebrow {...rise(0)}>Names</Eyebrow>
            <h2
              {...rise(1)}
              className="font-heading text-section text-balance"
            >
              Every shot says who took it.
            </h2>
            <p
              {...rise(2)}
              className="max-w-lg text-pretty text-muted-foreground"
            >
              {NAMES.lead}
            </p>
            <ol
              aria-label="What the name shows"
              className="mt-2 border-t"
              onMouseLeave={() => setPinned(null)}
            >
              {NAMES.states.map((row, i) => {
                const active = state === i;
                return (
                  <li
                    key={row.title}
                    {...rise(3 + i)}
                    onMouseEnter={() => setPinned(i)}
                    className={cn(
                      "relative grid grid-cols-[7.5rem_1fr] gap-x-4 border-b py-3.5 transition-colors duration-150",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-2.5 bottom-2.5 -left-3 w-0.5 rounded-full bg-foreground transition-opacity duration-150 ease-emphasis sm:-left-4",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="font-heading text-base text-foreground">
                      {row.title}
                    </span>
                    <span className="text-sm leading-relaxed">{row.body}</span>
                  </li>
                );
              })}
            </ol>
            <div {...rise(6)}>
              <LearnMoreLink href="/features/guests">
                Guests, profiles, and the guest list
              </LearnMoreLink>
            </div>
          </div>
        </MediaSplit>
      </div>
    </Reveal>
  );
}

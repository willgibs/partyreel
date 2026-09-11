"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import { GETTING_IN } from "./album-copy";
import { ENTRY_SCREENS, EntryPhone, type EntryScreen } from "./entry-phone";

/**
 * GETTING IN, as one object: the phone and its INDEX. The three facts beside
 * the phone are the three screens it cycles, so they are one ruled list whose
 * active row follows the phone (an ink gutter bar), and pointing at a row pins
 * that screen. The clock is a chained timeout on useAmbientPause (halts
 * off-screen, never bursts); reduced motion pins the welcome screen, the one
 * that carries the words. Hover-gated so a touch tap never strands the phone.
 */

const HOLD_MS = 3200;

export function GettingInStage() {
  const reduced = usePrefersReducedMotion();
  const { ref, paused } = useAmbientPause<HTMLDivElement>();
  const [tick, setTick] = useState(0);
  const [pinned, setPinned] = useState<EntryScreen | null>(null);

  const screen: EntryScreen = reduced
    ? 1
    : (pinned ?? ((tick % ENTRY_SCREENS.length) as EntryScreen));

  useEffect(() => {
    if (paused || reduced || pinned !== null) return;
    const id = setTimeout(() => setTick((n) => n + 1), HOLD_MS);
    return () => clearTimeout(id);
  }, [paused, reduced, pinned, tick]);

  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <Reveal>
      <div ref={ref}>
        <MediaSplit
          className="lg:items-center"
          mediaSide="end"
          media={
            <div {...rise(0)} className="w-full">
              <EntryPhone screen={screen} />
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <Eyebrow {...rise(0)}>Getting in</Eyebrow>
            <h2
              {...rise(1)}
              className="font-heading text-3xl text-balance sm:text-4xl"
            >
              Scan, and they&rsquo;re in.
            </h2>
            <p
              {...rise(2)}
              className="max-w-lg text-pretty text-muted-foreground"
            >
              {GETTING_IN.subhead}
            </p>

            {/* The index: one ruled list, the active row marked in ink. */}
            <ol
              aria-label="What a guest sees"
              className="mt-2 border-t"
              onMouseLeave={() => setPinned(null)}
            >
              {GETTING_IN.facts.map((fact, i) => {
                const active = screen === i;
                return (
                  <li
                    key={fact.title}
                    {...rise(3 + i)}
                    onMouseEnter={() => setPinned(i as EntryScreen)}
                    className={cn(
                      "relative grid grid-cols-[2rem_1fr] gap-x-3 border-b py-4 transition-colors duration-150",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-3 bottom-3 -left-3 w-0.5 rounded-full bg-foreground transition-opacity duration-150 ease-emphasis sm:-left-4",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="pt-0.5 text-xs font-medium text-muted-foreground/70 tabular-nums">
                      0{i + 1}
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="font-heading text-base text-foreground">
                        {fact.title}
                      </span>
                      <span className="text-sm leading-relaxed text-pretty">
                        {fact.body}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
            <div {...rise(6)}>
              <LearnMoreLink href="/features/qr">
                Inside the QR code
              </LearnMoreLink>
            </div>
          </div>
        </MediaSplit>
      </div>
    </Reveal>
  );
}

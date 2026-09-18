"use client";

import { useEffect, useState } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { GETTING_IN } from "@/components/marketing/sections/features/album/album-copy";
import {
  ENTRY_SCREENS,
  EntryPhone,
  type EntryScreen,
} from "@/components/marketing/sections/features/album/entry-phone";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * DECISION 4: THE PHONE'S SCREEN CYCLE, a copy of getting-in-stage.tsx with
 * ONE change: the hold is a prop (`holdMs`) instead of the hard-coded 3200,
 * which production has no room for (the constant is module-private, and this
 * board is exactly the thing that gets to retune it). Everything else —
 * `EntryPhone`, the copy, the hover-pins-a-screen index — is the shipped
 * component, imported.
 *
 * `Reveal` and `useAmbientPause` are dropped: this board is a side-by-side
 * comparison ("the lab deliberately never paused", frame.tsx), not a
 * scroll-triggered page, and this file exists to judge the CYCLE, not the
 * entrance. Reduced motion still pins the welcome screen, the one that
 * carries the words, exactly as production does.
 */
export function GettingInPace({ holdMs }: { holdMs: number }) {
  const reduced = usePrefersReducedMotion();
  const [tick, setTick] = useState(0);
  const [pinned, setPinned] = useState<EntryScreen | null>(null);

  const screen: EntryScreen = reduced
    ? 1
    : (pinned ?? ((tick % ENTRY_SCREENS.length) as EntryScreen));

  useEffect(() => {
    if (reduced || pinned !== null) return;
    const id = setTimeout(() => setTick((n) => n + 1), holdMs);
    return () => clearTimeout(id);
  }, [reduced, pinned, tick, holdMs]);

  return (
    // GettingInSection sits before the album page's first PaperChapter, in
    // the cinema route group's forced-dark default — forced here too, never
    // left to the lab's own ambient theme (see chart-cast.tsx's note).
    // `data-mkt`/`data-mkt-skin` scope the marketing grammar (album-page's
    // and privacy-hero's own board copies carry the same pair); the click
    // guard makes a press inside the preview looking, never leaving.
    <div
      className="dark bg-background text-foreground"
      data-mkt=""
      data-mkt-skin="cinema"
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest?.("a[href]")) e.preventDefault();
      }}
    >
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6">
        <MediaSplit
          className="lg:items-center"
          mediaSide="end"
          media={
            <div className="w-full">
              <EntryPhone screen={screen} />
              {/* A visible number and bar, not decoration: reduced motion (what
                the board's own still capture forces) pins every option on the
                same welcome screen, so the pace itself has to be legible
                without waiting for the cycle to run. The bar's length is the
                hold relative to today's 3.2s, so the three options read apart
                at a glance even standing still. */}
              <div className="mx-auto mt-4 flex w-48 flex-col items-center gap-2">
                <p className="font-heading text-2xl tabular-nums">
                  {(holdMs / 1000).toFixed(2)}s
                </p>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: `${Math.round((holdMs / 3200) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">a screen holds</p>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <Eyebrow>Getting in</Eyebrow>
            <h2 className="font-heading text-section text-balance">
              Scan, and they&rsquo;re in.
            </h2>
            <p className="max-w-lg text-pretty text-muted-foreground">
              {GETTING_IN.subhead}
            </p>

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
                    <span className="pt-0.5 text-xs font-medium text-faint tabular-nums">
                      0{i + 1}
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="font-heading text-subsection text-foreground">
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
            <div>
              <LearnMoreLink href="/features/qr">
                Inside the QR code
              </LearnMoreLink>
            </div>
          </div>
        </MediaSplit>
      </div>
    </div>
  );
}

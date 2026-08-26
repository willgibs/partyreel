"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

import { BrowserFrame } from "@/components/marketing/frames";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

/**
 * /features/album section 3: live-during-the-event (the doorbell story). A
 * gallery mock where the newest slot quietly turns over every few beats with a
 * "Just added" chip re-popping, under a LiveDot success ping ("Filling live
 * right now", the live-demo status line's calmer cousin in the album's own
 * module). The cycle is a loop, so it rides useAmbientPause (halts off-screen /
 * hidden / reduced); reduced motion shows a static grid.
 */

/** The steady grid: eight settled shots; the ninth slot is the live one. */
const SETTLED_IDS = [
  "wedding-golden",
  "reception-table",
  "party-balloons",
  "wedding-rings",
  "party-dj",
  "reception-hall",
  "festival-crowd",
  "wedding-arch",
];

/** What rotates through the newest slot, with its arrival attribution. */
const INCOMING: { id: string; by: string }[] = [
  { id: "wedding-toast", by: "Maya" },
  { id: "concert-confetti", by: "Jay" },
  { id: "festival-lights", by: "Priya" },
];

const TURN_EVERY_MS = 3200;

export function LiveSection() {
  const reduced = usePrefersReducedMotion();
  const { ref: stageRef, paused } = useAmbientPause<HTMLDivElement>();
  const [turn, setTurn] = useState(0);

  useEffect(() => {
    if (paused || reduced) return;
    const t = setInterval(() => setTurn((n) => n + 1), TURN_EVERY_MS);
    return () => clearInterval(t);
  }, [paused, reduced]);

  const incoming = INCOMING[turn % INCOMING.length];

  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <SectionShell>
      <MediaSplit
        media={
          /* The Reveal wrapper supplies the [data-inview] ancestor the chip's
             keyed mkt-cut re-pop rides on (and reveals the frame itself). */
          <Reveal
            data-mkt-reveal
            className="mx-auto w-full max-w-xl"
            style={{ "--i": 0 } as CSSProperties}
          >
            <div ref={stageRef}>
              <BrowserFrame label="partyreel.com/a/maya-and-jay">
                <div className="grid grid-cols-3 gap-1.5">
                  {SETTLED_IDS.map((id) => {
                    const m = marketingImage(id);
                    return (
                      <div
                        key={id}
                        className="relative aspect-square overflow-hidden rounded-[4px]"
                      >
                        <Image
                          src={m.src}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 190px, 30vw"
                          className="object-cover"
                        />
                      </div>
                    );
                  })}
                  {/* The live slot: all three incoming shots stay MOUNTED and
                    crossfade on the turn (a remount re-fetched the image and
                    flashed black mid-cycle); only the chip remounts, riding
                    the mkt-cut animation for its re-pop. */}
                  <div className="relative aspect-square overflow-hidden rounded-[4px]">
                    {INCOMING.map((inc, i) => (
                      <Image
                        key={inc.id}
                        src={marketingImage(inc.id).src}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 190px, 30vw"
                        className={`object-cover transition-opacity duration-500 ${
                          i === turn % INCOMING.length
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                    ))}
                    <span
                      key={turn}
                      data-mkt-cut
                      className="absolute bottom-1 left-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] leading-4 font-medium text-white backdrop-blur-sm"
                      style={{ "--i": 0 } as CSSProperties}
                    >
                      Just added · {incoming.by}
                    </span>
                  </div>
                </div>
              </BrowserFrame>
              <div className="mt-3 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                  <LiveDot paused={paused} />
                  Filling live right now
                </span>
              </div>
            </div>
          </Reveal>
        }
      >
        <Reveal className="flex flex-col gap-4">
          <Eyebrow {...rise(0)}>During the event</Eyebrow>
          <h2
            {...rise(1)}
            className="font-heading text-3xl text-balance sm:text-4xl"
          >
            Watch it fill from the head table.
          </h2>
          <p {...rise(2)} className="text-pretty text-muted-foreground">
            Uploads appear for everyone the moment they land, no refresh needed.
            Leave the album open on a phone between the glasses, or up on the
            venue screen, and the party watches itself arrive.
          </p>
          <p {...rise(3)} className="text-pretty text-muted-foreground">
            Guests keep adding as the night goes on, and the newest shots are
            always at the top when you look.
          </p>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}

/** --success stays the dot's color: feedback state, not decoration. The ping is
 *  an infinite loop, so it honors the ambient pause by unmounting. */
function LiveDot({ paused }: { paused: boolean }) {
  return (
    <span className="relative flex size-2">
      {!paused && (
        <span className="absolute inset-0 animate-ping rounded-full bg-success/60 motion-reduce:hidden" />
      )}
      <span className="relative size-2 rounded-full bg-success" />
    </span>
  );
}

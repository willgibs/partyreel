"use client";

import { RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import { BrowserFrame } from "@/components/marketing/frames";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Reveal } from "@/components/marketing/system/reveal";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

/**
 * /features/album hero: the stub grammar over THE ARRIVALS STREAM, the album's
 * own calmer cousin of the home live-demo (same [data-mkt-fly]/[data-mkt-toast]
 * vocabulary, no QR/phone stage): a masonry album visibly FILLING, one tile at
 * a time, with attribution chips landing on the shots and arrival toasts in the
 * corner. The fill interval gates on useAmbientPause (it starts when the stage
 * is actually seen, halts off-screen/hidden, resumes where it left off), reduced
 * motion jumps straight to the full album, and Replay clears data-on so the
 * whole stream re-runs. Fixtures are manifest images + the Maya & Jay demo
 * family's art-directed display names, no real PII.
 */

const LAND_EVERY_MS = 420;

/** Masonry tiles (three CSS columns, varied heights) in landing order; `by` is
 *  the attribution chip some shots carry (the credited-album truth made
 *  visible: display names, and "Anonymous" where the host allows it). */
const TILES: { id: string; h: string; by?: string }[] = [
  { id: "wedding-golden", h: "h-28", by: "Maya" },
  { id: "reception-table", h: "h-36" },
  { id: "party-balloons", h: "h-24", by: "Priya" },
  { id: "concert-confetti", h: "h-32" },
  { id: "wedding-rings", h: "h-24", by: "Jay" },
  { id: "reception-hall", h: "h-36" },
  { id: "party-dj", h: "h-28", by: "Anonymous" },
  { id: "wedding-toast", h: "h-28", by: "Maya" },
  { id: "festival-crowd", h: "h-32" },
  { id: "wedding-petals", h: "h-40", by: "Jay" },
];

/** Arrival toasts, keyed to how many tiles have landed when they pop. */
const TOASTS: { at: number; text: string }[] = [
  { at: 2, text: "Maya added 3" },
  { at: 6, text: "Jay added 2" },
  { at: 9, text: "Anonymous added 1" },
];

export function ArrivalsHero() {
  const page = featurePage("album");
  const reduced = usePrefersReducedMotion();
  const { ref: stageRef, paused } = useAmbientPause<HTMLDivElement>();
  const [landed, setLanded] = useState(0);
  const [runId, setRunId] = useState(0);

  // The fill clock: one tile per beat while the stage is visible. Pausing
  // clears the interval and a re-entry restarts it from the current count, so
  // the album never fills behind the visitor's back (the ambient contract).
  useEffect(() => {
    if (reduced) {
      const t = setTimeout(() => setLanded(TILES.length), 0);
      return () => clearTimeout(t);
    }
    if (paused) return;
    const t = setInterval(() => {
      setLanded((n) => (n >= TILES.length ? n : n + 1));
    }, LAND_EVERY_MS);
    return () => clearInterval(t);
  }, [paused, reduced, runId]);

  const cut = (i: number) => ({
    "data-mkt-cut": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <section className="overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14">
      <Container>
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <Link
            {...cut(0)}
            href="/features"
            className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground"
          >
            Features
          </Link>
          <Eyebrow {...cut(1)}>{page.navLabel}</Eyebrow>
          <h1
            {...cut(2)}
            className="font-heading text-4xl text-balance sm:text-5xl lg:text-6xl"
          >
            {page.h1}
          </h1>
          <p
            {...cut(3)}
            className="max-w-2xl text-lg text-pretty text-muted-foreground"
          >
            {page.heroSub}
          </p>
          <div {...cut(4)} className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 px-6 text-base"
            >
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </div>
        </Reveal>

        {/* The arrivals stream. */}
        <div ref={stageRef} className="mx-auto mt-12 max-w-3xl sm:mt-16">
          <BrowserFrame label="partyreel.com/a/maya-and-jay">
            <div className="relative">
              <div className="columns-3 gap-1.5">
                {TILES.map((tile, i) => {
                  const m = marketingImage(tile.id);
                  const on = i < landed;
                  return (
                    <div
                      key={tile.id}
                      data-mkt-fly
                      data-on={on ? "true" : undefined}
                      className={`relative mb-1.5 ${tile.h} w-full overflow-hidden rounded-[4px]`}
                      style={
                        {
                          // Arrive from just below, no cross-stage flight: the
                          // shots land INTO the album, calm on purpose.
                          "--i": 0,
                          "--fly-x": "0px",
                          "--fly-y": "26px",
                        } as CSSProperties
                      }
                    >
                      <Image
                        src={m.src}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 232px, 33vw"
                        className="object-cover"
                      />
                      {tile.by && (
                        <span
                          data-mkt-toast
                          data-on={on ? "true" : undefined}
                          className="absolute bottom-1 left-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] leading-4 font-medium text-white backdrop-blur-sm"
                          style={{ transitionDelay: on ? "260ms" : "0ms" }}
                        >
                          {tile.by}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Arrival toasts: the room, adding. The ratified [data-mkt-toast]
                  vocabulary, never sonner on a cinema surface. */}
              <div className="absolute bottom-2 left-2 flex flex-col items-start gap-2">
                {TOASTS.map((toast, i) => (
                  <span
                    key={toast.text}
                    data-mkt-toast
                    data-on={landed >= toast.at ? "true" : undefined}
                    className="rounded-full border bg-popover/95 px-3 py-1.5 text-xs font-medium backdrop-blur"
                    style={{ transitionDelay: `${i * 120}ms` }}
                  >
                    {toast.text}
                  </span>
                ))}
              </div>
            </div>
          </BrowserFrame>

          {/* The status row: how full the album is (mono fact register) +
              Replay, kept OFF the media so no shot ever sits under a control. */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <p
              className="font-mono text-[13px] text-muted-foreground tabular-nums"
              aria-hidden
            >
              {landed >= TILES.length
                ? `${TILES.length} in · still open for more`
                : `${landed} of ${TILES.length} in · filling live`}
            </p>
            <button
              type="button"
              onClick={() => {
                // Reset via the handler (never inside an effect): data-on
                // drops off every tile and the clock re-keys for a clean run.
                setLanded(0);
                setRunId((n) => n + 1);
              }}
              className="flex h-8 items-center gap-1.5 rounded-md border bg-card px-3 text-xs font-medium text-muted-foreground transition-transform duration-150 active:scale-95"
            >
              <RotateCcw className="size-3.5" />
              Replay
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

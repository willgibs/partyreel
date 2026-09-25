import type { CSSProperties } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { SITE_URL } from "@/lib/constants/site";
import { DEMO_EVENT_URL } from "@/lib/demo";

import { AmbientReelVideo } from "./ambient-reel-video";
import { SCREEN_REEL } from "./style-facets";

/**
 * /reel chapter two, THE SCREEN: the reel's own view is the wall
 * (`?reel=screen`, the host's Play on a screen), so the chapter shows the room
 * what the room sees. The frame is the screen posture as it ships
 * (reel/live-reel-view.tsx): the reel edge to edge in a landscape mood, the
 * corner code bottom right with "Scan to add yours" (pinned by mock-parity) and
 * the address, and no event name on screen.
 *
 * ★ THE CODE IS THE DEMO'S, NEVER A DRAWING, and it goes when the demo does.
 * A scannable code on a marketing page is a door, and the site's one door is
 * the demo (the events pages' rule), so the plate encodes `/demo` exactly as
 * the event objects do and the address under it says so. With no demo
 * configured the corner has nothing true to carry, so it is dropped whole.
 * The whole frame is decorative (aria-hidden): the copy carries every fact.
 */
export function ScreenSection() {
  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <SectionShell id="screen">
      <MediaSplit
        mediaSide="start"
        media={
          <div
            aria-hidden
            className="rounded-2xl border bg-card p-2 ring-1 ring-foreground/5 sm:p-2.5"
          >
            {/* The screen's well takes the bright edge (globals.css, [data-lit]). */}
            <div
              data-lit=""
              className="relative overflow-hidden rounded-xl bg-gallery"
            >
              <AmbientReelVideo
                reel={SCREEN_REEL}
                sizes="(min-width: 1024px) 640px, 92vw"
                className="w-full"
              />
              {DEMO_EVENT_URL && (
                <div className="absolute right-2.5 bottom-2.5 flex items-end gap-2 sm:right-4 sm:bottom-4 sm:gap-3">
                  <div className="text-right [text-shadow:0_1px_2px_rgb(0_0_0/0.55),0_2px_24px_rgb(0_0_0/0.45)]">
                    <p className="font-heading text-xs font-semibold text-white sm:text-base">
                      Scan to add yours
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/90 sm:text-xs">
                      {SITE_URL.replace(/^https?:\/\//, "")}/demo
                    </p>
                  </div>
                  <FooterQr
                    value={`${SITE_URL}/demo`}
                    size={72}
                    className="p-1.5 shadow-lift max-sm:p-1 max-sm:[&>svg]:size-10"
                  />
                </div>
              )}
            </div>
          </div>
        }
      >
        <Reveal className="flex flex-col gap-4">
          <Eyebrow {...rise(0)}>The screen</Eyebrow>
          <h2 {...rise(1)} className="font-heading text-section text-balance">
            Put it on the wall.
          </h2>
          <p {...rise(2)} className="text-pretty text-muted-foreground">
            Open the reel on the laptop that drives the TV or projector and
            press Play on a screen. It fills the room edge to edge, with the
            event’s code in the corner, and every photo someone adds joins it
            within seconds.
          </p>
          <p {...rise(3)} className="text-pretty text-muted-foreground">
            The room watches itself fill, and the code turns watching into
            adding. Your review queue never shows, and the screen carries no
            mark on any plan.
          </p>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}

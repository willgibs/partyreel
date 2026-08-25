import type { CSSProperties } from "react";

import { ReelFrame } from "@/components/marketing/frames";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

import { AmbientReelVideo } from "./ambient-reel-video";
import { SHARE_REEL } from "./style-facets";

/**
 * /reel section 6 — guest download + share (MEDIUM). The guest reel surface SHIPPED
 * (card, overlay, download are live product), so the voice is present-tense confident.
 * One medium visual: the landscape loop playing inside the product player frame
 * (ReelFrame's media slot), reading as "the reel on the event page".
 */
export function GuestShareSection() {
  // Standard-register stagger marks for the copy column (the SectionShell grammar,
  // hand-marked because this section's header lives inside the split, not centered).
  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <SectionShell id="share">
      <MediaSplit
        mediaSide="end"
        media={
          <ReelFrame
            media={
              <AmbientReelVideo
                reel={SHARE_REEL}
                sizes="(min-width: 1024px) 640px, 92vw"
                className="h-full w-full"
              />
            }
          />
        }
      >
        <Reveal className="flex flex-col gap-4">
          <Eyebrow {...rise(0)}>Made to share</Eyebrow>
          <h2
            {...rise(1)}
            className="font-heading text-3xl text-balance sm:text-4xl"
          >
            Every guest can take the reel home.
          </h2>
          <p {...rise(2)} className="text-pretty text-muted-foreground">
            The reel lives on the same link as the album. Guests watch it right
            on your event page and save it to their phones. No app, no account,
            no export settings.
          </p>
          <p {...rise(3)} className="text-pretty text-muted-foreground">
            So the highlights actually reach everyone. One link carries the
            whole event home, and nobody is chasing files the morning after.
          </p>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}

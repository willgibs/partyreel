"use client";

import Image from "next/image";

import { ReelAngleBand } from "@/components/marketing/sections/events/reel-angle-band";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { StatBand } from "@/components/marketing/system/stat-band";
import { EVENT_TYPES } from "@/lib/constants/events";
import { marketingImage } from "@/lib/constants/marketing-media";

import { PROOF_STATS, STORY_FRAMES } from "./fixtures";

/**
 * DECISION 5: THE PROOF. The real `ReelAngleBand` (weddings' own angle,
 * `hero-candidate-01`, the site's one real render) is every option's spine or
 * its replacement. `stats` uses the same fact-only register
 * `quality-section.tsx` already ratified for `StatBand` (never a usage count:
 * there are zero real hosts to count yet), `animate="none"` because no
 * decision here is about the count-up itself. `demo-door` reuses
 * `demo-event`'s OWN recommended answer for what a door should promise
 * ("named": what it opens, how full it is) rather than inventing new promise
 * copy for one more door.
 */
export type ProofShape = "reel" | "stats" | "story" | "demo-door";

const WEDDING = EVENT_TYPES[0];

function DemoDoor() {
  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center">
      <p className="text-sm font-medium text-foreground">
        Walk through a real album
      </p>
      <p className="text-sm text-muted-foreground">
        Maya &amp; Jay&rsquo;s wedding, 36 photos from 9 guests. No signup, and
        nothing you add there is saved.
      </p>
      <DemoCtaLink source="events-proof" />
    </div>
  );
}

function Story() {
  return (
    <SectionShell width="narrow" eyebrow="One real wedding" heading="Maya & Jay's Saturday, three guests' phones">
      <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
        {STORY_FRAMES.map((frame) => (
          <figure key={frame.id} className="flex flex-col gap-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src={marketingImage(frame.id).src}
                alt=""
                fill
                sizes="(min-width: 640px) 220px, 90vw"
                className="object-cover"
              />
            </div>
            <figcaption className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{frame.time}</span>{" "}
              &middot; {frame.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </SectionShell>
  );
}

export function ProofPreview({ shape }: { shape: ProofShape }) {
  if (shape === "story") return <Story />;
  return (
    <>
      {shape === "stats" && (
        <SectionShell reveal="none" className="pb-0">
          <StatBand stats={PROOF_STATS} animate="none" />
        </SectionShell>
      )}
      <ReelAngleBand singular={WEDDING.singularLabel} angle={WEDDING.reelAngle} />
      {shape === "demo-door" && <DemoDoor />}
    </>
  );
}

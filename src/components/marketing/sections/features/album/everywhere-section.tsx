import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

import { EVERYWHERE } from "./album-copy";
import { EverywhereStage } from "./everywhere-stage";

/**
 * /features/album, chapter 1's supporting beat: the doorbell, as a benefit.
 * The hero showed one album filling; this shows that the SAME upload lands on
 * every open album at once (the venue screen, the laptop by the door, every
 * phone), which is the thing a host cannot get from a group chat. Medium
 * register: a media split with the paired stage, two rows of copy, one
 * pointer onward to curation. Chapter 1 then winds down on the quiet numbers.
 */
export function EverywhereSection() {
  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <SectionShell>
      <MediaSplit
        className="lg:items-center"
        media={
          <Reveal
            data-mkt-reveal
            className="mx-auto w-full max-w-xl"
            style={{ "--i": 0 } as CSSProperties}
          >
            <EverywhereStage />
          </Reveal>
        }
      >
        <Reveal className="flex flex-col gap-4">
          <Eyebrow {...rise(0)}>Live</Eyebrow>
          <h2
            {...rise(1)}
            className="font-heading text-3xl text-balance sm:text-4xl"
          >
            Land once, show up everywhere.
          </h2>
          <p
            {...rise(2)}
            className="max-w-lg text-pretty text-muted-foreground"
          >
            {EVERYWHERE.body}
          </p>
          <div {...rise(3)}>
            <LearnMoreLink href="/features/curation">
              Shape it while it fills
            </LearnMoreLink>
          </div>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}

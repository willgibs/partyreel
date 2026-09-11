import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

import { WHO_CAN_OPEN } from "./album-copy";
import { VisibilityFrames } from "./visibility-frames";

/**
 * WHO CAN OPEN IT: the viewer side of access, which the old page never
 * covered (it only said who could upload). One plate, four states, then two
 * one-line facts on a ruled row and the pointer. The plate lands as one
 * block on the slot after the header (a light table arrives whole).
 */
export function WhoCanOpenSection() {
  return (
    <SectionShell
      eyebrow="Who can open it"
      heading="As public as you make it."
      subhead={WHO_CAN_OPEN.subhead}
    >
      <Reveal className="mx-auto mt-12 max-w-5xl">
        <div data-mkt-reveal style={{ "--i": 3 } as CSSProperties}>
          <VisibilityFrames />
        </div>
        <div
          data-mkt-reveal
          className="mt-8 grid gap-x-8 gap-y-3 border-t pt-6 text-sm text-muted-foreground sm:grid-cols-2"
          style={{ "--i": 4 } as CSSProperties}
        >
          {WHO_CAN_OPEN.facts.map((fact) => (
            <p key={fact} className="text-pretty">
              {fact}
            </p>
          ))}
        </div>
        <div
          data-mkt-reveal
          className="mt-6 flex justify-center"
          style={{ "--i": 5 } as CSSProperties}
        >
          <LearnMoreLink href="/features/privacy">
            Privacy and trust, in depth
          </LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}

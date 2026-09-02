import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

import { VisibilityFrames } from "./visibility-frames";

/**
 * WHO CAN OPEN IT: the viewer side of access, which the old page never
 * covered at all (it only said who could upload). Four frames of what a
 * visitor meets at the link, from open to locked, then the three facts a host
 * wants under them: the link is the key on a public event, password is a paid
 * setting, and share links never reach a search engine.
 */
export function WhoCanOpenSection() {
  return (
    <SectionShell
      eyebrow="Who can open it"
      heading="As public as you make it."
      subhead="One setting decides who can see the album. Here is what each answer looks like from the guest's side."
    >
      <Reveal className="mx-auto mt-12 max-w-5xl">
        <div data-mkt-reveal style={{ "--i": 3 } as CSSProperties}>
          <VisibilityFrames />
        </div>
      </Reveal>
      <Reveal className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-3 text-center">
        <p
          data-mkt-reveal
          className="max-w-2xl text-sm leading-relaxed text-pretty text-muted-foreground"
          style={{ "--i": 0 } as CSSProperties}
        >
          On a public event the link is the key: anyone you send it to can open
          the album, scan or no scan. Password protection comes with Pro and
          Event Pass. Album links are never listed by search engines.
        </p>
        <MonoCaption data-mkt-reveal style={{ "--i": 1 } as CSSProperties}>
          location data is stripped on the phone before anything uploads
        </MonoCaption>
        <div data-mkt-reveal style={{ "--i": 2 } as CSSProperties}>
          <LearnMoreLink href="/features/privacy">
            Privacy and trust, in depth
          </LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}

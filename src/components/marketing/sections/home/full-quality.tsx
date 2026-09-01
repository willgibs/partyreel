import { Download, Images, Video, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";

/**
 * QUIET (the loud/quiet map): what guests can SEND, as three specific claims.
 * Full-resolution originals and video were only implied anywhere on the page
 * before this; they are a capture-chapter fact, so they live in chapter 1.
 *
 * WHY IT IS HERE (the chapter arc, design-system.md "Chapters"): the second
 * of the two simpler sections Will asked for above the live demo, so chapter
 * 1 winds down through real information before its closing anchor instead of
 * escalating into the paper cut. Same register as no-app.tsx and the privacy
 * section: hairline icons, quiet reveals, specifics over adjectives.
 *
 * No figures. The marketed storage numbers reach copy through the MDX spec
 * tags by policy (content-policy.test.ts), and per-file limits are not a
 * marketing claim. "Full resolution" and "video too" are the facts.
 */

const CLAIMS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Images,
    title: "Originals, not copies",
    body: "Photos land at full resolution. Nothing is recompressed on the way in.",
  },
  {
    icon: Video,
    title: "Video too",
    body: "Clips upload the same way photos do, from the same sheet, into the same album.",
  },
  {
    icon: Download,
    title: "Download one, or all of it",
    body: "Every original is there to take, one at a time or the whole album at once.",
  },
];

export function FullQuality() {
  return (
    <SectionShell
      eyebrow="Full quality"
      heading={SECTION_HEADERS.fullQuality.line}
    >
      <Reveal className="mx-auto mt-12 max-w-4xl">
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-10">
          {CLAIMS.map((claim, i) => (
            <div
              key={claim.title}
              data-mkt-reveal
              className="flex w-full items-start gap-4 sm:w-[calc((100%-2.5rem)/2)] lg:w-[calc((100%-5rem)/3)]"
              style={{ "--i": i + 2 } as CSSProperties}
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground">
                <claim.icon className="size-4.5" strokeWidth={1.5} />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-heading text-base sm:text-lg">
                  {claim.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {claim.body}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div
          data-mkt-reveal
          className="mt-10 flex justify-center"
          style={{ "--i": 5 } as CSSProperties}
        >
          <LearnMoreLink href="/features/album">
            Inside the live album
          </LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}

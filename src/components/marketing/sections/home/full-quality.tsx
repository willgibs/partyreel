import { Download, Images, Video, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { PhotoSection } from "@/components/shared/backdrop/photo-section";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";

/**
 * WHAT GUESTS CAN SEND, as three specific claims, standing in a room whose
 * picture changes as you move through it.
 *
 * Full-resolution originals and video were only implied anywhere on the page
 * before this; they are a capture-chapter fact, so they live in chapter 1.
 * Hairline icons, quiet reveals, specifics over adjectives. No figures: the
 * marketed storage numbers reach copy through the MDX spec tags by policy
 * (content-policy.test.ts), and per-file limits are not a marketing claim.
 *
 * ★ IT CLOSES CHAPTER ONE, AND THE PHOTOGRAPH IS WHY (Will, 2026-09-18,
 * "full-image sections are chapter transitions"): "I
 * think full image backgrounds sections should commonly serve as chapter
 * transitions, so we go straight from dark to light or vice versa less often.
 * It makes the transition much less harsh... For this specific instance, we
 * could use this to end the first chapter and combine the live demo visual
 * currently below into the start of the chapter after." So a reader crosses
 * from the cinema to the paper chapter THROUGH a photograph instead of over a
 * hairline, and the live demo moved under the cut to open the chapter it now
 * belongs to (`section-ids.ts` holds the move; the demo itself is untouched).
 *
 * ★ THE SECTION KEEPS ITS OWN SHAPE. `PhotoSection` wraps it and owns the
 * backdrop, the plate and the rail; everything below is the section as it was,
 * which is what makes the device reusable on any page the ruling reaches. The
 * one thing the plate changes is the ink: over a photograph the body copy
 * leaves the muted tier (the measured rule lives on the plate, in
 * photo-section.css), so the hierarchy here comes from size and weight.
 *
 * It is still chapter 1's ONE icon three-up, by the 2026-09-01 adjacency ruling
 * (no two sections back to back share a layout): no-app.tsx above is an open
 * ledger, and the paper chapter below opens on the live demo's stage.
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
    <PhotoSection>
      <SectionShell
        eyebrow="Full quality"
        heading={SECTION_HEADERS.fullQuality.line}
        /* The plate already frames the copy, so the section's own py-20/24
           would frame it twice and leave the room mostly empty pane. The
           photograph, not the padding, is what gives this section its air. */
        className="py-14 sm:py-16"
      >
        <Reveal className="mx-auto mt-10 max-w-4xl">
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
                  <h3 className="font-heading text-subsection">
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
    </PhotoSection>
  );
}

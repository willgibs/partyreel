import {
  ScanLine,
  Smartphone,
  UserRoundX,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";

/**
 * QUIET (the loud/quiet map): the guest side of "no app, no account" as three
 * SPECIFIC claims, hairline icons, quiet reveals only. The trust strip states
 * this in four words at the top of the chapter; this is where the four words
 * get their specifics, in the privacy section's register (specifics over
 * adjectives).
 *
 * WHY IT IS HERE (the chapter arc, design-system.md "Chapters"): chapter 1
 * used to escalate straight into the paper cut -- the live demo, the loudest
 * non-hero section on the page, landed immediately before the chapter change,
 * so the next chapter had no quiet to open against. Will: "add at least one,
 * if not two, simpler sections above the live demo, then conclude the first
 * chapter with a reworked version of the live demo section." This is the
 * first of the two. Its job is to be interesting on its own and quieter than
 * the film strip above it, so the anchor below reads as a conclusion.
 */

const CLAIMS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Smartphone,
    title: "Any phone, any camera",
    body: "The QR opens in the browser they already have. iPhone, Android, whatever is in their pocket.",
  },
  {
    icon: UserRoundX,
    title: "No account, no app",
    body: "Guests upload without signing up for anything. If you want a verified email first, that is one switch.",
  },
  {
    icon: ScanLine,
    title: "Nothing to learn",
    body: "One scan, one tap. The upload sheet is the camera roll they use every day.",
  },
];

export function NoApp() {
  return (
    <SectionShell eyebrow="Guests" heading={SECTION_HEADERS.noApp.line}>
      {/* ONE CHOREOGRAPHY (R4): a two-line header holds slots 0-1, so the claims
          continue at 2 and the pointer closes at 5, under ONE observer. */}
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
          <LearnMoreLink href="/features/guests">How guests join</LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}

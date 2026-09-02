import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";

/**
 * QUIET (the loud/quiet map): the guest side of "no app, no account" as three
 * SPECIFIC claims, quiet reveals only. The trust strip states this in four
 * words at the top of the chapter; this is where the four words get their
 * specifics (specifics over adjectives).
 *
 * WHY IT IS HERE (the chapter arc, design-system.md "Chapters"): chapter 1
 * used to escalate straight into the paper cut -- the live demo, the loudest
 * non-hero section on the page, landed immediately before the chapter change,
 * so the next chapter had no quiet to open against. Will: "add at least one,
 * if not two, simpler sections above the live demo, then conclude the first
 * chapter with a reworked version of the live demo section." This is the
 * first of the two. Its job is to be interesting on its own and quieter than
 * the film strip above it, so the anchor below reads as a conclusion.
 *
 * ★ WHY A LEDGER, LEFT-ALIGNED (Will's second pass, 2026-09-01: "no two
 * sections back to back should feel repetitive"). This and full-quality.tsx
 * shipped as the same centred icon three-up twice in a row and read as one
 * long section. The film strip above ends on three bordered cards, so a third
 * three-column section would have followed it; rows here make the chapter's
 * column rhythm 3 cards -> rows -> 3-up -> stage. The rows are /about's
 * conviction ledger on the cinema surface: a left header (the home's first),
 * hairline rows, the claim on the left and its specifics on the right. No
 * numerals (the strip's SCENE 01/02/03 labels sit directly above) and no
 * icons (the icon vocabulary stays with full-quality and curation).
 */

const CLAIMS: { title: string; body: string }[] = [
  {
    title: "Any phone, any camera",
    body: "The QR opens in the browser they already have. iPhone, Android, whatever is in their pocket.",
  },
  {
    title: "No account, no app",
    body: "Guests upload without signing up for anything. If you want a verified email first, that is one switch.",
  },
  {
    title: "Nothing to learn",
    body: "One scan, one tap. The upload sheet is the camera roll they use every day.",
  },
];

export function NoApp() {
  return (
    <SectionShell
      eyebrow="Guests"
      heading={SECTION_HEADERS.noApp.line}
      align="left"
      containerClassName="max-w-4xl"
    >
      {/* ONE CHOREOGRAPHY (R4): a two-line header holds slots 0-1, so the rows
          continue at 2 and the pointer closes at 5, under ONE observer. */}
      <Reveal className="mt-10 sm:mt-12">
        <ul className="border-t">
          {CLAIMS.map((claim, i) => (
            <li
              // Per-row border-b, never divide-y (the /about ledger's reason):
              // divide-y hangs the rule on the NEXT sibling. The last row keeps
              // its rule so the pointer reads as the ledger's footer line.
              key={claim.title}
              data-mkt-reveal
              className="grid gap-x-10 gap-y-2 border-b py-7 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:py-8"
              style={{ "--i": i + 2 } as CSSProperties}
            >
              {/* No text-balance on a 2-4 word heading in a grid cell: balance
                  can pick a worse break than the natural one at that length. */}
              <h3 className="font-heading text-xl sm:text-2xl">
                {claim.title}
              </h3>
              <p className="text-[15px] leading-7 text-pretty text-muted-foreground">
                {claim.body}
              </p>
            </li>
          ))}
        </ul>
        <div
          data-mkt-reveal
          className="mt-8"
          style={{ "--i": 5 } as CSSProperties}
        >
          <LearnMoreLink href="/features/guests">How guests join</LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}

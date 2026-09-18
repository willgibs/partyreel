import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";

/**
 * QUIET (the loud/quiet map): the shipped-but-invisible safety features as
 * NAMED, SPECIFIC claims (IA section 8, "the unused ammunition"), quiet
 * reveals only. Specifics over adjectives throughout. Deliberately absent by
 * the hard fence: CSAM / forensic / law-enforcement language (counsel + NCMEC
 * pending) and any retention-as-legal-promise.
 *
 * ★ WHY A NUMBERED LEDGER, LEFT-ALIGNED (Will's second pass, 2026-09-01: "no
 * two sections back to back should feel repetitive"; the paper chapter must
 * not run three centred sections in a row). This and curation shipped as two
 * centred icon layouts and read alike. The paper chapter now alternates left
 * (the album's masthead), centred (curation's mirrored split), left (this):
 * a document card in the idiom of /features/privacy's storage facts, five
 * rows with a numbered index, the claim on the left and its specifics on the
 * right. It differs from chapter 1's open ledger (no-app.tsx) on purpose:
 * bordered, numbered, on paper, five sections away. No icons; the numerals do
 * the scanning.
 */

const CLAIMS: { title: string; body: string }[] = [
  {
    // ★ THE RULED SHORT FORM (Will, 2026-09-02). The clause "for the common
    // formats" rides EVERY shortened version of this claim: HEIC, HEIF and AVIF
    // images and WebM video are stored exactly as the device sends them, so the
    // unconditional sentence this used to carry was not true. The long form,
    // naming the formats, is the privacy policy's own paragraph (the "metadata"
    // section of constants/legal-privacy.tsx). Do not drop the clause.
    title: "Location data stays on the phone",
    body: "Location data is stripped in the browser before a photo ever uploads, for the common formats.",
  },
  {
    title: "Three ways to share",
    body: "Open, password-protected on paid plans, or fully private. A locked event shows only its name and a count.",
  },
  {
    title: "A verified email to upload",
    body: "Ask every uploader for a verified email first. Free on every plan, on by default.",
  },
  {
    title: "30 days to change your mind",
    body: "Deleted media waits in a recovery bin for 30 days before it is gone for good.",
  },
  {
    title: "Backed up twice, automatically",
    body: "Every file is replicated to a second region the moment it lands.",
  },
];

export function Privacy() {
  return (
    <SectionShell
      eyebrow="Privacy"
      heading={SECTION_HEADERS.privacy.line}
      align="left"
      containerClassName="max-w-4xl"
    >
      {/* ONE CHOREOGRAPHY (R4): this header is two lines, so the rows continue
          at slot 2 and the pointer closes at 7, all under ONE observer. Seven
          slots at the 90ms default would trail past 600ms, so the block
          tightens the stagger token to 70ms (the polish rule: keep a long
          stagger's total inside ~300ms of spread past the header). */}
      <Reveal
        className="mt-10 sm:mt-12"
        style={{ "--mkt-stagger-ms": "70ms" } as CSSProperties}
      >
        <ol className="divide-y rounded-xl border bg-card/40">
          {CLAIMS.map((claim, i) => (
            <li
              key={claim.title}
              data-mkt-reveal
              className="flex items-baseline gap-4 px-5 py-5 sm:gap-6 sm:py-6"
              style={{ "--i": i + 2 } as CSSProperties}
            >
              <span className="w-6 shrink-0 text-xs tracking-wide text-muted-foreground tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="grid min-w-0 flex-1 gap-x-8 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <h3 className="font-heading text-subsection">{claim.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {claim.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        {/* The ladder pointer (expansion round): the full trust story. */}
        <div
          data-mkt-reveal
          className="mt-8"
          style={{ "--i": 7 } as CSSProperties}
        >
          <LearnMoreLink href="/features/privacy">
            The full privacy story
          </LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}

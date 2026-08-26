import {
  DatabaseBackup,
  LockKeyhole,
  MailCheck,
  MapPinOff,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";

/**
 * QUIET (the loud/quiet map): the shipped-but-invisible safety features as
 * NAMED, SPECIFIC claims (IA section 8, "the unused ammunition"), mono
 * hairline icons, quiet reveals only. Specifics over adjectives throughout.
 * Deliberately absent by the hard fence: CSAM / forensic / law-enforcement
 * language (counsel + NCMEC pending) and any retention-as-legal-promise.
 */

const CLAIMS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: MapPinOff,
    title: "Location data stays on the phone",
    body: "EXIF and GPS metadata are stripped in the browser before a photo ever uploads.",
  },
  {
    icon: LockKeyhole,
    title: "Three ways to share",
    body: "Open, password-protected on paid plans, or fully private. A locked event shows only its name and a count.",
  },
  {
    icon: MailCheck,
    title: "A verified email to upload",
    body: "Ask every uploader for a verified email first. Free on every plan, on by default.",
  },
  {
    icon: Undo2,
    title: "30 days to change your mind",
    body: "Deleted media waits in a recovery bin for 30 days before it is gone for good.",
  },
  {
    icon: DatabaseBackup,
    title: "Backed up twice, automatically",
    body: "Every file is replicated to a second region the moment it lands.",
  },
];

export function Privacy() {
  return (
    <SectionShell eyebrow="Privacy" heading={SECTION_HEADERS.privacy.line}>
      {/* FIVE ITEMS, NO HOLE (R4/A18): a 3-column GRID left the sixth cell
          empty, which read as a missing claim. A wrapped flex row with the
          same column widths centers the short last row instead (3 + 2 at lg,
          2 + 2 + 1 at sm), so the shape reads deliberate at every width. */}
      <Reveal className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-x-10 gap-y-10">
        {CLAIMS.map((claim, i) => (
          <div
            key={claim.title}
            data-mkt-reveal
            className="flex w-full items-start gap-4 sm:w-[calc((100%-2.5rem)/2)] lg:w-[calc((100%-5rem)/3)]"
            style={{ "--i": i } as CSSProperties}
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
      </Reveal>
      {/* The ladder pointer (expansion round): the full trust story. */}
      <Reveal className="mt-10 flex justify-center">
        <LearnMoreLink href="/features/privacy">
          The full privacy story
        </LearnMoreLink>
      </Reveal>
    </SectionShell>
  );
}

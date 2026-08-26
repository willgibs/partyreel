import { Flag, Trash2, UserCheck, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * The moderation close of the paper chapter: reporting and removal as HUMAN
 * promises (a person reviews every report; never an automatic takedown), the
 * curation-section 3-up register at whisper volume. Ends with the chapter's
 * GoDeeper row into the two help articles that carry the exact details.
 */

const ITEMS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Flag,
    title: "Anyone can flag",
    body: "Everyone viewing an album can report a photo or video, discreetly, without having to chase down the host mid-party.",
  },
  {
    icon: UserCheck,
    title: "A person reviews every report",
    body: "Reports go to a real person who looks before anything happens. Never an automatic takedown.",
  },
  {
    icon: Trash2,
    title: "Hosts remove instantly",
    body: "You have the final say over your album. Take something down and it disappears immediately.",
  },
];

export function PeopleNotMachines() {
  return (
    <SectionShell
      eyebrow="Moderation"
      heading="People, not machines."
      subhead="When something should come down, a human decides, and the host always moves fastest."
    >
      <Reveal className="mx-auto mt-12 grid max-w-4xl gap-x-8 gap-y-10 sm:grid-cols-3">
        {ITEMS.map((item, i) => (
          <div
            key={item.title}
            data-mkt-reveal
            className="flex flex-col items-center gap-3 text-center"
            style={{ "--i": i } as CSSProperties}
          >
            <span className="flex size-10 items-center justify-center rounded-lg border text-muted-foreground">
              <item.icon className="size-5" strokeWidth={1.5} />
            </span>
            <h3 className="font-heading text-lg sm:text-xl">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          </div>
        ))}
      </Reveal>
      {/* GoDeeper: the ladder's bottom rung into the help center. */}
      <Reveal className="mt-14 flex flex-col items-center gap-2 text-center">
        <MonoCaption>The exact details live in the help center</MonoCaption>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <LearnMoreLink href="/help/who-can-see-your-event">
            Who can see your event
          </LearnMoreLink>
          <LearnMoreLink href="/help/how-long-media-is-kept">
            How long media is kept
          </LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}

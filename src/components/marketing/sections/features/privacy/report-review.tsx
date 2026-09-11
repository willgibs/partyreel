import { Flag, SearchCheck, Trash2, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Caption } from "@/components/marketing/system/caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * The moderation close of the paper chapter (formerly "People, not machines"):
 * reporting and removal as CARE promises, the curation-section 3-up register at
 * whisper volume. Deliberately actor-free (the 2026-08-28 neutralization
 * ruling): the copy commits to review-before-removal and host control, never to
 * WHO or WHAT does the reviewing, so support/moderation tooling can evolve
 * without breaking published language. Ends with the chapter's GoDeeper row
 * into the two help articles that carry the exact details.
 */

const ITEMS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Flag,
    title: "Anyone can flag",
    body: "Everyone viewing an album can report a photo or video, discreetly, without having to chase down the host mid-party.",
  },
  {
    icon: SearchCheck,
    title: "Every report gets reviewed",
    body: "A report never lands in a void. Each one is reviewed before anything comes down, and serious problems can end in removals or suspended accounts.",
  },
  {
    icon: Trash2,
    title: "Hosts remove instantly",
    body: "You have the final say over your album. Take something down and it disappears immediately.",
  },
];

export function ReportReview() {
  return (
    <SectionShell
      eyebrow="Moderation"
      heading="Flagged, reviewed, handled."
      subhead="Every report gets a careful look, and the host always moves fastest."
    >
      {/* Slots continue SectionShell's header count (0-2). */}
      <Reveal className="mx-auto mt-12 grid max-w-4xl gap-x-8 gap-y-10 sm:grid-cols-3">
        {ITEMS.map((item, i) => (
          <div
            key={item.title}
            data-mkt-reveal
            className="flex flex-col items-center gap-3 text-center"
            style={{ "--i": 3 + i } as CSSProperties}
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
      {/* GoDeeper: the ladder's bottom rung into the help center. STILL by
          convention (a pointer you find, not a beat that performs) — the old
          <Reveal> here wrapped children carrying no [data-mkt-reveal], so it
          was a dead island rendering statically anyway. Now that is the
          deliberate call, and a plain div says so. */}
      <div className="mt-14 flex flex-col items-center gap-2 text-center">
        <Caption>The exact details live in the help center</Caption>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <LearnMoreLink href="/help/who-can-see-your-event">
            Who can see your event
          </LearnMoreLink>
          <LearnMoreLink href="/help/how-long-media-is-kept">
            How long media is kept
          </LearnMoreLink>
        </div>
      </div>
    </SectionShell>
  );
}

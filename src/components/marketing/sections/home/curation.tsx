import { CopyCheck, EyeOff, ListChecks, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";

/**
 * QUIET-MEDIUM, UI/icon-focused (the loud/quiet map): the host-control story
 * in restrained UI vocabulary (hairline icon chips, no big visual) so the
 * loud neighbors keep their pop. Per Will's curation note the frame carries a
 * guest-side benefit (the subhead: curation is what makes the gallery worth
 * scrolling), and the light privacy hint lives in "Hidden stays hidden".
 */

const GUEST_LINE =
  "Your guests just see the good part: one clean album, the best of everyone's camera roll.";

// `tint` = the app's REAL action colors (approve green, hide amber, the reel
// violet on the sweep), per the 2026-08-25 achromatic ruling: accents where
// they add clarity — here they teach the product's universal action-color
// system before the visitor ever signs in. Icon-stroke only; chrome stays ink.
const CONTROLS: {
  icon: LucideIcon;
  title: string;
  body: string;
  tint: string;
}[] = [
  {
    icon: ListChecks,
    title: "Approve in one scroll",
    body: "Review new uploads in a single pass, and hold anything for approval before it goes public.",
    tint: "text-success",
  },
  {
    icon: EyeOff,
    title: "Hide with a tap",
    body: "Tuck a photo away instantly. Hidden stays hidden, and guests never see it.",
    tint: "text-warning",
  },
  {
    icon: CopyCheck,
    title: "Bulk select",
    body: "Sweep up dozens at once to feature, hide, or download together.",
    tint: "text-reel",
  },
];

export function Curation() {
  return (
    <SectionShell
      eyebrow="Curation"
      heading={SECTION_HEADERS.curation.line}
      subhead={GUEST_LINE}
    >
      {/* ONE CHOREOGRAPHY (R4): the header's three lines hold slots 0-2, so the
          cards continue at 3 and the pointer closes the cascade at 6. Body and
          pointer share ONE Reveal on purpose: a second observer would restart
          the count and the pointer would either race the cards or sit half a
          second late behind its own trigger. */}
      <Reveal className="mx-auto mt-12 max-w-4xl">
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-3">
          {CONTROLS.map((item, i) => (
            <div
              key={item.title}
              data-mkt-reveal
              className="flex flex-col items-center gap-3 text-center"
              style={{ "--i": i + 3 } as CSSProperties}
            >
              <span
                className={`flex size-10 items-center justify-center rounded-lg border ${item.tint}`}
              >
                <item.icon className="size-5" strokeWidth={1.5} />
              </span>
              {/* The H3 TIER (Will's checkpoint note: titles blended with body —
                  font-medium was overriding font-heading's 700): the heading
                  face at full weight, two sizes under the h2. */}
              <h3 className="font-heading text-lg sm:text-xl">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
        {/* The ladder pointer (expansion round): the full curation story. */}
        <div
          data-mkt-reveal
          className="mt-10 flex justify-center"
          style={{ "--i": 6 } as CSSProperties}
        >
          <LearnMoreLink href="/features/curation">
            How curation works
          </LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}

import Image from "next/image";

import { Conveyor } from "@/components/marketing/system/conveyor";
import { Caption } from "@/components/marketing/system/caption";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";
import { GOLDEN_LINES, SECTION_HEADERS } from "@/lib/constants/marketing-voice";

/**
 * /reel section 7 — the how-it-works reprise (QUIET): the core loop restated as "how
 * the reel gets made". Heading = the golden arc line; subhead = the RULED howItWorks
 * line verbatim (the Scan / Upload / Done verbs are Will's, 2026-08-25). The small
 * Conveyor of stills echoes home's film-strip mechanic at whisper volume — the one
 * visual this section allows itself.
 */

const STEPS = [
  {
    label: "Scan",
    body: "Guests scan your QR code. That is the whole setup.",
  },
  {
    label: "Upload",
    body: "Photos and videos pour into your album all event long.",
  },
  {
    label: "Done",
    body: "Pick a style. The reel cuts itself, ready to share.",
  },
];

/** A diverse sweep of the manifest for the strip (order tuned for variety, not story). */
const STRIP_IDS = [
  "wedding-golden",
  "party-dj",
  "reception-table",
  "festival-crowd",
  "wedding-petals",
  "party-balloons",
  "wedding-toast",
  "festival-lights",
  "wedding-arch",
  "concert-confetti",
];

export function HowRepriseSection() {
  return (
    <SectionShell
      id="how"
      eyebrow="How the reel gets made"
      heading={`${GOLDEN_LINES.arc}.`}
      subhead={SECTION_HEADERS.howItWorks.line}
    >
      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex flex-col gap-2">
            <Caption className="tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </Caption>
            <h3 className="font-heading text-subsection">{step.label}</h3>
            <p className="text-sm text-pretty text-muted-foreground">
              {step.body}
            </p>
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-14">
        <Conveyor copyClassName="gap-3 pr-3">
          {STRIP_IDS.map(marketingImage).map((m) => (
            <div
              key={m.id}
              className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border sm:h-24 sm:w-40"
            >
              <Image
                src={m.src}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
          ))}
        </Conveyor>
      </div>
    </SectionShell>
  );
}

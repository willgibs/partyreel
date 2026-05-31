import { Check } from "lucide-react";

import { HIGHLIGHT_REEL } from "@/lib/constants/features";

import { ReelFrame } from "./frames";
import { Section } from "./section";

// The highlight reel is a CORE value prop — the product's namesake payoff — so this
// is a confident, present-tense featured capability, NOT a "coming soon" teaser.
// Copy is single-sourced from HIGHLIGHT_REEL (shared with the /features marquee);
// the video-player visual is the shared ReelFrame (frames/).
export function ReelTeaser() {
  return (
    <Section
      eyebrow={HIGHLIGHT_REEL.eyebrow}
      heading={HIGHLIGHT_REEL.title}
      subhead={HIGHLIGHT_REEL.body}
    >
      <div className="mx-auto mt-12 grid max-w-5xl items-center gap-10 lg:grid-cols-2">
        <ReelFrame />
        <ul className="flex flex-col gap-4">
          {HIGHLIGHT_REEL.points.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                <Check className="size-3.5" />
              </span>
              <span className="text-pretty text-muted-foreground">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

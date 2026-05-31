import { Check, Play } from "lucide-react";

import { HIGHLIGHT_REEL } from "@/lib/constants/features";

import { Section } from "./section";

// The highlight reel is a CORE value prop — the product's namesake payoff — so this
// is a confident, present-tense featured capability, NOT a "coming soon" teaser.
// Copy is single-sourced from HIGHLIGHT_REEL (shared with the /features marquee).
export function ReelTeaser() {
  return (
    <Section
      eyebrow={HIGHLIGHT_REEL.eyebrow}
      heading={HIGHLIGHT_REEL.title}
      subhead={HIGHLIGHT_REEL.body}
    >
      <div className="mx-auto mt-12 grid max-w-5xl items-center gap-10 lg:grid-cols-2">
        <ReelPlayerFrame />
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

// A media-ready video-player frame (grayscale chrome, dark `--gallery` player
// surface — the same media-first surface the app uses). Placeholder now; a real
// reel preview drops into the 16:9 area later. aria-hidden — purely decorative.
function ReelPlayerFrame() {
  return (
    <div aria-hidden className="w-full">
      <div className="overflow-hidden rounded-2xl border bg-card p-3 ring-1 ring-foreground/5">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-gallery">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-gallery shadow-lg">
              <Play className="size-6 translate-x-0.5 fill-current" />
            </span>
          </div>
          <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
            <span className="text-[10px] font-medium text-white/80">0:12</span>
            <span className="relative h-1 flex-1 rounded-full bg-white/25">
              <span className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-brand" />
            </span>
            <span className="text-[10px] font-medium text-white/80">0:48</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { Section } from "./section";

// Clearly-labeled "coming soon" — the highlight reel is on the roadmap (PRD step
// 5) but no processing ships yet, so the copy promises a future, never the
// present ("will turn", "we're building it"). Do NOT imply it works today.
export function ReelTeaser() {
  return (
    <Section>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-2xl border bg-card px-6 py-12 text-center ring-1 ring-foreground/5">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="size-3" />
          Coming soon
        </Badge>
        <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          A highlight reel, stitched from the best moments
        </h2>
        <p className="max-w-xl text-pretty text-muted-foreground">
          When the event&rsquo;s over, Partyreel will turn the standout clips
          into a shareable highlight reel — automatically. We&rsquo;re building
          it now.
        </p>
      </div>
    </Section>
  );
}

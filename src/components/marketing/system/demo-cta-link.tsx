import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { trackAttrs } from "@/lib/analytics/events";
import { DEMO_CTA_LABEL } from "@/lib/constants/marketing-voice";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

/**
 * The recurring live-demo CTA (Track B system layer): renders the single-sourced
 * DEMO_CTA_LABEL, gated on DEMO_EVENT_URL — no demo event configured means no
 * link ANYWHERE (never a dead CTA). The chevron rides the learn-more-hover recipe
 * (mkt-learn, marketing.css chapter 2): it slides and its arms spread on hover.
 * `source` labels the demo_open analytics event; distinctive placements (the
 * CtaBand) pass their own, the long tail ships as "inline".
 *
 * ★ THE WORDS STAND ALONE, in all nineteen places (fourteen closing bands and
 * five page heroes). The demo frame rode beside them for a round and read "really
 * silly here beside the 'Try the live demo...' CTA link" (Will, `reel-story` r2);
 * his call is the bare link while `reel-story` r3 asks whether anything new
 * belongs here. The frame stays the hero's plate and the nav pane's, never this.
 */
export function DemoCtaLink({
  className,
  source = "inline",
}: {
  className?: string;
  source?: string;
}) {
  if (!DEMO_EVENT_URL) return null;
  return (
    <a
      href={DEMO_EVENT_URL}
      {...trackAttrs("demo_open", { source })}
      className={cn(
        "mkt-learn inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground",
        className,
      )}
    >
      {DEMO_CTA_LABEL}
      <LearnChevron />
    </a>
  );
}

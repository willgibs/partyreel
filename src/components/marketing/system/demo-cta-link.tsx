import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { DEMO_CTA_LABEL } from "@/lib/constants/marketing-voice";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

import { DemoDoor, LiveDot } from "./demo-modal/demo-door";

/**
 * The recurring live-demo CTA (Track B system layer): renders the single-sourced
 * DEMO_CTA_LABEL, gated on DEMO_EVENT_URL — no demo event configured means no
 * link ANYWHERE (never a dead CTA). The chevron rides the learn-more-hover recipe
 * (mkt-learn, marketing.css chapter 2): it slides and its arms spread on hover.
 * `source` labels the demo_open analytics event; distinctive placements (the
 * CtaBand) pass their own, the long tail ships as "inline".
 *
 * ★ THE LIVE DOT RIDES INSIDE THE ONE LINK, in all nineteen places (fourteen
 * closing bands and five page heroes): `reel-story` r3 `beside=live`, "feels a
 * bit more subtle but still cool". The frame that stood here for a round read
 * "really silly" beside the words (r2), so the mark is the smallest new thing,
 * and it is part of the link: one tap target, one accessible name (the words).
 *
 * ★ IT IS A DEMO DOOR (`demo-modal/`): at a desk a press opens the demo modal
 * (the code to scan, the demo one press away); on a phone it opens the demo in
 * a new tab.
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
    <DemoDoor
      href={DEMO_EVENT_URL}
      source={source}
      className={cn(
        "mkt-learn inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground",
        className,
      )}
    >
      <LiveDot />
      <span className="inline-flex items-center gap-1">
        {DEMO_CTA_LABEL}
        <LearnChevron />
      </span>
    </DemoDoor>
  );
}

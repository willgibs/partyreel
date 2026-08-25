import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { SectionShell } from "@/components/marketing/system/section-shell";
import type { EventType } from "@/lib/constants/events";
import { MAX_REEL_SECONDS } from "@/lib/constants/tiers";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";

/**
 * The per-type reel angle (B2, the IA's one content ADDITION to the event
 * pages): the site thesis echoed in the type's own words ("Every wedding ends
 * with a reel.") over the single-sourced reelAngle hook, routing the reader to
 * /reel. QUIET on the loud/quiet map: type only, no media (trips already plays
 * a render in its hero; the flagship carries the deep story). Counts render
 * from STYLE_CATALOG / MAX_REEL_SECONDS, never inline numbers.
 */
export function ReelAngleBand({ eventType }: { eventType: EventType }) {
  return (
    <SectionShell
      width="narrow"
      eyebrow="The highlight reel"
      heading={`Every ${eventType.singularLabel} ends with a reel.`}
      subhead={eventType.reelAngle}
    >
      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <MonoCaption>
          {STYLE_CATALOG.length} styles · {MAX_REEL_SECONDS.free}s free,{" "}
          {MAX_REEL_SECONDS.pro}s on Pro
        </MonoCaption>
        <LearnMoreLink href="/reel">
          See all {STYLE_CATALOG.length} styles
        </LearnMoreLink>
      </div>
    </SectionShell>
  );
}

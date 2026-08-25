import { Conveyor } from "@/components/marketing/system/conveyor";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { MARKETING_REELS } from "@/lib/constants/marketing-media";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";
import {
  resolveStyleEntry,
  STYLE_CATALOG,
} from "@/lib/reel/engine/style-registry";

import { InlineReelPlayer } from "../shared/inline-reel-player";
import { LearnMoreLink } from "../shared/learn-more-link";

/**
 * MEDIUM (the loud/quiet map): the style-name filmstrip on the Conveyor at
 * small scale + an inline poster-first play of the LANDSCAPE manifest reel,
 * routing the interested visitor onward. STYLE_CATALOG is the engine's PURE
 * metadata module (style-registry), the one sanctioned engine import on
 * marketing surfaces; no engine runtime rides these chunks.
 */

const INLINE_REEL_ID = "hero-candidate-02";

const SUBHEAD =
  "Pick a style and the reel renders on your phone, free, in seconds. Every guest can take the reel home.";

function formatDuration(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function ReelTeaser() {
  const reel = MARKETING_REELS.find((r) => r.id === INLINE_REEL_ID);
  if (!reel) throw new Error(`Unknown marketing reel id: ${INLINE_REEL_ID}`);
  const styleLabel = resolveStyleEntry(reel.recipe.styleId).label;
  // Doubled inside the copy so one conveyor copy outruns wide viewports (the
  // 14 chips alone are narrower than a large screen; a short copy shows a gap
  // at the -50% wrap).
  const chips = [...STYLE_CATALOG, ...STYLE_CATALOG];

  return (
    <SectionShell
      eyebrow="The reel"
      heading={SECTION_HEADERS.reel.line}
      subhead={SUBHEAD}
    >
      <Conveyor className="mt-10" copyClassName="gap-2 pr-2">
        {chips.map((style, i) => (
          <span
            key={`${style.id}-${i}`}
            className="rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap text-muted-foreground"
          >
            {style.label}
          </span>
        ))}
      </Conveyor>

      <div className="mx-auto mt-10 max-w-3xl">
        <InlineReelPlayer reelId={INLINE_REEL_ID} />
        <MonoCaption className="mt-3 text-center">
          A real render · {styleLabel} · {formatDuration(reel.durationSeconds)}
        </MonoCaption>
      </div>

      <div className="mt-10 text-center">
        {/* TODO(reel-route): INTERIM target. The /reel flagship is the B2
            lp/mkt-reel track; the orchestrator repoints this href at /reel in
            that integration commit. NEVER point it at the dead route early. */}
        <LearnMoreLink href="/features">
          See all {STYLE_CATALOG.length} styles
        </LearnMoreLink>
      </div>
    </SectionShell>
  );
}

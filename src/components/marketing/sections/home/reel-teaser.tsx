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
      {/* EDGE FADES + THE PLAYING CHIP (R4/A8): the row hard-clipped mid-word
          at both gutters, which read as a broken container rather than a
          conveyor, and nothing tied the names to the reel underneath. The mask
          ramps the row out at both edges (alpha machinery, the sanctioned #000
          literal), and the ONE filled chip is the style this render actually
          used — the same fact the caption states in words. */}
      <Conveyor
        className="mt-10 [mask-image:linear-gradient(to_right,transparent_0,#000_84px,#000_calc(100%_-_84px),transparent_100%)]"
        copyClassName="gap-2 pr-2"
      >
        {chips.map((style, i) => (
          <span
            key={`${style.id}-${i}`}
            className={
              style.id === reel.recipe.styleId
                ? "rounded-full border border-foreground/30 bg-foreground/10 px-3 py-1 text-xs font-medium whitespace-nowrap text-foreground"
                : "rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap text-muted-foreground"
            }
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
        {/* Deep-links into the flagship's catalog section (repointed from the
            /features interim at the lp/mkt-reel integration). */}
        <LearnMoreLink href="/reel#styles">
          See all {STYLE_CATALOG.length} styles
        </LearnMoreLink>
      </div>
    </SectionShell>
  );
}

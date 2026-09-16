import { type GridMedia } from "@/components/app/media-grid";
// The reel's pure data + geometry modules live under engine/ (constants/layout/reel-types/themes/
// style-registry — no DOM, no React). This builder runs on the SERVER too (the render service), so it
// imports them directly; nothing here reaches for a browser runtime.
import type { Orientation } from "@/lib/reel/engine/constants";
import { planReel } from "@/lib/reel/engine/layout";
import type {
  ReelClip,
  ReelProps,
  ReelTheme,
} from "@/lib/reel/engine/reel-types";
import { styleThemeId } from "@/lib/reel/engine/style-registry";
import { resolveTheme } from "@/lib/reel/engine/themes";

// How long a video clip plays when no custom trim is set (the trim UI is a later, Pro slice). The
// stills-only v1 reel rarely has video; this keeps a Pro video clip from dominating the montage.
const DEFAULT_VIDEO_CLIP_SEC = 3;

export type BuildReelPropsArgs = {
  /** The reel's media ids in order (ReelProvider.orderedIds — adds/removes/reorders reflect live). */
  orderedIds: string[];
  /** The page's already-presigned gallery media, indexed by id (no second presign / RPC). */
  byId: Map<string, GridMedia>;
  /** The catalog style id (mood or treatment). The theme is resolved from it via the pure registry. */
  styleId: string;
  seed: number;
  /** Output orientation (portrait default). Threaded into ReelProps → drives dims + the render hash. */
  orientation?: Orientation;
  /** Pin this media as the opening shot (hoisted to index 0). */
  coverMediaId?: string | null;
  /**
   * Cap the reel to ~this many seconds (null/0 = uncapped). Tier enforcement (billing-caps.md) happens in
   * the CALLERS: the composer and the render service both pass clampReelSeconds(tier, stored), so
   * Auto arrives here as the tier cap (30/60) — never null — and capToLength always runs.
   */
  lengthSeconds?: number | null;
  /** Stamp the free-tier "partyreel.com" wordmark (default false). Set from the host's tier. */
  watermark?: boolean;
};

/**
 * Turn the host's curated reel (ordered media + the chosen theme/seed/cover/length) into the ReelProps
 * the canvas engine renders (player + export). Pure + client-safe: reuses the already-presigned GridMedia
 * the page holds (no extra presign/RPC). Approved-only (mirrors ReelPanel). Photos use the small preview
 * (original fallback for pre-preview rows); videos ALWAYS use their poster still (a missing poster → an
 * empty url, which the engine draws as a theme-color hold, so the reel LENGTH still reflects the curation).
 */
export function buildReelProps(args: BuildReelPropsArgs): ReelProps {
  const {
    orderedIds,
    byId,
    styleId,
    seed,
    orientation,
    coverMediaId,
    lengthSeconds,
    watermark = false,
  } = args;

  // Resolve the styleId to its ReelTheme kit via the pure registry (mood: its own kit; treatment: its
  // designed native grade).
  const theme = resolveTheme(styleThemeId(styleId));

  // Resolve to approved-only media in reel order (a hidden/removed item drops out, as in ReelPanel).
  const ordered = orderedIds
    .map((id) => byId.get(id))
    .filter((m): m is GridMedia => !!m && m.status === "approved");

  // Hoist the cover to the front (the opening shot), if present + not already first.
  if (coverMediaId) {
    const idx = ordered.findIndex((m) => m.id === coverMediaId);
    if (idx > 0) {
      const [cover] = ordered.splice(idx, 1);
      ordered.unshift(cover);
    }
  }

  const clips: ReelClip[] = ordered.map((m) => {
    // The natural media geometry drives the cover-vs-fit framing (fitClip); unknown → cover (the safe default).
    const width = m.width ?? undefined;
    const height = m.height ?? undefined;
    if (m.type === "video") {
      // A video ALWAYS resolves to its poster still (the client-generated ~640px WebP): the poster is
      // the ONLY valid video source until the Pro motion-video slice, and it's what makes a video item
      // render at all. A missing poster ("" on the 3 legacy pre-preview rows) → an empty url, which the
      // engine draws as a theme-color hold (never the raw mp4 url the image-only asset loader can't decode).
      return {
        url: m.previewUrl ?? "",
        type: "video",
        width,
        height,
        trimStartSec: 0,
        trimDurationSec: DEFAULT_VIDEO_CLIP_SEC,
      };
    }
    // Photo: the small preview (preferred), original fallback (pre-preview backfill gap).
    return { url: m.previewUrl ?? m.url, type: "photo", width, height };
  });

  const capped =
    lengthSeconds && lengthSeconds > 0
      ? capToLength(clips, theme, seed, lengthSeconds)
      : clips;

  return { clips: capped, theme, seed, styleId, orientation, watermark };
}

/** Keep the clips whose cumulative timeline FINISHES within lengthSeconds (always at least the first).
 *  Uses the TransitionSeries plan (clips OVERLAP by their transition frames), and since the plan seeds by
 *  index, a prefix of the full plan == planning that prefix → the cap is deterministic + consistent. */
function capToLength(
  clips: ReelClip[],
  theme: ReelTheme,
  seed: number,
  lengthSeconds: number,
): ReelClip[] {
  if (clips.length <= 1) return clips;
  const plan = planReel({ clips, theme, seed });
  const lengthFrames = lengthSeconds * plan.fps;
  // Timeline at the END of clip k = Σ seq[0..k] − Σ gap[0..k-1] (monotonic → the survivors are a prefix).
  let cum = 0;
  let kept = 1;
  for (let k = 0; k < plan.clips.length; k++) {
    cum += plan.clips[k].durationInFrames;
    if (k > 0) cum -= plan.gaps[k - 1].durationInFrames;
    if (k === 0 || cum <= lengthFrames) kept = k + 1;
    else break;
  }
  return clips.slice(0, Math.max(1, kept));
}

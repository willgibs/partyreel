import { type GridMedia } from "@/components/app/media-grid";
// Import the PURE composition submodules directly (not the ./composition barrel) — the barrel re-exports
// Reel/Root, which pull in the `remotion` runtime, and this builder runs on the SERVER too (the render
// service). The barrel would drag `remotion`'s React.createContext into the server bundle and break the
// build. layout.ts + reel-types.ts have no remotion import.
import { layoutReel } from "@/lib/reel/composition/layout";
import type {
  ReelClip,
  ReelProps,
  ReelTheme,
} from "@/lib/reel/composition/reel-types";

// How long a video clip plays when no custom trim is set (the trim UI is a later, Pro slice). The
// stills-only v1 reel rarely has video; this keeps a Pro video clip from dominating the montage.
const DEFAULT_VIDEO_CLIP_SEC = 3;

export type BuildReelPropsArgs = {
  /** The reel's media ids in order (ReelProvider.orderedIds — adds/removes/reorders reflect live). */
  orderedIds: string[];
  /** The page's already-presigned gallery media, indexed by id (no second presign / RPC). */
  byId: Map<string, GridMedia>;
  theme: ReelTheme;
  seed: number;
  /** Pin this media as the opening shot (hoisted to index 0). */
  coverMediaId?: string | null;
  /** Cap the reel to ~this many seconds (null/0 = auto). */
  lengthSeconds?: number | null;
  /**
   * Player shows video clips by their poster still (default true — the in-browser player can't decode
   * R2 video over CORS). The export passes false → a real <Video> from the original mp4 url.
   */
  posterMode?: boolean;
  /** Stamp the free-tier "partyreel.com" wordmark (default false). Set from the host's tier. */
  watermark?: boolean;
};

/**
 * Turn the host's curated reel (ordered media + the chosen theme/seed/cover/length) into the ReelProps
 * the @remotion/player renders. Pure + client-safe: reuses the already-presigned GridMedia the page
 * holds (no extra presign/RPC). Approved-only (mirrors ReelPanel). Photos use the small preview (original
 * fallback for pre-preview rows); videos use the poster in posterMode (a missing poster → an empty url,
 * which the composition renders as a theme-color hold, so the reel LENGTH still reflects the curation).
 */
export function buildReelProps(args: BuildReelPropsArgs): ReelProps {
  const {
    orderedIds,
    byId,
    theme,
    seed,
    coverMediaId,
    lengthSeconds,
    posterMode = true,
    watermark = false,
  } = args;

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
    if (m.type === "video") {
      // Poster = the small WebP (new uploads); "" on pre-preview rows → the composition placeholder.
      const poster = m.previewUrl ?? "";
      return {
        url: posterMode ? poster : (m.url ?? ""),
        type: "video",
        trimStartSec: 0,
        trimDurationSec: DEFAULT_VIDEO_CLIP_SEC,
      };
    }
    // Photo: the small preview (preferred), original fallback (pre-preview backfill gap).
    return { url: m.previewUrl ?? m.url, type: "photo" };
  });

  const capped =
    lengthSeconds && lengthSeconds > 0
      ? capToLength(clips, theme, seed, lengthSeconds)
      : clips;

  return { clips: capped, theme, seed, posterMode, watermark };
}

/** Keep the clips whose playback FINISHES within lengthSeconds (always at least the first clip). */
function capToLength(
  clips: ReelClip[],
  theme: ReelTheme,
  seed: number,
  lengthSeconds: number,
): ReelClip[] {
  if (clips.length <= 1) return clips;
  const { placed } = layoutReel({ clips, theme, seed });
  // fromSec + activeSec is monotonically increasing, so the survivors are a contiguous prefix.
  const keptCount = placed.filter(
    (p, i) => i === 0 || p.fromSec + p.activeSec <= lengthSeconds,
  ).length;
  return clips.slice(0, Math.max(1, keptCount));
}

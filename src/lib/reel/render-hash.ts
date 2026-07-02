import { createHash } from "node:crypto";

// Bump when the COMPOSITION changes in a way that alters output for the same inputs, so cached .mp4s from
// an older composition re-render. Folded into the hash below. v2: the style catalog + orientation (the
// StyleDispatch composition; requires a paired `deploy-site` so the Lambda bundle matches the player).
export const RENDER_VERSION = 2;

export type RenderHashInput = {
  /** The ordered, approved, present reel media ids — captures membership + approval + order in one list. */
  orderedApprovedIds: string[];
  /** The catalog style id (mood or treatment) — different style => a different composition => a new mp4. */
  styleId: string;
  /** Output orientation — different orientation => different dims/framing => a new mp4. */
  orientation: string;
  seed: number;
  lengthSeconds: number | null;
  coverMediaId: string | null;
  watermark: boolean;
};

/**
 * The render IDENTITY hash — the cache key for the reel .mp4. Any change to membership / order / approval
 * / style / orientation / seed / length / cover / watermark (or the composition version) yields a new hash →
 * a re-encode; an unchanged reel re-serves the existing mp4 for $0. Built from media IDs (not the ephemeral
 * presigned URLs), so it's stable across presigns. The cover-hoist + length-cap are deterministic downstream
 * transforms of these inputs, so they don't need to be in the hash.
 */
export function renderHash(input: RenderHashInput): string {
  const canonical = JSON.stringify({
    ids: input.orderedApprovedIds,
    style: input.styleId,
    orientation: input.orientation,
    seed: input.seed,
    length: input.lengthSeconds,
    cover: input.coverMediaId,
    watermark: input.watermark,
    v: RENDER_VERSION,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

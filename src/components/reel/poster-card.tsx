/**
 * A CLIP'S FACTS, SAID THE ONE WAY ("0:30 · Cinematic · 8 moments"), which the clip creator's head reads.
 *
 * ★ The file keeps its name for its importer (`clip-creator.tsx`): the `PosterCard` it was named for, the reel's
 * face over the album, left with the reel tile it drew (`event-header` r1 put the cover in its place) and with the
 * marketing picture that was its last caller (retired-mocks).
 */

/** `0:30` from a second count (mm:ss, minutes uncapped). */
export function formatReelDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/**
 * A clip's line: `0:30 · Cinematic · 8 moments`. One formatter, so the clip creator's head and the
 * lab boards that draw it keep the separator, the pluralization and the ORDER identical. Any part
 * may be absent (an unknown style, a clip with no moments yet); absent parts drop out rather than
 * rendering an empty segment.
 */
export function formatReelMeta(parts: {
  durationLabel?: string | null;
  styleLabel?: string | null;
  momentCount?: number | null;
}): string {
  const { durationLabel, styleLabel, momentCount } = parts;
  const segments = [
    durationLabel || null,
    styleLabel || null,
    momentCount != null && momentCount > 0
      ? `${momentCount} ${momentCount === 1 ? "moment" : "moments"}`
      : null,
  ].filter((s): s is string => s !== null);
  return segments.join(" · ");
}

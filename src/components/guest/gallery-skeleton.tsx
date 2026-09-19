import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import { Skeleton } from "@/components/ui/skeleton";

// The streaming fallback for the guest gallery (Phase 3): the shell paints
// immediately while the presign-heavy gallery payload streams in. Mirrors the
// masonry's geometry so the swap is layout-stable; the shimmer is the Phase 2
// skeleton treatment.

/** The two columns a phone always shows: three tiles deep, about a screen. */
const PHONE_RATIOS = ["4/5", "1/1", "3/4", "4/3", "1/1", "4/5"];
/**
 * The rest, which exist only once the album has left the phone's two columns
 * (Will's `width=full`, 2026-09-19). Six tiles spread across a 1920 window is
 * ONE thin row of shimmer, which reads as a broken album rather than a loading
 * one; eighteen keeps it two or three deep at every count the width rule
 * produces (5, 6 and 8 columns at 1280, 1512 and 1920) without making a phone
 * scroll past nine shimmering rows before the photographs land.
 */
const WIDE_RATIOS = [
  "3/4",
  "1/1",
  "4/5",
  "4/3",
  "4/5",
  "1/1",
  "3/4",
  "4/3",
  "1/1",
  "4/5",
  "4/3",
  "3/4",
];

export function GallerySkeleton() {
  return (
    <section className="mt-9" aria-hidden>
      {/* Stands in for the gallery's "Download all" control, which sits at the
          album's RIGHT edge — `ml-auto`, because on a full-width album a
          placeholder parked on the left is most of a window away from the
          thing it is standing in for. */}
      <Skeleton className="mb-3 ml-auto h-5 w-36" />
      {/* Mirrors guest-masonry.tsx: the SHARED column rule (shared/masonry.tsx)
          at varied heights, on the ONE gallery gap and the photograph's corner.
          The rule and the tokens are read, never their values, so the skeleton
          cannot drift from the grid it stands in for — which it did the moment
          the grid stopped being two columns. */}
      <div className={GALLERY_COLUMNS}>
        {PHONE_RATIOS.map((ratio, i) => (
          <Skeleton
            key={`p${i}`}
            className="mb-[var(--gap-gallery)] w-full rounded-tile"
            style={{ aspectRatio: ratio }}
          />
        ))}
        {WIDE_RATIOS.map((ratio, i) => (
          <Skeleton
            key={`w${i}`}
            className="mb-[var(--gap-gallery)] hidden w-full rounded-tile sm:block"
            style={{ aspectRatio: ratio }}
          />
        ))}
      </div>
    </section>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

// The streaming fallback for the guest gallery (Phase 3): the shell paints
// immediately while the presign-heavy gallery payload streams in. Mirrors the
// masonry's geometry so the swap is layout-stable; the shimmer is the Phase 2
// skeleton treatment.
export function GallerySkeleton() {
  return (
    <section className="mt-9" aria-hidden>
      <Skeleton className="mb-3 h-5 w-36" />
      {/* Mirrors guest-masonry.tsx: CSS columns at varied heights, on the ONE
          gallery gap and the photograph's corner (the tokens, never their
          pixels, so the skeleton cannot drift from the grid it stands in for). */}
      <div className="columns-2 gap-[var(--gap-gallery)]">
        {["4/5", "1/1", "3/4", "4/3", "1/1", "4/5"].map((ratio, i) => (
          <Skeleton
            key={i}
            className="mb-[var(--gap-gallery)] w-full rounded-tile"
            style={{ aspectRatio: ratio }}
          />
        ))}
      </div>
    </section>
  );
}

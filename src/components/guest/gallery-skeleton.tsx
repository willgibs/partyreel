import { Skeleton } from "@/components/ui/skeleton";

// The streaming fallback for the guest gallery (Phase 3): the shell paints
// immediately while the presign-heavy gallery payload streams in. Mirrors the
// grid geometry (2/3-col, square tiles, 2px gaps) so the swap is layout-stable;
// the shimmer is the Phase 2 skeleton treatment.
export function GallerySkeleton() {
  return (
    <section className="mt-9" aria-hidden>
      <Skeleton className="mb-3 h-5 w-36" />
      {/* Mirrors the masonry geometry (columns + varied heights + 3px gaps). */}
      <div className="columns-2 gap-[3px]">
        {["4/5", "1/1", "3/4", "4/3", "1/1", "4/5"].map((ratio, i) => (
          <Skeleton
            key={i}
            className="mb-[3px] w-full rounded-[3px]"
            style={{ aspectRatio: ratio }}
          />
        ))}
      </div>
    </section>
  );
}

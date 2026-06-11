import { Skeleton } from "@/components/ui/skeleton";

// The streaming fallback for the guest gallery (Phase 3): the shell paints
// immediately while the presign-heavy gallery payload streams in. Mirrors the
// grid geometry (2/3-col, square tiles, 2px gaps) so the swap is layout-stable;
// the shimmer is the Phase 2 skeleton treatment.
export function GallerySkeleton() {
  return (
    <section className="mt-9" aria-hidden>
      <Skeleton className="mb-3 h-5 w-36" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </section>
  );
}

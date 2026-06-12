import { Skeleton } from "@/components/ui/skeleton";

/**
 * Per-boundary fallbacks for the streamed dashboard (Phase 5 S1). Each mirrors
 * its section's real geometry so the skeleton -> content swap doesn't jump
 * (the Phase-3 loading.tsx conventions: layout-stable, no top-level padding).
 */

export function StorageCardSkeleton() {
  return (
    <div
      aria-busy
      className="rounded-lg border border-border bg-card px-4 py-3"
    >
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="mt-2 h-2 w-full rounded-full" />
      <Skeleton className="mt-2 h-3 w-3/5" />
    </div>
  );
}

/** Event-card grids (Events + Trash tabs): aspect-video card shapes. */
export function EventGridSkeleton() {
  return (
    <div
      aria-busy
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i}>
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-1.5 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/** Media grids (Uploads + Likes tabs): the square tile field (masonry in S3). */
export function MediaGridSkeleton() {
  return (
    <div aria-busy className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="aspect-square w-full rounded-lg" />
      ))}
    </div>
  );
}

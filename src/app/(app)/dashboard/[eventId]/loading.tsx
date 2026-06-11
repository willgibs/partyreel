import { Skeleton } from "@/components/ui/skeleton";

// Streaming fallback for the event detail page (Phase 3 scaffold): it presigns
// two URLs per media item before paint; this holds the shape meanwhile. The
// (app) layout's AppShell already supplies <main> + Container chrome, so this
// returns a BARE root matching the page's own (<div className="space-y-8">).
// The per-section Suspense decomposition is Phase 5's (the host redesign).
export default function EventDetailLoading() {
  return (
    <div className="space-y-8" aria-busy>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-8 w-32 rounded-action-sm" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div>
        <Skeleton className="mb-3 h-5 w-36" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

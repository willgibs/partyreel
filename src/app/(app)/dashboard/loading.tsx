import { Skeleton } from "@/components/ui/skeleton";

// Streaming fallback for the dashboard (Phase 3 scaffold): the page awaits 7
// parallel queries before paint; this holds the layout shape meanwhile. The
// (app) layout's AppShell already supplies <main> + Container chrome, so this
// returns a BARE root matching the page's own (<div className="space-y-6">).
// The per-section Suspense decomposition is Phase 5's (the host redesign).
export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-8 w-28 rounded-action-sm" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-6 w-16" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-72 w-full" />
        ))}
      </div>
    </div>
  );
}

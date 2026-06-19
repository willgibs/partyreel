import { Skeleton } from "@/components/ui/skeleton";

// Navigation fallback for the dashboard (blocking RSC — streaming deferred, S1).
// Mirrors the single-feed shell so the route swap doesn't jump: header + the
// ambient storage meter + the filter chips + the lead event cards. The (app)
// layout's AppShell already supplies <main> + Container chrome, so this returns a
// BARE root matching the page's own (<div className="space-y-6">).
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
      {/* ambient storage meter */}
      <Skeleton className="h-5 w-full" />
      {/* filter chips */}
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>
      {/* lead event cards (V3, 16:10) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="aspect-[16/10] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

import {
  EventGridSkeleton,
  StorageCardSkeleton,
} from "@/components/app/dashboard/dashboard-skeletons";

// Route-transition fallback for the dashboard: covers the page's BLOCKING
// awaits (profile + the event head-count for the welcome gate + header);
// once the shell streams, the per-section Suspense fallbacks in page.tsx
// take over (Phase 5 S1) - this mirrors that shell so the handoff doesn't
// jump. The (app) layout's AppShell supplies <main> + Container chrome, so
// this returns a BARE root matching the page's own (<div space-y-6>).
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
      <StorageCardSkeleton />
      <div className="flex gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-6 w-16" />
        ))}
      </div>
      <EventGridSkeleton />
    </div>
  );
}

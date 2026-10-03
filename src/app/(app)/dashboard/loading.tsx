import { RouteSkeleton } from "@/components/shared/route-skeleton";

// Navigation fallback for the dashboard (blocking RSC; streaming deferred, S1). The shape is the
// dashboard's own (`components/app/dashboard/dashboard-skeleton.tsx`), drawn through the one route
// skeleton (`app-vocabulary` r1, `loading=asneeded`), which holds the app bar's trail through the wait.
export default function DashboardLoading() {
  return <RouteSkeleton variant="pulse" />;
}

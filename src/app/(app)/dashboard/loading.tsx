import { RouteSkeleton } from "@/components/shared/route-skeleton";

// Navigation fallback for the dashboard (blocking RSC — streaming deferred, S1).
// The shape lives in RouteSkeleton now (`app-vocabulary` r1, `loading=asneeded`):
// one shared primitive wired to exactly the routes with a real pre-paint wait.
export default function DashboardLoading() {
  return <RouteSkeleton variant="pulse" />;
}

import { RouteSkeleton } from "@/components/shared/route-skeleton";

/**
 * The hub's streaming fallback. It presigns two URLs per media item before
 * paint, so this holds the shape meanwhile. The shape lives in RouteSkeleton
 * now (`app-vocabulary` r1, `loading=asneeded`): one shared primitive wired
 * to exactly the routes with a real pre-paint wait.
 */
export default function EventDetailLoading() {
  return <RouteSkeleton variant="hub" />;
}

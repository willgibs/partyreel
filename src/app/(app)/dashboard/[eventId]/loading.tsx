import { RouteSkeleton } from "@/components/shared/route-skeleton";

/**
 * The hub's streaming fallback. The page reads the album's manifest and mints
 * its first window's links (and its other reads) before paint, so this holds the
 * shape meanwhile. The shape lives in RouteSkeleton (`app-vocabulary` r1,
 * `loading=asneeded`): one shared primitive wired to exactly the routes with a
 * real pre-paint wait.
 */
export default function EventDetailLoading() {
  return <RouteSkeleton variant="hub" />;
}

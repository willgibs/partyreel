import { RouteSkeleton } from "@/components/shared/route-skeleton";

/**
 * The welcome's wait (crumbs-44). The page reads the account, its claimable rows, its hosted count
 * and its Guest cards before the first step can paint, so a new account's first screen in the app
 * was a frozen one. The shape is the name step's (RouteSkeleton, `loading=asneeded`), since that is
 * the screen a first visit opens on.
 */
export default function WelcomeLoading() {
  return <RouteSkeleton variant="welcome" />;
}

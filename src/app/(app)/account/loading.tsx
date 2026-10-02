import { RouteSkeleton } from "@/components/shared/route-skeleton";

/**
 * Account's wait (crumbs-44). The page reads fourteen things at once and then presigns the picker's
 * covers before it can draw its first card, so a press on the user menu's Account froze the page it
 * came from for the whole of it. The shape lives in RouteSkeleton (`loading=asneeded`: one shared
 * primitive wired to exactly the routes with a real pre-paint wait), on the page's own column. The
 * name gate in this segment's layout still runs first: a nameless account goes to the welcome before
 * any of this paints.
 */
export default function AccountLoading() {
  return <RouteSkeleton variant="account" />;
}

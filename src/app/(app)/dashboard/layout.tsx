import { requireNamedProfile } from "@/app/(app)/name-gate";

// THE NAME GATE for every /dashboard route (name-gate, 2026-09-22): the root,
// /dashboard/new, and every /dashboard/[eventId]/* room (the album, guests,
// reel, review, settings) all render inside this one layout, so requireNamedProfile()
// covers them in a single call instead of one page check apiece. See
// name-gate.ts for why this is a sibling layout (not a nested `(named)` route
// group) and why it reads getProfile() rather than the header's
// getProfileMenu(). The (app) layout above this one has already redirected an
// unauthenticated request to /login, so only the name is checked here.
//
// The dashboard root and /dashboard/new ALSO keep their own inline
// needsDisplayName redirect (belt and braces, Will's brief): the root's also
// carries shouldShowWelcome (the separate first-time-tour marker), which is
// not this gate's concern.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireNamedProfile();
  return children;
}

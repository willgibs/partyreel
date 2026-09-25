import "server-only";

import { redirect } from "next/navigation";

import { getProfile } from "@/lib/db/queries/profile";
import { needsDisplayName } from "@/lib/welcome";

/**
 * THE NAME GATE, IN ONE PLACE.
 *
 * "I wanted to ensure an account without a name wasn't moving
 * around the app as a normal user. Name always required, even if one
 * character." Every account is born
 * nameless (`handle_new_user` leaves `display_name` NULL for every signup,
 * even OAuth); the welcome page's guarded, profanity-checked write is the only
 * place a name can land (auth-accounts.md). Before this gate, only
 * `/dashboard` and `/dashboard/new` redirected a nameless profile to
 * `/welcome` — `/account` and every `/dashboard/[eventId]/*` room rendered
 * normally for one.
 *
 * Call this from a route's own `layout.tsx` to close that gap for the whole
 * subtree under it in one place. `/welcome` deliberately never calls it (see
 * its page comment): a brand-new nameless account has to reach the one page
 * that can name it, or it could never leave `/welcome` at all.
 *
 * WHY a helper called from two layouts (`dashboard/layout.tsx`,
 * `account/layout.tsx`) rather than one shared `(named)` route group wrapping
 * both, as the track's brief recommended first: moving `dashboard/` and
 * `account/` under a nested group leaves their colocated `actions.ts` /
 * `claims-actions.ts` / `social-actions.ts` files at a new path, and about 45
 * import sites across the tree hardcode the OLD path
 * (`@/app/(app)/dashboard/actions`, `@/app/(app)/account/actions`, etc.) —
 * most of them outside this lane entirely (every admin route's `actions.ts`
 * under `src/app/admin`, several components under `src/components/admin` and
 * `src/components/social`, `src/lib/auth/admin-context.ts`,
 * `src/lib/errors/codes.test.ts`). Rewriting
 * all of them is a lane-ownership violation for a one-line-exception budget,
 * and the brief's own suggested fallback (a pathname header read in the root
 * `(app)/layout.tsx`) needs a new header from `src/proxy.ts`, which this track
 * only reads. Two call sites and one function reads as close to "once, in one
 * place" as this tree allows without either cost — see name-gate's Handoff.
 *
 * WHY `getProfile()` and not the narrower `getProfileMenu()`: `getProfile()`
 * is the SAME `cache()`-wrapped, zero-arg read that `dashboard/page.tsx`,
 * `dashboard/new/page.tsx`, `dashboard/[eventId]/page.tsx`,
 * `dashboard/[eventId]/reel/page.tsx` and `account/page.tsx` already make —
 * so on every one of those routes this call is free (React's cache() dedupes
 * it within the request). `getProfileMenu()` is a DIFFERENT, uncached call the
 * parent `(app)` layout already makes for the header; calling it again here
 * would double that network round trip on every request instead of reusing it.
 */
export async function requireNamedProfile(): Promise<void> {
  const profile = await getProfile();
  if (needsDisplayName(profile?.display_name)) {
    redirect("/welcome");
  }
}

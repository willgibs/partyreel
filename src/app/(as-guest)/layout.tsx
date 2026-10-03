import type { Viewport } from "next";
import { redirect } from "next/navigation";

import { loginPathForRequest } from "@/lib/auth/login-redirect";
import { getRequestAuth } from "@/lib/supabase/request-auth";

/**
 * SEE IT AS A GUEST'S OWN GROUP, AND WHY IT IS A GROUP AT ALL (event-header r2, `rooms=over`).
 *
 * ★ A GUEST'S PHONE NEVER WEARS THE HOST'S SHELL. Every host route renders inside `(app)/layout.tsx`, which is
 * `AppShell`: the sticky bar with the logo, the bell and the account menu. Her album as her guests meet it is the
 * guest page's canvas, the guest's own header white on the cover, so the shell is not rendered here at all, the
 * structural answer `(print)` gives its sheet: a rule that hid the shell would fire on a page the shell also serves.
 *
 * ★ THE URL STILL BEGINS `/dashboard`, DELIBERATELY: `/dashboard/<id>/as-guest`, a route of the event's own under
 * the hub it is opened from, kept off the admin host with every host route by the surface rule.
 *
 * ★ AND SO THE GATE IS RE-DECLARED HERE, as `(print)`'s is: this layout does NOT inherit the `(app)` gate (a page
 * that looks protected because its sibling is, the trap a new group sets). `getUser()` (never `getSession()`) runs
 * first, and the page proves the event is hers through RLS on top of it.
 *
 * The guest page's own canvas (`(guest)/layout.tsx`): one column, no host chrome, the keyboard's resize the same.
 * Not a ROOT layout: `src/app/layout.tsx` still owns <html> and <body>, its fonts, tokens and providers.
 */
export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
};

export default async function AsGuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getRequestAuth();
  if (!user) redirect(await loginPathForRequest());
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}

import { redirect } from "next/navigation";

import { getRequestAuth } from "@/lib/supabase/request-auth";

/**
 * THE PRINT GROUP, AND WHY IT IS A GROUP AT ALL (Will, `venue=sheet`, 2026-09-21).
 *
 * ★ THE APP SHELL MUST NEVER REACH THE PRINTER. Every host route renders inside
 * `(app)/layout.tsx`, which is `AppShell` — a STICKY header with the logo, the
 * bell and the account menu. A sticky element prints on every sheet, so a page
 * of nine table cards would come out with the app's chrome stamped across the
 * top of it and the ninth card pushed onto a second page. Hiding it with a
 * print rule would mean a rule that fires on a page the shell also serves, and
 * the house doctrine is one opt-in hook and nothing global. A route GROUP is
 * the structural answer: the shell is not rendered, so there is nothing to hide.
 *
 * ★ THE URL STILL BEGINS `/dashboard`, DELIBERATELY. A route group contributes
 * nothing to the path, so this layout serves `/dashboard/<id>/print` exactly as
 * if it lived under `(app)` — the surface rule keeps it off the admin host with
 * every other host route, a bookmark reads as what it is, and there is no second
 * top-level path to remember to protect.
 *
 * ★ AND SO THE GATE IS RE-DECLARED HERE. This layout does NOT inherit the
 * `(app)` gate, which is exactly the trap a new group sets: a page that looks
 * protected because its sibling is. `getUser()` (never `getSession()`: the
 * proxy only refreshes the cookie and is not a security boundary) runs first,
 * and the page re-checks the event through RLS on top of it.
 *
 * Not a ROOT layout: `src/app/layout.tsx` still owns <html> and <body>, so this
 * one renders a fragment and inherits the fonts, the tokens and the providers.
 */
export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getRequestAuth();
  if (!user) redirect("/login");
  // surface-paper forces the whole subtree light (globals.css): the host app is
  // dark, paper is not, and a print preview that shows white-on-black is a print
  // preview nobody trusts.
  return (
    <div className="surface-paper flex min-h-0 flex-1 flex-col bg-background text-foreground">
      {children}
    </div>
  );
}

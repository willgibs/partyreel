import { redirect } from "next/navigation";
import { after } from "next/server";

import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { touchHostActive } from "@/lib/db/mutations/profile";
import { createClient } from "@/lib/supabase/server";

// Auth GATE for the host app. Every route in the (app) group renders inside
// this layout, so this one getUser() check protects all of them at once.
//
// WHY getUser() and never getSession(): getUser() re-validates the JWT with the
// Supabase Auth server; getSession() only decodes the cookie, which a client
// can spoof. The proxy (src/proxy.ts) keeps the cookie fresh but is NOT a
// security boundary — authz is enforced here AND must be re-checked inside every
// Server Function / RPC that touches data (RLS is the real boundary).
//
// WHY login/callback aren't in this group: they live in (auth). If /login sat
// under this gate, an anonymous visitor redirected to /login would re-trigger
// the gate → infinite loop.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Bump the host's activity clock for free-tier inactivity removal — after the response,
  // throttled, best-effort (never blocks/breaks the gate). Covers sign-in + any host use.
  after(() => touchHostActive(user.id));

  // OAuth (Google) populates user_metadata.full_name; magic-link users won't
  // have one, so the menu falls back to the email for its label + initial.
  const metaName = user.user_metadata?.full_name;
  const displayName = typeof metaName === "string" ? metaName : null;

  return (
    <AppShell
      headerActions={
        <UserMenu email={user.email ?? null} displayName={displayName} />
      }
    >
      {children}
    </AppShell>
  );
}

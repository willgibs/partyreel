import { redirect } from "next/navigation";

import { AppShell } from "@/components/shared/app-shell";
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

  return <AppShell>{children}</AppShell>;
}

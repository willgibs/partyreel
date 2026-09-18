import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Logo } from "@/components/shared/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isAdminHost } from "@/lib/auth/admin-host";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Log in" };

// Server shell around the client <LoginForm/>. WHY this lives in (auth) and NOT
// (app): the (app) layout gates on getUser() and redirects anonymous visitors to
// /login — if /login sat under that gate it would redirect to itself forever.
// Keep all unauthenticated entry points (login, callback) out of (app).
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Already signed in? Skip the form and go into the app — so a logged-in visitor
  // clicking "Log in" from marketing isn't forced through sign-in again (their
  // session is still valid; it just wasn't being checked here). getUser() (never
  // getSession) re-validates the JWT. Host-aware target mirrors the auth callback:
  // admin subdomain → /admin, everything else → /dashboard. This is the ONLY thing
  // that redirects authenticated users away from /login; an anonymous visitor falls
  // straight through to the form below, so there's no loop (and /login stays in
  // (auth), outside the (app) gate, on purpose).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const host = (await headers()).get("host");
    redirect(isAdminHost(host) ? "/admin" : "/dashboard");
  }

  // Next 16: searchParams is a Promise. The callback route bounces a failed code
  // exchange back here with ?error=auth_callback.
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="Partyreel home">
            <Logo />
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            {/* The gate card's rank, the same step the admin gate's title
                takes: a max-w-sm card that IS the screen reads a step over a
                card's own title (the ladder, never a stock size). */}
            <CardTitle className="text-subsection">
              Welcome to Partyreel
            </CardTitle>
            <CardDescription>
              Sign in to create events and collect photos from your guests. No
              app, no fuss.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error === "auth_callback" && (
              <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                That sign-in link didn&rsquo;t work. It may have expired. Try
                again below.
              </p>
            )}
            <LoginForm />
          </CardContent>
        </Card>
        <LegalConsentLine className="mt-6 text-center" />
      </div>
    </div>
  );
}

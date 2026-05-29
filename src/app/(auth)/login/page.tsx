import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/shared/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
            <CardTitle className="text-lg">Welcome to Partyreel</CardTitle>
            <CardDescription>
              Sign in to create events and collect photos from your guests — no
              app, no fuss.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error === "auth_callback" && (
              <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                That sign-in link didn&rsquo;t work — it may have expired. Try
                again below.
              </p>
            )}
            <LoginForm />
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

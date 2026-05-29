import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Log in" };

// Placeholder. Phase 1 wires Supabase Auth (email magic link + OAuth) here, and
// the /auth/callback route exchanges the returned code for a session.
//
// WHY this lives in the (auth) group and NOT (app): the (app) layout gates on
// getUser() and redirects anonymous visitors to /login. If /login were under
// that gate, it would redirect to itself forever. Keep all unauthenticated
// entry points (login, callback) out of (app).
export default function LoginPage() {
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
              Sign-in arrives in the next build. Hosts will log in with email or
              a social account to create events.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button disabled className="w-full">
              Continue with email
            </Button>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/">
                <ArrowLeft /> Back home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

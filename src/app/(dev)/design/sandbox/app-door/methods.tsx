"use client";

import type { ReactNode } from "react";
import { Mail } from "lucide-react";

import { EmailSignIn } from "@/components/auth/email-sign-in";
import { GoogleIcon } from "@/components/auth/google-icon";
import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/**
 * WHAT THE DOOR ASKS FOR, IN THREE LADDERS.
 *
 * ★ THE BODIES ARE THE SHIPPED COMPONENTS. `LoginForm` (which is `PasswordAuth`
 * over the shared `EmailSignIn`, a divider and Google) is imported whole for
 * the lead it already is; `EmailSignIn` is imported whole for the code lead;
 * the Google button is the shipped `Button` wearing the shipped `GoogleIcon`.
 * The question is which of them a door LEADS with, not what any of them says,
 * and `auth.test.ts` governs the behaviour under all three.
 *
 * ★ WHAT THIS BOARD DOES NOT DRAW: the screens that exist only as another
 * component's INTERNAL state. `EmailSignIn` flips to the code screen on its
 * own `sentTo` and `PasswordAuth` flips to "Pick a password" on its own
 * `phase`, and no prop reaches either. Every question here is about the FIRST
 * screen a door shows, so none of them is needed; a later round that asks
 * about the code step itself has to quote it rather than press into it.
 *
 * ★ `login-form.tsx` REDRAWS THE GOOGLE "G" BY HAND, five lines from the
 * shared `google-icon.tsx` every other surface imports (seam 2 in the
 * Orchestrator's map). Nothing on this board reproduces that: every Google
 * button here is the shared icon, including inside `LoginForm`, where it is
 * the hand-drawn copy. They are pixel-identical today, which is exactly why
 * the second copy is a seam rather than a bug — and why it will drift.
 */

export type Lead = "password" | "code" | "google";

export const leadOf = (v: string | undefined): Lead =>
  v === "code" ? "code" : v === "google" ? "google" : "password";

/** The divider every method ladder uses today, quoted from login-form.tsx. */
export function Or() {
  return (
    <div className="flex items-center gap-3">
      <Separator className="flex-1" />
      <span className="text-xs text-muted-foreground">or</span>
      <Separator className="flex-1" />
    </div>
  );
}

/** The shipped Google button: `Button` plus the SHARED icon. */
export function GoogleButton({
  lead = false,
  label = "Continue with Google",
}: {
  /** The lead gets the filled button; a second method keeps the outline. */
  lead?: boolean;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant={lead ? "default" : "outline"}
      className="w-full"
    >
      <GoogleIcon /> {label}
    </Button>
  );
}

/** A quiet link under a ladder, the shape login-form.tsx already uses. */
export function QuietLink({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
    >
      {children}
    </button>
  );
}

/**
 * THE PASSWORD FORM ALONE, quoted from `password-sign-in.tsx`'s `SignIn`: the
 * two fields, "Forgot password?" and the button, without the link row under
 * them and without the divider and Google below it.
 *
 * ★ IT EXISTS BECAUSE OF A CAPTURE. The failure option that promotes the
 * recoveries into buttons was first drawn over the whole shipped `LoginForm`,
 * which carries its own "Email me a code instead" link and its own Continue
 * with Google: the tile showed each of them twice, forty pixels apart, and
 * read as a bug rather than as an option. Promoting a link means the link goes.
 */
export function PasswordOnly() {
  return (
    <form className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="ad-fail-email">Email</Label>
        <Input
          id="ad-fail-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="ad-fail-password">Password</Label>
          <span className="text-xs text-muted-foreground">Forgot password?</span>
        </div>
        <Input
          id="ad-fail-password"
          type="password"
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" className="w-full">
        Sign in
      </Button>
    </form>
  );
}

/**
 * THE THREE LEADS, each one the first screen a stranger meets.
 *
 * `password` is the shipped `LoginForm` and nothing else, so what is judged is
 * the door as it stands today: the two fields, "Forgot password?", the two
 * links under them, then the divider and Google. The other two are built from
 * the same shipped parts in a different order.
 */
export function LeadDoor({ lead }: { lead: Lead }) {
  if (lead === "password") return <LoginForm />;

  if (lead === "code")
    return (
      <div className="space-y-4">
        {/* One field, and it is the shipped one: the same email creates the
            account or signs it in, which is why this lead has no second path
            for "new here" at all. */}
        <EmailSignIn emailRedirectTo="lab" onVerified={() => {}} />
        <Or />
        <GoogleButton />
        <QuietLink>Have a password? Use it instead</QuietLink>
      </div>
    );

  // `google`: one press carries most arrivals, and email is the second door.
  return (
    <div className="space-y-4">
      <GoogleButton lead />
      <Or />
      <Button type="button" variant="outline" className="w-full">
        <Mail /> Continue with email
      </Button>
      <QuietLink>Have a password? Use it instead</QuietLink>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";

import { EmailSignIn } from "@/components/auth/email-sign-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";
import { createClient } from "@/lib/supabase/client";
import { signInSchema } from "@/lib/validation/auth";

// Shown on the /e/ page when the host requires an account to upload (allow_anonymous_uploads =
// false). All roads lead to an account: email is PRIMARY (one tap sends a code + magic link that
// creates the account or logs in, no password needed), with a subtle password option for returning
// users. After auth, router.refresh() re-runs the page RSC, which then shows the name step (a brand-
// new account) or the upload panel. The gallery stays visible behind this -- viewing is always
// allowed; only uploading needs the account.
export function EnterEventPrompt({ qrToken }: { qrToken: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"email" | "password">("email");
  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=/e/${qrToken}`
      : `/auth/callback?next=/e/${qrToken}`;

  return (
    <div className="rounded-xl border border-border bg-card p-5 text-center">
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
        <LogIn className="size-5" />
      </div>
      <p className="text-sm font-medium">Enter event to add photos</p>
      <p className="mx-auto mt-1 mb-4 max-w-xs text-sm text-muted-foreground">
        This event asks guests to sign in first. We&rsquo;ll email you a one-tap
        link, no password needed.
      </p>
      <div className="mx-auto max-w-xs text-left">
        {mode === "email" ? (
          <>
            <EmailSignIn
              emailRedirectTo={emailRedirectTo}
              onVerified={async () => {
                // In-page OTP verify does router.refresh() (no remount), so claim directly here. Silent:
                // the guest page isn't the account context + must not stack with other toasts.
                await claimAnonymousUploads({ silent: true });
                router.refresh();
              }}
            />
            <button
              type="button"
              onClick={() => setMode("password")}
              className="mt-3 w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Have a password? Log in
            </button>
          </>
        ) : (
          <PasswordLogin
            onSignedIn={async () => {
              // Password sign-in is in-page (no remount); claim directly, silent (see above).
              await claimAnonymousUploads({ silent: true });
              router.refresh();
            }}
            onUseEmail={() => setMode("email")}
          />
        )}
      </div>
    </div>
  );
}

// Secondary path for returning users who set a password. Signs in on the browser client, then
// refreshes so the page re-gates (to the name step or the upload panel). A generic error on
// failure (account enumeration safety) that points back to the email link.
function PasswordLogin({
  onSignedIn,
  onUseEmail,
}: {
  onSignedIn: () => void;
  onUseEmail: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form and retry.");
      return;
    }
    start(async () => {
      setError(null);
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError(
          "That email and password didn't match. Try the email link instead.",
        );
        return;
      }
      onSignedIn();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-3"
    >
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-1.5">
        <Label htmlFor="enter-email">Email</Label>
        <Input
          id="enter-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="enter-password">Password</Label>
        <div className="relative">
          <Input
            id="enter-password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground active:scale-90"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Log in"}
      </Button>
      <button
        type="button"
        onClick={onUseEmail}
        className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Use an email link instead
      </button>
    </form>
  );
}

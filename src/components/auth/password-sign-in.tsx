"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { EmailSignIn } from "@/components/auth/email-sign-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginTarget } from "@/lib/auth/admin-host";
import { setPasswordSchema, signInSchema } from "@/lib/validation/auth";
import { createClient } from "@/lib/supabase/client";

type PasswordAuthProps = {
  // Absolute callback URL for the create-flow OTP magic-link fallback (the code path
  // verifies in-page). Mirrors how LoginForm passes it to EmailSignIn.
  emailRedirectTo: string;
  // Switch the parent to the "email me a code" view (passwordless sign-in).
  onUseCode: () => void;
  // Switch the parent to the code view in RESET intent (forgot password → set a new one on
  // /account after verifying).
  onForgot: () => void;
};

// Email + password surface for the host login page (ADR-0011): the lead sign-in form plus
// an account-creation flow. Create reuses the existing OTP path to prove ownership, then
// sets the chosen password via updateUser, so a password is only ever written on a verified
// session. The shared <EmailSignIn> (also used by guests) is reused UNCHANGED.
export function PasswordAuth({
  emailRedirectTo,
  onUseCode,
  onForgot,
}: PasswordAuthProps) {
  const router = useRouter();
  const [intent, setIntent] = useState<"signin" | "create">("signin");

  // Host-aware landing, identical to the code path in LoginForm (in-page, no redirect, so
  // no Supabase redirect-allow-list entry is involved).
  function land() {
    router.push(loginTarget(window.location.host));
    router.refresh();
  }

  return intent === "create" ? (
    <CreateAccount
      emailRedirectTo={emailRedirectTo}
      onDone={land}
      onSignIn={() => setIntent("signin")}
    />
  ) : (
    <SignIn
      onCreate={() => setIntent("create")}
      onUseCode={onUseCode}
      onForgot={onForgot}
      onDone={land}
    />
  );
}

function SignIn({
  onCreate,
  onUseCode,
  onForgot,
  onDone,
}: {
  onCreate: () => void;
  onUseCode: () => void;
  onForgot: () => void;
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(null);
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
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
        // GENERIC by design. signInWithPassword returns the same error for a wrong
        // password, an account with NO password set (a Google/magic-link-only user), and an
        // unknown email — Supabase does this to prevent account enumeration, and we must not
        // try to distinguish them. NEVER say "wrong password". The code / Google / forgot
        // affordances below are how a passwordless user proves ownership and sets a password.
        setError(
          "That email and password didn't match. If you usually sign in with Google or an email code, use one of those below, or reset your password.",
        );
        return;
      }
      onDone();
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-3"
      >
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <button
              type="button"
              onClick={onForgot}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="login-password"
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
              {show ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <button
          type="button"
          onClick={onUseCode}
          className="underline-offset-4 hover:underline"
        >
          Email me a code instead
        </button>
        <button
          type="button"
          onClick={onCreate}
          className="underline-offset-4 hover:underline"
        >
          Create account
        </button>
      </div>
    </div>
  );
}

function CreateAccount({
  emailRedirectTo,
  onDone,
  onSignIn,
}: {
  emailRedirectTo: string;
  onDone: () => void;
  onSignIn: () => void;
}) {
  // Two phases: VERIFY (prove email ownership via the shared OTP) then PASSWORD (set it on
  // the now-verified session). Reusing EmailSignIn means no OTP duplication and no double
  // email entry; the tradeoff (Risk C in ADR-0011) is that a tapped magic LINK instead of
  // the code lands the host in the app password-less — they can set one in /account.
  const [phase, setPhase] = useState<"verify" | "password">("verify");

  if (phase === "password") {
    return <SetInitialPassword onDone={onDone} />;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium">Create your account</p>
        <p className="text-sm text-muted-foreground">
          We&rsquo;ll email you a code to confirm it&rsquo;s you. You&rsquo;ll
          pick a password next.
        </p>
      </div>
      <EmailSignIn
        emailRedirectTo={emailRedirectTo}
        onVerified={() => setPhase("password")}
      />
      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSignIn}
          className="text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

function SetInitialPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [pending, start] = useTransition();

  function submit() {
    const parsed = setPasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        // The account exists and the session is live, but the chosen password was rejected
        // (e.g. leaked-password protection). Stay on this step so they pick another.
        toast.error("Couldn't set your password.", {
          description: error.message,
        });
        return;
      }
      // Stamp the "user set a password" flag (has_password() reads it, NOT the unreliable
      // GoTrue encrypted_password — OTP signups get a placeholder hash). Best-effort.
      await supabase.rpc("mark_password_set");
      toast.success("You're all set.");
      onDone();
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
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium">Pick a password</p>
        <p className="text-sm text-muted-foreground">
          You&rsquo;ll use it with your email to sign in next time.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="create-password">Password</Label>
        <div className="relative">
          <Input
            id="create-password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            autoFocus
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
      <div className="space-y-1.5">
        <Label htmlFor="create-confirm">Confirm password</Label>
        <Input
          id="create-confirm"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Setting up…" : "Create account"}
      </Button>
    </form>
  );
}

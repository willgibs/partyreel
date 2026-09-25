"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { FailurePaths } from "@/components/auth/failure-paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { doorFailure } from "@/lib/auth/door-failure";
import { setPasswordSchema, signInSchema } from "@/lib/validation/auth";
import { createClient } from "@/lib/supabase/client";

/**
 * THE PASSWORD DOOR, now a SECOND door rather than the lead.
 *
 * ★ CHOSEN (`app-door` r1 `lead=code`): one email field, the
 * same address signs in or creates the account, Google beside it, and a password
 * drops to a quiet link. So the account-CREATION flow that used to live here
 * (the "Create account" link, the OTP verify, then "Pick a password") is gone:
 * creating an account IS the code path now, on every surface, and nothing writes
 * a password before an address has been proven because nothing writes one at the
 * door at all.
 *
 * What remains is the two things a password is still for:
 *   `SignIn`             — a returning host who has one, reached from the door's
 *                          quiet "Have a password?" link.
 *   `SetInitialPassword` — the end of "forgot password": the code proves the
 *                          address, then a new password is set on the live
 *                          session. It is the one component that pairs
 *                          `updateUser({password})` with `mark_password_set()`,
 *                          which is what `has_password()` actually reads
 *                          (auth-accounts.md's placeholder-hash gotcha).
 *
 * `<AccountDoor>` is the only caller; it owns which of them is on screen.
 */

export function SignIn({
  onUseCode,
  onForgot,
  onGoogle,
  onDone,
  hintEmail,
  inputClassName,
  buttonClassName,
}: {
  /** Back to the code ladder (also the `send_code` way out of a refusal). */
  onUseCode: () => void;
  /** The code ladder in RESET intent: verify, then set a new password. */
  onForgot: () => void;
  /** The surface's Google handler, if it has one. */
  onGoogle?: () => void;
  /** Hands back the address it signed in with, so the door can remember it. */
  onDone: (email: string) => void;
  hintEmail?: string;
  inputClassName?: string;
  buttonClassName?: string;
}) {
  const [email, setEmail] = useState(hintEmail ?? "");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [refused, setRefused] = useState(false);
  const [pending, start] = useTransition();

  function submit() {
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setRefused(false);
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    start(async () => {
      setRefused(false);
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        // GENERIC by design. signInWithPassword returns the same error for a wrong
        // password, an account with NO password set (a Google/magic-link-only user), and an
        // unknown email — Supabase does this to prevent account enumeration, and we must not
        // try to distinguish them. NEVER say "wrong password". What changed with
        // `failure=paths` is only what stands UNDER the sentence: the three
        // recoveries it used to describe in prose are real buttons now.
        setRefused(true);
        return;
      }
      onDone(email);
    });
  }

  return (
    <div className="space-y-3">
      {refused && (
        <FailurePaths
          failure={doorFailure("password_mismatch")}
          handlers={{
            send_code: onUseCode,
            forgot: onForgot,
            google: onGoogle,
          }}
        />
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
            className={inputClassName}
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
              className={`pr-10 ${inputClassName ?? ""}`}
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
        <Button
          type="submit"
          className={`w-full active:scale-[0.99] motion-reduce:active:scale-100 ${buttonClassName ?? ""}`}
          disabled={pending}
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      {/* Promoting a link means the link goes (the board's own capture): while
          the refusal is up, its "Send a new code" button IS this link, and
          drawing both showed the same way out twice inside one card. */}
      {!refused && (
        <button
          type="button"
          onClick={onUseCode}
          className="block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Email me a code instead
        </button>
      )}
    </div>
  );
}

export function SetInitialPassword({
  onDone,
  heading = "Pick a password",
  line = "You'll use it with your email to sign in next time.",
  submitLabel = "Save password",
}: {
  onDone: () => void;
  heading?: string;
  line?: string;
  submitLabel?: string;
}) {
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
      // updateUser({password}) runs on the BROWSER client on purpose: it rotates
      // the session and the browser cookie write is unconditional there.
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
        <p className="text-sm font-medium">{heading}</p>
        <p className="text-sm text-muted-foreground">{line}</p>
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
      <Button
        type="submit"
        className="w-full active:scale-[0.99] motion-reduce:active:scale-100"
        disabled={pending}
      >
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

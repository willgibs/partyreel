"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { checkExistingAccount } from "@/app/(auth)/actions";
import {
  FailurePaths,
  type DoorActionHandlers,
} from "@/components/auth/failure-paths";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  doorFailure,
  isRateLimited,
  retryAfterSeconds,
  type DoorFailureKind,
} from "@/lib/auth/door-failure";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const emailSchema = z.object({
  email: z.email("Enter a valid email address."),
});
type EmailValues = z.infer<typeof emailSchema>;

// MUST stay in lockstep with the Supabase "Email OTP Length" setting (Dashboard →
// Authentication → Sign In / Providers → Email). Supabase enforces a 6-digit MINIMUM for
// email OTP (a 4-digit email code isn't offered), and 6 is the standard. This is a
// hand-synced pair, like tier_limits() ↔ tiers.ts: if the dashboard length changes, change
// this constant (it drives both the input maxLength and the rendered slot count). The OTP
// won't verify if the two drift.
const OTP_LENGTH = 6;

// Resend cooldown (seconds) — matches the custom-SMTP per-user minimum interval (Supabase
// Auth → Emails → SMTP → "Minimum interval per user", 60 s). Below that, a resend silently
// no-ops, so we disable the button + show a countdown rather than let an early re-tap fail.
const RESEND_COOLDOWN_S = 60;

// ★ Google is NEVER promoted into a failure here. The door that wraps this
// component draws the Google button four inches below, and a failure block
// that added a second one would show it twice, forty pixels apart (the
// board's own capture). Everything else a kind names is either this screen's
// own (a resend, a different address) or genuinely elsewhere (Contact).
const NOT_MINE = ["google", "retry_google"] as const;

/** What a verified code hands back to whichever door asked for it. */
export type DoorVerified = {
  /** True when this address already had an account before this sign-in. */
  existing: boolean;
  /** The verified address, as the SERVER read it off the new session. */
  email: string;
};

// Shared dual-path email sign-in. Entering an email sends ONE Supabase email that contains
// BOTH a 6-digit code AND a magic link (signInWithOtp). The user can either type the code
// here (verifyOtp — no redirect, the robust path that survives the iPhone-PWA magic-link
// gotcha) OR tap the link (-> /auth/callback). We LEAD with the code.
//
// The component owns NO navigation: the caller's `onVerified` runs after a successful code
// verify (the link path instead navigates through the callback route). Consumers: every wear
// of `<AccountDoor>` (the host `/login`, the guest gate, Save, Likes).
export function EmailSignIn({
  emailRedirectTo,
  shouldCreateUser = true,
  onVerified,
  inputClassName,
  buttonClassName,
  hintEmail,
  sentAt,
}: {
  emailRedirectTo: string;
  shouldCreateUser?: boolean;
  /**
   * Fires after a successful in-page verify, with what the SERVER knows about
   * the account the code just opened (`existing=tell`, Will 2026-09-20). Callers
   * that only need "we're in" can ignore the argument, which is why every
   * existing `() => {}` call site still type-checks.
   */
  onVerified: (result: DoorVerified) => void | Promise<void>;
  /** Optional size overrides (the guest gate bumps to h-11; /login keeps
   *  the default). Defaults preserve every existing call site. */
  inputClassName?: string;
  buttonClassName?: string;
  /**
   * An address this DEVICE remembers, prefilled into the field. A hint, never
   * an authorization, and never passed by a surface a stranger's phone can
   * reach (see lib/auth/remembered-email.ts: `/login` only).
   */
  hintEmail?: string;
  /**
   * Fires with the address when the code screen opens, and with null when it
   * closes. The door around this component uses it to step its own ladder
   * aside while six digits are being typed: a Google button and a "have a
   * password?" link under a code screen are two ways to lose the code.
   */
  sentAt?: (email: string | null) => void;
}) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  // ★ RULED (`failure=paths`): a failure stays ON the screen with its ways out
  // as controls. This replaced three toasts, which is the point — a toast is
  // gone before a host has decided what to do about it.
  const [failure, setFailure] = useState<{
    kind: DoorFailureKind;
    seconds?: number;
  } | null>(null);

  // Tick the resend cooldown down to 0 (re-armed each second via the resendIn dep).
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // The limiter's countdown IS its recovery, so it ticks and then clears itself:
  // a rate-limit banner that outlives the limit is a lie on the screen.
  useEffect(() => {
    if (failure?.kind !== "rate_limited") return;
    const t = setTimeout(() => {
      setFailure((f) => {
        if (!f || f.kind !== "rate_limited") return f;
        const next = (f.seconds ?? 0) - 1;
        return next > 0 ? { ...f, seconds: next } : null;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [failure]);

  /** Both places `sentTo` moves, so the door hears about it without an effect
   *  reaching for a ref during render. */
  function openCodeScreen(email: string) {
    setSentTo(email);
    sentAt?.(email);
  }

  const form = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: hintEmail ?? "" },
  });

  async function sendCode(email: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser, emailRedirectTo },
    });
    if (error) {
      // A 429 is its own kind with its own recovery (wait), and the seconds
      // GoTrue names beat our own cooldown constant when it names them.
      setFailure(
        isRateLimited(error)
          ? {
              kind: "rate_limited",
              seconds: retryAfterSeconds(error.message) ?? RESEND_COOLDOWN_S,
            }
          : { kind: "send_failed" },
      );
      return false;
    }
    setFailure(null);
    return true;
  }

  async function onEmailSubmit(values: EmailValues) {
    if (await sendCode(values.email)) {
      openCodeScreen(values.email);
      setResendIn(RESEND_COOLDOWN_S);
    }
  }

  async function onCodeComplete(value: string) {
    if (!sentTo) return;
    setVerifying(true);
    setFailure(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: sentTo,
      token: value,
      type: "email",
    });
    if (error) {
      setVerifying(false);
      setCode("");
      setFailure({ kind: "wrong_code" });
      return;
    }
    // ★ ONLY NOW is "this address already had an account" sayable: the code has
    // proved the address, so the answer is about the caller's own row rather
    // than an oracle anyone could query (auth-accounts.md, and the action's own
    // comment). A failed check reads as "not existing", which is the shipped
    // silent behaviour for one visit.
    let result: DoorVerified = { existing: false, email: sentTo };
    try {
      const checked = await checkExistingAccount();
      result = { existing: checked.existing, email: checked.email || sentTo };
    } catch {
      // see above: the door opens either way.
    }
    setVerifying(false);
    await onVerified(result);
  }

  async function resend() {
    if (!sentTo) return;
    setResending(true);
    const ok = await sendCode(sentTo);
    setResending(false);
    if (ok) {
      setCode("");
      setResendIn(RESEND_COOLDOWN_S);
    }
  }

  function useDifferentEmail() {
    setSentTo(null);
    sentAt?.(null);
    setCode("");
    setFailure(null);
    form.reset({ email: "" });
  }

  const handlers: DoorActionHandlers = {
    try_again: () => {
      setFailure(null);
      setCode("");
    },
    resend: () => void resend(),
    different_email: useDifferentEmail,
    send_code: () =>
      sentTo ? void resend() : void form.handleSubmit(onEmailSubmit)(),
  };

  if (sentTo) {
    return (
      <div data-otp-entry className="space-y-4 text-center">
        <div className="space-y-1">
          <p className="text-sm font-medium">Enter your code</p>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{sentTo}</span>.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <InputOTP
            maxLength={OTP_LENGTH}
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            disabled={verifying}
            onChange={(v) => {
              setCode(v);
              if (failure) setFailure(null);
            }}
            onComplete={onCodeComplete}
          >
            <InputOTPGroup>
              {Array.from({ length: OTP_LENGTH }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {verifying && (
            <p className="text-xs text-muted-foreground">Verifying…</p>
          )}
        </div>
        {failure && (
          <FailurePaths
            failure={doorFailure(failure.kind, failure.seconds)}
            handlers={handlers}
            suppress={NOT_MINE}
            className="text-left"
          />
        )}
        <p className="text-xs text-muted-foreground">
          Or tap the link in the same email to sign in.
        </p>
        <div
          // Promoting a link means the link goes: while a failure is up, its
          // buttons ARE the resend and the different address.
          hidden={Boolean(failure)}
          className="flex items-center justify-center gap-3 text-xs"
        >
          <button
            type="button"
            onClick={resend}
            disabled={resending || resendIn > 0}
            className="text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
          >
            {resending
              ? "Sending…"
              : resendIn > 0
                ? `Resend in ${resendIn}s`
                : "Resend code"}
          </button>
          <span className="text-faint">·</span>
          <button
            type="button"
            onClick={useDifferentEmail}
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onEmailSubmit)} className="space-y-3">
        {failure && (
          <FailurePaths
            failure={doorFailure(failure.kind, failure.seconds)}
            handlers={handlers}
            suppress={NOT_MINE}
          />
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  className={inputClassName}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className={cn(
            "w-full active:scale-[0.99] motion-reduce:active:scale-100",
            buttonClassName,
          )}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Sending…" : "Email me a code"}
        </Button>
      </form>
    </Form>
  );
}

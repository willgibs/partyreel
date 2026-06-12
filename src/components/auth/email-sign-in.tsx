"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

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

// Shared dual-path email sign-in. Entering an email sends ONE Supabase email that contains
// BOTH a 6-digit code AND a magic link (signInWithOtp). The user can either type the code
// here (verifyOtp — no redirect, the robust path that survives the iPhone-PWA magic-link
// gotcha) OR tap the link (-> /auth/callback). We LEAD with the code.
//
// The component owns NO navigation: the caller's `onVerified` runs after a successful code
// verify (the link path instead navigates through the callback route). Consumers: the host
// `/login` and the guest `<EnterEventPrompt>`.
export function EmailSignIn({
  emailRedirectTo,
  shouldCreateUser = true,
  onVerified,
  inputClassName,
  buttonClassName,
}: {
  emailRedirectTo: string;
  shouldCreateUser?: boolean;
  onVerified: () => void;
  /** Optional size overrides (the guest gate bumps to h-11; /login keeps
   *  the default). Defaults preserve every existing call site. */
  inputClassName?: string;
  buttonClassName?: string;
}) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Tick the resend cooldown down to 0 (re-armed each second via the resendIn dep).
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const form = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  async function sendCode(email: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser, emailRedirectTo },
    });
    if (error) {
      toast.error("Couldn't send the code", { description: error.message });
      return false;
    }
    return true;
  }

  async function onEmailSubmit(values: EmailValues) {
    if (await sendCode(values.email)) {
      setSentTo(values.email);
      setResendIn(RESEND_COOLDOWN_S);
    }
  }

  async function onCodeComplete(value: string) {
    if (!sentTo) return;
    setVerifying(true);
    setCodeError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: sentTo,
      token: value,
      type: "email",
    });
    setVerifying(false);
    if (error) {
      setCode("");
      setCodeError("That code didn't work. Check it and try again.");
      return;
    }
    onVerified();
  }

  async function resend() {
    if (!sentTo) return;
    setResending(true);
    const ok = await sendCode(sentTo);
    setResending(false);
    if (ok) {
      setCode("");
      setCodeError(null);
      setResendIn(RESEND_COOLDOWN_S);
      toast.success("Sent a new code.");
    }
  }

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
              if (codeError) setCodeError(null);
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
          {codeError && <p className="text-sm text-destructive">{codeError}</p>}
        </div>
        <p className="text-xs text-muted-foreground">
          Or tap the link in the same email to sign in.
        </p>
        <div className="flex items-center justify-center gap-3 text-xs">
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
          <span className="text-muted-foreground/40">·</span>
          <button
            type="button"
            onClick={() => {
              setSentTo(null);
              setCode("");
              setCodeError(null);
              form.reset();
            }}
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
          className={cn("w-full", buttonClassName)}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Sending…" : "Email me a code"}
        </Button>
      </form>
    </Form>
  );
}

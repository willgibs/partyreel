"use client";

import { useState } from "react";
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

const emailSchema = z.object({
  email: z.email("Enter a valid email address."),
});
type EmailValues = z.infer<typeof emailSchema>;

// Shared dual-path email sign-in. Entering an email sends ONE Supabase email that contains
// BOTH a 6-digit code AND a magic link (signInWithOtp). The user can either type the code
// here (verifyOtp — no redirect, the robust path that survives the iPhone-PWA magic-link
// gotcha) OR tap the link (-> /auth/callback). We LEAD with the code.
//
// The component owns NO navigation: the caller's `onVerified` runs after a successful code
// verify (the link path instead navigates through the callback route). Consumers: the host
// `/login` and the guest `<VerifyEmailPrompt>`.
export function EmailSignIn({
  emailRedirectTo,
  shouldCreateUser = true,
  onVerified,
}: {
  emailRedirectTo: string;
  shouldCreateUser?: boolean;
  onVerified: () => void;
}) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

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
    if (await sendCode(values.email)) setSentTo(values.email);
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
            maxLength={6}
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
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
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
            disabled={resending}
            className="text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend code"}
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
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Sending…" : "Email me a code"}
        </Button>
      </form>
    </Form>
  );
}

"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { checkExistingAccount } from "@/app/(auth)/actions";
import {
  FailurePaths,
  type DoorActionHandlers,
} from "@/components/auth/failure-paths";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/ui/client-form";
import { floatingKeyboardFoot } from "@/components/ui/floating-layer";
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
import { CODE_LENGTH } from "@/lib/auth/code-length";
import {
  doorFailure,
  isRateLimited,
  retryAfterSeconds,
  type DoorFailureKind,
} from "@/lib/auth/door-failure";
import { useHydrated } from "@/lib/shared/use-hydrated";
import { createClient } from "@/lib/supabase/client";
import { isTextField } from "@/lib/use-keyboard-inset";
import { cn } from "@/lib/utils";

const emailSchema = z.object({
  email: z.email("Enter a valid email address."),
});
type EmailValues = z.infer<typeof emailSchema>;

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

/**
 * The caller's say at submit, before a code is sent: `false` stops the send (a field of the
 * caller's own, in `leading`, was refused in place), or `data` to ride the sign-up as the new
 * user's metadata (`raw_user_meta_data`; GoTrue keeps it only when the code CREATES the account).
 */
export type BeforeSend = () => false | { data?: Record<string, unknown> };

/**
 * THE CODE SCREEN'S HEADING, "Check your email" (`identity-door` r3, Will's `code=mail`), in its one
 * home. The moment the code is on its way is the moment she leaves for her inbox, so the screen
 * says where to look, then which address to look in. The door around this component draws it in
 * place of the surface's own heading (`AccountDoor`), on every code screen this component draws:
 * the gate, Create account, Log in, the keep's and the confirm sheet's, the like door's, and the
 * host's `/login`.
 */
export const CODE_SCREEN_TITLE = "Check your email";

/** "We sent a 6-digit code to <address>.", the address in the ink it is checked in. */
export function codeSentLine(email: string): ReactNode {
  return (
    <>
      We sent a {CODE_LENGTH}-digit code to{" "}
      <span className="font-medium break-words text-foreground">{email}</span>.
    </>
  );
}

/**
 * THE SPINNER A BUTTON WEARS WHILE ITS PAGE IS STILL LOADING. In the button's corner, so the label never
 * moves when it goes, and it arrives after half a second (`fade-in` held back by its delay, which every
 * `animate-in` reads from `--tw-animation-delay`, never `delay-*`, which would also slow the button's own
 * press transition): a page that hydrates inside the half second, which is nearly every desktop load,
 * never shows it, with reduced motion too (the global guard shortens the fade, never the delay). A press
 * shows it at once (`group-active`), because the press is what asked.
 */
function WaitingCue() {
  return (
    <span
      aria-hidden
      data-waiting-cue=""
      className="absolute inset-y-0 left-4 flex animate-in items-center duration-300 fill-mode-backwards [--tw-animation-delay:500ms] fade-in group-active/button:animate-none"
    >
      <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
    </span>
  );
}

// Shared dual-path email sign-in. Entering an email sends ONE Supabase email that contains
// BOTH a 6-digit code AND a magic link (signInWithOtp). The user can either type the code
// here (verifyOtp — no redirect, the robust path that survives the iPhone-PWA magic-link
// gotcha) OR tap the link (-> /auth/callback). We LEAD with the code.
//
// The component owns NO navigation: the caller's `onVerified` runs after a successful code
// verify (the link path instead navigates through the callback route). Consumers: every wear
// of `<AccountDoor>` (the host `/login`, the guest door's identify and Log in, the confirm
// doors, Likes).
//
// ★ THE KEYBOARD IS HANDED OVER, NEVER DROPPED (door-flow). The email field and the code field
// are two different inputs, and on iOS removing a focused input takes the keyboard down with it,
// while a programmatic focus outside a tap cannot raise it again. So when the code is sent while
// the email field holds focus, that field lets go and the code field takes focus in the SAME task
// (`flushSync`), and the keyboard simply changes to digits. When nothing held focus (the guest
// dismissed the keyboard, then tapped the button) the code screen arrives with no keyboard at
// all under `codeFocus="follow"`, which every guest door wears; `/login` keeps focusing it.
export function EmailSignIn({
  emailRedirectTo,
  shouldCreateUser = true,
  onVerified,
  inputClassName,
  buttonClassName,
  buttonSize = "default",
  hintEmail,
  sentAt,
  leading,
  beforeSend,
  codeFocus = "always",
  align = "center",
  codeDescribedBy,
}: {
  emailRedirectTo: string;
  shouldCreateUser?: boolean;
  /**
   * Fires after a successful in-page verify, with what the SERVER knows about
   * the account the code just opened (`existing=tell`, Will 2026-09-20). Callers
   * that only need "we're in" can ignore the argument, which is why every
   * existing `() => {}` call site still type-checks. The code screen reads
   * "Verifying…" until it settles, so a door with more to do after the code
   * (the guest door's four writes) never shows an idle screen meanwhile.
   */
  onVerified: (result: DoorVerified) => void | Promise<void>;
  /** Optional size overrides (the guest doors bump the field to h-11 16px;
   *  /login keeps the default). Defaults preserve every existing call site. */
  inputClassName?: string;
  buttonClassName?: string;
  /** The submit's rung: the guest doors' primary is the 44px `cta`. */
  buttonSize?: "default" | "cta";
  /**
   * An address this DEVICE remembers, prefilled into the field. A hint, never
   * an authorization, and never passed by a surface a stranger's phone can
   * reach (see lib/auth/remembered-email.ts: `/login` only).
   */
  hintEmail?: string;
  /**
   * Fires with the address when the code screen opens, and with null when it
   * closes (or this component leaves with it open). The door around this
   * component uses it to step its own ladder aside while six digits are being
   * typed (a Google button and a "have a password?" link under a code screen
   * are two ways to lose the code), and to head the screen "Check your email".
   */
  sentAt?: (email: string | null) => void;
  /** A field of the caller's own inside this form, above the email (the guest door's name). */
  leading?: ReactNode;
  /** Runs at submit before anything is sent (see `BeforeSend`). */
  beforeSend?: BeforeSend;
  /**
   * `follow`: the code field takes focus only if a field held focus at submit (every guest door,
   * so no keyboard rises that the guest had put away). `always`: it takes focus regardless.
   */
  codeFocus?: "follow" | "always";
  /**
   * The code screen's alignment, following the heading the door draws above it: from the left
   * under a guest door's heading, centred under `/login`'s centred one.
   */
  align?: "start" | "center";
  /** The id of the sentence above the slots that says where the code went (the door's heading). */
  codeDescribedBy?: string;
}) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const hydrated = useHydrated();
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
  const otpRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  // Whether a field held focus when the form was sent (read at the submit event, synchronously).
  const fieldAtSubmit = useRef(false);
  // The metadata the last send carried, so a resend carries the same.
  const sendData = useRef<Record<string, unknown> | undefined>(undefined);

  // ★ A CODE SCREEN THAT LEAVES SAYS SO. The door heads the screen "Check your email" off `sentAt`,
  // and this component can unmount with the code screen still open (a verified code handing to
  // "the account you already had", Log in's password or reset view); without a closing report the
  // door would keep the code's heading over a screen that no longer has a code. The latest
  // callback is read at unmount, so an inline arrow never re-arms this.
  const latestSentAt = useRef(sentAt);
  useEffect(() => {
    latestSentAt.current = sentAt;
  });
  useEffect(() => () => latestSentAt.current?.(null), []);

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

  /**
   * Swap the screen (the email form and the code screen) without ever unmounting a focused
   * field: the one holding focus lets go, the new screen commits, and `focusNext` takes focus in
   * the same task, so iOS keeps the keyboard up and only changes its keys.
   */
  function swapScreen(
    change: () => void,
    focusNext: () => HTMLElement | null,
    handOver: boolean,
  ) {
    const active = document.activeElement;
    if (active instanceof HTMLElement && isTextField(active)) active.blur();
    flushSync(change);
    if (handOver) focusNext()?.focus();
  }

  const form = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: hintEmail ?? "" },
  });

  async function sendCode(email: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser,
        emailRedirectTo,
        ...(sendData.current ? { data: sendData.current } : {}),
      },
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
      const handOver = fieldAtSubmit.current || codeFocus === "always";
      swapScreen(
        () => openCodeScreen(values.email),
        () => otpRef.current,
        handOver,
      );
      setResendIn(RESEND_COOLDOWN_S);
    }
  }

  async function onCodeComplete(value: string) {
    if (!sentTo || verifying) return;
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
    try {
      await onVerified(result);
    } finally {
      // After the caller has settled (a door with writes to make after the code keeps the
      // screen saying so); a no-op when the caller has already moved on and unmounted this.
      setVerifying(false);
    }
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
    // The guest's own tap: the keyboard follows them back to the email field if it was up.
    const handOver = isTextField(document.activeElement);
    swapScreen(
      () => {
        setSentTo(null);
        sentAt?.(null);
        setCode("");
        setFailure(null);
        form.reset({ email: "" });
      },
      () => emailRef.current,
      handOver,
    );
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
    /* ★ THE CODE SCREEN, UNDER "CHECK YOUR EMAIL" (`code=mail`): the heading and the address are the
       door's (`CODE_SCREEN_TITLE`, `codeSentLine`, drawn by `AccountDoor` where the surface's own
       heading stood), then the six slots across the full width, then the link in the same email and
       the resend. Its words say "the link", never "to sign in": the guest door says Log in. */
    const centred = align === "center";
    return (
      <div data-otp-entry className={cn("space-y-4", centred && "text-center")}>
        <div className="flex flex-col gap-2">
          <InputOTP
            ref={otpRef}
            maxLength={CODE_LENGTH}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="Your code"
            aria-describedby={codeDescribedBy}
            containerClassName="w-full"
            value={code}
            // ★ NOT `disabled` WHILE VERIFYING: a disabled field loses focus, and on iOS the
            // keyboard goes down with it, so a wrong code (measured on the simulator) left the
            // guest tapping the field again to retry. The field keeps focus and simply ignores
            // typing until the answer lands; "Verifying…" says why.
            aria-busy={verifying || undefined}
            onChange={(v) => {
              if (verifying) return;
              setCode(v);
              if (failure) setFailure(null);
            }}
            onComplete={onCodeComplete}
          >
            {/* Six equal slots across the whole width, each a thumb's target: `flex-1` shares the
                row, and the height beats the primitive's square `size-11` (tailwind-merge keeps
                both, so the height is marked important rather than left to stylesheet order). */}
            <InputOTPGroup className="w-full gap-2">
              {Array.from({ length: CODE_LENGTH }, (_, i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="h-12! min-w-0 flex-1"
                />
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
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Or tap the link in the same email.
          </p>
          <div
            // Promoting a link means the link goes: while a failure is up, its
            // buttons ARE the resend and the different address.
            hidden={Boolean(failure)}
            className={cn(
              "flex items-center gap-3 text-xs",
              centred ? "justify-center" : "justify-start",
            )}
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
      </div>
    );
  }

  return (
    <Form {...form}>
      <ClientForm
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          fieldAtSubmit.current = isTextField(document.activeElement);
          // The caller's own field is judged first, so both refusals show together; the email's
          // own check still runs, and nothing is sent unless both pass.
          const gate = beforeSend ? beforeSend() : {};
          if (gate !== false) sendData.current = gate.data;
          void form.handleSubmit(async (values) => {
            if (gate === false) return;
            await onEmailSubmit(values);
          })(e);
        }}
        className="space-y-3"
      >
        {failure && (
          <FailurePaths
            failure={doorFailure(failure.kind, failure.seconds)}
            handlers={handlers}
            suppress={NOT_MINE}
          />
        )}
        {leading}
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
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="send"
                  placeholder="you@email.com"
                  className={inputClassName}
                  {...field}
                  ref={(el) => {
                    field.ref(el);
                    emailRef.current = el;
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div
          data-sheet-primary
          className={cn("relative", floatingKeyboardFoot)}
        >
          <Button
            type="submit"
            size={buttonSize}
            // ★ WAITING FOR THE PAGE (`ClientForm`): until React has attached its handler a press sends
            // nothing anywhere, so the button says it is not ready (`aria-disabled`, a progress cursor
            // and, after half a second, a spinner in its corner) rather than taking the press in silence.
            // The cue is `!hydrated`, which the server and the hydrating render both answer, so it is in
            // the HTML a cold phone paints and gone the moment the handler exists.
            aria-disabled={hydrated ? undefined : true}
            className={cn(
              "relative w-full active:scale-[0.99] motion-reduce:active:scale-100",
              !hydrated && "cursor-progress",
              buttonClassName,
            )}
            disabled={form.formState.isSubmitting}
          >
            {!hydrated && <WaitingCue />}
            {form.formState.isSubmitting ? "Sending…" : "Email me a code"}
          </Button>
        </div>
      </ClientForm>
    </Form>
  );
}

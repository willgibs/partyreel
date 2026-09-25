"use client";

import { useEffect, useReducer, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

import {
  confirmEmailChangeAction,
  requestEmailChangeAction,
} from "./email-actions";
import {
  CHANGE_SIDES,
  EMAIL_CODE_LENGTH,
  EMAIL_RESEND_COOLDOWN_S,
  emailSectionReducer,
  focusSide,
  initialEmailSectionState,
  otherSide,
  pendingPrompt,
  type ChangeSide,
  type EmailChangeHint,
  type PendingChange,
  type PendingState,
} from "./email-change";

/**
 * THE ACCOUNT'S EMAIL, CHANGED BUT NEVER REMOVED (lp/identity-email; Will, identity-door round 1
 * `remove`). The Profile card's email row: the address, a Change, and in place of the old "can't be
 * edited yet", the two-code change. Every step lives on this row, so nothing opens over the page,
 * and a change left waiting ("Not now") stays one tap away until its codes expire.
 *
 * ★ THE PANELS ARE A PROMPT, NOT A PROOF. Each code is checked server-side
 * (`confirmEmailChangeAction`), against an address read off the caller's own auth user, never one
 * this component sends. The state machine is pure (email-change.ts, email-change.test.ts).
 */
export function EmailSection({
  email,
  pending,
  hint,
}: {
  /** The account's address as Supabase Auth holds it (the one the current code goes to). */
  email: string | null;
  /** A change still waiting on its codes, read from `getUser()` by the page. */
  pending: PendingChange | null;
  /** A tapped link's news off `/auth/callback` (`?email_change=`). */
  hint: EmailChangeHint | null;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    emailSectionReducer,
    { pending, hint, email },
    initialEmailSectionState,
  );
  const [draft, setDraft] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const [resendIn, setResendIn] = useState(0);
  const [codes, setCodes] = useState<Record<ChangeSide, string>>({
    current: "",
    new: "",
  });
  const inputs = useRef<Record<ChangeSide, HTMLInputElement | null>>({
    current: null,
    new: null,
  });

  // The hint has done its one job once the section has read it: a reload should not re-announce
  // a change that already happened. Replaced in place, so nothing navigates or re-renders.
  useEffect(() => {
    if (!hint) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("email_change");
      window.history.replaceState(window.history.state, "", url);
    } catch {
      // A URL the browser will not rewrite is only a stale hint on the next reload.
    }
  }, [hint]);

  // The resend waits out the SMTP's per-user interval rather than failing inside it.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  function request(address: string) {
    startSending(async () => {
      const result = await requestEmailChangeAction(address);
      if (!result.ok) {
        if (state.step === "pending") toast.error(result.message);
        else setRequestError(result.message);
        return;
      }
      setRequestError(null);
      setCodes({ current: "", new: "" });
      setResendIn(EMAIL_RESEND_COOLDOWN_S);
      dispatch({ type: "sent", address: result.pending });
    });
  }

  async function verify(side: ChangeSide, code: string) {
    dispatch({ type: "check", side });
    const result = await confirmEmailChangeAction(side, code);
    if (!result.ok) {
      setCodes((c) => ({ ...c, [side]: "" }));
      dispatch({ type: "refused", side, message: result.message });
      return;
    }
    if (result.state === "half") {
      dispatch({ type: "half", side });
      // The next code is the other address's: put the thumb there.
      inputs.current[otherSide(side)]?.focus();
      return;
    }
    dispatch({ type: "done", email: result.email });
    toast.success(`Your email is now ${result.email}.`);
    router.refresh();
  }

  const shown = state.step === "done" ? state.email : email;

  if (state.step === "editing") {
    return (
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          request(draft);
        }}
        className="space-y-2"
      >
        <Label htmlFor="account-new-email">New email</Label>
        <div className="flex gap-2">
          <Input
            id="account-new-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@email.com"
            // A deliberate press on Change opened this field, so the caret belongs in it.
            autoFocus
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (requestError) setRequestError(null);
            }}
            aria-invalid={requestError ? true : undefined}
            aria-describedby="account-new-email-help"
          />
          <Button type="submit" disabled={sending || !draft.trim()}>
            {sending ? "Sending…" : "Send codes"}
          </Button>
        </div>
        {requestError && (
          <p role="alert" className="text-sm text-destructive">
            {requestError}
          </p>
        )}
        <p
          id="account-new-email-help"
          className="text-xs text-muted-foreground"
        >
          We&rsquo;ll email a code to {email ?? "your current address"} and one
          to the new address. Your email changes once both are entered.
        </p>
        <button
          type="button"
          onClick={() => {
            setRequestError(null);
            dispatch({ type: "cancel" });
          }}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Cancel
        </button>
      </form>
    );
  }

  if (state.step === "pending") {
    const addresses: Record<ChangeSide, string> = {
      current: email ?? "your current address",
      new: state.address,
    };
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Confirm your new email</p>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {pendingPrompt(state, addresses)}
          </p>
        </div>
        <div className="divide-y divide-border/60">
          {CHANGE_SIDES.map((side) => (
            <CodeRow
              key={side}
              side={side}
              address={addresses[side]}
              state={state}
              code={codes[side]}
              autoFocus={focusSide(state) === side}
              inputRef={(el) => {
                inputs.current[side] = el;
              }}
              onCode={(value) => {
                setCodes((c) => ({ ...c, [side]: value }));
                if (state[side].status === "failed")
                  dispatch({ type: "retry", side });
              }}
              onComplete={(value) => void verify(side, value)}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          No code after a few minutes? Check spam, then send new codes. An
          address already tied to another Partyreel account can&rsquo;t be used.
        </p>
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => request(state.address)}
            disabled={sending || resendIn > 0}
            className="text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
          >
            {sending
              ? "Sending…"
              : resendIn > 0
                ? `Send new codes in ${resendIn}s`
                : "Send new codes"}
          </button>
          <span className="text-faint" aria-hidden>
            ·
          </span>
          <button
            type="button"
            onClick={() => dispatch({ type: "park" })}
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  const parked = state.step === "idle" ? state.parked : null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium">Email</p>
          {/* Wrapped, never truncated: this is the address a person is checking. */}
          <p className="text-sm break-all text-muted-foreground">
            {shown ?? "No email on file"}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setDraft("");
            dispatch({ type: "edit" });
          }}
        >
          Change
        </Button>
      </div>
      {state.step === "done" && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check className="size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0">
            Changed. Sign-in codes go to{" "}
            <span className="break-all">{state.email}</span> from now on.
          </span>
        </p>
      )}
      {parked && (
        <p className="text-xs text-muted-foreground">
          Changing to{" "}
          <span className="font-medium break-all text-foreground">
            {parked.address}
          </span>
          , waiting for both codes.{" "}
          <button
            type="button"
            onClick={() => dispatch({ type: "resume" })}
            className="underline underline-offset-4 hover:text-foreground"
          >
            Enter the codes
          </button>
        </p>
      )}
    </div>
  );
}

/** One address's code: its field until it is confirmed, then a check. */
function CodeRow({
  side,
  address,
  state,
  code,
  autoFocus,
  inputRef,
  onCode,
  onComplete,
}: {
  side: ChangeSide;
  address: string;
  state: PendingState;
  code: string;
  autoFocus: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
  onCode: (value: string) => void;
  onComplete: (value: string) => void;
}) {
  const own = state[side];
  const label = side === "current" ? "Your current email" : "Your new email";
  return (
    <div className="space-y-2 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-all">{address}</p>
      </div>
      {own.status === "confirmed" ? (
        <p className="flex items-center gap-1.5 text-sm">
          <Check className="size-4 shrink-0" aria-hidden /> Confirmed
        </p>
      ) : (
        <>
          <InputOTP
            ref={inputRef}
            maxLength={EMAIL_CODE_LENGTH}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus={autoFocus}
            aria-label={`The code sent to ${address}`}
            value={code}
            disabled={own.status === "checking"}
            onChange={onCode}
            onComplete={onComplete}
          >
            <InputOTPGroup>
              {Array.from({ length: EMAIL_CODE_LENGTH }, (_, i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  aria-invalid={own.status === "failed" ? true : undefined}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {own.status === "checking" && (
            <p className="text-xs text-muted-foreground">Checking…</p>
          )}
          {own.status === "failed" && (
            <p role="alert" className="text-sm text-destructive">
              {own.message}
            </p>
          )}
        </>
      )}
    </div>
  );
}

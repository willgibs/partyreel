"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Fingerprint } from "lucide-react";

import {
  EmailSignIn,
  type DoorVerified,
} from "@/components/auth/email-sign-in";
import { FailurePaths } from "@/components/auth/failure-paths";
import { GoogleIcon } from "@/components/auth/google-icon";
import {
  SetInitialPassword,
  SignIn,
} from "@/components/auth/password-sign-in";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  doorFailure,
  type DoorFailureKind,
} from "@/lib/auth/door-failure";
import {
  forgetRememberedDoor,
  hasPasskeyHint,
  markPasskeyOffered,
  maskEmail,
  passkeyOffered,
  readRememberedDoor,
  rememberDoor,
  rememberPasskey,
} from "@/lib/auth/remembered-email";
import { createClient, PASSKEYS_ENABLED } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * THE ACCOUNT DOOR: one object, worn four ways.
 *
 * ★ RULED (Will, 2026-09-20, `app-door` r1 `surfaces=one`): "any login
 * components that feel similar could be unified into one object worn 4ways" —
 * with `lead=code`: one email field, the same address signs in or creates the
 * account, Google beside it, and a password dropped to a quiet link.
 *
 * Four places asked for an account before this and no two agreed: four feature
 * sets, three tones, and only two of them carried the Terms line. They are one
 * component now; what each place still owns is the REASON it is asking.
 *
 * ★ THE FOUR SECURITY INVARIANTS THIS DOOR CARRIES, none of which is a design
 * variable (auth-accounts.md):
 *   1. Nothing here authorises anything. Every gate re-checks `getUser()`
 *      server-side; this component only obtains a session.
 *   2. "You already had an account" is decided by the SERVER, after the code
 *      proved the address, from the caller's own row. Said any earlier it is an
 *      enumeration oracle (see `checkExistingAccount`).
 *   3. The password refusal stays generic. `signInWithPassword` cannot tell a
 *      wrong password from an unknown address without leaking which addresses
 *      exist, so the sentence stays vague and the BUTTONS do the work.
 *   4. No password is ever written before an address is proven, because no
 *      password is written at this door at all. Creating an account is the code.
 *
 * ★ AND THE REMEMBERED ADDRESS IS `/login`-ONLY, by prop. `remember` is off by
 * default: a phone passed around a party and a venue's iPad must never show the
 * last guest's address to the next one (lib/auth/remembered-email.ts).
 */

export type DoorWear = "login" | "gate" | "save" | "like" | "signin";

/**
 * THE WEARS' WORDS, in one table, so a place's heading and its reason line
 * cannot drift from the door they stand over. `/login` renders them itself
 * (`chrome="full"`); the surfaces that already have a semantic title of
 * their own — a DialogTitle, the gate's ruled framing — read the same strings
 * into that slot and pass `chrome="none"`, so the a11y-correct element stays
 * with the surface and the copy stays here.
 *
 * ★ THE WORDS MOVED TO "CONFIRM YOUR EMAIL" (the identity reshape, 2026-09-21).
 * Anonymity left the product on Will's `address=none`, and with it the framing
 * where an ACCOUNT was the thing being asked for: what is asked for is a
 * confirmed address, and the free account is what confirming MAKES, which is
 * also the order a guest meets it in. `gate` alone keeps its sentence untouched,
 * because he ruled that one verbatim (`voice` r1 `gate=ask`) and it already says
 * exactly this.
 *
 * ★ AND `signin` IS THE FIFTH, for the one person the other four do not fit: a
 * name-only guest at a party who ALREADY has an account. Nothing is being
 * created and nothing is being kept, so neither `save`'s promise nor `login`'s
 * host framing is true for them; what they want is their own photographs to end
 * up in the one place they keep everything.
 */
export const DOOR_WEAR: Record<DoorWear, { heading: string; reason: string }> = {
  login: {
    heading: "Welcome to Partyreel",
    reason:
      "Sign in to create events and collect photos from your guests. No app, no fuss.",
  },
  // ★ RULED VERBATIM, TWICE. Will's `voice` r1 `gate=ask` (2026-09-19) set the
  // first sentence; the identity ruling of 2026-09-22 SUPERSEDES it by name and
  // puts the ask first, because the ask is the host's and the safety is the
  // reason rather than the other way round. "Tap" is his too, relitigated off
  // "click" in the same sitting: "'tap' is better than 'click', and I would
  // prefer to use that." It says WHOSE call it is, WHY, and what it costs.
  // "Almost in" is untouched. Do not reword.
  gate: {
    heading: "Almost in",
    reason:
      "The host has asked guests to confirm an email for safety. One tap and you're in.",
  },
  // The capture moment's words (the identity reshape): a guest who has just put
  // photographs into somebody's album is not shopping for an account, so the
  // heading names the thing they already care about and the reason says what
  // confirming does with it. "Confirming makes a free account" is the whole
  // price, said last.
  save: {
    heading: "Keep your photos",
    reason:
      "Confirm your email and this event stays on your profile, with every photo you added. Confirming makes a free account.",
  },
  like: {
    heading: "Like this",
    reason:
      "Confirm your email to keep your favorites and find them again on your dashboard. Confirming makes a free account.",
  },
  signin: {
    heading: "Sign in",
    reason:
      "Already on Partyreel? Sign in and the photos you added here join everything else you have added.",
  },
};

export type DoorMethods = {
  /** The code is the lead, and it is not optional: it is the one method that
   *  signs in and creates in the same step. */
  code: true;
  google?: boolean;
  password?: boolean;
};

/** How long the gate holds its claim + refresh so "Not you?" stays reachable. */
const EXISTING_HOLD_MS = 4000;

type Step =
  | { k: "methods" }
  | { k: "password" }
  /** The code ladder in forgot-password intent. */
  | { k: "reset" }
  | { k: "set-password" }
  | { k: "existing"; result: DoorVerified }
  | { k: "passkey"; result: DoorVerified };

export function AccountDoor({
  wear,
  methods,
  emailRedirectTo,
  onVerified,
  consent = true,
  hintEmail,
  intent = "signin",
  chrome = "full",
  remember = false,
  hold = false,
  initialFailure = null,
  inputClassName,
  buttonClassName,
  className,
  children,
}: {
  wear: DoorWear;
  methods: DoorMethods;
  /** Where a magic link and the Google round trip come back to. */
  emailRedirectTo: string;
  onVerified: (result: DoorVerified) => void | Promise<void>;
  /** The Terms line. False only where the surface already carries it. */
  consent?: boolean;
  hintEmail?: string;
  /**
   * `create` is what makes the "you already had one" line sayable: on a plain
   * sign-in every returning host's code would read as an account they already
   * had, which is noise rather than a warning (Will's `existing=tell` is about
   * a host who thought they were CREATING one).
   */
  intent?: "signin" | "create";
  /** `full` draws the wear's heading and reason; `none` leaves both to the surface. */
  chrome?: "full" | "none";
  /** Read and write this device's remembered address. `/login` only. */
  remember?: boolean;
  /**
   * Hold the caller's `onVerified` while the "already had an account" line is
   * on screen (the gate: its `claimAnonymousUploads` must not stamp a guest's
   * photographs onto an account the host is about to sign out of).
   */
  hold?: boolean;
  /** A failure the surface already knows about, e.g. `/login`'s `?error=`. */
  initialFailure?: DoorFailureKind | null;
  inputClassName?: string;
  buttonClassName?: string;
  className?: string;
  /**
   * One extra control, under the field and above the divider. The Save dialog's
   * newsletter switch is the only user: it belongs to Save's own moment, not to
   * the door, so it rides as a slot rather than becoming a fifth wear's prop.
   */
  children?: React.ReactNode;
}) {
  const copy = DOOR_WEAR[wear];
  const [step, setStep] = useState<Step>({ k: "methods" });
  const [failure, setFailure] = useState<DoorFailureKind | null>(initialFailure);
  // True while six digits are being typed: the ladder under the field steps
  // aside, because a Google button beside a code screen is a way to lose the code.
  const [coding, setCoding] = useState(false);
  const [hint, setHint] = useState<string | undefined>(hintEmail);
  const [hintMethod, setHintMethod] = useState<string | null>(null);
  const [passkeyReady, setPasskeyReady] = useState(false);
  const [busy, setBusy] = useState(false);

  // What this device remembers, read after paint and only where allowed. The
  // read is deferred (not run in the effect body) for the same reason the whole
  // module is guarded: `localStorage` is a browser-only, throwing API, so the
  // first HTML must be a stranger's door and the hint arrives after hydration.
  useEffect(() => {
    if (!remember) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      const door = readRememberedDoor();
      if (!door) return;
      setHint((current) => current ?? door.email);
      setHintMethod(door.method);
      // ★ The passkey button is drawn from a HINT plus feature detection, never
      // from a WebAuthn call: auth-js's helper has no conditional mediation, so
      // asking the browser on load would throw a system sheet at a stranger.
      setPasskeyReady(
        PASSKEYS_ENABLED &&
          typeof window !== "undefined" &&
          "PublicKeyCredential" in window &&
          hasPasskeyHint(),
      );
    });
    return () => {
      active = false;
    };
  }, [remember]);

  const finish = useCallback(
    async (result: DoorVerified) => {
      await onVerified(result);
    },
    [onVerified],
  );

  /** After a code sign-in on `/login`, offer to save a passkey — once, ever. */
  const afterSignIn = useCallback(
    async (result: DoorVerified) => {
      const offerable =
        remember &&
        PASSKEYS_ENABLED &&
        typeof window !== "undefined" &&
        "PublicKeyCredential" in window &&
        !hasPasskeyHint() &&
        !passkeyOffered();
      if (offerable) {
        markPasskeyOffered();
        setStep({ k: "passkey", result });
        return;
      }
      await finish(result);
    },
    [finish, remember],
  );

  // ★ THE HOLD, and why it is a ref rather than a dependency. A wear passes
  // `onVerified` as an inline arrow, so it is a new function on every render;
  // putting it in this effect's deps would re-arm the four seconds on every
  // keystroke and the hold would never expire. The ref is written in an effect
  // (never during render) and read only when the timer fires.
  const latestAfterSignIn = useRef(afterSignIn);
  useEffect(() => {
    latestAfterSignIn.current = afterSignIn;
  });
  useEffect(() => {
    if (!hold || step.k !== "existing") return;
    const { result } = step;
    const t = setTimeout(
      () => void latestAfterSignIn.current(result),
      EXISTING_HOLD_MS,
    );
    return () => clearTimeout(t);
  }, [hold, step]);

  const handleVerified = useCallback(
    async (result: DoorVerified) => {
      if (remember && result.email)
        rememberDoor({ email: result.email, method: "code" });
      if (step.k === "reset") {
        setStep({ k: "set-password" });
        return;
      }
      if (intent === "create" && result.existing) {
        setStep({ k: "existing", result });
        return;
      }
      await afterSignIn(result);
    },
    [afterSignIn, intent, remember, step.k],
  );

  async function signInWithGoogle(loginHint?: string) {
    setBusy(true);
    const supabase = createClient();
    if (remember && loginHint)
      rememberDoor({ email: loginHint, method: "google" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: emailRedirectTo,
        // ★ NEVER AN AUTO SIGN-IN. A hinted press names the account and still
        // goes through Google's chooser, so a shared laptop cannot be signed in
        // by one press from someone else's session (his `return=tap`, flagged).
        ...(loginHint
          ? { queryParams: { login_hint: loginHint, prompt: "select_account" } }
          : {}),
      },
    });
    // On success the browser navigates to Google — we only get here on error.
    if (error) {
      setFailure("google_failed");
      setBusy(false);
    }
  }

  async function signInWithPasskey() {
    setBusy(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase.auth.signInWithPasskey();
      if (error || !data?.session) {
        // A refused or missing credential is the hint being stale, not a
        // failure worth a banner: clear it and leave the code door standing.
        setPasskeyReady(false);
        setBusy(false);
        return;
      }
      await finish({ existing: true, email: data.session.user.email ?? "" });
    } catch {
      setPasskeyReady(false);
      setBusy(false);
    }
  }

  const googleButton = (
    label = "Continue with Google",
    loginHint?: string,
    variant: "default" | "outline" = "outline",
  ) => (
    <Button
      type="button"
      variant={variant}
      className={cn(
        "w-full active:scale-[0.99] motion-reduce:active:scale-100",
        buttonClassName,
      )}
      onClick={() => void signInWithGoogle(loginHint)}
      disabled={busy}
    >
      <GoogleIcon /> {label}
    </Button>
  );

  const body = () => {
    if (step.k === "existing")
      return (
        <ExistingAccount
          result={step.result}
          onContinue={() => void afterSignIn(step.result)}
          onNotYou={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            forgetRememberedDoor();
            setHint(undefined);
            setHintMethod(null);
            setStep({ k: "methods" });
          }}
        />
      );

    if (step.k === "passkey")
      return (
        <PasskeyOffer
          onSkip={() => void finish(step.result)}
          onSave={async () => {
            const supabase = createClient();
            try {
              const { error } = await supabase.auth.registerPasskey();
              if (!error) rememberPasskey();
            } catch {
              // A cancelled system sheet is a "not now": land either way rather
              // than strand a host who is already signed in.
            }
            await finish(step.result);
          }}
        />
      );

    if (step.k === "set-password")
      return (
        <SetInitialPassword
          heading="Set a new password"
          line="You just proved this address is yours. Pick the password you'll use next time."
          onDone={() => void finish({ existing: true, email: hint ?? "" })}
        />
      );

    if (step.k === "password")
      return (
        <div className="space-y-4">
          <SignIn
            hintEmail={hint}
            inputClassName={inputClassName}
            buttonClassName={buttonClassName}
            onUseCode={() => setStep({ k: "methods" })}
            onForgot={() => setStep({ k: "reset" })}
            onGoogle={methods.google ? () => void signInWithGoogle() : undefined}
            onDone={(email) => {
              // A password sign-in is only ever a RETURNING host, so nothing
              // here can be a new account: `existing` is true by construction
              // and the line never shows (it is a create-intent line anyway).
              if (remember) rememberDoor({ email, method: "password" });
              void finish({ existing: true, email });
            }}
          />
        </div>
      );

    // `methods` and `reset` share the ladder; reset only changes what the
    // verified code leads to (a new password rather than the app).
    return (
      <div className="space-y-4">
        {step.k === "reset" && (
          <p className="text-sm text-muted-foreground">
            Enter your email and we&rsquo;ll send a code. After you verify, you
            can set a new password.
          </p>
        )}
        {failure && (
          <FailurePaths
            failure={doorFailure(failure)}
            // ★ The ladder IS most of the recovery on a code-led door: the
            // field below is "send a new code" and "type the code", and the
            // Google button below is Google. Promoting either into the block
            // would draw it twice, forty pixels apart (the board's own
            // capture). What is left is what this screen does NOT already
            // offer: Contact, the limiter's countdown, a new password.
            suppress={[
              "send_code",
              "type_code",
              ...(methods.google
                ? (["google", "retry_google"] as const)
                : []),
            ]}
            handlers={{
              send_code: () => setFailure(null),
              try_again: () => setFailure(null),
              type_code: () => setFailure(null),
              retry_google: () => void signInWithGoogle(),
              google: methods.google
                ? () => void signInWithGoogle()
                : undefined,
              forgot: methods.password
                ? () => {
                    setFailure(null);
                    setStep({ k: "reset" });
                  }
                : undefined,
            }}
          />
        )}
        {passkeyReady && step.k === "methods" && (
          <>
            <Button
              type="button"
              size="lg"
              className={cn(
                "w-full active:scale-[0.99] motion-reduce:active:scale-100",
                buttonClassName,
              )}
              onClick={() => void signInWithPasskey()}
              disabled={busy}
            >
              <Fingerprint /> Sign in with a passkey
            </Button>
            {hint && (
              <p className="text-center text-xs text-muted-foreground">
                {maskEmail(hint)} · saved on this device
              </p>
            )}
            <Or />
          </>
        )}
        <EmailSignIn
          emailRedirectTo={emailRedirectTo}
          hintEmail={hint}
          inputClassName={inputClassName}
          buttonClassName={buttonClassName}
          sentAt={(email) => setCoding(Boolean(email))}
          onVerified={handleVerified}
        />
        {/* The ladder under the field disappears while a code is being typed. */}
        {!coding && (
          <>
            {children}
            {methods.google && (
              <>
                <Or />
                {hintMethod === "google" && hint
                  ? googleButton(`Continue as ${maskEmail(hint)}`, hint)
                  : googleButton()}
              </>
            )}
            {methods.password && step.k === "methods" && (
              <button
                type="button"
                onClick={() => setStep({ k: "password" })}
                className="block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Have a password? Use it instead
              </button>
            )}
            {step.k === "reset" && (
              <button
                type="button"
                onClick={() => setStep({ k: "password" })}
                className="block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Back to password sign-in
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div data-account-door={wear} className={cn("space-y-4", className)}>
      {chrome === "full" && step.k !== "existing" && step.k !== "passkey" && (
        <div className="space-y-1.5 text-center">
          <p className="font-heading text-subsection text-balance">
            {copy.heading}
          </p>
          <p className="text-sm text-muted-foreground">{copy.reason}</p>
        </div>
      )}
      {body()}
      {consent && (
        <LegalConsentLine
          newTab={wear !== "login"}
          className="pt-1 text-center"
        />
      )}
    </div>
  );
}

/** The divider the method ladder has always used. */
function Or() {
  return (
    <div className="flex items-center gap-3">
      <Separator className="flex-1" />
      <span className="text-xs text-muted-foreground">or</span>
      <Separator className="flex-1" />
    </div>
  );
}

/**
 * "Signed you into the account <email> already had."
 *
 * ★ RULED (Will, 2026-09-20, `existing=tell`): "it should be dismissible and
 * provide an action if it was a mistake". Both are here: Continue dismisses,
 * "Not you?" signs out on the spot and puts the door back with the field clear.
 *
 * ★ AND THE HOLD IS THE WHOLE POINT ON THE GUEST GATE. The caller's
 * `onVerified` there claims this browser's anonymous uploads onto the account
 * that just signed in. If that ran before "Not you?" was pressed, a guest's
 * photographs would be stamped onto a stranger's account and the claim RPC
 * never re-stamps an owned row, so it would be permanent. So the gate HOLDS,
 * for four seconds or until a choice, and nothing is claimed until then.
 */
function ExistingAccount({
  result,
  onContinue,
  onNotYou,
}: {
  result: DoorVerified;
  onContinue: () => void;
  onNotYou: () => Promise<void>;
}) {
  const [leaving, setLeaving] = useState(false);

  return (
    <div data-door-existing className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-muted/50 px-3 py-2.5">
        <p className="text-sm">
          Signed you into the account{" "}
          <span className="font-medium">{result.email}</span> already had.
        </p>
      </div>
      <Button
        type="button"
        size="lg"
        className="w-full active:scale-[0.99] motion-reduce:active:scale-100"
        onClick={onContinue}
        disabled={leaving}
      >
        Continue
      </Button>
      <button
        type="button"
        onClick={() => {
          setLeaving(true);
          void onNotYou();
        }}
        className="block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        {leaving ? "Signing out…" : "Not you? Sign out and use another email"}
      </button>
    </div>
  );
}

/**
 * "Sign in faster on this device." Offered ONCE, after a code sign-in, and only
 * where a passkey can actually exist: the flag on, the browser carrying
 * `PublicKeyCredential`, and no passkey saved here yet.
 */
function PasskeyOffer({
  onSave,
  onSkip,
}: {
  onSave: () => Promise<void>;
  onSkip: () => void;
}) {
  const [saving, setSaving] = useState(false);
  return (
    <div data-door-passkey className="flex flex-col gap-4 text-center">
      <div className="space-y-1.5">
        <p className="font-heading text-subsection">
          Sign in faster on this device
        </p>
        <p className="text-sm text-muted-foreground">
          Save a passkey and next time one press gets you in. No code, no email.
        </p>
      </div>
      <Button
        type="button"
        size="lg"
        className="w-full active:scale-[0.99] motion-reduce:active:scale-100"
        disabled={saving}
        onClick={() => {
          setSaving(true);
          void onSave();
        }}
      >
        <Fingerprint /> {saving ? "Saving…" : "Save a passkey"}
      </Button>
      <button
        type="button"
        onClick={onSkip}
        className="block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Not now
      </button>
    </div>
  );
}

/**
 * HOW THE DOOR FAILS: one kind, one short sentence, three real ways out.
 *
 * ★ RULED (Will, 2026-09-20, `app-door` r1 `failure=paths`): "the best selection
 * of these with keeping the failure on the screen and offering helpful actions".
 * What the option changed is not the sentence, which has to stay vague, but what
 * stands under it: today three recoveries are named in PROSE that points at
 * affordances a host then has to go and find. Here they are controls.
 *
 * ★ AND THE SENTENCE IS A SECURITY DECISION BEFORE IT IS A COPY ONE.
 * `signInWithPassword` answers a wrong password, an account with no password (a
 * Google-only host) and an unknown address with ONE error, because telling them
 * apart lets anyone test whether an address has an account here
 * (auth-accounts.md). `password_mismatch`'s line is that generic sentence,
 * shortened; NEVER make it specific. Every other kind names a thing that
 * happened to the REQUEST (a link aged out, a send failed, a limiter fired), not
 * a fact about an account, so those may be exact.
 *
 * Pure on purpose: the `/login` page, the callback route's `?error=` and the
 * in-page code screen all render through this one table, so the words and the
 * ways out cannot drift between them. The renderer is
 * `components/auth/failure-paths.tsx`; it maps an action id to a handler.
 */

export const DOOR_FAILURE_KINDS = [
  /** A magic link (or the OAuth code behind it) aged out before it was used. */
  "expired_link",
  /** The six digits did not verify. */
  "wrong_code",
  /** `signInWithOtp` refused to send at all. */
  "send_failed",
  /** A 429 from `signInWithOtp` (or the SMTP per-user interval). */
  "rate_limited",
  /** The Google round trip came back without a session. */
  "google_failed",
  /** The generic `signInWithPassword` refusal. Stays generic. */
  "password_mismatch",
] as const;

export type DoorFailureKind = (typeof DOOR_FAILURE_KINDS)[number];

/**
 * The verbs a failure can offer. The renderer owns what each one DOES (a
 * resend, a provider redirect, a view swap), so this file stays pure and the
 * same three buttons work on `/login`, in the gate and inside a dialog.
 */
export type DoorActionId =
  | "send_code"
  | "type_code"
  | "try_again"
  | "resend"
  | "different_email"
  | "google"
  | "retry_google"
  | "forgot"
  | "contact"
  | "wait";

export type DoorAction = {
  id: DoorActionId;
  label: string;
  /** A countdown is a real control that is not pressable yet, not a disabled
   *  button with a dead label: the renderer shows the seconds ticking. */
  waiting?: boolean;
};

export type DoorFailure = {
  kind: DoorFailureKind;
  line: string;
  /** Always three. A host who cannot get in needs every door named, and a
   *  shorter list is how the prose version failed. */
  actions: readonly [DoorAction, DoorAction, DoorAction];
};

const LINES: Record<DoorFailureKind, string> = {
  expired_link: "That sign-in link has expired.",
  wrong_code: "That code didn't work.",
  send_failed: "We couldn't send that email.",
  rate_limited: "Too many tries for now.",
  google_failed: "Google sign-in didn't finish.",
  // The shipped generic sentence, halved. The half that left ("If you usually
  // sign in with Google or an email code, use one of those below, or reset your
  // password") is the three buttons underneath.
  password_mismatch: "That email and password didn't match.",
};

const LABELS: Record<DoorActionId, string> = {
  send_code: "Send a new code",
  type_code: "Type the code instead",
  try_again: "Try again",
  resend: "Resend the code",
  different_email: "Use a different email",
  google: "Continue with Google",
  retry_google: "Try Google again",
  forgot: "Set a new password",
  contact: "Contact us",
  // Replaced with the live countdown by `doorFailure`'s `seconds`.
  wait: "Try again shortly",
};

/** The three ways out, per kind, in the order they are offered. */
const PATHS: Record<DoorFailureKind, readonly [DoorActionId, DoorActionId, DoorActionId]> =
  {
    expired_link: ["send_code", "google", "type_code"],
    wrong_code: ["try_again", "resend", "different_email"],
    send_failed: ["try_again", "google", "contact"],
    rate_limited: ["wait", "google", "contact"],
    google_failed: ["retry_google", "send_code", "contact"],
    password_mismatch: ["send_code", "forgot", "google"],
  };

function action(id: DoorActionId, seconds?: number): DoorAction {
  if (id === "wait") {
    // A countdown IS the recovery here: the limiter clears on its own, so the
    // honest control is the one that says when, not a link somewhere else.
    return {
      id,
      label:
        typeof seconds === "number" && seconds > 0
          ? `Try again in ${seconds}s`
          : LABELS.wait,
      waiting: true,
    };
  }
  return { id, label: LABELS[id] };
}

/**
 * The failure, resolved. `seconds` only reaches `rate_limited`'s countdown;
 * every other kind ignores it.
 */
export function doorFailure(
  kind: DoorFailureKind,
  seconds?: number,
): DoorFailure {
  const [a, b, c] = PATHS[kind];
  return {
    kind,
    line: LINES[kind],
    actions: [action(a, seconds), action(b, seconds), action(c, seconds)],
  };
}

/**
 * What a `?error=` on `/login` means.
 *
 * The callback route emits a KIND now. Two other spellings still arrive and must
 * not read as "no failure": `auth_callback` is what every magic-link email
 * already in a mailbox bounces back with, and Supabase's own OAuth error params
 * (`otp_expired`, `access_denied`, `server_error`) land here when a provider
 * refuses before our route sees a code. Anything else is treated as nothing
 * rather than guessed at, so a hand-typed query cannot paint a scare on the page.
 */
export function doorFailureKind(
  raw: string | null | undefined,
): DoorFailureKind | null {
  if (!raw) return null;
  const value = raw.toLowerCase();
  if ((DOOR_FAILURE_KINDS as readonly string[]).includes(value))
    return value as DoorFailureKind;
  switch (value) {
    // The legacy flag the shipped callback route emitted, and Supabase's own
    // expiry code: both mean the link a host tapped is no longer good for one.
    case "auth_callback":
    case "otp_expired":
      return "expired_link";
    case "access_denied":
      return "google_failed";
    case "server_error":
      return "send_failed";
    default:
      return null;
  }
}

/**
 * Whether a Supabase error should read as the limiter rather than a plain
 * failure. GoTrue answers a too-soon resend with 429 and a message naming the
 * seconds; the status is the reliable half, so the message is only a fallback.
 */
export function isRateLimited(error: {
  status?: number;
  code?: string;
  message?: string;
}): boolean {
  if (error.status === 429) return true;
  if (error.code === "over_email_send_rate_limit") return true;
  return /rate limit|too many requests|for security purposes/i.test(
    error.message ?? "",
  );
}

/**
 * The seconds GoTrue names in "For security purposes, you can only request this
 * after 41 seconds." Returns null when the message carries no number, so the
 * countdown falls back to the door's own cooldown rather than showing "0s".
 */
export function retryAfterSeconds(message: string | undefined): number | null {
  const m = /after (\d+) seconds?/i.exec(message ?? "");
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

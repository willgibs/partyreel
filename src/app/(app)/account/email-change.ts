/**
 * THE EMAIL CHANGE, AS STATE (lp/identity-email; Will, identity-door round 1 `remove`: "once an email
 * has been added, it may only be changed ... not fully removed").
 *
 * A confirmed address is CHANGED, never removed, and the change proves both ends. With Supabase
 * Auth's "Secure email change" on, `updateUser({ email })` mails one code to the current address and
 * one to the new address, and the address moves only once both are entered, in either order: the
 * first `verifyOtp({ type: "email_change" })` answers with no session (auth-js 2.106 reads GoTrue's
 * bare `{ msg, code }` as a null user), the second with the new session. The database copies the new
 * address onto the profile and the account's verified guest rows inside that same commit
 * (20260926200000_identity.sql).
 *
 * Pure, so the section (email-section.tsx) renders it, the server actions (email-actions.ts) share
 * its schema and its constants, and email-change.test.ts drives the machine with no browser.
 */
import { z } from "zod";

import { CODE_LENGTH } from "@/lib/auth/code-length";

/** The one shared code length (`src/lib/auth/code-length.ts`), under this name for
 *  email-actions.ts and email-section.tsx. */
export const EMAIL_CODE_LENGTH = CODE_LENGTH;

/**
 * How long a pending change's codes verify: lockstep with the dashboard's Email OTP Expiration
 * (3600 s). GoTrue never clears `new_email` when the codes die, so without this window a change
 * abandoned in March would still be "waiting for its codes" in May.
 */
export const EMAIL_CHANGE_TTL_MS = 60 * 60 * 1000;

/** The custom SMTP's per-user minimum interval: a resend inside it is refused, so the link waits. */
export const EMAIL_RESEND_COOLDOWN_S = 60;

/** The new address, as typed: trimmed and lowercased first (GoTrue stores it lowercased). */
export const newEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

/** Which address a code came to. */
export type ChangeSide = "current" | "new";

export const CHANGE_SIDES: readonly ChangeSide[] = ["current", "new"];

export function isChangeSide(value: unknown): value is ChangeSide {
  return value === "current" || value === "new";
}

export function otherSide(side: ChangeSide): ChangeSide {
  return side === "current" ? "new" : "current";
}

/** A change GoTrue is still waiting on: the new address and when its codes went out. */
export type PendingChange = { address: string; sentAt: string };

/**
 * The change in flight, from the auth user (`new_email`, `email_change_sent_at`, both on the user
 * `getUser()` returns), or null once its codes can no longer verify. A missing stamp reads as dead:
 * a stale panel asking for codes that cannot work is worse than one more "Change".
 */
export function livePendingChange(
  user: {
    new_email?: string | null;
    email_change_sent_at?: string | null;
  } | null,
  nowMs: number,
): PendingChange | null {
  const address = user?.new_email?.trim();
  const sentAt = user?.email_change_sent_at;
  if (!address || !sentAt) return null;
  const sentMs = Date.parse(sentAt);
  if (!Number.isFinite(sentMs) || nowMs - sentMs >= EMAIL_CHANGE_TTL_MS)
    return null;
  return { address, sentAt };
}

/**
 * What `/auth/callback?flow=email_change` says about a tapped link (`?email_change=`): `half` (one
 * address confirmed, we cannot tell which), `done` (the change completed) or `failed` (the link was
 * refused). ONLY A HINT: it picks a line of copy, and everything the section shows (the address, the
 * pending change) is read from `getUser()` on the server.
 */
export type EmailChangeHint = "half" | "done" | "failed";

export function parseEmailChangeHint(
  raw: string | string[] | undefined,
): EmailChangeHint | null {
  return raw === "half" || raw === "done" || raw === "failed" ? raw : null;
}

/* ─────────────────────────────── the machine ─────────────────────────────── */

export type SideState =
  | { status: "waiting" }
  | { status: "checking" }
  | { status: "confirmed" }
  | { status: "failed"; message: string };

export type PendingState = {
  step: "pending";
  /** The NEW address. The current one is the account's, passed to the section. */
  address: string;
  current: SideState;
  new: SideState;
  /** A tapped link's news, until a code in this visit says more. */
  hint: "half" | "failed" | null;
};

export type EmailSectionState =
  /** `parked` is a change left waiting ("Not now"), one tap from its panels again. */
  | { step: "idle"; parked: PendingState | null }
  | { step: "editing"; parked: PendingState | null }
  | PendingState
  | { step: "done"; email: string };

export type EmailSectionEvent =
  | { type: "edit" }
  | { type: "cancel" }
  | { type: "park" }
  | { type: "resume" }
  /** Codes went out (a first request or a resend): both sides start over. */
  | { type: "sent"; address: string }
  | { type: "check"; side: ChangeSide }
  | { type: "half"; side: ChangeSide }
  | { type: "done"; email: string }
  | { type: "refused"; side: ChangeSide; message: string }
  | { type: "retry"; side: ChangeSide };

const WAITING: SideState = { status: "waiting" };

function freshPending(
  address: string,
  hint: PendingState["hint"] = null,
): PendingState {
  return { step: "pending", address, current: WAITING, new: WAITING, hint };
}

export function initialEmailSectionState({
  pending,
  hint,
  email,
}: {
  pending: PendingChange | null;
  hint: EmailChangeHint | null;
  email: string | null;
}): EmailSectionState {
  if (pending) {
    return freshPending(
      pending.address,
      hint === "half" || hint === "failed" ? hint : null,
    );
  }
  if (hint === "done" && email) return { step: "done", email };
  return { step: "idle", parked: null };
}

export function emailSectionReducer(
  state: EmailSectionState,
  event: EmailSectionEvent,
): EmailSectionState {
  switch (event.type) {
    case "edit":
      if (state.step === "idle")
        return { step: "editing", parked: state.parked };
      if (state.step === "done") return { step: "editing", parked: null };
      return state;
    case "cancel":
      return state.step === "editing"
        ? { step: "idle", parked: state.parked }
        : state;
    case "park":
      return state.step === "pending" ? { step: "idle", parked: state } : state;
    case "resume":
      return state.step === "idle" && state.parked ? state.parked : state;
    case "sent":
      // ★ A resend starts BOTH sides over: GoTrue mints two new codes and zeroes the confirmation
      // count, so a side confirmed before it would otherwise read confirmed with nothing behind it.
      return state.step === "editing" || state.step === "pending"
        ? freshPending(event.address)
        : state;
    case "done":
      return state.step === "pending"
        ? { step: "done", email: event.email }
        : state;
    case "check": {
      if (state.step !== "pending") return state;
      const side = state[event.side];
      // A confirmed side is done (its code was spent), and one already checking waits its answer.
      if (side.status === "confirmed" || side.status === "checking")
        return state;
      return { ...state, [event.side]: { status: "checking" } };
    }
    case "half":
      if (state.step !== "pending") return state;
      return { ...state, [event.side]: { status: "confirmed" }, hint: null };
    case "refused":
      if (state.step !== "pending" || state[event.side].status === "confirmed")
        return state;
      return {
        ...state,
        [event.side]: { status: "failed", message: event.message },
      };
    case "retry":
      if (state.step !== "pending" || state[event.side].status !== "failed")
        return state;
      return { ...state, [event.side]: WAITING };
  }
}

/** The side a thumb should land on: the first one still owed a code. */
export function focusSide(state: PendingState): ChangeSide | null {
  return CHANGE_SIDES.find((s) => state[s].status !== "confirmed") ?? null;
}

/** The line above the two codes, which is the whole of what the person has to do next. */
export function pendingPrompt(
  state: PendingState,
  addresses: Record<ChangeSide, string>,
): string {
  const confirmed = CHANGE_SIDES.filter((s) => state[s].status === "confirmed");
  if (confirmed.length === 1) {
    return `Confirmed. Now enter the code we sent to ${addresses[otherSide(confirmed[0])]}.`;
  }
  if (state.hint === "half") {
    return "One of the two addresses is confirmed. Enter the code from the other email to finish.";
  }
  if (state.hint === "failed") {
    return "That link didn't work. Enter the codes from the two emails instead, or send new ones.";
  }
  return "Enter the code we sent to each address, in either order. Nothing changes until both are in.";
}

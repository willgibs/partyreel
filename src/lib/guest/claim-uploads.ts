import { toast } from "sonner";

import { collectStoredSessionTokens } from "@/lib/guest/session-tokens";
import { createClient } from "@/lib/supabase/client";

// Claiming anonymous uploads (attribution P3). An anonymous upload is a guests row with user_id NULL; the
// browser that made it still holds the session_token in localStorage under SESSION_PREFIX+{qr_token}. When
// the visitor authenticates we hand those tokens to claim_anonymous_uploads, which stamps user_id =
// auth.uid() onto the still-unclaimed matches only (never an owned row -> theft-proof + idempotent). The
// RPC is authenticated + browser-callable by design: identity is auth.uid() and the tokens are held
// capabilities, so there is no client-spoofable value for server-mediation to protect (cf. ADR-0016). The
// prefix + the pure token enumeration live in ./session-tokens (dependency-free + unit-tested).

// Module-scope guards (single module instance across every call site — keep imports STATIC):
//  - `inFlight` collapses CONCURRENT callers in one load (e.g. a mount + an in-page sign-in handler);
//  - `done` short-circuits SEQUENTIAL re-fires after a successful claim (e.g. a router.refresh()).
// We deliberately keep NO cross-load (sessionStorage) flag: a reload resets these, re-runs, and the RPC's
// `user_id is null` filter makes the repeat a silent 0-row no-op. Simpler, and it naturally re-attempts for
// a different account on a shared device (still theft-proof via the IS NULL guard).
let inFlight: Promise<void> | null = null;
let done = false;

// Best-effort + fire-and-forget (mirrors captureNewsletter): never throws, never blocks the caller. Silent
// when nothing is claimed. `opts.silent` also suppresses the toast on the guest /e/ paths, where it would
// stack with the "Saved" toast and isn't the account context; the loud toast fires on the (app) landing.
export function claimAnonymousUploads(opts?: {
  silent?: boolean;
}): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (done) return Promise.resolve();
  if (inFlight) return inFlight;
  inFlight = runClaim(opts?.silent ?? false).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runClaim(silent: boolean): Promise<void> {
  try {
    const tokens = collectStoredSessionTokens();
    if (tokens.length === 0) return; // nothing held yet — leave `done` false so a later call can retry

    const supabase = createClient();
    // getSession() is local (no network); a logged-out viewer has nothing to claim. Leave `done` false so
    // the next call AFTER sign-in (a fresh mount / a post-auth handler) runs for real.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase.rpc("claim_anonymous_uploads", {
      p_session_tokens: tokens,
    });
    if (error) return; // transient — allow a later load to retry

    done = true; // claimed (0+ rows); don't repeat this load
    if (!silent && typeof data === "number" && data > 0) {
      toast.success("We added your uploads to your account.");
    }
  } catch {
    // best-effort — a claim must never surface an error to the visitor
  }
}

import { toast } from "sonner";

import { currentAlbum } from "@/lib/guest/album-return";
import {
  SESSION_PREFIX,
  collectStoredSessionTokens,
} from "@/lib/guest/session-tokens";
import { createClient } from "@/lib/supabase/client";

// Claiming anonymous uploads. An anonymous upload is a guests row with user_id NULL; the
// browser that made it still holds the session_token in localStorage under SESSION_PREFIX+{qr_token}. When
// the visitor authenticates we hand those tokens to claim_anonymous_uploads, which stamps user_id =
// auth.uid() onto the still-unclaimed matches only (never an owned row -> theft-proof + idempotent). The
// RPC is authenticated + browser-callable by design: identity is auth.uid() and the tokens are held
// capabilities, so there is no client-spoofable value for server-mediation to protect (cf. database-security.md). The
// prefix + the pure token enumeration live in ./session-tokens (dependency-free + unit-tested).
//
// ★ THE CLAIM SAYS WHERE IT CARRIED UPLOADS. A person is a guest of an event only through an upload of
// theirs, and the claim is what brings their events into the account (each becomes a Guest card on the
// dashboard). The RPC's count is the claimed rows that carry a LIVE upload (migration 20260923120000),
// and on an album page the claim is made in two calls, that album's own token first and every other token
// after, so the result can say HERE and ELSEWHERE apart: the album plays the follow moment only when its
// own uploads moved, and says "We added your uploads to your account." only when the claim reached other
// events too (lib/guest/use-confirm-return.ts). Off an album (the (app) layout) it is one call, and the
// toast fires whenever anything moved.

/** The one line a claim that moved uploads says, wherever it is said. */
export const CLAIMED_TOAST = "We added your uploads to your account.";

export type ClaimResult = {
  /** The album on screen when the claim ran (its canonical qr_token), or null off an album. */
  album: string | null;
  /** Claimed rows carrying a live upload AT that album. */
  here: number;
  /** Claimed rows carrying a live upload anywhere else. */
  elsewhere: number;
};

// Whoever cares what a claim carried, whichever caller started it (a door's own onVerified, the album
// page's mount, a like's sign-in): the album page subscribes, because only it knows what to play.
const listeners = new Set<(result: ClaimResult) => void>();

export function onClaimed(listener: (result: ClaimResult) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Module-scope guards (single module instance across every call site — keep imports STATIC):
//  - `inFlight` collapses CONCURRENT callers in one load (e.g. a mount + an in-page sign-in handler);
//  - `done` short-circuits SEQUENTIAL re-fires after a successful claim (e.g. a router.refresh()).
// We deliberately keep NO cross-load (sessionStorage) flag: a reload resets these, re-runs, and the RPC's
// `user_id is null` filter makes the repeat a silent 0-row no-op. Simpler, and it naturally re-attempts for
// a different account on a shared device (still theft-proof via the IS NULL guard).
let inFlight: Promise<ClaimResult | null> | null = null;
let done = false;

// Best-effort: never throws, never blocks the caller beyond its own await. Resolves to what the claim
// carried, or null when nothing ran (signed out, nothing held, a transient failure). `opts.silent`
// suppresses this module's own toast, which is right on the guest /e/ paths: the album page decides what
// to say there (see the note at the top). The loud toast is the (app) landing's.
export function claimAnonymousUploads(opts?: {
  silent?: boolean;
}): Promise<ClaimResult | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (done) return Promise.resolve(null);
  if (inFlight) return inFlight;
  inFlight = runClaim(opts?.silent ?? false).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runClaim(silent: boolean): Promise<ClaimResult | null> {
  try {
    const tokens = collectStoredSessionTokens();
    if (tokens.length === 0) return null; // nothing held yet — leave `done` false so a later call can retry

    const supabase = createClient();
    // getSession() is local (no network); a logged-out viewer has nothing to claim. Leave `done` false so
    // the next call AFTER sign-in (a fresh mount / a post-auth handler) runs for real.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const album = currentAlbum();
    let hereToken: string | null = null;
    if (album) {
      try {
        hereToken = localStorage.getItem(`${SESSION_PREFIX}${album}`);
      } catch {
        hereToken = null;
      }
    }
    const others = tokens.filter((token) => token !== hereToken);

    let here = 0;
    if (hereToken) {
      const { data, error } = await supabase.rpc("claim_anonymous_uploads", {
        p_session_tokens: [hereToken],
      });
      if (error) return null; // transient — allow a later load to retry
      here = typeof data === "number" ? data : 0;
    }

    let elsewhere = 0;
    let complete = true;
    if (others.length > 0) {
      const { data, error } = await supabase.rpc("claim_anonymous_uploads", {
        p_session_tokens: others,
      });
      if (error) {
        // This album's own claim landed; the rest retries on a later call.
        complete = false;
      } else {
        elsewhere = typeof data === "number" ? data : 0;
      }
    }

    done = complete; // claimed (0+ rows); don't repeat this load
    const result: ClaimResult = { album, here, elsewhere };
    if (!silent && here + elsewhere > 0) toast.success(CLAIMED_TOAST);
    for (const listener of listeners) listener(result);
    return result;
  } catch {
    // best-effort — a claim must never surface an error to the visitor
    return null;
  }
}

import { toast } from "sonner";

import { currentAlbum } from "@/lib/guest/album-return";
import {
  publishClaimAsks,
  saidNotMine,
  type ClaimAsk,
} from "@/lib/guest/claim-ask";
import {
  SESSION_PREFIX,
  collectStoredSessionTokens,
  collectStoredTickets,
  type StoredTicket,
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
// ★ A SHARED PHONE'S TICKETS ARE SETTLED BEFORE THEY MOVE (shared-claims, migration 20260929234000). A
// ticket this browser holds may be somebody else's: a party's phone is passed around, and the next
// person to sign in on it is not whoever typed at the album. So the RPC takes only a ticket that can be
// hers (her own confirmed address, or no address and no name at odds with hers; the rule is the
// server's alone, `whose_ticket`); one typed under another address waits for its owner's claims
// review; and one typed under ANOTHER NAME is asked about. After every claim this module reads those
// (`claim_ticket_asks`, leaving out every album this account already answered) and queues one
// question a name for the screen that asks it (`claim-ask.ts`, `components/shared/claim-ask.tsx`); her
// yes claims exactly those tickets (`claimAskedUploads`). The count, the split and the toast below are
// the silent claim's alone.
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

/**
 * ★ THE TWO CALLS SHARED-CLAIMS ADDED ARE REACHED BY NAME until `types.ts` regenerates after its
 * migration applies (20260929234000); the Orchestrator's regeneration lets them move onto the typed
 * client. Both take the claim's own argument, and PostgREST resolves a call by its argument NAMES, so
 * the names are pinned where they are made (claim-uploads.test.tsx). A function not yet applied
 * answers PGRST202, which reads here as nothing to ask and nothing claimed.
 */
type ByName = {
  rpc: (
    fn: "claim_ticket_asks" | "claim_asked_uploads",
    args: { p_session_tokens: string[] },
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};
function byName(client: ReturnType<typeof createClient>): ByName {
  return client as unknown as ByName;
}

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
    // Then the ask, never awaited: a door awaiting the claim must not wait on a question as well.
    void findAsks(supabase, session.user.id);
    return result;
  } catch {
    // best-effort — a claim must never surface an error to the visitor
    return null;
  }
}

/**
 * WHAT THIS PHONE HOLDS THAT WAS TYPED UNDER ANOTHER NAME, queued for her answer. Every held ticket
 * but the albums this account already answered "Not mine" to goes to `claim_ticket_asks`, which
 * answers per typed name (the name, the live uploads, the tickets) and only what the silent claim
 * left for her word. Best-effort like the claim: a failure (or a function not yet applied) asks
 * nothing this load, and the next load asks again.
 */
async function findAsks(
  supabase: ReturnType<typeof createClient>,
  account: string,
): Promise<void> {
  try {
    const held = collectStoredTickets().filter(
      (ticket) => !saidNotMine(account, ticket.album),
    );
    if (held.length === 0) return;
    const { data, error } = await byName(supabase).rpc("claim_ticket_asks", {
      p_session_tokens: [...new Set(held.map((ticket) => ticket.token))],
    });
    if (error) return;
    publishClaimAsks(readAsks(data, held, account));
  } catch {
    // best-effort: nothing is asked, and nothing moved
  }
}

/**
 * The server's answer, read defensively: an entry with no name, no upload or no ticket this phone
 * holds is nobody's question.
 */
function readAsks(
  data: unknown,
  held: StoredTicket[],
  account: string,
): ClaimAsk[] {
  if (!Array.isArray(data)) return [];
  const asks: ClaimAsk[] = [];
  for (const entry of data) {
    if (!entry || typeof entry !== "object") continue;
    const { name, uploads, tokens } = entry as Record<string, unknown>;
    if (typeof name !== "string" || !name.trim()) continue;
    if (typeof uploads !== "number" || uploads < 1) continue;
    if (!Array.isArray(tokens)) continue;
    const tickets = tokens.flatMap((token) =>
      held.filter((ticket) => ticket.token === token),
    );
    if (tickets.length === 0) continue;
    asks.push({ account, name: name.trim(), uploads, tickets });
  }
  return asks;
}

/**
 * HER YES: claim exactly the tickets she was asked about, for the account that was asked. Resolves to
 * the claimed rows that carry a live upload (the claim's own count), or null when nothing ran: another
 * account is signed in on this phone now (it was never asked), or the call failed. The server still
 * never takes a ticket that names another address, whatever the answer.
 */
export async function claimAskedUploads(ask: ClaimAsk): Promise<number | null> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session || session.user.id !== ask.account) return null;
    const { data, error } = await byName(supabase).rpc("claim_asked_uploads", {
      p_session_tokens: [...new Set(ask.tickets.map((ticket) => ticket.token))],
    });
    if (error) return null;
    return typeof data === "number" ? data : 0;
  } catch {
    return null;
  }
}

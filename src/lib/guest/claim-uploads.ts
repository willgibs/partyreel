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
// ★ AND IT SAYS WHERE A TICKET TYPED UNDER ANOTHER ADDRESS WAITS (crumbs-24, migration 20260930110000).
// Nothing on the phone ever takes or asks about such a ticket, so a guest who typed dana@work under her
// name and confirmed as dana@gmail kept photos that stayed Unverified, and the confirmation told her a
// name they did not carry. The same read now answers those tickets too (their live uploads, never the
// address), and the album on screen asks `claimLeftForAnotherAddress` before it speaks its one beat.
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
  /**
   * Her yes to the shared-phone ask (`claimAskedUploads`): she vouched for exactly these photos, so an
   * album whose own uploads it moved plays its follow moment for it, as it does after a door opened there.
   */
  asked?: true;
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
    // Then the ask, never awaited: a door awaiting the claim must not wait on a question as well. The
    // album's beat awaits it on its own (`claimLeftForAnotherAddress`), once its door has closed.
    askRead = findAsks(supabase, session.user.id);
    return result;
  } catch {
    // best-effort — a claim must never surface an error to the visitor
    return null;
  }
}

/**
 * What the last ask read found left for ANOTHER ADDRESS: the live uploads at each album whose ticket was
 * typed under an address that is not the account's (one entry a ticket, `kind` address). Replaced by
 * every read, emptied while one is on its way, and never the address itself.
 */
let leftForAddress: ReadonlyMap<string, number> = new Map();
/** The read the last claim started; settled (never rejected) when it lands. */
let askRead: Promise<void> = Promise.resolve();

/**
 * THE PHOTOS AT THIS ALBUM THAT WAIT FOR ANOTHER ADDRESS, as the ask read after the last claim found
 * them (0 when none, or when the read failed: a line that cannot be said is simply not said). The album
 * page's beat asks it before it speaks, so a confirmation whose claim left this album's photos for the
 * address typed with them says where they wait, and never "You're on as ..." over photos that did not
 * move (`confirm-beat.ts`).
 */
export async function claimLeftForAnotherAddress(
  album: string,
): Promise<number> {
  await askRead;
  return leftForAddress.get(album) ?? 0;
}

/**
 * WHAT THIS PHONE HOLDS THAT THE CLAIM LEFT: the tickets typed under another name, queued for her answer,
 * and the ones typed under another address, which only say where they wait. Every held ticket but the
 * albums this account already answered "Not mine" to goes to `claim_ticket_asks`, which answers per typed
 * name (the name, the live uploads, the tickets) and per ticket left for another address. Best-effort
 * like the claim: a failure asks nothing and says nothing this load, and the next load reads again.
 */
async function findAsks(
  supabase: ReturnType<typeof createClient>,
  account: string,
): Promise<void> {
  leftForAddress = new Map();
  try {
    const held = collectStoredTickets().filter(
      (ticket) => !saidNotMine(account, ticket.album),
    );
    if (held.length === 0) return;
    const { data, error } = await supabase.rpc("claim_ticket_asks", {
      p_session_tokens: [...new Set(held.map((ticket) => ticket.token))],
    });
    if (error) return;
    const found = readAnswer(data, held, account);
    leftForAddress = found.left;
    publishClaimAsks(found.asks);
  } catch {
    // best-effort: nothing is asked or said, and nothing moved
  }
}

/**
 * The server's answer, read defensively: an entry with no upload or no ticket this phone holds is
 * nobody's; one of a kind this build does not know is skipped; an ask needs its name.
 */
function readAnswer(
  data: unknown,
  held: StoredTicket[],
  account: string,
): { asks: ClaimAsk[]; left: Map<string, number> } {
  const asks: ClaimAsk[] = [];
  const left = new Map<string, number>();
  if (!Array.isArray(data)) return { asks, left };
  for (const entry of data) {
    if (!entry || typeof entry !== "object") continue;
    const { kind, name, uploads, tokens } = entry as Record<string, unknown>;
    if (typeof uploads !== "number" || uploads < 1) continue;
    if (!Array.isArray(tokens)) continue;
    const tickets = tokens.flatMap((token) =>
      held.filter((ticket) => ticket.token === token),
    );
    if (tickets.length === 0) continue;
    if (kind === "address") {
      // One entry a ticket, so its uploads are its album's.
      for (const ticket of tickets) {
        left.set(ticket.album, (left.get(ticket.album) ?? 0) + uploads);
      }
      continue;
    }
    if (kind !== undefined) continue;
    if (typeof name !== "string" || !name.trim()) continue;
    asks.push({ account, name: name.trim(), uploads, tickets });
  }
  return { asks, left };
}

/**
 * HER YES: claim exactly the tickets she was asked about, for the account that was asked, and say where
 * it carried them, as the silent claim does: on an album, its own tickets first and the rest after, so a
 * yes that moved this album's own uploads plays its follow moment (the result reaches every listener,
 * `asked` set). Resolves to what moved, or null when nothing ran: another account is signed in on this
 * phone now (it was never asked), or the first call failed. The server still never takes a ticket that
 * names another address, whatever the answer.
 */
export async function claimAskedUploads(
  ask: ClaimAsk,
): Promise<ClaimResult | null> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session || session.user.id !== ask.account) return null;
    const album = currentAlbum();
    const tokensOf = (tickets: StoredTicket[]) => [
      ...new Set(tickets.map((ticket) => ticket.token)),
    ];
    const hereTokens = tokensOf(
      ask.tickets.filter((ticket) => album !== null && ticket.album === album),
    );
    const otherTokens = tokensOf(
      ask.tickets.filter((ticket) => album === null || ticket.album !== album),
    ).filter((token) => !hereTokens.includes(token));

    let here = 0;
    let elsewhere = 0;
    let ran = false;
    if (hereTokens.length > 0) {
      const { data, error } = await supabase.rpc("claim_asked_uploads", {
        p_session_tokens: hereTokens,
      });
      if (error) return null;
      here = typeof data === "number" ? data : 0;
      ran = true;
    }
    if (otherTokens.length > 0) {
      const { data, error } = await supabase.rpc("claim_asked_uploads", {
        p_session_tokens: otherTokens,
      });
      // This album's own landed; the rest is asked again on a later visit.
      if (error && !ran) return null;
      if (!error) elsewhere = typeof data === "number" ? data : 0;
    }
    const result: ClaimResult = { album, here, elsewhere, asked: true };
    for (const listener of listeners) listener(result);
    return result;
  } catch {
    return null;
  }
}

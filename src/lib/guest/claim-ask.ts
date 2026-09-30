import { formatCount } from "@/lib/format/count";
import type { StoredTicket } from "@/lib/guest/session-tokens";

/**
 * THE ASK ON A SHARED PHONE (shared-claims, build 26's red-team).
 *
 * A party's phone gets passed around: a guest types a name (and maybe an address) at an album and
 * adds photos, and later somebody else signs in on the same phone. Whose those photos are is settled
 * on the server, in one rule (`whose_ticket`, migration 20260929234000): the claim at sign-in takes
 * only a ticket that can be hers (her own confirmed address, or no address and no name at odds with
 * hers); one typed under another address waits for that address's owner, who claims it from her own
 * dashboard; and one typed under ANOTHER NAME is asked about, once, in plain words, before anything
 * moves. This module holds the asking's three small parts, free of React and of Supabase:
 *
 *   - the QUEUE: what the claim found to ask (`claim-uploads.ts` publishes it after the silent claim),
 *     one question a typed name, read by the one screen that asks it (`components/shared/claim-ask`),
 *     which is mounted wherever a claim runs (the (app) layout, the album page);
 *   - the ANSWER'S MEMORY: a "Not mine" is remembered on this phone, for the account that was asked,
 *     against each album the answer covered (`pr_not_mine_<qr_token>`), so the same question is never
 *     put to her twice. ★ It holds account ids and never a token (the ticket stays the one secret on
 *     the device), and it goes with its ticket: putting a ticket down forgets its answers
 *     (`use-stored-name.ts`). A question closed unanswered is not an answer, so a later visit asks it
 *     again;
 *   - the WORDS, the brief's own sentence.
 *
 * Every storage touch is guarded (the `use-stored-session.ts` rule): a blocked store remembers
 * nothing and asks again, which is the harmless direction.
 */

export type ClaimAsk = {
  /** The account asked: whose answer this is (the memory's key, never an authorization). */
  account: string;
  /** The name the tickets were typed under, as the newest of them typed it. */
  name: string;
  /** Their live uploads, together. */
  uploads: number;
  /** The tickets the answer covers, each with the album it is this phone's ticket for. */
  tickets: StoredTicket[];
};

/* ── the queue ─────────────────────────────────────────────────────────────────────────────── */

let asks: readonly ClaimAsk[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** The same question, whichever load found it: the same account, about the same tickets. */
function sameAsk(a: ClaimAsk, b: ClaimAsk): boolean {
  if (a.account !== b.account || a.tickets.length !== b.tickets.length) {
    return false;
  }
  const tokens = new Set(a.tickets.map((t) => t.token));
  return b.tickets.every((t) => tokens.has(t.token));
}

/** For `useSyncExternalStore`. */
export function subscribeClaimAsks(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The questions still to ask, first first (a stable array between changes). */
export function currentClaimAsks(): readonly ClaimAsk[] {
  return asks;
}

/**
 * What a claim found to ask, replacing whatever an earlier claim found. A question already queued
 * keeps its identity, so a question on screen stays on screen when the next load finds it again.
 */
export function publishClaimAsks(next: readonly ClaimAsk[]): void {
  asks = next.map((ask) => asks.find((held) => sameAsk(held, ask)) ?? ask);
  emit();
}

/** A question answered (or put away unanswered): it leaves the queue. */
export function settleClaimAsk(ask: ClaimAsk): void {
  if (!asks.includes(ask)) return;
  asks = asks.filter((held) => held !== ask);
  emit();
}

/* ── the answer's memory ───────────────────────────────────────────────────────────────────── */

/**
 * `pr_not_mine_<qr_token>`: the accounts that said this album's ticket was not theirs. Its own
 * prefix, so `collectStoredSessionTokens` never mistakes it for a ticket (pinned there).
 */
export const NOT_MINE_PREFIX = "pr_not_mine_";

function readAccounts(album: string): string[] {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(`${NOT_MINE_PREFIX}${album}`) ?? "[]",
    );
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    // A damaged or unreadable answer is no answer: the phone asks again.
    return [];
  }
}

/** Whether this account already said this album's ticket was not hers. */
export function saidNotMine(account: string, album: string): boolean {
  return readAccounts(album).includes(account);
}

/** Remember a "Not mine" for the account that was asked, on every album the question covered. */
export function rememberNotMine(ask: ClaimAsk): void {
  for (const album of new Set(ask.tickets.map((t) => t.album))) {
    const accounts = readAccounts(album);
    if (accounts.includes(ask.account)) continue;
    try {
      localStorage.setItem(
        `${NOT_MINE_PREFIX}${album}`,
        JSON.stringify([...accounts, ask.account]),
      );
    } catch {
      // Blocked storage: the answer is not remembered, and a later visit asks again.
    }
  }
}

/* ── the words ─────────────────────────────────────────────────────────────────────────────── */

/**
 * The brief's sentence ("3 photos were added on this phone as Dana. Are they yours?"), counted, with
 * what a yes does, and the two answers, the safe one named first by the screen. "Photos" as the
 * claims review counts them, videos included.
 */
export function claimAskWords(ask: Pick<ClaimAsk, "name" | "uploads">): {
  title: string;
  question: string;
  mine: string;
  notMine: string;
} {
  const one = ask.uploads === 1;
  return {
    title: one
      ? `1 photo was added on this phone as ${ask.name}`
      : `${formatCount(ask.uploads)} photos were added on this phone as ${ask.name}`,
    question: one
      ? "Is it yours? If it is, it joins your account."
      : "Are they yours? If they are, they join your account.",
    mine: one ? "It's mine" : "They're mine",
    notMine: "Not mine",
  };
}

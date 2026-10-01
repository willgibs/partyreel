/**
 * THE HEARTS' SEED: which account the hearts on screen are for, which ids are asked about, and how many asks are
 * out. The likes provider's (`likes-provider.tsx`), pure and handed its reads, so it is pinned without a browser.
 *
 * ★ IT FOLLOWS WHO THE DEVICE HOLDS (crumbs-40, build 35's red-team; Sentry `JAVASCRIPT-NEXTJS-6J`). The provider
 * decided once, for its life, that she was signed in, so after a sign-out in another tab the next photograph to
 * arrive was asked about through `my_liked_media_ids`, which only an account may call: a 42501, reported as a failed
 * seed. Every ask now reads the session as it goes (`look`, a local read of the cookie, as the guest header's look
 * is), and calls nothing without one. The hearts are the account's own, so when the account goes they go with it,
 * and when one arrives (a sign-in here or in another tab) every id the album has mounted is asked about again, for
 * her. An answer that lands after the account changed is the last account's, and is never painted.
 *
 * ★ A BURST'S ASKS GO TOGETHER, as the link store's do (crumbs-33, `lib/album/links.ts`): at most `MAX_IN_FLIGHT`
 * asks are out at once, and whatever is seeded while every place is taken waits and goes as ONE ask when a place
 * comes free. A held arrow key in the viewer seeds a new neighbour a step, and each step was its own request (157
 * of them in about 200 steps, where the link store made 3). The whole wait goes in that one ask, since the answer
 * is a single uuid[] that neither a URL nor the row cap clips (the 1,000-row round measured 100,000 ids), so there
 * is no "newest first" to choose. An ask still out after `SLOT_TIMEOUT_MS` gives its place up (it still lands), so
 * a stalled one never holds the hearts.
 */
import { MAX_IN_FLIGHT, SLOT_TIMEOUT_MS } from "@/lib/album/links";

/** The hearts the seed fills, and empties when the account they were for goes. */
export type SeedStore = {
  set(id: string, liked: boolean): void;
  clear(): void;
};

export type SeedQueueOptions<E> = {
  store: SeedStore;
  /** Who the device holds now: the session's account, or null (a local read; it never needs the network). */
  readAccount: () => Promise<string | null>;
  /** `my_liked_media_ids` for these ids, as the client answers it: the liked ones among them, or the error. */
  askLiked: (ids: string[]) => PromiseLike<{ data: unknown; error: E | null }>;
  /** An ask refused while its account still stands: a real failure, reported (the hearts stay unfilled). */
  onFailed: (error: E, ids: number) => void;
  /** Asks out at once (`MAX_IN_FLIGHT`; a test may change it). */
  maxInFlight?: number;
  /** How long an ask holds its place before it gives it up (`SLOT_TIMEOUT_MS`). */
  slotTimeoutMs?: number;
};

export type SeedQueue = {
  /** The ids a window mounts: each asked about once for the account here, a burst's in one ask. */
  seed(ids: readonly string[]): void;
  /** Read who the device holds, and follow it. Resolves to that account, or null when nobody is signed in. */
  look(): Promise<string | null>;
  /** The SDK's own word that this account, or nobody (null), is here now. */
  follow(account: string | null): void;
  /** The account the hearts are for, as last read: undefined before the first look. */
  account(): string | null | undefined;
};

export function createSeedQueue<E>(opts: SeedQueueOptions<E>): SeedQueue {
  const maxInFlight = Math.max(1, opts.maxInFlight ?? MAX_IN_FLIGHT);
  const slotTimeoutMs = opts.slotTimeoutMs ?? SLOT_TIMEOUT_MS;

  /** Every id a window has mounted, so a new account's hearts can be asked about again. */
  const seen = new Set<string>();
  /** Answered for the account the hearts are for: never asked again while it stays. */
  const asked = new Set<string>();
  /** In an ask that is out: never asked twice at once. */
  const asking = new Set<string>();
  /** Seeded and not yet sent, oldest first. */
  const waiting = new Set<string>();
  let out = 0;
  let pumpScheduled = false;
  /** The account the hearts are for: undefined until the first look, null when nobody is signed in. */
  let current: string | null | undefined = undefined;
  /** The newest look wins: an older read that lands after a newer one began is not followed. */
  let looks = 0;

  function follow(account: string | null) {
    const was = current;
    current = account;
    // The first look draws nothing away (the Likes tab paints its hearts before any read).
    if (was === undefined || was === account) return;
    // Another account, or nobody: the hearts on screen were the last account's.
    opts.store.clear();
    asked.clear();
    if (account !== null) enqueue(seen);
  }

  async function look(): Promise<string | null> {
    const mine = ++looks;
    let account: string | null;
    try {
      account = await opts.readAccount();
    } catch {
      // A read that failed says nothing about who is here: keep what is drawn.
      return current ?? null;
    }
    if (mine === looks) follow(account);
    return account;
  }

  function enqueue(ids: Iterable<string>) {
    for (const id of ids) {
      if (asked.has(id) || asking.has(id)) continue;
      // Asked again: it moves to the newest end.
      waiting.delete(id);
      waiting.add(id);
    }
    if (pumpScheduled || waiting.size === 0) return;
    pumpScheduled = true;
    // The same tick's seeds share one ask: the pump runs once the tick's calls are all in.
    queueMicrotask(() => {
      pumpScheduled = false;
      pump();
    });
  }

  /** Send what waits while a place is free, all of it in one ask (see the head note). */
  function pump() {
    while (out < maxInFlight && waiting.size > 0) {
      const batch = [...waiting];
      waiting.clear();
      out += 1;
      let holding = true;
      const giveUpPlace = () => {
        if (!holding) return;
        holding = false;
        out -= 1;
        pump();
      };
      const stalled = setTimeout(giveUpPlace, slotTimeoutMs);
      void ask(batch).finally(() => {
        clearTimeout(stalled);
        giveUpPlace();
      });
    }
  }

  async function ask(batch: string[]): Promise<void> {
    for (const id of batch) asking.add(id);
    let askedFor: string | null = null;
    try {
      // The session at the ask, never one read earlier.
      askedFor = await look();
      if (askedFor === null) return;
      const { data, error } = await opts.askLiked(batch);
      // The hearts are another account's now: this answer is not theirs.
      if (current !== askedFor) return;
      if (error) {
        // Refused because the session ended (or changed) while the ask was out: that is the sign-out, not a
        // failure, and the look has already let the hearts go.
        if ((await look()) !== askedFor) return;
        opts.onFailed(error, batch.length);
        return;
      }
      for (const id of batch) asked.add(id);
      // One uuid[] (never rows); anything else reads as no hearts rather than a crash.
      if (Array.isArray(data)) {
        for (const id of data)
          if (typeof id === "string") opts.store.set(id, true);
      }
    } catch {
      // Nothing answered and nothing marked: the next seed asks again.
    } finally {
      for (const id of batch) asking.delete(id);
      // Asked for an account that has gone: the one here now is asked about these too.
      if (askedFor !== null && current && current !== askedFor) enqueue(batch);
    }
  }

  return {
    seed(ids) {
      for (const id of ids) seen.add(id);
      enqueue(ids);
    },
    look,
    follow(account) {
      looks += 1;
      follow(account);
    },
    account: () => current,
  };
}

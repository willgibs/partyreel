// The per-event guest session_token capability (database-security.md) lives in localStorage under SESSION_PREFIX +
// {qr_token}. This module holds the ONE prefix literal + the pure enumeration of stored tokens, kept
// dependency-free (no supabase/env/react/sonner import) so it stays unit-testable in the Node test env and
// can be shared by both the storage hook (use-stored-session) and the claim helper (claim-uploads).

export const SESSION_PREFIX = "pr_session_";

type StorageLike = Pick<Storage, "length" | "key" | "getItem">;

// Pure + Node-testable (inject a fake StorageLike). Returns every distinct, non-empty session_token the
// browser holds, scanning by SESSION_PREFIX. Other pr_* keys (pr_pending_offer_*, pr_save_prompt_*,
// pr_guest_name_*, pr_guest_email_attached_*) and the theme / supabase keys have distinct prefixes, so
// they're never picked up — which matters most for the two `pr_guest_` families, whose values are a
// LABEL and a FLAG: handing either to `claim_anonymous_uploads` would post a name where a secret is
// expected. `session-tokens.test.ts` pins that rather than leaving it to a reading of the code.
export function collectStoredSessionTokens(
  storage: StorageLike = window.localStorage,
): string[] {
  const tokens = new Set<string>();
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key || !key.startsWith(SESSION_PREFIX)) continue;
    const value = storage.getItem(key);
    if (value) tokens.add(value);
  }
  return [...tokens];
}

/**
 * Every stored KEY under any of `prefixes`, collected before anything is removed (the sign-out puts
 * down every guest ticket on the device). Collected first on purpose: removing while walking
 * `storage.key(i)` shifts the indices under the loop and skips every other key. Pure and
 * Node-testable like the enumeration above; the callers pass their OWN prefix constants, so no
 * family's literal is ever written twice.
 */
export function storedKeysWithPrefixes(
  prefixes: readonly string[],
  storage: Pick<Storage, "length" | "key"> = window.localStorage,
): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
      keys.push(key);
    }
  }
  return keys;
}

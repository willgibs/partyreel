"use client";

import { useCallback, useSyncExternalStore } from "react";

import { storedKeysWithPrefixes } from "@/lib/guest/session-tokens";

/**
 * THE NAME THIS BROWSER TYPED, beside the session token it belongs to.
 *
 * A name-only guest's identity lives in the `guests` row; this is the LOCAL copy,
 * kept for exactly two jobs the server cannot do from here:
 *   1. the header's third state knows who this device is without a round trip,
 *      and the door knows not to ask twice;
 *   2. `pr_guest_name_last` prefills the NEXT event's door, because the second
 *      party a phone scans should not ask a stranger's question twice.
 *
 * ★ IT IS NOT A CAPABILITY AND AUTHORISES NOTHING. The session token is the
 * capability (`use-stored-session.ts`); this is a label beside it. That is why
 * `collectStoredSessionTokens` must never pick these keys up — its scan is by
 * `pr_session_` prefix and these two start `pr_guest_name_`, which
 * `session-tokens.test.ts` pins rather than leaves to a reading of the code.
 *
 * ★ EVERY TOUCH IS GUARDED, for the reason `use-stored-session.ts` states at
 * length: blocking site data makes the `localStorage` GETTER ITSELF throw, and a
 * throw inside a `useSyncExternalStore` snapshot happens during RENDER and takes
 * the album down with it. A guest who cannot persist a name is a guest who types
 * it again, never a guest staring at a crashed page.
 */

export const GUEST_NAME_PREFIX = "pr_guest_name_";
/** The cross-event prefill: the last name typed at any door on this device. */
export const GUEST_NAME_LAST_KEY = "pr_guest_name_last";

/**
 * ★ WHETHER THIS DEVICE PUT AN ADDRESS ON THIS EVENT'S ROW — AND NEVER WHICH ONE.
 * The flag is `"1"` or absent, and it decides exactly two things in the guest's
 * OWN menu: the label under their name reads "Email not confirmed" instead of
 * the public mark's word, and the row offers "Confirm your email" instead of
 * "Add your email".
 *
 * ★ THE ADDRESS ITSELF IS NEVER WRITTEN HERE, and that is a rule rather than an
 * omission: this is a phone that gets passed around a party, and the whole
 * reason `lib/auth/remembered-email.ts` is `/login`-only is that the next person
 * to hold it must not be shown the last one's address. It lives in the page's
 * own React state for this visit (to prefill the offer card's door) and nowhere
 * else, which is why the menu's confirm door opens with an EMPTY field.
 */
export const GUEST_EMAIL_ATTACHED_PREFIX = "pr_guest_email_attached_";

function nameKey(qrToken: string) {
  return `${GUEST_NAME_PREFIX}${qrToken}`;
}

function emailAttachedKey(qrToken: string) {
  return `${GUEST_EMAIL_ATTACHED_PREFIX}${qrToken}`;
}

// Same-tab subscribers — the native `storage` event only fires in OTHER tabs.
// The identical module-singleton shape as use-stored-session, so the header
// island and the page's shell see each other's writes without a shared parent.
const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

function read(key: string): string | null {
  try {
    const value = localStorage.getItem(key);
    return value && value.trim() ? value : null;
  } catch {
    return null;
  }
}

/** Imperative setter for callers outside the hook (the door, the rename step). */
export function setStoredName(qrToken: string, value: string | null) {
  try {
    if (value === null) {
      localStorage.removeItem(nameKey(qrToken));
    } else {
      localStorage.setItem(nameKey(qrToken), value);
      // The prefill follows the latest name, never the first one.
      localStorage.setItem(GUEST_NAME_LAST_KEY, value);
    }
  } catch {
    // Storage unavailable: the name still reaches this render pass via `emit`.
  }
  emit();
}

/**
 * Write ONLY the cross-event prefill, never a per-event name. The verified door's HELD name is
 * exactly this case: the guest has typed a name but no row exists to carry it yet, and
 * `pr_guest_name_<qr>` means "this device is named AT this event", which would be a claim about a
 * row that is not there. The magic-link round trip that loses the modal's own `typedName` recovers
 * from this key.
 */
export function setLastName(value: string) {
  try {
    if (value.trim()) localStorage.setItem(GUEST_NAME_LAST_KEY, value);
  } catch {
    // Storage unavailable: the name still reaches this render pass via `emit`.
  }
  emit();
}

/** The prefill for a door that has no name of its own yet. Never a fallback identity. */
export function readLastName(): string | null {
  if (typeof window === "undefined") return null;
  return read(GUEST_NAME_LAST_KEY);
}

/**
 * Record (or clear) that this device put an unconfirmed address on this event's
 * row. `false` REMOVES the key rather than writing "0", so the flag reads the
 * same whether a guest declined the field or has simply never met it.
 */
export function setStoredEmailAttached(qrToken: string, value: boolean) {
  try {
    if (value) localStorage.setItem(emailAttachedKey(qrToken), "1");
    else localStorage.removeItem(emailAttachedKey(qrToken));
  } catch {
    // Storage unavailable: the menu falls back to the name-only rows, which is
    // the harmless direction (a guest is offered "Add your email" again rather
    // than being told an address is on a row they cannot see).
  }
  emit();
}

/**
 * FORGET WHO THIS DEVICE WAS AT ONE EVENT: the name and the address flag that belonged to a ticket
 * the device is putting down because it was not the viewer's (`dropGuestTicket` in
 * use-stored-session.ts, which clears the ticket itself beside it).
 *
 * ★ AND THE PREFILL, WHEN IT IS THAT SAME NAME. `pr_guest_name_last` is a kindness for the next
 * party one person scans; here the device has just been shown to be in different hands, so a
 * prefill that is the last owner's name would hand it to the person at the door, one tap from
 * crediting their photographs to it. A different last name (typed at some other event) is left
 * alone: nothing says it is not this person's.
 */
export function forgetStoredGuest(qrToken: string) {
  try {
    const name = localStorage.getItem(nameKey(qrToken));
    localStorage.removeItem(nameKey(qrToken));
    localStorage.removeItem(emailAttachedKey(qrToken));
    if (name && localStorage.getItem(GUEST_NAME_LAST_KEY) === name) {
      localStorage.removeItem(GUEST_NAME_LAST_KEY);
    }
  } catch {
    // Storage unavailable: nothing was stored to forget.
  }
  emit();
}

/**
 * FORGET EVERY NAME AND ADDRESS FLAG ON THE DEVICE, the prefill included (the account sign-out's
 * half of a shared phone starting clean for the next person). The prefill goes too: it is the last
 * name typed on this phone, and after a sign-out the next hand on it is anybody's.
 */
export function forgetAllStoredGuests() {
  try {
    for (const key of storedKeysWithPrefixes([
      GUEST_NAME_PREFIX,
      GUEST_EMAIL_ATTACHED_PREFIX,
    ])) {
      localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable: nothing was stored to forget.
  }
  emit();
}

/** One stable subscribe for both hooks (the same module singleton + the native event). */
function useStoreSubscribe() {
  return useCallback((cb: () => void) => {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  }, []);
}

/**
 * The flag, live, for the header's menu island — which is a SIBLING of the page
 * that writes it, exactly like the name beside it, so it subscribes rather than
 * taking a prop. Server snapshot false: an unflagged menu is the state SSR can
 * honestly render, and the truth swaps in after hydration with no mismatch.
 */
export function useStoredEmailAttached(qrToken: string): boolean {
  const key = emailAttachedKey(qrToken);
  const subscribe = useStoreSubscribe();
  return useSyncExternalStore(
    subscribe,
    () => read(key) === "1",
    () => false,
  );
}

export function useStoredName(
  qrToken: string,
): [string | null, (value: string | null) => void] {
  const key = nameKey(qrToken);

  const subscribe = useStoreSubscribe();

  // Server snapshot is null, so SSR renders the nameless state and the stored
  // name swaps in on the client without a hydration mismatch.
  const name = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );

  const setName = useCallback(
    (value: string | null) => setStoredName(qrToken, value),
    [qrToken],
  );

  return [name, setName];
}

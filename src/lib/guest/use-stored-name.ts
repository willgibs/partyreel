"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * THE NAME THIS BROWSER TYPED, beside the session token it belongs to (the
 * identity reshape, 2026-09-21).
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

function nameKey(qrToken: string) {
  return `${GUEST_NAME_PREFIX}${qrToken}`;
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

/** The prefill for a door that has no name of its own yet. Never a fallback identity. */
export function readLastName(): string | null {
  if (typeof window === "undefined") return null;
  return read(GUEST_NAME_LAST_KEY);
}

export function useStoredName(
  qrToken: string,
): [string | null, (value: string | null) => void] {
  const key = nameKey(qrToken);

  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  }, []);

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

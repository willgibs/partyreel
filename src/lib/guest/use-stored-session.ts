"use client";

import { useCallback, useSyncExternalStore } from "react";

// The session_token is the guest's upload capability (ADR-0004). Persist it per
// event (keyed by qr_token) so a returning guest / refresh skips the join step
// instead of creating a duplicate guest.
function sessionKey(qrToken: string) {
  return `pr_session_${qrToken}`;
}

// Same-tab subscribers — the native `storage` event only fires in OTHER tabs.
const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

// Imperative setter usable OUTSIDE the hook — e.g. the guest header island, which is a
// SIBLING of the EventExperience that owns useStoredSession, so it can't reach the hook's
// setter. Writing here + firing the SAME module `emit()` notifies every useStoredSession
// subscriber (the `listeners` Set is a module singleton shared across the client bundle),
// so the header's sign-out clears the very session the upload panel is reading.
export function setStoredSession(qrToken: string, value: string | null) {
  if (value === null) localStorage.removeItem(sessionKey(qrToken));
  else localStorage.setItem(sessionKey(qrToken), value);
  emit();
}

// localStorage-backed session via useSyncExternalStore: the server snapshot is
// null, so SSR/hydration render the no-session state and then swap in any stored
// session on the client WITHOUT a hydration mismatch (the React-blessed pattern,
// avoiding setState-in-effect).
export function useStoredSession(
  qrToken: string,
): [string | null, (token: string | null) => void] {
  const key = sessionKey(qrToken);

  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  }, []);

  const token = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key),
    () => null,
  );

  const setToken = useCallback(
    (value: string | null) => setStoredSession(qrToken, value),
    [qrToken],
  );

  return [token, setToken];
}

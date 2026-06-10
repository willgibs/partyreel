"use client";

import { useCallback, useSyncExternalStore } from "react";

// First-visit-per-event flag for the entry modal's welcome step. Distinct prefix so
// collectStoredSessionTokens (pr_session_) never picks it up; no collision with pr_save_prompt_ /
// pr_pending_like_ either.
function welcomeKey(qrToken: string) {
  return `pr_welcome_${qrToken}`;
}

// Same-tab subscribers — the native `storage` event only fires in OTHER tabs. Mirrors
// save-account-prompt's useDismissed + use-stored-session: a module listener set + an emit() on write.
const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

/**
 * `[seen, markSeen]` for the welcome step. The server snapshot is `true` (assume seen) so the welcome
 * never flashes before hydration; it resolves to the real localStorage value on the client. `markSeen`
 * persists the flag (once per device per event) and notifies same-tab subscribers.
 */
export function useWelcomeSeen(qrToken: string): [boolean, () => void] {
  const key = welcomeKey(qrToken);

  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  }, []);

  const seen = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) === "1",
    () => true,
  );

  const markSeen = useCallback(() => {
    localStorage.setItem(key, "1");
    emit();
  }, [key]);

  return [seen, markSeen];
}

"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

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
 *
 * ★ THE DEMO NEVER PERSISTS "SEEN" ACROSS VISITS, BUT STILL ADVANCES WITHIN ONE (Will, 2026-09-21,
 * "the door's first look": "it should treat each visit as a fresh visit, even if it's returning.
 * That way every demo is end-to-end."). `isDemo` is a plain boolean, never an `isDemoToken` import
 * here: this module stays a dependency-free localStorage wrapper (unit-testable with no env/
 * `server-only` chain), same reasoning as `entry-steps.ts`'s own note about `entry-modal.tsx`.
 *
 * A first cut of this fix made the demo's `seen` permanently false, which broke the demo ITSELF:
 * `markSeen()` (Continue on the role step) never advanced the itinerary past "welcome" any more,
 * because `computeDoor` re-adds the step every time `!welcomeSeen`. What "fresh every visit" needs
 * is EPHEMERAL, per-mount state for the demo — Continue still moves this visit forward exactly
 * once, nothing is ever written to `localStorage`, and a fresh mount (a reload, a second tab, the
 * next visitor) starts this state at `false` again regardless of any earlier visit's own history.
 */
export function useWelcomeSeen(
  qrToken: string,
  isDemo: boolean,
): [boolean, () => void] {
  const key = welcomeKey(qrToken);

  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  }, []);

  const persistedSeen = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) === "1",
    () => true,
  );
  // Always called (Rules of Hooks) even for a non-demo mount, where it simply goes unread below.
  const [demoSeen, setDemoSeen] = useState(false);
  const seen = isDemo ? demoSeen : persistedSeen;

  const markSeen = useCallback(() => {
    if (isDemo) {
      setDemoSeen(true);
      return;
    }
    localStorage.setItem(key, "1");
    emit();
  }, [key, isDemo]);

  return [seen, markSeen];
}

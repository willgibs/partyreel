"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * THE KEEP ASK, ANSWERED OR NOT, ON THIS DEVICE (`guest-capture` r1: `moment=first`,
 * `shape=sheet-step`).
 *
 * The ask to keep what she added arrives the instant her first file lands, as the door's last
 * screen, once per event per device: "Maybe later" puts it down for this event on this phone for
 * good (her menu's "Keep this event" card keeps the same act one tap away), and a guest
 * who confirms is no longer anybody the ask is for.
 *
 * ★ THE KEY IS THE OFFER CARD'S, `pr_save_prompt_<qr_token>`, kept on purpose: the card this step
 * replaced wrote it on the same "Maybe later", so a guest who put the card down before this shipped
 * is not asked again by the door.
 *
 * Every touch is guarded (blocked site data makes the getter itself throw during render, the
 * `use-stored-session.ts` rule), and the server snapshot is "answered", so nothing asks before
 * hydration.
 */

export function keepAskKey(qrToken: string): string {
  return `pr_save_prompt_${qrToken}`;
}

// Same-tab subscribers: the native `storage` event only fires in OTHER tabs.
const listeners = new Set<() => void>();
// ★ AND THIS PAGE'S OWN MEMORY OF IT, beside the storage: with site data blocked the write throws,
// and a "Maybe later" that did not stick would put the held sheet straight back up. Blocked storage
// asks once per page, never on every upload.
const putDownHere = new Set<string>();

function read(qrToken: string): boolean {
  if (putDownHere.has(qrToken)) return true;
  try {
    return localStorage.getItem(keepAskKey(qrToken)) === "1";
  } catch {
    return false;
  }
}

/** "Maybe later", or a confirmation: the door does not ask again for this event on this device. */
export function putDownKeepAsk(qrToken: string) {
  putDownHere.add(qrToken);
  try {
    localStorage.setItem(keepAskKey(qrToken), "1");
  } catch {
    // Blocked storage: the page's own memory above holds it for this visit.
  }
  for (const listener of listeners) listener();
}

/** Test seam: forget this page's memory (a module outlives one test's render). */
export function resetKeepAskForTests() {
  putDownHere.clear();
}

/** Whether the ask is put down on this device (live, across tabs). */
export function useKeepAskPutDown(qrToken: string): boolean {
  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => read(qrToken),
    () => true,
  );
}

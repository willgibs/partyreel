"use client";

import { useSyncExternalStore } from "react";

/**
 * The lab's COLOR-MODE STORE, shared by ModeShell (the canvas) and LabNav (the
 * chrome) so the whole lab themes together when Will toggles light/dark. Lifted
 * out of mode-shell.tsx in the lab refresh (2026-06-19): the persistent sidebar
 * needs the same `design-mode` pref the content canvas reads, and one source
 * keeps them from drifting.
 *
 * House pattern (see lib/guest/use-stored-session.ts): useSyncExternalStore with
 * a manual same-tab emitter, no setState-in-effect. The SERVER snapshots encode
 * the product's theming contract directly (pref "system" resolving LIGHT when
 * unretrievable) so SSR never flashes a stale mode.
 */

export type ModePref = "system" | "light" | "dark";

const STORAGE_KEY = "design-mode";

const prefListeners = new Set<() => void>();

function subscribePref(cb: () => void) {
  prefListeners.add(cb);
  // storage events only fire cross-tab; same-tab writes notify manually below.
  window.addEventListener("storage", cb);
  return () => {
    prefListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function getPrefSnapshot(): ModePref {
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

export function writeModePref(next: ModePref) {
  window.localStorage.setItem(STORAGE_KEY, next);
  prefListeners.forEach((cb) => cb());
}

function subscribeSystemDark(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getSystemDarkSnapshot(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** The raw user preference (what the toggle highlights). */
export function useModePref(): ModePref {
  return useSyncExternalStore(
    subscribePref,
    getPrefSnapshot,
    () => "system" as const,
  );
}

/** The resolved mode to render (system -> the OS preference, light fallback). */
export function useResolvedMode(): "light" | "dark" {
  const pref = useModePref();
  const systemDark = useSyncExternalStore(
    subscribeSystemDark,
    getSystemDarkSnapshot,
    () => false,
  );
  return pref === "system" ? (systemDark ? "dark" : "light") : pref;
}

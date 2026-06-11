"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type ModePref = "system" | "light" | "dark";

const STORAGE_KEY = "design-mode";

/* Both stores ride useSyncExternalStore (the house pattern, see
   lib/guest/use-stored-session.ts): no setState-in-effect, and the SERVER
   snapshots encode the product's theming contract directly - pref "system",
   system resolves LIGHT when unretrievable. */

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

function writePref(next: ModePref) {
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

/**
 * The light/dark wrapper for the mono system pages. Mirrors the product's
 * intended theming contract: follow the system preference by default, LIGHT
 * when unretrievable (the server snapshots render light by construction). The
 * pref persists per-browser so toggling once carries across the type-option
 * pages while comparing faces.
 *
 * Deliberately NOT next-themes: the playground must not write the app's
 * global theme class while Will is judging mockups.
 */
export function ModeShell({
  fontClass,
  children,
}: {
  fontClass: string;
  children: React.ReactNode;
}) {
  const pref = useSyncExternalStore(
    subscribePref,
    getPrefSnapshot,
    () => "system" as const,
  );
  const systemDark = useSyncExternalStore(
    subscribeSystemDark,
    getSystemDarkSnapshot,
    () => false,
  );

  const resolved: "light" | "dark" =
    pref === "system" ? (systemDark ? "dark" : "light") : pref;

  const options: { value: ModePref; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "system", icon: Monitor, label: "System" },
    { value: "dark", icon: Moon, label: "Dark" },
  ];

  return (
    <div
      data-dir-root
      data-mode={resolved}
      className={`mono ${fontClass} bg-background text-foreground`}
    >
      <div className="mx-auto flex w-full max-w-5xl justify-end px-4 pt-4">
        <div
          role="group"
          aria-label="Color mode"
          className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
        >
          {options.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => writePref(value)}
              aria-label={label}
              aria-pressed={pref === value}
              className={`flex size-7 items-center justify-center rounded-full transition-colors ${
                pref === value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}

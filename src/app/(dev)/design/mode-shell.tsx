"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import {
  type ModePref,
  useModePref,
  useResolvedMode,
  writeModePref,
} from "./use-design-mode";

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
  const pref = useModePref();
  const resolved = useResolvedMode();

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
              onClick={() => writeModePref(value)}
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

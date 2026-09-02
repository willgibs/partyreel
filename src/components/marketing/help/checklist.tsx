"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useMemo,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

// ── The help checklist (the help-catalog round, 2026-09-01) ──────────────────
// A real checklist for the one article a host works through on the morning
// of the event: native checkboxes, ticks persisted per article in
// localStorage (a private per-device convenience: nothing leaves the browser,
// and the list renders unchecked wherever storage is unavailable), and the
// drawn check from the 10-success-check recipe on each tick. This is a RARE,
// first-time moment by the frequency rule, so the draw earns its place; the
// reduced-motion guard in globals.css collapses it to instant.
//
// Rendered from MDX as <Checklist id="..."><Check title="...">body</Check>…
// </Checklist>. Checklist injects each Check's index the way Steps does.

const STORAGE_PREFIX = "pr_help_check_";
const CHANGE_EVENT = "pr-help-checklist";

// ONE store: a module-level cache is the read source React subscribes to
// (through useSyncExternalStore, the palette's useIsMac pattern: the server
// snapshot is "nothing ticked", so the first render never mismatches and no
// effect ever calls setState). localStorage is seeded from once per id and
// written best-effort, so a browser that blocks storage still ticks for the
// visit. Snapshots are STRINGS on purpose: getSnapshot must return a stable
// value between changes, and a fresh array each call would loop.
const cache = new Map<string, string>();

function readRaw(id: string): string {
  const cached = cache.get(id);
  if (cached !== undefined) return cached;
  let raw = "";
  try {
    raw = localStorage.getItem(STORAGE_PREFIX + id) ?? "";
  } catch {
    // Storage blocked: start empty for this visit.
  }
  cache.set(id, raw);
  return raw;
}

function parseTicks(raw: string, size: number): boolean[] {
  if (!raw) return Array(size).fill(false);
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return Array(size).fill(false);
    return Array.from({ length: size }, (_, i) => parsed[i] === true);
  } catch {
    return Array(size).fill(false);
  }
}

function writeTicks(id: string, ticks: boolean[]) {
  const raw = JSON.stringify(ticks);
  cache.set(id, raw);
  try {
    localStorage.setItem(STORAGE_PREFIX + id, raw);
  } catch {
    // Storage blocked or full: the cache still carries the visit.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  // Another tab ticking the same list invalidates the cache so the next
  // snapshot re-reads storage.
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith(STORAGE_PREFIX)) {
      cache.delete(event.key.slice(STORAGE_PREFIX.length));
    }
    callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

type CheckProps = {
  title: string;
  children?: ReactNode;
  /** Injected by Checklist. */
  index?: number;
  listId?: string;
  checked?: boolean;
  onToggle?: (index: number) => void;
};

export function Check({
  title,
  children,
  index = 0,
  listId = "list",
  checked = false,
  onToggle,
}: CheckProps) {
  // Scoped by the list's id: two checklists on one page must not share ids.
  const inputId = `help-check-${listId}-${index}`;
  return (
    <li className="flex gap-3.5 py-3">
      <span className="relative mt-0.5 flex size-5 shrink-0">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={() => onToggle?.(index)}
          className="peer absolute inset-0 size-5 cursor-pointer appearance-none rounded-md border bg-card transition-colors duration-150 checked:border-success focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
        />
        {checked && (
          <span
            className="mkt-check pointer-events-none absolute inset-0 flex items-center justify-center text-success"
            data-state="in"
            aria-hidden
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        )}
      </span>
      <label htmlFor={inputId} className="min-w-0 flex-1 cursor-pointer">
        <span
          className={cn(
            "block text-sm font-medium transition-colors duration-150",
            checked ? "text-muted-foreground line-through" : "text-foreground",
          )}
        >
          {title}
        </span>
        {children && (
          <span
            className={cn(
              // The body sits outside the prose scope (not-prose on the list), so
              // inline links restyle here or they read as plain text.
              "mt-1 block text-sm leading-6 text-muted-foreground transition-opacity duration-150 [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-border [&_a]:underline-offset-4 hover:[&_a]:decoration-foreground [&>:first-child]:mt-0 [&>:last-child]:mb-0",
              checked && "opacity-60",
            )}
          >
            {children}
          </span>
        )}
      </label>
    </li>
  );
}

export function Checklist({
  id,
  children,
}: {
  /** Storage key, unique per article (use the article slug). */
  id: string;
  children: ReactNode;
}) {
  const items = Children.toArray(children).filter(
    (child): child is ReactElement<CheckProps> => isValidElement(child),
  );
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(id),
    () => "",
  );
  const ticks = useMemo(
    () => parseTicks(raw, items.length),
    [raw, items.length],
  );

  const toggle = (index: number) => {
    writeTicks(
      id,
      ticks.map((v, i) => (i === index ? !v : v)),
    );
  };

  const reset = () => {
    writeTicks(id, Array(items.length).fill(false));
  };

  const done = ticks.filter(Boolean).length;

  return (
    <div className="not-prose my-6 rounded-2xl border bg-card px-5 ring-1 ring-foreground/5">
      <ol className="divide-y">
        {items.map((child, i) =>
          cloneElement(child, {
            index: i,
            listId: id,
            checked: ticks[i] ?? false,
            onToggle: toggle,
          }),
        )}
      </ol>
      <div className="flex items-center justify-between border-t py-3 text-xs text-muted-foreground">
        <span className="tabular-nums" aria-live="polite">
          {done} of {items.length} done
        </span>
        {done > 0 && (
          <button
            type="button"
            onClick={reset}
            className="rounded-md px-1.5 py-0.5 transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            Start over
          </button>
        )}
      </div>
    </div>
  );
}

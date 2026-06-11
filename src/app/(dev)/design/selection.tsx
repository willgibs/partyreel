"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { Check, ClipboardCopy, RotateCcw } from "lucide-react";

import { TOUCHPOINTS, type TouchpointId } from "./touchpoints";

/**
 * The lab's SELECTION MECHANISM (Will, 2026-06-10): picks persist per-browser
 * in localStorage so Will can work through the touchpoint pages, then pass
 * the whole set at once - as a screenshot of the hub board AND/OR the
 * copy-summary text (numbered to match his notes). His local picks are the
 * WORKING layer; once passed, the agent ratifies them as `decision` config in
 * touchpoints.ts (the committed record) and the board shows them as locked.
 *
 * Same store pattern as mode-shell.tsx (useSyncExternalStore, manual same-tab
 * emitter, server snapshot = empty so SSR never flashes a stale pick).
 */

const STORAGE_KEY = "design-picks";

type Picks = Partial<Record<TouchpointId, number>>;

const listeners = new Set<() => void>();
// useSyncExternalStore needs referentially stable snapshots; cache by raw string.
let cachedRaw: string | null = null;
let cachedPicks: Picks = {};

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): Picks {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedPicks = raw ? (JSON.parse(raw) as Picks) : {};
    } catch {
      cachedPicks = {};
    }
  }
  return cachedPicks;
}

const EMPTY: Picks = {};

function usePicks(): Picks {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

function writePicks(next: Picks) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((cb) => cb());
}

function setPick(id: TouchpointId, n: number | null) {
  const next = { ...getSnapshot() };
  if (n === null) delete next[id];
  else next[id] = n;
  writePicks(next);
}

/* ── Per-page scope ────────────────────────────────────────────────────── */

const ScopeContext = createContext<TouchpointId | null>(null);

export function SelectionScope({
  id,
  children,
}: {
  id: TouchpointId;
  children: React.ReactNode;
}) {
  return <ScopeContext.Provider value={id}>{children}</ScopeContext.Provider>;
}

/** The per-variant Select control (rendered by the Variant frame). */
export function SelectButton({ n }: { n: number }) {
  const id = useContext(ScopeContext);
  const picks = usePicks();
  if (!id) return null;
  const selected = picks[id] === n;
  return (
    <button
      onClick={() => setPick(id, selected ? null : n)}
      aria-pressed={selected}
      className={`flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium transition-colors ${
        selected
          ? "bg-foreground text-background"
          : "border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
      }`}
    >
      {selected && <Check className="size-3" />}
      {selected ? "Selected" : "Select"}
    </button>
  );
}

/* ── The hub board ─────────────────────────────────────────────────────── */

function summaryText(picks: Picks): string {
  const lines = TOUCHPOINTS.map((t, i) => {
    const local = picks[t.id];
    const pick = local ?? t.decision;
    const name =
      pick !== undefined ? (t.variants[pick - 1] ?? `variant ${pick}`) : null;
    return `${i + 1}. ${t.title}: ${pick !== undefined ? `V${pick} (${name})` : "(no pick)"}`;
  });
  const count = TOUCHPOINTS.filter(
    (t) => (picks[t.id] ?? t.decision) !== undefined,
  ).length;
  return `Partyreel design lab picks - ${count}/${TOUCHPOINTS.length} selected\n${lines.join("\n")}`;
}

/** The all-at-once picks board on the hub: screenshot it or copy the text. */
export function PicksBoard() {
  const picks = usePicks();
  const [copied, setCopied] = useState(false);
  const anyLocal = Object.keys(picks).length > 0;

  async function copy() {
    await navigator.clipboard.writeText(summaryText(picks));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="mt-8 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Your picks</p>
        <div className="flex items-center gap-2">
          {anyLocal && (
            <button
              onClick={() => writePicks({})}
              className="flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted"
            >
              <RotateCcw className="size-3" />
              Clear
            </button>
          )}
          <button
            onClick={copy}
            className="flex h-7 items-center gap-1.5 rounded-full border border-border px-3 text-[11px] font-medium transition-colors hover:border-foreground/40"
          >
            <ClipboardCopy className="size-3" />
            {copied ? "Copied" : "Copy summary"}
          </button>
        </div>
      </div>
      <ol className="mt-3 space-y-1">
        {TOUCHPOINTS.map((t, i) => {
          const local = picks[t.id];
          const ratified = t.decision;
          const shown = local ?? ratified;
          return (
            <li
              key={t.id}
              className="flex items-center gap-3 border-b border-border/60 py-1.5 last:border-0"
            >
              <span className="w-5 shrink-0 font-mono text-[11px] text-muted-foreground">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px]">
                {t.title}
              </span>
              {shown !== undefined ? (
                <span className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      local !== undefined
                        ? "bg-foreground text-background"
                        : "border border-foreground/50 text-foreground"
                    }`}
                  >
                    V{shown} · {t.variants[shown - 1] ?? ""}
                  </span>
                  {ratified !== undefined && local === undefined && (
                    <span className="text-[10px] text-muted-foreground">
                      locked
                    </span>
                  )}
                </span>
              ) : (
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  -
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Picks save in this browser as you go. Pass them as a screenshot of
        this board or with Copy summary; number your notes to match the list.
        Filled = your working pick, outlined = ratified in config.
      </p>
    </div>
  );
}

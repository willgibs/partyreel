"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { cn } from "@/lib/utils";

import type { Verdict } from "./annotations";

/**
 * THE VERDICT ISLAND (Will's ruling, 2026-09-11: verdicts are recorded on
 * the page and exported). The rules page is a gated server component with no
 * backend; this island lets Will set keep / merge / drop and a note per
 * rule, keeps the working set in localStorage as OVERRIDES of the verdicts
 * committed in annotations.ts, and exports only the differences as a block
 * he pastes into chat. Once the Orchestrator writes them into the file and
 * he reloads, "Clear applied" empties the local set.
 *
 * Two client components share one context across the server-rendered rows:
 * the provider (the toolbar) wraps the list, the control sits in each row.
 */

export type VerdictEntry = {
  verdict: Verdict;
  note: string;
  mergeInto: string;
};

type Overrides = Record<string, VerdictEntry>;

const STORAGE_KEY = "partyreel.design.rules.verdicts.v1";
const EMPTY: VerdictEntry = { verdict: "unreviewed", note: "", mergeInto: "" };

type Ctx = {
  committed: Record<string, VerdictEntry>;
  overrides: Overrides;
  set: (id: string, patch: Partial<VerdictEntry>) => void;
};

const VerdictContext = createContext<Ctx | null>(null);

function same(a: VerdictEntry, b: VerdictEntry) {
  return (
    a.verdict === b.verdict && a.note === b.note && a.mergeInto === b.mergeInto
  );
}

/**
 * localStorage as an external store, so the working set hydrates without a
 * setState-in-effect (the server snapshot is the empty set; the client reads
 * the real one on its first render). The snapshot is cached on the raw
 * string so React sees a stable reference until something actually changes.
 */
const NO_OVERRIDES: Overrides = {};
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedValue: Overrides = NO_OVERRIDES;
let memoryFallback: Overrides | null = null;

function getSnapshot(): Overrides {
  if (memoryFallback) return memoryFallback;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedValue = raw ? (JSON.parse(raw) as Overrides) : NO_OVERRIDES;
    } catch {
      cachedValue = NO_OVERRIDES;
    }
  }
  return cachedValue;
}

function getServerSnapshot(): Overrides {
  return NO_OVERRIDES;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writeStorage(value: Overrides) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    memoryFallback = null;
  } catch {
    // A private window or blocked storage: the working set lives in memory.
    memoryFallback = value;
  }
  for (const l of listeners) l();
}

export function VerdictIsland({
  committed,
  children,
}: {
  committed: Record<string, VerdictEntry>;
  children: React.ReactNode;
}) {
  const overrides = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [status, setStatus] = useState<string | null>(null);

  const set = useCallback(
    (id: string, patch: Partial<VerdictEntry>) => {
      const current = getSnapshot();
      const base = current[id] ?? committed[id] ?? EMPTY;
      writeStorage({ ...current, [id]: { ...base, ...patch } });
    },
    [committed],
  );

  const changes = useMemo(
    () =>
      Object.entries(overrides).filter(
        ([id, entry]) => !same(entry, committed[id] ?? EMPTY),
      ),
    [overrides, committed],
  );

  const exportChanges = async () => {
    const lines = changes.map(
      ([id, e]) =>
        `${id} | ${e.verdict} | ${e.mergeInto || "-"} | ${e.note.replace(/\|/g, "/") || "-"}`,
    );
    const block = [
      `# rules verdicts v1, ${changes.length} change${changes.length === 1 ? "" : "s"}`,
      "# id | verdict | mergeInto | note",
      ...lines,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(block);
      setStatus(
        `Copied ${changes.length} change${changes.length === 1 ? "" : "s"}.`,
      );
    } catch {
      setStatus("The clipboard refused; select the block below and copy it.");
    }
  };

  const clearApplied = () => {
    const next: Overrides = {};
    for (const [id, entry] of Object.entries(overrides)) {
      if (!same(entry, committed[id] ?? EMPTY)) next[id] = entry;
    }
    writeStorage(next);
    setStatus("Kept only the verdicts the file does not have yet.");
  };

  return (
    <VerdictContext.Provider value={{ committed, overrides, set }}>
      <div className="sticky top-2 z-10 mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/95 px-4 py-2.5 backdrop-blur">
        <p className="text-sm">
          <span className="font-medium">Verdicts</span>{" "}
          <span className="font-mono text-[11px] text-muted-foreground">
            {changes.length} unsaved
          </span>
        </p>
        <button
          type="button"
          onClick={exportChanges}
          disabled={changes.length === 0}
          className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background disabled:opacity-40"
        >
          Export verdicts
        </button>
        <button
          type="button"
          onClick={clearApplied}
          className="rounded-full border border-border px-3 py-1 text-xs font-medium"
        >
          Clear applied
        </button>
        {status && (
          <p role="status" className="text-xs text-muted-foreground">
            {status}
          </p>
        )}
      </div>
      {children}
      {changes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold">
            The export, as it will be copied
          </h2>
          <pre className="mt-2 overflow-x-auto rounded-xl border border-border bg-card p-4 font-mono text-[11px] leading-relaxed">
            {changes
              .map(
                ([id, e]) =>
                  `${id} | ${e.verdict} | ${e.mergeInto || "-"} | ${e.note || "-"}`,
              )
              .join("\n")}
          </pre>
        </section>
      )}
    </VerdictContext.Provider>
  );
}

const CHOICES: { value: Verdict; label: string }[] = [
  { value: "keep", label: "Keep" },
  { value: "merge", label: "Merge" },
  { value: "drop", label: "Drop" },
];

export function VerdictControl({ id }: { id: string }) {
  const ctx = useContext(VerdictContext);
  const [copied, setCopied] = useState(false);
  if (!ctx) return null;
  const entry = ctx.overrides[id] ?? ctx.committed[id] ?? EMPTY;
  const changed = !same(entry, ctx.committed[id] ?? EMPTY);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Nothing to do; the id is visible in the row.
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div
        className="flex overflow-hidden rounded-full border border-border"
        role="group"
        aria-label="Verdict"
      >
        {CHOICES.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-pressed={entry.verdict === c.value}
            onClick={() =>
              ctx.set(id, {
                verdict: entry.verdict === c.value ? "unreviewed" : c.value,
              })
            }
            className={cn(
              "px-2.5 py-1 text-[11px] font-medium transition-colors",
              entry.verdict === c.value
                ? c.value === "drop"
                  ? "text-destructive-foreground bg-destructive"
                  : "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      {entry.verdict === "merge" && (
        <input
          type="text"
          value={entry.mergeInto}
          onChange={(e) => ctx.set(id, { mergeInto: e.target.value })}
          placeholder="merge into (rule id)"
          className="h-7 w-56 rounded-md border border-border bg-background px-2 font-mono text-[11px]"
        />
      )}
      {entry.verdict !== "unreviewed" && (
        <input
          type="text"
          value={entry.note}
          onChange={(e) => ctx.set(id, { note: e.target.value })}
          placeholder="note"
          className="h-7 w-56 rounded-md border border-border bg-background px-2 text-[11px]"
        />
      )}
      <button
        type="button"
        onClick={copyId}
        title={id}
        className="rounded-md px-1.5 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground"
      >
        {copied ? "copied" : "id"}
      </button>
      {changed && (
        <span
          className="size-1.5 rounded-full bg-foreground"
          aria-label="unsaved"
        />
      )}
    </div>
  );
}

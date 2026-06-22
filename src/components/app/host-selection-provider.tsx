"use client";

import { createContext, useCallback, useContext, useState } from "react";

import { useSelection } from "@/components/app/event-feed/use-selection";

// Shares the GALLERY album bulk-select state across the two surfaces that drive it: the gallery grid
// (the tiles + their checkmarks + long-press, owned by HostMediaGrid down in the feed's Gallery slot)
// and the contextual floating action bar (the bulk cluster, up in EventFeed). It mirrors HostAddProvider:
// a thin context that lifts ONLY the selection STATE — never the items, never the optimistic list. The
// bulk HANDLERS (which need the gallery's useOptimistic + the reel/likes Sets) are owned by the grid and
// REGISTERED here, so the bar can call selection.run(kind) and it delegates to the grid's handler —
// exactly how the review bar calls triage.run without owning review's optimistic state.

export type BulkKind = "reel" | "like" | "hide" | "show" | "delete" | "download";

type MediaStatus = "pending" | "approved" | "hidden" | "removed" | undefined;

// What the grid registers: a fingerprint of the album (so the provider only re-renders on a REAL change),
// the selectable universe, a status map (drives the smart Hide/Show label), and the five bulk handlers.
type Registration = {
  /** `id:status` per item — guards the provider against churn when the grid re-registers unchanged. */
  key: string;
  ids: string[];
  statusMap: Record<string, MediaStatus>;
  handlers: Record<BulkKind, (ids: string[]) => Promise<void>>;
};

type HostSelectionValue = {
  selectMode: boolean;
  selected: Set<string>;
  allSelected: boolean;
  busy: boolean;
  /** The size of the selectable universe (the visible album), for Select-all / the empty guard. */
  count: number;
  /** Smart label: "Show" iff every selected item is hidden, else "Hide". */
  hideLabel: "Hide" | "Show";
  toggle: (id: string) => void;
  selectAll: () => void;
  enterSelect: (seedId?: string) => void;
  exitSelect: () => void;
  run: (kind: BulkKind) => void;
  register: (reg: Registration) => void;
};

const HostSelectionContext = createContext<HostSelectionValue | null>(null);

// Null when no provider wraps the surface (the reel grid, guest galleries), so a consumer outside the
// provider is a safe no-op — same opt-in contract as useHostAdd / useReel / useLikes.
export function useHostSelection(): HostSelectionValue | null {
  return useContext(HostSelectionContext);
}

export function HostSelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [reg, setReg] = useState<Registration | null>(null);
  const [busy, setBusy] = useState(false);

  const sel = useSelection(reg?.ids ?? []);

  // Replace the registration only on a real change (the grid fingerprints the album), so an unchanged
  // re-register is a no-op and never churns the selection / bar.
  const register = useCallback((next: Registration) => {
    setReg((prev) => (prev && prev.key === next.key ? prev : next));
  }, []);

  const statusMap = reg?.statusMap;
  const hideLabel: "Hide" | "Show" =
    statusMap &&
    sel.selected.size > 0 &&
    [...sel.selected].every((id) => statusMap[id] === "hidden")
      ? "Show"
      : "Hide";

  function run(kind: BulkKind) {
    if (busy || !reg) return;
    const targetIds = [...sel.selected];
    if (targetIds.length === 0) return;
    setBusy(true);
    void (async () => {
      try {
        await reg.handlers[kind](targetIds);
      } finally {
        setBusy(false);
        sel.exitSelect();
      }
    })();
  }

  const value: HostSelectionValue = {
    selectMode: sel.selectMode,
    selected: sel.selected,
    allSelected: sel.allSelected,
    busy,
    count: reg?.ids.length ?? 0,
    hideLabel,
    toggle: sel.toggle,
    selectAll: sel.selectAll,
    enterSelect: sel.enterSelect,
    exitSelect: sel.exitSelect,
    run,
    register,
  };

  return (
    <HostSelectionContext.Provider value={value}>
      {children}
    </HostSelectionContext.Provider>
  );
}

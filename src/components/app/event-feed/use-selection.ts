"use client";

import { useCallback, useState } from "react";

// The pure multi-select state machine, lifted out of useReviewTriage so BOTH the Review triage AND the
// Gallery album bulk-select share one tested primitive. It knows nothing about approve/hide/reel/like —
// just "which ids are selected, and are we in select mode". The owning surface layers the bulk ACTIONS
// on top (Review = run(approve|hide); Gallery = the HostSelectionProvider's run(reel|like|hide|delete)).
//
// ★ The one behavioral subtlety vs. a naive version: when the `ids` universe changes (a background poll
// or a revalidate drops/adds items), it PRUNES `selected` to the surviving ids — it does NOT reset to
// empty. Resetting would wipe a host's in-progress multi-select on the gallery the instant any unrelated
// refresh lands. (Review happens to churn its whole pending list on every approve, so a prune there
// collapses to empty anyway — same visible result, one shared rule.)
export function useSelection(ids: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  // "Adjust state on a prop change DURING render" (guarded so it runs only on a REAL change), so the
  // prune never clobbers an in-flight optimistic toggle between renders. idsKey is a stable signal for
  // "the universe changed" (not a fresh array identity each render).
  const idsKey = ids.join(",");
  const [syncedKey, setSyncedKey] = useState(idsKey);
  if (idsKey !== syncedKey) {
    setSyncedKey(idsKey);
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const live = new Set(ids);
      const next = new Set<string>();
      for (const id of prev) if (live.has(id)) next.add(id);
      return next.size === prev.size ? prev : next;
    });
  }

  const allSelected = ids.length > 0 && selected.size === ids.length;

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Stable identity via idsKey (not the `ids` array) so consumers don't re-bind every render.
  const selectAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const enterSelect = useCallback((seedId?: string) => {
    setSelectMode(true);
    if (seedId) setSelected(new Set([seedId]));
  }, []);

  const exitSelect = useCallback(() => {
    setSelectMode(false);
    setSelected(new Set());
  }, []);

  return {
    selected,
    selectMode,
    allSelected,
    toggle,
    selectAll,
    clear,
    enterSelect,
    exitSelect,
  };
}

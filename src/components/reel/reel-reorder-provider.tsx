"use client";

import { createContext, useCallback, useContext, useState } from "react";

// Shares the Reel section's drag-reorder MODE across the two surfaces that drive it: the Reorder/Done
// button in the Reel section header (up in EventFeed) and the Reel section body (the slot, which swaps
// to the sortable grid). A thin state-only context, mirroring HostAddProvider / ReelReorder is a sibling
// of ReelProvider in the tree. Null outside the provider = a safe no-op (the reel browse render).

type ReelReorderValue = {
  reorderMode: boolean;
  enter: () => void;
  exit: () => void;
};

const ReelReorderContext = createContext<ReelReorderValue | null>(null);

export function useReelReorder(): ReelReorderValue | null {
  return useContext(ReelReorderContext);
}

export function ReelReorderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [reorderMode, setReorderMode] = useState(false);
  const enter = useCallback(() => setReorderMode(true), []);
  const exit = useCallback(() => setReorderMode(false), []);

  return (
    <ReelReorderContext.Provider value={{ reorderMode, enter, exit }}>
      {children}
    </ReelReorderContext.Provider>
  );
}

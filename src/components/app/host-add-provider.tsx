"use client";

import { createContext, useCallback, useContext, useState } from "react";

// Shares the "add photos" state across the two surfaces that drive it: the top HostCommandStrip
// (its inline Add button + the upload panel it hosts) and the event feed's contextual floating
// action bar (the Gallery action). Lifting `adding` + `uploadingCount` here lets the floating bar
// open the SAME panel the command strip hosts — the floating Add scrolls to the top + opens it,
// exactly like the old self-contained HostCommandStrip floating Add, now reachable from the feed.
// The command strip remains the panel HOST (HostUpload lives there); this only shares the toggles.

type HostAddValue = {
  /** Whether the upload panel (hosted in HostCommandStrip) is open. */
  adding: boolean;
  /** The command strip's inline Add button toggles the panel. */
  toggleAdd: () => void;
  /** The floating bar's Gallery action: open the panel + scroll it back into view at the top. */
  openAdd: () => void;
  /** Live in-flight upload count (HostUpload reports it) → the floating "N uploading" chip. */
  uploadingCount: number;
  setUploadingCount: (n: number) => void;
};

const HostAddContext = createContext<HostAddValue | null>(null);

// Null when no provider wraps the surface, so a consumer outside the provider is a safe no-op.
export function useHostAdd(): HostAddValue | null {
  return useContext(HostAddContext);
}

export function HostAddProvider({ children }: { children: React.ReactNode }) {
  const [adding, setAdding] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  const toggleAdd = useCallback(() => setAdding((v) => !v), []);
  const openAdd = useCallback(() => {
    setAdding(true);
    // The panel lives at the top, below the command strip; bring it back into view.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <HostAddContext.Provider
      value={{ adding, toggleAdd, openAdd, uploadingCount, setUploadingCount }}
    >
      {children}
    </HostAddContext.Provider>
  );
}

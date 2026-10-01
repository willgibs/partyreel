"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Shares the host's "add photos" state between the two surfaces that drive it and the panel they open. The album's
// own header (`event-feed/event-gallery.tsx`) has an Add photos button that toggles the panel it draws under
// itself; the reel card in the cards row (`event-feed/reel-card.tsx`, in its guidance popover) has one that opens
// the same panel and brings it into view. The panel's content is `HostUpload`, which hands its own box back here
// (`registerPanel`) so `openAdd` has something to scroll to. This only shares the toggles and the panel's place;
// it draws nothing.

type HostAddValue = {
  /** Whether the upload panel (under the album's header) is open. */
  adding: boolean;
  /** The album header's Add photos button toggles the panel where it already is: the page does not move. */
  toggleAdd: () => void;
  /** The reel card's Add photos: open the panel if it is shut, and bring it into view either way. */
  openAdd: () => void;
  /** Live in-flight upload count (HostUpload reports it). No surface reads it since the floating Add pill retired. */
  uploadingCount: number;
  setUploadingCount: (n: number) => void;
  /** `HostUpload` hands its own box here (a ref callback): the panel `openAdd` brings into view. */
  registerPanel: (el: HTMLElement | null) => void;
};

const HostAddContext = createContext<HostAddValue | null>(null);

// Null when no provider wraps the surface, so a consumer outside the provider is a safe no-op.
export function useHostAdd(): HostAddValue | null {
  return useContext(HostAddContext);
}

/**
 * The panel on screen with the least movement: none when it is already in view, else just enough, smoothly
 * unless the reader asked for less motion. ★ NEVER THE TOP OF THE PAGE: the panel opens under the album's own
 * header, wherever that stands, so a host deep in a long album was thrown to the top, and on a phone the panel
 * can sit below the fold even there. The panel's own `scroll-margin-top` (`host-upload.tsx`) keeps it clear of
 * the app bar and the cards band stuck under it.
 */
function bringIntoView(panel: HTMLElement) {
  const reduce =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  panel.scrollIntoView?.({
    block: "nearest",
    behavior: reduce ? "auto" : "smooth",
  });
}

export function HostAddProvider({ children }: { children: React.ReactNode }) {
  const [adding, setAdding] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  // The panel's box while it is mounted (HostUpload's ref callback fills it in the commit that mounts it).
  const panel = useRef<HTMLElement | null>(null);
  // One count per openAdd, so the scroll is an effect of THAT press: it runs after the commit that mounted the
  // panel (the first open) and also when nothing mounts (an open panel the host scrolled away from), and a
  // toggle never is one.
  const [revealRequest, setRevealRequest] = useState(0);

  const toggleAdd = useCallback(() => setAdding((v) => !v), []);
  const openAdd = useCallback(() => {
    setAdding(true);
    setRevealRequest((n) => n + 1);
  }, []);
  const registerPanel = useCallback((el: HTMLElement | null) => {
    panel.current = el;
  }, []);

  useEffect(() => {
    if (revealRequest > 0 && panel.current) bringIntoView(panel.current);
  }, [revealRequest]);

  return (
    <HostAddContext.Provider
      value={{
        adding,
        toggleAdd,
        openAdd,
        uploadingCount,
        setUploadingCount,
        registerPanel,
      }}
    >
      {children}
    </HostAddContext.Provider>
  );
}

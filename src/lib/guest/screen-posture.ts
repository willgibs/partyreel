/**
 * THE REEL ON A SCREEN: FULLSCREEN AND A SCREEN THAT STAYS AWAKE.
 *
 * There is no separate wall view: "Play on a screen" opens the same view with the event's code
 * shown and a one-tap Start that takes fullscreen and keeps the screen awake. Both need a user
 * gesture in the tab that asks (the Fullscreen API and the Screen Wake Lock API alike), which is the
 * whole reason a Start exists; these helpers are what that one tap calls.
 *
 * ★ FULLSCREEN IS THE DOCUMENT'S, NOT THE VIEW'S. A tooltip, a menu and the media viewer all portal to
 * `document.body`, and a fullscreen ELEMENT shows only its own subtree: taking the view fullscreen
 * would hide every control that opens a layer. The view already covers the viewport, so fullscreen
 * on the document root changes nothing but the browser's own chrome.
 *
 * ★ EVERY PLATFORM GAP IS A QUIET NO. iPhone Safari has no document fullscreen, older browsers no wake
 * lock, and a denied request (battery saver, a policy) rejects: each answers false and the reel
 * simply plays, never an error on a wall in front of a room.
 *
 * ★ A WAKE LOCK DIES WITH THE TAB'S VISIBILITY, BY SPEC, and must be taken again on return: the
 * controller re-requests on every `visibilitychange` to visible while it is held, and lets go on
 * release (the view's unmount).
 */

type FullscreenDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FullscreenEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

/** Whether this browser can take the document fullscreen at all. */
export function canFullscreen(doc: Document = document): boolean {
  const root = doc.documentElement as FullscreenEl;
  return (
    typeof root.requestFullscreen === "function" ||
    typeof root.webkitRequestFullscreen === "function"
  );
}

export function isFullscreen(doc: Document = document): boolean {
  const d = doc as FullscreenDoc;
  return Boolean(d.fullscreenElement ?? d.webkitFullscreenElement);
}

/** Take the document fullscreen. True when it happened (or already was). */
export async function enterFullscreen(doc: Document = document): Promise<boolean> {
  if (isFullscreen(doc)) return true;
  const root = doc.documentElement as FullscreenEl;
  try {
    if (typeof root.requestFullscreen === "function") {
      await root.requestFullscreen({ navigationUI: "hide" });
    } else if (typeof root.webkitRequestFullscreen === "function") {
      await root.webkitRequestFullscreen();
    } else {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function exitFullscreen(doc: Document = document): Promise<void> {
  if (!isFullscreen(doc)) return;
  const d = doc as FullscreenDoc;
  try {
    if (typeof d.exitFullscreen === "function") await d.exitFullscreen();
    else await d.webkitExitFullscreen?.();
  } catch {
    // Already out (the viewer pressed Escape first): nothing to undo.
  }
}

/** Subscribe to entering and leaving fullscreen (either prefix). */
export function onFullscreenChange(
  cb: () => void,
  doc: Document = document,
): () => void {
  doc.addEventListener("fullscreenchange", cb);
  doc.addEventListener("webkitfullscreenchange", cb);
  return () => {
    doc.removeEventListener("fullscreenchange", cb);
    doc.removeEventListener("webkitfullscreenchange", cb);
  };
}

type Sentinel = { release: () => Promise<void>; released?: boolean };
type WakeLockNav = {
  wakeLock?: { request: (type: "screen") => Promise<Sentinel> };
};

export type WakeLockController = {
  /** Take the lock (and keep re-taking it on every return to visible). True when it held. */
  acquire: () => Promise<boolean>;
  /** Let go, for good: no re-take after this. */
  release: () => void;
  /** Whether the lock is wanted right now (acquired and not released). */
  wanted: () => boolean;
};

/** A screen wake lock that survives the tab going away and coming back. */
export function createWakeLock(
  nav: WakeLockNav = typeof navigator === "undefined"
    ? {}
    : (navigator as unknown as WakeLockNav),
  doc: Document | null = typeof document === "undefined" ? null : document,
): WakeLockController {
  let sentinel: Sentinel | null = null;
  let want = false;

  const request = async (): Promise<boolean> => {
    if (!nav.wakeLock) return false;
    try {
      sentinel = await nav.wakeLock.request("screen");
      // Released while the request was in flight: give it straight back.
      if (!want) {
        void sentinel.release().catch(() => {});
        sentinel = null;
        return false;
      }
      return true;
    } catch {
      sentinel = null;
      return false;
    }
  };

  const onVisible = () => {
    if (!want || !doc || doc.visibilityState !== "visible") return;
    if (sentinel && !sentinel.released) return;
    void request();
  };

  return {
    async acquire() {
      if (want) return Boolean(sentinel);
      want = true;
      doc?.addEventListener("visibilitychange", onVisible);
      return request();
    },
    release() {
      want = false;
      doc?.removeEventListener("visibilitychange", onVisible);
      const held = sentinel;
      sentinel = null;
      if (held) void held.release().catch(() => {});
    },
    wanted: () => want,
  };
}

"use client";

import { useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { flushSync } from "react-dom";

import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import {
  EVENT_SHEET_PARAM,
  resolveEventSheet,
  type EventSheet,
} from "@/lib/event/sections";

/**
 * THE HUB'S ONE CLIENT ISLAND — the sheets, the mini-modal, and which element
 * owns the code's morph. Everything on the event page that opens something
 * reads this: the header's code door, the sticky row's QR pill, the cards row's
 * Settings card, the album's empty state, and the event menu.
 *
 * ★ THE SHEETS RIDE THE URL, THE MINI-MODAL DOES NOT. Share and Settings are
 * places (`?room=share`, `?room=settings`): a host sends the settings link to
 * themselves, reloads onto it, and the browser's Back closes the panel the way
 * Back always closes a panel. The mini-modal is a LOOK at the code — a beat,
 * not a destination — so it stays out of the history entirely; nobody wants
 * Back to walk four peeks at a QR code.
 *
 * ★ WHY `history.pushState` AND NOT `router.push`. A route change re-renders
 * the album and loses its scroll; the album has to stay behind
 * the sheet ("the album stays behind it"). The native history API is the
 * App Router's sanctioned shallow mechanism (Next 16 docs, "single-page
 * applications") and `useSearchParams` follows it without a server round-trip.
 *
 * ★ THE MARKER RIDES INSIDE THE STATE NEXT MERGES, AND THAT DETAIL IS LOAD-
 * BEARING. Next patches `history.pushState` to copy `__NA` and its internals
 * tree onto whatever object you pass (`copyNextJsInternalHistoryState`), and
 * its `popstate` handler does `if (!state.__NA) window.location.reload()`. So
 * the marker must be a FIELD on the object we hand over — replacing the state
 * wholesale would turn the sheet's Back into a full page reload.
 *
 * ★ AND THE MARKER IS WHY CLOSING CAN USE `history.back()`. Going back is the
 * right close (it leaves no dead entry behind), but only when WE pushed the
 * entry. A host who landed directly on `?room=settings` from a bookmark has no
 * entry of ours behind them, and `back()` would throw them out of the app; that
 * case replaces the URL in place instead.
 */

const HISTORY_MARKER = "prEventSheet";

/** Which element currently carries the code's `view-transition-name`. Exactly
 *  one at a time — a duplicate name is an error the browser resolves by
 *  skipping the transition altogether. */
export type CodeMorphOwner = "header" | "pill" | "modal";

export const CODE_MORPH_NAME = "pr-event-code";

type ShareValue = {
  sheet: EventSheet | null;
  openSheet: (sheet: EventSheet) => void;
  closeSheet: () => void;
  codeOpen: boolean;
  openCode: () => void;
  closeCode: () => void;
  /** True once the header's code has scrolled out of view — the sticky QR pill's gate. */
  headerCodeHidden: boolean;
  setHeaderCodeHidden: (hidden: boolean) => void;
  morphOwner: CodeMorphOwner;
  /** The name for an element that owns the morph right now, else undefined. */
  morphNameFor: (owner: CodeMorphOwner) => string | undefined;
};

const ShareContext = createContext<ShareValue | null>(null);

export function useEventShare(): ShareValue {
  const ctx = useContext(ShareContext);
  if (!ctx) {
    throw new Error("useEventShare must be used inside <EventShareProvider>");
  }
  return ctx;
}

export function EventShareProvider({
  initialSheet,
  children,
}: {
  /** Resolved server-side from `?room=`, so a deep link opens with the page. */
  initialSheet: EventSheet | null;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const reduced = usePrefersReducedMotion();

  const [codeOpen, setCodeOpen] = useState(false);
  const [headerCodeHidden, setHeaderCodeHidden] = useState(false);

  /**
   * ★ `?room=` IS THE STATE. There is no local copy of it and there must not
   * be one: the parameter changes for three different reasons — our own
   * pushState, the browser's Back, and a `router.refresh()` after a settings
   * action — and a mirrored `useState` would owe an effect per reason to stay
   * in step. Next's patched pushState calls the router's own url-applier, so
   * `useSearchParams` re-renders on all three for free, and the sheet surviving
   * a refresh costs nothing rather than costing a synchronisation effect.
   *
   * `initialSheet` is the server's reading of the same parameter, kept as the
   * value for the first paint so a deep link opens WITH the page.
   */
  const sheet =
    resolveEventSheet(searchParams.get(EVENT_SHEET_PARAM) ?? undefined) ??
    (searchParams.has(EVENT_SHEET_PARAM) ? null : initialSheet);

  const openSheet = useCallback((next: EventSheet) => {
    const url = new URL(window.location.href);
    url.searchParams.set(EVENT_SHEET_PARAM, next);
    // The marker is a FIELD, never the whole state: see the header comment.
    window.history.pushState(
      { [HISTORY_MARKER]: true },
      "",
      `${url.pathname}${url.search}`,
    );
  }, []);

  const closeSheet = useCallback(() => {
    // Ours to pop, or not: the marker rides on the entry we pushed, so reading
    // it back is the whole test. A host who landed here from a bookmark has
    // nothing of ours behind them.
    const ours = Boolean(
      (window.history.state as Record<string, unknown> | null)?.[
        HISTORY_MARKER
      ],
    );
    if (ours) {
      // Back, so the entry we added leaves with the panel rather than piling
      // up behind it. The popstate that follows restores the previous URL, and
      // `sheet` is read straight off that URL, so the panel closes by itself.
      window.history.back();
      return;
    }
    // Landed here directly (a bookmark, a shared link): there is nothing of
    // ours behind, so drop the parameter in place rather than leaving the app.
    const url = new URL(window.location.href);
    url.searchParams.delete(EVENT_SHEET_PARAM);
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, []);

  /**
   * The code's morph. `startViewTransition` snapshots the page, runs the
   * callback, snapshots again and tweens between the two — so the state change
   * has to COMMIT inside the callback, which is the one honest use of
   * `flushSync`: React would otherwise batch it to after the snapshot and the
   * browser would tween a page against itself.
   *
   * Every guard degrades to an ordinary open, never to a broken one: no API
   * support, and reduced motion (which never starts a transition at all).
   */
  const withMorph = useCallback(
    (change: () => void) => {
      const start = (
        document as Document & {
          startViewTransition?: (cb: () => void) => { finished: Promise<void> };
        }
      ).startViewTransition;
      if (!start || reduced) {
        change();
        return;
      }
      start.call(document, () => flushSync(change));
    },
    [reduced],
  );

  const openCode = useCallback(() => {
    withMorph(() => setCodeOpen(true));
  }, [withMorph]);

  const closeCode = useCallback(() => {
    withMorph(() => setCodeOpen(false));
  }, [withMorph]);

  /**
   * Exactly one owner, and it is decided by what is ON SCREEN rather than by
   * what was tapped: open → the modal; closed → the header's code, or the
   * sticky pill once the header's has scrolled away. That also gives the
   * CLOSING tween the right destination for free — a host who opened the modal
   * from the header and scrolled while it was up gets the code returned to the
   * pill, which is where a code actually is by then.
   */
  const morphOwner: CodeMorphOwner = codeOpen
    ? "modal"
    : headerCodeHidden
      ? "pill"
      : "header";

  const morphNameFor = useCallback(
    (owner: CodeMorphOwner) =>
      owner === morphOwner ? CODE_MORPH_NAME : undefined,
    [morphOwner],
  );

  const value = useMemo<ShareValue>(
    () => ({
      sheet,
      openSheet,
      closeSheet,
      codeOpen,
      openCode,
      closeCode,
      headerCodeHidden,
      setHeaderCodeHidden,
      morphOwner,
      morphNameFor,
    }),
    [
      sheet,
      openSheet,
      closeSheet,
      codeOpen,
      openCode,
      closeCode,
      headerCodeHidden,
      morphOwner,
      morphNameFor,
    ],
  );

  return (
    <ShareContext.Provider value={value}>{children}</ShareContext.Provider>
  );
}

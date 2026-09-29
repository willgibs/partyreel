"use client";

import { useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";

import {
  resolveSettingsPage,
  SETTINGS_PAGE_PARAM,
  type SettingsPage,
} from "@/components/app/event-settings/settings-pages";
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
 * ★ HAND NEXT A FRESH STATE HOLDING ONLY WHAT IS OURS, NEVER
 * `window.history.state`. Next patches both calls (its `app-router.js`): given
 * an object without `__NA`, it copies its own `__NA` and internals tree onto it
 * and tells the router the new URL, so `useSearchParams` follows; given one
 * that carries `__NA` (every entry Next has touched does) it takes the call for
 * its own bookkeeping and applies nothing. The settings
 * page's replace used to hand `replaceState` the whole current state, "so the
 * marker rides along untouched": the bar gained `&setting=<page>` and the
 * router never heard of it, so a Settings row never opened its page and a
 * page's back arrow never returned (build 23's red-team, HIGH), and the next
 * router commit (`router.refresh()` after a settings action) wrote the old
 * address back over the bar. `history-state-policy.test.ts` refuses the shape
 * everywhere.
 *
 * ★ THE MARKER IS A FIELD ON THAT FRESH OBJECT. Next's `popstate` handler does
 * `if (!state.__NA) window.location.reload()`, so every entry has to end up
 * carrying `__NA`; Next's copy guarantees it, so the marker never has to.
 *
 * ★ AND THE MARKER IS WHY CLOSING CAN USE `history.back()`. Going back is the
 * right close (it leaves no dead entry behind), but only when WE pushed the
 * entry. A host who landed directly on `?room=settings` from a bookmark has no
 * entry of ours behind them, and `back()` would throw them out of the app; that
 * case replaces the URL in place instead.
 *
 * ★ A ROUTER REFRESH TAKES THE MARKER OFF THE ENTRY (measured under `next
 * dev`): `router.refresh()` is a soft navigation whose commit rewrites the entry
 * with `__NA` and its tree alone, and Settings refreshes (the reel switch does),
 * so the entry cannot be the only witness that the sheet is ours: closing then
 * took the bookmark path and left a dead entry behind. The provider remembers
 * what it pushed (`pushedRef`) and forgets it when the sheet closes, however it
 * closed. A RELOAD takes the marker too (measured: Next's first commit rewrites
 * the entry without it) and a new page remembers nothing, so a panel reloaded
 * onto closes like a bookmark's, in place; the same shape, not yet answered.
 *
 * ★ ONE EDGE THIS DOES NOT CLOSE (measured under `next dev`, on an entry this
 * provider pushed): a `router.refresh()` followed by a write that applies a URL
 * (a page's replace, and `openSheet`'s push always did the same) in the same
 * tick, or 20ms later, makes Next reload the page onto the same URL; 60ms later
 * it does not (nor the other order, nor a deep-linked entry). The window is the
 * refresh's first commit, not its round trip (a server render slowed to 1.2s
 * changed nothing), and no product code refreshes and moves the panel in one
 * handler (the hub no longer refreshes on a timer either): one that ever does
 * should put a beat between them, refresh first, or do neither.
 */

const HISTORY_MARKER = "prEventSheet";

/** Whether the entry the window is on carries the sheet's marker. */
function entryCarriesMarker(): boolean {
  return Boolean(
    (window.history.state as Record<string, unknown> | null)?.[HISTORY_MARKER],
  );
}

/** Which element currently carries the code's `view-transition-name`. Exactly
 *  one at a time — a duplicate name is an error the browser resolves by
 *  skipping the transition altogether. */
export type CodeMorphOwner = "header" | "pill" | "modal";

export const CODE_MORPH_NAME = "pr-event-code";

type ShareValue = {
  sheet: EventSheet | null;
  openSheet: (sheet: EventSheet) => void;
  closeSheet: () => void;
  /** The settings page open inside the Settings sheet, or null for its four rows. */
  settingsPage: SettingsPage | null;
  openSettingsPage: (page: SettingsPage) => void;
  closeSettingsPage: () => void;
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

/** Nothing to subscribe to: the snapshot only ever moves from the server's answer to the client's. */
const noSubscription = () => () => {};

/**
 * Whether this render is past hydration. The server and the hydrating client both answer false, so the
 * first paint matches; every render after it answers true.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
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
  const hydrated = useHydrated();

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
   *
   * ★ AND FOR THE FIRST PAINT ALONE (milestone 30's production pass: a sheet
   * opened from a link could not be closed). Once the page is live the URL is
   * the whole answer: closing a deep-linked sheet drops the parameter in place,
   * and a fallback that outlived hydration read the missing parameter as "the
   * sheet this page was first loaded with" and opened it again, so Escape and
   * the X did nothing until Back or a reload. The ways in were the `/settings`
   * route, a sign-in returning to it, Checkout's return and every bookmark.
   */
  const fromUrl = resolveEventSheet(
    searchParams.get(EVENT_SHEET_PARAM) ?? undefined,
  );
  const sheet = hydrated ? fromUrl : (fromUrl ?? initialSheet);

  /**
   * THE SETTINGS PAGE, read off the URL beside the sheet (`settings-pages.ts`): only while Settings is
   * the sheet, so a stray parameter never opens a page of a closed sheet.
   */
  const settingsPage =
    sheet === "settings"
      ? resolveSettingsPage(searchParams.get(SETTINGS_PAGE_PARAM))
      : null;

  /**
   * Whether the sheet on screen stands on an entry THIS page pushed. The entry's own marker says so
   * until a router refresh rewrites the entry without it (see the header), so the page keeps its own
   * word too, and lets it go the moment no sheet is open, whatever closed it (the X, Escape, Back).
   */
  const pushedRef = useRef(false);
  useEffect(() => {
    if (sheet === null) pushedRef.current = false;
  }, [sheet]);

  const openSheet = useCallback((next: EventSheet) => {
    const url = new URL(window.location.href);
    url.searchParams.set(EVENT_SHEET_PARAM, next);
    // A sheet opens on its first level: a page left in the URL by an earlier visit is not this one's.
    url.searchParams.delete(SETTINGS_PAGE_PARAM);
    // A fresh object with the marker as a FIELD, never the whole state: see the header comment.
    window.history.pushState(
      { [HISTORY_MARKER]: true },
      "",
      `${url.pathname}${url.search}`,
    );
    pushedRef.current = true;
  }, []);

  const closeSheet = useCallback(() => {
    // Ours to pop, or not: the marker rides on the entry we pushed, and the
    // page remembers it too for the refresh that rewrites the entry. A host who
    // landed here from a bookmark has nothing of ours behind them.
    if (pushedRef.current || entryCarriesMarker()) {
      pushedRef.current = false;
      // Back, so the entry we added leaves with the panel rather than piling
      // up behind it. The popstate that follows restores the previous URL, and
      // `sheet` is read straight off that URL, so the panel closes by itself.
      window.history.back();
      return;
    }
    // Landed here directly (a bookmark, a shared link): there is nothing of
    // ours behind, so drop the parameter in place rather than leaving the app,
    // and the page a deep link opened inside Settings with it.
    const url = new URL(window.location.href);
    url.searchParams.delete(EVENT_SHEET_PARAM);
    url.searchParams.delete(SETTINGS_PAGE_PARAM);
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, []);

  /**
   * A SETTINGS PAGE REPLACES THE ENTRY IN PLACE (`settings-pages.ts` says why), and Next is handed a
   * FRESH state, never the entry's own: `window.history.state` carries `__NA`, which makes Next take
   * the call for its own and apply no URL, so the router never heard the page open or close (build
   * 23's red-team; the header says what that cost). The marker goes back on exactly when the entry is
   * ours, so `closeSheet`'s Back still knows it, and a deep-linked entry never gains one it did not
   * have. Next copies its own `__NA` and tree onto the object and applies the URL, as it does for
   * `openSheet`.
   */
  const replaceSettingsPage = useCallback((page: SettingsPage | null) => {
    const url = new URL(window.location.href);
    if (page) url.searchParams.set(SETTINGS_PAGE_PARAM, page);
    else url.searchParams.delete(SETTINGS_PAGE_PARAM);
    const ours = pushedRef.current || entryCarriesMarker();
    window.history.replaceState(
      ours ? { [HISTORY_MARKER]: true } : {},
      "",
      `${url.pathname}${url.search}`,
    );
  }, []);
  const openSettingsPage = useCallback(
    (page: SettingsPage) => replaceSettingsPage(page),
    [replaceSettingsPage],
  );
  const closeSettingsPage = useCallback(
    () => replaceSettingsPage(null),
    [replaceSettingsPage],
  );

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
      settingsPage,
      openSettingsPage,
      closeSettingsPage,
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
      settingsPage,
      openSettingsPage,
      closeSettingsPage,
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

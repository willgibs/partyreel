"use client";

import { useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { flushSync } from "react-dom";

import {
  resolveSettingsPage,
  SETTINGS_PAGE_PARAM,
  type SettingsPage,
} from "@/components/app/event-settings/settings-pages";
import { useOwnedEntry } from "@/lib/history-entry";
import { useHydrated } from "@/lib/shared/use-hydrated";
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
 * ★ THE ENTRY'S HISTORY IS `lib/history-entry.ts`'s, whose header holds what Next does
 * to an entry (measured). The sheets ask it four things: `push` when a card opens
 * one, `close` (Back when the entry is ours; a host who landed on a link or a
 * bookmark has nothing of ours behind them, so the parameter is dropped in place
 * and Back never throws them out of the app), `replace` for a settings page
 * moving inside the one entry, and `keep` after each render, which is how the
 * marker outlives a router commit (every Settings save re-renders the page in its
 * action's answer) and a reload. What was found HERE: a FRESH state and never `window.history.state`
 * (build 23's red-team, HIGH). The settings page's replace used to hand
 * `replaceState` the whole current state, "so the marker rides along untouched":
 * the bar gained `&setting=<page>` and the router never heard of it, so a
 * Settings row never opened its page and a page's back arrow never returned, and
 * the next router commit wrote the old address back over the bar.
 * `history-state-policy.test.ts` refuses the shape everywhere.
 *
 * ★ ALREADY OPEN IS OPEN (crumbs-18). A double tap on a card reaches `openSheet` twice before the page
 * has re-rendered, so what it asks is the address in the bar, never a render: the first tap's address is
 * the answer. A second entry made the first close go Back to the panel still open. The panel is left as
 * it is, on the page it is on.
 *
 * ★ A CLOSE ASKED TWICE CLOSES ONCE (crumbs-19). Two taps on the X before the first
 * Back's `popstate` lands (a person's needs a slow one; crumbs-18 measured two
 * same-tick clicks) called `history.back()` twice and left the hub for the page
 * before it. The helper ignores the second until the first has landed, and lets go
 * after a floor, so a Back that never comes cannot strand the panel open.
 */

const HISTORY_MARKER = "prEventSheet";

/** The sheet the address in the bar names: read off the bar, never a render (already open is open, below). */
function sheetInBar(): string | null {
  return new URL(window.location.href).searchParams.get(EVENT_SHEET_PARAM);
}

/** The address that opens `sheet` on its first level: a page an earlier visit left in the URL is not this one's. */
function addressOf(sheet: EventSheet): string {
  const url = new URL(window.location.href);
  url.searchParams.set(EVENT_SHEET_PARAM, sheet);
  url.searchParams.delete(SETTINGS_PAGE_PARAM);
  return `${url.pathname}${url.search}`;
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
   * pushState, the browser's Back, and the page a settings action re-renders —
   * and a mirrored `useState` would owe an effect per reason to stay
   * in step. Next's patched pushState calls the router's own url-applier, so
   * `useSearchParams` re-renders on all three for free, and the sheet surviving
   * a re-render costs nothing rather than costing a synchronisation effect.
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
   * THE ENTRY A PANEL STANDS ON, and whose it is (`lib/history-entry.ts`; the header says what it asks
   * of it). After every render `keep` runs with the sheet's word: open, it adopts a marker it finds (a
   * reload, or a Forward onto the panel, finds an entry this page never pushed) and gives an entry this
   * page pushed that a router commit rewrote its marker back (crumbs-18; no address, so the router hears
   * of nothing and nothing re-renders); closed, it forgets the entry and any Back still on its way, however
   * the panel closed (the X, Escape, Back).
   */
  const entry = useOwnedEntry(HISTORY_MARKER);
  useEffect(() => {
    entry.keep(sheet !== null);
  });

  const openSheet = useCallback(
    (next: EventSheet) => {
      if (sheetInBar() === next) return;
      entry.push(addressOf(next));
    },
    [entry],
  );

  const closeSheet = useCallback(() => {
    // Back when the entry is ours, so the entry we added leaves with the panel rather than piling up
    // behind it: the popstate that follows restores the previous URL, and `sheet` is read straight off that
    // URL, so the panel closes by itself. Landed here directly (a bookmark, a shared link) there is nothing
    // of ours behind, so the parameter is dropped in place rather than leaving the app, and the page a deep
    // link opened inside Settings with it.
    const url = new URL(window.location.href);
    url.searchParams.delete(EVENT_SHEET_PARAM);
    url.searchParams.delete(SETTINGS_PAGE_PARAM);
    entry.close(`${url.pathname}${url.search}`);
  }, [entry]);

  /**
   * A SETTINGS PAGE REPLACES THE ENTRY IN PLACE (`settings-pages.ts` says why), and Next is handed a
   * FRESH state, never the entry's own (the header says what that cost). The marker goes back on exactly
   * when the entry is ours, so `closeSheet`'s Back still knows it, and a deep-linked entry never gains one
   * it did not have.
   */
  const replaceSettingsPage = useCallback(
    (page: SettingsPage | null) => {
      const url = new URL(window.location.href);
      if (page) url.searchParams.set(SETTINGS_PAGE_PARAM, page);
      else url.searchParams.delete(SETTINGS_PAGE_PARAM);
      entry.replace(`${url.pathname}${url.search}`);
    },
    [entry],
  );
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

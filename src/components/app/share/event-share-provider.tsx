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
  roomOfHref,
  type EventSheet,
} from "@/lib/event/sections";

/**
 * THE HUB'S ONE CLIENT ISLAND — the sheets, the mini-modal, and which element
 * owns the code's morph. Everything on the event page that opens something
 * reads this: the header's code door, the sticky row's QR pill, the cards row's
 * doors, the album's empty state, and the event menu.
 *
 * ★ EVERY ROOM IS A PLACE ON THIS ONE ADDRESS (Will, event-header r2 `rooms=over`, 2026-10-03: "This feels
 * phenomenally more fluid, natural, and intuitive"). Review, Guests, Settings, the share kit and the guests' view
 * all ride `?room=`, so each opens over the hub and closes back to it the one way a place does here: its card pushes
 * an entry, Back or its close goes back over it, and a link or a bookmark onto one closes in place. One room handing
 * over to another (Settings' door page to Guests) REPLACES the entry, so a close always lands on the hub, never on
 * the room before. And every old way into a room that a press inside the hub still reaches (Settings' links into
 * Guests, the reel guidance's Review, a retired room route, the bell's rows) opens that room in place
 * (`useRoomLinks`, below), never a trip through the room's old address and back.
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

/**
 * The address that opens `sheet` on its first level (a page an earlier visit left in the URL is not this one's), or on
 * the Settings page a link named.
 */
function addressOf(sheet: EventSheet, page?: SettingsPage | null): string {
  const url = new URL(window.location.href);
  url.searchParams.set(EVENT_SHEET_PARAM, sheet);
  if (sheet === "settings" && page)
    url.searchParams.set(SETTINGS_PAGE_PARAM, page);
  else url.searchParams.delete(SETTINGS_PAGE_PARAM);
  return `${url.pathname}${url.search}`;
}

/** Whether a press is the browser's own (a modified click opens a tab, a middle click is not a click). */
function modified(e: MouseEvent): boolean {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

/** Which element currently carries the code's `view-transition-name`. Exactly
 *  one at a time — a duplicate name is an error the browser resolves by
 *  skipping the transition altogether. */
export type CodeMorphOwner = "header" | "pill" | "modal";

export const CODE_MORPH_NAME = "pr-event-code";

/** How a place is opened: the section of a room its link named, or the Settings page. */
type OpenOptions = { anchor?: string; page?: SettingsPage | null };

type ShareValue = {
  sheet: EventSheet | null;
  /**
   * Open a place. `anchor` names the section of the room its link pointed at (`#invited`), which the room takes
   * once it has drawn (`takeAnchor`): never an address of its own, so no fragment ever outlives the room.
   */
  openSheet: (sheet: EventSheet, opts?: OpenOptions) => void;
  closeSheet: () => void;
  /** The section the room's opener named, handed over once (null after, or when none was named). */
  takeAnchor: () => string | null;
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
  eventId,
  children,
}: {
  /** Resolved server-side from `?room=`, so a deep link opens with the page. */
  initialSheet: EventSheet | null;
  /**
   * The hub's event: a press on a link to one of ITS rooms opens the room in place (`useRoomLinks`). Absent off
   * the hub (the Library's specimens, a board), where no link is read.
   */
  eventId?: string;
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

  // The section a room's opener named (`openSheet`'s `anchor`), until the room takes it.
  const anchor = useRef<string | null>(null);
  const takeAnchor = useCallback(() => {
    const named = anchor.current;
    anchor.current = null;
    return named;
  }, []);

  const openSheet = useCallback(
    (next: EventSheet, opts?: OpenOptions) => {
      const open = resolveEventSheet(sheetInBar() ?? undefined);
      // Already open is open (crumbs-18), unless a link names another of Settings' pages: that page, in place.
      if (open === next) {
        if (next === "settings" && opts?.page) {
          const url = new URL(window.location.href);
          url.searchParams.set(SETTINGS_PAGE_PARAM, opts.page);
          entry.replace(`${url.pathname}${url.search}`);
        }
        return;
      }
      anchor.current = opts?.anchor || null;
      // ★ ONE ROOM HANDING OVER TO ANOTHER STAYS ONE ENTRY DEEP (rooms=over): the place's entry is moved to the
      // new room, still ours exactly when it was, so the close (Back, or in place for a deep link) lands on the
      // hub. Pushed, Settings' "Let them in from Guests" left Settings under Guests, and the X went back to it.
      const address = addressOf(next, opts?.page);
      if (open) entry.replace(address);
      else entry.push(address);
    },
    [entry],
  );

  useRoomLinks(eventId, openSheet);

  const closeSheet = useCallback(() => {
    // Back when the entry is ours, so the entry we added leaves with the panel rather than piling up
    // behind it: the popstate that follows restores the previous URL, and `sheet` is read straight off that
    // URL, so the panel closes by itself. Landed here directly (a bookmark, a shared link) there is nothing
    // of ours behind, so the parameter is dropped in place rather than leaving the app, and the page a deep
    // link opened inside Settings with it.
    const url = new URL(window.location.href);
    url.searchParams.delete(EVENT_SHEET_PARAM);
    url.searchParams.delete(SETTINGS_PAGE_PARAM);
    anchor.current = null;
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
   * support, reduced motion (which never starts a transition at all), and a
   * hidden document.
   *
   * ★ A HIDDEN DOCUMENT SKIPS THE TRANSITION (red-team 40's LOW). A tab nobody
   * is looking at cannot capture a snapshot, so the browser aborts the
   * transition it was asked for, and every promise it hands back rejects with
   * `InvalidStateError: Transition was aborted` (two unhandled rejections on
   * each open and close of the code card in a background tab). There is no
   * tween to see there anyway, so the change simply lands. A tab hidden
   * mid-transition aborts the same way: the transition's promises are caught,
   * since an aborted tween is not a failure (the change already committed).
   */
  const withMorph = useCallback(
    (change: () => void) => {
      const start = (
        document as Document & {
          startViewTransition?: (cb: () => void) => {
            ready: Promise<void>;
            finished: Promise<void>;
          };
        }
      ).startViewTransition;
      if (!start || reduced || document.visibilityState === "hidden") {
        change();
        return;
      }
      const transition = start.call(document, () => flushSync(change));
      // Only an abort is let go: a failure inside the change itself still surfaces as it always did.
      const abortedOnly = (error: unknown) => {
        if (
          error instanceof DOMException &&
          (error.name === "InvalidStateError" || error.name === "AbortError")
        )
          return;
        throw error;
      };
      transition.ready.catch(abortedOnly);
      transition.finished.catch(abortedOnly);
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
      takeAnchor,
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
      takeAnchor,
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

/**
 * ★ EVERY OLD WAY INTO A ROOM, PRESSED INSIDE THE HUB, OPENS THE ROOM IN PLACE (rooms=over; the brief's "every old
 * way in keeps answering"). Settings' door page links into Guests (`#at-the-door`, `#invited`), the reel's guidance
 * into Review, and the bell's rows into either: each is a real link (a modified click, a new tab and a link with a
 * target of its own stay the browser's, and the address they hold still answers through its redirect), and a plain
 * press on one, wherever on the page it stands (a portal included), is read here as the room it names
 * (`roomOfHref`: this event's retired room routes, or the hub's own address with a room on it) and opened over the
 * hub. A link anywhere else, another event's room included, is left alone.
 *
 * In the CAPTURE phase on the document, so the press is the room's before any handler on the link runs: Next's
 * `<Link>` reads `defaultPrevented` after its own `onClick` and stands down, and a door that opens its room itself
 * (the cards) meets an open room and does nothing more (`openSheet`: already open is open).
 */
function useRoomLinks(
  eventId: string | undefined,
  openSheet: (sheet: EventSheet, opts?: OpenOptions) => void,
) {
  useEffect(() => {
    if (!eventId) return;
    const onPress = (e: MouseEvent) => {
      if (e.defaultPrevented || modified(e)) return;
      const link =
        e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      if (
        (link.target && link.target !== "_self") ||
        link.hasAttribute("download")
      )
        return;
      const href = link.getAttribute("href") ?? "";
      const room = roomOfHref(
        href,
        eventId,
        window.location.origin,
        `${window.location.pathname}${window.location.search}`,
      );
      if (!room) return;
      e.preventDefault();
      const target = new URL(link.href);
      openSheet(room, {
        anchor: target.hash.slice(1),
        // A Settings page a link names (the Guests room's "Change who can get in", the checklist's steps).
        page:
          room === "settings"
            ? resolveSettingsPage(target.searchParams.get(SETTINGS_PAGE_PARAM))
            : null,
      });
    };
    document.addEventListener("click", onPress, true);
    return () => document.removeEventListener("click", onPress, true);
  }, [eventId, openSheet]);
}

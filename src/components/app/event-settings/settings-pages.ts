/**
 * SETTINGS' PAGES (event-settings r1, `opens=page`): each of the four rows opens its group as a page of
 * its own under a back arrow, the panel at a desk and the screen in a hand. A page rides the URL beside
 * the sheet (`?room=settings&setting=door`), so a link can open straight onto one (the hub's Settings
 * card and the Guests room point at the door), and a reload lands where the host was.
 *
 * ★ A PAGE REPLACES THE ENTRY, IT NEVER PUSHES ONE. The sheet is the one history entry
 * (`event-share-provider.tsx`), so Back, the X and Escape each close the whole of Settings from any
 * depth, a deep link included; the header's back arrow is the way up to the four rows.
 *
 * Pure and client-safe: the provider, the sheet and the page's links all read it.
 */

/** The four pages, in the order the rows stand. */
export const SETTINGS_PAGES = ["door", "adds", "reel", "event"] as const;
export type SettingsPage = (typeof SETTINGS_PAGES)[number];

/** The query parameter a page rides, beside `?room=settings`. */
export const SETTINGS_PAGE_PARAM = "setting";

/** A raw parameter as a page, or null for anything that is not one. */
export function resolveSettingsPage(
  raw: string | null | undefined,
): SettingsPage | null {
  return raw && (SETTINGS_PAGES as readonly string[]).includes(raw)
    ? (raw as SettingsPage)
    : null;
}

/** The address of one settings page on an event's hub (a link, a return path). */
export function settingsPageHref(eventId: string, page: SettingsPage): string {
  return `/dashboard/${eventId}?room=settings&${SETTINGS_PAGE_PARAM}=${page}`;
}

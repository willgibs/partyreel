import { redirect } from "next/navigation";

// Next 16: params is a Promise — await it.
type PageProps = { params: Promise<{ eventId: string }> };

/**
 * SETTINGS IS A SHEET NOW (Will, `settings=sheet`, 2026-09-20), and this route
 * survives as a DOOR to it rather than as a page.
 *
 * ★ BOOKMARKS AND SHIPPED LINKS ARE THE REASON. `/settings` has been the
 * settings' address for the whole life of the product: it is in browser
 * histories, in the guest-list teaser's button, and in a help article or two.
 * A 404 would be a self-inflicted broken link for a URL we published, so it
 * redirects to the event with the sheet open, which is the same destination
 * spelled the way the hub spells it.
 *
 * The old page's three parts went to three places: the settings FORM into the
 * sheet, the event-link config into the share sheet ("share should have a room
 * of its own ... as well as slug claim"), and the Deleted bin into the album as
 * a filter, so "Deleted" names exactly one thing.
 */
export default async function EventSettingsRedirect({ params }: PageProps) {
  const { eventId } = await params;
  redirect(`/dashboard/${eventId}?room=settings`);
}

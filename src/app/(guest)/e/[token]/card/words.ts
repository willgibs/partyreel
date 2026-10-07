/**
 * WHAT AN OPEN ALBUM'S LINK SAYS, BY WHAT THE ALBUM IS RIGHT NOW (crumbs-87, from the gap audit). A pasted link unfurls
 * as a card, a title and a line, and all three always said "Add photos to <name>" and "Add yours." even after the host
 * had closed uploads (help's own keepsake step: turn off Accepting uploads and the page becomes a keepsake), inviting
 * a group chat to do what the page then refuses. An album that takes photos invites; one that has closed them is the
 * album to look through, and says that.
 *
 * ★ THE STATE RIDES THE CARD'S ADDRESS, NOT ITS READ. The card is one answer per address, whoever asks, and the edge
 * keeps it for an hour (`card/route.tsx`). A card that read the album's state itself would go on inviting for up to
 * an hour after the host closed uploads while the page's own title said otherwise; the page names the address that is
 * true when it renders, so the title, the line and the image change in the same breath. The plain address (no flag)
 * is the line that is true of every album, "See the photos", and `?add` is the invitation: the same shape as
 * `?private`, whose flag the route honours only where an album's name is public (it never makes a private or unknown
 * album's card say anything). Only an open album's page names it: a password album's or a gated one's door stands
 * first, and its card never invites.
 *
 * Pure and isomorphic: the page names the words and the address, the route draws the foot.
 */
import { eventCardPath } from "@/lib/guest/event-card";

/** The flag that makes a card the inviting one: the album it names takes photos right now. */
export const ADD_CARD_PARAM = "add";

/** The card's foot: true of every album (the plain address), or the invitation (`?add`). */
export const CARD_FOOT = {
  look: "See the photos & videos on Partyreel",
  add: "Add your photos & videos on Partyreel",
} as const;

/** The card's foot for an address that does or does not carry the flag, and a name it may draw. */
export function cardFoot(inviting: boolean): string {
  return inviting ? CARD_FOOT.add : CARD_FOOT.look;
}

/** The card an open album's page names: the inviting one only while the album takes photos. */
export function openAlbumCardPath(
  qrToken: string,
  acceptingUploads: boolean,
): string {
  const path = eventCardPath(qrToken);
  return acceptingUploads ? `${path}?${ADD_CARD_PARAM}` : path;
}

/**
 * The link's own words for an open album: its title (the album it is, or one photograph of it) and its one line,
 * which says what to do with it, add or look.
 */
export function openAlbumWords(
  name: string,
  acceptingUploads: boolean,
  photo = false,
): { title: string; description: string } {
  const description = acceptingUploads
    ? "Photos and videos from the day. Add yours."
    : "Photos and videos from the day. Take a look.";
  if (photo) return { title: `A photo from ${name}`, description };
  return {
    title: acceptingUploads ? `Add photos to ${name}` : `Photos from ${name}`,
    description,
  };
}

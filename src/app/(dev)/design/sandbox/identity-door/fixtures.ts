import type { GridMedia } from "@/components/app/media-grid";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, ONE GUEST, THE WHOLE DOOR (round two).
 *
 * Maya and Jay's wedding, hosted by Maya, 14 June, the world `guest-capture`,
 * `identity-claims` and `identity-profile` all draw; Priya is the guest at its
 * door. A reader who has walked those boards recognises both on sight.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE (`guest-capture/fixtures.ts`'s
 * own rule): a board's directory is deleted the moment its picks are built, so
 * importing another board's fixtures would tie this board's life to a folder it
 * does not own. The facts are small and repeated deliberately.
 *
 * ★ THE STILLS ARE THE SAME TWELVE MARKETING IMAGES EVERY BOARD REUSES (bible
 * 9: no new asset, nothing to track the rights of). The album is newest first,
 * the order production draws it in, so "the newest three" below is honestly the
 * head of the album behind the door, not a separate pick.
 */

export const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  date: "14 June",
  approvedTotal: 48,
  guestCount: 14,
} as const;

/**
 * THE HOST, as the byline draws her: a photograph over her seeded colour.
 *
 * ★ A STAND-IN FACE. The golden-hour couple is the nearest thing the twelve
 * hold to a portrait of Maya herself, and `host` is the direction a real face
 * matters most to; the Handoff asks for the portrait that replaces it.
 */
export const HOST = {
  name: EVENT.host,
  seed: "id-maya",
  avatar: marketingImage("wedding-golden").src,
} as const;

/**
 * WHAT MAYA WROTE, when the `greeting` knob says she wrote something. It is the
 * event's own description (the field the album page already shows under its
 * stats line), so the door quoting it invents no words for a host.
 */
export const DESCRIPTION =
  "Thank you for celebrating with us! Add every photo you take tonight, even the blurry ones.";

export const PRIYA = {
  name: "Priya",
  email: "priya.shah@gmail.com",
} as const;

/** The code the email carried, and the three digits she has typed so far. */
export const CODE = { sent: "482913", typed: "482" } as const;

const S = (id: string) => marketingImage(id).src;

/** The album, newest first: the order the grid and every direction read. */
const ORDER = [
  "wedding-toast",
  "wedding-petals",
  "party-dj",
  "reception-table",
  "wedding-rings",
  "wedding-arch",
  "reception-hall",
  "wedding-golden",
  "festival-crowd",
] as const;

/** The two photographs that landed while she stands at the door: they wear the
 *  album's own arrival light (`data-arrived`), held at its peak, since motion
 *  lives only in the sheet. */
export const ARRIVED = new Set(["album-0", "album-2"]);

export const ALBUM: readonly GridMedia[] = ORDER.map((id, i) => ({
  id: `album-${i}`,
  type: "photo",
  url: S(id),
  downloadUrl: S(id),
  status: "approved",
  width: 4,
  height: i % 3 === 1 ? 5 : i % 3 === 2 ? 4 : 3,
}));

/** The head of the album: what `peek` fans, `lit` samples and `ticket` plays. */
export const NEWEST = ORDER.slice(0, 3).map(S);

/** The reel tile's resting still (the tile behind the door stays still). */
export const REEL_STILL = S("reception-hall");

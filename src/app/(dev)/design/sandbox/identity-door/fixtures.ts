import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE OPEN WEDDING, THE SAME ONE `guest-capture` DRAWS (Maya and Jay's, hosted
 * by Maya, 14 June), and the same guest, Priya, standing at its DOOR this
 * time rather than past it. `guest-capture`'s board opens once she has
 * already uploaded, unconfirmed; this board is everything between her QR
 * scan and that moment: the name step's optional email, a member's way to
 * sign in instead, the verified-required gate's framing, and her own menu
 * once she is inside.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE (`guest-capture/fixtures.ts`'s
 * own rule, carried here). Both boards can stand on the desk at once and a
 * board's directory is deleted the moment its ruling lands (registry.ts), so
 * importing another board's fixtures would tie this board's life to a folder
 * it does not own. The facts below are small and repeated deliberately: the
 * same wedding, the same guest, so a reader who has just answered
 * `guest-capture` recognises her immediately.
 *
 * ★ THE `gate` ASK IMAGINES THE SAME WEDDING WITH ONE SWITCH FLIPPED. Maya's
 * event is names-mode everywhere else on this board; `gate`'s three options
 * ask what she would see had Maya turned Require verified emails on, so the
 * host and the party stay the one world rather than inventing a second.
 *
 * ★ THE STILLS ARE THE SAME TWELVE MARKETING IMAGES EVERY BOARD REUSES
 * (bible 9: no new asset, nothing to track the rights of).
 */

export const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  hostSlug: "maya",
  token: "maya-jay",
  date: "14 June",
  approvedTotal: 48,
  contributorCount: 14,
} as const;

/** The host, as the gate's `eyebrow` option needs her: a seeded identity. */
export const HOST = {
  id: "host-maya",
  slug: EVENT.hostSlug,
  displayName: EVENT.host,
  avatarUrl: null,
  seed: "id-maya",
} as const;

/** The guest this whole board is about, before `guest-capture` ever meets her. */
export const PRIYA = {
  name: "Priya",
  seed: "id-priya",
} as const;

const STILL = (i: number) => MARKETING_IMAGES[i % MARKETING_IMAGES.length].src;

/**
 * THE NINE-TILE TEASER, blurred behind the held sheet the whole way
 * (guest-flow.md, "The ARRIVAL"). Plain photographs, no attribution: a
 * teaser withholds who added what exactly as it withholds the rest of the
 * album.
 */
export const TEASER: readonly GridMedia[] = Array.from(
  { length: 9 },
  (_, i) => ({
    id: `teaser-${i}`,
    type: "photo",
    url: STILL(i),
    downloadUrl: STILL(i),
    status: "approved",
    width: 4,
    height: i % 3 === 0 ? 5 : 3,
  }),
);

/**
 * WHAT KIND OF EVENT EACH OF THE TWELVE STILLS IS (round six, 2026-09-16).
 *
 * The swap needs one thing the manifest does not record: which of the five
 * kinds of event a still belongs to, so a picked catalogue can be asked for a
 * frame of the same thing. It is read by eye off `MARKETING_IMAGES`'s own
 * `subject` line, and `swap.test.ts` pins every id in the manifest to a row
 * here, in both directions, so a thirteenth still cannot land on the site with
 * no kind of event against its name.
 *
 * `reception-hall` is a birthday rather than a wedding on purpose: its subject
 * is a banquet hall in streamers, and the blog uses it as the birthday cover.
 */

import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

import { drawableVerticals, type Vertical } from "./sources";

export const VERTICAL_OF_ID: Readonly<Record<string, Vertical>> = {
  "wedding-golden": "weddings",
  "reception-table": "weddings",
  "wedding-rings": "weddings",
  "wedding-toast": "weddings",
  "wedding-arch": "weddings",
  "wedding-petals": "weddings",
  "party-balloons": "birthdays",
  "reception-hall": "birthdays",
  "party-dj": "birthdays",
  "concert-confetti": "festivals",
  "festival-lights": "festivals",
  "festival-crowd": "festivals",
};

/** Every id the manifest ships, with its kind of event. */
export const MANIFEST_IDS = MARKETING_IMAGES.map((m) => m.id);

/**
 * The kind of event a source would actually draw for this id: its own, or the
 * first the source can draw, or null when the source draws nothing at all. A
 * place with no wedding frames is still a place: it dresses the page with what
 * it has and the board says which kind that was.
 */
export function shownVerticalFor(
  sourceId: string,
  id: string,
): Vertical | null {
  const wanted = VERTICAL_OF_ID[id];
  if (!wanted) return null;
  const drawable = drawableVerticals(sourceId);
  if (drawable.includes(wanted)) return wanted;
  return drawable[0] ?? null;
}

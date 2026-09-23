import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * THE ROOM FRAMES: the photographs a `PhotoSection` stands on.
 *
 * ★ THIS IS THE SLOT, NOT THE PICTURES. `docs/ASSETS.md` row 20 ("room
 * frames") asks Will for a generated set built for exactly this job: one room,
 * photographed full-bleed, six of them varying in palette and subject between
 * NEIGHBOURS because the band walks them in order. Until that lands the site's
 * own stand-ins stand in, and the swap is a data change here and nowhere else:
 * no component names a picture.
 *
 * ★ THE ORDER IS THE COMPOSITION, and it is arranged for the PHONE first. A
 * reader with a cursor scrubs all six in whatever order they sweep; a reader on
 * a phone passes five, sampled evenly (`stepIndex`: 0, 1, 3, 4, 5), and holds
 * on each one for as long as their thumb takes. So the alternation that matters
 * is that sample's: golden hour (bright), the club floor (dark), the long table
 * (bright), the festival crowd (dark), the arch against open sky (bright). The
 * skipped one, the confetti, is the desktop's extra and sits between the two
 * night frames where a pointer crosses it fastest.
 *
 * ★ THE LAST ONE IS THE BRIGHTEST ON PURPOSE. This section closes the home's
 * first chapter and the paper chapter opens under it (Will's ruling: a
 * full-image section makes the crossing "much less harsh"), so the photograph a
 * reader leaves on is the one nearest the light ground they are about to meet.
 *
 * ★ THE FIRST ONE IS THE REST STATE. It is what a crawler, a throttled tab, a
 * reader with scripting off and a reader who asked for less motion all see, so
 * it carries the section on its own (bible 13, bible 14).
 *
 * ★ EVERY FRAME IS LANDSCAPE, and that is a requirement rather than an
 * accident: a portrait still (`wedding-petals`) cropped to a full-bleed band
 * throws away its subject and decodes half again as heavy for the pixels that
 * survive.
 */
export const ROOM_FRAMES = [
  "wedding-golden",
  "party-dj",
  "concert-confetti",
  "reception-table",
  "festival-crowd",
  "wedding-arch",
] as const;

/**
 * HOW MANY A READER WITHOUT A CURSOR PASSES. Will, clarifying his `scroll`
 * pick: "I'd like it to pass through 4-5 images at steps as it scrolls
 * vertically, not requiring taps as a cursor on mobile... but aren't the full
 * eight photographs that may feel too overwhelming cycling through so many on a
 * shorter mobile section."
 */
export const SCROLL_STEPS = 5;

/**
 * THE SERVED WIDTH, CAPPED, and the cap lives in the ASSET rather than in a
 * `sizes` string. A full-bleed layer is decode-bound, not bandwidth-bound: the
 * board measured its eight 900 px stand-ins at 423 KB over the wire and 17.4 MB
 * decoded, and the same eight delivered at 2880 would decode at about 22 MB
 * EACH. `next/image` never upscales past the source, so the source width IS the
 * ceiling, and row 20 asks for 1200 px frames to hold six of them inside the
 * board's measured budget. The `sizes` on the layer then only stops a phone
 * fetching a desktop's worth.
 */
export const ROOM_FRAME_WIDTH = 1200;

/** The stand-ins, resolved. Never a path in a component (marketing-media.ts). */
export const roomFrame = (id: string) => marketingImage(id);

import { Fraunces } from "next/font/google";

/**
 * THE VISION'S ONE NEW FACE: Fraunces, the display voice (the wordmark, the
 * display line, headlines and the names of events). Inter
 * (`var(--font-sans)`) stays the face to read, already loaded everywhere, so
 * this deck adds a single face.
 *
 * ★ WHY THIS FACE: the brand is people, so its loud voice is a soft black
 * serif with a hand in it: at weight 900 and SOFT 100 every corner is rounded
 * like a pebble, and its ball terminals (the a, the r, the y) are drawn with
 * the same round as the orb that ends the word. Picked over Nunito (rounded
 * terminals read as a toy at 900), Rubik (soft corners, but the app-store
 * default), Gabarito (a geometric sans, Urbanist's neighbour), Parkinsans
 * (warm, but the same round single-storey geometry as Urbanist) and M PLUS
 * Rounded (mechanical). It is also the one face of the six that no other
 * vision on the board stands near: a serif beside Urbanist's circles and
 * Bricolage's ink traps. Will once replaced a serif because it "read too
 * thin"; this is the heaviest cut of a soft serif, never thin.
 *
 * ★ WONK STAYS AT 0: the wonky set leans the n, m and h and swaps in a
 * curled ampersand, which turns the display line cute. The cheek is the orb
 * full stop's job. The axis is loaded only so every drawing can pin it, since
 * an instance left at a default could change under a later file.
 *
 * ★ OPTICAL SIZE PINNED WHERE THE FACE IS LOUD: the wordmark and display
 * lines draw the 144 cut (high contrast, tight spacing) at any size, so a
 * 30 px wordmark is the same drawing as a 150 px one; headlines draw the 72;
 * titles leave it to the browser (`font-optical-sizing: auto`), which opens
 * the face up at text sizes.
 */
export const evDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-ev-display",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

/** The class string the deck puts on every slide's root. */
export const EV_FONTS = evDisplay.variable;

/** The face's family as CSS, for a drawing that sets it by hand (an SVG). */
export const EV_FACE =
  "var(--font-ev-display), var(--font-display), ui-serif, Georgia, serif";

/** The pinned instances (see the header): the wordmark and display, a headline. */
export const EV_AXES = {
  display: '"opsz" 144, "SOFT" 100, "WONK" 0',
  head: '"opsz" 72, "SOFT" 100, "WONK" 0',
  title: '"SOFT" 100, "WONK" 0',
} as const;

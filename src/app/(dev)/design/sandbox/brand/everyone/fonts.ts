import { Bricolage_Grotesque } from "next/font/google";

/**
 * THE VISION'S ONE NEW FACE: Bricolage Grotesque, the display voice (loud
 * type and the wordmark). Inter (`var(--font-sans)`) stays the face to read,
 * already loaded everywhere, so this deck adds a single face.
 *
 * ★ WHY THIS FACE: a soft grotesk with ink traps and a hand in its curves,
 * warmer than Urbanist's compass-drawn bowls, and still grown-up at 800. Its
 * name is the brief in a word: a bricolage is made from what everyone brought.
 * The `opsz` axis lets one family be tight and characterful at display sizes
 * and open at a headline's, so the ladder needs no second display face.
 */
export const evDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-ev-display",
  axes: ["opsz", "wdth"],
  display: "swap",
});

/** The class string the deck puts on every slide's root. */
export const EV_FONTS = evDisplay.variable;

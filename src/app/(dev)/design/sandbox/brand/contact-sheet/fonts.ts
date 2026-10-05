import { Antonio, Bricolage_Grotesque } from "next/font/google";

/**
 * CONTACT SHEET'S TWO FACES (Inter, already loaded everywhere, reads).
 *
 * ★ THE DISPLAY IS A PRINT FACE, AND HEAVY. Bricolage Grotesque at its display
 * optical size (opsz 96) and ExtraBold: ink traps cut into its joins, which is
 * how a grotesk is drawn to survive ink on paper, so the loud voice is native
 * to print rather than borrowed from it. Will retired a thin serif because it
 * "read too thin"; this one carries more ink than Urbanist does. The `opsz`
 * axis is loaded so every size can be pinned to the display cut (an optical
 * size that followed the font size would draw the 22 px wordmark as a
 * different design from the 150 px one).
 *
 * ★ THE EDGE HAS A FACE OF ITS OWN, AND IT IS NEVER A MONOSPACE. Antonio is a
 * narrow film-edge sans with proportional figures: set small, in capitals and
 * tracked, it reads as the type a film stock prints along its rebate. It is
 * worn by the Edge alone (`Edge` in `system.tsx`), never by a sentence or a
 * control, so it stays a signature rather than a second reading face.
 */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-cs-display",
});

const edge = Antonio({
  subsets: ["latin"],
  variable: "--font-cs-edge",
});

/** Worn by every slide's root (`Vision.fonts`), so both faces reach each frame. */
export const CS_FONTS = `${display.variable} ${edge.variable}`;

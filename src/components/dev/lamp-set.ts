/**
 * The shipped lamp set as literals, for JavaScript that PARSES colour.
 *
 * CSS reads --lamp-1..5 from globals.css. Two consumers cannot take the token:
 * the contrast instrument (glow-contrast.ts parses oklch() numerically; hand
 * parseOklch a "var(--lamp-1)" and it returns null, so a board reports floor 1
 * with every ratio undefined instead of floor 0.13, wrong numbers and no error)
 * and the vendored beam palette (styles.ts regex-parses rgb() strings). The
 * rule: a JS consumer that parses colour needs literals; only CSS can take the
 * token. If the lamp set is retuned, update these five and globals.css
 * together; glow-contrast.test.ts fails when they drift. Lives beside the
 * instrument, not in the lab, so the lab can move without moving a test's
 * subject (the library round, 2026-09-02).
 */
export const LAMP_SET: string[] = [
  "oklch(0.72 0.17 25)",
  "oklch(0.8 0.15 85)",
  "oklch(0.72 0.14 155)",
  "oklch(0.7 0.14 255)",
  "oklch(0.68 0.16 305)",
];

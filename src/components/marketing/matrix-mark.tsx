import { Check, Minus } from "lucide-react";

/**
 * THE ONE TRUTH for a yes/no cell across the marketing surfaces: the /pricing comparison matrix
 * and the blog's comparison tables (the MDX <Yes /> / <No />) render the SAME glyphs from here,
 * so two pages never say "included" in two hands. The check keeps `text-success` on purpose:
 * pricing ruled it as the sanctioned "color as punctuation" case in a zero-chroma identity, and
 * an ink variant for articles would be a second answer to one question. Screen readers get the
 * word, not the glyph.
 */
export function MatrixMark({
  value,
  label,
}: {
  value: boolean;
  /** The sr-only word. Pricing says Included / Not included; a comparison table says Yes / No. */
  label?: string;
}) {
  return value ? (
    <>
      <Check
        className="inline size-4 text-success"
        strokeWidth={2}
        aria-hidden
      />
      <span className="sr-only">{label ?? "Included"}</span>
    </>
  ) : (
    <>
      <Minus
        className="inline size-4 text-muted-foreground/50"
        strokeWidth={2}
        aria-hidden
      />
      <span className="sr-only">{label ?? "Not included"}</span>
    </>
  );
}

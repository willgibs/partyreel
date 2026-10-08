import type { ReactElement } from "react";

/**
 * THE CARD'S TITLE, DRAWN SO EVERY GAP BETWEEN ITS WORDS IS ONE GAP (crumbs-93, red-team 58's NIT: "A Partyreel  event"
 * drew a gap after "Partyreel" a third wider than the one after the "A", with one space in the string).
 *
 * ★ WHY A TEXT NODE CANNOT DO IT (Satori, the renderer under `next/og`): it lays words out from each letter's advance
 * measured ALONE (no kerning), then draws every word as one run WITH the font's kerning, from the x the layout gave it.
 * A word is therefore drawn shorter than the box it was given by the sum of the kerning pairs inside it, and the gap
 * after it opens by that much: the longer the word and the more pairs it holds, the wider the gap (measured on Geist,
 * the bundled font, at 76 px: 23 px after one letter, 36 px after the nine of "Partyreel"; `letter-spacing`,
 * `white-space`, `font-feature-settings` and `word-spacing` change none of it). A letter drawn alone has no neighbour to
 * kern with, so here each word is a row of its letters and the layout and the drawing agree to the pixel; the words
 * wrap as units, and the gap between them is an explicit margin, the space's own width, the same after every word.
 *
 * The cost is Geist's kerning inside a word (a few px a word at this size, an open "Pa"); the card has no other opinion
 * of its text than being read at a glance in a chat, where one even gap is the better trade. The footer line stays one
 * text node: at 30 px the same error is a few px and no gap to read. Left to right only, by what the bundled font draws:
 * it has no glyph for a script that runs the other way (such a name draws as its missing-glyph box either way), and a
 * font that did would need its words ordered here.
 *
 * ★ THREE LINES, THEN CUT: the route clips a name to 70 characters, which three lines of this size hold; a name that
 * does not (a run of wide letters, a very long unbroken word) is cut at the third line, never run over the foot. The cut
 * is the OUTER box's (`maxHeight` over `overflow: hidden`, as wide as the card's padding allows), so a word wider than
 * the wrap width still shows whole up to the card's own margin, as the text node it replaces did.
 * `data-card-title` carries the plain string, for the tests that read what the card says.
 */

/** A space's advance in Geist, the font `next/og` ships: a quarter of the em. */
const SPACE_EM = 0.25;
const LINE_HEIGHT = 1.05;
const LINES = 3;

/** A name's graphemes, never its code units: an accented letter, a flag or an emoji is one tile. */
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
export const lettersOf = (word: string): string[] =>
  Array.from(segmenter.segment(word), (part) => part.segment);

/** A name's words: runs of anything but whitespace, so doubled, leading and trailing spaces never draw as a gap. */
export const wordsOf = (text: string): string[] =>
  text.split(/\s+/).filter(Boolean);

export function CardTitle({
  text,
  size,
  wrapWidth,
  clipWidth,
}: {
  text: string;
  /** The title's size in px. */
  size: number;
  /** Where a line wraps, in px. */
  wrapWidth: number;
  /** The widest anything of it shows, in px: the card's width less its padding, never less than `wrapWidth`. */
  clipWidth: number;
}): ReactElement {
  const words = wordsOf(text);
  const gap = Math.round(size * SPACE_EM);
  return (
    <div
      data-card-title={words.join(" ")}
      style={{
        display: "flex",
        width: `${clipWidth}px`,
        // Rounded UP: three lines of 79.8 px are 239.4, and the third must never lose a pixel of its descenders.
        maxHeight: `${Math.ceil(size * LINE_HEIGHT * LINES)}px`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignContent: "flex-start",
          maxWidth: `${wrapWidth}px`,
          fontSize: `${size}px`,
          fontWeight: 700,
          lineHeight: LINE_HEIGHT,
          letterSpacing: "-0.02em",
        }}
      >
        {words.map((word, w) => (
          <div
            key={w}
            style={{ display: "flex", flexShrink: 0, marginRight: `${gap}px` }}
          >
            {lettersOf(word).map((letter, i) => (
              <span key={i}>{letter}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

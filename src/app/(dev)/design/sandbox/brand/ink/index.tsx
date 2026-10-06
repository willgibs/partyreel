"use client";

import "./ik.css";

import type { Take } from "../afterglow/take";
import { INK_LIGHT, inkOf, STOCK } from "./light";

/**
 * INK: IN THE ROOM IT GLOWS; ON PAPER IT PRINTS.
 *
 * Its one construction: every album keeps ONE colour, the strongest light in
 * its photographs, read at depths the way the hashvatar is. In the room that
 * colour is emitted, a glow; on paper it is printed, one ink at full
 * strength, solid, in a few crisp forms (a mat behind the one subject, a band
 * round the Add, a rule where the photographs end, the event's name), the way
 * stationery is printed. Never the pale middle, which is where round one
 * washed out. Its paper is an uncoated warm stock, the paper ink is printed
 * on (Contact Sheet's touch), and a page prints in two inks: its black and
 * the album's colour.
 */

export const INK: Take = {
  id: "ink",
  name: "Ink",
  paper: STOCK,
  onPaper: { subject: "paper", foot: "paper", print: "paper" },
  light: INK_LIGHT,
  // The event's name and the one price print in the album's ink, which
  // `INK_PRINT` holds at 4.6:1 on the stock, so it is safe to set as type.
  inkFor: (source) => inkOf(source).hex,
  words: {
    line: "In the room the light glows. On paper it prints.",
    coverPaper:
      "On paper the photograph's light prints: its one colour, solid, as a mat behind it.",
    headline: ["One colour, two physics.", "Light in the room, ink on paper."],
    argument:
      "Every album keeps one colour, the strongest light in its photographs. In the room it glows. On paper it prints at full strength in a few solid forms: a mat, a band, a rule, the event's name. Never a pale tint of itself.",
    rule: {
      may: "As print only: a mat behind the one subject, the band round the Add, a rule where the photographs end.",
      becomes: "Ink: the album's one colour at full strength, solid and crisp.",
      carries: "The print itself, and the event's name set in the same ink.",
      never: "A blur or a tint: nothing on the page is paler than its ink.",
    },
    icon: "The shutter: a dark disc in a ring of light, keyed from the top-left. The icon is the lit tile everywhere, on a screen or printed on a card.",
    iconPaper:
      "On paper the icon stays the lit tile. Beside the wordmark the mark prints small: a dark disc in one band of ink.",
    colourPaper:
      "On paper a source prints as its one ink, solid and at full strength, never a paler copy.",
    forms: {
      ring: {
        room: "Round what adds a photograph, and the icon, in the album's one colour. It fills as photographs send.",
        paper:
          "Printed: a dark disc and one solid band of the album's colour, crisp at any size.",
      },
      seam: {
        room: "Where the photographs end: born at the edge in the album's colour, spent before the words.",
        paper:
          "A printed rule where the photographs end, the event's details set under it in the same ink.",
      },
      bloom: {
        room: "Behind the one live subject, in its one colour. It ignites once and rests lit.",
        paper:
          "A solid mat of the album's ink behind the one subject: its light, printed.",
      },
    },
    seedPaper:
      "Before the first photograph the ink is the seed's: one solid disc of it where the photographs will go.",
    motion:
      "Light, when something happens; print never moves on its own: a mat inks in once, a rule draws in once, a band fills as files send.",
    rhythm:
      "Paper pages are printed, never lit. Each prints its photographs' one ink: a mat behind its one subject, its price in the same ink, a rule over the footer.",
    borrow:
      "From Aperture: one lit plate for the reel on paper, the one subject whose light should move.",
    roundOne: "Round one on paper: the room's light, paled, reads as a stain.",
    thisTake:
      "Ink on paper: the same colour at full strength, printed solid and crisp.",
    notes: {
      hero: "The reel's light in its one colour, shot by shot: amber for the stage, blue for the floor. The words and the button stay in the dark.",
      darkPage:
        "Under the album, each photograph's own colour, glowing where it ends.",
      lightPage:
        "The Pro plan's photographs print their one colour: a solid mat behind them, the price in the same ink. Nothing on the page is pale.",
      hub: "On a light hub the code stands on a mat of the event's ink and the name is set in it: the seed's colour, before the first photograph.",
      share:
        "The table card is printed the way stationery is: black type, and the event's name and a mat round the code in its one ink.",
      home: "At 60 px the Ring keeps its light on a dark wallpaper or a light one; on a printed card it is the same lit tile.",
    },
  },
};

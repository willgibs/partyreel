"use client";

import "./ik.css";

import type { Take } from "../afterglow/take";
import { INK_LIGHT, STOCK } from "./light";

/**
 * INK: IN THE ROOM IT GLOWS; ON PAPER IT PRINTS.
 *
 * Its one construction: every album keeps ONE colour, the strongest light in
 * its photographs, read at depths the way the hashvatar is. In the room that
 * colour is emitted, a glow; on paper it is printed, at full strength and in
 * small exact amounts (a rule, a band, a fine screen of dots, the album's
 * name), the way a press has always drawn light. Never the pale middle, which
 * is where round one washed out. Its paper is an uncoated warm stock, the
 * paper ink is printed on (Contact Sheet's touch).
 */

export const INK: Take = {
  id: "ink",
  name: "Ink",
  paper: STOCK,
  onPaper: { subject: "paper", foot: "paper", print: "paper" },
  light: INK_LIGHT,
  words: {
    line: "In the room the light glows. On paper it prints.",
    coverPaper:
      "On paper the photograph's light prints: its one colour, as ink, in a fine screen at its edge.",
    headline: ["One colour, two physics.", "Light in the room, ink on paper."],
    argument:
      "Every album keeps one colour, the strongest light in its photographs. In the room it is emitted and glows; on paper it is printed, full strength and small, the way a press has always drawn light. Never a pale tint of itself.",
    rule: {
      may: "As print only: a rule where media ends, the shutter's band, a fine screen behind the one subject.",
      becomes:
        "Ink: the album's one colour at full strength, crisp, in small exact amounts.",
      carries:
        "The print itself: a rule, a band, a screen of dots, the album's own name.",
      never:
        "A blur or a tint on paper: nothing on the page is paler than its ink.",
    },
    icon: "The shutter: a dark disc in a ring of light, keyed from the top-left. Printed, the ring becomes one band of ink, a seal you could press into card.",
    iconPaper:
      "On paper the icon prints: the ink disc and its band, no glow, nothing pale.",
    colourPaper:
      "On paper a source prints as its one colour, deep and solid, in small amounts.",
    forms: {
      ring: {
        room: "Round what adds a photograph, and the icon, in the album's one colour. It fills as photographs send.",
        paper:
          "Printed: the ink disc and one band of the album's colour, crisp at any size.",
      },
      seam: {
        room: "Where the media ends: born at the edge in the album's colour, spent before the words.",
        paper:
          "A printed rule where the media ends, the event's credits set in the same ink.",
      },
      bloom: {
        room: "Behind the one live subject, in its one colour. It ignites once and rests lit.",
        paper:
          "A fine screen of ink round the subject: printed light, densest at its edge.",
      },
    },
    seedPaper:
      "Before the first photograph the album's ink is its seed's: the event prints in its own colour.",
    motion:
      "Light, when something happens; print never moves: a rule draws in once, a band fills as files send.",
    rhythm:
      "Paper pages are printed, never lit. Each takes its photographs' one ink for its rules and its one subject; the foot is paper, its rule printed.",
    roundOne: "Round one on paper: the room's light, paled, reads as a stain.",
    thisTake:
      "Ink on paper: the same colour at full strength, printed small and crisp.",
    notes: {
      hero: "The reel's light in its one colour, shot by shot: amber for the stage, blue for the floor. The words and the button stay in the dark.",
      darkPage:
        "Under the album, each photograph's key light, born where it ends.",
      lightPage:
        "The Pro plan's photographs print their one colour: a fine screen round them, a rule at the foot. Nothing on the page is pale.",
      hub: "On a light hub the code prints in the event's ink: the seed's colour, before the first photograph.",
      share:
        "The table card is printed in one ink, the album's own, the way wedding stationery is: the name, the rule, the screen.",
      home: "At 60 px the Ring keeps its light on a home screen; printed on a card, it keeps its one ink.",
    },
  },
};

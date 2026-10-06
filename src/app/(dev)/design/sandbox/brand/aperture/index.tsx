"use client";

import "./ap.css";

import { PRODUCTION_PAPER } from "../afterglow/system";
import type { Take } from "../afterglow/take";
import { APERTURE_LIGHT } from "./light";

/**
 * APERTURE: LIGHT LIVES IN THE DARK; PAPER KEEPS A PIECE OF IT.
 *
 * Its one construction: on paper the light never touches the page. It stays
 * inside the pieces of the room a page holds (the shutter's puck, the one lit
 * plate, the foot's slab, the rebate under a print), at the room's own
 * register, so it is exactly as bright on paper as in the room. Its paper is
 * production's own gallery white, the most contrast for the dark it carries.
 * It is the take closest to production: the album's well is already the room
 * on every ground, the display is already near-black on paper, and the footer
 * is already the ink slab, so Aperture names what production half does.
 */
export const APERTURE: Take = {
  id: "aperture",
  name: "Aperture",
  paper: PRODUCTION_PAPER,
  onPaper: { subject: "room", foot: "room", print: "paper" },
  light: APERTURE_LIGHT,
  words: {
    line: "Light lives in the dark. On paper, it keeps a piece of the room.",
    coverPaper:
      "On paper the photograph brings its own dark: its light stays inside the black mount, as bright as in the room.",
    headline: ["Light lives in the dark.", "Paper keeps a piece of it."],
    argument:
      "Light only reads as light against the dark, so on paper it never touches the page. It lives inside the few dark things a page holds: the shutter, one lit plate, the footer. The same light at the same strength on every ground: the room travels with it.",
    rule: {
      may: "Only inside a dark thing the page holds: the shutter, one lit plate, the black footer.",
      becomes:
        "Nothing new: the room's own light at the room's own strength, in its own dark.",
      carries:
        "The piece of the room it travels in: a dark disc, a black mount, a black strip.",
      never:
        "On the paper itself: no glow, tint or wash ever touches the page.",
    },
    icon: "The shutter: a dark disc in a ring of light, lit by one warm key from the top-left. It is a piece of the room wherever it goes, so its light never changes.",
    iconPaper:
      "On paper the icon keeps its dark tile: the tile is the dark its light needs.",
    colourPaper:
      "On paper a source glows only inside its own dark: the same light, never a paler copy of it.",
    forms: {
      ring: {
        room: "Round what adds a photograph, and the icon. It fills as photographs send.",
        paper:
          "In a flat dark disc: the ring carries the dark it needs to glow.",
      },
      seam: {
        room: "Where the media ends: born at the edge in the edge's own colours, spent before the words.",
        paper:
          "On a black strip under the print, the event's credits printed on it.",
      },
      bloom: {
        room: "Behind the one live subject: the code, the reel. It ignites once and rests lit.",
        paper:
          "The subject stands on a black mount, hot at its edge, black by the mount's edge.",
      },
    },
    seedPaper:
      "On a light dashboard an event's cover is still dark: the seed is a lamp in its own well.",
    motion:
      "Light, only when something happens: a plate ignites once, a ring fills as files send.",
    rhythm:
      "A paper page stays paper to its edges. It holds one lit piece of the room a screen (the plan to pick, the code to scan) and ends on the black footer, its light inside the dark.",
    borrow:
      "From Ink: its printed rule and credits wherever paper meets a photograph outside a plate.",
    roundOne: "Round one on paper: the room's light, paled, reads as a stain.",
    thisTake:
      "Aperture on paper: the light stays in its own dark, as bright as in the room.",
    notes: {
      hero: "The reel's own light, shot by shot: amber for the stage, blue for the floor. The words and the button stay in the dark.",
      darkPage:
        "The light under the album is the album's own: each photograph's edge, where it is.",
      lightPage:
        "The one live subject, the Pro plan, is a piece of the room: its photographs' light fills the dark card, never the page. The footer is black, lit from inside.",
      hub: "Before the first photograph the light is the event's seed. On a light hub the code keeps its own black plate, lit by the seed.",
      share:
        "The table card is printed on white card, the code on its own black plate lit by the seed. The link's card wears the album's light.",
      home: "At 60 px the Ring is the one dark disc on the screen and its light the only light, on a dark wallpaper or a light one.",
    },
  },
};

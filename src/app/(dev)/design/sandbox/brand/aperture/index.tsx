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
  onPaper: { subject: "room", foot: "room", print: "room" },
  light: APERTURE_LIGHT,
  words: {
    line: "Light lives in the dark. On paper, it keeps a piece of the room.",
    coverPaper:
      "On paper the photograph brings its own dark: its light stays inside the plate, as bright as in the room.",
    headline: ["Light lives in the dark.", "Paper keeps a piece of it."],
    argument:
      "Light only reads as light against the dark, so on paper it never touches the page. It lives inside the dark things a page holds: the shutter, the one lit plate, the foot. The same light at the same strength on every ground: the room travels with it.",
    rule: {
      may: "Only inside a dark piece the page holds: the shutter's puck, the one lit plate, the foot.",
      becomes:
        "Nothing new: the room's own light at the room's own strength, in its own dark.",
      carries:
        "The piece of the room it travels in: a puck, a plate, a rebate or the slab.",
      never: "On the paper itself: no glow, tint or wash ever touches the page.",
    },
    icon: "The shutter: a dark disc in a ring of light, lit by one warm key from the top-left. It is a piece of the room wherever it goes, so its light never changes.",
    iconPaper:
      "On paper the icon keeps its dark tile: the tile is the room its light needs.",
    colourPaper:
      "On paper a source glows only inside its own dark: the same light, never a paler copy of it.",
    forms: {
      ring: {
        room: "Round what adds a photograph, and the icon. It fills as photographs send.",
        paper:
          "In its own dark puck: the ring carries the room it needs to glow.",
      },
      seam: {
        room: "Where the media ends: born at the edge in the edge's own colours, spent before the words.",
        paper:
          "On a rebate of the room under the print, the event's credits beside it.",
      },
      bloom: {
        room: "Behind the one live subject: the code, the reel. It ignites once and rests lit.",
        paper:
          "The subject stands on a dark plate, and its light fills the plate, not the page.",
      },
    },
    seedPaper:
      "On a light dashboard an event's cover is still the room: the seed glows in its own dark well.",
    motion:
      "Light, only when something happens: a plate ignites once, a ring fills as files send.",
    rhythm:
      "A paper page stays paper to its edges. It holds one lit piece of the room a screen (the plan to pick, the code to scan) and ends on the ink slab, its Seam inside the dark.",
    roundOne: "Round one on paper: the room's light, paled, reads as a stain.",
    thisTake:
      "Aperture on paper: the light stays in its own dark, as bright as in the room.",
    notes: {
      hero: "The reel's own light, shot by shot: amber for the stage, blue for the floor. The words and the button stay in the dark.",
      darkPage:
        "The light under the album is the album's own: each photograph's edge, where it is.",
      lightPage:
        "The one live subject, the Pro plan, is a piece of the room: its photographs' light fills the plate, never the page. The foot is the ink slab, lit from inside.",
      hub: "Before the first photograph the light is the event's seed. On a light hub the code keeps its own dark plate, lit by the seed.",
      share:
        "The table card is a piece of the room, printed: light printed on black still reads as light. The link's card wears the album's.",
      home: "At 60 px the Ring is the one dark disc on the screen and its light the only light, on a dark wallpaper or a light one.",
    },
  },
};

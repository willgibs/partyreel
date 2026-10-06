"use client";

import "./ct.css";

import { type Paper, tone } from "../afterglow/system";
import type { Take } from "../afterglow/take";
import { CAST_LIGHT } from "./light";

/**
 * CAST: LIGHT FALLS; ON PAPER IT LANDS AS COLOUR.
 *
 * Its one construction: the light is the photograph itself, blurred, true to
 * every part of the picture and never a palette (no sampler can invent a hue
 * it was never shown). In the room it glows round the photograph; on paper it
 * falls through it, down and to the right from the product's one key light at
 * the top-left, and lands as a coloured shadow: darker than the page, so it
 * has the headroom a glow on white never has, and coloured, so it reads as
 * light through glass rather than a shadow. Sun through a glass of wine lands
 * red on a white tablecloth. Its paper is a bright neutral white, so the
 * colours it catches land true.
 */

/** A bright, neutral white: a table in daylight, so cast colour lands true. */
export const DAYLIGHT: Paper = {
  name: "Daylight white",
  ground: tone(0.982, 0, 0),
  card: tone(1, 0, 0),
  fg: tone(0.15, 0, 0),
  muted: tone(0.44, 0, 0),
  faint: tone(0.6, 0, 0),
};

export const CAST: Take = {
  id: "cast",
  name: "Cast",
  paper: DAYLIGHT,
  onPaper: { subject: "paper", foot: "paper", print: "paper" },
  light: CAST_LIGHT,
  words: {
    line: "Light falls: a glow in the room, a coloured shadow on paper.",
    coverPaper:
      "On paper the photograph's light falls through it, down and to the right, and lands as its own colours.",
    headline: ["Light falls.", "On paper it lands as colour."],
    argument:
      "The light is the photograph itself, blurred: true to every part of the picture, never a palette. In the room it glows round it; on paper it falls through it, the way sun through a glass of wine lands red on a tablecloth.",
    rule: {
      may: "Only under and beside a lit thing, on its shadow side: down and right, from the key light at the top-left.",
      becomes:
        "A coloured shadow: the photograph's own colours, darker than the page, densest at its edge.",
      carries:
        "The lit thing itself: a photograph, the shutter, the one subject card.",
      never:
        "Above or behind words, or loose on the page: light only falls from something.",
    },
    icon: "The shutter: a dark disc in a ring of light, lit from the top-left. On a light ground its light falls past it, the ring's own colours as a shadow.",
    iconPaper:
      "On paper the icon's ring casts its warm light down and to the right.",
    colourPaper:
      "On paper a source falls as a coloured shadow, in its photograph's own colours.",
    forms: {
      ring: {
        room: "Round what adds a photograph, and the icon: the album's own colours, filling as photographs send.",
        paper:
          "The ring's light falls below it as a coloured shadow, the album's own colours.",
      },
      seam: {
        room: "Where the media ends: the picture's own colours, glowing out of its edge.",
        paper:
          "The photographs' colours fall from their edge onto the page, dense and short.",
      },
      bloom: {
        room: "Behind the one live subject: its own frames, blurred, the light the picture gives.",
        paper:
          "The subject casts its own colours, down and to the right, as glass in the sun does.",
      },
    },
    seedPaper:
      "Before the first photograph the seed's own orb casts its colour on the page.",
    motion:
      "Light, when something happens: a shadow settles once as a photograph lands; nothing loops.",
    rhythm:
      "Paper pages are lit from the top-left like everything in the product. Their one subject casts its colour; the foot is paper, the page's photographs falling into it.",
    roundOne: "Round one on paper: the room's light, paled, reads as a stain.",
    thisTake:
      "Cast on paper: the light falls as colour, darker than the page, never paler.",
    notes: {
      hero: "The reel's own frames, blurred, glow round it: the light is the picture, amber for the stage and blue for the floor.",
      darkPage:
        "Under the album the photographs' own colours fall from their edge, each where it is.",
      lightPage:
        "The Pro plan's photographs cast their colours onto the card, down and to the right; the page round them stays white.",
      hub: "Before the first photograph the code casts the seed's colour; the Add casts its ring's.",
      share:
        "The table card's code casts the seed's colour onto the card, like light through coloured glass.",
      home: "On a light home screen the Ring's light falls past its tile; on a dark one it glows round it.",
    },
  },
};

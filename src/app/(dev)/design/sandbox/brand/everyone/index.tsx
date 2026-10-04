"use client";

import "./ev.css";

import type { Vision } from "../deck/contract";
import { stubVision } from "../deck/stub";
import { EV_FONTS } from "./fonts";
import { Atmosphere } from "./slides/atmosphere";
import { Color } from "./slides/color";
import { Cover } from "./slides/cover";
import { Idea } from "./slides/idea";
import { Marks } from "./slides/marks";
import { Pages } from "./slides/pages";
import { Signature } from "./slides/signature";
import { Voice } from "./slides/voice";

/**
 * EVERYONE'S COLOR: the people-first vision. Every guest brings a colour (the
 * hashvatar, promoted from avatar to the brand's material), an event's colour
 * is the mix of the people in it, and the chrome stays grey so they are the
 * only colour there is. Slides 1 to 8 are the system; 9 to 14 are the
 * application designer's, stand-ins until they land.
 */

const ID = "everyone";
const NAME = "Everyone's Color";
const LINE = "Every guest brings a color.";

const stand = stubVision(ID, NAME, LINE);

export const EVERYONE: Vision = {
  id: ID,
  name: NAME,
  line: LINE,
  fonts: EV_FONTS,
  slides: {
    cover: Cover,
    idea: Idea,
    marks: Marks,
    color: Color,
    signature: Signature,
    atmosphere: Atmosphere,
    voice: Voice,
    pages: Pages,
    hero: stand.slides.hero,
    "dark-page": stand.slides["dark-page"],
    "light-page": stand.slides["light-page"],
    "empty-hub": stand.slides["empty-hub"],
    share: stand.slides.share,
    "home-screen": stand.slides["home-screen"],
  },
  tone: {
    cover: "light",
    idea: "light",
    marks: "light",
    color: "light",
    signature: "light",
    atmosphere: "light",
    voice: "light",
    pages: "light",
  },
  phoneHeight: {
    idea: 1480,
    marks: 1240,
    color: 1750,
    signature: 1790,
    atmosphere: 1780,
    voice: 1730,
    pages: 1320,
  },
};

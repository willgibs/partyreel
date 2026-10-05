"use client";

import "./ev.css";

import type { Vision } from "../deck/contract";
import { ShareSlide } from "./applied/card";
import { Hero } from "./applied/hero";
import { HomeScreenSlide } from "./applied/home-screen";
import { EmptyHub } from "./applied/hub";
import { PricingPage } from "./applied/pricing-page";
import { ReelPage } from "./applied/reel-page";
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
 * only colour there is. Slides 1 to 8 are the system (`slides/`, on the
 * primitives in `system.tsx` and `marks.tsx`); 9 to 14 are the system applied
 * (`applied/`), each a sketch of one touchpoint at a desk and on a phone.
 */

const ID = "everyone";
const NAME = "Everyone's Color";
const LINE = "Every guest brings a color.";

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
    hero: Hero,
    "dark-page": ReelPage,
    "light-page": PricingPage,
    "empty-hub": EmptyHub,
    share: ShareSlide,
    "home-screen": HomeScreenSlide,
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
    hero: "light",
    "dark-page": "dark",
    "light-page": "light",
    "empty-hub": "light",
    share: "light",
    "home-screen": "light",
  },
  phoneHeight: {
    idea: 1480,
    marks: 1240,
    color: 1750,
    signature: 1790,
    atmosphere: 1780,
    voice: 1730,
    pages: 1320,
    hero: 900,
    "dark-page": 1150,
    "light-page": 1790,
    "empty-hub": 1360,
    share: 890,
    "home-screen": 1060,
  },
};

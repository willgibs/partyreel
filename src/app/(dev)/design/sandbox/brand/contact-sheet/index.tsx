"use client";

import "./cs.css";

import type { Vision } from "../deck/contract";
import { DarkPageSlide } from "./applied/dark-page";
import { EmptyHubSlide } from "./applied/empty-hub";
import { HeroSlide } from "./applied/hero";
import { HomeScreenSlide } from "./applied/home-screen";
import { LightPageSlide } from "./applied/light-page";
import { ShareSlide } from "./applied/share";
import { CS_FONTS } from "./fonts";
import { AtmosphereSlide } from "./slides/atmosphere";
import { ColorSlide } from "./slides/color";
import { CoverSlide } from "./slides/cover";
import { IdeaSlide } from "./slides/idea";
import { MarksSlide } from "./slides/marks-slide";
import { PagesSlide } from "./slides/pages";
import { SignatureSlide } from "./slides/signature";
import { VoiceSlide } from "./slides/voice";

/**
 * CONTACT SHEET: Partyreel is everyone's roll, developed together. The brand
 * has no colour of its own; it is the print and the paper around it (the
 * border, the film's edge printing, the contact sheet, the lab's marks), and
 * the photographs and the people in them are the only colour.
 *
 * Slides 1 to 8 are the system (`slides/`), drawn from `system.tsx` and
 * `marks.tsx`; 9 to 14 are the system applied (`applied/`), six sketches
 * composed from those primitives and the applied kit (`applied/kit.tsx`).
 */

const ID = "contact-sheet";
const NAME = "Contact Sheet";
const LINE = "Everyone's roll, developed together.";

export const CONTACT_SHEET: Vision = {
  id: ID,
  name: NAME,
  line: LINE,
  fonts: CS_FONTS,
  slides: {
    cover: CoverSlide,
    idea: IdeaSlide,
    marks: MarksSlide,
    color: ColorSlide,
    signature: SignatureSlide,
    atmosphere: AtmosphereSlide,
    voice: VoiceSlide,
    pages: PagesSlide,
    hero: HeroSlide,
    "dark-page": DarkPageSlide,
    "light-page": LightPageSlide,
    "empty-hub": EmptyHubSlide,
    share: ShareSlide,
    "home-screen": HomeScreenSlide,
  },
  phoneHeight: {
    idea: 1230,
    marks: 1430,
    color: 1730,
    signature: 1460,
    atmosphere: 1780,
    voice: 1800,
    pages: 1580,
    hero: 1310,
    "dark-page": 1130,
    "light-page": 1480,
    "empty-hub": 1512,
    share: 930,
    "home-screen": 1300,
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
};

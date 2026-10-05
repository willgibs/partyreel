"use client";

import "./ag.css";

import type { Vision } from "../deck/contract";
import { DarkPageSlide } from "./applied/dark-page";
import { EmptyHubSlide } from "./applied/empty-hub";
import { HeroSlide } from "./applied/hero";
import { HomeScreenSlide } from "./applied/home-screen";
import { LightPageSlide } from "./applied/light-page";
import { ShareSlide } from "./applied/share";
import { AtmosphereSlide } from "./atmosphere";
import { ColorSlide } from "./color";
import { Cover } from "./cover";
import { Idea } from "./idea";
import { MarksSlide } from "./marks-slide";
import { PagesSlide } from "./pages";
import { SignatureSlide } from "./signature";
import { VoiceSlide } from "./voice";

/**
 * AFTERGLOW: the brand is the light the photographs give off.
 *
 * The interface is a quiet ground (the room, or paper); the photographs are
 * the brightest thing on every screen; every colour beyond them is their
 * light, in three forms (the Ring, the Seam, the Bloom), sourced in one order
 * (the photographs, then the event's seed, then the five house lamps).
 *
 * The files: `system.tsx` holds every value and primitive (the grounds and
 * inks, the status set, the light's sources and registers, Seam, Bloom, Ring,
 * StatusLight, SeedCover, CodePlate, LitPhoto, PhoneShell); `marks.tsx` the
 * wordmark (Will's v1, untouched), the icon and the lockup; `ag.css` every
 * style under `.ag-`; `root.tsx` a slide's root. Slides 1 to 8 are the system;
 * 9 to 14 (`applied/`) are the system applied, six touchpoints composed from
 * those primitives and two additions (`applied/kit.tsx`).
 */

const ID = "afterglow";
const NAME = "Afterglow";
const LINE = "The brand is the light the photographs give off.";

export const AFTERGLOW: Vision = {
  id: ID,
  name: NAME,
  line: LINE,
  slides: {
    cover: Cover,
    idea: Idea,
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
    idea: 1780,
    marks: 1500,
    color: 1790,
    signature: 1800,
    atmosphere: 1600,
    voice: 1760,
    pages: 1640,
    hero: 1500,
    "dark-page": 1820,
    "light-page": 1812,
    "empty-hub": 1816,
    share: 1030,
    "home-screen": 1812,
  },
  tone: {
    idea: "light",
    voice: "light",
    pages: "light",
    "light-page": "light",
    share: "light",
  },
};

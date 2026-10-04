"use client";

import "./ag.css";

import type { Vision } from "../deck/contract";
import { stubVision } from "../deck/stub";
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
 * 9 to 14 stand in until the touchpoints are drawn from these.
 */

const ID = "afterglow";
const NAME = "Afterglow";
const LINE = "The brand is the light the photographs give off.";

const stand = stubVision(ID, NAME, LINE);

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
    hero: stand.slides.hero,
    "dark-page": stand.slides["dark-page"],
    "light-page": stand.slides["light-page"],
    "empty-hub": stand.slides["empty-hub"],
    share: stand.slides.share,
    "home-screen": stand.slides["home-screen"],
  },
  phoneHeight: {
    idea: 1780,
    marks: 1500,
    color: 1790,
    signature: 1800,
    atmosphere: 1600,
    voice: 1760,
    pages: 1640,
  },
  tone: {
    idea: "light",
    voice: "light",
    pages: "light",
  },
};

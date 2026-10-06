"use client";

import "./ag.css";

import type { ReactNode } from "react";

import {
  SLIDES,
  type SlideId,
  type SlideProps,
  type Vision,
} from "../deck/contract";
import { AtmosphereSlide } from "./slides/atmosphere";
import { ColorSlide } from "./slides/color";
import { CoverSlide } from "./slides/cover";
import { DarkPageSlide } from "./slides/dark-page";
import { EmptyHubSlide } from "./slides/empty-hub";
import { HeroSlide } from "./slides/hero";
import { HomeScreenSlide } from "./slides/home-screen";
import { IdeaSlide } from "./slides/idea";
import { LightPageSlide } from "./slides/light-page";
import { MarksSlide } from "./slides/marks";
import { PagesSlide } from "./slides/pages";
import { ShareSlide } from "./slides/share";
import { SignatureSlide } from "./slides/signature";
import { VoiceSlide } from "./slides/voice";
import { type Take, TakeProvider } from "./take";

/**
 * A TAKE, AS A DECK: the contract's fourteen slides in their one order, each
 * the shared composition (`slides/`) drawn inside the take, or the take's own
 * where it replaces one. Every take reads on the same grounds, at the same
 * phone heights, so the stage compares like with like.
 */

const SHARED: Record<SlideId, (p: SlideProps) => ReactNode> = {
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
};

/** Each slide's height on a phone (375 wide). */
export const PHONE_HEIGHT: Partial<Record<SlideId, number>> = {
  cover: 940,
  idea: 1910,
  marks: 1600,
  color: 1760,
  signature: 2260,
  atmosphere: 1700,
  voice: 1760,
  pages: 1720,
  hero: 1500,
  "dark-page": 1820,
  "light-page": 1860,
  "empty-hub": 1860,
  share: 1460,
  "home-screen": 1812,
};

/** Each slide's ground, so the deck's running head reads on it. */
export const TONE: Partial<Record<SlideId, "dark" | "light" | "split">> = {
  cover: "split",
  marks: "split",
  color: "split",
  idea: "light",
  voice: "light",
  pages: "light",
  "light-page": "light",
  share: "light",
};

export function visionOf(take: Take): Vision {
  const slides = Object.fromEntries(
    SLIDES.map((s) => {
      const Draw = take.slides?.[s.id] ?? SHARED[s.id];
      const Slide = (p: SlideProps) => (
        <TakeProvider take={take}>
          <Draw {...p} />
        </TakeProvider>
      );
      Slide.displayName = `${take.name}${s.title.replace(/\W/g, "")}`;
      return [s.id, Slide];
    }),
  ) as unknown as Record<SlideId, (p: SlideProps) => ReactNode>;
  return {
    id: take.id,
    name: take.name,
    line: take.words.line,
    slides,
    phoneHeight: PHONE_HEIGHT,
    tone: TONE,
  };
}

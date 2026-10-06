import type { ReactNode } from "react";

import type { ScreenId } from "../knobs";

/**
 * THE DECK'S CONTRACT: what every agency team hands back, in one order.
 *
 * ★ ONE ORDER FOR ALL THREE. Every vision is the same fourteen slides in the
 * same places, so pressing between two visions on the stage compares like with
 * like (slide 4 is always color and status, slide 12 always the empty hub), and
 * no vision can skip the part it is weakest at. The first eight are the system;
 * the last six are the system applied, as sketches.
 *
 * ★ A TOUCHPOINT IS A SKETCH, AND SAYS SO (the brief): the applied boards come
 * after Will's pick, so slides 9 to 14 judge the system, not the design, and
 * the deck's own head says that on every one of them (`SlideHead`).
 */
export const SLIDES = [
  { id: "cover", title: "Cover", touchpoint: false },
  { id: "idea", title: "The idea", touchpoint: false },
  { id: "marks", title: "Wordmark and icon", touchpoint: false },
  { id: "color", title: "Color and status", touchpoint: false },
  { id: "signature", title: "The signature", touchpoint: false },
  { id: "atmosphere", title: "Without media", touchpoint: false },
  { id: "voice", title: "Type, imagery, motion", touchpoint: false },
  { id: "pages", title: "Dark and light", touchpoint: false },
  { id: "hero", title: "The home hero", touchpoint: true },
  { id: "dark-page", title: "A dark page", touchpoint: true },
  { id: "light-page", title: "A light page", touchpoint: true },
  { id: "empty-hub", title: "The hub, empty", touchpoint: true },
  { id: "share", title: "The QR card", touchpoint: true },
  { id: "home-screen", title: "On a home screen", touchpoint: true },
] as const;

export type SlideId = (typeof SLIDES)[number]["id"];

/** What a slide's drawing is handed: the screen the deck is read on. */
export type SlideProps = { screen: ScreenId };

/**
 * ONE AGENCY TEAM'S DECK. `slides` draws each slide's whole content at the
 * slide's own size (1440 by 900 at a desk; 375 wide on a phone, as tall as
 * `phoneHeight` says, 812 when it says nothing). The deck around it (the frame,
 * its title and the caption read off it) is `Deck`'s.
 */
export type Vision = {
  /** The option id on the board. */
  readonly id: string;
  /** The territory's name, as the agency titles it. */
  readonly name: string;
  /** One line under the name. */
  readonly line: string;
  readonly slides: Readonly<Record<SlideId, (props: SlideProps) => ReactNode>>;
  /** A slide's height on a phone, where 812 is not enough. */
  readonly phoneHeight?: Partial<Record<SlideId, number>>;
  /**
   * Each slide's ground, so the deck's running head is drawn in ink that
   * reads on it: "dark" (the default) draws it light, "light" draws it dark,
   * and "split" (the room on the left, paper on the right) draws its name
   * light and its place dark.
   */
  readonly tone?: Partial<Record<SlideId, "dark" | "light" | "split">>;
  /**
   * Class names worn by every slide's root: a vision's `next/font` variables
   * (`face.variable`), so its faces reach every frame it draws in.
   */
  readonly fonts?: string;
};

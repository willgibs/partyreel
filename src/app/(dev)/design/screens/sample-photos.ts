/**
 * The sample media pack (public/design/, Unsplash-licensed, dev-playground only).
 * Real photos on purpose: every direction is judged on how it frames OTHER
 * people's color, especially direction A where media is the only color at all.
 */
export const PHOTOS = [
  "/design/p01.jpg", // wedding couple, bouquet, golden backlight
  "/design/p02.jpg", // dinner table toast
  "/design/p03.jpg", // confetti burst
  "/design/p04.jpg", // confetti over a night crowd
  "/design/p05.jpg", // sparkler exit
  "/design/p06.jpg", // long table, evening dinner
  "/design/p07.jpg", // party scene
  "/design/p08.jpg", // concert, blue light
  "/design/p09.jpg", // concert, full-color lights
  "/design/p10.jpg", // crowd, hands up
  "/design/p11.jpg", // first dance
] as const;

/** Portrait-orientation shot (the tall-photo lightbox case). */
export const PORTRAIT_PHOTO = "/design/p12.jpg";

/** The warm couple shot: event cover + hero duty. */
export const COVER_PHOTO = "/design/p01.jpg";

export const EVENT_NAME = "Maya & Jay's Wedding";
export const EVENT_BYLINE = "Hosted by Maya · June 14";

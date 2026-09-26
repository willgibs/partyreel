import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * THE TRAIL FRAMES: the photographs a trail lays down.
 *
 * ★ THIS IS THE SLOT, NOT THE PICTURES. `docs/ASSETS.md` row 21 ("trail frames")
 * asks Will for a generated set built for exactly this job: distinct PORTRAIT
 * photographs, enough of them that the ring never shows the same one twice at
 * once. Until that lands the site's own stand-ins stand in, and the swap is a
 * data change here and nowhere else: no component names a picture.
 *
 * ★ NEIGHBOURS DIFFER, because the ring walks this list in order and a trail's
 * whole subject is the run of photographs a hand leaves behind it. Two weddings
 * side by side read as one photograph seen twice; a wedding, a dance floor and a
 * long table read as a night. So the order alternates register (golden, dark,
 * bright, dark) rather than grouping by event.
 *
 * ★ THE STAND-INS ARE LANDSCAPE AND THE TRAIL IS NOT, which is the one thing the
 * generated set fixes. A card is 3:4, 4:5 or square, so every frame here is
 * cropped hard through `object-position`, and the crop is chosen per SLOT rather
 * than per picture (`trail.tsx`) so a card that recycles keeps its own framing.
 * Row 21 asks for portraits precisely so the crop stops throwing subjects away.
 */
export const TRAIL_FRAMES = [
  "wedding-golden",
  "party-dj",
  "reception-table",
  "festival-lights",
  "wedding-petals",
  "concert-confetti",
  "wedding-toast",
  "festival-crowd",
  "wedding-rings",
  "reception-hall",
  "party-balloons",
  "wedding-arch",
] as const;

/** The stand-ins, resolved. Never a path in a component (marketing-media.ts). */
export const trailFrame = (i: number) =>
  marketingImage(TRAIL_FRAMES[i % TRAIL_FRAMES.length]);

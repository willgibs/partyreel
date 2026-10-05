import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * THE EDGE'S OWN STILLS: the covers of the albums Maya added to as a guest,
 * on her dashboard. Bootstrap stills every board reuses (`fixtures.ts`'s rule:
 * no new asset to make or track).
 */
export const COVERS = {
  balloons: marketingImage("party-balloons").src,
  crowd: marketingImage("festival-crowd").src,
  lights: marketingImage("festival-lights").src,
  confetti: marketingImage("concert-confetti").src,
  dj: marketingImage("party-dj").src,
  hall: marketingImage("reception-hall").src,
  table: marketingImage("reception-table").src,
} as const;

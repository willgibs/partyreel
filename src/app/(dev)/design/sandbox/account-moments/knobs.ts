import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S KNOBS, AS PURE DATA: split from the drawings so `spec.ts`
 * declares them without importing React into a module the registry hands to a
 * server page (`registry.test.ts`'s own rule).
 *
 * ★ HER PHONE FIRST, HER LAPTOP ONE PRESS AWAY. These are a guest's moments
 * as much as a host's: Priya follows Maya from the album on her phone the
 * night of the wedding, and opens her own page from the same menu; Account's
 * Connections is likelier at a desk, and every frame draws at either width.
 */
export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

export type ScreenId = "1440" | "375";

export const SCREENS: Record<ScreenId, { w: number; h: number; name: string }> =
  {
    "1440": { w: 1440, h: 900, name: "a laptop" },
    "375": { w: 375, h: 812, name: "a phone" },
  };

export const screenOf = (v: unknown): ScreenId =>
  v === "1440" ? "1440" : "375";

/**
 * ★ WHOSE PHOTOGRAPHS (the invitation's): her six from the wedding, or six
 * from a party night. The plate's light is read from her photographs, so a
 * picture of one set could be any fixed gradient; swapping the set is how the
 * light is seen to be hers. Her uploads below change with it.
 */
export const PHOTOS: Control = {
  id: "photos",
  label: "Her photos",
  options: [
    { id: "wedding", label: "From the wedding" },
    { id: "party", label: "From a party night" },
  ],
  default: "wedding",
};

export type PhotosId = "wedding" | "party";

export const photosOf = (v: unknown): PhotosId =>
  v === "party" ? "party" : "wedding";

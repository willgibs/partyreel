import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S ONE KNOB, AS PURE DATA (split from the client files so
 * `spec.ts` can declare it without importing React into a module
 * `registry.ts` hands to a server page).
 *
 * ★ ONE PHOTOGRAPH UNDER ALL FOUR VEILS, SO THE VEIL IS WHAT DIFFERS. A veil
 * reads through what it covers: over round three's crowd (a soft, smoky
 * still whose sharp parts all sit behind the words) every clearing opens on
 * smoke, and the three variations would lose to the photograph rather than
 * to the original. So every veil is drawn over the same still, a toast under
 * string lights by default, and the knob puts round three's crowd back under
 * all four, the original then exactly as he picked it. Both are stand-ins
 * until the photograph the picked veil wants lands (the manifest's Handoff).
 */
export type PhotoId = "toast" | "crowd";

export const PHOTO: Control = {
  id: "photo",
  label: "Under the veil",
  options: [
    { id: "toast", label: "A toast" },
    { id: "crowd", label: "Round three's crowd" },
  ],
  default: "toast",
};

/** Each knob value's still, by its media-manifest id. */
export const PHOTO_ID: Record<PhotoId, string> = {
  toast: "wedding-toast",
  crowd: "festival-crowd",
};

export const photoFrom = (v: unknown): PhotoId =>
  v === "crowd" ? "crowd" : "toast";

import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S KNOBS, AS PURE DATA: split from the client files so `spec.ts`
 * can declare them without importing React into a module `registry.ts` hands
 * to a server page (`registry.test.ts`'s own rule).
 *
 * ★ 375 FIRST. A disposable is shot standing up at a party, so every guest
 * frame is a phone and only a phone. The host's two surfaces (her hub and
 * Create) are used at a desk as often as in a hand, so the decisions about
 * them carry the Screen knob and draw both. The room's screen is its own
 * size: a 16:9 wall.
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

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
  /** The room's screen: a 16:9 television or a projector, at 1440 wide. */
  wall: { w: 1440, h: 810, name: "the room's screen" },
} as const;

export type ScreenId = keyof typeof SCREENS;

export const screenOf = (v: unknown): "375" | "1440" =>
  v === "1440" ? "1440" : "375";

/**
 * THE ROLL'S LOOK, the host's pick (round one's `look=stocks`, settled as
 * never baked): every frame that shows a photograph wears it, so each camera
 * and each room can be read in each of the three. Warm is the default
 * because it is the disposable's own cast.
 */
export const STOCK: Control = {
  id: "stock",
  label: "The roll's look",
  options: [
    { id: "warm", label: "Warm" },
    { id: "cool", label: "Cool" },
    { id: "mono", label: "B&W" },
  ],
  default: "warm",
};

export type StockId = "warm" | "cool" | "mono";

export const stockOf = (v: unknown): StockId =>
  v === "cool" ? "cool" : v === "mono" ? "mono" : "warm";

/**
 * REVIEW, on the host's peek: with review on a shot develops once she
 * approves it (settled), so each way of hiding the roll has to say what the
 * queue shows. Off is a new event's default.
 */
export const REVIEW: Control = {
  id: "review",
  label: "Review uploads",
  options: [
    { id: "off", label: "Review off" },
    { id: "on", label: "Review on" },
  ],
  default: "off",
};

export const reviewOf = (v: unknown): boolean => v === "on";

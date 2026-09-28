import type { Control } from "@/components/lab/board-spec";

/**
 * THE ONE SCREEN KNOB, AS PURE DATA: split from `scene.tsx` (a client file) so
 * `spec.ts` can declare it without importing React into a module `registry.ts`
 * hands to a server page (`registry.test.ts`'s own rule).
 *
 * ★ EVERY FRAME IS A REAL VIEWPORT AT ITS OWN WIDTH (`reel-story`'s lesson,
 * carried here whole because that board retired with `demo-doors`): the hero's
 * `lg:` pair, its `vw` type and its 50cqw band all answer the width they lay
 * out in, and only a same-origin iframe claims a width of its own. 1440 first,
 * because the home is read at a desk first. The heights are each device's own
 * screen, because the hero is exactly one screen tall (`cinema-hero.css`'s
 * 100svh).
 *
 * ★ 900 IS A TABLET HELD UPRIGHT, 900 BY 1200 (round 2, when `loose-ends`'
 * `hero-tablet` moved here). Every tablet held upright falls between 768 and
 * 1023, where the hero wears the phone's geometry, and 3:4 is the iPad's own
 * shape: the height is what shows that geometry's real cost there, its block
 * ending with a third of the screen still under it.
 */
export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "900", label: "900, a tablet" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop" },
  "900": { w: 900, h: 1200, name: "a tablet held upright" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;

export type ScreenId = keyof typeof SCREENS;

export const screenOf = (v: string | undefined): ScreenId =>
  v === "375" ? "375" : v === "900" ? "900" : "1440";

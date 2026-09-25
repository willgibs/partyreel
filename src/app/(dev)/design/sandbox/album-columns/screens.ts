import type { Control } from "@/components/lab/board-spec";

/**
 * THE ONE SCREEN KNOB, AS PURE DATA: split from `canvas.tsx` (a client file)
 * so `spec.ts` can declare it as a config without importing React into a
 * module `registry.ts` hands to a server page (`registry.test.ts`'s own rule).
 *
 * ★ 1440 FIRST. The desk is where the steps run widest (three to eight a row)
 * and where a feature row is most unlike a plain one, so every option is read
 * there first; the phone is one press away, and 768 is the tablet his
 * `phone=step-three` note was about ("would benefit tablet breakpoints"),
 * where the rows run about three a row.
 */
export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "768", label: "768, a tablet" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop" },
  "768": { w: 768, h: 1024, name: "a tablet" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "375" || v === "768" ? v : "1440";

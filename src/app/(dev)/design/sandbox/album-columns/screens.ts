import type { Control } from "@/components/lab/board-spec";

/**
 * THE WIDTH KNOBS, AS PURE DATA — split from `canvas.tsx` (a client file) so
 * `spec.ts` can declare them as `configs` without importing React into a
 * module `registry.ts` hands to a server page (`registry.test.ts`'s own
 * rule). Board previews and the spec both import from here.
 */

/**
 * `scale`'s own knob: the four widths where a growing floor or a hard ceiling
 * each show something different from today's unlimited 220px floor.
 *
 * ★ DEFAULTS PAST WHERE IT SHOWS. All three options agree exactly at 1440 and
 * 1920 (nothing has climbed past 8 columns yet, by design: the ceiling and the
 * growth both start there), so a step that opened on either would show three
 * identical pictures. 2560 is the first width any of them differ, so it is
 * the one this board opens on; 1920 stays on the knob as the honest "nothing
 * has happened yet" reading.
 */
export const BIG_SCREEN: Control = {
  id: "big-screen",
  label: "Scale's screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "1920", label: "1920, a big monitor" },
    { id: "2560", label: "2560, a wide monitor" },
    { id: "3440", label: "3440, ultrawide" },
  ],
  default: "2560",
};
export type BigScreen = "1440" | "1920" | "2560" | "3440";
export const bigScreenOf = (v: string | undefined): BigScreen =>
  v === "1440" || v === "2560" || v === "3440" ? v : "1920";
export const BIG_SCREEN_W: Record<BigScreen, number> = {
  "1440": 1440,
  "1920": 1920,
  "2560": 2560,
  "3440": 3440,
};

/** `width`'s own knob: where a phone's bleed and a big screen's cap each
 *  show, which `big-screen` does not cover (it starts at 1440). */
export const EDGE_SCREEN: Control = {
  id: "edge-screen",
  label: "Width's screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
    { id: "2560", label: "2560, a wide monitor" },
  ],
  default: "2560",
};
export type EdgeScreen = "375" | "1440" | "2560";
export const edgeScreenOf = (v: string | undefined): EdgeScreen =>
  v === "375" || v === "1440" ? v : "2560";
export const EDGE_SCREEN_W: Record<EdgeScreen, number> = {
  "375": 375,
  "1440": 1440,
  "2560": 2560,
};

/** `phone`'s own knob: three real device widths either side of where a third
 *  column would first earn its keep. */
export const PHONE_SCREEN: Control = {
  id: "phone-screen",
  label: "Phone width",
  options: [
    { id: "375", label: "375, a compact phone" },
    { id: "430", label: "430, a large phone" },
    { id: "600", label: "600, a small tablet, portrait" },
  ],
  default: "600",
};
export type PhoneScreen = "375" | "430" | "600";
export const phoneScreenOf = (v: string | undefined): PhoneScreen =>
  v === "375" || v === "430" ? v : "600";
export const PHONE_SCREEN_W: Record<PhoneScreen, number> = {
  "375": 375,
  "430": 430,
  "600": 600,
};

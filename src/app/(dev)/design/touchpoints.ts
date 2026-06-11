/**
 * Round 3, part 2: component options at the major UX touchpoints. Each
 * touchpoint page shows 2-3 labeled variants of ONE moment on the locked mono
 * system, set in Instrument Serif (the working type favorite, calibrated).
 * Will picks per-touchpoint; winners become the Phase 2 component specs.
 */
export type TouchpointId =
  | "entry"
  | "upload"
  | "gallery"
  | "header"
  | "buttons";

export type Touchpoint = {
  id: TouchpointId;
  title: string;
  note: string;
};

export const TOUCHPOINTS: Touchpoint[] = [
  {
    id: "entry",
    title: "Guest entry",
    note: "How the welcome moment is staged on a guest's phone",
  },
  {
    id: "upload",
    title: "Upload moment",
    note: "Where adding photos lives and how progress feels",
  },
  {
    id: "gallery",
    title: "Gallery grid",
    note: "How the media field itself is laid out",
  },
  {
    id: "header",
    title: "Event header",
    note: "The event's identity block above the gallery",
  },
  {
    id: "buttons",
    title: "Buttons & shape",
    note: "The pressable language: shape, weight, sizes",
  },
];

export function getTouchpoint(id: string): Touchpoint | undefined {
  return TOUCHPOINTS.find((t) => t.id === id);
}

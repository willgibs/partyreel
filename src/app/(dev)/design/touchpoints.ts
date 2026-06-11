/**
 * THE SELECTION SYSTEM of the design lab. Each touchpoint page shows 2-3
 * labeled variants of ONE UX moment on the locked system (monochrome, base
 * Instrument Serif). The protocol between Will and the agent:
 *
 *   1. The agent stages variants; Will reviews live (both modes, on phone).
 *   2. Will picks a number per touchpoint (+ remix notes); mixing across
 *      touchpoints is the point.
 *   3. The pick is recorded HERE as `decision` (+ `decisionNote`), the page
 *      renders the Selected badge, and the variant becomes the Phase 2+ spec.
 *
 * Decisions are config, not memory: this file is the single source for what
 * has been chosen and what is still open.
 */
export type TouchpointId =
  | "entry"
  | "upload"
  | "gallery"
  | "header"
  | "buttons"
  | "lightbox"
  | "event-card"
  | "forms"
  | "states"
  | "qr-card";

export type Touchpoint = {
  id: TouchpointId;
  title: string;
  note: string;
  /** Variant names by number (index 0 = V1) - the picks board's context. */
  variants: string[];
  /** Will's RATIFIED pick (variant number), committed by the agent once
   *  passed. Unset = still open for review. */
  decision?: number;
  /** Remix notes attached to the pick. */
  decisionNote?: string;
};

export const TOUCHPOINTS: Touchpoint[] = [
  {
    id: "entry",
    title: "Guest entry",
    note: "How the welcome moment is staged on a guest's phone",
    variants: ["Centered card", "Bottom sheet", "Full-screen welcome"],
  },
  {
    id: "upload",
    title: "Upload moment",
    note: "Where adding photos lives and how progress feels",
    variants: ["Dropzone card", "Floating action bar", "Add tile in the grid"],
  },
  {
    id: "gallery",
    title: "Gallery grid",
    note: "How the media field itself is laid out",
    variants: ["Uniform grid", "Masonry columns", "Edge-to-edge"],
  },
  {
    id: "header",
    title: "Event header",
    note: "The event's identity block above the gallery",
    variants: ["Left editorial", "Centered formal", "Cover hero"],
  },
  {
    id: "buttons",
    title: "Buttons & shape",
    note: "The pressable language: shape, weight, sizes",
    variants: ["Soft rectangle", "Pill", "Sharp"],
  },
  {
    id: "lightbox",
    title: "Lightbox chrome",
    note: "Controls and attribution around a full-screen photo",
    variants: ["Pinned chrome", "Floating pill", "Immersive auto-hide"],
  },
  {
    id: "event-card",
    title: "Host event card",
    note: "The dashboard's atomic unit: one event at a glance",
    variants: ["Cover-led", "Compact row", "Stat-forward overlay"],
  },
  {
    id: "forms",
    title: "Forms & inputs",
    note: "The settings language: fields, toggles, sections",
    variants: ["Card sections", "Inline rows", "Focused column"],
  },
  {
    id: "states",
    title: "Empty & loading",
    note: "What nothing looks like, and what almost-something looks like",
    variants: ["Typographic", "Iconographic", "Photographic promise"],
  },
  {
    id: "qr-card",
    title: "QR table card",
    note: "The printed growth artifact guests actually scan",
    variants: ["Minimal ink", "Invitation frame", "Photo-backed"],
  },
];

export function getTouchpoint(id: string): Touchpoint | undefined {
  return TOUCHPOINTS.find((t) => t.id === id);
}

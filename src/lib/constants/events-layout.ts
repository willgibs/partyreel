// Presentation map for the /events landing pages — keeps `events.ts` pure content while
// each /events/[slug] page renders a DISTINCT hero frame AND a DISTINCT "Built for X"
// layout per type (the polish-arc "no two pages alike" bar). The /events hub reuses the
// same `frame` to preview each type. A Vitest guard asserts every EVENT_TYPES slug has an
// entry here, so a type can never render unstyled.
//
// Unlike features-layout's discriminated union (each /features group is a structurally
// different SECTION), every event type fills the SAME two slots — just different fills — so
// a flat record is the honest shape. Union-typed literals so a typo can't compile.

export type EventFrame = "album" | "phone" | "qr" | "reel";
export type BuiltForLayout = "bento" | "rows" | "grid2x2" | "list";

export type EventPresentation = {
  /** Hero frame, reused as the /events hub card preview. */
  frame: EventFrame;
  /** Layout variant for the "Built for X" benefits section. */
  builtFor: BuiltForLayout;
};

export const EVENT_PRESENTATION: Record<string, EventPresentation> = {
  weddings: { frame: "album", builtFor: "bento" },
  parties: { frame: "phone", builtFor: "rows" },
  conferences: { frame: "qr", builtFor: "grid2x2" },
  trips: { frame: "reel", builtFor: "list" },
};

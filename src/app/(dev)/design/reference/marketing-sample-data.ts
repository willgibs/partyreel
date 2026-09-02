// Sample props for the marketing library page (/design/marketing): manifest
// image ids and neutral sample copy. Nothing here is a claim about the product;
// the specimens exist to show the components, and the numbers read as samples.
export const LIBRARY_CARD_IDS = [
  "wedding-golden",
  "party-dj",
  "festival-lights",
] as const;

export const LIBRARY_CONVEYOR_IDS = [
  "reception-table",
  "concert-confetti",
  "wedding-rings",
  "reception-hall",
  "festival-crowd",
  "wedding-toast",
] as const;

export const LIBRARY_SELECT_TILES = [
  { id: "wedding-rings", selected: true },
  { id: "reception-hall", selected: false },
  { id: "festival-lights", selected: true },
  { id: "wedding-arch", selected: true },
] as const;

/** A real post slug, so the cover morph specimen navigates somewhere true. */
export const LIBRARY_MORPH_SLUG = "best-way-to-share-event-photos";

export const LIBRARY_STATS = [
  { value: 12, label: "sample guests" },
  { value: 340, label: "sample photos" },
  { value: 9, label: "sample videos" },
];

export const LIBRARY_REEL_ID = "hero-candidate-02";

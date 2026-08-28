/**
 * The canonical one-paragraph product summary + fact sheet. ONE home: the /press
 * page renders these, and the /llms.txt builder feeds them to AI crawlers, so the
 * quotable version of "what is Partyreel" can never fork. Copy PROVISIONAL (the
 * press-kit ruling pass); covered by the content-policy claims fence.
 */

export const PRESS_BOILERPLATE =
  "Partyreel turns every guest's phone into the event's camera. Hosts share one QR code; guests scan and upload photos and videos with no app and no account; everything lands in one live album at full quality. Hosts curate, everyone leaves with the originals, and the event can end as a one-minute highlight reel.";

export const PRESS_FACTS: { label: string; value: string }[] = [
  { label: "What", value: "Guest-powered event albums" },
  { label: "How", value: "One QR code in, one album out" },
  { label: "Guests need", value: "A phone and a browser. No app, no account." },
  { label: "Pricing", value: "Free to start; plans sized by storage" },
  { label: "Launched", value: "2026" },
];

/** The year for Organization.foundingDate (mirrors the fact sheet). */
export const FOUNDED_YEAR = "2026";

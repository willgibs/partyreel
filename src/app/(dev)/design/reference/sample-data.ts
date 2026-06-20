// Shared SAMPLE PROPS for the live Compositions reference. The real product
// components render from these (no DB, no R2), so the page + its island stay DRY
// and consistent. Cover images are the /design sample pack.
export const SAMPLE = {
  eventName: "Maya & Jay's Wedding",
  dateLabel: "June 14",
  cover: "/design/p05.jpg",
  cover2: "/design/p07.jpg",
  cover3: "/design/p02.jpg",
  qrToken: "demo-token",
  qrStyle: "classic",
  siteUrl: "https://partyreel.com",
  joinUrl: "https://partyreel.com/e/demo-token",
} as const;

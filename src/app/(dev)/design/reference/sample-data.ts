import type { GridMedia } from "@/components/app/media-grid";
import type { BinMedia } from "@/components/app/recently-deleted-grid";

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

// Sample media for the host moderation grid (S3·3a). Varied natural ratios so the
// masonry + clamp + the per-tile control bar / badges are visible across shapes;
// the four statuses exercise the status-aware controls (approve / hide / unhide /
// remove). The actions are wired to a sample id, so they error-toast if clicked —
// this is a VISUAL reference (browse the layout, not run moderation).
export const SAMPLE_MEDIA: GridMedia[] = [
  { id: "sm-1", type: "photo", url: "/design/p01.jpg", downloadUrl: "/design/p01.jpg", status: "approved", width: 1200, height: 1600, likeCount: 12 },
  { id: "sm-2", type: "photo", url: "/design/p03.jpg", downloadUrl: "/design/p03.jpg", status: "pending", width: 1920, height: 1080 },
  { id: "sm-3", type: "photo", url: "/design/p06.jpg", downloadUrl: "/design/p06.jpg", status: "hidden", width: 1600, height: 1200 },
  { id: "sm-4", type: "photo", url: "/design/p11.jpg", downloadUrl: "/design/p11.jpg", status: "approved", width: 1000, height: 1000, likeCount: 1 },
  { id: "sm-5", type: "photo", url: "/design/p08.jpg", downloadUrl: "/design/p08.jpg", status: "approved", width: 1080, height: 1920 },
  { id: "sm-6", type: "photo", url: "/design/p04.jpg", downloadUrl: "/design/p04.jpg", status: "pending", width: 1500, height: 1000 },
];

// Sample bin items (S3·3a): GridMedia + countdownDays for the countdown pill.
export const SAMPLE_BIN: BinMedia[] = [
  { id: "sb-1", type: "photo", url: "/design/p05.jpg", width: 1600, height: 1066, countdownDays: 29 },
  { id: "sb-2", type: "photo", url: "/design/p10.jpg", width: 1000, height: 1500, countdownDays: 12 },
  { id: "sb-3", type: "photo", url: "/design/p09.jpg", width: 1920, height: 1280, countdownDays: 3 },
];

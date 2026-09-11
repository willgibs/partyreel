import type { GridMedia } from "@/components/app/media-grid";
import type { BinMedia } from "@/components/app/recently-deleted-grid";
import { marketingImage } from "@/lib/constants/marketing-media";

// Shared SAMPLE PROPS for the live Compositions reference. The real product
// components render from these (no DB, no R2), so the page + its island stay DRY
// and consistent. Images come from the marketing manifest (the one image
// registry; the lab's own sample pack was retired in the library round).
const img = (id: string) => marketingImage(id).src;

export const SAMPLE = {
  eventName: "Maya & Jay's Wedding",
  dateLabel: "June 14",
  cover: img("wedding-golden"),
  cover2: img("party-dj"),
  cover3: img("reception-table"),
  qrToken: "demo-token",
  qrStyle: "classic",
  siteUrl: "https://partyreel.com",
  joinUrl: "https://partyreel.com/e/demo-token",
} as const;

// Sample media for the host moderation grid (S3·3a). The DECLARED ratios vary
// (the manifest images are mostly landscape and get cropped to them) so the
// masonry + clamp + the per-tile control bar / badges are visible across shapes;
// the four statuses exercise the status-aware controls (approve / hide / unhide /
// remove). The actions are wired to a sample id, so they error-toast if clicked —
// this is a VISUAL reference (browse the layout, not run moderation).
export const SAMPLE_MEDIA: GridMedia[] = [
  {
    id: "sm-1",
    type: "photo",
    url: img("wedding-golden"),
    downloadUrl: img("wedding-golden"),
    status: "approved",
    width: 1200,
    height: 1600,
    likeCount: 12,
  },
  {
    id: "sm-2",
    type: "photo",
    url: img("concert-confetti"),
    downloadUrl: img("concert-confetti"),
    status: "pending",
    width: 1920,
    height: 1080,
  },
  {
    id: "sm-3",
    type: "photo",
    url: img("reception-hall"),
    downloadUrl: img("reception-hall"),
    status: "hidden",
    width: 1600,
    height: 1200,
  },
  {
    id: "sm-4",
    type: "photo",
    url: img("wedding-arch"),
    downloadUrl: img("wedding-arch"),
    status: "approved",
    width: 1000,
    height: 1000,
    likeCount: 1,
  },
  {
    id: "sm-5",
    type: "photo",
    url: img("party-dj"),
    downloadUrl: img("party-dj"),
    status: "approved",
    width: 1080,
    height: 1920,
  },
  {
    id: "sm-6",
    type: "photo",
    url: img("festival-crowd"),
    downloadUrl: img("festival-crowd"),
    status: "pending",
    width: 1500,
    height: 1000,
  },
];

// Sample bin items (S3·3a): GridMedia + countdownDays for the countdown pill.
export const SAMPLE_BIN: BinMedia[] = [
  {
    id: "sb-1",
    type: "photo",
    url: img("wedding-toast"),
    width: 1600,
    height: 1066,
    countdownDays: 29,
  },
  {
    id: "sb-2",
    type: "photo",
    url: img("festival-lights"),
    width: 1000,
    height: 1500,
    countdownDays: 12,
  },
  {
    id: "sb-3",
    type: "photo",
    url: img("party-balloons"),
    width: 1920,
    height: 1280,
    countdownDays: 3,
  },
];

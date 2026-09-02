import type { FaqItem } from "@/components/marketing/faq-data";
import { planById } from "@/lib/constants/tiers";
import { OVER_CAP_GRACE_DAYS } from "@/lib/lifecycle/over-capacity";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

import { PHOTO_FORMATS_PROSE, VIDEO_FORMATS_PROSE } from "./quality-section";

/**
 * The album page's questions: the long tail a first-time host actually asks
 * (compiled from a fresh reader's list, 2026-09-02), each answered in two
 * sentences with every number derived. Rendered by FeatureFaq and mirrored
 * into FAQPage JSON-LD, so the answers must match what the page says.
 */
const FREE_CAP = formatBytes(planById("free").storageBytes);

export const ALBUM_FAQ: FaqItem[] = [
  {
    q: "Is the album the same link as the QR code?",
    a: "Yes. Every event has one link; the QR code is that link as a pattern, and it never changes. Pro and Event Pass hosts can add a named link like partyreel.com/e/sarahs-wedding, and the original keeps working.",
  },
  {
    q: "Do I need an account to host?",
    a: "Yes, a free one, with an email or Google. Your guests never need one unless you turn on Require accounts, in which case they confirm an email with a one-time code.",
  },
  {
    q: "Can a guest add their name without an account?",
    a: "No. Names come from a free account, picked once and carried to every event. Without one, uploads show as Anonymous, and a guest who signs in later on the same phone claims what they added.",
  },
  {
    q: "Do uploads go public before I see them?",
    a: "Only in Live mode, where you can hide anything with a tap. Turn on Review and every upload waits for your approval; the guest sees “Sent, waiting for host approval” and nothing appears until you say so.",
  },
  {
    q: "What can guests upload?",
    a: `Photos as ${PHOTO_FORMATS_PROSE} on every plan, and video as ${VIDEO_FORMATS_PROSE} on Pro and Event Pass. Each file can be up to ${formatBytes(MAX_UPLOAD_BYTES)}, with no compression and no duration cap.`,
  },
  {
    q: "What happens when the album is full?",
    a: "New uploads pause and the guest sees “This album is full right now. The host needs to free up space.” Nothing already in the album changes; delete something or upgrade and uploads resume.",
  },
  {
    q: "What if a guest picks a video on a free event?",
    a: "Free events collect photos only, so the guest sees “This event accepts photos only.” and the rest of their batch still lands. Video uploads come with Pro and Event Pass.",
  },
  {
    q: "Do I keep paying to keep the album?",
    a: `No. Events have no end date, and ending a Pro plan leaves everything in place; if you are then over the ${FREE_CAP} Free cap, you get ${OVER_CAP_GRACE_DAYS} days to trim before the largest files move to Trash for ${RECENTLY_DELETED_WINDOW_DAYS} days.`,
  },
  {
    q: "Can I put the album on a big screen?",
    a: "Yes. Open the link in any browser on a laptop or a TV and leave it up; the album updates live as guests add to it, with no refresh.",
  },
];

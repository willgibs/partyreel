import type { FaqItem } from "@/components/marketing/faq-data";
import { planById } from "@/lib/constants/tiers";
import { OVER_CAP_GRACE_DAYS } from "@/lib/lifecycle/over-cap";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

/**
 * The album page's questions, verdict first: a few words and a period, then
 * one sentence, so the nine answers wrap alike and a skimmer gets the answer
 * from the first word. The first three are what a visitor landing here first
 * asks. Numbers derive. (The length band was held by a test until the "less
 * is more" reset, 2026-09-12; copy is not a test.) Rendered by FeatureFaq and
 * mirrored into FAQPage JSON-LD.
 */
const FREE_CAP = formatBytes(planById("free").storageBytes);

export const ALBUM_FAQ: FaqItem[] = [
  {
    q: "Is the album the same link as the QR code?",
    a: "Yes. One link per event, the code is that link, and it never changes; Pro and Event Pass can add a named one.",
  },
  {
    q: "Do I need an account to host?",
    a: "Yes. A free one, with an email or Google. Guests need nothing unless you require verified emails.",
  },
  {
    q: "Do uploads go public before I see them?",
    a: "Only in Live mode. Turn on Review and every upload waits for your approval before anyone sees it.",
  },
  {
    q: "Can a guest add a name without verifying their email?",
    a: "Yes, if you allow it. They type a display name at the door and their photos carry a small unverified mark until they confirm it.",
  },
  {
    q: "Can a guest delete their own upload?",
    a: "Yes. From their dashboard, and it leaves the album at once. As host you can remove anything.",
  },
  {
    q: "What happens when the album is full?",
    a: "New uploads pause. Nothing already in the album changes; delete something or upgrade and uploads resume.",
  },
  {
    q: "What can guests upload?",
    a: `Photos on every plan. Video on Pro and Event Pass, up to ${formatBytes(MAX_UPLOAD_BYTES)} a file, no compression, no duration cap.`,
  },
  {
    q: "Do I keep paying to keep the album?",
    a: `No. Events have no end date. Leave Pro and everything stays; over the ${FREE_CAP} Free cap you get ${OVER_CAP_GRACE_DAYS} days to trim.`,
  },
  {
    q: "Can I put the album on a big screen?",
    a: "Yes. Open the link in any browser on a laptop or TV and leave it up; it updates live, no refresh.",
  },
];

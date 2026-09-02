import type { FaqItem } from "@/components/marketing/faq-data";
import {
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  MAX_REEL_SECONDS,
  planById,
} from "@/lib/constants/tiers";
import { OVER_CAP_GRACE_DAYS } from "@/lib/lifecycle/over-cap";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

/**
 * Pricing-page FAQ — one source for the visible accordion AND the FAQPage
 * JSON-LD (the faq-data.ts contract: structured data must match what users
 * see). Numbers derive from tiers.ts / limits.ts; every answer states shipped
 * behavior only (the truth-ruling ledger), including the ADR-0025 economics
 * that this round made real: stacking and the prorated Pro credit.
 */

const free = planById("free");
const pass = planById("event_pass");
const uploadSize = formatBytes(MAX_UPLOAD_BYTES);

export const PRICING_FAQ_ITEMS: FaqItem[] = [
  {
    q: "Can I run one big event without a subscription?",
    a: `Yes, that is exactly what the Event Pass is: ${pass.priceLabel.replace(" one-time", "")} once for ${formatBytes(pass.storageBytes)}, video, the ${MAX_REEL_SECONDS.event_pass}-second reel and every paid control, covering its event for about a year. Keep it live longer for ${EVENT_PASS_RENEWAL_PRICE_LABEL} a year.`,
  },
  {
    q: "What happens when I move from an Event Pass to Pro?",
    a: "Your pass converts, prorated to the day. The unused part of what you paid becomes account credit that pays down your next Pro invoices automatically. Nothing gets banked and nothing gets lost.",
  },
  {
    q: "Can I buy more than one Event Pass?",
    a: `Yes. Passes stack: each one adds another event slot and another ${formatBytes(pass.storageBytes)} for its own year, on the same account.`,
  },
  {
    q: "What happens if I hit my storage limit?",
    a: "Uploads pause until there is room; nothing you already collected is touched. Delete what you don't want (space frees immediately) or move up a size.",
  },
  {
    q: "Do my events expire?",
    a: `On Free and Pro, never: an album stays until you delete it, and deletions wait 30 days in the trash first. A Free event untouched for about six months gets a 14-day warning email before it is cleaned up. An Event Pass covers its event for about a year and renews for ${EVENT_PASS_RENEWAL_PRICE_LABEL}.`,
  },
  {
    q: "Do my guests ever pay or need an account?",
    a: "Guests never pay and never install anything. They scan, add their name, and by default confirm their email with a one-tap code so every upload has a real person behind it.",
  },
  {
    q: "Can I cancel Pro anytime?",
    a: `Yes, from the billing portal on your dashboard. Your media stays put. If you are over the ${formatBytes(free.storageBytes)} Free cap after cancelling, you get a ${OVER_CAP_GRACE_DAYS}-day window to free up space or re-upgrade before anything moves toward the trash.`,
  },
  {
    q: "How big can uploads be?",
    a: `Up to ${uploadSize} per file, photos and videos alike, on every plan. There is no per-guest fee and no guest limit.`,
  },
];

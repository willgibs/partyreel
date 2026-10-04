import type { FaqItem } from "@/components/marketing/faq-data";
import {
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  planById,
} from "@/lib/constants/tiers";
import { OVER_CAP_GRACE_DAYS } from "@/lib/lifecycle/over-cap";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import { formatBytes } from "@/lib/utils";

import { passHoldsLine } from "@/components/app/pricing/holds";

/**
 * Pricing-page FAQ — one source for the visible accordion AND the FAQPage
 * JSON-LD (the faq-data.ts contract: structured data must match what users
 * see). Numbers derive from tiers.ts / limits.ts; every answer states shipped
 * behavior only (the truth-ruling ledger), including the billing-caps.md economics
 * that this round made real: stacking and the prorated Pro credit.
 *
 * ★ SIX, NOT EIGHT (`close=eight`, Will 2026-09-20: "We can reduce the count
 * row (5-6 total?), but I think the folded accordion does a good job of
 * presenting more information in less space"). The accordion and its shape are
 * ruled; the LIST is what shrank, and it shrank by what this page is for. The
 * six that stay all settle money or lifecycle: the pass instead of a
 * subscription, a pass converting to Pro, stacking, the cap, what expires,
 * cancelling.
 *
 * The two that left, and where they went, because a trim MOVES an answer and
 * never loses one:
 *   · "Do my guests ever pay or need an account?" -> the page's own subhead
 *     carries "No per-guest fees", and /help/how-guests-join-and-upload with
 *     /help/require-verified-emails-explained answer the account half.
 *   · "How big can uploads be?" -> the unlock tiles print the per-file size on
 *     this page already, and /help/what-you-can-upload is its article.
 * Both still reach machines through /llms-full.txt, which inlines the site FAQ
 * (FAQ_ITEMS, where both questions also live) beside this list.
 */

const free = planById("free");
const pass = planById("event_pass");

export const PRICING_FAQ_ITEMS: FaqItem[] = [
  {
    q: "Can I run one big event without a subscription?",
    // What a pass adds over Free since the free/pro shift: the password, the custom link and
    // full-length clips are on every plan, so "every paid control" would oversell it.
    // Ladder A: the pass says "one payment, no subscription" first, and its room as a wedding before GB.
    a: `Yes, that is exactly what the Event Pass is: one payment, no subscription. ${pass.priceLabel.replace(" one-time", "")} once for ${formatBytes(pass.storageBytes)} (${passHoldsLine(pass.storageBytes).toLowerCase()}), video, and clips with no watermark, covering its event for about a year. Keep it live longer for ${EVENT_PASS_RENEWAL_PRICE_LABEL} a year.`,
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
    // ★ Deleted counts in storage (trash-in-storage): a delete frees nothing until the item leaves Deleted, so the
    // answer names the two ways room comes back and the setting that makes it by itself.
    q: "What happens if I hit my storage limit?",
    a: `Uploads pause until there is room, and nothing you already collected is touched. What you delete waits ${RECENTLY_DELETED_WINDOW_DAYS} days in Deleted and still counts in your storage until it leaves, so empty Deleted or delete for good to free room now, or leave Make room from Deleted on and the oldest of it makes room for new uploads by itself. Or move up a size.`,
  },
  {
    q: "Do my events expire?",
    a: `Never by date: an album stays until you delete it, and deletions wait 30 days in Deleted. The one exception is a Free event untouched for about six months, which gets a 14-day warning email before it's removed; any activity resets the clock. An Event Pass covers its event for about a year and renews for ${EVENT_PASS_RENEWAL_PRICE_LABEL}.`,
  },
  {
    q: "Can I cancel Pro anytime?",
    a: `Yes, from the billing portal on your dashboard. Your media stays put. If you are over the ${formatBytes(free.storageBytes)} Free cap after cancelling, you get a ${OVER_CAP_GRACE_DAYS}-day window to free up space or re-upgrade before anything moves toward Deleted.`,
  },
];

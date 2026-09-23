import type { FaqItem } from "@/components/marketing/faq-data";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

/**
 * The curation page's FAQ set: rendered by the shared FeatureFaq band (which
 * also emits the FAQPage JSON-LD), so the answers must match what users see.
 */
export const CURATION_FAQ: FaqItem[] = [
  {
    q: "Do guests see hidden or removed photos?",
    a: "Never. Hiding takes a photo off the guest album instantly, and removing deletes it. Hidden items stay dimmed in your own view, so only you see them.",
  },
  {
    q: "Can I approve uploads before anyone sees them?",
    a: "Yes. Turn on review in your event settings and every upload waits for your approval first. Clear the queue with Approve all, or Select the exceptions and handle them together.",
  },
  {
    q: "What if I delete something by mistake?",
    a: `Removed photos and videos wait in Deleted for ${RECENTLY_DELETED_WINDOW_DAYS} days. Restore one and it comes back exactly as it was; after ${RECENTLY_DELETED_WINDOW_DAYS} days it is permanently deleted.`,
  },
];

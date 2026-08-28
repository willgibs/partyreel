import type { FaqItem } from "@/components/marketing/faq-data";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

// The privacy page's FAQ set: rendered by the shared FaqAccordion AND mirrored
// into FAQPage JSON-LD (jsonld.tsx), so the answers must match what users see.
// Answers stay inside the verified trust facts; nothing here promises beyond
// what the product ships.
export const PRIVACY_FAQ: FaqItem[] = [
  {
    q: "Who can see my album?",
    a: "The people you let in. Every event has three visibility levels: Public (anyone with your link), Password (the link plus a password you set), or Private (only you). A locked event shows a visitor nothing but the event name and a photo count.",
  },
  {
    q: "Are share links public on the internet?",
    a: "No. Share links are kept out of search engines, so an album is not something a stranger can find by searching. Public means visible to people with your link, not listed on the open web.",
  },
  {
    q: "What happens when I delete something?",
    a: `It moves to a recovery bin for ${RECENTLY_DELETED_WINDOW_DAYS} days, where you can restore it exactly as it was. After that it is permanently deleted.`,
  },
  {
    q: "What happens when something gets reported?",
    a: "Anyone viewing an album can flag a photo or video, and every report is reviewed before anything comes down. Hosts can remove anything from their own album instantly, any time.",
  },
];

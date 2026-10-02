import type { FaqItem } from "@/components/marketing/faq-data";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

// The privacy page's FAQ set: rendered by the shared FaqAccordion AND mirrored
// into FAQPage JSON-LD (jsonld.tsx), so the answers must match what users see.
// Answers stay inside the verified trust facts; nothing here promises beyond
// what the product ships.
export const PRIVACY_FAQ: FaqItem[] = [
  {
    q: "Who can see my album?",
    a: "The people you let in. An album is Public (anyone with your link), Private (a gate you pick comes first: a password you set, your yes at the door, your invite list, or only the people already in), or Only me (just you). A gate shows a newcomer at most the album's name and a photo count.",
  },
  {
    q: "Are share links public on the internet?",
    a: "No. Share links are kept out of search engines, so an album is not something a stranger can find by searching. Public means visible to people with your link, not listed on the open web.",
  },
  {
    q: "What happens when I delete something?",
    a: `It moves to Deleted for ${RECENTLY_DELETED_WINDOW_DAYS} days, where you can restore it exactly as it was. After that it is permanently deleted.`,
  },
  {
    q: "What happens when something gets reported?",
    // ★ The instant hide's one exception, said as the help article says it (crumbs-41): "reviewed before anything
    // comes down" stopped being true when a child-abuse report from a confirmed email began hiding its item at once.
    a: "Anyone viewing an album can flag a photo or video, and every report is reviewed. Review comes before removal, with one exception: a report of child abuse from a confirmed email hides the photo or video at once, until it's reviewed. Hosts can remove anything from their own album instantly, any time.",
  },
];

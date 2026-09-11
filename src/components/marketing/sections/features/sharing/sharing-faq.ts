import type { FaqItem } from "@/components/marketing/faq-data";

/**
 * The sharing page's FAQ set: rendered by the shared FeatureFaq band (which
 * also emits the FAQPage JSON-LD), so the answers must match what users see.
 */
export const SHARING_FAQ: FaqItem[] = [
  {
    q: "Can guests download everything?",
    a: "Yes, anyone with access to the album can. Download all packages the originals into one zip, filtered to everything, photos only, or videos only.",
  },
  {
    q: "Is quality lost on download?",
    a: "No. You get the exact file that was uploaded: same resolution, no re-compression, and no watermarks on photos on any plan.",
  },
  {
    q: "Can I export just my selection?",
    a: "Hosts can. Select photos in the gallery and choose Download selected, or fold hidden items into a full album export.",
  },
];

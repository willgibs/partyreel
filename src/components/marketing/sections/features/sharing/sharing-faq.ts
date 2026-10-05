import type { FaqItem } from "@/components/marketing/faq-data";

/**
 * The sharing page's FAQ set: rendered by the shared FeatureFaq band (which
 * also emits the FAQPage JSON-LD), so the answers must match what users see.
 */
export const SHARING_FAQ: FaqItem[] = [
  {
    q: "Can guests download everything?",
    a: "Yes, anyone with access to the album can. They tap Select, then All, then Save. On a phone that is Save to Photos at phone size or Save to Files, the originals in one zip; at a computer, Save is the zip.",
  },
  {
    q: "Is quality lost on download?",
    a: "Not unless you choose it. The originals are the exact files that were uploaded: same resolution, no re-compression, and no watermarks on photos on any plan. Phone size, a lighter copy for posting, is offered by name beside them.",
  },
  {
    q: "Can I export just my selection?",
    a: "Yes. Select the photos you want and take just those: a host's Download in the selection bar gives a zip of them, hidden ones included, and a guest's Save offers Photos or Files. A host can also fold hidden items into a full album download.",
  },
];

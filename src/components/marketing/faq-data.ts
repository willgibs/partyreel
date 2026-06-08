import { planById } from "@/lib/constants/tiers";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

// Single source for the FAQ — both the visible accordion (faq.tsx) and the
// FAQPage JSON-LD (faq-jsonld.tsx) read this, so the structured data always
// matches what users see (a Google requirement for FAQ rich results). Numbers
// come from the limits/tiers single sources so the copy can't drift.
const uploadSize = formatBytes(MAX_UPLOAD_BYTES);
const free = planById("free");

export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Do my guests need to download an app?",
    a: "No. Guests scan your QR code with their phone camera and upload right from the browser. There's nothing to install.",
  },
  {
    q: "Do guests need an account?",
    a: "No sign-up. A guest just enters a display name, and an email only if you choose to ask for one.",
  },
  {
    q: "What can guests upload?",
    a: `Photos and videos straight from their phones, up to ${uploadSize} each, at full quality.`,
  },
  {
    q: "Can I control what shows up?",
    a: "Yes. Turn on review to approve uploads before they go public, or hide and remove anything after the fact.",
  },
  {
    q: "Is my album private?",
    a: "Your album opens only to the link you share, and we keep share links out of search engines. You decide if and when to make it public.",
  },
  {
    q: "How long do you keep my photos?",
    a: "Your event stays up until you delete it. There's no expiry clock counting down on your memories.",
  },
  {
    q: "What does it cost?",
    a: `Start free with one event and ${formatBytes(free.storageBytes)} of storage. Upgrade to Pro for unlimited events and more storage, or buy a one-time Event Pass for a single big event.`,
  },
  {
    q: "What's an Event Pass?",
    a: "A one-time payment for a single event with plenty of storage, kept for about a year. No subscription.",
  },
];

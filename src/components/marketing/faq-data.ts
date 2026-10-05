import { planById } from "@/lib/constants/tiers";
import { INACTIVE_MONTHS } from "@/lib/lifecycle/inactivity";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
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
    // Truth note (R4): require-accounts is FREE and DEFAULT-ON, so the email
    // code IS the out-of-the-box path; name-only is the host's opt-out. The
    // old line inverted that ("an email only if you choose to ask for one").
    a: "No app and no password. Guests add their name, and by default verify their email with a one-tap code so every upload has a real person behind it. You can switch that off for casual events.",
  },
  {
    q: "What can guests upload?",
    a: `Photos and videos straight from their phones, up to ${uploadSize} per file, at full quality.`,
  },
  {
    q: "Can I control what shows up?",
    a: "Yes. Turn on review to approve uploads before they go public, or hide and remove anything after the fact.",
  },
  {
    q: "Is my album private?",
    a: "Your album opens only to the people you share its link with, and we keep share links out of search engines. Make it Private and a gate comes first: a password, your yes at the door, or an invite list.",
  },
  {
    q: "How long do you keep my photos?",
    // The help center's one reconciled lifecycle sentence (help/AUTHORING.md rule 7,
    // how-long-media-is-kept.mdx): an event never expires on any plan (its date, an end date
    // too, only says when it happens), EXCEPT that a Free event nobody touches is warned
    // about, then moved to Deleted. A line that says an event "stays up" carries that
    // exception in the same breath (`faq-data.test.ts` holds it), and an Event Pass covers
    // its event for about a year.
    a: `Until you delete them: an event never expires. The one exception is a Free event untouched for about ${INACTIVE_MONTHS} months, which gets a warning email before it moves to Deleted, where you can restore it for ${RECENTLY_DELETED_WINDOW_DAYS} days; any activity resets the clock. An Event Pass covers its event for about a year.`,
  },
  {
    q: "What does it cost?",
    // Pro's value in his ruled order, video first (2026-09-19, voice r1
    // `pro-line=video`): video is the upgrade a host feels, unlimited events is
    // the one they grow into. The sentence is this surface's own.
    a: `Start free with one event and ${formatBytes(free.storageBytes)} of storage. Upgrade to Pro for video, unlimited events, and more storage, or buy a one-time Event Pass for a single big event.`,
  },
  {
    q: "What's an Event Pass?",
    a: "A one-time payment for a single event with plenty of storage, covered for about a year. No subscription.",
  },
];

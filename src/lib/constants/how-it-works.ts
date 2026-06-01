import {
  Clapperboard,
  QrCode,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";

/**
 * The product's core-loop story in three steps — the SINGLE source so the marketing
 * "How it works" section and the first-time host welcome (Phase 6) tell exactly the same
 * thing. Edit the story here once.
 */
export type HowItWorksStep = { icon: LucideIcon; title: string; body: string };

export const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    icon: QrCode,
    title: "Create an event, get a QR",
    body: "Spin up an event in seconds and share one QR code: on a screen, a print-out, or a link.",
  },
  {
    icon: UploadCloud,
    title: "Guests scan and upload",
    body: "No app, no account. Guests open their camera, scan, and add photos and videos straight from their phones.",
  },
  {
    icon: Clapperboard,
    title: "Everything in one gallery",
    body: "Watch the gallery fill up live, curate what shows, and share a public album when the night's over.",
  },
];

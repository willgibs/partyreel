import {
  CalendarHeart,
  Film,
  ListChecks,
  Lock,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import {
  MAX_PHOTO_BYTES,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
} from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

import { Section } from "./section";

// Derived from the universal limits so this copy can never drift from what the
// uploader actually enforces (lib/media/limits.ts), same as the pricing page.
const videoMinutes = Math.round(MAX_VIDEO_DURATION_SECONDS / 60);
const videoSize = formatBytes(MAX_VIDEO_BYTES);
const photoSize = formatBytes(MAX_PHOTO_BYTES);

const FEATURES = [
  {
    icon: Smartphone,
    title: "No app, no account",
    body: "Guests scan the QR and upload straight from their phone browser. Nothing to install, nothing to sign up for.",
  },
  {
    icon: ListChecks,
    title: "Curate as it fills",
    body: "Approve, hide, or remove anything. Flip on review to approve uploads before they show — or let them appear live.",
  },
  {
    icon: Film,
    title: "Big uploads, full quality",
    body: `Videos up to ${videoMinutes} minutes and ${videoSize}, photos up to ${photoSize} — uploaded straight to storage at full resolution.`,
  },
  {
    icon: Lock,
    title: "Private by default",
    body: "Your album opens only to the link you share, and we keep share links out of search engines. You choose when to make it public.",
  },
  {
    icon: CalendarHeart,
    title: "Your memories don't expire",
    body: "Events stay up until you delete them — there's no expiry clock counting down on your photos.",
  },
  {
    icon: ShieldCheck,
    title: "Safety and control",
    body: "Anyone viewing an album can flag a problem, and a real person reviews every report — never an automatic takedown.",
  },
];

export function FeatureHighlights() {
  return (
    <Section
      className="bg-muted/30"
      eyebrow="Why hosts choose Partyreel"
      heading="Everything from the night, nothing in your way"
    >
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
              <Icon className="size-5" />
            </span>
            <h3 className="mt-4 font-heading text-base font-medium">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

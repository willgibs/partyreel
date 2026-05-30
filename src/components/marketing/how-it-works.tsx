import { Clapperboard, QrCode, UploadCloud } from "lucide-react";

import { Section } from "./section";

const STEPS = [
  {
    icon: QrCode,
    title: "Create an event, get a QR",
    body: "Spin up an event in seconds and share one QR code — on a screen, a print-out, or a link.",
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

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      heading="From QR to gallery in three steps"
    >
      <ol className="mt-14 grid gap-10 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="flex flex-col gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
              <Icon className="size-5" />
            </span>
            <h3 className="font-heading text-lg font-medium">
              <span className="mr-1 text-brand">{i + 1}.</span>
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

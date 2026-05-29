import type { Metadata } from "next";
import Link from "next/link";
import { Clapperboard, QrCode, UploadCloud } from "lucide-react";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

// Home keeps the default "Partyreel" title (no template) but gets its own
// description + canonical for SEO; the share card inherits these via the root.
export const metadata: Metadata = {
  description:
    "Partyreel collects every photo and video from your event. Guests scan a QR code and upload from their phones — no app, no account. Create an event free.",
  alternates: { canonical: "/" },
};

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

export default function MarketingHome() {
  return (
    <>
      <section className="border-b">
        <Container className="flex flex-col items-center gap-6 py-24 text-center sm:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            No app. No account. Just a QR code.
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Every photo from your party, in one place.
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">
            Partyreel collects the photos and videos your guests actually took —
            no more chasing group chats the morning after.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href="/login">Start free</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 px-6 text-base"
            >
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-20">
          <div className="grid gap-10 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Icon className="size-5" />
                </span>
                <h2 className="font-heading text-lg font-medium">{title}</h2>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

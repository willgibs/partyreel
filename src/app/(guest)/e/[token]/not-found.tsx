import type { Metadata } from "next";
import Link from "next/link";
import { QrCode } from "lucide-react";

import { GuestBar } from "@/components/guest/guest-bar";
import { HelpLine, NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";
import { DEMO_EVENT_URL } from "@/lib/demo";

// Tailored 404 for a link that resolves to nothing (notFound() in e/[token]/page).
// Real guests hit this from a mistyped or stale QR, so the copy reassures (double-check
// the link, ask the host) and softly introduces Partyreel (the growth loop).
// ★ It must never say an event "ended": there is no end date in this product, by design
// (the anti-abuse core in constants/tiers.ts), so deletion, a typo, or a changed custom
// slug are the only three ways a link stops resolving. The help article
// content/help/the-qr-wont-scan-or-the-link-wont-open.mdx quotes this sentence. Renders in
// (guest)/layout.tsx (narrow mobile column); GuestHeader needs a real qrToken/eventId,
// which a 404 has none of, so the session-less GuestBar stands in — lifted OUT of this
// file in the errors wiring so the guest CRASH could wear the same row (Will,
// `surround=shell`, 2026-09-19).
export const metadata: Metadata = {
  title: "Event not found",
  robots: { index: false, follow: false },
};

export default function GuestNotFound() {
  return (
    <>
      <GuestBar />
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-20">
        <NotFoundScreen
          icon={QrCode}
          eyebrow="Event link"
          title="This event link didn't work"
          description="The link may be mistyped, or the host may have deleted the event. Double-check the QR code or link, or ask the host to resend it."
          actions={
            <Button asChild size="cta">
              <Link href="/">What is Partyreel?</Link>
            </Button>
          }
          // Will, `ways-out=guided` (2026-09-19). A guest holding a link that
          // will not open is the reader most likely to want a person, and the
          // help center's QR article is written for exactly this screen.
          help={<HelpLine href="/help">Visit the help center</HelpLine>}
          footnote={
            DEMO_EVENT_URL ? (
              <Link
                href={DEMO_EVENT_URL}
                className="font-medium text-brand underline-offset-4 hover:underline"
              >
                See how it works with a live demo
              </Link>
            ) : (
              <span className="text-muted-foreground">
                Hosting your own? It is free to start. No app required.
              </span>
            )
          }
        />
      </main>
    </>
  );
}

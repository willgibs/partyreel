import type { Metadata } from "next";
import Link from "next/link";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import {
  LegalArticle,
  type LegalSection,
} from "@/components/marketing/legal-article";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for hosting events and collecting guest media on Partyreel, in plain language: your content, plans and billing, retention, and the rules.",
  alternates: { canonical: "/terms" },
};

// THE TERMS DRAFT (R5 ruling, 2026-08-26, supersedes the launch-gated stub):
// the UI is FINAL (LegalArticle shell); the bodies are ACCURATE plain-language
// drafts, visibly marked pre-launch, doubling as the dedicated legal agent's
// brief (section ids stay stable; the agent writes formal text in place).
// FLAG FOR LEGAL REVIEW before public launch. The "Inactive free events"
// section carries the launch-surfaced policy VERBATIM in intent (Will's ask:
// never a surprise) — plain-language summary of docs/PRD.md retention +
// src/app/api/cron/purge; exact windows/wording to be confirmed by counsel.
const SECTIONS: LegalSection[] = [
  {
    id: "the-service",
    title: "The service",
    summary: "One QR code collects an event's photos into one album.",
    body: [
      "Partyreel lets a host create an event and share one QR code; guests scan it and upload photos and videos from their phones; everything lands in one album the host curates and everyone with access can browse and download. An album can also be rendered into a short highlight reel.",
    ],
  },
  {
    id: "your-account",
    title: "Your account",
    summary: "A verified email is the whole account, and it is yours to guard.",
    body: [
      "Hosts sign in with a verified email. You are responsible for what happens under your account, so keep access to that inbox. Guests contribute through event links and, where a host requires it, their own verified email.",
    ],
  },
  {
    id: "your-content",
    title: "Your content",
    summary: "The photos are yours. We only get the license needed to run the album.",
    body: [
      "You and your guests own the media you upload. By uploading, you give Partyreel the limited license needed to operate the product: storing files, serving them to people with access, generating previews, bundling downloads, and rendering reels. We do not sell your media and we do not use it for advertising.",
      "Hosts are responsible for having the right to collect and share what their event gathers, and guests for having the right to upload what they add.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    summary: "Lawful events, and hosts run their own rooms.",
    body: [
      "Use Partyreel for lawful purposes. Do not upload content that is illegal or abusive, and do not use the service to harass anyone. Hosts moderate their own albums and can remove anything instantly; anyone with access can report content, and a real person reviews every report and can act on it, up to removing content or suspending accounts.",
    ],
  },
  {
    id: "plans-and-billing",
    title: "Plans and billing",
    summary: "Free to start; paid plans are sized by storage and billed by Stripe.",
    body: [
      <>
        The free tier covers one event with photo uploads. Paid plans add
        video, more storage, and more events, and are billed through Stripe as
        either a monthly subscription or a one-time Event Pass. What each plan
        includes lives on the{" "}
        <Link
          href="/pricing"
          className="underline underline-offset-2 transition-colors duration-150 hover:text-foreground"
        >
          pricing page
        </Link>
        ; plan entitlements are applied when payment events settle. Refund
        terms will be finalized here with counsel before launch.
      </>,
    ],
  },
  {
    id: "storage-and-retention",
    title: "Storage and retention",
    summary: "No expiry clock, one tidy-up rule for idle free events, and a year per Event Pass.",
    body: [
      "Albums do not expire: events stay up until their host deletes them. Deleted media and events sit in a 30-day recovery window before being permanently removed.",
      <>
        <strong className="text-foreground">Inactive free events.</strong> To
        keep free accounts tidy, an event on a free account may be removed
        after about <strong className="text-foreground">6 months</strong> with
        no activity (signing in or opening the event both count as activity).
        We email you a warning before this happens, and a removed event stays
        recoverable for a short window afterward before it is permanently
        deleted. Keeping a plan, or simply using your event, prevents removal.
      </>,
      "An Event Pass keeps its event for about a year from purchase; moving to a subscription before the pass ends keeps it longer.",
    ],
  },
  {
    id: "the-reel",
    title: "The highlight reel",
    summary: "Free reels carry a small mark; photos and albums never do.",
    body: [
      "Reels rendered on the free tier carry a small partyreel.com mark; upgrading removes it from the next render. Photos and the album itself are never watermarked, on any plan.",
    ],
  },
  {
    id: "ending-things",
    title: "Ending things",
    summary: "You can leave any time; we can act on abuse.",
    body: [
      <>
        Hosts can delete events, and accounts can be deleted entirely (see{" "}
        <Link
          href="/help/your-data-and-deleting-your-account"
          className="underline underline-offset-2 transition-colors duration-150 hover:text-foreground"
        >
          your data and deleting your account
        </Link>
        ). Download what you want to keep first: deletion is real. Partyreel
        can suspend or terminate accounts that break these terms, with report
        review handled by a person.
      </>,
    ],
  },
  {
    id: "warranties-and-liability",
    title: "Warranties and liability",
    summary: "The formal clauses land with counsel before launch.",
    body: [
      "The formal warranty, disclaimer, and limitation-of-liability sections will be written with counsel before public launch. In plain words until then: we take care of your media like it matters, and the privacy policy describes exactly how it is stored and protected.",
    ],
  },
  {
    id: "changes-and-contact",
    title: "Changes and contact",
    summary: "Updates are posted here, and a person answers questions.",
    body: [
      <>
        When these terms change, the new version is posted on this page with
        its date. Questions get a human answer:{" "}
        <Link
          href="/contact"
          className="underline underline-offset-2 transition-colors duration-150 hover:text-foreground"
        >
          contact us
        </Link>
        .
      </>,
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Terms of Service", href: "/terms" },
        ]}
      />
      <LegalArticle
        title="Terms of Service"
        statusLine="Pre-launch draft · Plain language · Effective date to come"
        sections={SECTIONS}
      />
    </>
  );
}

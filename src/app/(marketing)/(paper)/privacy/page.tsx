import type { Metadata } from "next";
import Link from "next/link";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import {
  LegalArticle,
  type LegalSection,
} from "@/components/marketing/legal-article";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Partyreel handles your data, in plain language: what we keep, where media lives, who can see what, and how deletion really works.",
  alternates: { canonical: "/privacy" },
};

// THE PRIVACY DRAFT (R5 ruling, 2026-08-26, supersedes the launch-gated stub):
// the UI is FINAL (LegalArticle shell); the bodies are ACCURATE plain-language
// drafts of shipped behavior, visibly marked pre-launch, and double as the
// brief for the dedicated LEGAL AGENT that writes the formal text in place
// (section ids stay stable). Every claim below is verifiable in the product;
// FLAG FOR LEGAL REVIEW before public launch. No invented policies.
const SECTIONS: LegalSection[] = [
  {
    id: "what-we-collect",
    title: "What we collect",
    summary: "An email, a display name, your events, and your uploads.",
    body: [
      "Your account is a verified email address and the display name you picked. Your events are the albums you host, their settings, and the media inside them. Your uploads are the photos and videos you add to events, attributed to your display name (or to “Anonymous” where a host allows unsigned uploads).",
      "There is no advertising profile, no tracking across other sites, and nothing about you is sold. We collect what the product needs to run, and that is the list above.",
    ],
  },
  {
    id: "where-media-lives",
    title: "Where your media lives",
    summary: "Two regions, daily checks, and real backups.",
    body: [
      "Uploads land in primary storage and are copied to a second bucket in a different region within seconds. A separate backup copy is kept write-once for at least 35 days, a daily sweep reconciles storage against the database, and the database itself is backed up off-site every day.",
      "None of this is marketing garnish: it is how the storage actually runs, and it exists so a once-in-a-lifetime album survives our bad day too.",
    ],
  },
  {
    id: "who-can-see-what",
    title: "Who can see what",
    summary: "Your album opens exactly as wide as its host chooses.",
    body: [
      "Every event has a visibility setting: open to anyone with the link, locked behind a password, or private to the host. Album links are kept out of search engines, so public means people with your link, not the open internet.",
      "Media files are never served from public addresses. The album hands out short-lived signed links as you browse, and guest access rides capability links that reach only their own event.",
    ],
  },
  {
    id: "metadata",
    title: "Photo metadata",
    summary: "Location data stays on the phone.",
    body: [
      "EXIF and GPS metadata are stripped in the browser before a photo ever uploads, without re-encoding the file. What lands in the album is the picture, not where it was taken.",
    ],
  },
  {
    id: "retention-and-deletion",
    title: "Retention and deletion",
    summary: "Albums stay until deleted; deletes are real, with a safety net.",
    body: [
      "There is no expiry clock on an album: events stay up until their host takes them down. When a host deletes media or a whole event, it sits in a recovery bin for 30 days (so an accidental swipe is never a disaster), and after that it is permanently deleted.",
      "Two lifecycle exceptions: an event on a free account may be removed after about 6 months with no activity (we email a warning first), and an Event Pass keeps its event for about a year unless it moves to a paid plan.",
    ],
  },
  {
    id: "your-choices",
    title: "Your choices",
    summary: "Download everything, delete anything, leave whenever.",
    body: [
      <>
        Everything you uploaded comes back out at the quality it went in,
        one photo at a time or the whole album at once. Hosts can delete any
        media or event; guests can ask a host to remove one of their shots,
        and hosts can do it instantly. To delete your account entirely, see{" "}
        <Link
          href="/help/your-data-and-deleting-your-account"
          className="underline underline-offset-2 transition-colors duration-150 hover:text-foreground"
        >
          your data and deleting your account
        </Link>
        .
      </>,
    ],
  },
  {
    id: "reports-and-safety",
    title: "Reports and safety",
    summary: "A real person reviews every report.",
    body: [
      "Anyone who can see an album can report something in it. Reports go to a person, not an automated takedown: a human reviews each one and acts on it. Hosts can remove anything from their own album at any time, instantly.",
    ],
  },
  {
    id: "changes-and-contact",
    title: "Changes and contact",
    summary: "Updates are posted here, and a person answers questions.",
    body: [
      <>
        When this policy changes, the new version is posted on this page with
        its date. Questions about your data get a human answer:{" "}
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

export default function PrivacyPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Privacy Policy", href: "/privacy" },
        ]}
      />
      <LegalArticle
        title="Privacy Policy"
        statusLine="Pre-launch draft · Plain language · Effective date to come"
        sections={SECTIONS}
      />
    </>
  );
}

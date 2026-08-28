import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import {
  HelpPaletteProvider,
  HelpSearchTrigger,
} from "@/components/marketing/help/help-palette";
import {
  BreadcrumbJsonLd,
  ContactPageJsonLd,
} from "@/components/marketing/jsonld";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { type ContactTopicValue } from "@/lib/constants/contact";
import {
  getAllArticles,
  getSearchIndex,
  HELP_QUICK_LINKS,
  type HelpCategorySlug,
} from "@/lib/content/help";

import { ContactFacts, ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Partyreel: questions about your event, billing, or anything else. Every note gets a reply, usually within a day.",
  alternates: { canonical: "/contact" },
};

// The help->contact handoff (R6, extended by the contact round): a help
// article's "didn't answer it" path links /contact?about=<slug>. The page STAYS
// static (no searchParams read — any dynamic API would flip the whole route to
// per-request rendering); the slug map is baked at build and the client island
// reads window.location on mount, prefilling the subject AND pre-picking the
// topic chip ONLY for a known slug (so a crafted query can never inject free
// text into the field). The category->topic map is exhaustive over
// HelpCategorySlug on purpose: a new help category fails typecheck here until
// it gets a conscious topic mapping.
const CATEGORY_TOPIC: Record<HelpCategorySlug, ContactTopicValue> = {
  "getting-started": "hosting",
  "qr-and-invites": "hosting",
  "guest-experience": "guest",
  "event-album": "hosting",
  "sharing-and-downloads": "hosting",
  "highlight-reel": "hosting",
  "plans-and-billing": "billing",
  "privacy-and-safety": "privacy",
  troubleshooting: "bug",
};

// The self-serve directory (the "connected resource" onward paths), in the
// numbered editorial register (the identity sitting's ledger steal): hairline
// top rules + index numbers, no icon-chip template. The help entry fronts the
// same library the search band queries.
const DIRECTORY: {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
}[] = [
  {
    title: "Help center",
    body: "Guides for every step, from the first QR to the final download.",
    href: "/help",
    linkLabel: "Browse the guides",
  },
  {
    title: "Press & brand",
    body: "The boilerplate, the fact sheet, and brand marks, ready to take.",
    href: "/press",
    linkLabel: "Open the press kit",
  },
  {
    title: "Careers",
    body: "How the team works, and the roles open right now.",
    href: "/careers",
    linkLabel: "See open roles",
  },
];

export default function ContactPage() {
  const helpSubjects = Object.fromEntries(
    getAllArticles().map((article) => [
      article.slug,
      {
        title: article.frontmatter.title,
        topic: CATEGORY_TOPIC[article.frontmatter.category],
      },
    ]),
  );

  return (
    // The palette provider wraps the whole page so cmd-K works anywhere on
    // /contact, exactly like the help layout (the index serializes once here).
    <HelpPaletteProvider index={getSearchIndex()} quickLinks={HELP_QUICK_LINKS}>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ]}
      />
      <ContactPageJsonLd />

      {/* Hero: the paper-page header idiom (texts-reveal, calm register). */}
      <section className="border-b">
        <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <TextsReveal className="flex flex-col items-center gap-6">
            <Eyebrow className="mkt-line" style={{ "--i": 0 } as CSSProperties}>
              Contact
            </Eyebrow>
            <h1
              className="mkt-line max-w-3xl font-heading text-4xl text-balance sm:text-5xl md:text-6xl"
              style={{ "--i": 1 } as CSSProperties}
            >
              Talk to Partyreel.
            </h1>
            <p
              className="mkt-line max-w-xl text-pretty text-muted-foreground sm:text-lg"
              style={{ "--i": 2 } as CSSProperties}
            >
              An event you&rsquo;re planning, a plan you&rsquo;re weighing,
              something that broke. Every note gets a reply, usually within a
              day.
            </p>
          </TextsReveal>
        </Container>
      </section>

      {/* The form chapter: the page's instrument. Form leads on mobile (the
          page's purpose); the rail sits beside it from lg. */}
      <SectionShell reveal="none" className="border-b">
        {/* Three placed children so MOBILE reads heading -> form -> email
            (the form right after the intro; the alternative door after the
            commitment) while lg keeps the asymmetric two-column chapter:
            header + email card stacked left, the form spanning right. */}
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.6fr] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-8">
          <div className="flex flex-col gap-5 lg:col-start-1 lg:row-start-1 lg:pt-2">
            <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
              Send a note
            </h2>
            <p className="text-pretty text-muted-foreground">
              Pick a topic so it lands in the right place, say what&rsquo;s
              going on, and that&rsquo;s it.
            </p>
          </div>
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <ContactForm helpSubjects={helpSubjects} />
          </div>
          {/* Plain email stays a first-class door: the desk's definition rows
              (copy affordance included), bottom-anchored against the card. */}
          <div className="lg:col-start-1 lg:row-start-2 lg:self-end">
            <ContactFacts />
          </div>
        </div>
      </SectionShell>

      {/* Self-serve: the help library, searchable right here (the palette is
          mounted page-wide), on the light band variation. */}
      <SectionShell
        eyebrow="Self-serve"
        heading="Answers, ready now."
        subhead="Search the help center without leaving this page, or start from a common question."
        className="border-b bg-muted/40"
      >
        <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-5">
          <HelpSearchTrigger variant="hero" />
          <div className="flex flex-wrap justify-center gap-2">
            {HELP_QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:border-foreground/25 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <Reveal className="mx-auto mt-16 grid max-w-4xl gap-x-10 gap-y-10 sm:grid-cols-3">
          {DIRECTORY.map((tile, i) => (
            <Link
              key={tile.href}
              href={tile.href}
              data-mkt-reveal
              style={{ "--i": 3 + i } as CSSProperties}
              className="mkt-learn group flex flex-col gap-2.5 border-t pt-5 transition-colors duration-150 hover:border-foreground/40"
            >
              <span className="font-heading text-sm tabular-nums text-muted-foreground/60">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-heading text-lg">{tile.title}</h3>
              <p className="text-sm text-pretty text-muted-foreground">
                {tile.body}
              </p>
              <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-medium text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
                {tile.linkLabel}
                <LearnChevron />
              </span>
            </Link>
          ))}
        </Reveal>
      </SectionShell>

      {/* Quiet close: curiosity has somewhere to go. */}
      <CtaBand
        heading="See what guests see."
        subhead="The live demo album is open, and the reel is one tap away. Then make one of your own."
        demoLink
      />
    </HelpPaletteProvider>
  );
}

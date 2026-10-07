import type { Metadata } from "next";

import {
  HelpPaletteProvider,
  HelpSearchTrigger,
} from "@/components/marketing/help/help-palette";
import {
  BreadcrumbJsonLd,
  ContactPageJsonLd,
} from "@/components/marketing/jsonld";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { REPLY_LINE, type ContactTopicValue } from "@/lib/constants/contact";
import {
  getAllArticles,
  getCategoryChips,
  getSearchIndex,
  HELP_QUICK_LINKS,
  type HelpCategorySlug,
} from "@/lib/content/help";

import { ContactDirectory } from "./contact-directory";
import { ContactFacts } from "./contact-facts";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with Partyreel: questions about your event, billing, or anything else. ${REPLY_LINE}`,
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
  // Account questions come from hosts AND guests, so neither audience topic
  // fits; "Something else" is the honest chip.
  "account-and-profile": "other",
  "privacy-and-safety": "privacy",
  troubleshooting: "bug",
};

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
    <HelpPaletteProvider
      index={getSearchIndex()}
      quickLinks={HELP_QUICK_LINKS}
      categories={getCategoryChips()}
    >
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ]}
      />
      <ContactPageJsonLd />

      {/* Hero: the utility trio's blur register on PageHero (2026-09-11), the
          h1 held at paint. The room starts at the very top of the page: the
          negative margin slides the lockup under the overlay header (a sticky
          header still takes its 64px of flow) and the top padding clears the
          bar again, the mechanism /press, /about and the legal pages share. */}
      <PageHero
        entrance="blur"
        scale="lg"
        eyebrow="Contact"
        heading="Talk to Partyreel."
        subhead={
          <>
            An event you&rsquo;re planning, a plan you&rsquo;re weighing,
            something that broke. {REPLY_LINE}
          </>
        }
        className="-mt-[var(--mkt-header-h)] pt-28 pb-14 sm:pt-36 sm:pb-20"
      />

      {/* Everything under the hero is ONE paper chapter (contact-page r1
          `page=chapter`): the desk opens it, the self-serve band and the close
          follow, so the cut from the dark room is a single hard line and the
          page reads dark hero, paper body, ink footer like its siblings. */}
      <PaperChapter>
        {/* The desk: the page's instrument, opening the chapter. */}
        <SectionShell reveal="none" className="border-b">
          {/* The form leads on a phone (the page's purpose): heading, form, then
              the onward paths and the plain address after the commitment. From
              lg the rail sits beside it: the intro and the directory stacked
              left, the address anchored to the card's foot, the form spanning
              all three rows. */}
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.6fr] lg:grid-rows-[auto_auto_1fr] lg:gap-x-14 lg:gap-y-10">
            <div className="flex flex-col gap-5 lg:col-start-1 lg:row-start-1 lg:pt-2">
              <h2 className="font-heading text-prose">Send a note</h2>
              <p className="text-pretty text-muted-foreground">
                Pick a topic so it lands in the right place, say what&rsquo;s
                going on, and that&rsquo;s it.
              </p>
            </div>
            <div className="lg:col-start-2 lg:row-span-3 lg:row-start-1">
              <ContactForm helpSubjects={helpSubjects} />
            </div>
            {/* The directory stands beside the note it might spare (contact-page
                r1 `beside=directory`) and the address is a fact under it, never
                a door of its own (`reach=routed`). One column with a tighter
                rhythm in a hand; `contents` at lg hands each its own grid row. */}
            <div className="flex flex-col gap-6 lg:contents">
              <div className="lg:col-start-1 lg:row-start-2">
                <ContactDirectory />
              </div>
              <div className="lg:col-start-1 lg:row-start-3 lg:self-end">
                <ContactFacts />
              </div>
            </div>
          </div>
        </SectionShell>

        {/* Self-serve: the help library, searchable right here (the palette is
            mounted page-wide), on the light band variation. */}
        <SectionShell
          eyebrow="Self-serve"
          heading="Answers, ready now."
          subhead="Search the help center without leaving this page."
          className="border-b bg-muted/40"
        >
          {/* The field alone, as on /help: the palette's Suggested list (the same HELP_QUICK_LINKS) drops from it
              the moment it opens, so chips under it said those questions twice. */}
          <div className="mx-auto mt-10 flex max-w-xl flex-col items-center">
            <HelpSearchTrigger variant="hero" />
          </div>
        </SectionShell>

        {/* Quiet close: curiosity has somewhere to go. */}
        <CtaBand
          heading="See what guests see."
          subhead="The live demo album is open, and the reel is one tap away. Then make one of your own."
          demoLink
        />
      </PaperChapter>
    </HelpPaletteProvider>
  );
}

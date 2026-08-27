import { Clock, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { getAllArticles } from "@/lib/content/help";
import { SUPPORT_EMAIL } from "@/lib/constants/site";

import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Partyreel team: questions about your event, billing, or anything else. We usually reply within one business day.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  // The help→contact handoff (R6): a help article's "didn't answer it" path
  // links /contact?about=<slug>. The page STAYS static (no searchParams read —
  // any dynamic API would flip the whole route to per-request rendering); the
  // slug→title map is baked at build and the client island reads
  // window.location on mount, prefilling the subject ONLY for a known slug (so
  // a crafted query can never inject free text into the field).
  const helpSubjects = Object.fromEntries(
    getAllArticles().map((article) => [
      article.slug,
      article.frontmatter.title,
    ]),
  );
  return (
    // as="h1": the page's lead (and only) section heading — /contact previously
    // shipped with NO h1 (the audit gap this SectionShell prop exists to fix).
    <SectionShell
      as="h1"
      eyebrow="Contact"
      heading="Get in touch"
      subhead="Questions about your event, billing, or anything else? Send us a note and we'll get back to you."
    >
      <div className="mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-[1fr_1.3fr] lg:gap-10">
        <div className="flex flex-col gap-6">
          {/* Ways to reach us: achromatic hairline icon chips (the privacy-claims
              language) + the mono caption voice for the address itself. */}
          <div className="flex flex-col gap-6 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-7">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border text-muted-foreground">
                <Mail aria-hidden className="size-5" strokeWidth={1.5} />
              </span>
              <div className="flex flex-col gap-1.5">
                <p className="font-heading text-base font-medium">Email us</p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-mono text-sm tracking-wide text-muted-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-foreground hover:decoration-foreground"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border text-muted-foreground">
                <Clock aria-hidden className="size-5" strokeWidth={1.5} />
              </span>
              <div className="flex flex-col gap-1.5">
                <p className="font-heading text-base font-medium">
                  Response time
                </p>
                <p className="text-sm text-muted-foreground">
                  Usually within one business day.
                </p>
              </div>
            </div>
          </div>

          {/* Deflection: most questions are answered faster in the help center
              (which links back to /contact), so close the loop. mkt-learn on
              the whole card animates the chevron from anywhere on it. */}
          <Link
            href="/help"
            className="mkt-learn group flex flex-col gap-2 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 transition-[border-color,transform] duration-150 hover:border-foreground/25 active:scale-[0.99] sm:p-7"
          >
            <h3 className="font-heading text-lg font-medium">
              Looking for a quick answer?
            </h3>
            <p className="text-sm text-pretty text-muted-foreground">
              Our help center covers setup, guests, billing, and the highlight
              reel.
            </p>
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
              Browse the help center
              <LearnChevron />
            </span>
          </Link>
        </div>
        <ContactForm helpSubjects={helpSubjects} />
      </div>
    </SectionShell>
  );
}

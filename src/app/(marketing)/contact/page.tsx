import { ArrowRight, Clock, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/marketing/section";
import { SUPPORT_EMAIL } from "@/lib/constants/site";

import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Partyreel team: questions about your event, billing, or anything else. We usually reply within one business day.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Section
      eyebrow="Contact"
      heading="Get in touch"
      subhead="Questions about your event, billing, or anything else? Send us a note and we'll get back to you."
    >
      <div className="mx-auto mt-12 grid max-w-4xl gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-6">
          {/* Ways to reach us: icon-chip rows, matching the help-center card language. */}
          <div className="flex flex-col gap-6 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-7">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Mail aria-hidden className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="font-heading text-base font-medium">Email us</p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-sm text-muted-foreground transition-colors duration-150 hover:text-brand"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Clock aria-hidden className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
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
              (which links back to /contact), so close the loop. */}
          <Link
            href="/help"
            className="group flex flex-col gap-2 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 transition-colors duration-150 hover:border-brand/40 sm:p-7"
          >
            <h3 className="font-heading text-lg font-medium transition-colors duration-150 group-hover:text-brand">
              Looking for a quick answer?
            </h3>
            <p className="text-sm text-pretty text-muted-foreground">
              Our help center covers setup, guests, billing, and the highlight
              reel.
            </p>
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors duration-150 group-hover:text-brand">
              Browse the help center
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>
        <ContactForm />
      </div>
    </Section>
  );
}

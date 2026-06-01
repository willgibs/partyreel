import { Clock, Mail } from "lucide-react";
import type { Metadata } from "next";

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
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Email us</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-brand"
            >
              <Mail className="size-4" />
              {SUPPORT_EMAIL}
            </a>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Response time</p>
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" />
              Usually within one business day.
            </p>
          </div>
        </div>
        <ContactForm />
      </div>
    </Section>
  );
}

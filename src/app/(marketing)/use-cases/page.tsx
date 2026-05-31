import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { FinalCta } from "@/components/marketing/final-cta";
import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { Section } from "@/components/marketing/section";
import { USE_CASES } from "@/lib/constants/use-cases";

export const metadata: Metadata = {
  title: "Use cases",
  description:
    "See how Partyreel collects every photo and video — for weddings, parties, conferences, and trips. No app and no account for your guests.",
  alternates: { canonical: "/use-cases" },
};

export default function UseCasesHub() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Use cases", href: "/use-cases" },
        ]}
      />
      <Section
        eyebrow="Use cases"
        heading="Made for every kind of get-together"
        subhead="If people show up with phones, Partyreel collects what they capture. Find your event."
      >
        <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2">
          {USE_CASES.map(({ slug, navLabel, icon: Icon, teaser }) => (
            <Link
              key={slug}
              href={`/use-cases/${slug}`}
              className="group flex flex-col gap-3 rounded-xl border bg-card p-6 transition-colors duration-150 hover:border-brand/40"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-brand">
                <Icon className="size-5" />
              </span>
              <h3 className="font-heading text-lg font-medium">{navLabel}</h3>
              <p className="text-sm text-muted-foreground">{teaser}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors duration-150 group-hover:text-brand">
                Explore
                <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </Section>
      <FinalCta />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { FinalCta } from "@/components/marketing/final-cta";
import { ReelTeaser } from "@/components/marketing/reel-teaser";
import { Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { FEATURE_GROUPS } from "@/lib/constants/features";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Everything Partyreel does — no-app guest uploads, a styled QR code, a live gallery, host curation, private-by-default albums, full-quality downloads, and an automatic highlight reel.",
  alternates: { canonical: "/features" },
};

export default function FeaturesPage() {
  return (
    <>
      <Section
        eyebrow="Features"
        heading="Everything from the night, nothing in your way"
        subhead="Partyreel turns every guest into a contributor and the whole event into one shareable album — with a highlight reel to match."
      >
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
      </Section>

      <ReelTeaser />

      {FEATURE_GROUPS.map((group, index) => (
        <Section
          key={group.id}
          id={group.id}
          eyebrow={group.eyebrow}
          heading={group.heading}
          subhead={group.subhead}
          className={index % 2 === 0 ? "bg-muted/30" : undefined}
        >
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.features.map(({ icon: Icon, title, longBody }) => (
              <div key={title} className="rounded-xl border bg-card p-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-heading text-base font-medium">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{longBody}</p>
              </div>
            ))}
          </div>
        </Section>
      ))}

      <FinalCta />
    </>
  );
}

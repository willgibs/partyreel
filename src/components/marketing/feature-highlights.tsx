import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { HOME_FEATURES } from "@/lib/constants/features";

import { Section } from "./section";

export function FeatureHighlights() {
  return (
    <Section
      className="bg-muted/30"
      eyebrow="Why hosts choose Partyreel"
      heading="Everything from the night, nothing in your way"
    >
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {HOME_FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
              <Icon className="size-5" />
            </span>
            <h3 className="mt-4 font-heading text-base font-medium">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link
          href="/features"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors duration-150 hover:text-brand"
        >
          See all features
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </Section>
  );
}

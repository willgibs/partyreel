import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { GalleryFrame } from "@/components/marketing/frames";
import { HOME_FEATURES } from "@/lib/constants/features";

import { Section } from "./section";

// Home Features teaser: lead with a frame spotlight (R5) instead of a flat card grid —
// the curated HOME_FEATURES as an icon-chip list beside a GalleryFrame, mirroring the
// /features spotlight rhythm without re-using FeatureSpotlight (which renders its own
// group heading and would double this section's "Why hosts choose" header). GalleryFrame
// is the one frame NOT already on the home (hero=album, reel=reel, Events teaser covers
// album/phone/qr/reel), so it adds variety with no repetition.
export function FeatureHighlights() {
  return (
    <Section
      className="bg-muted/30"
      eyebrow="Why hosts choose Partyreel"
      heading="Everything from the night, nothing in your way"
    >
      <div className="mx-auto mt-14 grid max-w-5xl items-center gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <ul className="flex flex-col gap-4">
            {HOME_FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Icon className="size-5" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-heading text-base font-medium">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/features"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors duration-150 hover:text-brand"
          >
            See all features
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <GalleryFrame />
      </div>
    </Section>
  );
}

import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { FeatureSpotlight } from "@/components/marketing/feature-spotlight";
import { FinalCta } from "@/components/marketing/final-cta";
import {
  AlbumFrame,
  GalleryFrame,
  PhoneFrame,
  QrFrame,
} from "@/components/marketing/frames";
import { ReelTeaser } from "@/components/marketing/reel-teaser";
import { Section } from "@/components/marketing/section";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { type FeatureGroup, FEATURE_GROUPS } from "@/lib/constants/features";
import { FEATURE_PRESENTATION } from "@/lib/constants/features-layout";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Everything Partyreel does: no-app guest uploads, a styled QR code, a live gallery, host curation, private-by-default albums, full-quality downloads, and an automatic highlight reel.",
  alternates: { canonical: "/features" },
};

const group = (id: string): FeatureGroup =>
  FEATURE_GROUPS.find((g) => g.id === id)!;

const SPOTLIGHT_FRAME: Record<"phone" | "gallery" | "album", ReactNode> = {
  phone: <PhoneFrame />,
  gallery: <GalleryFrame />,
  album: <AlbumFrame />,
};

function Spotlight({ id, className }: { id: string; className?: string }) {
  const presentation = FEATURE_PRESENTATION[id];
  if (presentation.kind !== "spotlight") return null;
  return (
    <FeatureSpotlight
      group={group(id)}
      media={SPOTLIGHT_FRAME[presentation.frame]}
      mediaSide={presentation.mediaSide}
      className={className}
    />
  );
}

// privacy → a bespoke trust panel (one unified bordered card, shield motif).
function PrivacyPanel() {
  const g = group("privacy");
  return (
    <Section>
      <div className="mx-auto max-w-4xl rounded-3xl border bg-card p-8 ring-1 ring-foreground/5 sm:p-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <ShieldCheck className="size-6" />
          </span>
          <span className="text-sm font-medium text-brand">{g.eyebrow}</span>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {g.heading}
          </h2>
          <p className="max-w-xl text-pretty text-muted-foreground">
            {g.subhead}
          </p>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {g.features.map(({ icon: Icon, title, longBody }) => (
            <div key={title} className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Icon className="size-4" />
                </span>
                <h3 className="font-heading text-base font-medium">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{longBody}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// storage → a bespoke keepsake pair (open 2-up, no card chrome).
function StoragePair({ className }: { className?: string }) {
  const g = group("storage");
  return (
    <Section
      className={className}
      eyebrow={g.eyebrow}
      heading={g.heading}
      subhead={g.subhead}
    >
      <div className="mx-auto mt-12 grid max-w-3xl gap-10 sm:grid-cols-2">
        {g.features.map(({ icon: Icon, title, longBody }) => (
          <div
            key={title}
            className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Icon className="size-6" />
            </span>
            <h3 className="font-heading text-lg font-medium">{title}</h3>
            <p className="text-sm text-pretty text-muted-foreground">
              {longBody}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default function FeaturesPage() {
  return (
    <>
      {/* Hero — copy + the QR "scan to join" frame (demo-ready for Round 3). */}
      <section className="border-b">
        <Container className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <span className="text-sm font-medium text-brand">Features</span>
            <h1 className="text-4xl font-semibold tracking-tighter text-balance sm:text-5xl">
              Everything from the night, nothing in your way
            </h1>
            <p className="text-lg text-pretty text-muted-foreground">
              Partyreel turns every guest into a contributor and the whole event
              into one shareable album, with a highlight reel to match.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
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
          </div>
          <div className="flex justify-center lg:justify-end">
            <QrFrame caption="Scan to join" />
          </div>
        </Container>
      </section>

      <Spotlight id="guests" />
      <Spotlight id="hosts" className="bg-muted/30" />
      <ReelTeaser />
      <Spotlight id="share" className="bg-muted/30" />
      <PrivacyPanel />
      <StoragePair className="bg-muted/30" />

      <FinalCta />
    </>
  );
}

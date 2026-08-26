import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { FeatureSpotlight } from "@/components/marketing/feature-spotlight";
import { QrFrame } from "@/components/marketing/frames";
import {
  GuestPhoneVisual,
  HostGalleryVisual,
  ShareAlbumVisual,
} from "@/components/marketing/sections/features/feature-visuals";
import { FeaturesReelBand } from "@/components/marketing/sections/features/reel-band";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { type FeatureGroup, FEATURE_GROUPS } from "@/lib/constants/features";
import { FEATURE_PRESENTATION } from "@/lib/constants/features-layout";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";

export const metadata: Metadata = {
  title: "Features",
  description: `Everything Partyreel does: no-app guest uploads, a styled QR code, a live album, host curation with bulk approve, EXIF stripping, a 30-day recovery bin, download-all zip export, and a highlight reel in ${STYLE_CATALOG.length} styles.`,
  alternates: { canonical: "/features" },
};

const group = (id: string): FeatureGroup =>
  FEATURE_GROUPS.find((g) => g.id === id)!;

const SPOTLIGHT_FRAME: Record<"phone" | "gallery" | "album", ReactNode> = {
  phone: <GuestPhoneVisual />,
  gallery: <HostGalleryVisual />,
  album: <ShareAlbumVisual />,
};

function Spotlight({ id }: { id: string }) {
  const presentation = FEATURE_PRESENTATION[id];
  if (presentation.kind !== "spotlight") return null;
  return (
    <FeatureSpotlight
      group={group(id)}
      media={SPOTLIGHT_FRAME[presentation.frame]}
      mediaSide={presentation.mediaSide}
    />
  );
}

/**
 * Hero — split copy + the LIVE demo QR (the ONE real scannable QR on the site;
 * QrFrame falls back to its decorative block when no demo is configured).
 * Hand-rolled like the /reel hero because the route H1 sits ABOVE the section
 * scale (the ruled hierarchy: 4xl / 5xl / 6xl) on the cinema cut register.
 */
function FeaturesHero() {
  const cut = (i: number) => ({
    "data-mkt-cut": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <section className="overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14">
      <Container>
        <Reveal className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex max-w-2xl flex-col items-start gap-5 lg:col-span-7">
            <Eyebrow {...cut(0)}>Features</Eyebrow>
            <h1
              {...cut(1)}
              className="font-heading text-4xl text-balance sm:text-5xl lg:text-6xl"
            >
              Everything you need, nothing to chase.
            </h1>
            <p
              {...cut(2)}
              className="max-w-xl text-lg text-pretty text-muted-foreground"
            >
              One QR code in, one album out. This is everything Partyreel does
              in between, for your guests and for you.
            </p>
            <div
              {...cut(3)}
              className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-11 px-6 text-base">
                  <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
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
              <DemoCtaLink />
            </div>
          </div>
          <div className="flex justify-center lg:col-span-5 lg:justify-end">
            <QrFrame caption="Scan to join" liveQrUrl={DEMO_EVENT_URL} />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/** privacy → the bespoke trust panel: one bordered card, mono shield motif. */
function PrivacyPanel() {
  const g = group("privacy");
  return (
    <SectionShell>
      <Reveal className="mx-auto max-w-5xl rounded-3xl border bg-card/40 p-8 ring-1 ring-foreground/5 sm:p-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            data-mkt-reveal
            className="flex size-12 items-center justify-center rounded-2xl border text-muted-foreground"
            style={{ "--i": 0 } as CSSProperties}
          >
            <ShieldCheck className="size-6" strokeWidth={1.5} />
          </span>
          <Eyebrow data-mkt-reveal style={{ "--i": 1 } as CSSProperties}>
            {g.eyebrow}
          </Eyebrow>
          <h2
            data-mkt-reveal
            className="font-heading text-3xl text-balance sm:text-4xl"
            style={{ "--i": 2 } as CSSProperties}
          >
            {g.heading}
          </h2>
          <p
            data-mkt-reveal
            className="max-w-xl text-pretty text-muted-foreground"
            style={{ "--i": 3 } as CSSProperties}
          >
            {g.subhead}
          </p>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {g.features.map(({ icon: Icon, title, longBody }, i) => (
            <div
              key={title}
              data-mkt-reveal
              className="flex flex-col gap-2"
              style={{ "--i": 4 + i } as CSSProperties}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border text-muted-foreground">
                  <Icon className="size-4" strokeWidth={1.5} />
                </span>
                <h3 className="font-heading text-base sm:text-lg">{title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {longBody}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </SectionShell>
  );
}

/** storage → the keepsake trio (open layout, no card chrome, quiet). */
function StorageTrio() {
  const g = group("storage");
  return (
    <SectionShell eyebrow={g.eyebrow} heading={g.heading} subhead={g.subhead}>
      <Reveal className="mx-auto mt-12 grid max-w-4xl gap-x-8 gap-y-10 sm:grid-cols-3">
        {g.features.map(({ icon: Icon, title, longBody }, i) => (
          <div
            key={title}
            data-mkt-reveal
            className="flex flex-col items-center gap-3 text-center"
            style={{ "--i": i } as CSSProperties}
          >
            <span className="flex size-10 items-center justify-center rounded-lg border text-muted-foreground">
              <Icon className="size-5" strokeWidth={1.5} />
            </span>
            <h3 className="font-heading text-lg sm:text-xl">{title}</h3>
            <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
              {longBody}
            </p>
          </div>
        ))}
      </Reveal>
    </SectionShell>
  );
}

export default function FeaturesPage() {
  return (
    <>
      <FeaturesHero />
      <Spotlight id="guests" />
      <Spotlight id="hosts" />
      <FeaturesReelBand />
      <Spotlight id="share" />
      <PrivacyPanel />
      <StorageTrio />
      <CtaBand
        className="border-t"
        heading="Start your first event free."
        subhead="Create the event, put the QR where people can see it, and the album fills itself."
        demoLink
      />
    </>
  );
}

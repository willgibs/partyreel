import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Reveal } from "@/components/marketing/system/reveal";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

/**
 * PHASE-A STUB (expansion round): the registry-driven hero grammar + close, so
 * every feature route EXISTS before the nav points at it (the nav contract) and
 * renders intentionally in the meantime. The Phase-B tracks replace each page's
 * body wholesale; this component dies at Phase-C cleanup when the last stub
 * goes. Not exported anywhere else; not a route file itself.
 */
export function FeatureStub({ slug }: { slug: string }) {
  const page = featurePage(slug);
  const cut = (i: number) => ({
    "data-mkt-cut": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Features", href: "/features" },
          { name: page.navLabel, href: `/features/${page.slug}` },
        ]}
      />
      <section className="overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14">
        <Container>
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <Link
              {...cut(0)}
              href="/features"
              className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground"
            >
              Features
            </Link>
            <Eyebrow {...cut(1)}>{page.navLabel}</Eyebrow>
            <h1
              {...cut(2)}
              className="font-heading text-4xl text-balance sm:text-5xl lg:text-6xl"
            >
              {page.h1}
            </h1>
            <p
              {...cut(3)}
              className="max-w-2xl text-lg text-pretty text-muted-foreground"
            >
              {page.heroSub}
            </p>
            <div {...cut(4)} className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 px-6 text-base">
                <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 px-6 text-base"
              >
                <Link href="/how-it-works">See how it works</Link>
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
      <CtaBand
        className="border-t"
        heading="Start your first event free."
        subhead="Create the event, share one QR code, and the whole thing lands in one album."
        demoLink
      />
    </>
  );
}

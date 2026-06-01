import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BuiltFor } from "@/components/marketing/built-for";
import { eventFrame } from "@/components/marketing/event-frame";
import { FinalCta } from "@/components/marketing/final-cta";
import { BreadcrumbJsonLd, FaqPageJsonLd } from "@/components/marketing/jsonld";
import { Section } from "@/components/marketing/section";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { EVENT_TYPE_SLUGS, getEventType } from "@/lib/constants/events";
import { EVENT_PRESENTATION } from "@/lib/constants/events-layout";

export function generateStaticParams() {
  return EVENT_TYPE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const eventType = getEventType(slug);
  if (!eventType) return {};
  return {
    title: eventType.navLabel,
    description: eventType.intro,
    alternates: { canonical: `/events/${slug}` },
  };
}

export default async function EventTypePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eventType = getEventType(slug);
  if (!eventType) notFound();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Events", href: "/events" },
          { name: eventType.navLabel, href: `/events/${slug}` },
        ]}
      />
      <FaqPageJsonLd items={eventType.faq} />

      <section className="border-b">
        <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <Link
            href="/events"
            className="text-sm font-medium text-brand transition-colors duration-150 hover:text-brand/80"
          >
            Events
          </Link>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tighter text-balance sm:text-5xl">
            {eventType.headline}
          </h1>
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
            {eventType.subhead}
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
          {eventFrame(EVENT_PRESENTATION[slug].frame, "hero", slug)}
        </Container>
      </section>

      <Section>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-lg text-pretty text-muted-foreground">
            {eventType.intro}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {eventType.nestedThemes.map((theme) => (
              <span
                key={theme}
                className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      </Section>

      <BuiltFor
        layout={EVENT_PRESENTATION[slug].builtFor}
        help={eventType.howItHelps}
        navLabel={eventType.navLabel}
        className="bg-muted/30"
      />

      <Section eyebrow="FAQ" heading="Common questions">
        <div className="mx-auto mt-12 max-w-2xl divide-y rounded-xl border">
          {eventType.faq.map((item) => (
            <details key={item.q} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium">
                {item.q}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-open:rotate-180" />
              </summary>
              <p className="pb-4 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <FinalCta />
    </>
  );
}

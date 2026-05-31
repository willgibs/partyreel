import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AlbumFrame } from "@/components/marketing/album-frame";
import { FinalCta } from "@/components/marketing/final-cta";
import {
  BreadcrumbJsonLd,
  FaqPageJsonLd,
} from "@/components/marketing/jsonld";
import { Section } from "@/components/marketing/section";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { getUseCase, USE_CASE_SLUGS } from "@/lib/constants/use-cases";

export function generateStaticParams() {
  return USE_CASE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const useCase = getUseCase(slug);
  if (!useCase) return {};
  return {
    title: useCase.navLabel,
    description: useCase.intro,
    alternates: { canonical: `/use-cases/${slug}` },
  };
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const useCase = getUseCase(slug);
  if (!useCase) notFound();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Use cases", href: "/use-cases" },
          { name: useCase.navLabel, href: `/use-cases/${slug}` },
        ]}
      />
      <FaqPageJsonLd items={useCase.faq} />

      <section className="border-b">
        <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <Link
            href="/use-cases"
            className="text-sm font-medium text-brand transition-colors duration-150 hover:text-brand/80"
          >
            Use cases
          </Link>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tighter text-balance sm:text-5xl">
            {useCase.headline}
          </h1>
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
            {useCase.subhead}
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
          <AlbumFrame
            className="mt-12 max-w-3xl"
            label={`partyreel.com/a/${slug}`}
          />
        </Container>
      </section>

      <Section>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-lg text-pretty text-muted-foreground">
            {useCase.intro}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {useCase.nestedThemes.map((theme) => (
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

      <Section
        className="bg-muted/30"
        eyebrow="Why Partyreel"
        heading={`Built for ${useCase.navLabel.toLowerCase()}`}
      >
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {useCase.howItHelps.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-heading text-base font-medium">
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="FAQ" heading="Common questions">
        <div className="mx-auto mt-12 max-w-2xl divide-y rounded-xl border">
          {useCase.faq.map((item) => (
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

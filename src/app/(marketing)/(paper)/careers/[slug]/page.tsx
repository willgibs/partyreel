import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { getJob, JOB_SLUGS } from "@/lib/constants/careers";

import { ApplicationForm } from "./application-form";

export function generateStaticParams() {
  return JOB_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = getJob(slug);
  if (!job) return {};
  return {
    title: job.title,
    description: job.summary,
    alternates: { canonical: `/careers/${slug}` },
  };
}

export default async function RolePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = getJob(slug);
  if (!job) notFound();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Careers", href: "/careers" },
          { name: job.title, href: `/careers/${slug}` },
        ]}
      />
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/careers"
            className="text-sm font-medium text-brand transition-colors duration-150 hover:text-brand/80"
          >
            ← Careers
          </Link>
          <h1 className="mt-4 text-4xl font-semibold tracking-tighter text-balance sm:text-5xl">
            {job.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">{job.team}</Badge>
            <Badge variant="secondary">{job.type}</Badge>
            {job.location && <Badge variant="secondary">{job.location}</Badge>}
          </div>
          <p className="mt-6 text-lg text-pretty text-muted-foreground">
            {job.summary}
          </p>

          {job.responsibilities.length > 0 && (
            <RoleList heading="What you'll do" items={job.responsibilities} />
          )}
          {job.requirements.length > 0 && (
            <RoleList
              heading="What we're looking for"
              items={job.requirements}
            />
          )}
          {job.offer && job.offer.length > 0 && (
            <div className="mt-10 rounded-xl border bg-muted/30 p-6">
              <h2 className="font-heading text-base font-medium">
                What we offer
              </h2>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {job.offer.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-12 border-t pt-10">
            <h2 className="text-2xl font-semibold tracking-tight">Apply</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Send us a note and any links. We read every application.
            </p>
            <div className="mt-6">
              <ApplicationForm roleSlug={job.slug} roleTitle={job.title} />
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}

function RoleList({ heading, items }: { heading: string; items: string[] }) {
  return (
    <div className="mt-10">
      <h2 className="font-heading text-lg font-medium">{heading}</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 text-sm text-muted-foreground"
          >
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

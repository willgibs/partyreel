import { ArrowLeft, Check } from "lucide-react";
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

// The paper type ladder (2026-08-25 ruling): H1 4xl/5xl in the heading face,
// role sections step below at xl/2xl (the old text-lg h2s sat too close to the
// body and left a hierarchy cliff under the 5xl title).
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
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/careers"
            className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            <ArrowLeft className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
            Careers
          </Link>
          <h1 className="mt-6 font-heading text-4xl text-balance sm:text-5xl">
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
            <div className="mt-12 rounded-2xl border bg-muted/30 p-6 sm:p-7">
              <h2 className="font-heading text-lg font-medium">
                What we offer
              </h2>
              {/* The page's one accent moment: green checks read as "included"
                  (a real state color, per the achromatic-plus-accents ruling). */}
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-muted-foreground">
                {job.offer.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-success" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-14 border-t pt-10">
            <h2 className="font-heading text-2xl tracking-tight">Apply</h2>
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
    <div className="mt-12">
      <h2 className="font-heading text-xl tracking-tight sm:text-2xl">
        {heading}
      </h2>
      <ul className="mt-5 flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
          >
            <span className="mt-[0.55rem] size-1.5 shrink-0 rounded-full bg-foreground/50" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

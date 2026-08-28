import { ArrowLeft, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
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

/**
 * THE ROLE PAGE (rebuilt, the careers round 2026-08-28).
 *
 *   dark header (identity + the facts + an apply jump) -> PAPER (the
 *   description and the form).
 *
 * The chapter cut carries the meaning: the room introduces the role, then the
 * job turns the page to paper, because a listing and an application ARE
 * documents (the same move /pricing ruled for the money). It also gives the
 * form a light, high-contrast surface without a nested `.dark`.
 *
 * NO JobPosting JSON-LD, deliberately: Will's ruling is that the listing is
 * real intent but placeholder copy, and machine-readable structured data would
 * publish a vacancy commitment we are not ready to make (Google also penalises
 * stale and expired postings). It goes in when the listing is final.
 *
 * H1 keeps the ARTICLE exemption from the marketing type ladder: long titles
 * stop at lg:text-6xl rather than the 7xl a standard marketing page reaches.
 */
export default async function RolePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = getJob(slug);
  if (!job) notFound();

  const facts = [job.team, job.type, job.location].filter(Boolean);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Careers", href: "/careers" },
          { name: job.title, href: `/careers/${slug}` },
        ]}
      />

      {/* The room: who the role is, and a door straight to the form for anyone
          who arrived already convinced (a shared link should not force a scroll
          through the whole description before it offers an action). */}
      <section className="border-b border-foreground/10">
        <Container className="py-14 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/careers"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <ArrowLeft className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
              All roles
            </Link>
            <h1 className="mt-6 font-heading text-4xl text-balance sm:text-5xl lg:text-6xl">
              {job.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
              {job.summary}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button asChild className="h-10 px-5">
                <Link href="#apply">Apply</Link>
              </Button>
              {facts.length > 0 && (
                <span className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
                  {facts.map((fact, i) => (
                    <span key={fact} className="flex items-center gap-2.5">
                      {i > 0 && (
                        <span aria-hidden className="text-foreground/20">
                          /
                        </span>
                      )}
                      {fact}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* The document. */}
      <PaperChapter>
        <section className="scroll-mt-[calc(var(--mkt-header-h)+1rem)] py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-3xl">
              {job.responsibilities.length > 0 && (
                <RoleList heading="What you'll do" items={job.responsibilities} />
              )}
              {job.requirements.length > 0 && (
                <RoleList
                  heading="What we're looking for"
                  items={job.requirements}
                  first={job.responsibilities.length === 0}
                />
              )}

              {job.offer && job.offer.length > 0 && (
                <div className="mt-12 rounded-sm border bg-muted/40 p-6 sm:p-7">
                  <Eyebrow>What we offer</Eyebrow>
                  {/* The page's one accent moment: green checks read as
                      "included" (a real state color, per the achromatic-plus-
                      accents ruling). */}
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

              <div id="apply" className="mt-14 scroll-mt-[calc(var(--mkt-header-h)+1rem)] border-t pt-10">
                <h2 className="font-heading text-2xl">Apply</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Send a link to something you made, and a line about why this
                  one. We read every application.
                </p>
                <div className="mt-7">
                  <ApplicationForm roleSlug={job.slug} roleTitle={job.title} />
                </div>
              </div>
            </div>
          </Container>
        </section>
      </PaperChapter>
    </>
  );
}

function RoleList({
  heading,
  items,
  first = false,
}: {
  heading: string;
  items: string[];
  first?: boolean;
}) {
  return (
    <div className={first ? "" : "mt-12 first:mt-0"}>
      <h2 className="font-heading text-xl sm:text-2xl">{heading}</h2>
      <ul className="mt-5 flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
          >
            <span className="mt-[0.55rem] size-1.5 shrink-0 rounded-full bg-foreground/40" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

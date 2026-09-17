import { ArrowLeft, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { RoleEmblem } from "@/components/marketing/sections/careers/role-emblem";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import { getJob, JOB_SLUGS, type JobOpening } from "@/lib/constants/careers";

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
 * THE ROLE PAGE - a SPEC SHEET (ruled 2026-08-29).
 *
 *   CINEMA  the title block
 *   PAPER   the document: a reading column beside a sticky spec rail
 *   PAPER   the application chapter, on its own gray band
 *   INK     the footer
 *
 * ! DELIBERATELY NO HERO MEDIA. The hub argues in photographs; this page is
 *   where somebody DECIDES, and it wants information density instead. A
 *   candidate-facing frame borrowed from the contact sheet was considered and
 *   dropped: an image unrelated to the actual role reads as decoration ("may
 *   feel weird on the page"). The restraint directly after a photographic hub
 *   is the point, not an omission.
 *
 * The two-column shape is the house's paper-document family, shared with help
 * articles and the legal shell, so the reading surfaces feel like one thing.
 * ★ `lg:self-stretch` on the rail is LOAD-BEARING: the row's `lg:items-start`
 *   otherwise collapses the aside to its content height and sticky gets zero
 *   travel, so the rail never tracks (live-caught on the help ToC).
 *
 * NO JobPosting JSON-LD while the listing is placeholder copy (Will's ruling):
 * machine-readable structured data would publish a vacancy commitment we are
 * not ready to make, and stale postings are penalised.
 */
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

      {/* The title block. A shared link should offer an action before it asks
          for a scroll, so Apply sits up here as well as in the rail. */}
      <section className="border-b border-foreground/10">
        <Container className="py-14 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <Link
              href="/careers"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <ArrowLeft className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
              All roles
            </Link>
            {/* The avatar. It is the same emblem the listing card carried, and
                the view transition morphs one into the other, so arriving here
                feels like following a thing rather than loading a page. */}
            <RoleEmblem slug={job.slug} size="header" target className="mt-9" />
            <div className="mt-6">
              <Eyebrow>{job.catchAll ? "Always open" : "Open role"}</Eyebrow>
            </div>
            <h1 className="mt-3 max-w-3xl font-heading text-chapter text-balance">
              {job.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
              {job.summary}
            </p>
            <Button asChild className="mt-8 h-10 px-5">
              <Link
                href="#apply"
                {...trackAttrs("cta_click", {
                  cta: `apply-${job.slug}`,
                  location: "role-header",
                })}
              >
                Apply
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      <PaperChapter>
        <section className="py-16 sm:py-20">
          <Container>
            <div className="mx-auto flex max-w-5xl flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
              {/* The rail carries the spec and keeps Apply in reach. It leads
                  on mobile (order-first) because the facts are what a skimmer
                  wants before the prose, and it only turns into a sticky
                  column once there is a column to stick inside. */}
              <aside className="order-first shrink-0 lg:order-last lg:w-60 lg:self-stretch">
                <div className="lg:sticky lg:top-[var(--mkt-rail-top)]">
                  <SpecList job={job} />
                  <Button
                    asChild
                    variant="outline"
                    className="mt-6 hidden h-10 w-full px-5 lg:inline-flex"
                  >
                    <Link
                      href="#apply"
                      {...trackAttrs("cta_click", {
                        cta: `apply-${job.slug}`,
                        location: "role-rail",
                      })}
                    >
                      Apply
                    </Link>
                  </Button>
                </div>
              </aside>

              <div className="min-w-0 max-w-2xl flex-1">
                {job.responsibilities.length > 0 && (
                  <RoleList heading="What you'll do" items={job.responsibilities} />
                )}
                {job.requirements.length > 0 && (
                  <RoleList
                    heading="What we're looking for"
                    items={job.requirements}
                    className={job.responsibilities.length > 0 ? "mt-16" : ""}
                  />
                )}

                {job.offer && job.offer.length > 0 && (
                  <div className="mt-16">
                    <SectionTitle>What we offer</SectionTitle>
                    {/* The page's one accent moment: green checks read as
                        "included" (a real state color, per the achromatic-
                        plus-accents ruling). A different SHAPE from the ruled
                        lists above on purpose, so three sections in a row do
                        not read as one long undifferentiated column. */}
                    <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                      {job.offer.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2.5 rounded-sm border bg-muted/40 px-4 py-3 text-sm"
                        >
                          <Check className="size-4 shrink-0 text-success" aria-hidden />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>

        {/* THE APPLICATION CHAPTER. Its own band so it reads as a separate
            room rather than the tail of the description, with the context a
            candidate wants at the moment of applying sitting beside the form
            instead of buried above it. The desk structure is the contact
            round's ruling; the figure/ground is inverted here (white card on
            the gray band rather than a gray card on paper) because this band
            IS the separator. */}
        <section
          id="apply"
          className="scroll-mt-[calc(var(--mkt-header-h)+1rem)] border-t bg-muted/40 py-16 sm:py-20"
        >
          <Container>
            <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
              <div className="flex flex-col gap-5 lg:pt-1">
                <div>
                  <Eyebrow>Apply</Eyebrow>
                  <h2 className="mt-3 font-heading text-prose text-balance">
                    {job.catchAll
                      ? "Tell us what you'd want to own."
                      : `Applying for ${job.title}.`}
                  </h2>
                </div>
                <dl className="flex flex-col divide-y border-y text-sm">
                  <ApplyNote term="What we need">
                    A link to something you made, and a line about why this one.
                  </ApplyNote>
                  <ApplyNote term="What you don't need">
                    No resume, no cover letter, and no degree.
                  </ApplyNote>
                  <ApplyNote term="What happens next">
                    We read every application.
                  </ApplyNote>
                </dl>
              </div>
              <ApplicationForm roleSlug={job.slug} roleTitle={job.title} />
            </div>
          </Container>
        </section>
      </PaperChapter>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-heading text-xl sm:text-2xl">{children}</h2>;
}

/** The spec, as labelled pairs. A slashed inline run reads as a caption; a
 *  spec sheet wants terms and values you can scan down. */
function SpecList({ job }: { job: JobOpening }) {
  const rows = [
    { term: "Team", value: job.team },
    { term: "Type", value: job.type },
    { term: "Location", value: job.location },
  ].filter((row) => Boolean(row.value));

  return (
    <>
      <Eyebrow>The role</Eyebrow>
      <dl className="mt-4 flex flex-col divide-y border-y">
        {rows.map(({ term, value }) => (
          <div key={term} className="flex items-baseline gap-4 py-3">
            <dt className="w-20 shrink-0 text-xs text-muted-foreground">
              {term}
            </dt>
            <dd className="text-sm">{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function ApplyNote({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  // STACKED, never a two-column row: this list lives in a 20rem rail, where a
  // fixed label column left the values a ~150px gutter and every answer wrapped
  // to three ragged lines.
  return (
    <div className="flex flex-col gap-1.5 py-4">
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">
        {term}
      </dt>
      <dd className="text-[15px] leading-relaxed text-pretty">{children}</dd>
    </div>
  );
}

/** Ruled rows, not dot-bullets: a spec sheet's items are entries in a document,
 *  and a hairline per row gives the column a rhythm you can scan. */
function RoleList({
  heading,
  items,
  className,
}: {
  heading: string;
  items: string[];
  className?: string;
}) {
  return (
    <div className={className}>
      <SectionTitle>{heading}</SectionTitle>
      <ul className="mt-5 flex flex-col divide-y border-y">
        {items.map((item) => (
          <li
            key={item}
            className="py-4 text-[15px] leading-relaxed text-pretty text-muted-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

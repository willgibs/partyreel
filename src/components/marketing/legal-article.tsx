import type { ReactNode } from "react";

import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Container } from "@/components/shared/container";

/**
 * THE LEGAL PAGE SHELL (R5, ruled 2026-08-26): privacy + terms share this one
 * layout so the UI is FINAL while the words stay drafts. The contract:
 *
 *  - Each section carries TWO registers: `summary` ("In short", the
 *    plain-language line that STAYS forever) and `body` (today: accurate
 *    plain-language draft paragraphs; later: the counsel-reviewed formal text
 *    the dedicated legal agent writes IN PLACE, section by section).
 *  - The visible draft notice renders until `draft` is flipped off at legal
 *    sign-off; the effective date replaces the status line at the same time.
 *  - Section ids are the anchor contract (the ToC + any deep links ride
 *    them); the legal agent must keep ids stable while rewriting bodies.
 *
 * Layout mirrors the help-article page (two-column, sticky rail) so the paper
 * reading surfaces feel like one family.
 */
export type LegalSection = {
  /** Stable anchor id (kebab-case). The legal agent keeps these unchanged. */
  id: string;
  title: string;
  /** The plain-language "In short" line. Survives the legal rewrite. */
  summary: string;
  /** Draft paragraphs today; the formal text later. */
  body: ReactNode[];
};

export function LegalArticle({
  title,
  statusLine,
  draft = true,
  sections,
}: {
  title: string;
  /** The mono line under the H1 (e.g. "Pre-launch draft · Effective date to come"). */
  statusLine: string;
  draft?: boolean;
  sections: LegalSection[];
}) {
  return (
    <Container className="max-w-5xl py-16 sm:py-20">
      <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
        <div className="min-w-0 max-w-2xl flex-1">
          <h1 className="font-heading text-4xl text-balance sm:text-5xl">
            {title}
          </h1>
          <MonoCaption className="mt-4">{statusLine}</MonoCaption>

          {draft && (
            <aside
              aria-label="Draft status"
              className="mt-8 rounded-2xl border bg-muted/30 p-5 text-sm leading-6"
            >
              <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                A plain-language draft
              </p>
              <p className="mt-2 text-pretty text-muted-foreground">
                This page says, in plain words, how Partyreel actually works
                today. Before public launch it will be finalized and reviewed
                by counsel; the short summaries will stay right beside the
                formal text, because you should never need a law degree to
                know where your photos stand.
              </p>
            </aside>
          )}

          <div className="mt-4 divide-y">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-[calc(var(--mkt-header-h)+1.5rem)] py-8"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs tracking-wider text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-heading text-xl text-balance sm:text-2xl">
                    {section.title}
                  </h2>
                </div>
                <p className="mt-3 border-l-2 pl-4 text-sm leading-6 font-medium text-pretty">
                  <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                    In short:{" "}
                  </span>
                  {section.summary}
                </p>
                <div className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
                  {section.body.map((paragraph, i) => (
                    <p key={i} className="text-pretty">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* The rail: sticky section index (the help-article ToC family). */}
        <aside className="hidden lg:block lg:w-56 lg:shrink-0">
          <nav
            aria-label="On this page"
            className="sticky top-24 border-l pl-5"
          >
            <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
              On this page
            </p>
            <ol className="mt-3 flex flex-col gap-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      </div>
    </Container>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { breadcrumbs } from "@/app/(dev)/design/_data/catalog";
import { CopyLink, CopyPage } from "./copy";
import { useReportPageFacts } from "./page-facts";
import { LabLink, useNav } from "./shell-context";
import { Toc } from "./toc";

/**
 * EVERY PAGE OPENS THE SAME WAY (the Library x Lab round, 2026-09-15): the
 * breadcrumbs (area, section, item, from the nav and the pathname, so a page
 * never writes its own), the title, one paragraph, the status pills, the meta
 * pairs and the actions (Copy link and Copy page always; a page adds its own).
 * The pages differ below the header, never in it.
 *
 * It is also where Copy page gets its FACTS: the title and the trail as the
 * page passed them (page-facts.ts), exact by construction. The rest of the
 * header (the description, the pills, the meta pairs) is read from the rendered
 * header by structure, because those values are often elements rather than
 * strings. The header carries `data-copy-skip` so the BODY pass leaves it to
 * the head, and the pill row `data-copy-row` so it copies as one line.
 *
 * IT ALSO CLOSES WITH THE NARROW-WINDOW TABLE OF CONTENTS (the sweep,
 * 2026-09-16), below 1280 where there is no rail. It used to open the content
 * column instead, above the breadcrumbs, so a page announced its section list
 * before it said what it was. Last in the header is the right place: a reader
 * decides whether to jump after the title and the one line, not before them. On
 * a board it renders nothing (design.css hides it on a wide page, where the
 * dock's Sections menu is the jump control).
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  badges,
  meta,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  /** Replaces the breadcrumbs (a board's surface); rare. */
  eyebrow?: React.ReactNode;
  badges?: React.ReactNode;
  meta?: [string, React.ReactNode][];
  actions?: React.ReactNode;
}) {
  const nav = useNav();
  const pathname = usePathname();
  const crumbs = breadcrumbs(nav, pathname);

  useReportPageFacts({ title, breadcrumbs: crumbs.map((c) => c.label) });

  return (
    <header className="pt-6" data-copy-skip>
      {/* The trail and the actions are chrome, and the title is already the
          copy's `# ` line: Copy page reads the rest of this header. */}
      <div
        className="flex flex-wrap items-center justify-between gap-2"
        data-copy-skip
      >
        {eyebrow ?? (
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
          >
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3 opacity-60" />}
                {i === crumbs.length - 1 ? (
                  <span className="text-foreground/80">{c.label}</span>
                ) : (
                  <LabLink
                    href={c.href}
                    className="transition-colors duration-90 hover:text-foreground"
                  >
                    {c.label}
                  </LabLink>
                )}
              </span>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-1.5">
          {actions}
          <CopyLink className="hidden sm:inline-flex" />
          <CopyPage />
        </div>
      </div>
      <h1
        className="mt-2 font-heading text-3xl tracking-tight text-balance"
        data-copy-skip
      >
        {title}
      </h1>
      {description && (
        <div className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </div>
      )}
      {badges && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5" data-copy-row>
          {badges}
        </div>
      )}
      {meta && meta.length > 0 && (
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
          {meta.map(([k, v]) => (
            <div key={k} className="flex gap-1.5">
              <dt className="font-medium text-foreground/70">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <Toc variant="inline" />
    </header>
  );
}

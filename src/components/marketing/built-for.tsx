import Link from "next/link";
import type { CSSProperties } from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import type { EventTypeHelp } from "@/lib/constants/events";
import { FOOTER_NAV } from "@/lib/constants/marketing-nav";

/**
 * The "Built for X" benefits section, ONE grammar across the whole events
 * family (R4, A20). Four sibling pages used to run four different layout
 * systems — a featured bento, a divided row list, a hairline windowpane, and a
 * numbered timeline — so moving between them felt like moving between
 * templates, and three of the four stranded 400-500px of void beside a narrow
 * column. The windowpane read strongest, so every page (and the /events hub)
 * now shares it: same cell shape, same header treatment, same reveal.
 *
 * Distinctiveness moved to where it belongs: the per-type hero artifact, the
 * copy, and the per-type reel line. LAYOUT is the family resemblance.
 *
 * A37: the trips variant used to number its cells 01-04, which read as STEPS
 * and collided with the home page's real scene steps. Benefits are not a
 * sequence; the numbers are gone.
 */
export function BuiltFor({
  help,
  navLabel,
  className,
}: {
  help: EventTypeHelp[];
  navLabel: string;
  className?: string;
}) {
  return (
    <SectionShell
      className={className}
      eyebrow="Why Partyreel"
      heading={`Built for ${navLabel.toLowerCase()}`}
    >
      <HelpPane help={help} />
    </SectionShell>
  );
}

const FEATURE_LINKS =
  FOOTER_NAV.find((column) => column.title === "Features")?.links ?? [];

/** The destination's own nav label, so a crosslink never invents a name for a
 *  page that already has one. */
function featureLabel(href: string): string {
  return (
    FEATURE_LINKS.find((link) => link.href === href)?.label ?? "Learn more"
  );
}

/** Shared mono hairline icon chip (the marketing section vocabulary). */
function Chip({ icon: Icon }: { icon: EventTypeHelp["icon"] }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border text-muted-foreground">
      <Icon className="size-5" strokeWidth={1.5} />
    </span>
  );
}

/**
 * The hairline windowpane: one bordered container split by hairlines (the
 * gap-px over bg-border trick reveals the lines). Also the /events hub's
 * benefits grid, so hub and type pages read as one family.
 *
 * A11: the ladder links used to hang off SOME cell titles as a bare chevron,
 * which made an identical-looking set of cells randomly clickable. Now a linked
 * cell carries a quiet bottom row naming its destination, pinned to the cell
 * floor (mt-auto) so the linked cells line up and the asymmetry reads as a
 * deliberate extra, not a missing one.
 */
export function HelpPane({
  help,
  /** First stagger slot: SectionShell's header spends 0 (eyebrow) and 1
   *  (heading), so the cells continue the same choreography. */
  startIndex = 2,
}: {
  help: EventTypeHelp[];
  startIndex?: number;
}) {
  return (
    <Reveal className="mx-auto mt-12 grid max-w-3xl gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
      {help.map(({ icon, title, body, featureHref }, i) => (
        <div
          key={title}
          data-mkt-reveal
          style={{ "--i": i + startIndex } as CSSProperties}
          className="flex flex-col bg-card p-6 sm:p-8"
        >
          <Chip icon={icon} />
          <h3 className="mt-4 font-heading text-base sm:text-lg">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          {featureHref && (
            <Link
              href={featureHref}
              className="mkt-learn mt-auto inline-flex w-fit items-center gap-1.5 pt-5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {featureLabel(featureHref)}
              <LearnChevron />
            </Link>
          )}
        </div>
      ))}
    </Reveal>
  );
}

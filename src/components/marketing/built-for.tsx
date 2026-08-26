import Link from "next/link";
import type { CSSProperties } from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import type { EventTypeHelp } from "@/lib/constants/events";
import type { BuiltForLayout } from "@/lib/constants/events-layout";

/**
 * The "Built for X" benefits section (B2 re-skin; survives per the T2.5
 * architecture table). Renders the SAME howItHelps[] in a DISTINCT layout per
 * event type (the "no two pages alike" bar): a featured-first bento (weddings),
 * icon-left rows (parties), a four-quadrant windowpane (conferences), or a
 * numbered timeline (trips). Rebuilt onto the system layer: SectionShell
 * rhythm + the standard reveal register, mono hairline chips (achromatic base;
 * the old brand tints dropped with the retired accent). LAYOUT varies, the
 * grayscale system does not.
 */
export function BuiltFor({
  layout,
  help,
  navLabel,
  className,
}: {
  layout: BuiltForLayout;
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
      {layout === "bento" && <Bento help={help} />}
      {layout === "rows" && <Rows help={help} />}
      {layout === "grid2x2" && <Quadrants help={help} />}
      {layout === "list" && <Timeline help={help} />}
    </SectionShell>
  );
}

/** A cell title that becomes a ladder link when the constants give it a
 *  featureHref (the expansion round's use-case-to-feature web): the title
 *  renders as a learn-more into its feature page; plain cells stay plain. */
function HelpTitle({
  title,
  featureHref,
  className,
}: {
  title: string;
  featureHref?: string;
  className: string;
}) {
  if (!featureHref) return <h3 className={className}>{title}</h3>;
  return (
    <h3 className={className}>
      <Link
        href={featureHref}
        className="mkt-learn inline-flex items-center gap-1.5 transition-colors duration-150 hover:text-muted-foreground"
      >
        {title}
        <LearnChevron />
      </Link>
    </h3>
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

const mark = (i: number) => ({
  "data-mkt-reveal": "",
  style: { "--i": i } as CSSProperties,
});

// weddings — featured-first bento: the lead benefit spans the row, then a 3-up.
function Bento({ help }: { help: EventTypeHelp[] }) {
  const [lead, ...rest] = help;
  return (
    <Reveal className="mx-auto mt-12 grid max-w-5xl gap-5">
      {lead && (
        <div
          {...mark(0)}
          className="flex flex-col gap-4 rounded-xl border bg-card/60 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8"
        >
          <Chip icon={lead.icon} />
          <div>
            <HelpTitle
              title={lead.title}
              featureHref={lead.featureHref}
              className="font-heading text-lg sm:text-xl"
            />
            <p className="mt-1 text-sm text-muted-foreground">{lead.body}</p>
          </div>
        </div>
      )}
      {rest.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-3">
          {rest.map(({ icon, title, body, featureHref }, i) => (
            <div
              key={title}
              {...mark(i + 1)}
              className="rounded-xl border bg-card/60 p-6"
            >
              <Chip icon={icon} />
              <HelpTitle
                title={title}
                featureHref={featureHref}
                className="mt-4 font-heading text-base sm:text-lg"
              />
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      )}
    </Reveal>
  );
}

// parties — icon-left rows in one bordered, divided list (reads as a checklist,
// distinct from a card grid).
function Rows({ help }: { help: EventTypeHelp[] }) {
  return (
    <Reveal className="mx-auto mt-12 max-w-2xl divide-y rounded-xl border bg-card/40">
      {help.map(({ icon, title, body, featureHref }, i) => (
        <div key={title} {...mark(i)} className="flex items-start gap-4 p-5">
          <Chip icon={icon} />
          <div>
            <HelpTitle
              title={title}
              featureHref={featureHref}
              className="font-heading text-base sm:text-lg"
            />
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        </div>
      ))}
    </Reveal>
  );
}

// conferences — four-quadrant "windowpane": one bordered container split by
// hairline dividers (the gap-px over bg-border trick reveals the lines).
function Quadrants({ help }: { help: EventTypeHelp[] }) {
  return (
    <Reveal className="mx-auto mt-12 grid max-w-3xl gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
      {help.map(({ icon, title, body, featureHref }, i) => (
        <div key={title} {...mark(i)} className="bg-card p-6 sm:p-8">
          <Chip icon={icon} />
          <HelpTitle
            title={title}
            featureHref={featureHref}
            className="mt-4 font-heading text-base sm:text-lg"
          />
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        </div>
      ))}
    </Reveal>
  );
}

// trips — a numbered timeline (icon nodes joined by a connecting line), echoing
// the "from the first airport selfie to the last sunset" journey copy. Numbers
// ride Geist Mono (the timecode vocabulary), not an accent hue.
function Timeline({ help }: { help: EventTypeHelp[] }) {
  return (
    <Reveal>
      <ol className="mx-auto mt-12 flex max-w-xl flex-col">
        {help.map(({ icon: Icon, title, body, featureHref }, i) => (
          <li key={title} {...mark(i)} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground">
                <Icon className="size-5" strokeWidth={1.5} />
              </span>
              {i < help.length - 1 && (
                <span className="w-px flex-1 bg-border" />
              )}
            </div>
            <div className="pb-10">
              <span className="font-mono text-xs font-medium text-muted-foreground tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <HelpTitle
                title={title}
                featureHref={featureHref}
                className="mt-1 font-heading text-base sm:text-lg"
              />
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

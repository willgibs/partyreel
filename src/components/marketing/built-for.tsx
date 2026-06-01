import type { EventTypeHelp } from "@/lib/constants/events";
import type { BuiltForLayout } from "@/lib/constants/events-layout";

import { Section } from "./section";

// The "Built for X" benefits section. Renders the SAME howItHelps[] in a DISTINCT layout
// per event type (the polish-arc "no two pages alike" bar): a featured-first bento
// (weddings), icon-left rows (parties), a four-quadrant windowpane (conferences), or a
// numbered timeline (trips). LAYOUT varies; the grayscale + single-accent system does NOT
// (no per-type colors). Owns its <Section> (eyebrow/heading) like the /features bespoke
// sections do, so the page just hands it a layout + the data.
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
    <Section
      className={className}
      eyebrow="Why Partyreel"
      heading={`Built for ${navLabel.toLowerCase()}`}
    >
      {layout === "bento" && <Bento help={help} />}
      {layout === "rows" && <Rows help={help} />}
      {layout === "grid2x2" && <Quadrants help={help} />}
      {layout === "list" && <Timeline help={help} />}
    </Section>
  );
}

// Shared icon-chip atom (matches the muted chip used across the marketing sections).
function Chip({ icon: Icon }: { icon: EventTypeHelp["icon"] }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
      <Icon className="size-5" />
    </span>
  );
}

// weddings — featured-first bento: the lead benefit spans the row, then a 3-up.
function Bento({ help }: { help: EventTypeHelp[] }) {
  const [lead, ...rest] = help;
  return (
    <div className="mt-14 grid gap-6">
      {lead && (
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
          <Chip icon={lead.icon} />
          <div>
            <h3 className="font-heading text-lg font-medium">{lead.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{lead.body}</p>
          </div>
        </div>
      )}
      {rest.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-3">
          {rest.map(({ icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-6">
              <Chip icon={icon} />
              <h3 className="mt-4 font-heading text-base font-medium">
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// parties — icon-left rows in one bordered, divided list (echoes the FAQ container, reads
// as a checklist, distinct from a card grid).
function Rows({ help }: { help: EventTypeHelp[] }) {
  return (
    <div className="mx-auto mt-12 max-w-2xl divide-y rounded-xl border">
      {help.map(({ icon, title, body }) => (
        <div key={title} className="flex items-start gap-4 p-5">
          <Chip icon={icon} />
          <div>
            <h3 className="font-heading text-base font-medium">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// conferences — four-quadrant "windowpane": one bordered container split by hairline
// dividers (the `gap-px` over a `bg-border` container reveals the lines), distinct from
// the old separated-card grid.
function Quadrants({ help }: { help: EventTypeHelp[] }) {
  return (
    <div className="mx-auto mt-14 grid max-w-3xl gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
      {help.map(({ icon, title, body }) => (
        <div key={title} className="bg-card p-6 sm:p-8">
          <Chip icon={icon} />
          <h3 className="mt-4 font-heading text-base font-medium">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        </div>
      ))}
    </div>
  );
}

// trips — a numbered timeline (icon nodes joined by a connecting line), echoing the
// "from the first airport selfie to the last sunset" journey copy.
function Timeline({ help }: { help: EventTypeHelp[] }) {
  return (
    <ol className="mx-auto mt-12 flex max-w-xl flex-col">
      {help.map(({ icon: Icon, title, body }, i) => (
        <li key={title} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border bg-card text-brand">
              <Icon className="size-5" />
            </span>
            {i < help.length - 1 && <span className="w-px flex-1 bg-border" />}
          </div>
          <div className="pb-10">
            <span className="text-xs font-semibold text-brand tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1 font-heading text-base font-medium">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

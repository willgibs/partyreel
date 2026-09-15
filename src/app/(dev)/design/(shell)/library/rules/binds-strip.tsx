import { cn } from "@/lib/utils";

import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { LabLink } from "@/app/(dev)/design/(shell)/_shell/shell-context";
import {
  type Binds,
  bindsFor,
  type BindsQuery,
  LEVEL_BY_ID,
} from "@/app/(dev)/design/rules/influences";

import { LevelBadge } from "./level-badge";

/**
 * THE BINDS STRIP (the Library x Lab round, 2026-09-15): what THIS board, or
 * THIS track, actually obeys. Server-safe and self-contained, so a board page
 * or a component page mounts it with one import:
 *
 *   <BindsStrip board="palette" surface="shared" />
 *   <BindsStrip ownedPaths={[component.file]} compact />
 *
 * Two things earn it its space. First, the rules a board may REWRITE: a bible
 * rule marked `under exploration: <this board>` is the one thing on the page
 * an agent is allowed to change, and a strip that buried it among twenty-two
 * others would be a list, not an answer. Second, the absences: guidance,
 * precedent, proposals and rulings are deliberately not here, because an agent
 * that reads them as rules builds small (Will, 2026-09-12).
 */
export function BindsStrip({
  compact,
  className,
  ...query
}: BindsQuery & {
  /** One line and the counts, for a component page's header. */
  compact?: boolean;
  className?: string;
}) {
  const binds = bindsFor(query);
  const yours = binds.law.filter((l) => l.yours);
  const retiring = binds.law.filter((l) => l.retiring);

  if (compact) {
    return (
      <p
        className={cn(
          "flex flex-wrap items-baseline gap-x-2 text-[11px] text-muted-foreground",
          className,
        )}
      >
        <LevelBadge level={LEVEL_BY_ID.law} />
        <span>{binds.summary}</span>
        <LabLink
          href="/design/library/rules"
          className="underline-offset-2 hover:underline"
        >
          what binds you
        </LabLink>
      </p>
    );
  }

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card px-4 py-3",
        className,
      )}
      aria-label="What binds this work"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm font-medium">
          What binds {binds.board ? <code>{binds.board}</code> : "this work"}
        </p>
        <LabLink
          href="/design/library/rules"
          className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          the levels
        </LabLink>
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {binds.summary}
      </p>

      {yours.length > 0 && (
        <div className="mt-3 rounded-lg border border-foreground/30 px-3 py-2">
          <p className="text-[11px] font-semibold tracking-wider text-foreground/80 uppercase">
            Yours to rewrite
          </p>
          <ul className="mt-1 space-y-1 text-sm">
            {yours.map(({ rule }) => (
              <li key={rule.id}>
                <Ref to={{ kind: "rule", id: rule.id }} className="font-medium">
                  bible {rule.n}
                </Ref>{" "}
                <span className="text-muted-foreground">{rule.statement}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[11px] text-muted-foreground">
            This board writes what these rules inherit. Their statement is the
            interim law until Will rules.
          </p>
        </div>
      )}

      <dl className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
        <Group
          label="The law"
          level="law"
          note={`All ${binds.law.length}, always.${
            retiring.length
              ? ` ${retiring.length} retiring: read, not obeyed.`
              : ""
          }`}
          items={[]}
        />
        <Group
          label="Contracts you own"
          level="contract"
          note={
            binds.ownedPaths.length === 0
              ? "No paths claimed, so none."
              : `Under ${binds.ownedPaths.join(", ")}.`
          }
          items={binds.contracts.map((c) => ({
            key: c.id,
            label: c.title,
            href: c.visibleAt,
          }))}
        />
        <Group
          label="Policies in scope"
          level="policy"
          note="Mechanical, and provisional: one that blocks better work is a finding."
          items={binds.policies.map((p) => ({
            key: p.id,
            label: p.title,
            href: p.visibleAt,
          }))}
        />
        <Group
          label="Landmines on this surface"
          level="landmine"
          note="Silent breakage on revert. Know them before you touch the surface."
          items={binds.landmines.map((m) => ({
            key: m.id,
            label: m.title,
            href: m.visibleAt,
          }))}
        />
      </dl>

      <p className="mt-3 border-t border-border pt-2 text-[11px] text-muted-foreground">
        Not here on purpose: guidance, precedent, proposals and rulings. They
        inform, and an agent that obeys all of them builds small.
      </p>
    </section>
  );
}

function Group({
  label,
  level,
  note,
  items,
}: {
  label: string;
  level: keyof typeof LEVEL_BY_ID;
  note: string;
  items: { key: string; label: string; href: string }[];
}) {
  return (
    <div>
      <dt className="flex flex-wrap items-baseline gap-2 text-[11px] font-medium">
        <LevelBadge level={LEVEL_BY_ID[level]} />
        <span>{label}</span>
        {items.length > 0 && (
          <span className="text-muted-foreground tabular-nums">
            {items.length}
          </span>
        )}
      </dt>
      <dd className="mt-0.5 text-[11px] text-muted-foreground">{note}</dd>
      {items.length > 0 && (
        <dd className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px]">
          {items.slice(0, 8).map((it) => (
            <LabLink
              key={it.key}
              href={it.href}
              className="truncate underline-offset-2 hover:underline"
              title={it.label}
            >
              {it.label}
            </LabLink>
          ))}
          {items.length > 8 && (
            <span className="text-muted-foreground">
              and {items.length - 8} more
            </span>
          )}
        </dd>
      )}
    </div>
  );
}

export type { Binds };

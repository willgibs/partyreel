import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import type { ContractRecord } from "@/app/(dev)/design/rules/rules";

import type { VariantAxis } from "./entry";
import type { GalleryItem } from "./registry";
import { Playground } from "./playgrounds";
import { Specimen } from "./specimen";
import { specimenCode } from "./specimen-code";

/**
 * THE GALLERY CHROME (server): how one declared component reads on a page.
 *
 * The same pieces render in two places, which is the whole point of the
 * gallery round: a family page shows every entry of its family through
 * `EntryBlock`, and /design/library/<id> composes the same variants,
 * specimens and contracts into the shell's own sections. Nothing here derives
 * a fact: the file, the names, the specimen routes, the contracts and each
 * specimen's source all come off the artifacts through the registry.
 *
 * Every block's heading carries `id="c-<id>"`, which is what puts every
 * component of a family in the table of contents (the Library x Lab round,
 * 2026-09-15) as well as giving the family page a deep link per component.
 */

export function EntryBlock({
  item,
  link,
}: {
  item: GalleryItem;
  link: (href: string) => string;
}) {
  const { entry, record, note, title, file } = item;
  const contracts = record?.contracts ?? [];

  return (
    <section className="border-t border-border pt-6 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3
          id={`c-${entry.id}`}
          className="flex items-baseline gap-2 font-heading text-lg"
        >
          <Link href={link(item.href)} className="hover:underline">
            {title}
          </Link>
          {entry.badge && <Tag badge={entry.badge} />}
        </h3>
        <Link
          href={link(item.href)}
          className="group/open flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          open
          <ArrowUpRight className="size-3 transition-transform duration-150 ease-emphasis group-hover/open:translate-x-px group-hover/open:-translate-y-px" />
        </Link>
      </div>

      {(note?.for || entry.lede) && (
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {entry.lede ?? note?.for}
        </p>
      )}

      {file && (
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <Ref to={{ kind: "source", file }} quiet />
          {record && record.names.length > 1 && (
            <span className="text-muted-foreground/70">
              {record.names.join(" · ")}
            </span>
          )}
        </p>
      )}

      {entry.play && (
        <div className="mt-4">
          <Playground id={entry.play} />
        </div>
      )}

      {entry.variants && entry.variants.length > 0 && (
        <div className="mt-4 space-y-3">
          {entry.variants.map((axis) => (
            <VariantAxisRow key={axis.prop} axis={axis} />
          ))}
        </div>
      )}

      <SpecimenList item={item} className="mt-4" />

      {contracts.length > 0 && (
        <p className="mt-3 text-[11px]">
          <Link
            href={link(item.href)}
            className="text-muted-foreground underline"
          >
            {contracts.length} contract{contracts.length === 1 ? "" : "s"}
          </Link>
        </p>
      )}
    </section>
  );
}

/**
 * Every specimen of an entry, each in the frame, each carrying the JSX its
 * entry module declares it with (specimens.generated.json) so Preview and Code
 * can never disagree.
 */
export function SpecimenList({
  item,
  className,
}: {
  item: GalleryItem;
  className?: string;
}) {
  const { entry } = item;
  if (entry.specimens.length === 0) return null;
  return (
    <div className={cn("grid gap-3", className)}>
      {entry.specimens.map((s, i) => (
        <Specimen
          key={s.label ?? i}
          label={s.label}
          hint={s.hint}
          bleed={s.bleed}
          skin={s.skin}
          contentClassName={s.contentClassName}
          code={specimenCode(entry.id, i)}
        >
          {s.node}
        </Specimen>
      ))}
    </div>
  );
}

/** One declared axis: the prop, where the list comes from, and every value. */
export function VariantAxisRow({ axis }: { axis: VariantAxis }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <code className="font-sans text-[12px] font-medium">{axis.prop}</code>
        <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
          {axis.source}
        </span>
        {axis.fallback && (
          <span className="text-[11px] text-muted-foreground">
            defaults to {axis.fallback}
          </span>
        )}
      </p>
      {axis.note && (
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {axis.note}
        </p>
      )}
      {axis.sample ? (
        <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-4">
          {axis.options.map((o) => (
            <div key={o} className="flex flex-col items-start gap-1.5">
              <div>{axis.sample?.(o)}</div>
              <span className="text-[10px] text-muted-foreground">{o}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1">
          {axis.options.map((o) => (
            <span
              key={o}
              className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {o}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A component's contracts: the ONLY rules that bind this one file, each a link
 * to the `it()` that holds it. A contract guards a component's function
 * (structure, accessibility, single sources, its engine), never its look.
 */
export function ContractList({ contracts }: { contracts: ContractRecord[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {contracts.map((k) => (
        <li
          key={`${k.file}:${k.line}`}
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2.5 text-sm"
        >
          <span className="min-w-0">
            {k.suite.length > 0 && (
              <span className="text-muted-foreground">
                {k.suite.join(" > ")} ·{" "}
              </span>
            )}
            {k.title}
          </span>
          <Ref
            to={{ kind: "source", file: k.file, line: k.line }}
            quiet
            className="text-[11px]"
          />
        </li>
      ))}
    </ul>
  );
}

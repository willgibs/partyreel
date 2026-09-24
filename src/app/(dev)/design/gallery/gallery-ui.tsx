import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";

import type { VariantAxis } from "./entry";
import type { GalleryItem } from "./registry";
import { Playground } from "./playgrounds";
import { Specimen } from "./specimen";
import { specimenCode } from "./specimen-code";

/**
 * THE GALLERY CHROME (server): how one catalog entry reads on a page.
 *
 * The same pieces render in two places: a family page shows every entry of
 * its family through `EntryBlock`, and /design/library/<id> composes the same
 * variants and specimens into the shell's own sections. Nothing here derives
 * a fact: the file, the `for` line, the test and each specimen's source all
 * come off the entry (and specimens.generated.json) through the registry.
 *
 * Every block's heading carries `id="c-<id>"`, which puts every component of
 * a family in the table of contents and gives the family page a deep link per
 * component.
 */

export function EntryBlock({
  item,
  link,
}: {
  item: GalleryItem;
  link: (href: string) => string;
}) {
  const { entry, title, file } = item;

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

      {(entry.for || entry.lede) && (
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {entry.lede ?? entry.for}
        </p>
      )}

      <FileLine file={file} test={entry.test} className="mt-1.5" />

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
    </section>
  );
}

/**
 * The entry's one meta line: the component's file and, when a test pins its
 * behavior, that test. Both link to the source (the editor when the reader
 * has set a root, GitHub always), because a test is read, not rendered.
 */
export function FileLine({
  file,
  test,
  className,
}: {
  file: string;
  test?: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11px] text-muted-foreground",
        className,
      )}
    >
      <Ref to={{ kind: "source", file }} quiet />
      {test && (
        <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
          <span>behavior pinned by</span>
          <Ref to={{ kind: "source", file: test }} quiet />
        </span>
      )}
    </p>
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

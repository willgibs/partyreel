import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

import type { VariantAxis } from "./entry";
import { FAMILY_LABEL, FAMILY_ROUTE, type GalleryItem } from "./registry";
import { Playground } from "./playgrounds";
import { Stage } from "./stage";

/**
 * THE GALLERY CHROME (server): how one declared component reads on a page.
 *
 * One block renders in two places, which is the whole point of the round: the
 * family page shows every entry of its family, and /design/library/<id> shows
 * one of them with its contracts open. Nothing here derives a fact: the file,
 * the names, the specimen routes and the contracts all come off the artifact
 * through the registry.
 */

export function EntryBlock({
  item,
  link,
  detail = false,
}: {
  item: GalleryItem;
  link: (href: string) => string;
  /** The permalink view: contracts expanded, no "open" affordance. */
  detail?: boolean;
}) {
  const { entry, record, note, title, file } = item;
  const contracts = record?.contracts ?? [];

  return (
    <section
      id={`c-${entry.id}`}
      className="scroll-mt-6 border-t border-border pt-6 first:border-t-0 first:pt-0"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className={cn("font-heading", detail ? "text-3xl" : "text-lg")}>
          {detail ? (
            title
          ) : (
            <Link href={link(item.href)} className="hover:underline">
              {title}
            </Link>
          )}
        </h3>
        {!detail && (
          <Link
            href={link(item.href)}
            className="group/open flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            open
            <ArrowUpRight className="size-3 transition-transform duration-150 ease-emphasis group-hover/open:translate-x-px group-hover/open:-translate-y-px" />
          </Link>
        )}
      </div>

      {(note?.for || entry.lede) && (
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {entry.lede ?? note?.for}
        </p>
      )}

      {file && (
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <SourceLink file={file} />
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

      {entry.specimens.length > 0 && (
        <div className="mt-4 grid gap-3">
          {entry.specimens.map((s, i) => (
            <Stage
              key={s.label ?? i}
              label={s.label}
              hint={s.hint}
              bleed={s.bleed}
              skin={s.skin}
              contentClassName={s.contentClassName}
            >
              {s.node}
            </Stage>
          ))}
        </div>
      )}

      {contracts.length > 0 &&
        (detail ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
            <p className="border-b border-border px-4 py-2.5 text-[13px] font-medium">
              Contracts
              <span className="ml-2 text-[11px] text-muted-foreground tabular-nums">
                {contracts.length}
              </span>
            </p>
            <ul className="divide-y divide-border">
              {contracts.map((k) => (
                <li
                  key={`${k.file}:${k.line}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2 text-sm"
                >
                  <span>
                    {k.suite.length > 0 && (
                      <span className="text-muted-foreground">
                        {k.suite.join(" > ")} ·{" "}
                      </span>
                    )}
                    {k.title}
                  </span>
                  <SourceLink
                    file={k.file}
                    line={k.line}
                    className="text-[11px] text-muted-foreground"
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-3 text-[11px]">
            <Link
              href={link(item.href)}
              className="text-muted-foreground underline"
            >
              {contracts.length} contract{contracts.length === 1 ? "" : "s"}
            </Link>
          </p>
        ))}
    </section>
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
 * The gallery header a family page opens with: what the family is, how much of
 * it there is, and the counts an agent scans for.
 */
export function GalleryCounts({ items }: { items: GalleryItem[] }) {
  const specimens = items.reduce((n, i) => n + i.entry.specimens.length, 0);
  const variants = items.reduce(
    (n, i) =>
      n + (i.entry.variants ?? []).reduce((m, v) => m + v.options.length, 0),
    0,
  );
  const contracts = items.reduce(
    (n, i) => n + (i.record?.contracts.length ?? 0),
    0,
  );
  const rows: [string, number][] = [
    ["components", items.length],
    ["specimens", specimens],
    ["variants", variants],
    ["contracts", contracts],
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {rows.map(([label, n]) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-card px-4 py-3"
        >
          <p className="font-heading text-2xl">{n}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

/** A family page's section heading: the organizer above a run of entries. */
export function GallerySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-12">
      <h2 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="mt-5 space-y-6">{children}</div>
    </section>
  );
}

export function FamilyCrumb({
  family,
  link,
}: {
  family: keyof typeof FAMILY_LABEL;
  link: (href: string) => string;
}) {
  return (
    <Link
      href={link(FAMILY_ROUTE[family])}
      className="text-xs font-medium tracking-widest text-muted-foreground uppercase hover:text-foreground"
    >
      {FAMILY_LABEL[family]}
    </Link>
  );
}

/**
 * The path, monospace, opening in the editor on Will's machine and on GitHub.
 * The same affordance /design/rules carries; fold the two into one the next
 * time that page is touched (it is another track's lane this round).
 */
export function SourceLink({
  file,
  line,
  className,
}: {
  file: string;
  line?: number;
  className?: string;
}) {
  const at = line ? `${file}:${line}` : file;
  const vscode = `vscode://file${process.cwd()}/${file}${line ? `:${line}` : ""}`;
  const gh = `https://github.com/willgibs/partyreel/blob/launch-prep/${file}${line ? `#L${line}` : ""}`;
  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <a href={vscode} className="break-all hover:underline">
        {at}
      </a>
      <a
        href={gh}
        target="_blank"
        rel="noreferrer"
        className="text-[10px] text-muted-foreground hover:underline"
      >
        gh
      </a>
    </span>
  );
}

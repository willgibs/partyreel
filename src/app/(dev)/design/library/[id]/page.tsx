import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import { EntryBlock, FamilyCrumb, SourceLink } from "../../gallery/gallery-ui";
import {
  FAMILY_LABEL,
  FAMILY_ROUTE,
  itemById,
  neighbours,
} from "../../gallery/registry";
import { COMPONENT_NOTES } from "../../rules/component-notes";
import { COMPONENTS, componentTitle } from "../../rules/rules";

/**
 * THE PERMALINK (the gallery round, 2026-09-12): one component, everything the
 * repo knows about it, at a URL you can paste into a plan.
 *
 * Every id in the artifact resolves, not only the ones with a specimen: a
 * component the library cannot mount (a root singleton, a provider-bound
 * shell) still has a page carrying its reason, its file and its contracts,
 * because the reason is the thing an agent came to read. Ids come from
 * scripts/design-rules/collect.mjs, so they are stable across a rename of
 * anything but the file itself.
 */
export default async function ComponentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const link = (href: string) => withDesignKey(href, key);
  const { id } = await params;

  const item = itemById(id);
  const record = COMPONENTS.find((c) => c.id === id);
  if (!item && !record) notFound();

  // The unrendered case: in the artifact, no entry. Its page is its reason.
  if (!item) {
    const note = record ? COMPONENT_NOTES[record.file] : undefined;
    return (
      <main className="mx-auto w-full max-w-3xl px-6 pt-8 pb-20">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Library
        </p>
        <h1 className="mt-1 font-heading text-3xl">
          {record ? componentTitle(record) : id}
        </h1>
        {note?.for && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {note.for}
          </p>
        )}
        {record && (
          <p className="mt-2">
            <SourceLink
              file={record.file}
              className="text-[11px] text-muted-foreground"
            />
          </p>
        )}
        <p className="mt-6 rounded-xl border border-border bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {note?.unspecimened
            ? `No specimen: ${note.unspecimened}.`
            : "This file carries a contract but is not one of the library's own components, so the gallery does not mount it."}
        </p>
        <p className="mt-6">
          <Link
            href={link("/design/library")}
            className="text-[11px] text-muted-foreground underline"
          >
            back to the library
          </Link>
        </p>
      </main>
    );
  }

  const { prev, next } = neighbours(id);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pt-8 pb-20">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <Link
          href={link("/design/library")}
          className="text-xs font-medium tracking-widest text-muted-foreground uppercase hover:text-foreground"
        >
          Library
        </Link>
        <span aria-hidden className="text-xs text-muted-foreground">
          /
        </span>
        <FamilyCrumb family={item.entry.family} link={link} />
      </div>

      <div className="mt-4">
        <EntryBlock item={item} link={link} detail />
      </div>

      <nav
        aria-label="Neighbouring components"
        className="mt-12 flex items-stretch justify-between gap-3 border-t border-border pt-5"
      >
        {prev ? (
          <Link
            href={link(prev.href)}
            className="group/nav flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5 shrink-0 transition-transform duration-150 ease-emphasis group-hover/nav:-translate-x-0.5" />
            <span className="truncate">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={link(next.href)}
            className="group/nav flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="truncate">{next.title}</span>
            <ArrowRight className="size-3.5 shrink-0 transition-transform duration-150 ease-emphasis group-hover/nav:translate-x-0.5" />
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <p className="mt-6 text-[11px] text-muted-foreground">
        The whole family:{" "}
        <Link
          href={link(FAMILY_ROUTE[item.entry.family])}
          className="underline"
        >
          {FAMILY_LABEL[item.entry.family]}
        </Link>
      </p>
    </main>
  );
}

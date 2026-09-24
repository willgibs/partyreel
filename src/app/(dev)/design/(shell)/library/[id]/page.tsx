import { notFound } from "next/navigation";

import { requireDesignKey } from "@/lib/design-gate/server";

import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import {
  FileLine,
  SpecimenList,
  VariantAxisRow,
} from "@/app/(dev)/design/gallery/gallery-ui";
import { Playground } from "@/app/(dev)/design/gallery/playgrounds";
import {
  countVariants,
  FAMILY_LABEL,
  itemById,
  neighbours,
} from "@/app/(dev)/design/gallery/registry";

/**
 * AN ENTRY PAGE: one catalog component at a URL you can paste into a plan.
 * What it is for, its file and the test that pins its behavior (one line),
 * then what it accepts (the config panel and the variants) and what it looks
 * like (the specimens, from production source). Nothing else: the brand kit
 * and the bible's ten are one click away in the sidebar, and production is the
 * reference for how the component is used today.
 *
 * The section ids (`playground`, `variants`, `specimens`) are stable, so a
 * link written as `/design/library/button#variants` lands on the heading.
 */
export default async function EntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const { id } = await params;

  const item = itemById(id);
  if (!item) notFound();
  const { entry } = item;

  const meta: [string, React.ReactNode][] = [];
  if (entry.specimens.length > 0)
    meta.push(["specimens", entry.specimens.length]);
  if (countVariants(entry) > 0) meta.push(["variants", countVariants(entry)]);

  const { prev, next } = neighbours(id);

  return (
    <>
      <PageHeader
        title={item.title}
        description={entry.lede ?? entry.for}
        badges={
          <>
            <Tag>{FAMILY_LABEL[entry.family]}</Tag>
            {entry.badge && <Tag badge={entry.badge} />}
          </>
        }
        meta={meta}
      />

      <FileLine file={item.file} test={entry.test} className="mt-3" />

      {entry.play && (
        <Section
          id="playground"
          title="Configure"
          blurb="Every prop the component takes, live, with the props line to copy into a file."
        >
          <Playground id={entry.play} />
        </Section>
      )}

      {entry.variants && entry.variants.length > 0 && (
        <Section
          id="variants"
          title="Variants"
          blurb="Each axis is read against the component's own source, so the list here is the list the component has."
          aside={<Count n={countVariants(entry)} />}
        >
          <div className="space-y-3">
            {entry.variants.map((axis) => (
              <VariantAxisRow key={axis.prop} axis={axis} />
            ))}
          </div>
        </Section>
      )}

      {entry.specimens.length > 0 && (
        <Section
          id="specimens"
          title="Specimens"
          blurb="The real component, from production source. Code is the JSX the catalog declares it with; the split button shows light and dark at once."
          aside={<Count n={entry.specimens.length} />}
        >
          <SpecimenList item={item} />
        </Section>
      )}

      <Pager
        prev={prev ? { href: prev.href, label: prev.title } : undefined}
        next={next ? { href: next.href, label: next.title } : undefined}
      />
    </>
  );
}

function Count({ n }: { n: number }) {
  return (
    <span className="text-[11px] text-muted-foreground tabular-nums">{n}</span>
  );
}

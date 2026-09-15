import { notFound } from "next/navigation";

import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { Markdown } from "@/app/(dev)/design/(shell)/_shell/markdown";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import {
  ContractList,
  SpecimenList,
  VariantAxisRow,
} from "@/app/(dev)/design/gallery/gallery-ui";
import { landminesFor } from "@/app/(dev)/design/gallery/landmines";
import { Playground } from "@/app/(dev)/design/gallery/playgrounds";
import {
  countVariants,
  FAMILY_LABEL,
  itemById,
  neighbours,
} from "@/app/(dev)/design/gallery/registry";
import { BIBLE } from "@/app/(dev)/design/rules/bible";
import { COMPONENT_NOTES } from "@/app/(dev)/design/rules/component-notes";
import { COMPONENTS, componentTitle } from "@/app/(dev)/design/rules/rules";

/**
 * THE PERMALINK (the gallery round, 2026-09-12; on the shell's templates since
 * the Library x Lab round, 2026-09-15): one component, everything the repo
 * knows about it, at a URL you can paste into a plan.
 *
 * The page answers an agent's four questions in order: what is this for, what
 * does it accept, what does it look like, and WHAT BINDS ME if I touch it.
 * That last one is why the page exists. Under the 2026-09-12 ruling the design
 * law is the bible plus a component's own contracts, so this is the only
 * surface where the component-exclusive half is visible; the landmines under
 * it are not rules but traps, lifted out of the two system docs so nobody has
 * to already know they are there in order to find them.
 *
 * Every id in the artifact resolves, not only the ones with a specimen: a
 * component the library cannot mount (a root singleton, a provider-bound
 * shell) still has a page carrying its reason, its file and its contracts,
 * because the reason is the thing an agent came to read. Ids come from
 * scripts/design-rules/collect.mjs, so they are stable across a rename of
 * anything but the file itself.
 *
 * The section ids are the four `ComponentAnchor` values in _data/links.ts: a
 * ref written anywhere in the repo as `button#variants` lands on the heading.
 */
export default async function ComponentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const { id } = await params;

  const item = itemById(id);
  const record = COMPONENTS.find((c) => c.id === id);
  if (!item && !record) notFound();

  const entry = item?.entry;
  const file = item?.file ?? record?.file;
  const note = file ? COMPONENT_NOTES[file] : undefined;
  const artifact = item?.record ?? record;
  const contracts = artifact?.contracts ?? [];
  const names = artifact?.names ?? [];
  const landmines = item ? landminesFor(item) : [];
  const title =
    item?.title ?? (record ? componentTitle(record).split(", ")[0] : id);

  const meta: [string, React.ReactNode][] = [];
  if (file) {
    meta.push(["file", <Ref key="file" to={{ kind: "source", file }} quiet />]);
  }
  if (names.length > 1) meta.push(["exports", names.join(" · ")]);
  if (entry && entry.specimens.length > 0) {
    meta.push(["specimens", entry.specimens.length]);
  }
  if (entry && countVariants(entry) > 0) {
    meta.push(["variants", countVariants(entry)]);
  }
  meta.push(["contracts", contracts.length]);

  const { prev, next } = neighbours(id);

  return (
    <>
      <PageHeader
        title={title}
        description={entry?.lede ?? note?.for}
        badges={
          <>
            {entry && <Tag>{FAMILY_LABEL[entry.family]}</Tag>}
            {entry?.badge && <Tag badge={entry.badge} />}
            {!entry && <Tag badge="legacy">no specimen</Tag>}
          </>
        }
        meta={meta}
      />

      {!entry && (
        <Callout
          kind="note"
          title="Why there is nothing to look at"
          className="mt-6"
        >
          {note?.unspecimened
            ? `${note.unspecimened}.`
            : "This file carries a contract but is not one of the library's own components, so the gallery does not mount it."}
        </Callout>
      )}

      {entry?.play && (
        <Section
          id="playground"
          title="Configure"
          blurb="Every prop the component takes, live, with the props line to copy into a file."
        >
          <Playground id={entry.play} />
        </Section>
      )}

      {entry?.variants && entry.variants.length > 0 && (
        <Section
          id="variants"
          title="Variants"
          blurb="Each axis is checked against the component's own source, so a value added to a cva block and not to the library fails the gate."
          aside={<Count n={countVariants(entry)} />}
        >
          <div className="space-y-3">
            {entry.variants.map((axis) => (
              <VariantAxisRow key={axis.prop} axis={axis} />
            ))}
          </div>
        </Section>
      )}

      {item && entry && entry.specimens.length > 0 && (
        <Section
          id="specimens"
          title="Specimens"
          blurb="The real component, from production source. Code is the JSX the library declares it with; the split button shows light and dark at once."
          aside={<Count n={entry.specimens.length} />}
        >
          <SpecimenList item={item} />
        </Section>
      )}

      <Section
        id="contracts"
        title="Contracts"
        blurb="The only rules that bind this file and nothing else. A contract guards what the component DOES (its structure, its accessibility, its single sources, its engine), never how it looks."
        aside={<Count n={contracts.length} />}
      >
        {contracts.length > 0 ? (
          <ContractList contracts={contracts} />
        ) : (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            None. Nothing about this file is pinned beyond the bible, so its
            shape is yours to rework.
          </p>
        )}
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          And the bible:{" "}
          <Ref to={{ kind: "page", href: "/design/library/rules" }}>
            the {BIBLE.length} rules
          </Ref>{" "}
          that bind every surface. Those two are the whole of the design law;
          everything else on this page is precedent.
        </p>
      </Section>

      {landmines.length > 0 && (
        <Section
          id="landmines"
          title="Landmines on this surface"
          blurb="A star marks a silent breakage if reverted, never a design decision. These are the blocks in the system docs that name this component."
          aside={<Count n={landmines.length} />}
        >
          <div className="space-y-3">
            {landmines.map((mine) => (
              <div
                key={`${mine.ref}:${mine.text.slice(0, 48)}`}
                className="rounded-xl border border-foreground/25 bg-card px-4 py-3"
              >
                <p className="flex flex-wrap items-baseline gap-x-2 text-[11px] text-muted-foreground">
                  <span aria-hidden>★</span>
                  <Ref to={mine.ref} quiet>
                    {mine.doc} · {mine.under}
                  </Ref>
                </p>
                <div className="mt-1 text-sm">
                  <Markdown source={mine.text} designKey={key} />
                </div>
              </div>
            ))}
          </div>
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

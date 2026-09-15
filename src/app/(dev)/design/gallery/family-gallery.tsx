import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";

import { EntryBlock } from "./gallery-ui";
import {
  countVariants,
  familyItems,
  familySections,
  type GalleryFamily,
} from "./registry";

/**
 * A FAMILY PAGE (the gallery round, 2026-09-12; on the shell's templates since
 * the Library x Lab round, 2026-09-15): the same block for every component of
 * one family, in declared order, under its section headings.
 *
 * The five family pages used to be five hand-written documents of <Spec>
 * blocks, which is why three of them had drifted into different orders,
 * different heading depths and different amounts of detail. They are now one
 * renderer over five declarations, so a change to how a component READS is one
 * edit for the whole library, and adding a component is an entry rather than a
 * page edit.
 *
 * The sections are the shell's `Section` and every component's name is an h3
 * with an id, which is what makes the right-hand table of contents a list of
 * every component on the page: the reason a family page of forty entries is
 * navigable at all.
 */
export function FamilyGallery({
  family,
  title,
  blurb,
  link,
  children,
}: {
  family: GalleryFamily;
  title: string;
  blurb: string;
  link: (href: string) => string;
  /** Anything the family keeps outside the gallery (foundations' tokens). */
  children?: React.ReactNode;
}) {
  const items = familyItems(family);
  const sections = familySections(family);
  const changed = items.filter((i) => i.entry.badge);

  return (
    <>
      <PageHeader
        title={title}
        description={blurb}
        badges={
          changed.length > 0 ? (
            <Tag badge="updated">{changed.length} changed this window</Tag>
          ) : undefined
        }
        meta={[
          ["components", items.length],
          [
            "specimens",
            items.reduce((n, i) => n + i.entry.specimens.length, 0),
          ],
          ["variants", items.reduce((n, i) => n + countVariants(i.entry), 0)],
          [
            "contracts",
            items.reduce((n, i) => n + (i.record?.contracts.length ?? 0), 0),
          ],
        ]}
      />

      {children}

      {sections.map((s) => (
        <Section
          key={s.section}
          id={sectionId(s.section)}
          title={s.section}
          aside={
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {s.items.length}
            </span>
          }
        >
          <div className="space-y-6">
            {s.items.map((item) => (
              <EntryBlock key={item.entry.id} item={item} link={link} />
            ))}
          </div>
        </Section>
      ))}

      <Pager />
    </>
  );
}

/** A section heading's anchor; declaration order keeps it stable. */
export function sectionId(section: string): string {
  return `s-${section
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

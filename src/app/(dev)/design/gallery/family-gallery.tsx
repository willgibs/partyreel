import Link from "next/link";

import { RefHeader } from "../reference/reference-ui";
import { EntryBlock, GalleryCounts, GallerySection } from "./gallery-ui";
import { familyItems, familySections, type GalleryFamily } from "./registry";

/**
 * A FAMILY PAGE (the gallery round, 2026-09-12): the same block for every
 * component of one family, in declared order, under its section headings.
 *
 * The five family pages used to be five hand-written documents of <Spec>
 * blocks, which is why three of them had drifted into different orders,
 * different heading depths and different amounts of detail. They are now one
 * renderer over five declarations, so a change to how a component READS is one
 * edit for the whole library, and adding a component is an entry rather than a
 * page edit.
 */
export function FamilyGallery({
  family,
  eyebrow,
  title,
  blurb,
  link,
  children,
}: {
  family: GalleryFamily;
  eyebrow: string;
  title: string;
  blurb: string;
  link: (href: string) => string;
  /** Anything the family keeps outside the gallery (foundations' tokens). */
  children?: React.ReactNode;
}) {
  const items = familyItems(family);
  const sections = familySections(family);

  return (
    <>
      <RefHeader eyebrow={eyebrow} title={title} blurb={blurb} />
      <GalleryCounts items={items} />
      <p className="mt-3 text-[11px] text-muted-foreground">
        Every component here has a page of its own:{" "}
        <Link href={link("/design/library")} className="underline">
          the library index
        </Link>
      </p>

      {children}

      {sections.map((s) => (
        <GallerySection key={s.section} title={s.section}>
          {s.items.map((item) => (
            <EntryBlock key={item.entry.id} item={item} link={link} />
          ))}
        </GallerySection>
      ))}
    </>
  );
}

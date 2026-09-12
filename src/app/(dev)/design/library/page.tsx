import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import { RefHeader } from "../reference/reference-ui";
import { galleryHref, itemById } from "../gallery/registry";
import { COMPONENT_NOTES } from "../rules/component-notes";
import { COMPONENTS, componentTitle } from "../rules/rules";
import { LibraryIndex, type LibraryRow } from "./index-list";

/**
 * THE LIBRARY INDEX (the gallery round, 2026-09-12): every component in one
 * searchable list, each row a permalink.
 *
 * It replaces the eighty-four-row block that used to sit at the bottom of
 * /design, which could only be read top to bottom. The rows are built from the
 * artifact (the file, the names, the contracts) plus the gallery entry where
 * there is one (the specimens, the variants, the config panel), so nothing on
 * this page is a second copy of a fact.
 */
export default async function LibraryIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);

  const rows: LibraryRow[] = COMPONENTS.map((c) => {
    const item = itemById(c.id);
    const note = COMPONENT_NOTES[c.file];
    return {
      id: c.id,
      title: item?.title ?? componentTitle(c).split(", ")[0],
      href: withDesignKey(galleryHref(c.id), key),
      file: c.file,
      dir: c.file.slice(0, c.file.lastIndexOf("/")),
      for: note?.for,
      family: item?.entry.family,
      specimens: item?.entry.specimens.length ?? 0,
      variants: (item?.entry.variants ?? []).reduce(
        (n, v) => n + v.options.length,
        0,
      ),
      contracts: c.contracts.length,
      play: Boolean(item?.entry.play),
      unspecimened: note?.unspecimened,
    };
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pt-8 pb-20">
      <RefHeader
        eyebrow="Reference · the library"
        title="Every component"
        blurb="The whole library, one row each, with what it is for and everything the repo knows about it. Open one for its specimens, its variants, its config panel and its contracts. The five family pages are the same components arranged as a gallery."
      />
      <LibraryIndex rows={rows} />
    </main>
  );
}

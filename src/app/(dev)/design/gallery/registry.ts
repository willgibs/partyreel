import { groupByKey } from "./group-by";
import {
  FAMILY_LABEL,
  FAMILY_ROUTE,
  type GalleryEntry,
  type GalleryFamily,
} from "./entry";

/**
 * THE CATALOG REGISTRY: the one list every catalog surface reads (the family
 * pages, the entry pages, the index on the Library's home, the sidebar and
 * the search). Each entry carries its own facts (entry.ts); this adds only
 * the two things every reader would otherwise derive for itself, the display
 * name and the URL.
 */

import { COMPONENT_ENTRIES } from "@/app/(dev)/design/(shell)/library/components/gallery-demos";
import { COMPOSITION_ENTRIES } from "@/app/(dev)/design/(shell)/library/compositions/gallery-demos";
import { FOUNDATION_ENTRIES } from "@/app/(dev)/design/(shell)/library/foundations/gallery-demos";
import { MARKETING_ENTRIES } from "@/app/(dev)/design/(shell)/library/marketing/gallery-demos";
import { PATTERN_ENTRIES } from "@/app/(dev)/design/(shell)/library/patterns/gallery-demos";

export const GALLERY: GalleryEntry[] = [
  ...COMPONENT_ENTRIES,
  ...PATTERN_ENTRIES,
  ...COMPOSITION_ENTRIES,
  ...FOUNDATION_ENTRIES,
  ...MARKETING_ENTRIES,
];

const BY_ID = new Map(GALLERY.map((e) => [e.id, e]));

/**
 * The catalog's families, in the order the sidebar and the index list them;
 * the brand kit's own entries (`foundations`) sit on the brand kit's page.
 */
export const CATALOG_FAMILIES: GalleryFamily[] = [
  "components",
  "patterns",
  "compositions",
  "marketing",
];

/** An entry with its display name and its URL. */
export type GalleryItem = {
  entry: GalleryEntry;
  /** The component's file, repo-relative (the entry's own). */
  file: string;
  /** The entry's `title`, else its file's name in PascalCase. */
  title: string;
  /** The entry page, unkeyed. */
  href: string;
};

export function galleryHref(id: string): string {
  return `/design/library/${id}`;
}

/** `dropdown-menu.tsx` reads DropdownMenu: the name its export almost always has. */
export function titleFromFile(file: string): string {
  const stem = (file.split("/").pop() ?? file).replace(/\.tsx?$/, "");
  return stem
    .split(/[-.]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

export function item(entry: GalleryEntry): GalleryItem {
  return {
    entry,
    file: entry.file,
    title: entry.title ?? titleFromFile(entry.file),
    href: galleryHref(entry.id),
  };
}

export const ITEMS: GalleryItem[] = GALLERY.map(item);

export function itemById(id: string): GalleryItem | undefined {
  const entry = BY_ID.get(id);
  return entry ? item(entry) : undefined;
}

export function hasEntry(id: string): boolean {
  return BY_ID.has(id);
}

/** Every entry of a family, grouped into its sections, in declaration order. */
export function familySections(
  family: GalleryFamily,
): { section: string; items: GalleryItem[] }[] {
  // ★ BY SECTION IN FIRST-APPEARANCE ORDER, every entry of a section in its one
  // group wherever it sits: a lane adds at the head under a heading that already
  // exists further down (the disjoint-hunk convention), and a consecutive-run
  // scan once made two "Surfaces" blocks with one key.
  return groupByKey(
    GALLERY.filter((entry) => entry.family === family),
    (entry) => entry.section,
  ).map(([section, entries]) => ({ section, items: entries.map(item) }));
}

export function familyItems(family: GalleryFamily): GalleryItem[] {
  return ITEMS.filter((i) => i.entry.family === family);
}

/** The entry before and after this one inside its family: the entry page's pager. */
export function neighbours(id: string): {
  prev?: GalleryItem;
  next?: GalleryItem;
} {
  const entry = BY_ID.get(id);
  if (!entry) return {};
  const siblings = familyItems(entry.family);
  const i = siblings.findIndex((s) => s.entry.id === id);
  return { prev: siblings[i - 1], next: siblings[i + 1] };
}

export function countVariants(entry: GalleryEntry): number {
  return (entry.variants ?? []).reduce((n, v) => n + v.options.length, 0);
}

export { FAMILY_LABEL, FAMILY_ROUTE };
export type { GalleryFamily };

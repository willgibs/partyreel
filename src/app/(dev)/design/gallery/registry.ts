import { COMPONENT_NOTES, type ComponentNote } from "../rules/component-notes";
import {
  COMPONENTS,
  componentTitle,
  type ComponentRecord,
} from "../rules/rules";
import {
  FAMILY_LABEL,
  FAMILY_ROUTE,
  type GalleryEntry,
  type GalleryFamily,
} from "./entry";

/**
 * THE GALLERY REGISTRY (the gallery round, 2026-09-12): the one list every
 * gallery surface reads. It JOINS three things that already existed separately
 * and never had a seam between them:
 *
 *   the artifact   rules.generated.json: the file, its exported names, its
 *                  specimen routes, its contracts. Derived from code, never
 *                  re-derived here.
 *   the notes      component-notes.ts: the `for` line, and the reason a file
 *                  has no specimen.
 *   the entries    each family's `gallery-demos.tsx`: how to render it, and
 *                  what it accepts.
 *
 * A component with no entry is not an error (a root singleton has nothing to
 * render); a component with an entry the artifact has never heard of IS one,
 * and gallery.test.ts fails on it.
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
const RECORD_BY_ID = new Map(COMPONENTS.map((c) => [c.id, c]));

/** An entry with everything the artifact and the notes know about it. */
export type GalleryItem = {
  entry: GalleryEntry;
  /** Undefined when the entry names a component outside the six library dirs. */
  record?: ComponentRecord;
  /** The component's file: the artifact's, else the entry's own. */
  file?: string;
  note?: ComponentNote;
  /** The display name: the entry's own, else the first exported name. */
  title: string;
  /** The permalink, unkeyed. */
  href: string;
};

export function galleryHref(id: string): string {
  return `/design/library/${id}`;
}

export function item(entry: GalleryEntry): GalleryItem {
  const record = RECORD_BY_ID.get(entry.id);
  const file = record?.file ?? entry.file;
  return {
    entry,
    record,
    file,
    note: file ? COMPONENT_NOTES[file] : undefined,
    title:
      entry.title ??
      (record ? componentTitle(record).split(", ")[0] : entry.id),
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
  const out: { section: string; items: GalleryItem[] }[] = [];
  for (const entry of GALLERY) {
    if (entry.family !== family) continue;
    const last = out.at(-1);
    if (last?.section === entry.section) last.items.push(item(entry));
    else out.push({ section: entry.section, items: [item(entry)] });
  }
  return out;
}

export function familyItems(family: GalleryFamily): GalleryItem[] {
  return ITEMS.filter((i) => i.entry.family === family);
}

/** The entry before and after this one inside its family: the permalink's pager. */
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

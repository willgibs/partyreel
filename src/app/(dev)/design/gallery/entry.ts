/**
 * THE CATALOG MODEL: a component is DECLARED once, in its family's
 * `*-demos.tsx` module, and everything renders from that declaration: its
 * family page, its entry page at /design/library/<id>, its variants, its
 * config panel and its row in the searchable index.
 *
 * The entry carries every fact the catalog shows about the component (its
 * file, the one line saying what it is for, the test that pins its behavior),
 * so nothing is derived at build time and nothing is kept in a second file.
 * gallery.test.ts holds each entry to the component it names: the file and
 * the test exist, and every declared variant is one the source really has.
 */

import type { NavBadge } from "@/app/(dev)/design/_data/catalog";

export type GalleryFamily =
  | "components"
  | "patterns"
  | "compositions"
  | "foundations"
  | "marketing";

export const FAMILY_ROUTE: Record<GalleryFamily, string> = {
  components: "/design/library/components",
  patterns: "/design/library/patterns",
  compositions: "/design/library/compositions",
  foundations: "/design/library/foundations",
  marketing: "/design/library/marketing",
};

export const FAMILY_LABEL: Record<GalleryFamily, string> = {
  components: "Components",
  patterns: "Patterns",
  compositions: "Compositions",
  // The route keeps its name; the page is the brand kit.
  foundations: "Brand kit",
  marketing: "Marketing",
};

/**
 * One axis of variation: a prop, every value it takes, and where that list came
 * from. `source` is the honesty field, and variants.test.ts reads it:
 *
 *   cva      the values are the keys of a cva `variants` block, matched EXACTLY
 *            against the component source (a variant added or renamed fails).
 *   prop     a literal union in the component's own props type; every option
 *            must still appear in the source.
 *   declared an axis with no single declaration to point at (a boolean prop, a
 *            set of sizes expressed in classes). Every option must still appear
 *            in the source, so a rename fails.
 */
export type VariantSource = "cva" | "prop" | "declared";

export type VariantAxis = {
  /** The prop that selects it. */
  prop: string;
  /** Every value, in the order they should read. */
  options: string[];
  /** What the component does when the prop is omitted. */
  fallback?: string;
  source: VariantSource;
  /** One line, when the axis needs one. */
  note?: string;
  /**
   * A live sample per option, rendered as the variants matrix. Omit it for an
   * axis whose specimens already show it (a hero's `entrance`, say).
   */
  sample?: (option: string) => React.ReactNode;
};

export type SpecimenSkin =
  /** The lab's own surface: the real app tokens. */
  | "lab"
  /** The marketing grammar ([data-mkt], marketing.css). */
  | "marketing"
  /** The always-dark media surface the gallery components live on. */
  | "gallery";

export type SpecimenDef = {
  /** The specimen's name, in the frame's header. */
  label?: string;
  /** The quiet hint beside it: the props, the file, the thing to notice. */
  hint?: string;
  node: React.ReactNode;
  /** Break out of the frame's padding (a band, a hero, a full-bleed grid). */
  bleed?: boolean;
  skin?: SpecimenSkin;
  /** Extra classes on the frame's content well. */
  contentClassName?: string;
};

export type GalleryEntry = {
  /** The entry's id: the last segment of its Library URL. */
  id: string;
  /** The component's file, repo-relative (gallery.test.ts checks it exists). */
  file: string;
  /**
   * The FAMILY PAGE this entry renders on, which is not always its directory:
   * Glow is a shared component whose specimen sits beside the light tokens on
   * the brand kit (/design/library/foundations).
   */
  family: GalleryFamily;
  /** The heading this entry sits under on its family page. */
  section: string;
  /** The display name, when the file's name in PascalCase is not it. */
  title?: string;
  /**
   * One line: what the component is FOR in this product, not its category
   * ("the app's one h1 source", never "a heading component"). The index and
   * the sidebar show it, and search reads it.
   */
  for?: string;
  /** The test file that pins the component's behavior, when one does. */
  test?: string;
  /** The entry page's description, when it needs more than the `for` line. */
  lede?: string;
  variants?: VariantAxis[];
  specimens: SpecimenDef[];
  /** The id of a config panel in playgrounds.tsx, mounted above the specimens. */
  play?: string;
  /**
   * WHAT CHANGED, as data. A reviewer's first question of a catalog this size
   * is "what is new since I last looked", and a date cannot answer it: a
   * Vercel build has no git, so anything derived from history prints
   * differently there than on a dev server. So the mark is declared on the
   * entry by the round that touched the component, shown in the sidebar and
   * on the entry's row in the index, and CLEARED by the Orchestrator at a
   * window's close. `new` means the component did not exist at the last
   * close; `updated` means it was reworked.
   */
  badge?: EntryBadge;
};

/** The two marks an entry may carry; the same words `NavBadge` spells. */
export type EntryBadge = Extract<NavBadge, "new" | "updated">;

// Section ORDER is declaration order (registry.familySections walks the array),
// so there is deliberately no separate order list to keep in sync.

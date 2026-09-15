/**
 * THE GALLERY MODEL (the gallery round, 2026-09-12).
 *
 * The library used to be about a hundred hand-written <Spec> blocks spread
 * across five page files: no permalink, no variants model, no way for an agent
 * to ask "what does this component accept" without reading the source. A
 * component is now DECLARED once, here's the shape, and everything renders from
 * that declaration: its family page (the organized gallery), its permalink at
 * /design/library/<id>, its variants, its config panel, and the contracts +
 * notes the existing artifact already holds.
 *
 * The join key is `id`: the SAME id the collector mints in
 * rules.generated.json (the file stem, or parent-stem when two collide). That
 * is what lets an entry carry no duplicate facts. A component's exported names,
 * its file path, its specimen routes and its contracts all come from the
 * artifact; its `for` line comes from COMPONENT_NOTES. This file adds only what
 * code cannot derive: how to render the thing, and what it accepts.
 *
 * WHERE ENTRIES LIVE, and why it matters: a family's entries sit in a
 * `*-demos.tsx` module INSIDE that family's directory, because
 * scripts/design-rules/collect.mjs derives a component's specimen route from
 * which library page (or `-demos.tsx` file) imports it. Move a specimen out of
 * `components/` and the index would start claiming it lives somewhere else.
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
  foundations: "Foundations",
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
  /** The artifact id: the join to the file, its contracts and its note. */
  id: string;
  /**
   * The FAMILY PAGE this entry renders on, which is not always its directory:
   * Glow is a shared component whose specimen belongs beside the light tokens
   * on /design/foundations. The family decides the route the collector records
   * as its specimen, so it must be the page that actually mounts it.
   */
  family: GalleryFamily;
  /** The heading this entry sits under on its family page. */
  section: string;
  /** Overrides the artifact's exported names (Avatar, not all nine of them). */
  title?: string;
  /**
   * The component's file, repo-relative, for an entry the ARTIFACT does not
   * know: the collector indexes only the six library directories, so the
   * product components under src/components/app are off it. Required exactly
   * then, and gallery.test.ts checks the file exists.
   */
  file?: string;
  /** One line, only when COMPONENT_NOTES cannot say it better. */
  lede?: string;
  variants?: VariantAxis[];
  specimens: SpecimenDef[];
  /** The id of a config panel in playgrounds.tsx, mounted above the specimens. */
  play?: string;
  /**
   * WHAT CHANGED, as data (the Library x Lab round, 2026-09-15). A reviewer's
   * first question of a library this size is "what is new since I last
   * looked", and a date cannot answer it: a Vercel build has no git, so
   * anything derived from history prints differently there than on a dev
   * server. So the mark is declared on the entry by the round that touched
   * the component, read by the sidebar through `_data/nav.ts` and listed on
   * the library's home, and CLEARED by the Orchestrator at a window's close.
   * `new` means the component did not exist at the last close; `updated`
   * means it was reworked.
   */
  badge?: EntryBadge;
};

/** The two marks an entry may carry; the same words `NavBadge` spells. */
export type EntryBadge = Extract<NavBadge, "new" | "updated">;

// Section ORDER is declaration order (registry.familySections walks the array),
// so there is deliberately no separate order list to keep in sync.

import Link from "next/link";

import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import {
  CATALOG_FAMILIES,
  countVariants,
  FAMILY_LABEL,
  FAMILY_ROUTE,
  familyItems,
  type GalleryFamily,
  ITEMS,
} from "@/app/(dev)/design/gallery/registry";
import { Column } from "@/app/(dev)/design/reference/reference-ui";
import { LibraryIndex, type LibraryRow } from "./index-list";

/**
 * THE LIBRARY'S FRONT DOOR: the design recipe, then the catalog.
 *
 * The recipe is the whole of what a design task needs before it starts: the
 * brand kit, the bible's ten, production as it is, a visual pass, the tests,
 * then a creative shot in the lab. It is short on purpose, because a long list
 * of what not to do makes new work small; everything it points at is one
 * click away, and nothing here repeats what those pages say.
 *
 * The index under it is every catalog entry, one row each, grouped by family
 * and searchable by name, file and what it is for.
 */

/** The index's group order: the four catalog families, then the brand kit's own entries. */
const INDEX_ORDER: GalleryFamily[] = [...CATALOG_FAMILIES, "foundations"];

type Step = {
  title: string;
  /** A Library or lab route (keyed on render), or an external URL. */
  href?: string;
  body: React.ReactNode;
};

const RECIPE: Step[] = [
  {
    title: "The brand kit",
    href: "/design/library/foundations",
    body: "the live tokens every surface reads, so a new piece belongs from its first draft.",
  },
  {
    title: "The ten",
    href: "/design/library/rules",
    body: "the principles every design starts from, each with its reason.",
  },
  {
    title: "Production as it is",
    href: "https://partyreel.com",
    body: "open the live surface: it is the reference, a working version rather than a finished one.",
  },
  {
    title: "A visual pass",
    body: "capture the surface at 1440 and 375 before changing it, so the before is on record.",
  },
  {
    title: "The tests",
    body: (
      <>
        the real rules: run them (<code className="font-sans">pnpm test</code>
        ), and a failure names what broke.
      </>
    ),
  },
  {
    title: "Your creative shot",
    href: "/design/lab/kit",
    body: "take it in the lab, where an idea is drawn beside what ships and costs nothing to try; the kit shows how.",
  },
];

export default async function LibraryHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const link = (href: string) => withDesignKey(href, key);

  const rows: LibraryRow[] = INDEX_ORDER.flatMap((family) =>
    ITEMS.filter((it) => it.entry.family === family),
  ).map((it) => ({
    id: it.entry.id,
    title: it.title,
    href: link(it.href),
    file: it.file,
    group: FAMILY_LABEL[it.entry.family],
    for: it.entry.for,
    specimens: it.entry.specimens.length,
    variants: countVariants(it.entry),
    play: Boolean(it.entry.play),
    badge: it.entry.badge,
  }));

  return (
    <Column>
      <PageHeader
        title="The Library"
        description="What exists today, and what design starts from: the brand kit, the component catalog and the bible's ten principles."
      />

      <Section
        id="recipe"
        title="The design recipe"
        blurb="For anything from a blog page to an eyebrow."
      >
        <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {RECIPE.map((step, i) => (
            <li key={step.title} className="flex gap-3 px-4 py-3">
              <span
                aria-hidden
                className="w-4 shrink-0 text-[13px] text-muted-foreground tabular-nums"
              >
                {i + 1}
              </span>
              <p className="min-w-0 text-sm leading-relaxed">
                <StepTitle step={step} link={link} />{" "}
                <span className="text-muted-foreground">{step.body}</span>
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        id="catalog"
        title="The catalog"
        blurb="Every component with a specimen, from production source. Open one for its variants, its config panel and the test that pins its behavior."
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CATALOG_FAMILIES.map((family) => {
            const items = familyItems(family);
            return (
              <Link
                key={family}
                href={link(FAMILY_ROUTE[family])}
                className="rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:border-foreground/25"
              >
                <p className="text-[13px] font-medium">
                  {FAMILY_LABEL[family]}
                </p>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {items.length} component{items.length === 1 ? "" : "s"}
                </p>
              </Link>
            );
          })}
        </div>
        <LibraryIndex rows={rows} />
      </Section>

      <Pager />
    </Column>
  );
}

/** A step's name, linked when the step has a place to go. */
function StepTitle({
  step,
  link,
}: {
  step: Step;
  link: (href: string) => string;
}) {
  const label = <span className="font-medium">{step.title}:</span>;
  if (!step.href) return label;
  if (/^https?:\/\//.test(step.href)) {
    return (
      <a
        href={step.href}
        target="_blank"
        rel="noreferrer"
        className="underline-offset-2 hover:underline"
      >
        {label}
      </a>
    );
  }
  return (
    <Link
      href={link(step.href)}
      className="underline-offset-2 hover:underline"
    >
      {label}
    </Link>
  );
}

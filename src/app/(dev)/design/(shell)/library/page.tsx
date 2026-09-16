import Link from "next/link";

import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { Markdown } from "@/app/(dev)/design/(shell)/_shell/markdown";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { StatRow } from "@/app/(dev)/design/(shell)/_shell/stat-row";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { readDoc, sectionOf } from "@/app/(dev)/design/_data/docs";
import { POLICY_TESTS } from "@/app/(dev)/design/_data/links";
import { countSpecimenCode } from "@/app/(dev)/design/gallery/specimen-code";
import {
  countVariants,
  FAMILY_LABEL,
  FAMILY_ROUTE,
  familyItems,
  galleryHref,
  ITEMS,
  itemById,
  type GalleryFamily,
} from "@/app/(dev)/design/gallery/registry";
import { BIBLE } from "@/app/(dev)/design/rules/bible";
import { COMPONENT_NOTES } from "@/app/(dev)/design/rules/component-notes";
import {
  COMPONENTS,
  componentTitle,
  countContracts,
} from "@/app/(dev)/design/rules/rules";
import { Column } from "@/app/(dev)/design/reference/reference-ui";
import { LibraryIndex, type LibraryRow } from "./index-list";

/**
 * THE LIBRARY'S FRONT DOOR (the Library x Lab round, 2026-09-15).
 *
 * Will's ruling that opened this round: "the goal is for the library to
 * represent our entire working rule set so that everything influencing new
 * agents' design work is visible". So this page is a READING ORDER rather than
 * a list. An agent landing here with a goal and no context reads three things
 * in order: what binds it (three things and nothing else), what changed since
 * the last window, and then the whole index of components with what each is
 * for.
 *
 * Nothing on the page is a second copy of a fact. The numbers come off the
 * artifacts (the collector's component index, the gallery registry, the
 * bible, the policy list); "what binds you" is rendered from
 * docs/design/README.md, which is the authority model's one home; the rows
 * are the artifact joined to the gallery entry.
 *
 * WHEN THE RULES TRACK'S `influences.ts` LANDS, the health strip's rule counts
 * and the levels should read from it instead of from the three registries
 * counted here.
 */
const FAMILIES: GalleryFamily[] = [
  "components",
  "patterns",
  "compositions",
  "marketing",
  "foundations",
];

export default async function LibraryHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const link = (href: string) => withDesignKey(href, key);

  const rows: LibraryRow[] = COMPONENTS.map((c) => {
    const item = itemById(c.id);
    const note = COMPONENT_NOTES[c.file];
    return {
      id: c.id,
      title: item?.title ?? componentTitle(c).split(", ")[0],
      href: link(galleryHref(c.id)),
      file: c.file,
      dir: c.file.slice(0, c.file.lastIndexOf("/")),
      for: note?.for,
      family: item?.entry.family,
      specimens: item?.entry.specimens.length ?? 0,
      variants: item ? countVariants(item.entry) : 0,
      contracts: c.contracts.length,
      play: Boolean(item?.entry.play),
      badge: item?.entry.badge,
      unspecimened: note?.unspecimened,
    };
  });

  const counts = countContracts();
  const changed = ITEMS.filter((i) => i.entry.badge);
  const binds = sectionOf(
    readDoc("docs/design/README.md").body,
    "what-binds-you",
  );

  return (
    <Column>
      <PageHeader
        title="The library"
        description="Everything that binds or informs design work on Partyreel, in one place: the rules, the components with their contracts, the tokens, the record. If it influences what an agent builds, it is visible here."
      />

      <StatRow
        stats={[
          ["bible rules", BIBLE.length],
          ["components", counts.components],
          ["contracts", counts.contracts],
          ["policies", Object.keys(POLICY_TESTS).length],
          ["specimens", countSpecimenCode()],
          ["changed this window", changed.length],
        ]}
      />

      <Section
        id="binds"
        title="What binds you"
        blurb="Read this first. The design law is short on purpose, and knowing where its edge is, is what lets you rebuild the rest."
      >
        {binds ? (
          <Markdown
            source={binds.replace(/^##[^\n]*\n/, "")}
            from="docs/design/README.md"
            designKey={key}
          />
        ) : (
          <Callout kind="note">
            docs/design/README.md no longer carries a &ldquo;What binds
            you&rdquo; section; this page renders it, so restore it there rather
            than repeating it here.
          </Callout>
        )}
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <BindCard
            title="The bible"
            n={`${BIBLE.length} rules`}
            href="/design/library/rules"
            blurb="Will's, global, the whole of the design law."
          />
          <BindCard
            title="Contracts"
            n={`${counts.contracts} on ${counts.contracted} components`}
            href="/design/library/components"
            blurb="Per component, on its own page; they guard function, never look."
          />
          <BindCard
            title="Policies"
            n={`${Object.keys(POLICY_TESTS).length} tests`}
            href="/design/library/policies"
            blurb="Lines held across the tree; the gate is red without them."
          />
        </div>
        {/* Links only: the paragraph above already says what each level is
            worth, and saying it twice would make the short law read long. */}
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          The rest, when you need it:{" "}
          <Ref to={{ kind: "page", href: "/design/library/guidance" }}>
            guidance
          </Ref>
          ,{" "}
          <Ref to={{ kind: "doc", doc: "design-system" }}>the system docs</Ref>,{" "}
          and{" "}
          <Ref to={{ kind: "page", href: "/design/library/rulings" }}>
            Will&rsquo;s rulings
          </Ref>
          .
        </p>
      </Section>

      <Section
        id="changed"
        title="What changed"
        blurb="The components this window touched, marked on the entry itself so a dev server and a Vercel build print the same thing. The Orchestrator clears the marks when a window closes."
        aside={
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {changed.length}
          </span>
        }
      >
        {changed.length > 0 ? (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {changed.map((item) => (
              <li key={item.entry.id}>
                <Link
                  href={link(item.href)}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <span className="text-[13px] font-medium">{item.title}</span>
                  <Tag badge={item.entry.badge} />
                  {item.note?.for && (
                    <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                      {item.note.for}
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {FAMILY_LABEL[item.entry.family]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Nothing is marked. Set <code className="font-sans">badge</code> on a
            gallery entry when your round adds or reworks a component, and it
            appears here and in the sidebar until the window closes.
          </p>
        )}
      </Section>

      <Section
        id="components"
        title="Every component"
        blurb="The whole library, one row each, with what it is for and everything the repo knows about it. Open one for its specimens, its variants, its config panel and its contracts."
      >
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {FAMILIES.map((family) => {
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
      {/* Every other library page ends with prev and next; the front door was
          the one that did not, while `[` and `]` worked on it anyway (the
          sweep, 2026-09-16). */}
      <Pager />
    </Column>
  );
}

function BindCard({
  title,
  n,
  href,
  blurb,
}: {
  title: string;
  n: string;
  href: string;
  blurb: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[13px] font-medium">
        <Ref to={{ kind: "page", href }}>{title}</Ref>
      </p>
      <p className="text-[11px] text-muted-foreground tabular-nums">{n}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {blurb}
      </p>
    </div>
  );
}

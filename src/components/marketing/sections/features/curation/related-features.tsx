import Link from "next/link";
import type { CSSProperties } from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { featurePage } from "@/lib/constants/feature-pages";

/**
 * The curation page's sibling band (template-kit item 4): labels + one-liners
 * read from the FEATURE_PAGES registry so the tiles can never drift from the
 * nav. Built locally per the phase-B ownership rules; a KNOWN duplication with
 * the sharing page's copy (Phase C may unify).
 */

const SIBLING_SLUGS = ["album", "sharing", "privacy"];

export function RelatedFeatures() {
  const tiles = SIBLING_SLUGS.map((slug) => {
    const page = featurePage(slug);
    return {
      href: `/features/${page.slug}`,
      label: page.navLabel,
      line: page.navDescription,
    };
  });
  return (
    <SectionShell eyebrow="More of the toolkit" className="py-14 sm:py-16">
      <Reveal className="mx-auto mt-2 grid max-w-4xl gap-4 sm:grid-cols-3">
        {tiles.map((tile, i) => (
          <Link
            key={tile.href}
            data-mkt-reveal
            href={tile.href}
            className="mkt-learn group flex flex-col gap-1.5 rounded-xl border bg-card/40 p-5 transition-colors duration-150 hover:bg-card"
            style={{ "--i": i } as CSSProperties}
          >
            <span className="flex items-center justify-between gap-2">
              <h3 className="font-heading text-base sm:text-lg">
                {tile.label}
              </h3>
              <span className="text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
                <LearnChevron />
              </span>
            </span>
            <p className="text-sm text-muted-foreground">{tile.line}</p>
          </Link>
        ))}
      </Reveal>
    </SectionShell>
  );
}

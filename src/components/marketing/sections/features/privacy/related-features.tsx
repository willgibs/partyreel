import Link from "next/link";
import type { CSSProperties } from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { featurePage } from "@/lib/constants/feature-pages";

/**
 * The sibling-features band before the close: 2-3 registry-driven tiles
 * (navLabel + navDescription + the learn chevron) routing sideways through
 * the feature family. Built locally per the Phase-B track contract (each
 * track ships its own copy; Phase C may unify them, a known duplication).
 */
export function RelatedFeatures({ slugs }: { slugs: string[] }) {
  return (
    <SectionShell eyebrow="Related features">
      <Reveal className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
        {slugs.map((slug, i) => {
          const page = featurePage(slug);
          return (
            <Link
              key={slug}
              href={`/features/${slug}`}
              data-mkt-reveal
              className="mkt-learn group flex flex-col gap-1.5 rounded-xl border bg-card/40 p-5 transition-colors duration-150 hover:bg-card"
              style={{ "--i": i } as CSSProperties}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-heading text-base sm:text-lg">
                  {page.navLabel}
                </span>
                <span className="text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
                  <LearnChevron />
                </span>
              </span>
              <span className="text-sm text-muted-foreground">
                {page.navDescription}
              </span>
            </Link>
          );
        })}
      </Reveal>
    </SectionShell>
  );
}

import Link from "next/link";
import type { CSSProperties } from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { featurePage } from "@/lib/constants/feature-pages";

/**
 * The sibling-features band (the expansion template kit, item 4): 2-3 compact
 * tiles routing to the other feature pages before the close. Labels and
 * one-liners read from the FEATURE_PAGES registry so copy can never drift from
 * the nav. T1-SHARED: one copy for the guest-side trio (album / qr / guests),
 * homed in album/ because this track owns exactly those three dirs; other
 * tracks ship their own copies this phase and Phase C may unify (known,
 * allowed duplication across tracks, not within this one).
 */
export function RelatedFeatures({ slugs }: { slugs: string[] }) {
  return (
    <SectionShell className="py-14 sm:py-16">
      <Reveal className="mx-auto flex max-w-5xl flex-col gap-5">
        <Eyebrow data-mkt-reveal style={{ "--i": 0 } as CSSProperties}>
          Related features
        </Eyebrow>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slugs.map((slug, i) => {
            const page = featurePage(slug);
            return (
              <Link
                key={slug}
                href={`/features/${slug}`}
                data-mkt-reveal
                className="mkt-learn group flex flex-col gap-1.5 rounded-xl border bg-card/40 p-5 transition-[border-color,transform] duration-150 hover:border-foreground/25 active:scale-[0.99]"
                style={{ "--i": i + 1 } as CSSProperties}
              >
                <span className="flex items-center gap-1.5 font-heading text-lg sm:text-xl">
                  {page.navLabel}
                  <LearnChevron />
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  {page.navDescription}
                </span>
              </Link>
            );
          })}
        </div>
      </Reveal>
    </SectionShell>
  );
}

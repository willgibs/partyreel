import Link from "next/link";
import type { CSSProperties } from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { featurePage } from "@/lib/constants/feature-pages";
import { GOLDEN_LINES } from "@/lib/constants/marketing-voice";

/**
 * The sibling-features band (the expansion template kit, item 4): 2-3 compact
 * tiles routing to the other feature pages before the close. Labels and
 * one-liners read from the FEATURE_PAGES registry so copy can never drift from
 * the nav. UNIFIED AT PHASE C from the tracks' per-dir copies (T1's registry-
 * driven shape won); "reel" is the one non-registry slug, special-cased here
 * exactly like the nav and the hub hand-append it (/reel sits outside the
 * registry by design; its line is the ratified reel thesis, not the
 * provisional panel copy).
 */
type RelatedTile = { href: string; label: string; line: string };

function tileFor(slug: string): RelatedTile {
  if (slug === "reel") {
    return {
      href: "/reel",
      label: "The highlight reel",
      line: `${GOLDEN_LINES.reelThesis}.`,
    };
  }
  const page = featurePage(slug);
  return {
    href: `/features/${page.slug}`,
    label: page.navLabel,
    line: page.navDescription,
  };
}

export function RelatedFeatures({ slugs }: { slugs: string[] }) {
  return (
    <SectionShell className="py-14 sm:py-16">
      <Reveal className="mx-auto flex max-w-5xl flex-col gap-5">
        <Eyebrow data-mkt-reveal style={{ "--i": 0 } as CSSProperties}>
          Related features
        </Eyebrow>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slugs.map((slug, i) => {
            const tile = tileFor(slug);
            return (
              <Link
                key={slug}
                href={tile.href}
                data-mkt-reveal
                className="mkt-learn group flex flex-col gap-1.5 rounded-xl border bg-card/40 p-5 transition-[border-color,transform] duration-150 hover:border-foreground/25 active:scale-[0.99]"
                style={{ "--i": i + 1 } as CSSProperties}
              >
                <span className="flex items-center gap-1.5 font-heading text-lg sm:text-xl">
                  {tile.label}
                  <LearnChevron />
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  {tile.line}
                </span>
              </Link>
            );
          })}
        </div>
      </Reveal>
    </SectionShell>
  );
}

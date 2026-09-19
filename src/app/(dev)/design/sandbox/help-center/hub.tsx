"use client";

import { ArrowRight } from "lucide-react";

import { CategoryEmblem } from "@/components/marketing/help/help-emblems";
import { HelpPaletteProvider } from "@/components/marketing/help/help-palette";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

import { ARTICLES, CATEGORIES, CATEGORY_CHIPS, QUICK_LINKS, SEARCH_INDEX } from "./fixtures";
import { Hero, type WhoFirstShape } from "./who-first";
import { stopLinks } from "./vocab";

/**
 * DECISION 2: THE HUB, staged after `who-first`. The hero above is drawn
 * WEARING that decision's answer (`defineExploration`'s staging rule), so a
 * reviewer sees the hub in the world they already picked; only the body
 * below the hero — the index sheet, a set of doors, or both — is this
 * decision's own evidence.
 */
export type HubShape = "sheet" | "doors" | "hybrid";

const SAMPLE_SLUG_BY_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.values(ARTICLES).map((a) => [a.category, a.slug]),
);

function CategoryPane({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("grid gap-px overflow-hidden rounded-2xl border bg-border ring-1 ring-foreground/5", !compact && "lg:grid-cols-2")}>
      {CATEGORIES.map((category, i) => {
        const sampleSlug = SAMPLE_SLUG_BY_CATEGORY[category.slug];
        const sample = sampleSlug ? ARTICLES[sampleSlug] : null;
        return (
          <div
            key={category.slug}
            className={cn("relative bg-card p-6", category.slug === "troubleshooting" && !compact && "lg:col-span-2")}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute top-2 right-5 font-heading text-3xl text-foreground/[0.06] tabular-nums select-none"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex items-center gap-3.5">
              <CategoryEmblem slug={category.slug} />
              <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  {category.count} guides
                </p>
                <h3 className="mt-0.5 font-heading text-base">{category.title}</h3>
              </div>
            </div>
            <p className="mt-2.5 text-sm text-muted-foreground">{category.blurb}</p>
            {sample && (
              <a
                href="#"
                className="mt-3 flex items-center gap-2 border-t pt-2.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                <span className="min-w-0 flex-1 truncate">{sample.title}</span>
                <ArrowRight className="size-3.5 shrink-0" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BigDoors() {
  const featured = ["getting-started", "qr-and-invites", "guest-experience", "troubleshooting"];
  const rest = CATEGORIES.filter((c) => !featured.includes(c.slug));
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {featured.map((slug) => {
          const category = CATEGORIES.find((c) => c.slug === slug)!;
          return (
            <a
              key={slug}
              href="#"
              className="flex flex-col gap-2 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 transition-colors duration-150 hover:border-foreground/25"
            >
              <CategoryEmblem slug={slug} size="lg" />
              <h3 className="mt-1 font-heading text-subsection">{category.title}</h3>
              <p className="text-sm text-muted-foreground">{category.blurb}</p>
            </a>
          );
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {rest.map((c) => (
          <a
            key={c.slug}
            href="#"
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:border-foreground/40 hover:text-foreground"
          >
            <CategoryEmblem slug={c.slug} className="scale-[0.55]" />
            {c.title}
          </a>
        ))}
      </div>
    </div>
  );
}

export function HubPreview({
  shape,
  mode,
  whoFirst,
}: {
  shape: HubShape;
  mode: "desktop" | "phone";
  whoFirst: WhoFirstShape;
}) {
  return (
    <div onClickCapture={stopLinks} className="bg-background text-foreground">
      <HelpPaletteProvider index={SEARCH_INDEX} quickLinks={QUICK_LINKS} categories={CATEGORY_CHIPS}>
        <Hero shape={whoFirst} mode={mode} />
        <PaperChapter>
          <Container className="flex flex-col gap-14 py-14 sm:py-16">
            {shape === "sheet" && <CategoryPane />}
            {shape === "doors" && <BigDoors />}
            {shape === "hybrid" && (
              <>
                <BigDoors />
                <div className="border-t pt-14">
                  <h2 className="mb-6 font-heading text-prose">Every guide, in order</h2>
                  <CategoryPane compact />
                </div>
              </>
            )}
          </Container>
        </PaperChapter>
      </HelpPaletteProvider>
    </div>
  );
}

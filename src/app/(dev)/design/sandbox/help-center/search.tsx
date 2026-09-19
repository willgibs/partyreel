"use client";

import { Search } from "lucide-react";

import { HelpPaletteProvider, HelpSearchTrigger } from "@/components/marketing/help/help-palette";
import { Kbd } from "@/components/shared/kbd";
import { FOOTER_NAV } from "@/lib/constants/marketing-nav";

import { CATEGORY_CHIPS, QUICK_LINKS, SEARCH_INDEX } from "./fixtures";
import { stopLinks } from "./vocab";

/**
 * DECISION 7: SEARCH. The ranked palette is real (`HelpPaletteProvider` +
 * `HelpSearchTrigger`, both fs-free); this preview varies WHERE a trigger
 * exists, not the palette itself, on two mock page strips (`/help`, where it
 * always lives, and `/pricing`, a page with no help content at all).
 */
export type SearchShape = "local" | "sitewide" | "visible";

function PageStrip({ path, trigger }: { path: string; trigger: "hero" | "kbd" | "none" }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
      <span className="text-xs text-muted-foreground">{path}</span>
      {trigger === "hero" && <HelpSearchTrigger variant="compact" />}
      {trigger === "kbd" && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Search anywhere <Kbd>⌘K</Kbd>
        </span>
      )}
      {trigger === "none" && <span className="text-xs text-faint">No search trigger here</span>}
    </div>
  );
}

const RESOURCES = FOOTER_NAV.find((c) => c.title === "Resources")!;

function FooterStub({ withSearch }: { withSearch: boolean }) {
  return (
    <div className="rounded-xl border bg-[#040405] p-5 text-white">
      <p className="text-[11px] font-medium tracking-[0.14em] text-white/50 uppercase">
        {RESOURCES.title}
      </p>
      <ul className="mt-3 flex flex-col gap-2 text-sm text-white/70">
        {RESOURCES.links.map((l) => (
          <li key={l.href}>{l.label}</li>
        ))}
        {withSearch && (
          <li className="flex items-center gap-1.5 text-white">
            <Search className="size-3.5" /> Search
          </li>
        )}
      </ul>
    </div>
  );
}

export function SearchPreview({ shape }: { shape: SearchShape }) {
  return (
    <div onClickCapture={stopLinks} className="bg-background p-6 text-foreground">
      <HelpPaletteProvider index={SEARCH_INDEX} quickLinks={QUICK_LINKS} categories={CATEGORY_CHIPS}>
        <div className="mx-auto flex max-w-xl flex-col gap-3">
          <PageStrip path="/help" trigger="hero" />
          <PageStrip
            path="/pricing"
            trigger={shape === "sitewide" ? "kbd" : "none"}
          />
          {shape === "visible" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <FooterStub withSearch />
              <div className="rounded-xl border p-5">
                <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Header, Resources panel
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-sm text-foreground">
                  <Search className="size-3.5" /> Search
                </div>
              </div>
            </div>
          )}
        </div>
      </HelpPaletteProvider>
    </div>
  );
}

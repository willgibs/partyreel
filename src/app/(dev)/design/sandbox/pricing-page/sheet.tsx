"use client";

import { ChevronDown } from "lucide-react";

import { ComparisonTable } from "@/components/marketing/sections/pricing/comparison-table";
import { SharedBand } from "@/components/marketing/sections/pricing/shared-band";
import { UnlockGrid } from "@/components/marketing/sections/pricing/unlock-grid";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";

/**
 * HOW MUCH OF THE SHEET THE PAGE SHOWS.
 *
 * Between the plans and the questions the page says the same things three
 * times: four unlock tiles name where Free ends, twenty-odd table rows say it
 * again with every other row beside it, and seven chips name the floor every
 * plan shares. Each is well made; together they are most of the page's height
 * and none of its decisions.
 *
 * ★ THE SHIPPED SECTIONS, UNCHANGED, INSIDE AN INERT ZONE. All three options
 * draw the real `UnlockGrid`, `ComparisonTable` and `SharedBand`, with their
 * real groups, rows, tooltips and numbers out of tiers.ts, so what is being
 * judged is the page's actual length rather than a sketch of it. The zone is
 * marked inert because the table's header carries live `CheckoutButton`s
 * (scene.tsx explains how the press is disarmed).
 */

export type Sheet = "both" | "table" | "fold";

export function SheetBlock({ sheet }: { sheet: Sheet }) {
  if (sheet === "table") {
    // One chapter, one instrument: the table holds every row the grid was
    // paraphrasing, and the floor every plan shares closes it.
    return (
      <div data-pp-inert>
        <PaperChapter>
          <ComparisonTable />
          <SharedBand />
        </PaperChapter>
      </div>
    );
  }

  if (sheet === "fold") {
    return (
      <div data-pp-inert>
        <UnlockGrid />
        <PaperChapter>
          <section className="py-20 sm:py-24">
            <Container>
              <details className="mx-auto max-w-5xl rounded-2xl border bg-card/40">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 outline-none">
                  <span className="font-heading text-subsection">
                    Compare everything, side by side
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </summary>
                <ComparisonTable />
              </details>
            </Container>
          </section>
        </PaperChapter>
        <SharedBand />
      </div>
    );
  }

  return (
    <div data-pp-inert>
      <UnlockGrid />
      <PaperChapter>
        <ComparisonTable />
      </PaperChapter>
      <SharedBand />
    </div>
  );
}

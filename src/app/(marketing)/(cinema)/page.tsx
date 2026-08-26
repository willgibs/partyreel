import type { Metadata } from "next";

import { HOME_SECTION_COMPONENTS } from "@/components/marketing/sections/home";
import { homeSurfaceChunks } from "@/components/marketing/sections/home/section-ids";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";

// Home keeps the default "Partyreel" title (no template) and inherits the root
// SITE_DESCRIPTION (the ruled thesis register, single-sourced in site.ts);
// only the canonical is declared here.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// The 13-section made-from arc in three chapters (the 2026-08-26 mixed-theme
// ruling): THE EVENT (cinema dark) → THE MORNING AFTER (album/curation/privacy
// on one PaperChapter) → THE PAYOFF (cinema again, lights down for the reel).
// section-ids.ts is the ONE source of order + surface (Vitest-pinned); this
// page maps its chunks, so reshuffling or re-chaptering is a section-ids edit.
// No kicker on this chapter ON PURPOSE: the album section opens with its own
// eyebrow + ruled header, and the straddling album card IS the seam signature.
// Two devices at one cut would be noise.
export default function MarketingHome() {
  return (
    <>
      {homeSurfaceChunks().map((chunk) => {
        const sections = chunk.ids.map((id) => {
          const Component = HOME_SECTION_COMPONENTS[id];
          return <Component key={id} />;
        });
        return chunk.surface === "paper" ? (
          <PaperChapter key={chunk.ids[0]}>{sections}</PaperChapter>
        ) : (
          sections
        );
      })}
    </>
  );
}

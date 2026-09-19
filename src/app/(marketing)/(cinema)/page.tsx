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

// The 15-section arc in three chapters (the 2026-08-26 mixed-theme ruling;
// 6 dark, 4 paper, 5 dark since 2026-09-18): THE EVENT (cinema dark) → THE
// MORNING AFTER (the live demo, album, curation, privacy on one PaperChapter)
// → THE PAYOFF (cinema again, lights down for the reel).
// section-ids.ts is the ONE source of order + surface (Vitest-pinned); this
// page maps its chunks, so reshuffling or re-chaptering is a section-ids edit.
// No kicker on the paper chapter ON PURPOSE: the album section opens as the
// host's masthead (its own eyebrow + ruled header a tier up, the album print
// laid on the desk below-right). The straddling card came off the cut on
// 2026-09-01: two visuals were fighting across it (Will). Since 2026-09-18
// (his chapter-transition ruling) chapter 1 ends on full-quality standing on
// the switching photograph, and the paper chapter opens on the demo's stage.
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

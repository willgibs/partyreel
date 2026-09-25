import { SectionShell } from "@/components/marketing/system/section-shell";

import { STYLE_FACETS } from "./style-facets";
import { StyleSwitcher } from "./style-switcher.lazy";

/**
 * /reel section 2 — the looks + LIVE STYLE-SWITCHER (LOUD; the flagship's signature, ruled
 * in by Will 2026-08-25, and kept by `reel-story` as the engine's proof). The server renders
 * the shell + the static fallback inside StyleSwitcher; the real canvas engine arrives as a
 * lazy island on approach (see style-switcher.lazy.tsx for the engine-boundary story).
 *
 * The heading says which looks play where, read off the facets: the live reel plays the
 * moods (a treatment falls back to the default mood on every device), and a clip can wear
 * the treatments too.
 */
export function StyleSwitcherSection() {
  const [moods, treatments] = STYLE_FACETS;
  return (
    <SectionShell
      id="styles"
      eyebrow="The looks"
      heading={`${moods.styles.length} moods for the reel, ${treatments.styles.length} more for your clip.`}
      subhead="This is the live engine, not a mockup. Tap a look and the same reel recuts in front of you."
      reveal="cinema"
    >
      <div className="mt-12">
        <StyleSwitcher />
      </div>
    </SectionShell>
  );
}

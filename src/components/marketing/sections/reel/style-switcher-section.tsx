import { SectionShell } from "@/components/marketing/system/section-shell";

import { STYLE_COUNT } from "./style-facets";
import { StyleSwitcher } from "./style-switcher.lazy";

/**
 * /reel section 2 — the 14-style catalog + LIVE STYLE-SWITCHER (LOUD; the flagship's
 * signature, ruled in by Will 2026-08-25). The server renders the shell + the static
 * fallback inside StyleSwitcher; the real canvas engine arrives as a lazy island on
 * approach (see style-switcher.lazy.tsx for the engine-boundary story).
 */
export function StyleSwitcherSection() {
  return (
    <SectionShell
      id="styles"
      eyebrow="The style catalog"
      heading={`${STYLE_COUNT} cinematic styles. Pick a mood, pick a look, done.`}
      subhead="This is the live render engine, not a mockup. Tap a style and the same reel recuts in front of you."
      reveal="cinema"
    >
      <div className="mt-12">
        <StyleSwitcher />
      </div>
    </SectionShell>
  );
}

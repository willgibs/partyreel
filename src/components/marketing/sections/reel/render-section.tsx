import { SectionShell } from "@/components/marketing/system/section-shell";
import { StatBand } from "@/components/marketing/system/stat-band";

import { STYLE_COUNT } from "./style-facets";

/**
 * /reel section 4 — the $0 on-device render story (QUIET + a StatBand moment). Honest,
 * generic numbers only: no ingress figures, no queue-time promises, and the unsupported-
 * browser path is the ruled modern-browser nudge (the cloud fallback is gone; it does
 * not exist to mention). STYLE_COUNT derives from the registry so the stat can't drift.
 */
export function RenderSection() {
  return (
    <SectionShell
      id="render"
      eyebrow="On-device"
      heading="Rendered on your phone, free, in seconds."
      subhead="The reel is drawn frame by frame and encoded right on your device. No render farm, no queue, nothing extra to pay, on any plan."
    >
      {/* THREE CLEAN ROWS ON A PHONE (R4/A22): the three stats need ~430px
          side by side, so at 375 the band broke 2 + 1 and the orphan read as a
          layout accident. Below sm it stacks into one centered column; from sm
          up the band is untouched. */}
      <StatBand
        className="mt-12 max-sm:flex-col max-sm:items-center"
        stats={[
          { value: 0, prefix: "$", label: "per render" },
          { value: STYLE_COUNT, label: "cinematic styles" },
          { value: 100, suffix: "%", label: "on your device" },
        ]}
      />
      <p className="mx-auto mt-10 max-w-xl text-center text-sm text-pretty text-muted-foreground">
        Rendering uses the modern video support built into current browsers. On
        an older one, opening your event in an up-to-date Chrome, Edge, or
        Safari is all it takes.
      </p>
    </SectionShell>
  );
}

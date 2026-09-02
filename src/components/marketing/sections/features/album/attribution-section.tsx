import { SectionShell } from "@/components/marketing/system/section-shell";

import { AttributionStage } from "./attribution-stage";

/**
 * NAMES ON EVERY SHOT: who a photo came from, and where the album says so.
 * The name lives in the LIGHTBOX (never on a tile), so the stage is a lightbox
 * with the pill cycling its three real states and an index that follows it
 * (attribution-stage.tsx). The guest's own deletion is a FAQ answer.
 */
export function AttributionSection() {
  return (
    <SectionShell>
      <AttributionStage />
    </SectionShell>
  );
}

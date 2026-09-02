import { SectionShell } from "@/components/marketing/system/section-shell";

import { GettingInStage } from "./getting-in-stage";

/**
 * GETTING IN: how a guest reaches the album, the QR page's story told from
 * the album's side, because a visitor landing here first has never seen a
 * code. The stage owns the phone and its index (getting-in-stage.tsx).
 *
 * ★ The default for a new event is REQUIRE ACCOUNTS ON, so the copy says
 * "new events ask for an email first" rather than promising "no account".
 */
export function GettingInSection() {
  return (
    <SectionShell>
      <GettingInStage />
    </SectionShell>
  );
}

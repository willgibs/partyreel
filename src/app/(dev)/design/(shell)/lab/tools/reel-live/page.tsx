import { requireDesignKey } from "@/lib/design-gate/server";

import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { LiveReelHarness } from "./harness";

/**
 * THE LIVE REEL HARNESS (the reel round, 2026-09-22). The rolling composer running over a fixture
 * album, with every knob the wiring lanes will expose to a viewer and every number the soak is
 * judged on. The lesson on record is that reel generation shipped "zero design magic because the
 * magic was never prototyped": this page IS the prototype.
 *
 * Fixtures are SAME-ORIGIN on purpose (the reel-parity precedent): the canvas reads back pixels for
 * the encode, and a cross-origin still without CORS taints it.
 */
export default async function LiveReelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Live reel"
        description="The rolling composer over a fixture album: a seeded take per loop, windows that overlap by one clip and hand over mid-hold, arrivals spliced in within a clip, an immediate drop. Play with the pacing, add three photographs, hide the one on screen, switch looks, and watch the numbers stay flat."
      />
      <LiveReelHarness />
      <Pager />
    </div>
  );
}

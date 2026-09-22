import { requireDesignKey } from "@/lib/design-gate/server";

import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { ReelVideoLab } from "./video-lab";

/**
 * THE RANGE-WINDOW VIDEO HARNESS (the reel round, 2026-09-22). A separate tool from the style
 * browser next door on purpose: that one grades how a style LOOKS over stills, this one grades what
 * motion COSTS — the window, the budget, the cadence, the ceiling, the ring and the poster ladder,
 * over a real mov, a real webm and a portrait mp4 served by byte range from this folder.
 */
export default async function ReelVideoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Reel video windows"
        description="A six-second window of a real original, fetched by byte range and decoded on this device into the ring the draw reads. The toggle, the per-clip byte cap, the loop cadence and the session ceiling are the product's own knobs."
      />
      <ReelVideoLab />
      <Pager />
    </div>
  );
}

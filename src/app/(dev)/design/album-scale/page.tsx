import { requireDesignKey } from "@/lib/design-gate/server";
import { isRowStep } from "@/lib/shared/album-rows";

import { AlbumScale } from "./album-scale";
import { HostScale } from "./host-surface";

/**
 * THE ALBUM AT SCALE (the album-window lane): the real grid over 1,145
 * synthetic photographs, the page `scripts/album-perf.mjs` measures.
 *
 * ★ OUTSIDE `(shell)` ON PURPOSE. The lab shell restyles its page through
 * `:has()` selectors, which re-match on every DOM change under them; a page
 * measured for style recalculation must not carry somebody else's selectors.
 *
 *   ?layout=masonry|rows   (default rows)
 *   ?n=1145                how many photographs (1 to 5,000)
 *   ?step=0|1|2            the density step (the middle by default)
 *   ?uploading=1           an upload in flight at the head, for progress ticks
 *   ?surface=host          the host's album instead: the hub's own store, window, select mode and
 *                          View menu over the same photographs (`host-surface.tsx`)
 */
export default async function AlbumScalePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const params = await searchParams;
  const one = (k: string) =>
    typeof params[k] === "string" ? (params[k] as string) : undefined;
  const n = Number(one("n") ?? 1145);
  const step = Number(one("step"));
  const count = Number.isFinite(n) ? Math.min(5000, Math.max(1, n)) : 1145;
  if (one("surface") === "host")
    return (
      <HostScale count={count} step={isRowStep(step) ? step : undefined} />
    );
  return (
    <AlbumScale
      layout={one("layout") === "masonry" ? "masonry" : "rows"}
      count={Number.isFinite(n) ? Math.min(5000, Math.max(1, n)) : 1145}
      step={isRowStep(step) ? step : undefined}
      uploading={one("uploading") === "1"}
    />
  );
}

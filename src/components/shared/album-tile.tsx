"use client";

/**
 * THE RENDER PROBE: how the lab's scale page (`/design/album-scale`) counts
 * album renders on a PRODUCTION build, where React's Profiler is compiled out.
 * `scripts/album-perf.mjs` reads it to prove the budgets that are about work
 * rather than time (a like re-renders one tile; a progress tick or a quiet poll,
 * none). Null everywhere else, so a tile pays one null check a render.
 */
type RenderProbe = (kind: "tile" | "mark", id: string) => void;
let renderProbe: RenderProbe | null = null;

/** Install (or with null, remove) the probe. The scale page's alone. */
export function setAlbumRenderProbe(probe: RenderProbe | null) {
  renderProbe = probe;
}

/** One render of a tile's body, or of a like mark inside one. */
export function probeAlbumRender(kind: "tile" | "mark", id: string) {
  renderProbe?.(kind, id);
}

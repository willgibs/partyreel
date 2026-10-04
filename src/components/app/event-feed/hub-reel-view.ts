/**
 * THE REEL VIEW'S CHUNK, ASKED FOR ON INTENT (`hub-reel.tsx` mounts the view, `reel-card.tsx` warms it): the view reaches
 * the whole canvas engine, so nobody who never opens it downloads it (the guest controller's own rule,
 * `guest/reel/live-reel.tsx`). ONE import promise serves the Reel card's warm-up and the lazy boundary alike, so a press
 * after a hover never asks twice. A module of its own so the card, which must mount without the hub's server graph in a
 * test, carries none of the controller's imports.
 */
let viewChunk: Promise<
  typeof import("@/components/guest/reel/live-reel-view")
> | null = null;

export const loadHubReelView = () =>
  (viewChunk ??= import("@/components/guest/reel/live-reel-view"));

/** Ask for the chunk now (a pointer over the Reel card, a press on it), so the press opens at once; a failure is the view's own ask's to retry. */
export function warmHubReelView() {
  void loadHubReelView().catch(() => {
    viewChunk = null;
  });
}

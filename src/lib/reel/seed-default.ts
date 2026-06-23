// The default per-reel seed: a stable hash of the event id, used when the host hasn't shuffled yet (no
// persisted seed). SHARED by the live composer (the player's default look) AND the server render service,
// so an un-shuffled reel's downloaded .mp4 matches exactly what the player showed (WYSIWYG).
//
// Seeds stay < 1e6 so seeded()'s `seed * 2654435761` multiply stays exact in V8 (the browser player AND
// the Lambda's headless Chrome render the identical take).
export const SEED_MAX = 1_000_000;

export function defaultReelSeed(eventId: string): number {
  let h = 0;
  for (let i = 0; i < eventId.length; i++) {
    h = (h * 31 + eventId.charCodeAt(i)) % SEED_MAX;
  }
  return h;
}

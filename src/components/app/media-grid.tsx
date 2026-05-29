export type GridMedia = {
  id: string;
  type: "photo" | "video";
  /** Short-lived presigned URL — built server-side; never a raw R2 key. */
  url: string;
  status?: "pending" | "approved" | "hidden" | "removed";
};

// Presentational media render shared by the public album (MediaGrid below) and
// the host moderation grid (host-media-grid.tsx). Renders straight <img>/<video>
// from presigned URLs (next/image is wrong here — presigned URLs are short-lived
// and per-request, so optimization/caching would break them). No status,
// controls, or host concerns live here — keep it a clean primitive both surfaces
// reuse.
export function MediaTile({ item }: { item: GridMedia }) {
  return item.type === "photo" ? (
    // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
    <img
      src={item.url}
      alt=""
      loading="lazy"
      className="size-full object-cover"
    />
  ) : (
    <video
      src={item.url}
      controls
      preload="metadata"
      playsInline
      className="size-full bg-black object-cover"
    />
  );
}

// Public-album grid. Deliberately presentational and control-free — it's shared
// with the always-dark gallery surface where media is the hero. Host moderation
// controls live in HostMediaGrid, never here.
export function MediaGrid({ items }: { items: GridMedia[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="relative aspect-square overflow-hidden rounded-lg bg-black/10"
        >
          <MediaTile item={item} />
        </li>
      ))}
    </ul>
  );
}

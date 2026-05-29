import { Badge } from "@/components/ui/badge";

export type GridMedia = {
  id: string;
  type: "photo" | "video";
  /** Short-lived presigned URL — built server-side; never a raw R2 key. */
  url: string;
  status?: "pending" | "approved" | "hidden" | "removed";
};

// Presentational grid shared by the host gallery and the public album. Renders
// straight <img>/<video> from presigned URLs (next/image is wrong here —
// presigned URLs are short-lived and per-request, so optimization/caching would
// break them). `showStatus` surfaces moderation state for the host view only.
export function MediaGrid({
  items,
  showStatus = false,
}: {
  items: GridMedia[];
  showStatus?: boolean;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="relative aspect-square overflow-hidden rounded-lg bg-black/10"
        >
          {item.type === "photo" ? (
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
          )}
          {showStatus && item.status && item.status !== "approved" && (
            <Badge
              variant="secondary"
              className="absolute top-1.5 left-1.5 capitalize"
            >
              {item.status}
            </Badge>
          )}
        </li>
      ))}
    </ul>
  );
}

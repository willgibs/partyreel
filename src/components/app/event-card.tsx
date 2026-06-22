import Link from "next/link";
import {
  Bookmark,
  Calendar,
  Image as ImageIcon,
  Images,
  Lock,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The dashboard event card (Phase 5 S2a, the ratified STAT-FORWARD V3): a 16:10
 * cover with the event identity + stats as an OVERLAY (white chrome on a dark
 * gradient, legible over any photo OR the no-cover dark fallback, in both
 * themes). Presentational + server-renderable - the only interactive piece, the
 * QR chip, arrives as the client `qrSlot` (a sibling of the Link, so tapping it
 * never navigates). Used for the merged Events feed (hosted + saved) and Trash.
 *
 * `href: null` = a saved event the host has since made private: a non-clickable
 * card with a lock fallback (the savedEventCardProps privacy contract). `variant`
 * drives the chrome: hosted (QR slot + the amber review chip + Open/Closed + item
 * count), saved (bookmark glyph + byline + unsave action), trash (dimmed +
 * countdown + restore action). The amber chip and `action` never coexist by
 * construction (hosted has the chip + no action; saved/trash have an action + no
 * pending), so the top-right slot never collides.
 */
const PILL =
  "flex h-5 items-center gap-1 rounded-full border border-white/30 bg-black/25 px-2 text-[10px] font-medium backdrop-blur-sm";

export function EventCard({
  href,
  name,
  coverUrl,
  dateLabel,
  variant = "hosted",
  itemsLabel,
  statusLabel,
  pendingCount = 0,
  byline,
  qrSlot,
  action,
}: {
  href: string | null;
  name: string;
  coverUrl: string | null;
  dateLabel: string;
  variant?: "hosted" | "saved" | "trash";
  /** Hosted: the "N items" pill (approved count). */
  itemsLabel?: string | null;
  /** A status pill: Open/Closed (hosted), the countdown (trash), Password (saved). */
  statusLabel?: string | null;
  /** Hosted: the amber "N to review" chip (rendered only when > 0). */
  pendingCount?: number;
  /** Saved: "Hosted by X". */
  byline?: string | null;
  /** Hosted: the client QR trigger (a sibling of the Link; tapping it never navigates). */
  qrSlot?: React.ReactNode;
  /** Top-right action: unsave (saved) / restore (trash). */
  action?: React.ReactNode;
}) {
  const locked = href === null;

  const surface = (
    <>
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        // No-cover fallback = the always-dark gallery surface, so the white
        // overlay chrome stays legible in both themes (never a light card).
        <div className="absolute inset-0 flex items-center justify-center bg-gallery text-gallery-muted">
          {locked ? (
            <Lock className="size-7" aria-hidden />
          ) : (
            <ImageIcon className="size-7" aria-hidden />
          )}
        </div>
      )}
      {/* Legibility gradient: dark at the foot where the chrome sits. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-3 text-white">
        <h3 className="truncate font-heading text-xl leading-snug">{name}</h3>
        {byline && <p className="truncate text-xs text-white/75">{byline}</p>}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={PILL}>
            <Calendar className="size-2.5" aria-hidden />
            {dateLabel}
          </span>
          {itemsLabel && (
            <span className={PILL}>
              <Images className="size-2.5" aria-hidden />
              {itemsLabel}
            </span>
          )}
          {statusLabel && <span className={PILL}>{statusLabel}</span>}
        </div>
      </div>
    </>
  );

  return (
    // data-static: a host management card, so opt out of the [data-media-tile]
    // arrival fade (emil: no entrance theater on host). It's not a lightbox tile.
    <div data-media-tile data-static className="group relative">
      {href ? (
        <Link
          href={href}
          className="relative block aspect-[16/10] overflow-hidden rounded-xl outline-none transition-transform duration-150 ease-emphasis active:scale-[0.99] focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:active:scale-100"
        >
          {surface}
        </Link>
      ) : (
        <div
          className={cn(
            "relative block aspect-[16/10] cursor-default overflow-hidden rounded-xl",
            variant === "trash" && "opacity-75 grayscale",
          )}
        >
          {surface}
        </div>
      )}

      {/* Top-LEFT: the hosted QR chip OR the saved provenance glyph. */}
      {qrSlot ? (
        <div className="absolute top-2.5 left-2.5 z-10">{qrSlot}</div>
      ) : variant === "saved" ? (
        <div
          className="pointer-events-none absolute top-2.5 left-2.5 z-10 flex items-center justify-center rounded-[var(--radius-tile)] bg-black/35 p-1.5 text-white backdrop-blur-sm"
          title="A saved event"
        >
          <Bookmark className="size-3.5" aria-hidden />
          <span className="sr-only">Saved event</span>
        </div>
      ) : null}

      {/* Top-RIGHT: the amber review chip (hosted) OR the action (saved/trash);
          mutually exclusive by variant, so they never overlap. */}
      {pendingCount > 0 && (
        <div
          className="absolute top-2.5 right-2.5 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm"
          style={{
            background: "var(--warning)",
            color: "var(--warning-foreground)",
          }}
        >
          {pendingCount} to review
        </div>
      )}
      {action && <div className="absolute top-2.5 right-2.5 z-10">{action}</div>}
    </div>
  );
}

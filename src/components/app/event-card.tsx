import Link from "next/link";
import { Calendar, Image as ImageIcon, Images, Lock } from "lucide-react";

import { CycledCover } from "@/components/app/dashboard/cover-cycle";
import { formatCount } from "@/lib/format/count";
import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

/**
 * The dashboard event card (Phase 5 S2a, the ratified STAT-FORWARD V3): a 16:10
 * cover with the event identity + stats as an OVERLAY (white chrome on a dark
 * gradient, legible over any photo OR the no-cover dark fallback, in both
 * themes). Presentational + server-renderable - the only interactive piece, the
 * QR chip, arrives as the client `qrSlot` (a sibling of the Link, so tapping it
 * never navigates). Used for the dashboard's events list (the events you host
 * and the events you added to), the bin, and the public profile's grid.
 *
 * `href: null` = an unopenable card with a lock fallback: a guest album whose
 * host has since made it private (the guestEventCardProps privacy contract), a
 * binned event, or a profile's attended card (attendance is not a capability).
 * `variant` drives the chrome: hosted (QR slot + the amber review chip +
 * Open/Closed + item count), guest (the profile's own Guest marker + byline: an
 * event you added photos to, guest by upload 2026-09-22), trash (dimmed +
 * countdown + restore action). The amber chip and `action` never coexist by
 * construction (hosted has the chip + no action; trash has an action + no
 * pending; guest wears its marker there unless a caller hands an action), so the
 * top-right slot never collides.
 */
/**
 * ★ DARK GLASS, ON PAPER TOO (`paper=dark`, Will 2026-09-20). A chip over a
 * photograph is chrome over a photograph whatever the page under it is made of,
 * so this one pane serves the light dashboard and the dark one identically. The
 * border went with it: the material carries its own lip and hairline as inset
 * shadows, and a real border would have made the chip a different size from
 * every other glass surface in the product.
 */
const PILL = cn(
  "flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-medium text-white",
  GLASS_MARK,
);

/**
 * WHOSE PARTY THIS IS TO YOU: "Host" or "Guest", on the card's own chrome (Will, `made-of=covers`,
 * 2026-09-19, for the public profile: "maybe we could just have host/guest UI on each event card to
 * denote within a single group"). It was the profile page's own piece; since guest by upload
 * (2026-09-22) the dashboard's cards for the events you added to wear the same word, so the marker
 * lives with the card and both pages draw one object. The same pill as the date beside it, on the
 * one glass material.
 */
export function RoleMarker({ role }: { role: "host" | "guest" }) {
  return (
    <span
      className={cn(
        "flex h-5 items-center rounded-full px-2 text-[10px] font-medium text-white",
        GLASS_MARK,
      )}
    >
      {role === "host" ? "Host" : "Guest"}
      <span className="sr-only">
        {role === "host" ? ": hosted this event" : ": added photos here"}
      </span>
    </span>
  );
}

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
  living,
}: {
  href: string | null;
  name: string;
  coverUrl: string | null;
  dateLabel: string;
  variant?: "hosted" | "guest" | "trash";
  /** Hosted: the "N items" pill (approved count). */
  itemsLabel?: string | null;
  /** A status pill: Open/Closed (hosted), the countdown (trash), Password (guest). */
  statusLabel?: string | null;
  /** Hosted: the amber "N to review" chip (rendered only when > 0). */
  pendingCount?: number;
  /** Guest: "Hosted by X". */
  byline?: string | null;
  /** Hosted: the client QR trigger (a sibling of the Link; tapping it never navigates). */
  qrSlot?: React.ReactNode;
  /** Top-right action: restore (trash), or a page's own marker (the profile's Host/Guest). */
  action?: React.ReactNode;
  /**
   * The dashboard's crossfade (`reel-host`, his `pulse` note): the stills this card dissolves
   * through when its turn comes in the row's `CoverCycleProvider`, its cover first. Absent, or
   * fewer than two, and the card holds its `coverUrl`, as every other page draws it.
   */
  living?: { id: string; stills: readonly string[] };
}) {
  const locked = href === null;

  const cycles = Boolean(living && living.stills.length > 1);

  const surface = (
    <>
      {living && cycles ? (
        <CycledCover id={living.id} stills={living.stills} />
      ) : coverUrl ? (
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
        {/* The ladder's `subsection` step: the app's quiet middle, one rank
            over a card title and well under a page title (its two ends live in
            theme.css). It was a hand-rolled `text-xl` no type hook could reach
            until the wiring (2026-09-17). */}
        <h3 className="truncate font-heading text-subsection">{name}</h3>
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
    //
    // ★ data-lit IS ON THE ROUNDED BOX BELOW, NEVER ON THIS WRAPPER. This div
    // has no radius (it only positions the chips over the card), and the bright
    // edge inherits the radius of whatever carries the hook: on a square
    // wrapper it would draw a square rim around a rounded photograph, which is
    // the mismatch Will caught on the light board (globals.css, [data-lit]).
    <div data-media-tile data-static className="group relative">
      {href ? (
        <Link
          href={href}
          data-lit=""
          className="relative block aspect-[16/10] overflow-hidden rounded-xl transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.99] motion-reduce:active:scale-100"
        >
          {surface}
        </Link>
      ) : (
        <div
          data-lit=""
          className={cn(
            "relative block aspect-[16/10] cursor-default overflow-hidden rounded-xl",
            variant === "trash" && "opacity-75 grayscale",
          )}
        >
          {surface}
        </div>
      )}

      {/* Top-LEFT: the hosted QR chip. */}
      {qrSlot && <div className="absolute top-2.5 left-2.5 z-10">{qrSlot}</div>}

      {/* Top-RIGHT: the amber review chip (hosted) OR the action (trash, or a
          page's own marker) OR the Guest marker (guest); mutually exclusive by
          variant, so they never overlap. */}
      {pendingCount > 0 && (
        <div
          className="absolute top-2.5 right-2.5 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            background: "var(--warning)",
            color: "var(--warning-foreground)",
          }}
        >
          {formatCount(pendingCount)} to review
        </div>
      )}
      {action ? (
        <div className="absolute top-2.5 right-2.5 z-10">{action}</div>
      ) : variant === "guest" ? (
        <div className="pointer-events-none absolute top-2.5 right-2.5 z-10">
          <RoleMarker role="guest" />
        </div>
      ) : null}
    </div>
  );
}

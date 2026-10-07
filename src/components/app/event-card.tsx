import Link from "next/link";
import {
  Calendar,
  Film,
  Image as ImageIcon,
  Lock,
  type LucideIcon,
} from "lucide-react";

import { RangeText } from "@/lib/format/range-text";
import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

/**
 * WHAT A CARD WITH NO COVER SHOWS, said by the caller rather than read off its link (crumbs-44). A
 * card's cover is the album's newest approved PHOTOGRAPH (`event_covers`, photo only), so a card can
 * be bare for three different reasons, and each gets its own face on the dark gallery ground:
 *   - `photo`: the album holds no photograph yet (an empty album, or one behind a door that shows
 *     no thumbnail);
 *   - `video`: the album holds only video, which no card draws: a profile's attended card whose
 *     party is all video (its gates proved, `getPublicProfileAttendedCoverUrls`);
 *   - `locked`: the album is closed to this viewer (a guest card whose host made it private).
 * ★ A MISSING LINK IS NOT A LOCK. A profile's attended card carries no link because attendance is
 * not a capability grant, while its album is open by the RPC's own gate; read off `href: null`, the
 * face told every visitor that album was locked. So the lock is only ever the default for an
 * unlinked card that names no face of its own.
 */
export type EventCardFace = "photo" | "video" | "locked";

const EMPTY_FACE: Record<EventCardFace, LucideIcon> = {
  photo: ImageIcon,
  video: Film,
  locked: Lock,
};

/**
 * A party as a card (Phase 5 S2a, the ratified STAT-FORWARD V3): a 16:10 cover
 * with the event identity + its pills as an OVERLAY (white chrome on a dark
 * gradient, legible over any photo OR the no-cover dark fallback, in both
 * themes). Presentational + server-renderable. The public profile's grid draws
 * it; the dashboard's tile is its own (`dashboard/event-tile.tsx`).
 *
 * `href: null` = an unopenable card: a guest album whose host has since made it
 * private, or a profile's attended card (attendance is not a capability). Bare
 * of a cover, the first wears the lock by default and the second names its own
 * face (`empty`). `variant` drives the chrome: hosted (the default, its pills
 * alone), guest (the Guest marker + byline: an event you added photos to, guest
 * by upload 2026-09-22). A caller's `action` takes the top-right in place of the
 * guest marker (the profile hands its own Host/Guest), so that slot holds one.
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
  statusLabel,
  byline,
  action,
  empty,
}: {
  href: string | null;
  name: string;
  coverUrl: string | null;
  dateLabel: string;
  variant?: "hosted" | "guest";
  /** A status pill: the door a linked album still keeps (the profile's Password, Private). */
  statusLabel?: string | null;
  /** Guest: "Hosted by X". */
  byline?: string | null;
  /** Top-right: a page's own marker (the profile's Host/Guest), in place of the guest variant's. */
  action?: React.ReactNode;
  /**
   * The face a card with no cover wears (`EventCardFace`). Omitted, an unlinked card is locked and
   * a linked one is waiting for a photograph.
   */
  empty?: EventCardFace;
}) {
  const face: EventCardFace = empty ?? (href === null ? "locked" : "photo");
  const EmptyIcon = EMPTY_FACE[face];

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
        <div
          data-face={face}
          className="absolute inset-0 flex items-center justify-center bg-gallery text-gallery-muted"
        >
          <EmptyIcon className="size-7" aria-hidden />
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
            <RangeText text={dateLabel} />
          </span>
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
          className="relative block aspect-[16/10] focus-halo overflow-hidden rounded-xl transition-transform duration-150 ease-emphasis outline-none active:scale-[0.99] motion-reduce:active:scale-100"
        >
          {surface}
        </Link>
      ) : (
        <div
          data-lit=""
          className="relative block aspect-[16/10] cursor-default overflow-hidden rounded-xl"
        >
          {surface}
        </div>
      )}

      {/* Top-RIGHT: a page's own action (the profile's Host/Guest marker) OR,
          for a guest card handed none, the Guest marker: one or the other, so
          they never overlap. */}
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

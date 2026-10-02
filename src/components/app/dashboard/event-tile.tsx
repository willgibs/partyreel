import type { ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

import { CycledCover } from "@/components/app/dashboard/cover-cycle";
import { LiveDot, Mark, StateDot } from "@/components/app/dashboard/marks";
import { RoleMarker } from "@/components/app/event-card";
import type { EventListRow } from "@/lib/dashboard/events-view";
import { cn } from "@/lib/utils";

/**
 * AN EVENT'S TILE (host-dashboard r1, the carried `tile` call): its photograph, or its date before it
 * has one; its name and when; and at most a mark in each top corner (Live; one state: a count waiting,
 * or its step while the week puts it on the page). The QR chip and the date, items and Open or Paused
 * pills moved off: the code is the event's Invite, the counts are the rows view's and the stage's, so
 * forty tiles read as forty photographs.
 *
 * ★ THE DASHBOARD'S OWN ATOM. `EventCard` keeps drawing a profile's public cards as they were (its Host
 * and Guest marker, its pills): those are another surface's, read by visitors, and no board has asked
 * them to change. A cover rule (a sealed album's, say) lives in `event_covers` and its queries, never
 * here.
 *
 * ★ A PARTY THAT HAS NOT HAPPENED HAS NO PHOTOGRAPH, so it never wears a stand-in: before its first,
 * the tile is the page's own quiet card carrying the one fact it has, its day, set like the date on an
 * invitation, and a week of parties to come reads as a calendar rather than a row of black blanks.
 */

export type TileSize = "lg" | "md" | "sm";

/**
 * A tile's name by its size. ★ EACH ITS OWN STRING: the heading face carries its one weight, and a
 * weight class in the same class expression would beat it (`type-ladder-policy.test.ts`), so the
 * small size's Inter weight never shares a string with the face.
 */
const NAME: Record<TileSize, string> = {
  lg: "font-heading text-subsection",
  md: "font-heading text-card-title",
  sm: "text-xs font-medium",
};

function DateFace({
  face,
  size,
}: {
  face: EventListRow["face"];
  size: TileSize;
}) {
  return (
    <div
      data-tile-face={face ? "date" : "undated"}
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center bg-muted text-foreground",
        size === "sm" ? "pb-5" : "pb-9",
      )}
    >
      {face ? (
        size === "sm" ? (
          <>
            <span className="text-micro font-medium tracking-[0.08em] text-muted-foreground uppercase">
              {face.month}
            </span>
            <span className="font-heading text-card-title tabular-nums">
              {face.day}
            </span>
          </>
        ) : (
          <>
            <span className="text-label text-muted-foreground uppercase">
              {`${face.weekday} · ${face.month}`}
            </span>
            <span className="mt-1 font-heading text-section tabular-nums">
              {face.day}
            </span>
          </>
        )
      ) : (
        <span className="text-label text-muted-foreground uppercase">
          No date
        </span>
      )}
    </div>
  );
}

function LockFace() {
  return (
    <div
      data-tile-face="locked"
      className="absolute inset-0 flex items-center justify-center bg-muted pb-6 text-muted-foreground"
    >
      <Lock className="size-5" aria-hidden />
    </div>
  );
}

/**
 * A mark as its words where the tile has room for them, and as a dot where it has not: a tile narrower
 * than 15rem (a thumbnail, or a phone's two across) keeps each state as a dot with its words for a
 * reader that cannot see it, so a mark never sits on the date a tile is showing.
 */
const WIDE = "hidden @min-[15rem]/tile:block";
const NARROW = "@min-[15rem]/tile:hidden";

function Pip({
  at,
  photo,
  label,
  className,
  children,
}: {
  at: "left" | "right";
  photo: boolean;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "absolute top-1.5 flex size-3.5 items-center justify-center rounded-full",
        at === "left" ? "left-1.5" : "right-1.5",
        photo ? "bg-black/35" : "bg-background shadow-lift",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EventTile({
  row,
  size,
  action,
}: {
  row: EventListRow;
  size: TileSize;
  /** The top right corner's own act (the bin's Restore). */
  action?: ReactNode;
}) {
  const photo = Boolean(row.coverUrl);
  const cycles = row.kind === "hosted" && row.stills.length > 1;
  const surface = (
    <>
      {cycles ? (
        <CycledCover id={row.id} stills={row.stills} />
      ) : row.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
        <img
          src={row.coverUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      ) : row.kind === "hosted" ? (
        <DateFace face={row.face} size={size} />
      ) : (
        <LockFace />
      )}
      {photo && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      )}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0",
          photo ? "text-white" : "text-foreground",
          size === "sm" ? "p-2" : "p-3",
        )}
      >
        <h3 className={cn("truncate", NAME[size])}>{row.name}</h3>
        {size !== "sm" && (
          <p
            className={cn(
              "mt-0.5 truncate text-xs",
              photo ? "text-white/75" : "text-muted-foreground",
            )}
          >
            {row.kind === "hosted"
              ? row.when
              : row.kind === "deleted"
                ? row.statusLabel
                : (row.byline ?? row.dateLabel)}
          </p>
        )}
      </div>
    </>
  );

  const box = cn(
    "relative block aspect-[3/2] overflow-hidden",
    size === "sm" ? "rounded-lg" : "rounded-xl",
  );
  const on = photo ? "photo" : "page";
  const state = row.marks?.state ?? null;

  return (
    // data-static: a host management tile, so no arrival fade (no entrance theatre on host).
    <div
      data-media-tile
      data-static
      data-tile={row.kind}
      data-tile-size={size}
      className="group/tile @container/tile relative"
    >
      {row.href ? (
        <Link
          href={row.href}
          data-lit={photo ? "" : undefined}
          className={cn(
            box,
            "transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.99] motion-reduce:active:scale-100",
          )}
        >
          {surface}
        </Link>
      ) : (
        <div
          data-lit={photo ? "" : undefined}
          className={cn(
            box,
            "cursor-default",
            row.kind === "deleted" && "opacity-75 grayscale",
          )}
        >
          {surface}
        </div>
      )}

      {row.marks?.live && (
        <>
          {size !== "sm" && (
            <span
              className={cn("pointer-events-none absolute top-2 left-2", WIDE)}
            >
              <Mark tone="live" on={on}>
                Live
              </Mark>
            </span>
          )}
          <Pip
            at="left"
            photo={photo}
            label="Live"
            className={size === "sm" ? undefined : NARROW}
          >
            <LiveDot small />
          </Pip>
        </>
      )}
      {action ? (
        <span className="absolute top-2 right-2 z-10">{action}</span>
      ) : row.kind === "guest" ? (
        <span className="pointer-events-none absolute top-2 right-2">
          <RoleMarker role="guest" />
        </span>
      ) : state ? (
        <>
          {size !== "sm" && (
            <span
              className={cn("pointer-events-none absolute top-2 right-2", WIDE)}
            >
              <Mark tone={state.tone} on={on}>
                {state.text}
              </Mark>
            </span>
          )}
          <Pip
            at="right"
            photo={photo}
            label={state.text}
            className={size === "sm" ? undefined : NARROW}
          >
            <StateDot
              tone={state.tone}
              className={cn(
                "size-1.5",
                state.tone === "setup" &&
                  (photo ? "text-white" : "text-foreground/60"),
              )}
            />
          </Pip>
        </>
      ) : null}
    </div>
  );
}

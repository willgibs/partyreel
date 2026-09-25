"use client";

import type { CSSProperties } from "react";
import { Download, ImageUp, Share2, SlidersHorizontal } from "lucide-react";

import { MediaTile } from "@/components/app/media-grid";
import { PosterCard } from "@/components/reel/poster-card";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import {
  ALBUM,
  ARRIVED,
  DESCRIPTION,
  EVENT,
  HOST,
  PRIYA,
  REEL_STILL,
} from "./fixtures";

/**
 * THE ALBUM BEHIND THE DOOR, drawn the way production draws it and never
 * redesigned here: the guest header, the words column (the event's name, the
 * byline, the stats line, the host's description when she wrote one, the action
 * row), the Highlight reel tile as a still, and the album on the shipped column
 * rule in the shipped tile.
 *
 * ★ QUOTED WHERE PRODUCTION READS A SESSION. `GuestHeader` resolves the
 * visitor's Supabase session the moment it mounts, which inside a lab frame is
 * whoever is signed in on THIS machine, not Priya, so its markup is copied with
 * the session read taken out. `PosterCard`, `MediaTile` and `GALLERY_COLUMNS`
 * are the real, session-free pieces, imported as they are.
 *
 * ★ STILL, ON PURPOSE. The reel tile behind the door rests on one still (his
 * `reel-front.door=stills`: "lets us potentially use a bit of motion in our
 * welcome flow without clashing with a moving reel behind"), and the two
 * photographs that landed while she stands here wear the album's own arrival
 * light held at its peak (`data-door-arrived`, the `data-arrived` rim and
 * wash), because motion on this board lives only in the sheet. Through the
 * scrim's blur that light is what reads as the party still happening.
 */

type Who = "stranger" | "named" | "emailed";

/** `guest-header.tsx`'s three states, markup copied, session read removed. */
function Header({ who }: { who: Who }) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <span className="flex items-center gap-2.5">
        <Logo />
      </span>
      <div className="flex h-8 items-center">
        {who === "stranger" ? (
          <Button variant="ghost" size="sm" tabIndex={-1}>
            Start for free
          </Button>
        ) : (
          <span
            data-door-trigger
            className="flex items-center gap-2 rounded-full"
          >
            {/* No seed: a colour is an identity, and hers is not proven. */}
            <Avatar size="sm">
              <AvatarFallback className="text-[10px]">
                {PRIYA.name.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-28 truncate text-sm">{PRIYA.name}</span>
          </span>
        )}
      </div>
    </header>
  );
}

/** The byline's host face, used by the ground and by every direction. */
export function HostAvatar({
  size = "sm",
  className,
}: {
  size?: "sm" | "default" | "lg" | "xl";
  className?: string;
}) {
  return (
    <Avatar seed={HOST.seed} size={size} className={className}>
      <AvatarImage src={HOST.avatar} alt="" className="object-cover" />
      <AvatarFallback>{HOST.name.slice(0, 1)}</AvatarFallback>
    </Avatar>
  );
}

function ReelStill() {
  return (
    <div data-door-reel>
      <PosterCard
        eventName="Highlight reel"
        meta="Make your own clip to share"
        media={
          <div className="relative aspect-[2/1] w-full overflow-hidden bg-muted sm:aspect-[21/9]">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local fixture still standing in for the tile's resting frame */}
            <img
              src={REEL_STILL}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        }
      />
    </div>
  );
}

function Tile({ item }: { item: (typeof ALBUM)[number] }) {
  return (
    <div
      data-media-tile
      data-door-arrived={ARRIVED.has(item.id) ? "" : undefined}
      style={
        {
          aspectRatio: `${item.width} / ${item.height}`,
          borderRadius: "var(--radius-tile)",
        } as CSSProperties
      }
      className="relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10"
    >
      <MediaTile item={item} playBadge="none" />
    </div>
  );
}

/**
 * The whole page behind the door. `who` is the header's state: a stranger at
 * the door, then Priya once she is inside (her name menu's trigger, and the
 * action row's Add photos, which only a named guest is offered).
 */
export function AlbumGround({
  who,
  description,
}: {
  who: Who;
  /** Maya wrote a description (the `greeting` knob): the page shows it too. */
  description: boolean;
}) {
  const inside = who !== "stranger";
  return (
    <div
      data-door-ground
      className="flex min-h-screen flex-col bg-background text-foreground"
    >
      <Header who={who} />
      <div className="w-full flex-1 pt-8 pb-24">
        <div className="w-full max-w-2xl px-5">
          <header>
            <h1 className="font-heading text-page text-balance">
              {EVENT.name}
            </h1>
            <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="text-faint">Hosted by</span>
                <HostAvatar />
                <span className="font-medium text-foreground">{HOST.name}</span>
              </span>
              <span aria-hidden className="text-faint">
                ·
              </span>
              <span>{EVENT.date}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {`${EVENT.approvedTotal} photos & videos from ${EVENT.guestCount} guests`}
            </p>
            {description && (
              <p className="mt-2 max-w-prose text-reading text-pretty text-muted-foreground">
                {DESCRIPTION}
              </p>
            )}
          </header>
          <div className="mt-4">
            {inside && (
              <Button type="button" size="lg" className="w-full" tabIndex={-1}>
                <ImageUp /> Add photos
              </Button>
            )}
            <div className="mt-2 grid grid-cols-1 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full"
                tabIndex={-1}
              >
                <Share2 /> Invite
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-7 mb-4 w-full max-w-2xl px-5">
          <ReelStill />
        </div>
        <div className="px-3 sm:px-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
            <p className="px-0.5 text-working text-muted-foreground tabular-nums">
              {`${EVENT.approvedTotal} photos & videos`}
            </p>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
                <Download className="size-4" /> Download all
              </span>
              <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                <SlidersHorizontal /> View
              </Button>
            </div>
          </div>
          <div className={GALLERY_COLUMNS}>
            {ALBUM.map((item) => (
              <Tile key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

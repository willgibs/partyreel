"use client";

import { Clapperboard, ImageUp, Play, QrCode } from "lucide-react";
import Image from "next/image";

import { PosterCard } from "@/components/reel/poster-card";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatCount, formatMediaCount } from "@/lib/format/count";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { layoutRows, perRowFor } from "@/lib/shared/album-rows";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { ALBUM, type AlbumStill, type Person } from "./fixtures";
import { stopLinks } from "./scene";

/**
 * THE DEMO ALBUM'S FIRST SCREEN, AS A PHONE OPENS IT, QUOTED
 * (`event-experience.tsx`, `guest-header.tsx`, `live-reel.tsx`,
 * `gallery-rows.tsx`): the header with its Demo mark, the words' column (the
 * title, the byline, the stats line, the host's line), the action block with
 * the demo's Start your own beside Invite, the Highlight reel tile, then the
 * album's own box and its first rows. Today's words at today's sizes; only
 * the event is the story's.
 *
 * ★ THE ROWS ARE THE ALBUM'S OWN ENGINE: `layoutRows` at the phone's default
 * step (`perRowFor`), the gallery's 4 px gap, over the stills' declared
 * shapes, so the first row breaks where the real album would break it.
 *
 * ★ ONLY THE NAME AND THE HOST CHANGE BY OPTION: the `door` decision names
 * the album (Partyreel Demo, Example Party, or the address's own words behind
 * a door of its own), and the rest is the demo album as it stands.
 */

/** The words' column and the album's box, `event-experience.tsx`'s own. */
const COLUMN = "w-full max-w-2xl px-5";
const BLEED = "px-3 sm:px-5";

/** The phone's album box (375 less the gutter) and the gallery's gap. */
const ROW_BOX = 375 - 24;
const ROW_GAP = 4;

/** The guest header, as a logged-out visitor meets the demo's. */
function GuestBar() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border/60 bg-background px-5 py-3">
      <span className="flex items-center gap-2.5">
        <Logo />
        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-label font-medium text-muted-foreground uppercase">
          Demo
        </span>
      </span>
      <div className="flex h-8 items-center">
        <Button variant="ghost" size="sm" tabIndex={-1}>
          Start for free
        </Button>
      </div>
    </header>
  );
}

/** One photograph of the album, object-cover in its row's box. */
function Tile({ still }: { still: AlbumStill }) {
  const img = marketingImage(still.photo);
  return (
    <span
      data-df-tile
      className="relative block size-full overflow-hidden bg-muted"
      style={{ borderRadius: "var(--radius-tile)" }}
    >
      <Image src={img.src} alt="" fill unoptimized className="object-cover" />
      {still.video ? (
        <span
          className={cn(
            "absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full",
            GLASS_MARK,
          )}
        >
          <Play
            className={cn("size-3 fill-white text-white", GLASS_MARK_LIT)}
          />
        </span>
      ) : null}
    </span>
  );
}

/** The album's first rows, laid by the album's own engine. */
function AlbumRows({ stills }: { stills: readonly AlbumStill[] }) {
  const layout = layoutRows(
    stills.map((s, i) => ({ id: String(i), ratio: s.ratio })),
    { width: ROW_BOX, gap: ROW_GAP, perRow: perRowFor(ROW_BOX, 1) },
  );
  return (
    <div className="flex flex-col" style={{ gap: ROW_GAP }}>
      {layout.rows.map((row, r) => (
        <div
          key={r}
          data-df-first-row={r === 0 ? "" : undefined}
          className="flex"
          style={{ gap: ROW_GAP, height: row.height }}
        >
          {row.ids.map((id, k) => (
            <div key={id} style={{ width: row.widths[k] }}>
              <Tile still={stills[Number(id)]} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** The byline's host face: seeded, with the initial, as the page draws it. */
function HostFace({ host }: { host: Person }) {
  return (
    <Avatar seed={host.seed} size="sm">
      <AvatarFallback>{host.initial}</AvatarFallback>
    </Avatar>
  );
}

export function AlbumPage({ title, host }: { title: string; host: Person }) {
  const album = ALBUM;
  const still = album.stills[0];
  return (
    <div
      className="min-h-full bg-background pb-8 text-foreground"
      onClickCapture={stopLinks}
    >
      <GuestBar />
      <div className="w-full pt-8">
        <div className={COLUMN}>
          <header>
            <p data-df-title className="font-heading text-page text-balance">
              {title}
            </p>
            <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="text-faint">Hosted by</span>
                <HostFace host={host} />
                <span data-df-host className="font-medium text-foreground">
                  {host.name}
                </span>
              </span>
            </p>
            <p data-df-stats className="mt-1 text-xs text-muted-foreground">
              {formatMediaCount(album.items)} from {formatCount(album.guests)}{" "}
              {album.guests === 1 ? "guest" : "guests"}
            </p>
            <p className="mt-2 max-w-prose text-reading text-pretty text-muted-foreground">
              {album.description}
            </p>
          </header>
          <div className="mt-4">
            <Button type="button" size="lg" className="w-full" tabIndex={-1}>
              <ImageUp /> Add photos
            </Button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button size="sm" className="h-9 w-full" tabIndex={-1}>
                Start your own
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full"
                tabIndex={-1}
              >
                <QrCode /> Invite
              </Button>
            </div>
          </div>
        </div>

        {/* The Highlight reel tile, on the words' column, as the page sets it. */}
        <div className={cn(COLUMN, "mt-7 mb-4")}>
          <div className="relative rounded-lg">
            <PosterCard
              eventName="Highlight reel"
              chip={
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-white",
                    GLASS_MARK,
                  )}
                >
                  <Clapperboard
                    className={cn("size-3", GLASS_MARK_LIT)}
                    aria-hidden
                  />
                </span>
              }
              meta={
                <span className="text-micro font-medium text-[oklch(0.8_0.14_300)]">
                  Make your own clip to share
                </span>
              }
              media={
                <div className="relative aspect-[2/1] w-full overflow-hidden bg-muted">
                  {still ? (
                    <Image
                      src={marketingImage(still.photo).src}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : null}
                </div>
              }
            />
          </div>
        </div>

        <div className={cn(BLEED, "mt-3")}>
          <p className="mb-3 px-0.5 text-working text-muted-foreground tabular-nums">
            {formatMediaCount(album.items)}
          </p>
          <AlbumRows stills={album.stills} />
        </div>
      </div>
    </div>
  );
}

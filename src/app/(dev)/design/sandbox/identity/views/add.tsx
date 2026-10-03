"use client";

import { useRef, useState } from "react";
import { ImageUp, Play, QrCode } from "lucide-react";

import {
  AlbumCover,
  type HeadStill,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { UploadIntentSheet } from "@/components/guest/upload/intent-sheet";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ALBUM, DATE, NAME, PHOTO } from "../fixtures";
import type { Width } from "../model";

import { MediaTile } from "./atoms";
import { useInUse } from "./in-use";

/**
 * THE GUEST'S ADD, OVER THE ALBUM: Sam holds the wedding open and presses Add
 * photos.
 *
 * ★ THE COVER AND THE SHEET ARE PRODUCTION'S (`AlbumCover` over `HeadStills`,
 * `event-header`'s wiring; `UploadIntentSheet`, every Add on the guest page):
 * the name on the reel's stills with the white Add and the glass rounds
 * standing on it, and the Add pressed the real way, so at a desk a menu opens
 * under it and in a hand two rows rise to the thumb with Cancel beneath. The
 * album under the cover is the justified rows' look over the bootstrap
 * stills, each tile lit as production's album tile is (`data-lit`).
 */

/** The cover's stills: the reel's opening, three of the bootstrap stills. */
export const STILLS: HeadStill[] = [PHOTO.toast, PHOTO.hall, PHOTO.golden].map(
  (tile, i) => ({ id: `identity-still-${i}`, tile }),
);

function Rows({ w }: { w: Width }) {
  const perRow = w === 1440 ? 4 : 2;
  const rows: (typeof ALBUM)[number][][] = [];
  for (let i = 0; i < ALBUM.length; i += perRow)
    rows.push(ALBUM.slice(i, i + perRow));
  return (
    <div
      className={cn("flex flex-col", w === 1440 ? "px-5" : "px-3")}
      style={{ gap: "var(--gap-gallery)" }}
    >
      {rows.map((row, r) => (
        <div
          key={r}
          className="flex"
          style={{ gap: "var(--gap-gallery)", height: w === 1440 ? 250 : 150 }}
        >
          {row.map((p) => (
            <MediaTile
              key={p.src}
              src={p.src}
              pos={p.pos}
              style={{ flex: `${p.ratio} 1 0` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AddScreen({ w }: { w: Width }) {
  const desk = w === 1440;
  const [open, setOpen] = useState(false);
  const add = useRef<HTMLButtonElement | null>(null);
  // The real press, once the page has settled: the sheet records the button
  // pressed and opens under it (`usePressedAnchor`), as it does for a guest.
  useInUse([[450, () => add.current?.click()]]);
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <Logo />
        <Button variant="ghost" size="sm">
          Start for free
        </Button>
      </header>
      <AlbumCover
        ground={<HeadStills stills={STILLS} />}
        name={NAME}
        host={{ name: "Maya", avatarUrl: null, seed: "identity-host" }}
        date={DATE}
        description="Everything from tonight, in one place. Add what you take, whenever you get to it."
        mediaCount={214}
        guestCount={38}
        actions={
          <>
            <Button
              ref={add}
              variant="on-photo"
              size="cta"
              className={cn("min-w-0", desk ? "md:flex-none" : "flex-1")}
              onClick={() => setOpen(true)}
            >
              <ImageUp /> Add photos
            </Button>
            <Button
              variant="glass"
              size="icon-cta"
              aria-label="Watch the highlight reel"
            >
              <Play className="fill-current" />
            </Button>
            <Button variant="glass" size="icon-cta" aria-label="Invite">
              <QrCode />
            </Button>
          </>
        }
      />
      <div className="relative w-full flex-1 pt-3 pb-12">
        <Rows w={w} />
      </div>
      <UploadIntentSheet
        open={open}
        onOpenChange={setOpen}
        hostName="Maya"
        onSend={() => {}}
        acceptsVideo
      />
    </div>
  );
}

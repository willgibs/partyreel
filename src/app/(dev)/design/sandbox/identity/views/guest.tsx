"use client";

import { useEffect, useRef, useState } from "react";
import { ImageUp, QrCode } from "lucide-react";

import { GuestActionDock } from "@/components/guest/guest-action-dock";
import { UploadIntentSheet } from "@/components/guest/upload/intent-sheet";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatCount, formatMediaCount } from "@/lib/format/count";
import { cn, formatEventDate } from "@/lib/utils";

import { ALBUM, DATE, NAME } from "../fixtures";
import type { Width } from "../model";

/**
 * THE GUEST'S ADD SHEET, OVER THE ALBUM: Sam holds the wedding open on his
 * phone and presses Add photos.
 *
 * ★ THE SHEET IS PRODUCTION'S (`UploadIntentSheet`, every Add in the guest
 * page): at a desk a menu under the Add pressed, in a hand the two rows rising
 * to the thumb with Cancel beneath. It opens the real way, by a press on the
 * page's Add, so it anchors where production anchors it.
 *
 * ★ THE PAGE BEHIND IT IS THE GUEST PAGE'S OWN MARKUP, QUOTED
 * (`event-experience.tsx` and `guest-header.tsx`): those are wired to the
 * session, the door and the live album, which a picture of a page must not
 * reach. Its head, its action block and the dock are production's markup and
 * components; the album is the justified rows' look (`AlbumTile`'s corner,
 * its bright edge and the gallery gap) over the bootstrap stills.
 */

/** event-experience.tsx's own column and bleed. */
const COLUMN = "w-full max-w-2xl px-5";

/** The album's first rows, justified: each row's photographs share its width by their ratios. */
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
          style={{
            gap: "var(--gap-gallery)",
            height: w === 1440 ? 260 : 150,
          }}
        >
          {row.map((p) => (
            <div
              key={p.src}
              data-media-tile=""
              data-static=""
              data-lit=""
              className="relative overflow-hidden bg-black/10"
              style={{
                flex: `${p.ratio} 1 0`,
                borderRadius: "var(--radius-tile)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, as every board draws one */}
              <img
                src={p.src}
                alt=""
                className="size-full object-cover"
                style={{ objectPosition: p.pos ?? "50% 50%" }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AddScreen({ w }: { w: Width }) {
  const [open, setOpen] = useState(false);
  const add = useRef<HTMLButtonElement | null>(null);
  // The real press, once the page has settled: the sheet records the button
  // pressed and opens under it (`usePressedAnchor`), as it does for a guest.
  //
  // ★ AND THEN THE FOCUS IS LET GO. The sheet focuses its first row as it
  // opens; after a real tap that row is focused but not drawn as focused, and
  // after a script's click (no person, so no pointer the browser saw) it is
  // drawn lit, which no guest ever sees. Letting go draws what a tap leaves.
  useEffect(() => {
    const press = window.setTimeout(() => add.current?.click(), 450);
    const letGo = window.setTimeout(
      () => (document.activeElement as HTMLElement | null)?.blur(),
      900,
    );
    return () => {
      window.clearTimeout(press);
      window.clearTimeout(letGo);
    };
  }, []);
  const count = ALBUM.length + 204;
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <span className="flex items-center gap-2.5">
          <Logo />
        </span>
        <div className="flex h-8 items-center">
          <Button variant="ghost" size="sm">
            Start for free
          </Button>
        </div>
      </header>
      <div
        data-guest-experience=""
        className="relative w-full flex-1 pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))]"
      >
        <div className={COLUMN}>
          <header>
            <h1 className="font-heading text-page text-balance">{NAME}</h1>
            <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="text-faint">Hosted by</span>
                <Avatar seed="identity-host" size="sm">
                  <AvatarFallback>M</AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">Maya</span>
              </span>
              <span aria-hidden className="text-faint">
                ·
              </span>
              <span>{formatEventDate(DATE)}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatMediaCount(count)} from {formatCount(38)} guests
            </p>
            <p className="mt-2 max-w-prose text-reading text-pretty text-muted-foreground">
              Everything from tonight, in one place. Add what you take, whenever
              you get to it.
            </p>
          </header>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <Button
                ref={add}
                type="button"
                size="lg"
                className="min-w-0 flex-1"
                onClick={() => setOpen(true)}
              >
                <ImageUp /> Add photos
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-full"
                >
                  <QrCode /> Invite
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-7">
          <Rows w={w} />
        </div>
      </div>
      <GuestActionDock hidden uploadingCount={0} onAdd={() => setOpen(true)} />
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

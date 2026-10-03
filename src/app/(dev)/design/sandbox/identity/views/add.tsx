"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, ImageUp, Images, QrCode, Users } from "lucide-react";

import { UploadIntentSheet } from "@/components/guest/upload/intent-sheet";
import { Logo } from "@/components/shared/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn, formatEventDate } from "@/lib/utils";

import { ALBUM, DATE, NAME, PHOTO } from "../fixtures";
import type { Width } from "../model";

import { GlassButton, GlyphCount, Live, PhotoSurface } from "./atoms";

/**
 * THE GUEST'S ADD, OVER THE ALBUM: Sam holds the wedding open and presses Add
 * photos.
 *
 * ★ THE SHEET IS PRODUCTION'S (`UploadIntentSheet`, every Add on the guest
 * page): at a desk a menu under the Add pressed, in a hand two rows rising to
 * the thumb with Cancel beneath. It opens the real way, by a press on the
 * page's Add, so it anchors where production anchors it.
 *
 * ★ THE ALBUM'S HEAD IS A STAND-IN FOR THE COVER `header-wiring` builds this
 * round (event-header's `guest=cover`): the name on the reel's still, the
 * white Add and the glass rounds standing on it, the counts as glyphs. It is
 * drawn only as far as the atoms it holds, which are this board's to dress;
 * its composition is that lane's. The album is the justified rows' look over
 * the bootstrap stills, at the photograph's 2px.
 */

const COLUMN = "w-full max-w-2xl px-5";

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
            <div
              key={p.src}
              data-media-tile=""
              data-static=""
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
  const desk = w === 1440;
  const [open, setOpen] = useState(false);
  const add = useRef<HTMLButtonElement | null>(null);
  // The real press, once the page has settled: the sheet records the button
  // pressed and opens under it (`usePressedAnchor`), as it does for a guest.
  // ★ AND THEN THE FOCUS IS LET GO: after a script's click (no pointer the
  // browser saw) the first row is drawn lit, which no guest ever sees.
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
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <Logo />
        <Button variant="ghost" size="sm">
          Start for free
        </Button>
      </header>
      <PhotoSurface
        src={PHOTO.toast}
        pos="50% 40%"
        style={{ height: desk ? 300 : 340 }}
      >
        <div
          className={cn(
            "mx-auto flex h-full flex-col justify-between pt-5 pb-6",
            COLUMN,
          )}
        >
          <div className="flex items-center justify-between">
            <Live />
            <div className="flex items-center gap-4">
              <GlyphCount icon={Images} n={214} words="photos and videos" />
              <GlyphCount icon={Users} n={38} words="guests" />
              <GlyphCount icon={Eye} n={1204} words="views" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h1 className="font-heading text-page text-balance text-white">
                {NAME}
              </h1>
              <p className="mt-1 text-sm text-white/80">
                Hosted by Maya · {formatEventDate(DATE)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                ref={add}
                type="button"
                data-slot="button"
                data-variant="on-photo"
                data-size="lg"
                className={cn(buttonVariants({ size: "lg" }), "min-w-0 flex-1")}
                onClick={() => setOpen(true)}
              >
                <ImageUp /> Add photos
              </button>
              <GlassButton icon={QrCode} label="Invite" />
            </div>
          </div>
        </div>
      </PhotoSurface>
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

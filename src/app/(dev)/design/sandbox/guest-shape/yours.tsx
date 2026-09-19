"use client";

import { Download, Heart, Share2, Trash2, Undo2 } from "lucide-react";

import { MediaTile } from "@/components/app/media-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ALBUM } from "./fixtures";
import type { ScreenId } from "./page-parts";

/**
 * A GUEST AND THE PHOTOGRAPH THEY JUST ADDED.
 *
 * The lightbox HAS a delete affordance and the guest surface never passes it:
 * `onDeleteCurrent` is the personal Uploads feed's, and a guest looking at
 * their own photograph on a host's album has no way to take it back, no line
 * saying so, and nothing to tap. Whatever this answers, the host's own
 * moderation is untouched and so is every anti-abuse piece: the capability
 * token, the presigned URLs and the limiters are out of frame.
 *
 * ★ THE VIEWER IS QUOTED, THE TILE IS REAL. `MediaLightbox` is a radix Dialog
 * that portals to `document.body` and would leave the frame; its floating pill
 * stack is reproduced here class for class (`bg-black/55 px-5 py-2.5
 * backdrop-blur-sm` over the attribution capsule) and the photograph inside it
 * is the shipped `MediaTile`.
 */

export type YoursShape = "never" | "window" | "mine";

export const yoursOf = (v: string | undefined): YoursShape =>
  v === "never" ? "never" : v === "mine" ? "mine" : "window";

const ACTION =
  "text-white/80 outline-none hover:text-white active:scale-90 motion-reduce:active:scale-100";

const MINE = ALBUM.slice(0, 4);

/** The lightbox, quoted: the photograph, the action pill, the attribution. */
function Viewer({
  screen,
  remove,
  note,
}: {
  screen: ScreenId;
  /** The Remove affordance sits in the pill's own row, after Share. */
  remove?: boolean;
  /** The line the attribution capsule carries in place of the counter. */
  note: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className={cn(
            "flex h-full w-full items-center justify-center",
            screen === "1440" && "px-24",
          )}
        >
          <div
            className="relative h-full max-h-full w-auto"
            style={{ aspectRatio: "3 / 4" }}
          >
            <MediaTile item={{ ...ALBUM[0], type: "photo" }} playBadge="none" />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex flex-col items-center gap-1.5">
          <div
            data-gs-pill
            className="pointer-events-auto flex items-center gap-4 rounded-full bg-black/55 px-5 py-2.5 backdrop-blur-sm"
          >
            <button type="button" aria-label="Like" className={ACTION}>
              <Heart className="size-5" />
            </button>
            <button type="button" aria-label="Save" className={ACTION}>
              <Download className="size-5" />
            </button>
            <button type="button" aria-label="Share" className={ACTION}>
              <Share2 className="size-5" />
            </button>
            {remove && (
              <>
                <span aria-hidden className="h-5 w-px bg-white/20" />
                <button
                  type="button"
                  aria-label="Remove"
                  className={cn(ACTION, "hover:text-destructive")}
                >
                  <Undo2 className="size-5" />
                </button>
              </>
            )}
          </div>
          <div className="pointer-events-none flex max-w-[88vw] flex-col items-center gap-1 rounded-full bg-black/55 px-3 py-1 text-center backdrop-blur-sm">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/90">
              {note}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * THE THREE ANSWERS.
 *
 * `never`  — the promise is made at the upload moment, not hunted for later:
 *            a line under the Add button, and the viewer keeps three actions.
 * `window` — the viewer gains a Remove on a photograph this device added, for
 *            as long as the window lasts; the capsule says how long is left.
 * `mine`   — everything this device added, in one place on the album, each
 *            with a Remove until the host closes uploads.
 */
export function Yours({
  shape,
  screen,
}: {
  shape: YoursShape;
  screen: ScreenId;
}) {
  if (shape === "never")
    return (
      <Viewer screen={screen} note="Maya · 1 of 34" />
    );
  if (shape === "window")
    return (
      <Viewer
        screen={screen}
        remove
        note="Yours · you can take it back for 4 more minutes"
      />
    );
  return null;
}

/** The line the `never` option puts where the promise belongs: at the act. */
export function UploadPromise() {
  return (
    <p className="mt-2 text-center text-[13px] text-muted-foreground">
      Photos you add join {"Maya's"} album for good. Check before you send.
    </p>
  );
}

/** The `mine` option's own strip, in the album, above the photographs. */
export function MineStrip({ screen }: { screen: ScreenId }) {
  return (
    <section
      data-gs-mine
      className="mb-7 rounded-lg bg-card p-4 ring-1 ring-foreground/10"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Yours, 4 photos</p>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Hide
        </Button>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Only you see this. Remove any of them until Maya closes uploads.
      </p>
      <div
        className={cn(
          "mt-3 grid gap-[var(--gap-gallery)]",
          screen === "1440" ? "grid-cols-8" : "grid-cols-4",
        )}
      >
        {MINE.map((item) => (
          <div
            key={item.id}
            data-lit=""
            className="relative aspect-square overflow-hidden bg-black/10"
            style={{ borderRadius: "var(--radius-tile)" }}
          >
            <MediaTile item={item} playBadge="none" />
            <button
              type="button"
              aria-label="Remove"
              className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:text-destructive active:scale-90 motion-reduce:active:scale-100"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

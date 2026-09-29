"use client";

import { cn } from "@/lib/utils";

import type { CameraId } from "./cam-shared";
import { EVENT, ROLL_STILLS, SCENE } from "./fixtures";
import { FilmStill, type LookId } from "./film";

/**
 * A CAMERA, SMALL: each of the four cameras as a thumbnail that carries its
 * signature (the ring, the body's window, the strip, the wrapper's names), so
 * Create can show a host what her guests will hold without drawing a phone.
 */
export function CameraThumb({
  id,
  look,
  className,
}: {
  id: CameraId;
  look: LookId;
  className?: string;
}) {
  if (id === "body")
    return (
      <span
        className={cn("dm-thumb dm-thumb-body", className)}
        data-dm-thumb="body"
      >
        <span className="dm-thumb-label">{EVENT.name}</span>
        <span className="dm-thumb-window">
          <FilmStill
            still={SCENE}
            look={look}
            stamp={false}
            className="size-full"
          />
        </span>
        <span className="dm-thumb-dial">18</span>
      </span>
    );
  if (id === "wrapper")
    return (
      <span
        className={cn("dm-thumb dm-thumb-wrap", className)}
        data-dm-thumb="wrapper"
      >
        <span className="dm-thumb-name">{EVENT.name}</span>
        <span className="dm-thumb-window">
          <FilmStill
            still={SCENE}
            look={look}
            stamp={false}
            className="size-full"
          />
        </span>
      </span>
    );
  return (
    <span
      className={cn("dm-thumb dm-thumb-screen", className)}
      data-dm-thumb={id}
    >
      <FilmStill
        still={SCENE}
        look={look}
        stamp={false}
        className="aspect-[3/4] w-full"
        position="50% 45%"
      />
      {id === "reel" ? (
        <span className="dm-thumb-strip" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <span
              key={i}
              data-state={i < 3 ? "exposed" : i === 3 ? "current" : "fresh"}
            />
          ))}
        </span>
      ) : (
        <span className="dm-thumb-shutter" aria-hidden />
      )}
    </span>
  );
}

/** The album, small: six photographs in its rows, as a guest meets it. */
export function AlbumThumb({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid grid-cols-2 grid-rows-3 gap-0.5 overflow-hidden rounded-md bg-muted",
        className,
      )}
      data-dm-thumb="album"
    >
      {ROLL_STILLS.slice(1, 7).map((s) => (
        // eslint-disable-next-line @next/next/no-img-element -- a local still in a small picture of the album
        <img key={s.id} src={s.src} alt="" className="size-full object-cover" />
      ))}
    </span>
  );
}

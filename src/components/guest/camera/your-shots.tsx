"use client";

/**
 * HER SHOTS, ONE TAP FROM THE CAMERA (the board's carried call `end`: "her shots one tap away"; the brief: "Her shots
 * stay hers ... removable, a removal freeing its frame live"). The reel opens it, and the roll's end's See your shots.
 *
 * ★ HERS, AS SHE TOOK THEM, AND NOBODY ELSE'S: this visit's shots drawn from the frame each froze on (her own device's
 * pictures), and an earlier visit's from the picture the server presigns for her alone (`/api/guests/mine`'s `picture`,
 * held or sealed only); a shot already in the album is drawn there, not here.
 *
 * ★ A SHOT THE ALBUM CANNOT SHOW YET IS HERS TO TAKE BACK, AND TAKING IT BACK FREES ITS FRAME (Will's overrule): sealed
 * until the album develops, or held for the host, as her tracker's rule (`upload-tracker.tsx`'s `removable`). A shot in
 * the album is removed from the album, where the photo viewer's Delete is its door. No confirm, as in her tracker: it
 * says Removing while it works, leaves the list when the server agrees, and the count steps back up as the camera reads
 * her roll again. ★ Its head counts her re-shoots ("6 of 24 · 2 re-shoots left", guest-moments r1's `limit=three`),
 * and once they are spent its foot says a removal frees no frame now, so the X never promises one.
 *
 * ★ A SHOT WAITING FOR THE LINE IS HERS, ON THE ROLL (no-signal r1, `roll=taken`): its tile says "Waiting for your
 * connection" beside Standby's still point, never a spinner, and offers no Retry: it goes by itself once the line is back.
 */
import { ChevronDown, Loader2, Play, RefreshCw, X } from "lucide-react";
import type { Ref } from "react";

import { WaitPoint } from "@/components/guest/upload/wait-point";
import { Button } from "@/components/ui/button";
import {
  BACK_TO_CAMERA,
  REMOVING_FREES,
  SHOT_WORDS,
  YOUR_SHOTS,
  YOUR_SHOTS_EMPTY,
} from "@/lib/guest/camera/words";

export type ShotTile = {
  key: string;
  mediaId?: string;
  queueId?: string;
  kind: "photo" | "video";
  status:
    | "taking"
    | "sending"
    | "waiting"
    | "door"
    | "in"
    | "sealed"
    | "held"
    | "failed";
  /** Her picture of it: this visit's frozen frame, or the server's picture for her alone. */
  src?: string;
  /** The server's picture is the video itself (no preview was made): drawn as its first frame. */
  srcIsVideo?: boolean;
  /** A video's length, where this visit filmed it. */
  seconds?: number;
  /** Hers to take back here (sealed or held). */
  removable: boolean;
  /** A failed send that may go again. */
  retryable: boolean;
};

function TilePicture({ tile }: { tile: ShotTile }) {
  if (!tile.src) return null;
  if (tile.srcIsVideo) {
    return (
      <video
        // A fragment past zero, so a phone draws the first frame without playing it (the fragment never reaches the
        // server, so the presigned link stays valid).
        src={`${tile.src}#t=0.1`}
        muted
        playsInline
        preload="metadata"
        className="size-full object-cover"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- her own device's picture, or a link presigned for her alone
    <img src={tile.src} alt="" className="size-full object-cover" />
  );
}

export function YourShots({
  headingRef,
  tiles,
  line,
  count,
  removing,
  canFreeFrames,
  spentLine = null,
  onRemove,
  onRetry,
  onBack,
}: {
  headingRef?: Ref<HTMLButtonElement>;
  tiles: readonly ShotTile[];
  /** What the album does with them (`yourShotsLine`). */
  line: string;
  /** "6 of 24", or her count where no roll binds her. */
  count: string;
  removing: ReadonlyMap<string, "working" | "failed">;
  /** Removing a shot frees a frame here (a guest's roll, a re-shoot left). */
  canFreeFrames: boolean;
  /** Said under her shots once her re-shoots are spent, where removing one frees nothing (`removingSpentLine`). */
  spentLine?: string | null;
  onRemove: (mediaId: string) => void;
  onRetry: (queueId: string) => void;
  onBack: () => void;
}) {
  const anyRemovable = tiles.some((t) => t.removable);
  return (
    <section
      aria-labelledby="cam-your-shots-title"
      data-cam-your-shots=""
      className="cam-shots"
    >
      <div className="cam-shots-bar">
        <Button
          ref={headingRef}
          type="button"
          variant="glass"
          size="icon-cta"
          onClick={onBack}
          aria-label={BACK_TO_CAMERA}
        >
          <ChevronDown aria-hidden />
        </Button>
        <div className="min-w-0 text-center">
          <h2
            id="cam-your-shots-title"
            className="font-heading text-card-title text-white"
          >
            {YOUR_SHOTS}
          </h2>
          {/* Proportional figures: tabular ones set the re-shoots' hyphen a figure wide ("re - shoots"), and the line
              never moves under her eye (it changes as a shot lands or leaves, never by the frame). */}
          <p className="text-micro text-white/60">{count}</p>
        </div>
        <span aria-hidden className="size-11" />
      </div>
      <div className="cam-shots-body">
        <p className="mx-auto max-w-md text-center text-caption text-pretty text-white/60">
          {line}
        </p>
        {tiles.length === 0 ? (
          <p className="mt-10 text-center text-reading text-white/50">
            {YOUR_SHOTS_EMPTY}
          </p>
        ) : (
          <ul className="cam-shots-grid">
            {tiles.map((tile) => {
              const state = tile.mediaId
                ? (removing.get(tile.mediaId) ?? null)
                : null;
              const words =
                state === "working"
                  ? SHOT_WORDS.removing
                  : state === "failed"
                    ? SHOT_WORDS.removeFailed
                    : SHOT_WORDS[tile.status];
              return (
                <li
                  key={tile.key}
                  className="cam-shot"
                  data-status={tile.status}
                  data-removing={state ?? undefined}
                >
                  <div className="cam-shot-pic">
                    <TilePicture tile={tile} />
                    {tile.kind === "video" && (
                      <span className="cam-shot-kind">
                        <Play className="size-2.5 fill-current" aria-hidden />
                        {tile.seconds ? `${Math.round(tile.seconds)}s` : null}
                      </span>
                    )}
                  </div>
                  <p className="cam-shot-words">
                    {(tile.status === "sending" ||
                      tile.status === "taking" ||
                      state === "working") && (
                      <Loader2
                        className="size-3 motion-safe:animate-spin"
                        aria-hidden
                      />
                    )}
                    {tile.status === "waiting" && state === null && (
                      <WaitPoint />
                    )}
                    <span className="truncate">{words}</span>
                  </p>
                  {tile.removable && tile.mediaId && (
                    <button
                      type="button"
                      className="cam-shot-remove press-shrink focus-halo"
                      disabled={state === "working"}
                      onClick={() => onRemove(tile.mediaId as string)}
                      aria-label={
                        state === "failed"
                          ? "Try removing this shot again"
                          : "Remove this shot"
                      }
                    >
                      {state === "failed" ? (
                        <RefreshCw className="size-3.5" aria-hidden />
                      ) : (
                        <X className="size-3.5" aria-hidden />
                      )}
                    </button>
                  )}
                  {tile.status === "failed" &&
                    tile.retryable &&
                    tile.queueId && (
                      <button
                        type="button"
                        className="cam-shot-remove press-shrink focus-halo"
                        onClick={() => onRetry(tile.queueId as string)}
                        aria-label="Send this shot again"
                      >
                        <RefreshCw className="size-3.5" aria-hidden />
                      </button>
                    )}
                </li>
              );
            })}
          </ul>
        )}
        {anyRemovable && (canFreeFrames || spentLine) && (
          <p className="mt-5 text-center text-caption text-pretty text-white/50">
            {canFreeFrames ? REMOVING_FREES : spentLine}
          </p>
        )}
      </div>
    </section>
  );
}

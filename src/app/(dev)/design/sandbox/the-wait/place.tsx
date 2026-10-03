"use client";

import { ALBUM } from "./fixtures";
import { albumWidth, planAlbum } from "./geometry";
import { SCREENS, type ScreenId } from "./knobs";
import { AlbumHead, CoverGround, GuestPage, OpenRows } from "./album";

/**
 * THE ALBUM'S REGULAR OPEN, ANY DAY (round one's first, refined to his words:
 * "anytime after it has developed, it just opens as an album with a cool
 * animation, likely similar/same as a regular open live album would"). It is
 * production's open, nothing added: the cover's photographs settle in from a
 * step closer, its words rise, and the tiles rise into their rows 45 ms apart;
 * the cover's word says when it developed. Under reduced motion the words fade
 * and everything else simply stands.
 *
 * ★ EVERY OPTION'S SECOND OPEN IS THIS FRAME: once a guest has seen the
 * develop, the album opens like any album, a day later or a month later.
 */

/** The regular open's run: the cover's settle (1.2 s) is its longest part. */
export const OPEN_MS = { full: 1300, reduced: 300 } as const;
/** The still's moment: the tiles half risen, the cover still settling. */
export const OPEN_TURN_MS = 330;

export function OpenFrame({
  screen,
  nowMs,
}: {
  screen: ScreenId;
  nowMs: number;
}) {
  const frame = SCREENS[screen];
  const box = albumWidth(frame.w);
  const album = planAlbum(ALBUM, box, frame.h * 1.4);
  return (
    <GuestPage nowMs={nowMs} ground={<CoverGround developAt={null} />}>
      <section className="mt-3">
        <AlbumHead />
        <OpenRows tiles={album.tiles} height={album.height} />
      </section>
    </GuestPage>
  );
}

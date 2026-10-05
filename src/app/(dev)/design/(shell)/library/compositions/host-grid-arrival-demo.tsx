"use client";

import { useState } from "react";
import { Camera } from "lucide-react";

import { HostMediaGrid } from "@/components/app/host-media-grid";
import type { GridMedia } from "@/components/app/media-grid";
import { LikesProvider } from "@/components/likes/likes-provider";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * THE HOST'S ALBUM, AND A GUEST WHO SENDS ONE (the Library's arrival specimen of `host-media-grid.tsx`).
 *
 * The grid draws whatever items it is handed, and an arrival is nothing but "an id in this render that was not in the
 * last one" (`useAlbumArrivals`), so a store of the specimen's own is the whole harness: a list in state, and a button
 * that puts one more photograph at its head the way the host's poll would. The real grid then does what it does on the
 * hub: the arrival waits at the album's door for its photograph (it is fetched and decoded first, so the row opens on a
 * picture and never on a shimmer), the row opens where it lands while its neighbours glide aside, the new tile glows for
 * one length, and a burst is held a dozen at a time. Under reduced motion nothing is pushed and nothing waits.
 *
 * ★ THE FIRST RENDER MARKS NOTHING: the album opens with eight photographs and none of them lights. Only what turns up
 * afterwards does, which is the line `useAlbumArrivals` draws.
 *
 * Nothing is written, and the store is the page's: the album's tile verbs (Like, Save, Hide) are the grid's own, pointed
 * at ids no event owns, as the family's other specimen of this grid has always had them.
 */

/** The pool the album's photographs and the guests' come from: the site's own stills, each at a shape of its own. */
const POOL: readonly { image: string; w: number; h: number }[] = [
  { image: "wedding-golden", w: 1200, h: 1600 },
  { image: "concert-confetti", w: 1920, h: 1080 },
  { image: "reception-hall", w: 1600, h: 1200 },
  { image: "wedding-arch", w: 1000, h: 1000 },
  { image: "party-dj", w: 1080, h: 1920 },
  { image: "festival-crowd", w: 1500, h: 1000 },
  { image: "wedding-toast", w: 1600, h: 1066 },
  { image: "festival-lights", w: 1000, h: 1500 },
  { image: "party-balloons", w: 1920, h: 1280 },
  { image: "wedding-petals", w: 1400, h: 1000 },
  { image: "reception-table", w: 1600, h: 1100 },
  { image: "wedding-rings", w: 1000, h: 1250 },
];

function photo(id: string, at: number): GridMedia {
  const { image, w, h } = POOL[at % POOL.length];
  const url = marketingImage(image).src;
  return {
    id,
    type: "photo",
    url,
    downloadUrl: url,
    status: "approved",
    width: w,
    height: h,
  };
}

/** The album as it stood when the host opened it: eight photographs, newest first. */
const START: GridMedia[] = Array.from({ length: 8 }, (_, i) =>
  photo(`album-${i}`, i),
);

/** How many a guest may send before the pool is spent twice over: the likes' seed is asked for these ids once. */
const MOST = 30;
const IDS = [
  ...START.map((m) => m.id),
  ...Array.from({ length: MOST }, (_, i) => `sent-${i}`),
];

export function HostGridArrivalDemo() {
  const [items, setItems] = useState<GridMedia[]>(START);
  const [sent, setSent] = useState(0);

  /** A guest sends `n`: they land at the head of the album, the newest first, as a poll would hand them. */
  function send(n: number) {
    const next = Array.from({ length: n }, (_, i) =>
      photo(`sent-${sent + i}`, 8 + sent + i),
    ).reverse();
    setItems((now) => [...next, ...now]);
    setSent((count) => count + n);
  }

  const roomForOne = sent + 1 <= MOST;
  const roomForFive = sent + 5 <= MOST;

  return (
    <div data-library-demo="host-grid-arrival" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={!roomForOne} onClick={() => send(1)}>
          <Camera /> A guest sends a photo
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!roomForFive}
          onClick={() => send(5)}
        >
          Five at once
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setItems(START);
            setSent(0);
          }}
        >
          Start again
        </Button>
        <p className="text-caption text-muted-foreground tabular-nums">
          {items.length} in the album
        </p>
      </div>
      {/* The likes' seed is asked for these ids once (a stable list), never once per arrival. */}
      <LikesProvider mediaIds={IDS}>
        <HostMediaGrid eventId="demo" items={items} />
      </LikesProvider>
    </div>
  );
}

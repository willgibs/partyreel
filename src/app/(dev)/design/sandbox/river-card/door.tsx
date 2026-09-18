"use client";

import "./board.css";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { FeatureDoor } from "@/components/marketing/sections/features/shared/feature-door";

import { CardRiver, plateOf, type RiverClock } from "./card-river";

/**
 * THE REAL QR DOOR, WITH THE RIVER IN ITS PICTURE.
 *
 * ★ THE DOOR IS `FeatureDoor` ITSELF, never a copy of it. river-visual drew
 * its card placement in three shadcn Cards, so the picture Will loved ("our
 * first truly beautiful card visual") was judged in a card that does not
 * exist. This renders the component /features and every feature page's
 * closing row render, with its ink, its two scrims, its copy, its corner, its
 * press and its focus ring, and changes one thing: what fills the picture.
 *
 * ★ HOW THE RIVER GETS IN WITHOUT EDITING THE DOOR. The door has no slot for
 * the QR door's art (it draws `QrPlateArt` itself) and this lane may not touch
 * it, so the board reaches in from outside, twice:
 *
 *  1  `board.css` hides the plate `QrPlateArt` draws, the stand-in the river
 *     replaces.
 *  2  After mount, one node is inserted into the door's link at the layer the
 *     `fall` answer names, and the river is portalled into it. The layer is the
 *     whole point. The link paints its children in order (the ink, the rest
 *     scrim, the copy scrim, the copy) with no z-index among them, so where the
 *     node goes is where the photographs sit: after the rest scrim they run on
 *     behind the copy under the copy scrim alone, which is the shade the event
 *     cards were measured with (feature-door.tsx); after both scrims, cut to
 *     end above the title, they fade out before the words and the copy keeps
 *     bare ink. Under BOTH scrims was drawn and dropped: the rest scrim is 40
 *     percent black by the door's middle and the stream lives in its lower half,
 *     so every photograph went to mud. The plate's own `z-10` lifts the code
 *     over all of it in every case, where the stand-in sat, so it scans at full
 *     contrast. The link's overflow and corner clip the river, its press scales
 *     it, and its hover reaches the plate through the door's own `group`.
 *
 * The wiring lane gives the door a real picture slot; none of this survives it.
 */

/** Where the code sits: Will's note, answered as three heights. */
export type Place = "tenth" | "centre" | "third";

/** Where the photographs end: behind the title, or above it. */
export type Fall = "behind" | "above";

/**
 * THE LEAST AIR BETWEEN THE CODE AND THE DOOR'S TITLE, in px, and the gap the
 * stream stops short of the title when it fades out above it. A code that
 * reached the title would be a code sitting on the words, so every height
 * stops here, and the short door is where it bites: its copy leaves the code
 * less room than the plate itself needs, so all three heights land on this.
 */
export const TITLE_AIR = 12;

/**
 * THE THREE HEIGHTS, as the words say them, all measured to the plate's TOP
 * edge (the river's own convention, `plateTop`):
 *  - a tenth of the way down the door;
 *  - centred in the picture: the air above the plate equals the air between
 *    the plate and the title, so the picture is the part of the door above its
 *    copy and the code takes its position from it;
 *  - a third of the way down the door.
 * In the tall door those are three heights, in order; in the short one the
 * plate is most of the picture and every height stops at TITLE_AIR.
 */
export function plateTopFor(
  place: Place,
  doorH: number,
  titleTop: number,
  plate: number,
) {
  const raw =
    place === "tenth"
      ? doorH * 0.1
      : place === "third"
        ? doorH / 3
        : (titleTop - plate) / 2;
  const ceiling = titleTop - plate - TITLE_AIR;
  return Math.max(0, Math.round(Math.min(raw, ceiling)));
}

export type DoorFacts = {
  w: number;
  h: number;
  titleTop: number;
  plateTop: number;
  plate: number;
};

/**
 * Where the node goes among the link's children: after the rest scrim (the
 * link's second child) or after the copy scrim (its third). Counted before the
 * node exists, so the index is the door's own order.
 */
const LAYER_AT: Record<Fall, number> = { behind: 2, above: 3 };

export function RiverDoor({
  aspect,
  copy,
  place,
  fall,
  value,
  clock,
  still,
  onFacts,
}: {
  aspect: "portrait" | "landscape";
  /** The door's line: the hub reads the long one, the closing row the short.
   *  Defaults to the one its aspect ships with today. */
  copy?: "long" | "short";
  place: Place;
  fall: Fall;
  value: string;
  clock?: RiverClock;
  still?: boolean;
  /** The door's measured numbers, for the line under it. */
  onFacts?: (f: DoorFacts) => void;
}) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number; t: number } | null>(
    null,
  );

  // The node, at the layer `fall` names, and the door's real box and its
  // title's real top: the river's geometry is read off the door, never typed,
  // and a font landing late re-wraps the copy, so both are watched.
  useLayoutEffect(() => {
    const link = wrap.current?.querySelector("a");
    if (!link) return;
    const el = link.ownerDocument.createElement("div");
    el.setAttribute("data-rcd-slot", fall);
    link.insertBefore(el, link.children[LAYER_AT[fall]] ?? null);
    // The copy block is the link's last child and the title its first.
    const copy = link.lastElementChild as HTMLElement | null;
    const title = copy?.firstElementChild as HTMLElement | null;
    const read = () => {
      const t = (copy?.offsetTop ?? 0) + (title?.offsetTop ?? 0);
      const w = link.offsetWidth;
      const h = link.offsetHeight;
      setBox((prev) =>
        prev && prev.w === w && prev.h === h && prev.t === t
          ? prev
          : { w, h, t },
      );
    };
    read();
    setSlot(el);
    const win = link.ownerDocument.defaultView;
    const ro = win ? new win.ResizeObserver(read) : null;
    ro?.observe(link);
    if (copy) ro?.observe(copy);
    link.ownerDocument.fonts?.ready.then(read).catch(() => {});
    return () => {
      ro?.disconnect();
      el.remove();
      setSlot(null);
    };
  }, [fall, aspect]);

  const plate = box ? plateOf(box.w, value) : 0;
  const plateTop = box ? plateTopFor(place, box.h, box.t, plate) : 0;

  useLayoutEffect(() => {
    if (box && onFacts)
      onFacts({ w: box.w, h: box.h, titleTop: box.t, plateTop, plate });
  }, [box, plateTop, plate, onFacts]);

  return (
    <div ref={wrap} className="rcd-door isolate">
      <FeatureDoor
        slug="qr"
        aspect={aspect}
        copy={copy ?? (aspect === "portrait" ? "long" : "short")}
      />
      {slot && box
        ? createPortal(
            <CardRiver
              width={box.w}
              // Fading out above the title, the river's own box ends there, so
              // its bottom dissolve (the last fifth of the box) finishes before
              // the words; running behind, it is the whole door.
              height={fall === "above" ? box.t - TITLE_AIR : box.h}
              plateTop={plateTop}
              value={value}
              clock={clock}
              still={still}
            />,
            slot,
          )
        : null}
    </div>
  );
}

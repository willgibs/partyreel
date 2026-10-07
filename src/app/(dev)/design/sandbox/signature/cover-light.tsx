"use client";

import "@/components/app/event-feed/event-hub-head-seam.css";

import { useEffect, useRef, useState } from "react";

import {
  chromaOf,
  edgeBand,
  edgeHues,
  type EdgeLight,
  HOUSE_LIGHT,
  intensityOf,
} from "@/components/app/event-feed/event-hub-head-edge";
import { decodeImage } from "@/lib/reel/engine/assets";

import type { Still } from "./fixtures";

/**
 * THE HUB'S SEAM, UNDER THE GUEST'S COVER (event-header-wiring-2's proposal,
 * drawn): production's own Seam (`event-hub-head-light.tsx`'s drawing, its
 * classes in `event-hub-head-seam.css` and its maths in
 * `event-hub-head-edge.ts`), born where the album cover's photograph ends. So
 * the guest's first screen wears exactly the light the host's hub wears: the
 * edge's own colours read at runtime off the crop the eye sees, at the hub's
 * reach in the room (72 px in a hand, 104 on a tablet, 120 at a desk) and in
 * Aperture's strip of the room on paper (30 and 36 px).
 *
 * ★ PRODUCTION'S PIECES, ONE OF THEM RETYPED: `HubLight` finds the HUB's
 * cover before it (`[data-event-head="hub"]`) and is the cards row's, so the
 * guest's is composed from its exported maths and classes, and its small read
 * (`readStill`, kept to itself there) is retyped below: the still decoded
 * (`decodeImage`, same-origin here), drawn 192 px wide, its edge read at the
 * cover's own size, its intensity over a 32 px read.
 */

const THUMB_W = 192;

/** The still's edge at the cover's size, read once a frame; the house's dusk until it is. */
function useEdgeLight(
  still: Still,
  ref: React.RefObject<HTMLElement | null>,
): EdgeLight | null {
  const [light, setLight] = useState<EdgeLight | null>(null);
  useEffect(() => {
    const el = ref.current;
    const doc = el?.ownerDocument;
    if (!el || !doc) return;
    // The cover the light falls from: the album cover before it in the page.
    const cover = [
      ...doc.querySelectorAll<HTMLElement>('[data-event-head="album"]'),
    ].at(-1);
    if (!cover) return;
    let gone = false;
    void (async () => {
      try {
        const img = await decodeImage(still.src);
        const [nw, nh] =
          "naturalWidth" in img
            ? [img.naturalWidth, img.naturalHeight]
            : [img.width, img.height];
        const w = Math.min(THUMB_W, nw);
        const h = Math.max(1, Math.round((w * nh) / nw));
        const canvas = doc.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const small = doc.createElement("canvas");
        small.width = 32;
        small.height = 32;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const sctx = small.getContext("2d", { willReadFrequently: true });
        if (!ctx || !sctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        sctx.drawImage(img, 0, 0, 32, 32);
        if ("close" in img) img.close();
        const r = cover.getBoundingClientRect();
        const hues = edgeHues(
          { w, h, px: ctx.getImageData(0, 0, w, h).data },
          Math.round(r.width),
          Math.round(r.height),
        );
        const c = chromaOf(intensityOf(sctx.getImageData(0, 0, 32, 32).data));
        if (!gone) setLight(hues ? { hues, c } : HOUSE_LIGHT);
      } catch {
        if (!gone) setLight(HOUSE_LIGHT);
      }
    })();
    return () => {
      gone = true;
    };
  }, [still.src, ref]);
  return light;
}

/**
 * The Seam under the album's cover, production's drawing at the hub's reach:
 * clear in the room, a strip of the room on paper (its field wears `dark`).
 */
export function CoverLight({ still }: { still: Still }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const light = useEdgeLight(still, ref);
  return (
    <div
      ref={ref}
      aria-hidden
      data-sg-seam="top"
      data-sg-cover-light={
        light ? light.hues.map(Math.round).join(" ") : "reading"
      }
      className="hub-seam sg-cover-light"
    >
      <div className="dark hub-light-field">
        <div className="hub-light-slot" data-rest="">
          {light ? (
            <div className="hub-light-lit">
              <div
                className="hub-light-glow"
                style={{ background: edgeBand(light, "glow") }}
              />
              <div
                className="hub-light-line"
                style={{ background: edgeBand(light, "line") }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

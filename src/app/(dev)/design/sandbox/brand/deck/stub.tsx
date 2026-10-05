"use client";

import { SLIDES, type SlideId, type Vision } from "./contract";
import { HEAD } from "./deck";
import { Photo, PHOTO_IDS } from "./media";

/**
 * A DECK NOT YET DRAWN: every slide its number, its title and a photograph,
 * so the board stands while an agency team works on its vision. Replaced
 * whole by the team's own `Vision`; nothing ships wearing it.
 */
export function stubVision(id: string, name: string, line: string): Vision {
  const slides = Object.fromEntries(
    SLIDES.map((s, i) => [
      s.id,
      ({ screen }: { screen: "1440" | "375" }) => (
        <div
          className="absolute inset-0 flex flex-col justify-end gap-3 p-8"
          style={{ paddingTop: HEAD[screen] }}
        >
          <div className="absolute inset-0 -z-10 opacity-40">
            <Photo id={PHOTO_IDS[i % PHOTO_IDS.length]} />
          </div>
          <p className="text-sm opacity-70">{line}</p>
          <p className="text-4xl font-semibold" data-bd-read="slide">
            {String(i + 1).padStart(2, "0")} {s.title}
          </p>
        </div>
      ),
    ]),
  ) as Record<SlideId, Vision["slides"][SlideId]>;
  return { id, name, line, slides };
}

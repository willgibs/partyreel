"use client";

import "../door.css";
import "./doorway.css";

import type { CSSProperties } from "react";

import { HOUSE_HUES } from "@/lib/guest/door-light";
import { cn } from "@/lib/utils";

/**
 * THE DOORWAY (`locked-door` r2, Will's `family=doorway`: "This is absolutely gorgeous, big win for
 * our design assets and really sets a good new standard on experiential design"), and `shape=shared`:
 * one design for every state a guest can meet the album's door in, only its words and its light
 * changing. The product already calls this screen the door, so it draws one, and its LEAF is the
 * state: open on a welcome she may walk through, ajar while the host decides, shut on a door that is
 * not hers to open, gone on a link that opens nothing.
 *
 * ★ ONE DRAWING, FOUR HOMES: the album's stage (`door/stage.tsx`: the welcome, the ask, the wait and
 * the moment she is let in), the shut door (`shut-door.tsx`), the broken link's page
 * (`e/[token]/not-found.screen.tsx`) and the help center's pictures of them, each standing it in the
 * door's page (`door-page.tsx`). A client module only for the house light's one home
 * (`door-light.ts`), so a server page renders it as it renders any island.
 */

export type DoorwayState = "open" | "ajar" | "shut" | "none";

/**
 * The doorway itself: its frame, the room's light behind it, the leaf at the state's angle, the line
 * of light under a door that is not open, and the floor the light falls on. Decorative (the words
 * beside it say everything it does), so it is hidden from assistive tech.
 *
 * ★ WHOSE LIGHT, AND WHAT IT SHOWS, IS THE CALLER'S TO ANSWER, never the drawing's guess: `hues` are
 * the album's own sampled hues only where she may see the album (a Public album's welcome, the moment
 * she is let in), and `photos` only there too. Everywhere else the house five, and no photograph.
 * The drawing adds one guard of its own: a photograph is only ever drawn through an OPEN door.
 */
export function Doorway({
  state,
  hues = HOUSE_HUES,
  photos = [],
  from = "shut",
  className,
}: {
  state: DoorwayState;
  /** The light's hues (three are read): the album's own where she may see it, the house five otherwise. */
  hues?: readonly number[];
  /** The album seen through the open door: its newest previews (up to four). */
  photos?: readonly string[];
  /** Where an opening door swings from: the moment she is let in opens the door she waited at. */
  from?: "shut" | "ajar";
  className?: string;
}) {
  const lit = state !== "none";
  const through = state === "open" ? photos.slice(0, 4) : [];
  return (
    <div
      data-door-way={state}
      data-door-way-from={from === "ajar" ? "ajar" : undefined}
      // The hues a lit piece wears, as the door's lamp names them (`DoorLamp`), so a reader of the
      // page can tell the album's own light from the house's without computing it.
      data-door-hues={
        lit ? hues.slice(0, 3).map(Math.round).join(",") : undefined
      }
      aria-hidden
      className={cn("door-way", className)}
      style={
        {
          "--lit-h1": hues[0],
          "--lit-h2": hues[1],
          "--lit-h3": hues[2],
        } as CSSProperties
      }
    >
      <span className="door-way-floor" />
      <span className="door-way-ground" />
      <div className="door-way-frame">
        {lit && (
          <div className="door-way-room">
            <span className="door-way-glow door-way-g1" />
            <span className="door-way-glow door-way-g2" />
            <span className="door-way-glow door-way-g3" />
            {through.length > 0 && (
              <div
                data-door-way-album=""
                data-count={through.length}
                className="door-way-album"
              >
                {through.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element -- a presigned preview the album already holds for her
                  <img
                    // By place, never by link: a link re-minted under the same photograph swaps its source
                    // in place rather than flashing a new tile.
                    key={i}
                    src={src}
                    alt=""
                    decoding="async"
                    draggable={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {lit && (
          <div className="door-way-leaf">
            <span className="door-way-panel door-way-panel-top" />
            <span className="door-way-panel door-way-panel-low" />
          </div>
        )}
        {lit && <span className="door-way-sill" />}
      </div>
    </div>
  );
}

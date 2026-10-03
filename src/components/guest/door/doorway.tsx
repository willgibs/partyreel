"use client";

import "../door.css";
import "./doorway.css";

import type { CSSProperties, ReactNode } from "react";

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
 * ★ THROUGH THE OPEN DOOR, THE ALBUM'S OWN COVER, SMALL AND LIT (locked-door r3, Will's `reveal=through`:
 * "really feels like you're entering this door into the world of the album"). The opening holds the
 * cover she will land on (`view`: the album's photographs dissolving, the page's own cover drawn a
 * second time at its own size and set small in the doorway, `doorway.css`'s `.door-way-view`), lit by the
 * room's light rising off the floor and spilling out of the doorway (the light leak he loved), so the
 * walk through (`stage-walk.ts`) carries exactly those photographs into exactly their places on the cover.
 *
 * ★ AT REST THE LIGHT TURNS (r3, `idle=turn`, with his notes: "Hitting different colors across the
 * rainbow makes this feel really cool... Maybe it could be subtly combined with the light breathing?
 * Also, could we speed up just slightly"): the line under a shut or ajar door turns through the
 * rainbow and breathes with it, from a place on the wheel the page draws per visit (`phase`). Only ever
 * the house's light: a door she cannot open shows nothing of the album, not even its colour.
 *
 * ★ ONE DRAWING, FOUR HOMES: the album's stage (`door/stage.tsx`: the welcome, the ask, the wait and
 * the moment she is let in), the shut door (`shut-door.tsx`), the broken link's page
 * (`e/[token]/not-found.screen.tsx`) and the help center's pictures of them, each standing it in the
 * door's page (`door-page.tsx`). A client module only for the house light's one home
 * (`door-light.ts`), so a server page renders it as it renders any island.
 */

export type DoorwayState = "open" | "ajar" | "shut" | "none";

/**
 * A hue, turned the short way round the wheel from the house's own at the same place: the light glides
 * from the house's colour into the album's as the album's sample lands (`doorway.css`'s `--way-base-*`),
 * and a registered number glides along the number line, so 25 to 264 would sweep through every colour
 * between. 264 is drawn as -96: the same colour, a third of the way round.
 */
export function nearestHue(hue: number, from: number): number {
  let h = hue;
  while (h - from > 180) h -= 360;
  while (from - h > 180) h += 360;
  return h;
}

/**
 * The doorway itself: its frame, the room's light behind it, the leaf at the state's angle, the line
 * of light under a door that is not open, and the floor the light falls on. Decorative (the words
 * beside it say everything it does), so it is hidden from assistive tech.
 *
 * ★ WHOSE LIGHT, AND WHAT IT SHOWS, IS THE CALLER'S TO ANSWER, never the drawing's guess: `hues` are
 * the album's own sampled hues only where she may see the album (a Public album's welcome, the moment
 * she is let in), and `view` and `photos` only there too. Everywhere else the house five, and nothing
 * through the opening. The drawing adds one guard of its own: nothing is ever drawn through a door that
 * is not OPEN.
 */
export function Doorway({
  state,
  hues = HOUSE_HUES,
  view,
  photos = [],
  from = "shut",
  phase,
  className,
}: {
  state: DoorwayState;
  /** The light's hues (three are read): the album's own where she may see it, the house five otherwise. */
  hues?: readonly number[];
  /** What the open door shows: the album's own cover, live (`CoverPicture`), where she may see it. */
  view?: ReactNode;
  /**
   * A picture of the album through the open door for a page with no live album (the help center's): its
   * first photograph fills the opening as the cover would. `view` wins where both are given.
   */
  photos?: readonly string[];
  /** Where an opening door swings from: the moment she is let in opens the door she waited at. */
  from?: "shut" | "ajar";
  /** Where on the wheel the resting light starts its turn, 0 to 1 (the page draws one per visit). */
  phase?: number;
  className?: string;
}) {
  const lit = state !== "none";
  const open = state === "open";
  // The opening's view, in the box that sets it small in the doorway (`.door-way-view`): the album's own
  // cover where the page has one, else a picture's own still in its place.
  // The veil (the room's light rising off its floor) is the photograph's own, so it stays on it as the walk
  // carries it to the cover, and lifts off it there.
  const shown = !open ? null : view ? (
    <div data-door-view="cover" className="door-way-view">
      {view}
      <span className="door-way-veil" />
    </div>
  ) : photos[0] ? (
    <div data-door-view="photo" className="door-way-view">
      {/* eslint-disable-next-line @next/next/no-img-element -- a picture's own still, standing in for the album's cover */}
      <img
        src={photos[0]}
        alt=""
        decoding="async"
        draggable={false}
        className="door-way-photo"
      />
      <span className="door-way-veil" />
    </div>
  ) : null;
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
          "--lit-h1": nearestHue(hues[0], HOUSE_HUES[0]),
          "--lit-h2": nearestHue(hues[1], HOUSE_HUES[1]),
          "--lit-h3": nearestHue(hues[2], HOUSE_HUES[2]),
          ...(phase === undefined ? {} : { "--door-phase": phase }),
        } as CSSProperties
      }
    >
      {/* The light leak (r3): the opening's light blooming past the frame, and thrown out across the
          floor the way a lit doorway throws it. Only ever an open door's. */}
      {open && <span data-door-leak="" className="door-way-bloom" />}
      {open && <span data-door-leak="" className="door-way-throw" />}
      <span className="door-way-floor" />
      <span className="door-way-ground" />
      <div className="door-way-frame">
        {lit && <span className="door-way-edge" />}
        {lit && (
          <div className="door-way-room">
            <span className="door-way-tint" />
            <span className="door-way-glow door-way-g1" />
            <span className="door-way-glow door-way-g2" />
            <span className="door-way-glow door-way-g3" />
            {open && (
              // The page's own ground, beyond the photographs: it rises as she walks through, so the
              // room she lands in is the album's page, with no seam where the room was.
              <span data-door-room-ground="" className="door-way-room-ground" />
            )}
            {shown}
            {shown && <span className="door-way-core" />}
            {open && <span className="door-way-jamb" />}
          </div>
        )}
        {lit && (
          <div className="door-way-leaf">
            <span className="door-way-panel door-way-panel-top" />
            <span className="door-way-panel door-way-panel-low" />
            {open && <span className="door-way-rim" />}
          </div>
        )}
        {lit && <span className="door-way-sill" />}
      </div>
    </div>
  );
}

"use client";

import "@/components/guest/door.css";
import "@/components/guest/door/doorway.css";
import "@/components/guest/door/lit.css";
import "./locked-door.css";

import type { CSSProperties, ReactNode, Ref } from "react";

import type { DoorwayState } from "@/components/guest/door/doorway";
import { cn } from "@/lib/utils";

import { type Hues, HOUSE, huesAttr, litVars } from "./guest-page";

/**
 * THE DOORWAY, AS PRODUCTION DRAWS IT, WITH WHAT ROUND THREE ASKS OF ITS
 * OPEN STATE.
 *
 * ★ PRODUCTION'S OWN MARKUP AND CLASSES (`door/doorway.tsx`), so production's
 * own sheet (`doorway.css`) draws the frame, the room, its glows, the leaf at
 * the state's angle, the sill and the floor, and the arrival's swing, exactly
 * as they ship. What this round adds is children of the same pieces, styled by
 * the board's sheet (`locked-door.css`, every class `ld-`), so the option a
 * reviewer picks is precisely those additions and nothing he did not see.
 *
 * ★ THE ADDITIONS, ONE PER QUESTION HE ASKED OF THE OPEN DOOR:
 *  - what the opening shows (`reveal`): the party's light alone (`light`), its
 *    newest photograph deep in the room (`one`), or the album itself, small
 *    (`through`), never four photographs edge to edge;
 *  - the light leak ("I love the door (and light leak ...)"): the opening's
 *    light blooming over the frame's edge (`ld-bloom`) and thrown out across
 *    the floor as a lit doorway throws it (`ld-throw`), beside production's
 *    floor glow;
 *  - the door reading against what is behind it: the leaf's free edge caught
 *    by the room's light (`ld-rim`) and the jamb's depth inside the frame
 *    (`ld-jamb`), so the opening reads as a way through, not a picture.
 *
 * ★ STILL AT REST, AND DRAWN WHOLE THERE (bible 5): every addition rests at
 * its open-door look, and only the walk (the scene's phase) and the room's
 * drift move anything, behind `no-preference`.
 */

export type Reveal = "light" | "one" | "through";

export function LdWay({
  state,
  reveal,
  hues = HOUSE,
  photo,
  photoRef,
  mini,
  from = "shut",
  className,
  style,
}: {
  state: DoorwayState;
  reveal: Reveal;
  /** The album's own light where she may see it; the house five otherwise. */
  hues?: Hues;
  /** `one`: the album's newest photograph, shown only through an open door. */
  photo?: string;
  photoRef?: Ref<HTMLDivElement>;
  /** `through`: the album itself, in miniature, behind the door. */
  mini?: ReactNode;
  from?: "shut" | "ajar";
  className?: string;
  style?: CSSProperties;
}) {
  const lit = state !== "none";
  const open = state === "open";
  return (
    <div
      data-door-way={state}
      data-door-way-from={from === "ajar" ? "ajar" : undefined}
      data-ld-way={reveal}
      data-door-hues={lit ? huesAttr(hues) : undefined}
      aria-hidden
      className={cn("door-way", className)}
      style={{ ...litVars(hues), ...style }}
    >
      {/* The light leak: the opening's light blooming past the frame, and
          thrown out across the floor the way a lit doorway throws it. */}
      {lit && <span className="ld-bloom" />}
      {lit && <span className="ld-throw" />}
      <span className="door-way-floor" />
      <span className="door-way-ground" />
      <div className="door-way-frame">
        {lit && (
          <div className="door-way-room">
            <span className="door-way-glow door-way-g1" />
            <span className="door-way-glow door-way-g2" />
            <span className="door-way-glow door-way-g3" />
            {open && reveal === "one" && photo && (
              <div ref={photoRef} data-ld-opening="photo" className="ld-photo">
                {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still standing in for the album's newest preview */}
                <img
                  data-ld-shows="photo"
                  src={photo}
                  alt=""
                  draggable={false}
                />
              </div>
            )}
            {open && reveal === "through" && mini}
            <span className="ld-veil" />
            <span className="ld-core" />
            <span className="ld-jamb" />
          </div>
        )}
        {lit && (
          <div className="door-way-leaf">
            <span className="door-way-panel door-way-panel-top" />
            <span className="door-way-panel door-way-panel-low" />
            <span className="ld-rim" />
          </div>
        )}
        {lit && <span className="door-way-sill" />}
      </div>
    </div>
  );
}

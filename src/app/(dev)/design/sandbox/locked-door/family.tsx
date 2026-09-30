"use client";

import type { ReactNode } from "react";

import type { Container, DoorProps, WelcomeAt } from "./door-props";
import { DoorwayDoor } from "./doorway";
import { READERS, type ReaderId } from "./fixtures";
import { useAlbumHues } from "./furniture";
import { HostDoor } from "./host";
import { LitDoor } from "./lit";
import { TodayDoor, TodayLost } from "./today";
import type { DirectionId, StateId, WaitId } from "./words";

/**
 * THE FAMILY: which container every state stands in, per direction and per
 * shape, and the one entry point that draws a door screen.
 *
 * ★ A SHAPE IS WHERE EACH STATE STANDS (the `shape` ask, his "whether shared or
 * bespoke to each screen"):
 *  - `shared`: one design for all four. For the doorway that is its page; for
 *    every other direction the held sheet, the shut door held shut in it.
 *  - `split`: today's arrangement, two designs: the sheet for the doors that
 *    open (the welcome, the wait), a page for the one that does not.
 *  - `bespoke`: each state built for its own job: the welcome the sheet over
 *    the album, the wait a page of its own, the shut door a page.
 *
 * ★ EACH DIRECTION HAS A SHAPE OF ITS OWN, and `family` draws it there
 * (`NATURAL`), so a direction is judged at its best rather than in a shape
 * chosen for another: the host's door and the doorway are one design
 * throughout, the lit column and today the sheet beside a page. `shape` then
 * draws the picked direction all three ways.
 */

export type ShapeId = "shared" | "split" | "bespoke";

export const NATURAL: Record<DirectionId, ShapeId> = {
  today: "split",
  host: "shared",
  lit: "split",
  doorway: "shared",
};

export function containerOf(
  direction: DirectionId,
  shape: ShapeId,
  state: DoorProps["state"],
): Container {
  // The beat stands where the wait stood; the 404 where the shut door does.
  const s: StateId =
    state === "beat" ? "wait" : state === "lost" ? "shut" : state;
  if (shape === "shared") return direction === "doorway" ? "page" : "sheet";
  if (shape === "split")
    return s === "welcome" || s === "wait" ? "sheet" : "page";
  return s === "welcome" ? "sheet" : "page";
}

const DRAW: Record<DirectionId, (p: DoorProps) => ReactNode> = {
  today: TodayDoor,
  host: HostDoor,
  lit: LitDoor,
  doorway: DoorwayDoor,
};

/** One door screen: a direction, a shape, a state, who is reading, the wait's shape. */
export function Door({
  direction,
  shape,
  state,
  reader,
  wait,
  welcomeAt = "public",
}: {
  direction: DirectionId;
  shape: ShapeId;
  state: DoorProps["state"];
  reader: ReaderId;
  wait: WaitId;
  welcomeAt?: WelcomeAt;
}) {
  const album = useAlbumHues();
  const Draw = DRAW[direction];
  return (
    <Draw
      state={state}
      container={containerOf(direction, shape, state)}
      reader={READERS[reader]}
      wait={wait}
      welcomeAt={welcomeAt}
      album={album}
    />
  );
}

/** The 404 as it ships, the `lost=own` answer whatever the direction. */
export { TodayLost };

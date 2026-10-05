import type { GroundId, MomentId, Width } from "../model";

/**
 * WHAT EVERY SCREEN IS HANDED: the moment to be caught in (the trait being
 * asked, or the edge's open layer), the frame's width and its ground. A screen
 * pins its moment where it really happens on it and draws the rest at rest.
 */
export type ScreenProps = {
  moment: MomentId;
  w: Width;
  ground: GroundId;
};

import type { ReactNode } from "react";

import type { Moment, OtherEvent } from "./fixtures";
import type { Ground, Screen, Side } from "./knobs";
import type { RingBeat, Scroll } from "./parts";

/**
 * A WHOLE DESIGN, AS ITS PARTS: everything the board draws of one option, at
 * every moment and on both sides, and where its language reaches beyond the
 * page. Each design file (`today.tsx`, `rise.tsx`, `sky.tsx`, `corner.tsx`,
 * `quiet.tsx`, `featured.tsx`) exports one; `whole.tsx` places them in the
 * frames, so every design is read in the same frames at the same moments, and
 * two designs differ exactly where their parts do.
 */

export type DesignId =
  | "today"
  | "rise"
  | "sky"
  | "corner"
  | "quiet"
  | "featured";

export type PageProps = {
  screen: Screen;
  ground: Ground;
  moment: Moment;
};

export type GuestPageProps = PageProps & {
  /** Her first screen, or scrolled into the album (the dock and its Ring). */
  scroll?: Scroll;
  /** The Ring's beat in a scrolled frame: at rest, or the instant her photo lands. */
  beat?: RingBeat;
  /** Her files still on their way. */
  count?: number;
};

export type HostPageProps = PageProps & {
  /** Her first visit from Create: the head's entry into her new event. */
  arrival?: boolean;
  /** Close adding, offered once the photos have stopped (after-party's `over=offer`). */
  offer?: boolean;
};

export type Kit = {
  id: DesignId;
  GuestPage: (p: GuestPageProps) => ReactNode;
  HostPage: (p: HostPageProps) => ReactNode;
  /**
   * THE ONE MOMENT (after-party's `recap`, his note: "a singular moment of
   * presentation ... an 'everything is ready!' type of delight", then the page
   * as before): hers the instant she closes adding, a guest's at her first
   * visit after; shown once.
   */
  Premiere: (p: PageProps & { side: Side }) => ReactNode;
  /** The card a pasted link unfolds into: an open album's, and a private (or photo-less) one's. */
  Card: (p: { variant: "open" | "private"; moment: Moment }) => ReactNode;
  /** One dashboard tile: an event with photographs, or a party to come with none. */
  Tile: (p: { event: OtherEvent }) => ReactNode;
  /** The door's sheet over the album: the page behind it and its one light. */
  Door: (p: { ground: Ground }) => ReactNode;
  /** The Add itself (the dock's centre), at rest or the instant her photo lands. */
  Add: (p: { ground: Ground; beat: RingBeat }) => ReactNode;
};

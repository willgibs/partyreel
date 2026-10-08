"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { Moment } from "./fixtures";
import type { Ground, Screen } from "./knobs";
import {
  AlbumHead,
  AppBar,
  albumWidth,
  Dock,
  EmptyAlbum,
  GuestBar,
  GuestsSection,
  HostProviders,
  Report,
  type RingBeat,
  Rows,
  type Scroll,
  useScrollInto,
  widthOf,
} from "./parts";

/**
 * THE PAGE AROUND A HEAD: what every new design shares, so a design is its
 * head and its light. The ROOM is the bar, the head and the album's own head
 * (its count, Select and View), everything above the first photograph: on
 * paper it is a piece of the room (Aperture: the light lives there, never on
 * the page), in the room it is the page itself. A design's light is drawn
 * inside the room, behind the words (`glow`), so it ends where the photographs
 * begin and the album sits on the page's own ground.
 *
 * ★ THE ALBUM STARTS ON THE FIRST SCREEN: no head here is taller than the
 * first screen less a row, so the photographs tease the scroll (Will's
 * revision); the frames' captions read where the first photograph starts.
 */

export function GuestShell({
  screen,
  ground,
  moment,
  head,
  glow,
  barOver = true,
  bar,
  between,
  scroll = "top",
  beat = "rest",
  count = 0,
  known = true,
  dock = true,
  roomClass,
  emptyCta = false,
}: {
  screen: Screen;
  ground: Ground;
  moment: Moment;
  head: ReactNode;
  /** The empty album's own Add the first photo (production's), where the head does not ask already. */
  emptyCta?: boolean;
  /** The design's light, drawn behind the room's words. */
  glow?: ReactNode;
  /** The bar stands on the room (no cut) or is the page's own. */
  barOver?: boolean;
  /** A bar of the design's own in place of the guest's. */
  bar?: ReactNode;
  /** What stands between the head and the album's head (a line under the cover). */
  between?: ReactNode;
  scroll?: Scroll;
  /** The Ring's beat in a scrolled frame. */
  beat?: RingBeat;
  /** Her files still on their way, on the Ring's shoulder. */
  count?: number;
  known?: boolean;
  /** The foot's dock once scrolled (none on a closed album's Add: its dock keeps Invite and the reel). */
  dock?: boolean;
  /** The room's own classes (a design's padding at its foot). */
  roomClass?: string;
}) {
  const w = widthOf(screen);
  const box = useScrollInto(scroll);
  const empty = moment.album === 0;
  return (
    <div
      ref={box}
      data-ep-page="guest"
      data-ep-scroll={scroll}
      className="relative min-h-screen bg-background pb-28 text-foreground"
    >
      <div
        data-ep-room=""
        className={cn(
          "relative isolate",
          ground === "paper" && "dark bg-background text-foreground",
          roomClass,
        )}
      >
        {glow}
        <div className="relative z-10">
          {bar ?? <GuestBar over={barOver} known={known} />}
          {head}
          {between}
          {!empty && ground === "room" ? (
            <div className="px-3 pt-6 pb-3 sm:px-5">
              <AlbumHead moment={moment} />
            </div>
          ) : (
            <div className="h-6" />
          )}
        </div>
      </div>
      {/* ★ ON PAPER THE ALBUM STANDS ON ONE GROUND (the creative director's pass): the piece of the room ends above
          the album's own head, so its count and its photographs are the page's, never split across the band's edge. */}
      {!empty && ground === "paper" ? (
        <div className="px-3 pt-5 pb-3 sm:px-5">
          <AlbumHead moment={moment} />
        </div>
      ) : null}
      <div className="px-3 sm:px-5" data-ep-album="">
        {empty ? (
          <div className="pt-4">
            <EmptyAlbum side="guest" cta={emptyCta} />
          </div>
        ) : (
          <Rows width={albumWidth(w)} />
        )}
      </div>
      <div className="flex justify-center">
        <div className="w-full max-w-2xl px-5">
          <GuestsSection guests={moment.guests} />
        </div>
      </div>
      <Report />
      {scroll !== "top" && dock ? (
        <Dock ground={ground} beat={beat} add={moment.open} count={count} />
      ) : null}
    </div>
  );
}

export function HostShell({
  screen,
  ground,
  moment,
  head,
  glow,
  barOver = true,
  tools,
  between,
  roomClass,
}: {
  screen: Screen;
  ground: Ground;
  moment: Moment;
  head: ReactNode;
  glow?: ReactNode;
  /** The app's bar on the room (no cut) or the app's own. */
  barOver?: boolean;
  /** Her rooms, where a design puts them in the bar. */
  tools?: ReactNode;
  /** What stands between the head and the album's head (her rooms as a row, an offer). */
  between?: ReactNode;
  roomClass?: string;
}) {
  const w = widthOf(screen);
  const empty = moment.album === 0;
  return (
    <HostProviders>
      <div
        data-ep-page="host"
        className="relative min-h-screen bg-background pb-16 text-foreground"
      >
        <div
          data-ep-room=""
          className={cn(
            "relative isolate",
            ground === "paper" && "dark bg-background text-foreground",
            roomClass,
          )}
        >
          {glow}
          <div className="relative z-10">
            <AppBar over={barOver} tools={tools} screen={screen} />
            {head}
            {between}
            {!empty && ground === "room" ? (
              <div className="px-3 pt-6 pb-3 sm:px-5">
                <AlbumHead moment={moment} host compact={screen === "375"} />
              </div>
            ) : (
              <div className="h-6" />
            )}
          </div>
        </div>
        {!empty && ground === "paper" ? (
          <div className="px-3 pt-5 pb-3 sm:px-5">
            <AlbumHead moment={moment} host compact={screen === "375"} />
          </div>
        ) : null}
        <div className="px-3 sm:px-5" data-ep-album="">
          {empty ? (
            <div className="pt-4">
              <EmptyAlbum side="host" />
            </div>
          ) : (
            <Rows width={albumWidth(w)} />
          )}
        </div>
      </div>
    </HostProviders>
  );
}

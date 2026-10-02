"use client";

import "./event-header.css";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
} from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import type { GuestMoment, HostMoment } from "./fixtures";
import { type GuestDirection, GuestPage, type StaysId } from "./guest";
import { HubPage, type HostOption } from "./host";
import { AlbumHuesProvider } from "./light";
import { ReplayButton, useReplay } from "./replay";
import { guestScreenOf, hostScreenOf, ScrollTo, Strip } from "./scene";
import { EVENT_HEADER } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the head as its reader meets
 * it, in real frames at the width its Screen knob names.
 */

const pick = <T extends string>(ids: readonly T[], v: unknown, d: T): T =>
  (ids as readonly string[]).includes(v as string) ? (v as T) : d;

const GUESTS = ["today", "cover", "doorway", "masthead"] as const;

/** The guest's head every later question is drawn in: his pick, the recommendation until then. */
const guestOf = (s: BoardState): GuestDirection =>
  pick(GUESTS, s.guest, "cover");

const momentOf = (s: BoardState): GuestMoment =>
  s.album === "empty" ? "empty" : "full";

const hostMomentOf = (s: BoardState): HostMoment =>
  s.moment === "before" ? "before" : "tonight";

/** An option's own name off the spec, so a row's lede and the stage head agree. */
const LABEL = (ask: string, option: string) => {
  const found = EVENT_HEADER.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/** How far a frame that has moved on into the album is scrolled. */
const INTO: Record<"375" | "1440", number> = { "375": 1100, "1440": 900 };

function GuestStrip({
  s,
  direction,
}: {
  s: BoardState;
  direction: GuestDirection;
}) {
  const screen = guestScreenOf(s);
  const moment = momentOf(s);
  // A replay remounts the head inside the same frames, so its arrival plays again.
  const replay = useReplay();
  const key = `eh-guest-${direction}-${moment}`;
  return (
    <Strip
      screen={screen}
      lede={`${LABEL("guest", direction)}: the album as Priya lands on it, then scrolled into it.`}
      frames={[
        {
          id: `${key}-land`,
          title: "Priya lands on the album",
          node: (
            <GuestPage
              key={replay}
              direction={direction}
              screen={screen}
              moment={moment}
            />
          ),
        },
        {
          id: `${key}-into`,
          title: "Scrolled into the album",
          node: (
            <>
              <GuestPage
                key={replay}
                direction={direction}
                screen={screen}
                moment={moment}
                scrolled
              />
              <ScrollTo y={moment === "empty" ? 0 : INTO[screen]} />
            </>
          ),
        },
      ]}
    />
  );
}

function HostStrip({ s, option }: { s: BoardState; option: HostOption }) {
  const replay = useReplay();
  const screen = hostScreenOf(s);
  const moment = hostMomentOf(s);
  const guest = guestOf(s);
  const key = `eh-host-${option}-${guest}-${moment}`;
  return (
    <Strip
      screen={screen}
      lede={`${LABEL("host", option)}: Maya opens her hub, then scrolls into the album.`}
      frames={[
        {
          id: `${key}-open`,
          title:
            moment === "before"
              ? "Maya opens her hub, the week before"
              : "Maya opens her hub tonight",
          node: (
            <HubPage
              key={replay}
              option={option}
              guest={guest}
              screen={screen}
              moment={moment}
            />
          ),
        },
        {
          id: `${key}-into`,
          title: "Scrolled into the album",
          node: (
            <>
              <HubPage
                key={replay}
                option={option}
                guest={guest}
                screen={screen}
                moment={moment}
                scrolled
              />
              <ScrollTo y={screen === "1440" ? 700 : 900} />
            </>
          ),
        },
      ]}
    />
  );
}

function StaysStrip({ s, stays }: { s: BoardState; stays: StaysId }) {
  const replay = useReplay();
  const screen = guestScreenOf(s);
  const direction = guestOf(s);
  const key = `eh-stays-${stays}-${direction}`;
  return (
    <Strip
      screen={screen}
      lede={`${LABEL("stays", stays)}, under ${LABEL("guest", direction).toLowerCase()}: Priya deep in the album, then sending three photos.`}
      frames={[
        {
          id: `${key}-into`,
          title: "Deep in the album",
          node: (
            <>
              <GuestPage
                key={replay}
                direction={direction}
                screen={screen}
                moment="full"
                scrolled
                stays={stays}
              />
              <ScrollTo y={INTO[screen]} />
            </>
          ),
        },
        {
          id: `${key}-sending`,
          title: "Three of hers on their way",
          node: (
            <>
              <GuestPage
                key={replay}
                direction={direction}
                screen={screen}
                moment="full"
                scrolled
                stays={stays}
                uploading={3}
              />
              <ScrollTo y={INTO[screen] + 400} />
            </>
          ),
        },
      ]}
    />
  );
}

const PREVIEWS: PreviewsFor<typeof EVENT_HEADER> = {
  "host.today": (s) => <HostStrip s={s} option="today" />,
  "host.shared": (s) => <HostStrip s={s} option="shared" />,
  "host.numbers": (s) => <HostStrip s={s} option="numbers" />,
  "host.line": (s) => <HostStrip s={s} option="line" />,
  "stays.dock": (s) => <StaysStrip s={s} stays="dock" />,
  "stays.shutter": (s) => <StaysStrip s={s} stays="shutter" />,
  "stays.bar": (s) => <StaysStrip s={s} stays="bar" />,
  "guest.today": (s) => <GuestStrip s={s} direction="today" />,
  "guest.cover": (s) => <GuestStrip s={s} direction="cover" />,
  "guest.doorway": (s) => <GuestStrip s={s} direction="doorway" />,
  "guest.masthead": (s) => <GuestStrip s={s} direction="masthead" />,
};

export function EventHeaderBoard() {
  return (
    <AlbumHuesProvider>
      <ExplorationBoard
        spec={EVENT_HEADER}
        previews={PREVIEWS}
        dock={() => <ReplayButton />}
      />
    </AlbumHuesProvider>
  );
}

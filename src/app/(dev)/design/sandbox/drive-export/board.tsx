"use client";

import type { ReactNode } from "react";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";
import { formatCount } from "@/lib/format/count";
import { formatBytes } from "@/lib/utils";

import { Hub } from "./chrome";
import { DriveFolder, type Naming } from "./drive";
import { BIG, EVENT, HOST, TOTAL_BYTES, TOTAL_COUNT } from "./fixtures";
import { screenOf, type ScreenId } from "./knobs";
import {
  ConfirmStep,
  GoogleStandIn,
  MirrorStep,
  PromiseStep,
  TakeHome,
  type WayIn,
} from "./panel";
import {
  Account,
  type AccountWay,
  Dashboard,
  DisconnectConfirm,
  ExitConfirm,
  ExitRefused,
  type ExitWay,
  storedAfter,
  WhatsUsingSpace,
} from "./places";
import { Scene, Story } from "./scene";
import {
  CardProgress,
  DownloadCount,
  type Moment,
  MOMENTS,
  quietOf,
  SendBanner,
  SendEmail,
  SendStrip,
  SendToast,
} from "./send";
import { DRIVE_EXPORT } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each option drawn whole on production's
 * look as Maya meets it the morning after, its frames left to right as her
 * morning runs, at her laptop or her phone on the Screen knob. A staged ask is
 * drawn wearing the answer it waits on (the hard moments on the place While it
 * sends picks), and the moments after the way in wear the way in the board's
 * state holds. Every caption is read off its frame (`scene.tsx`).
 */

type Place = "album" | "toast" | "panel";
const placeOf = (s: BoardState): Place =>
  s.progress === "toast" ? "toast" : s.progress === "panel" ? "panel" : "album";
const wayOf = (s: BoardState): WayIn =>
  s["way-in"] === "originals"
    ? "originals"
    : s["way-in"] === "row"
      ? "row"
      : "third";

/**
 * A SEND'S MOMENT, WHERE THE PLACE PUTS IT: the strip at the album's head, the
 * toast over the page, or the Drive card inside Take it home (with the count
 * Download wears), and a banner across the page when one is asked for.
 */
function onPlace({
  screen,
  place,
  moment,
  banner,
  name,
  count,
}: {
  screen: ScreenId;
  place: Place;
  moment: Moment;
  banner?: Moment;
  name?: string;
  count?: number;
}): ReactNode {
  const desk = screen === "1440";
  const across = banner ? <SendBanner moment={banner} /> : undefined;
  if (place === "toast")
    return (
      <Hub
        screen={screen}
        name={name}
        count={count}
        banner={across}
        over={<SendToast moment={moment} />}
      />
    );
  if (place === "panel")
    return (
      <Hub
        screen={screen}
        name={name}
        count={count}
        banner={across}
        download={<DownloadCount moment={moment} />}
        over={
          <TakeHome
            desk={desk}
            way="third"
            connected
            drive={<CardProgress moment={moment} />}
          />
        }
      />
    );
  return (
    <Hub
      screen={screen}
      name={name}
      count={count}
      banner={across}
      strip={<SendStrip moment={moment} />}
    />
  );
}

/* ── the way in ───────────────────────────────────────────────────────── */

function wayIn(s: BoardState, way: WayIn): ReactNode {
  const screen = screenOf(s.screen);
  const desk = screen === "1440";
  return (
    <Story screen={screen}>
      <Scene
        id={`dx-way-${way}-first`}
        screen={screen}
        title="Take it home, before Drive is connected"
      >
        <Hub
          screen={screen}
          over={<TakeHome desk={desk} way={way} connected={false} />}
        />
      </Scene>
      <Scene
        id={`dx-way-${way}-connected`}
        screen={screen}
        title={`Take it home, connected as ${HOST.email}`}
      >
        <Hub
          screen={screen}
          over={<TakeHome desk={desk} way={way} connected />}
        />
      </Scene>
    </Story>
  );
}

/* ── the other doors ──────────────────────────────────────────────────── */

function doors(s: BoardState, which: "both" | "storage" | "panel"): ReactNode {
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Scene
        id={`dx-doors-${which}-events`}
        screen={screen}
        title={
          which === "both"
            ? "Your events, three albums picked"
            : "Your events, as today"
        }
      >
        <Dashboard door={which === "both"} picking={which === "both"} />
      </Scene>
      <Scene
        id={`dx-doors-${which}-storage`}
        screen={screen}
        title={`What's using space, filtered to ${EVENT.name}`}
      >
        <Dashboard over={<WhatsUsingSpace door={which !== "panel"} />} />
      </Scene>
    </Story>
  );
}

/* ── connecting ───────────────────────────────────────────────────────── */

function connect(
  s: BoardState,
  which: "promise" | "straight" | "mirror",
): ReactNode {
  const screen = screenOf(s.screen);
  const desk = screen === "1440";
  const before =
    which === "promise" ? (
      <PromiseStep />
    ) : which === "mirror" ? (
      <MirrorStep />
    ) : (
      <TakeHome
        desk={desk}
        way={wayOf(s)}
        connected={false}
        note="Partyreel only sees the files it puts in your Drive."
      />
    );
  const after =
    which === "straight" ? (
      <Hub
        screen={screen}
        strip={
          <SendStrip
            moment={{
              ...MOMENTS.sending,
              title: `Sending to ${HOST.email}`,
              meter: 1,
              facts: `3 of ${formatCount(TOTAL_COUNT)} · 12 MB of ${formatBytes(TOTAL_BYTES)} · about 25 minutes left`,
            }}
          />
        }
      />
    ) : (
      <Hub screen={screen} over={<ConfirmStep />} />
    );
  return (
    <Story screen={screen}>
      <Scene
        id={`dx-connect-${which}-before`}
        screen={screen}
        title="Before Google's screen"
      >
        <Hub screen={screen} over={before} />
      </Scene>
      <Scene
        id={`dx-connect-${which}-google`}
        screen={screen}
        title="Google's own screen, a stand-in"
      >
        <GoogleStandIn />
      </Scene>
      <Scene
        id={`dx-connect-${which}-after`}
        screen={screen}
        title={
          which === "straight"
            ? "Back from Google: sending at once"
            : "Back from Google: the final press"
        }
      >
        {after}
      </Scene>
    </Story>
  );
}

/* ── while it sends ───────────────────────────────────────────────────── */

function progress(s: BoardState, place: Place): ReactNode {
  const screen = screenOf(s.screen);
  const sending = MOMENTS.sending;
  return (
    <Story screen={screen}>
      <Scene
        id={`dx-progress-${place}-hub`}
        screen={screen}
        title="Nine minutes in, on the album"
      >
        {onPlace({ screen, place, moment: sending })}
      </Scene>
      <Scene
        id={`dx-progress-${place}-dashboard`}
        screen={screen}
        title="Back on her dashboard"
      >
        <Dashboard
          mark={
            place === "album"
              ? { label: `Sending ${sending.meter}%`, tone: "sending" }
              : undefined
          }
          over={place === "toast" ? <SendToast moment={sending} /> : undefined}
        />
      </Scene>
    </Story>
  );
}

/* ── the hard moments ─────────────────────────────────────────────────── */

const HARD = [
  { id: "full", title: "Her Drive is full" },
  { id: "daily", title: "Paused until tomorrow" },
  { id: "disconnected", title: "Disconnected at Google" },
  { id: "partly", title: "Partly done" },
] as const;

function hard(s: BoardState, how: "in-place" | "banner" | "email"): ReactNode {
  const screen = screenOf(s.screen);
  const place = placeOf(s);
  return (
    <Story screen={screen}>
      {HARD.map(({ id, title }) => {
        const m = MOMENTS[id];
        const shown =
          how === "in-place"
            ? m
            : how === "banner"
              ? quietOf(m, "See the note at the top of the page.")
              : quietOf(m, "We've emailed you what happened and what to do.");
        return (
          <Scene
            key={id}
            id={`dx-hard-${how}-${id}`}
            screen={screen}
            title={title}
          >
            {onPlace({
              screen,
              place,
              moment: shown,
              banner: how === "banner" ? m : undefined,
              name: id === "daily" ? BIG.name : undefined,
              count: id === "daily" ? BIG.items : undefined,
            })}
          </Scene>
        );
      })}
    </Story>
  );
}

/* ── done ─────────────────────────────────────────────────────────────── */

const DONE_MOMENT = {
  "open-free": MOMENTS.done,
  "free-first": MOMENTS["done-first"],
  "done-only": MOMENTS["done-plain"],
} as const;

function done(s: BoardState, which: keyof typeof DONE_MOMENT): ReactNode {
  const screen = screenOf(s.screen);
  const size = formatBytes(TOTAL_BYTES);
  const lines = [
    `All ${formatCount(TOTAL_COUNT)} photos and videos are in My Drive › Partyreel › ${EVENT.folder}: ${size}, every one checked against ours.`,
  ];
  const email =
    which === "free-first" ? (
      <SendEmail
        heading="Everything's in your Google Drive"
        lines={[
          ...lines,
          `Free its ${size} from Partyreel now, or keep the album here as it is.`,
        ]}
        cta={`Free ${size} from Partyreel`}
        link="Open in Drive"
      />
    ) : (
      <SendEmail
        heading={`${EVENT.name} is in your Google Drive`}
        lines={lines}
        cta="Open in Drive"
        link={
          which === "open-free" ? `Free its ${size} from Partyreel` : undefined
        }
      />
    );
  return (
    <Story screen={screen}>
      <Scene
        id={`dx-done-${which}-album`}
        screen={screen}
        title="The moment it finishes"
      >
        {onPlace({ screen, place: placeOf(s), moment: DONE_MOMENT[which] })}
      </Scene>
      <Scene
        id={`dx-done-${which}-email`}
        screen={screen}
        title="The email that says it's done"
      >
        {email}
      </Scene>
    </Story>
  );
}

/* ── freeing its room ─────────────────────────────────────────────────── */

function exit(s: BoardState, way: ExitWay): ReactNode {
  const screen = screenOf(s.screen);
  const size = formatBytes(TOTAL_BYTES);
  const said: Moment =
    way === "for-good"
      ? {
          tone: "done",
          word: "Deleted",
          title: `Deleted for good: ${size} freed`,
          where: "",
          facts: "Every original stays in your Drive.",
          acts: [],
        }
      : {
          tone: "done",
          word: "Moved",
          title: `Moved to Deleted: its ${size} makes room for your next uploads`,
          where: "",
          facts: "It leaves for good on 13 Oct.",
          acts: [{ label: "Undo" }],
        };
  return (
    <Story screen={screen}>
      <Scene
        id={`dx-exit-${way}-confirm`}
        screen={screen}
        title="The confirm, once the app has checked every item"
      >
        <Hub screen={screen} over={<ExitConfirm way={way} />} />
      </Scene>
      <Scene
        id={`dx-exit-${way}-after`}
        screen={screen}
        title="Her storage, after"
      >
        {/* The toast says what happened at a desk; on a phone it would stand over the chart it explains. */}
        <Dashboard
          ringOpen
          without="maya-jay"
          stored={storedAfter(way === "choose" ? "to-deleted" : way)}
          over={screen === "1440" ? <SendToast moment={said} /> : undefined}
        />
      </Scene>
      <Scene
        id={`dx-exit-${way}-gap`}
        screen={screen}
        title="When the check finds a gap"
      >
        <Hub screen={screen} over={<ExitRefused />} />
      </Scene>
    </Story>
  );
}

/* ── the connection ───────────────────────────────────────────────────── */

function account(s: BoardState, way: AccountWay): ReactNode {
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Scene
        id={`dx-account-${way}-page`}
        screen={screen}
        title="Account, under Plan"
      >
        <Account way={way} />
      </Scene>
      <Scene
        id={`dx-account-${way}-disconnect`}
        screen={screen}
        title="Disconnect's confirm"
      >
        <Account way={way} over={<DisconnectConfirm />} />
      </Scene>
    </Story>
  );
}

/* ── names ────────────────────────────────────────────────────────────── */

function naming(s: BoardState, which: Naming): ReactNode {
  const screen = screenOf(s.screen);
  return (
    <Story screen={screen}>
      <Scene
        id={`dx-naming-${which}`}
        screen={screen}
        title="The album's folder in her Drive"
      >
        <DriveFolder naming={which} screen={screen} />
      </Scene>
    </Story>
  );
}

/* ── the map ──────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof DRIVE_EXPORT> = {
  "way-in.third": (s) => wayIn(s, "third"),
  "way-in.originals": (s) => wayIn(s, "originals"),
  "way-in.row": (s) => wayIn(s, "row"),
  "doors.both": (s) => doors(s, "both"),
  "doors.storage": (s) => doors(s, "storage"),
  "doors.panel": (s) => doors(s, "panel"),
  "connect.promise": (s) => connect(s, "promise"),
  "connect.straight": (s) => connect(s, "straight"),
  "connect.mirror": (s) => connect(s, "mirror"),
  "progress.album": (s) => progress(s, "album"),
  "progress.toast": (s) => progress(s, "toast"),
  "progress.panel": (s) => progress(s, "panel"),
  "hard.in-place": (s) => hard(s, "in-place"),
  "hard.banner": (s) => hard(s, "banner"),
  "hard.email": (s) => hard(s, "email"),
  "done.open-free": (s) => done(s, "open-free"),
  "done.free-first": (s) => done(s, "free-first"),
  "done.done-only": (s) => done(s, "done-only"),
  "exit.to-deleted": (s) => exit(s, "to-deleted"),
  "exit.for-good": (s) => exit(s, "for-good"),
  "exit.choose": (s) => exit(s, "choose"),
  "account.card": (s) => account(s, "card"),
  "account.in-plan": (s) => account(s, "in-plan"),
  "account.apps": (s) => account(s, "apps"),
  "naming.when-who": (s) => naming(s, "when-who"),
  "naming.by-guest": (s) => naming(s, "by-guest"),
  "naming.zip": (s) => naming(s, "zip"),
};

export function DriveExportBoard() {
  return <ExplorationBoard spec={DRIVE_EXPORT} previews={PREVIEWS} />;
}

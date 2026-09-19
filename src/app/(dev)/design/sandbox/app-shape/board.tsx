"use client";

import "./app-shape.css";

import type { ReactNode } from "react";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { AccountScreen, type You, youOf } from "./account";
import {
  AppChrome,
  type Nav,
  navOf,
  type Phone,
  phoneOf,
  type Place,
  Screen,
  type Size,
  sizeOf,
} from "./chrome";
import {
  type Event,
  EventPage,
  eventOf,
  type Setting,
  settingOf,
  type Share,
  ShareRoomPage,
  SettingsScreen,
  shareOf,
} from "./event";
import { LIVE } from "./fixtures";
import { type Density, densityOf, type Home, homeOf, HostHome } from "./home";
import { APP_SHAPE } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the host app at a real window.
 *
 * ★ ONE APP, EIGHT DECISIONS, ONE STATE. Every picture below is the same shell
 * around the same Saturday night with exactly one axis moved, which is what
 * makes eight questions one board rather than eight boards in a trench coat:
 * the density is judged on the home that was picked, the navigation around the
 * event page that was picked, sharing and settings inside both. Each preview
 * reads the board's live state and overrides only its own axis, so going back
 * to the home after answering the event page redraws it in the world he chose
 * rather than the one the board assumed.
 *
 * ★ 1440 AND 375, BOTH REAL. The window is one knob on every decision's strip,
 * so the same option can be read on a laptop and in a hand without leaving the
 * step; the phone decision ignores the knob and always draws at 375, and its
 * tiles are a phone column (`tile: "phone"` in the spec) rather than a
 * thumbnail adrift in an empty room.
 *
 * ★ AND EVERY CAPTION IS MEASURED IN THE FRAME (chrome.tsx, `Measure`): the
 * working room, and the album's real column count and tile width. If a caption
 * and the words above it disagree, the caption is the truth.
 */

/** The axes, read off the board's live state, with one override per preview. */
type World = {
  size: Size;
  nav: Nav;
  phone: Phone;
  home: Home;
  density: Density;
  event: Event;
  share: Share;
  setting: Setting;
  you: You;
};

const worldOf = (s: BoardState, over: Partial<World> = {}): World => ({
  size: sizeOf(s.size),
  nav: navOf(s.nav),
  phone: phoneOf(s.phone),
  home: homeOf(s.home),
  density: densityOf(s.density),
  event: eventOf(s.event),
  share: shareOf(s.share),
  setting: settingOf(s.settings),
  you: youOf(s.you),
  ...over,
});

/** One picture: the chrome the world says, around the page the option is. */
function App({
  id,
  w,
  caption,
  place,
  bleed = false,
  usePhoneShape = false,
  children,
}: {
  id: string;
  w: World;
  caption: string;
  place: Place;
  /** The page runs to the window rather than sitting in the app's column. */
  bleed?: boolean;
  /** The phone decision's own previews, which pin the size and the shape. */
  usePhoneShape?: boolean;
  children: ReactNode;
}) {
  const size = usePhoneShape ? "phone" : w.size;
  return (
    <Screen
      id={id}
      size={size}
      title={TITLES[id] ?? id}
      caption={caption}
    >
      <AppChrome
        nav={w.nav}
        size={size}
        phone={usePhoneShape ? w.phone : undefined}
        place={place}
        bleed={bleed}
      >
        {children}
      </AppChrome>
    </Screen>
  );
}

/** The words over each frame: the option, in its own language. */
const TITLES: Record<string, string> = {
  "home-inbox": "The inbox of everything, as today",
  "home-events": "Your events, and nothing else",
  "home-pulse": "What needs you, then what just arrived",
  "density-cover": "The cover card, as today",
  "density-row": "A row: the cover behind it, counts in columns",
  "density-wall": "A wall of its newest photographs",
  "event-feed": "One urgency-ordered scroll, as today",
  "event-hub": "A front page with a door into each room",
  "event-album": "The album is the page",
  "nav-header": "The bar and a menu, as today",
  "nav-crumbs": "A trail in the bar, the rooms under it",
  "nav-rail": "A rail of your events and their rooms",
  "share-modal": "A dialog behind a Share button, as today",
  "share-room": "A room of its own",
  "share-front": "On the event itself, always there",
  "settings-column": "A page of cards, as today",
  "settings-sheet": "A sheet beside the album",
  "settings-rooms": "Each setting beside what it governs",
  "you-today": "A popover, and four places, as today",
  "you-you": "One You: plan, profile, connections, your media",
  "you-account": "The Account page, plus a plan card",
  "phone-narrow": "The same shape, narrowed, as today",
  "phone-thumb": "A bar at the bottom, in reach",
  "phone-same": "One shape at both sizes",
};

/* ── The home, and how an event draws on it ──────────────────────────────── */

const HOME_CAPTION: Record<Home, string> = {
  inbox:
    "The events are one section of five, under a heading that says Dashboard; her own uploads and likes are the two beneath.",
  events:
    "Three events and a line saying where everything else went. Nothing on this page is about anybody but her guests.",
  pulse:
    "Two waiting queues, a missing reel and the storage line, then the twelve photographs of the last hour, then the events.",
};

const DENSITY_CAPTION: Record<Density, string> = {
  cover:
    "Three cards fill the row and the amber chip is the only sign that twelve photos are waiting.",
  row: "The cover is the row's own ground; the four newest and the counts read down the page.",
  wall: "Six recent photographs per event, the name and counts as one line over them.",
};

function homeScreen(id: string, w: World, caption: string) {
  return (
    <App id={id} w={w} caption={caption} place={{ room: "Home" }}>
      <HostHome
        home={w.home}
        density={w.density}
        size={w.size === "phone" ? "phone" : "laptop"}
      />
    </App>
  );
}

/* ── The event, and the three things that live on it ─────────────────────── */

const EVENT_CAPTION: Record<Event, string> = {
  feed: "Count the page above the first photograph: the link back, the name, the glyphs, the chips, the strip and the pills.",
  hub: "Four doors carrying their own counts, and the photographs start under them.",
  album:
    "One line of identity, the queue as a banner, and the album from there down.",
};

const eventPlace = (room = "Album"): Place => ({ event: LIVE, room });

function eventScreen(id: string, w: World, caption: string) {
  return (
    <App
      id={id}
      w={w}
      caption={caption}
      place={eventPlace()}
      bleed={w.event === "album"}
    >
      <EventPage
        event={w.event}
        share={w.share}
        size={w.size === "phone" ? "phone" : "laptop"}
      />
    </App>
  );
}

const NAV_CAPTION: Record<Nav, string> = {
  header:
    "Nothing in the bar says which of the seven routes this is, or what the other six are.",
  crumbs:
    "The trail names the place and walks back up it; the rooms sit on a second row and cost no width.",
  rail: "Every event and the open one's rooms, always readable. Read the measured room against the other two.",
};

const SHARE_CAPTION: Record<Share, string> = {
  modal:
    "The code exists only while this is open, and the event is behind a scrim while a host reads it out.",
  room: "The code at 320 px, the link, three posters and the invite, on a page of its own.",
  front:
    "The code and the link in the event's own header, on the page the host is already on.",
};

const SETTING_CAPTION: Record<Setting, string> = {
  column:
    "Seven cards down one column, and the sixth is a Deleted that holds photographs while the home's Deleted holds events.",
  sheet:
    "The album stays on screen behind the panel, so a change to who can see this is judged against what it governs.",
  rooms:
    "Nothing called Settings survives: each switch is named by the room it belongs to, and Danger is the only page left.",
};

const YOU_CAPTION: Record<You, string> = {
  today:
    "The only door to a plan in the whole app, drawn as the shipped popover, and a note listing the other four places.",
  you: "The plan, the profile, the connections and her own photographs behind one avatar.",
  account:
    "Today's Account page with one card added at the top, and a line saying what did not move.",
};

const PHONE_CAPTION: Record<Phone, string> = {
  narrow:
    "The 56 px bar, a text link for the way back, and every control at the top of an 812 px screen.",
  thumb:
    "Where you are at the top, where you can go at the bottom, with the queue's count on the bar.",
  same: "The trail cut to where you are and the rooms scrolling sideways: one layout at both sizes.",
};

/* ── The map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof APP_SHAPE> = {
  "home.inbox": (s) =>
    homeScreen("home-inbox", worldOf(s, { home: "inbox" }), HOME_CAPTION.inbox),
  "home.events": (s) =>
    homeScreen(
      "home-events",
      worldOf(s, { home: "events" }),
      HOME_CAPTION.events,
    ),
  "home.pulse": (s) =>
    homeScreen("home-pulse", worldOf(s, { home: "pulse" }), HOME_CAPTION.pulse),

  "density.cover": (s) =>
    homeScreen(
      "density-cover",
      worldOf(s, { density: "cover" }),
      DENSITY_CAPTION.cover,
    ),
  "density.row": (s) =>
    homeScreen(
      "density-row",
      worldOf(s, { density: "row" }),
      DENSITY_CAPTION.row,
    ),
  "density.wall": (s) =>
    homeScreen(
      "density-wall",
      worldOf(s, { density: "wall" }),
      DENSITY_CAPTION.wall,
    ),

  "event.feed": (s) =>
    eventScreen(
      "event-feed",
      worldOf(s, { event: "feed" }),
      EVENT_CAPTION.feed,
    ),
  "event.hub": (s) =>
    eventScreen("event-hub", worldOf(s, { event: "hub" }), EVENT_CAPTION.hub),
  "event.album": (s) =>
    eventScreen(
      "event-album",
      worldOf(s, { event: "album" }),
      EVENT_CAPTION.album,
    ),

  "nav.header": (s) =>
    eventScreen("nav-header", worldOf(s, { nav: "header" }), NAV_CAPTION.header),
  "nav.crumbs": (s) =>
    eventScreen("nav-crumbs", worldOf(s, { nav: "crumbs" }), NAV_CAPTION.crumbs),
  "nav.rail": (s) =>
    eventScreen("nav-rail", worldOf(s, { nav: "rail" }), NAV_CAPTION.rail),

  "share.modal": (s) =>
    eventScreen(
      "share-modal",
      worldOf(s, { share: "modal" }),
      SHARE_CAPTION.modal,
    ),
  "share.front": (s) =>
    eventScreen(
      "share-front",
      worldOf(s, { share: "front" }),
      SHARE_CAPTION.front,
    ),
  // The room is a PAGE, so it replaces the event page rather than sitting on it.
  "share.room": (s) => {
    const w = worldOf(s, { share: "room" });
    return (
      <App
        id="share-room"
        w={w}
        caption={SHARE_CAPTION.room}
        place={eventPlace("Share")}
      >
        <ShareRoomPage size={w.size === "phone" ? "phone" : "laptop"} />
      </App>
    );
  },

  "settings.column": (s) => settingsScreen(s, "column"),
  "settings.sheet": (s) => settingsScreen(s, "sheet"),
  "settings.rooms": (s) => settingsScreen(s, "rooms"),

  "you.today": (s) => youScreen(s, "today"),
  "you.you": (s) => youScreen(s, "you"),
  "you.account": (s) => youScreen(s, "account"),

  "phone.narrow": (s) => phoneScreen(s, "narrow"),
  "phone.thumb": (s) => phoneScreen(s, "thumb"),
  "phone.same": (s) => phoneScreen(s, "same"),
};

/** The sheet sits OVER the album, so its place is the album and not Settings. */
function settingsScreen(s: BoardState, setting: Setting) {
  const w = worldOf(s, { setting });
  return (
    <App
      id={`settings-${setting}`}
      w={w}
      caption={SETTING_CAPTION[setting]}
      place={eventPlace(setting === "sheet" ? "Album" : "Settings")}
      bleed={setting === "sheet"}
    >
      <SettingsScreen
        setting={setting}
        size={w.size === "phone" ? "phone" : "laptop"}
      />
    </App>
  );
}

function youScreen(s: BoardState, you: You) {
  const w = worldOf(s, { you });
  return (
    <App
      id={`you-${you}`}
      w={w}
      caption={YOU_CAPTION[you]}
      place={{ room: you === "today" ? "Home" : "You" }}
    >
      <AccountScreen you={you} />
    </App>
  );
}

/** The phone decision pins the size and the shape, whatever the window knob. */
function phoneScreen(s: BoardState, phone: Phone) {
  const w = worldOf(s, { phone });
  return (
    <App
      id={`phone-${phone}`}
      w={w}
      caption={PHONE_CAPTION[phone]}
      place={eventPlace()}
      bleed={w.event === "album"}
      usePhoneShape
    >
      <EventPage event={w.event} share={w.share} size="phone" />
    </App>
  );
}

export function AppShapeBoard() {
  return <ExplorationBoard spec={APP_SHAPE} previews={PREVIEWS} />;
}

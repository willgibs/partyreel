"use client";

import type { ReactNode } from "react";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";
import {
  DEFAULT_QR_PRESET,
  QR_PRESETS,
  type QrStyleKey,
} from "@/lib/constants/qr-presets";

import {
  type Asks,
  asksOf,
  CreateScreen,
  type Limit,
  limitOf,
  LimitScreen,
  type Style,
  styleOf,
  StyleScreen,
} from "./create";
import {
  type Empty,
  emptyOf,
  EventPage,
  type First,
  firstOf,
} from "./event";
import { Screen, type Size, sizeOf } from "./frame";
import { Shell } from "./frame";
import {
  type Hand,
  handOf,
  HandScreen,
  type Landing,
  landingOf,
  LandingScreen,
  type Venue,
  venueOf,
  VenueScreen,
} from "./venue";
import { FIRST_EVENT } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is one host's first event at a
 * real window.
 *
 * ★ ONE EVENT, EIGHT DECISIONS, ONE STATE. Every picture below is the same
 * shell around the same wedding with exactly one axis moved, which is what
 * makes eight questions one board: the limit refusal is drawn inside whatever
 * create form was picked, the landing inside whatever the app prints, the first
 * photograph on whatever the empty page was showing before it. Each preview
 * reads the board's live state and overrides only its own axis, so going back
 * to a question after answering the one it feeds redraws it in the world he
 * chose rather than the one the board assumed.
 *
 * ★ 1440 AND 375, BOTH REAL. The window is one knob on every decision's strip,
 * so the same option can be read on a laptop and in a hand without leaving the
 * step. The hand decision ignores the knob and always draws at 375, and its
 * tiles are a phone column (`tile: "phone"` in the spec) rather than a
 * thumbnail adrift in an empty room.
 *
 * ★ AND EVERY CAPTION CARRIES THE MODULE (frame.tsx). The code's px edge and
 * the px per module are read off the laid-out document, and a code under the
 * 3 px floor the river's plate enforces says so in its own caption. That is the
 * one thing on this board that cannot be argued with: if the words above a
 * frame and the caption under it disagree, the caption is the truth.
 */

/** The axes, read off the board's live state, with one override per preview. */
type World = {
  size: Size;
  preset: QrStyleKey;
  asks: Asks;
  style: Style;
  limit: Limit;
  venue: Venue;
  landing: Landing;
  hand: Hand;
  empty: Empty;
  first: First;
};

const presetOf = (v: string | undefined): QrStyleKey =>
  v && v in QR_PRESETS ? (v as QrStyleKey) : DEFAULT_QR_PRESET;

const worldOf = (s: BoardState, over: Partial<World> = {}): World => ({
  size: sizeOf(s.size),
  preset: presetOf(s.preset),
  asks: asksOf(s.asks),
  style: styleOf(s.style),
  limit: limitOf(s.limit),
  venue: venueOf(s.venue),
  landing: landingOf(s.landing),
  hand: handOf(s.hand),
  empty: emptyOf(s.empty),
  first: firstOf(s.first),
  ...over,
});

/** One picture: a real window, the shipped shell, the surface the option is. */
function App({
  id,
  size,
  caption,
  wide = false,
  children,
}: {
  id: string;
  size: Size;
  caption: string;
  /** The page runs to the window rather than sitting in the app's column. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <Screen id={id} size={size} title={TITLES[id] ?? id} caption={caption}>
      <Shell wide={wide}>{children}</Shell>
    </Screen>
  );
}

/** The words over each frame: the option, in its own language. */
const TITLES: Record<string, string> = {
  "asks-form": "Three fields, one required, as today",
  "asks-one": "One field: the name",
  "asks-none": "No field: a name from the day",
  "style-step": "A step of the wizard, as today",
  "style-after": "On the real code, once it exists",
  "style-later": "Out of the flow: Classic until asked",
  "limit-after": "Created, then refused, as today",
  "limit-door": "Refused before the form opens",
  "limit-inplace": "The form opens and says so, both exits in it",
  "venue-files": "Two files and a link, as today",
  "venue-sheet": "Stock the app prints: cards, a sign, a poster",
  "venue-send": "Send it to yourself",
  "landing-page": "Straight into the event",
  "landing-beat": "A beat of its own, then the event",
  "landing-home": "The dashboard, the new event lit",
  "hand-same": "The share dialog at 375, as today",
  "hand-show": "The code alone, full screen, full brightness",
  "hand-card": "The phone becomes the table card",
  "empty-none": "No uploads yet, as today",
  "empty-list": "A launch list of what is left",
  "empty-code": "The code, full size, in the album's room",
  "first-reload": "Nothing until she reloads, as today",
  "first-live": "It lands while she is looking",
  "first-tell": "The app goes and finds her",
};

/* ── Making it ───────────────────────────────────────────────────────────── */

const ASKS_CAPTION: Record<Asks, string> = {
  form: "Count the labels above the one field that gates anything, and the two step numbers still to go before the event exists.",
  one: "One label, one field, one button, and the event is real on the far side of it.",
  none: "Nothing was asked. The name is the day, selected and typable, and the code is already live under it.",
};

const STYLE_CAPTION: Record<Style, string> = {
  step: "The four swatches are 96 px, which is 2.3 px a module: a host who test-scans the style they are choosing cannot, and the link under them is 32 zeroes.",
  after: "The code changing under the picker is the one guests will scan. Press another preset and watch the plate above redraw.",
  later:
    "Classic, at the size the code actually needs, and one quiet line for the hosts who want one of the other three.",
};

const LIMIT_CAPTION: Record<Limit, string> = {
  after:
    "She is on the dashboard she did not ask for, the wedding is not here, and the style she chose went with the screen.",
  door: "The form never opens. She reads one sentence, sees the event she already has, and picks a door.",
  inplace:
    "The band is the whole cost: she is where she came to be, the work is not typed twice, and both exits are in reach. With no form to band, it lands on the press.",
};

/* ── Getting it out ──────────────────────────────────────────────────────── */

const VENUE_CAPTION: Record<Venue, string> = {
  files:
    "A 200 px code, a two-row menu and a link. Everything between this and a card on a table happens somewhere else.",
  sheet:
    "Real paper proportions with the real code set in them. The mm under each piece is what the sheet would print; the px in the caption is a scaled mock of it.",
  send: "On a laptop this is the email and nothing else, which is the option's own cost. Flip the window to 375 for the share sheet.",
};

const LANDING_CAPTION: Record<Landing, string> = {
  page: "The ongoing page at the one moment it holds nothing, with the code in its header carrying the whole of the next move.",
  beat: "One screen, one job, one way out. Whatever the venue question answered is what sits in the middle of it.",
  home: "One more card, lit, and a code she can see without opening anything. Nothing says what to do with it.",
};

const HAND_CAPTION: Record<Hand, string> = {
  same: "A dialog on a phone: a title, a description, a download menu and a manage link, around the only thing the guest needs.",
  show: "Everything a dialog spent on chrome is spent on modules instead. Read this caption's px against the other two.",
  card: "The code is smaller than the bare one by design, because the words are what a propped phone says when nobody is beside it.",
};

/* ── Watching it fill ────────────────────────────────────────────────────── */

const EMPTY_CAPTION: Record<Empty, string> = {
  none: "The shipped empty state, word for word, and the button it names lives on a strip this page does not draw.",
  list: "Three facts the app already holds, as three jobs with an end. One is done before she reads it.",
  code: "The header's code retires while this one holds the room, so the page carries one code rather than two. Read its module count against every other frame here.",
};

const FIRST_CAPTION: Record<First, string> = {
  reload:
    "Marta's photograph landed six minutes ago. This is the page: whatever the empty question answered, unchanged, count still at zero.",
  live: "One tile in a room that was empty a second ago, ringed, with the count and the Live pip moved. Nothing else on the page changed.",
  tell: "The option is the sentence. Read the lock screen and the email as copy, then the capability they need.",
};

/* ── The map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof FIRST_EVENT> = {
  "asks.form": (s) => createScreen(s, "form"),
  "asks.one": (s) => createScreen(s, "one"),
  "asks.none": (s) => createScreen(s, "none"),

  "style.step": (s) => styleScreen(s, "step"),
  "style.after": (s) => styleScreen(s, "after"),
  "style.later": (s) => styleScreen(s, "later"),

  "limit.after": (s) => limitScreen(s, "after"),
  "limit.door": (s) => limitScreen(s, "door"),
  "limit.inplace": (s) => limitScreen(s, "inplace"),

  "venue.files": (s) => venueScreen(s, "files"),
  "venue.sheet": (s) => venueScreen(s, "sheet"),
  "venue.send": (s) => venueScreen(s, "send"),

  "landing.page": (s) => landingScreen(s, "page"),
  "landing.beat": (s) => landingScreen(s, "beat"),
  "landing.home": (s) => landingScreen(s, "home"),

  "hand.same": () => handScreen("same"),
  "hand.show": () => handScreen("show"),
  "hand.card": () => handScreen("card"),

  "empty.none": (s) => emptyScreen(s, "none"),
  "empty.list": (s) => emptyScreen(s, "list"),
  "empty.code": (s) => emptyScreen(s, "code"),

  "first.reload": (s) => firstScreen(s, "reload"),
  "first.live": (s) => firstScreen(s, "live"),
  "first.tell": (s) => firstScreen(s, "tell"),
};

function createScreen(s: BoardState, asks: Asks) {
  const w = worldOf(s, { asks });
  return (
    <App id={`asks-${asks}`} size={w.size} caption={ASKS_CAPTION[asks]}>
      <CreateScreen asks={asks} size={w.size} />
    </App>
  );
}

function styleScreen(s: BoardState, style: Style) {
  const w = worldOf(s, { style });
  return (
    <App id={`style-${style}`} size={w.size} caption={STYLE_CAPTION[style]}>
      <StyleScreen style={style} pick={w.preset} size={w.size} />
    </App>
  );
}

/** The refusal is drawn inside whatever create surface the first question won. */
function limitScreen(s: BoardState, limit: Limit) {
  const w = worldOf(s, { limit });
  return (
    <App id={`limit-${limit}`} size={w.size} caption={LIMIT_CAPTION[limit]}>
      <LimitScreen limit={limit} asks={w.asks} />
    </App>
  );
}

function venueScreen(s: BoardState, venue: Venue) {
  const w = worldOf(s, { venue });
  return (
    <App id={`venue-${venue}`} size={w.size} caption={VENUE_CAPTION[venue]}>
      <VenueScreen venue={venue} size={w.size} />
    </App>
  );
}

/** The landing carries the venue answer, because that is what sits inside it. */
function landingScreen(s: BoardState, landing: Landing) {
  const w = worldOf(s, { landing });
  return (
    <App
      id={`landing-${landing}`}
      size={w.size}
      caption={LANDING_CAPTION[landing]}
      wide={landing === "page"}
    >
      <LandingScreen
        landing={landing}
        venue={w.venue}
        empty={w.empty}
        first={w.first}
        size={w.size}
      />
    </App>
  );
}

/**
 * The hand's three options are FULL-BLEED PHONE SCREENS, so they are drawn
 * without the app's shell and without its gutter: a code that stops 16 px short
 * of the glass is not the option being judged. The frame is still 375 by 812
 * and still real.
 */
function handScreen(hand: Hand) {
  return (
    <Screen
      id={`hand-${hand}`}
      size="phone"
      title={TITLES[`hand-${hand}`]}
      caption={HAND_CAPTION[hand]}
    >
      <div data-fe-room className="min-h-[812px] w-full">
        <HandScreen hand={hand} />
      </div>
    </Screen>
  );
}

function emptyScreen(s: BoardState, empty: Empty) {
  const w = worldOf(s, { empty });
  return (
    <App
      id={`empty-${empty}`}
      size={w.size}
      caption={EMPTY_CAPTION[empty]}
      wide
    >
      <EventPage empty={empty} first={w.first} size={w.size} />
    </App>
  );
}

/** The first photograph lands on whatever the empty page was showing. */
function firstScreen(s: BoardState, first: First) {
  const w = worldOf(s, { first });
  return (
    <App
      id={`first-${first}`}
      size={w.size}
      caption={FIRST_CAPTION[first]}
      wide
    >
      <EventPage empty={w.empty} first={first} size={w.size} filled />
    </App>
  );
}

export function FirstEventBoard() {
  return <ExplorationBoard spec={FIRST_EVENT} previews={PREVIEWS} />;
}

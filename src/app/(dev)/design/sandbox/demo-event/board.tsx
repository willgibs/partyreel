"use client";

import "./demo-event.css";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  Arrival,
  type ArrivalShape,
  arrivalOf,
  PartyDoor,
  PartySwitch,
  Shell,
} from "./arrival";
import { Door, type DoorShape, type PlaceId, placeOf } from "./doors";
import { DEMO, PARTIES, partyOf } from "./fixtures";
import {
  ClosingCard,
  DemoPage,
  SCREENS,
  type ScreenId,
  screenOf,
  TurnCard,
} from "./page-parts";
import { PairedLaptopLine, PairedPhoneLine, ScannedLine } from "./scan";
import { DEMO_EVENT } from "./spec";

/**
 * ★ THE GROUND IS TODAY'S PRODUCT, NOT THE BOARD'S OWN RECOMMENDATIONS. Every
 * picture is the shipped demo with ONE thing changed, so a decision never
 * quietly arrives wearing the answer to a question he has not been asked: the
 * album keeps its grey banner, the arrival keeps its absence, the action row
 * keeps its empty span. The exceptions are the three staged decisions, where
 * wearing the earlier answer is the whole point of the staging: `framing` is
 * judged on the arrival he picked, `event` on the same one, and `next` on the
 * try he picked.
 */
const TODAY = {
  arrival: "album",
  say: "banner",
  slot: "empty",
} as const;

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the demo at a real screen.
 *
 * ★ EVERY PREVIEW IS A FUNCTION OF THE BOARD'S STATE. The screen is a knob the
 * guest-page decisions share and every picture reads it; the three staged
 * decisions are drawn WEARING the answer they wait on. The earlier decisions
 * read the later answers too, so going back redraws them in the world he chose
 * rather than the one the board assumed.
 *
 * ★ THE NUMBERS UNDER EVERY FRAME ARE MEASURED, NEVER COMPUTED. A board once
 * drew an option with its formula's sign backwards and the tile Will judged
 * showed the opposite of its words (docs/PROGRAM.md). So each caption reads the
 * laid-out DOM inside the frame's own document once it settles: how tall the
 * arrival really stands, how many columns the album really fell into, how much
 * of the screen the demo really spends saying it is a demo. If the words above
 * a frame and the caption under it disagree, the caption is the truth.
 */

/* ── the measurement ─────────────────────────────────────────────────────── */

type Reader = (root: HTMLElement, win: Window) => string | null;

/**
 * Reads one fact out of the frame's own document.
 *
 * ★ THE OBSERVER IS THE FRAME'S, NOT THE LAB PAGE'S. The subtree lives in the
 * iframe's document, so it is observed with THAT window's `ResizeObserver`: it
 * fires when the copied stylesheets land (the first layout is unstyled) and
 * again whenever a new option re-flows the page. A hidden option on the stage
 * is `visibility: hidden`, which keeps its layout, so it measures true as
 * well. The late pass covers the two things an observer cannot see:
 * photographs decoding at their natural heights inside columns that never
 * changed width, and the page's own deferred scroll settling.
 */
function Probe({
  read,
  onRead,
  children,
}: {
  read: Reader;
  onRead: (s: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // The latest reader and reporter, refreshed AFTER each commit: writing a ref
  // in the render body is the thing the compiler's rule refuses, and the
  // observer below must not be torn down and rebuilt on every render.
  const latest = useRef({ read, onRead });
  useEffect(() => {
    latest.current = { read, onRead };
  });

  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView as
      | (Window & typeof globalThis)
      | null
      | undefined;
    if (!el || !win) return;
    const run = () => {
      const said = latest.current.read(el, win);
      if (said) latest.current.onRead(said);
    };
    run();
    const ro = new win.ResizeObserver(run);
    ro.observe(el);
    const late = win.setTimeout(run, 1500);
    return () => {
      ro.disconnect();
      win.clearTimeout(late);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

const pct = (h: number, win: Window) => Math.round((h / win.innerHeight) * 100);

/** How tall the surface standing over the album really is. */
const arrivalRead: Reader = (root, win) => {
  const el = root.querySelector<HTMLElement>("[data-de-arrival]");
  if (!el) return "Measured: no surface at all; the album is the arrival.";
  const h = Math.round(el.getBoundingClientRect().height);
  if (h < 8) return null;
  return `Measured: ${h} px tall, ${pct(h, win)} percent of the screen.`;
};

/** How the album actually fell into columns, and how wide a tile came out. */
function albumFacts(root: HTMLElement): string | null {
  const tiles = root.querySelectorAll<HTMLElement>("[data-media-tile]");
  if (tiles.length === 0) return null;
  const lefts = new Set<number>();
  tiles.forEach((t) => lefts.add(Math.round(t.getBoundingClientRect().left)));
  const w = Math.round(tiles[0].getBoundingClientRect().width);
  return `${tiles.length} photographs in ${lefts.size} columns of ${w} px`;
}

/**
 * What the demo spends on saying it is a demo, and whether that is still on
 * the screen once a visitor has scrolled into the photographs. This is the
 * whole of the `framing` question in one number: the banner's cost is real but
 * it is spent before the first flick.
 */
const sayingRead: Reader = (root, win) => {
  const album = albumFacts(root);
  const els = root.querySelectorAll<HTMLElement>("[data-de-say]");
  if (els.length === 0)
    return album ? `Measured: nothing says "demo"; ${album}.` : null;
  let px = 0;
  let onScreen = false;
  els.forEach((el) => {
    const box = el.getBoundingClientRect();
    px += Math.round(box.height);
    if (box.bottom > 0 && box.top < win.innerHeight) onScreen = true;
  });
  const where = onScreen
    ? "still on the screen here"
    : "already scrolled off the screen";
  return `Measured: ${px} px of it, ${pct(px, win)} percent of the screen, ${where}${album ? `; ${album}` : ""}.`;
};

/** The album alone, for the decisions that only change what is around it. */
const albumRead: Reader = (root) => {
  const album = albumFacts(root);
  return album ? `Measured: ${album}.` : null;
};

/**
 * How many parties the demo is, as the picture actually holds it: a surface a
 * choice is made on, a control over the album, or neither. One reader for all
 * three options, because a reader chosen per option can only ever confirm what
 * the option already claims.
 */
const partyRead: Reader = (root, win) => {
  const album = albumFacts(root);
  const surface = root.querySelector<HTMLElement>("[data-de-arrival]");
  const cards = root.querySelectorAll("[data-de-party]").length;
  if (surface) {
    const h = Math.round(surface.getBoundingClientRect().height);
    return cards > 0
      ? `Measured: ${cards} parties to choose from, on ${h} px of surface, ${pct(h, win)} percent of the screen.`
      : `Measured: one party, named on ${h} px of surface, ${pct(h, win)} percent of the screen.`;
  }
  const strip = root.querySelector<HTMLElement>("[data-de-switch]");
  if (strip) {
    const h = Math.round(strip.getBoundingClientRect().height);
    return `Measured: the switcher takes ${h} px above the album; ${album}.`;
  }
  return album ? `Measured: nothing to choose; ${album}.` : null;
};

/**
 * The way out: what the demo offers, and how far DOWN THE PAGE it is.
 *
 * ★ MEASURED AGAINST THE DOCUMENT, NOT THE VIEWPORT. The closing card is drawn
 * with the page scrolled to its foot, because an option nobody can see is an
 * option nobody can judge; measuring it against the viewport would then report
 * it as being on the first screen, which is the opposite of its cost. So the
 * distance is read inside the page's own scroll box, and said in screens.
 */
const nextRead: Reader = (root, win) => {
  const slot = root.querySelector<HTMLElement>("[data-de-slot]");
  const close = root.querySelector<HTMLElement>("[data-de-close]");
  const target = close ?? (slot?.textContent?.trim() ? slot : null);
  if (!target) {
    const header = root.querySelector<HTMLElement>("[data-de-header] button");
    const w = header ? Math.round(header.getBoundingClientRect().width) : 0;
    return `Measured: nothing but the header's ${w} px button, and the action row draws an empty half.`;
  }
  const page = root.querySelector<HTMLElement>("[data-de-scroll]");
  if (!page) return null;
  const box = target.getBoundingClientRect();
  const down = Math.round(
    box.top - page.getBoundingClientRect().top + page.scrollTop,
  );
  const screens = (down / win.innerHeight).toFixed(1);
  const size = `${Math.round(box.width)} by ${Math.round(box.height)} px`;
  return `Measured: ${size}, ${down} px down the page, ${screens} screens of scrolling from the top.`;
};

/**
 * What the door spends, and what it spends it on. A door can promise in two
 * currencies and the answers use different ones: `named` buys words, `pile`
 * buys photographs, and a measurement that counted only words would report the
 * pile as saying nothing, which is the opposite of its claim.
 */
const doorRead: Reader = (root) => {
  const door = root.querySelector<HTMLElement>("[data-de-door]");
  if (!door) return null;
  const box = door.getBoundingClientRect();
  const size = `${Math.round(box.width)} by ${Math.round(box.height)} px`;
  const words =
    root
      .querySelector<HTMLElement>("[data-de-promise]")
      ?.textContent?.trim()
      .split(/\s+/).length ?? 0;
  const shots = door.querySelectorAll("img").length;
  const says = [
    words > 0 ? `${words} words` : null,
    shots > 0 ? `${shots} photographs of it` : null,
  ].filter(Boolean);
  return says.length > 0
    ? `Measured: the door is ${size}, and promises with ${says.join(" and ")}.`
    : `Measured: the door is ${size}, and says nothing about what is behind it.`;
};

/** The two screens: what each one is showing, and whether they agree. */
const scanRead: Reader = (root) => {
  const album = albumFacts(root);
  const line = root.querySelector<HTMLElement>("[data-de-scan]");
  if (!line)
    return album
      ? `Measured: ${album}, and nothing on this screen knows the other exists.`
      : null;
  const h = Math.round(line.getBoundingClientRect().height);
  return `Measured: ${h} px of this screen spent on the other one; ${album}.`;
};

/* ── the frame ───────────────────────────────────────────────────────────── */

function Screen({
  id,
  screen,
  caption,
  read,
  children,
}: {
  id: string;
  screen: ScreenId;
  caption: string;
  read: Reader;
  children: ReactNode;
}) {
  const [said, setSaid] = useState<string | null>(null);
  const { w, h, name } = SCREENS[screen];
  return (
    <Frame
      id={`de-${id}-${screen}`}
      w={w}
      h={h}
      title={`${w} x ${h}, ${name}`}
      caption={said ? `${caption} ${said}` : caption}
    >
      <Probe read={read} onRead={setSaid}>
        {children}
      </Probe>
    </Frame>
  );
}

const screenFor = (s: BoardState): ScreenId => screenOf(s.screen);

/* ── 1. the first seconds ────────────────────────────────────────────────── */

const ARRIVAL_CAPTION: Record<ArrivalShape, string> = {
  album:
    "Today. Somebody's wedding, and a grey line above the name doing all the explaining.",
  welcome:
    "The guest's own invitation, which the demo is the one visitor to skip.",
  role: "The demo's own screen: whose party, where you are standing, what to try.",
};

function arrivalScreen(shape: ArrivalShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`arrival-${shape}`}
      screen={screen}
      read={arrivalRead}
      caption={ARRIVAL_CAPTION[shape]}
    >
      <DemoPage
        say={TODAY.say}
        slot={TODAY.slot}
        dim={shape !== "album"}
        overlay={<Arrival shape={shape} screen={screen} />}
      />
    </Screen>
  );
}

/* ── 2. saying it is a demo ──────────────────────────────────────────────── */

/**
 * ★ SCROLLED, BECAUSE THAT IS WHERE THE QUESTION LIVES. All three options are
 * identical at the top of the page; the difference is what survives the first
 * flick. The page is a real scroll container and this is its real scrollTop.
 */
const SCROLLED = 460;

const FRAMING_CAPTION: Record<string, string> = {
  banner:
    "Today, 460 px down: the line went with the header and the album is unlabelled.",
  tag: "The header holds, so the mark is on this screen and every screen after it.",
  rail: "A second bar at the foot, in a thumb's reach, for the whole scroll.",
};

function framingScreen(shape: "banner" | "tag" | "rail", s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`framing-${shape}`}
      screen={screen}
      read={sayingRead}
      caption={FRAMING_CAPTION[shape]}
    >
      {/* The arrival answer is worn, in the only way it honestly can be down
          here: a visitor who met a door has already been told once, so the
          page reminds instead of explaining (page-parts.tsx, `told`). The
          surface itself is gone, because a scrolled page is a page it was
          dismissed on. */}
      <DemoPage
        say={shape}
        slot={TODAY.slot}
        told={arrivalOf(s.arrival) !== "album"}
        scrollTo={SCROLLED}
      />
    </Screen>
  );
}

/* ── 3. adding a photo ───────────────────────────────────────────────────── */

/**
 * ★ THE GREEN CHECK IS GONE BY NOW, AND THE WORDS SAY SO. The shipped
 * optimistic tile wears a `--success` check for about 2.5 seconds; this is a
 * beat after that, which is the moment the question is about. So the captions
 * name WHERE the photograph is (the album is newest first, so it is the
 * top-left tile) rather than claiming a badge the picture does not hold.
 */
const TRY_CAPTION: Record<string, string> = {
  quiet:
    "Today. The photograph they added is the top-left tile, and the demo moves on.",
  turn: "The same tile, and one card over it turning the proof into an offer.",
  look: "No Add at all: the album is the demonstration and the page says so.",
};

/** A beat after the upload: the album's top, where the new tile is. */
const AFTER_UPLOAD = 250;

function tryScreen(shape: "quiet" | "turn" | "look", s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`try-${shape}`}
      screen={screen}
      read={albumRead}
      caption={TRY_CAPTION[shape]}
    >
      <DemoPage
        say={TODAY.say}
        slot={TODAY.slot}
        upload={shape !== "look"}
        added={shape !== "look"}
        scrollTo={AFTER_UPLOAD}
        aboveAlbum={shape === "turn" ? <TurnCard /> : undefined}
      />
    </Screen>
  );
}

/* ── 4. the way out ──────────────────────────────────────────────────────── */

const NEXT_CAPTION: Record<string, string> = {
  header:
    "Today. The same quiet CTA a guest at a real party gets, and an empty half-row.",
  slot: "The hole filled, in the first screen, beside the code they would print.",
  foot: "The last thing after the whole album, where a real event puts its reel.",
};

function nextScreen(shape: "header" | "slot" | "foot", s: BoardState) {
  const screen = screenFor(s);
  const turn = s.try === "turn";
  const look = s.try === "look";
  // ★ THE COLLISION THE STAGING EXISTS TO SHOW. Reading the captures caught it:
  // with the turn picked, `slot` puts two buttons reading "Start your own" a
  // hundred pixels apart, which is the cost of taking both and is the thing a
  // wiring round would have to resolve. The picture shows it; the caption says
  // it, so it is not something he has to notice.
  const doubled = shape === "slot" && turn;
  return (
    <Screen
      id={`next-${shape}`}
      screen={screen}
      read={nextRead}
      caption={
        doubled
          ? `${NEXT_CAPTION[shape]} With the turn picked too, two buttons say the same thing a hundred pixels apart.`
          : NEXT_CAPTION[shape]
      }
    >
      {/* The try answer is worn: a demo that already turns at the upload is a
          demo with one conversion moment in it, and this asks where the
          STANDING one sits. The closing card is drawn at the foot of the page
          because an option nobody can see is an option nobody can judge; what
          it costs to reach is in the caption's number, not in the picture. */}
      <DemoPage
        say={TODAY.say}
        slot={shape === "slot" ? "own" : "empty"}
        upload={!look}
        added={!look}
        scrollTo={shape === "foot" ? 99999 : 0}
        aboveAlbum={turn ? <TurnCard /> : undefined}
        underAlbum={shape === "foot" ? <ClosingCard party={DEMO} /> : undefined}
      />
    </Screen>
  );
}

/* ── 5. what a door promises ─────────────────────────────────────────────── */

/**
 * ★ PLACE-AWARE, BECAUSE THE FOOTER IS ALREADY HALF THE ANSWER. `pile` is not
 * a new object: it is the footer's, made the rule everywhere else, so at the
 * footer `quiet` and `pile` are the same picture and only `named` moves. A
 * caption that said "today says nothing" there would be false, since the
 * footer's own copy already says "a real event album" without saying which.
 */
const DOOR_CAPTION: Record<PlaceId, Record<DoorShape, string>> = {
  hero: {
    quiet: "Today. The object, and no idea what is on the other side of it.",
    named: "One line of words: which party, how full, before anyone clicks.",
    pile: "The footer's pile made the rule, so the door is the album it opens.",
  },
  footer: {
    quiet:
      "Today, and the one door that half-promises: a real event album, never which one.",
    named: "The same pile, and the party it opens said out loud under it.",
    pile: "Already the answer here: this object is what the other three become.",
  },
  line: {
    quiet: "Today. Six words, a chevron, and nothing about what opens.",
    named: "The same line with the party under it, where copy already runs.",
    pile: "The pile at the size a paragraph can carry: three photographs.",
  },
};

function doorScreen(shape: DoorShape, s: BoardState) {
  const screen = screenFor(s);
  const place = placeOf(s.place);
  return (
    <Screen
      id={`doors-${shape}-${place}`}
      screen={screen}
      read={doorRead}
      caption={DOOR_CAPTION[place][shape]}
    >
      <Door shape={shape} place={place} screen={screen} />
    </Screen>
  );
}

/* ── 6. scanned off a laptop ─────────────────────────────────────────────── */

/**
 * ★ SIDE-AWARE, BECAUSE THE TWO SCREENS ARE NOT THE SAME QUESTION. On the
 * phone all three options are a page with or without a line over the album;
 * the half that separates `pair` from the other two is the LAPTOP, where a
 * photograph either arrives or does not. The caption says which screen is on
 * the stage and points at the knob when the other one is the answer.
 */
const PHONE_CAPTION: Record<string, Record<"hand" | "laptop", string>> = {
  same: {
    hand: "Today. The same page in a hand, and a laptop that never finds out.",
    laptop: "Today, on the laptop: the album it was showing, unchanged.",
  },
  scanned: {
    hand: "One line naming the thing they just did, above the album it landed in.",
    laptop: "The laptop is unchanged here too: only the phone was told anything.",
  },
  pair: {
    hand: "It crossed. Flip the knob to the laptop: that screen is the answer.",
    laptop:
      "The photograph arrived from the phone, top left, under a glow that fades.",
  },
};

function phoneScreen(shape: "same" | "scanned" | "pair", s: BoardState) {
  const laptop = s.side === "laptop";
  const screen: ScreenId = laptop ? "1440" : "375";
  const line =
    shape === "scanned" && !laptop ? (
      <ScannedLine />
    ) : shape === "pair" ? (
      laptop ? (
        <PairedLaptopLine />
      ) : (
        <PairedPhoneLine />
      )
    ) : undefined;
  return (
    <Screen
      id={`phone-${shape}-${laptop ? "laptop" : "hand"}`}
      screen={screen}
      read={scanRead}
      caption={PHONE_CAPTION[shape][laptop ? "laptop" : "hand"]}
    >
      {/* The laptop's album gains the phone's photograph only under `pair`;
          under the other two it is the album the visitor left, unchanged. */}
      <DemoPage
        say={TODAY.say}
        slot={TODAY.slot}
        added={!laptop || shape === "pair"}
        landing={laptop && shape === "pair"}
        scrollTo={AFTER_UPLOAD}
        aboveAlbum={line}
      />
    </Screen>
  );
}

/* ── 7. how many parties ─────────────────────────────────────────────────── */

const EVENT_CAPTION: Record<string, string> = {
  one: "One party, whatever the arrival turns out to be: nothing to choose.",
  pick: "Three albums to shoot, three rows to keep pristine, one choice to make.",
  switch: "No door: the choice sits over the album and re-fills it in place.",
};

function eventScreen(shape: "one" | "pick" | "switch", s: BoardState) {
  const screen = screenFor(s);
  const party = partyOf(s.party);
  const arrival = arrivalOf(s.arrival);
  // The arrival this decision waits on. `pick` needs a surface for its three
  // cards; with today's answer (no arrival at all) it has to bring one, which
  // IS the cost of the option and is drawn rather than described.
  const standing = shape === "pick" || (shape === "one" && arrival !== "album");
  const surface =
    shape === "pick" ? (
      <Shell screen={screen} tall wide>
        <PartyDoor chosen={party} screen={screen} />
      </Shell>
    ) : shape === "one" ? (
      <Arrival shape={arrival} screen={screen} party={PARTIES.wedding} />
    ) : undefined;
  return (
    <Screen
      id={`event-${shape}`}
      screen={screen}
      read={partyRead}
      caption={EVENT_CAPTION[shape]}
    >
      <DemoPage
        party={PARTIES[shape === "one" ? "wedding" : party]}
        say={TODAY.say}
        slot={TODAY.slot}
        dim={standing}
        aboveAlbum={
          shape === "switch" ? <PartySwitch chosen={party} /> : undefined
        }
        overlay={surface}
      />
    </Screen>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof DEMO_EVENT> = {
  "arrival.album": (s) => arrivalScreen("album", s),
  "arrival.welcome": (s) => arrivalScreen("welcome", s),
  "arrival.role": (s) => arrivalScreen("role", s),

  "framing.banner": (s) => framingScreen("banner", s),
  "framing.tag": (s) => framingScreen("tag", s),
  "framing.rail": (s) => framingScreen("rail", s),

  "try.quiet": (s) => tryScreen("quiet", s),
  "try.turn": (s) => tryScreen("turn", s),
  "try.look": (s) => tryScreen("look", s),

  "next.header": (s) => nextScreen("header", s),
  "next.slot": (s) => nextScreen("slot", s),
  "next.foot": (s) => nextScreen("foot", s),

  "doors.quiet": (s) => doorScreen("quiet", s),
  "doors.named": (s) => doorScreen("named", s),
  "doors.pile": (s) => doorScreen("pile", s),

  "phone.same": (s) => phoneScreen("same", s),
  "phone.scanned": (s) => phoneScreen("scanned", s),
  "phone.pair": (s) => phoneScreen("pair", s),

  "event.one": (s) => eventScreen("one", s),
  "event.pick": (s) => eventScreen("pick", s),
  "event.switch": (s) => eventScreen("switch", s),
};

export function DemoEventBoard() {
  return <ExplorationBoard spec={DEMO_EVENT} previews={PREVIEWS} />;
}

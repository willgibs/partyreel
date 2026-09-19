"use client";

import "./guest-shape.css";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  AccountMoment,
  type AccountShape,
  momentOf,
  type Shell,
} from "./account";
import {
  DialogOverlay,
  dialogOf,
  type DialogShape,
  InlinePanel,
  whichOf,
} from "./dialogs";
import { Door, type DoorShape, doorScreens, fixtureOf } from "./door";
import {
  type ChromeShape,
  chromeOf,
  GuestPage,
  type LiveShape,
  type NothingShape,
  SCREENS,
  type ScreenId,
  screenOf,
} from "./page-parts";
import { GUEST_SHAPE } from "./spec";
import { MineStrip, UploadPromise, type YoursShape, Yours } from "./yours";

/**
 * ★ THE GROUND IS TODAY'S PRODUCT, NOT THE BOARD'S OWN RECOMMENDATIONS. Every
 * picture is the shipped page with ONE thing changed, so a decision never
 * quietly arrives wearing the answer to a question he has not been asked: the
 * album's chrome stays the shipped column, an empty screen stays the shipped
 * two languages, and the album stays silent. The exceptions are the two
 * staged pairs, where wearing the earlier answer is the whole point of the
 * staging: `live` is judged on the chrome he picked, and the account voices on
 * the surface the other dialogs were given.
 */
const TODAY = { chrome: "column", nothing: "two", live: "none" } as const;

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the guest page at a real
 * screen, phone first.
 *
 * ★ EVERY PREVIEW IS A FUNCTION OF THE BOARD'S STATE. The screen is a knob all
 * seven decisions share and every picture reads it; a decision staged behind
 * another is drawn WEARING that answer, so the live signal is judged on the
 * chrome he picked and the account voices on the surface the dialogs decision
 * gave them. The earlier decisions read the later answers too, so going back
 * redraws them in the world he chose rather than the one the board assumed.
 *
 * ★ THE NUMBERS UNDER EVERY FRAME ARE MEASURED, NEVER COMPUTED. A board once
 * drew an option with its formula's sign backwards and the tile Will judged
 * showed the opposite of its words (docs/PROGRAM.md). So each caption reads the
 * laid-out DOM inside the frame's own document once it settles: how tall the
 * surface really stands, how many columns the album really fell into, how far
 * a guest really scrolls before the actions leave. If the words above a frame
 * and the caption under it disagree, the caption is the truth.
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
 * is `visibility: hidden`, which keeps its layout, so it measures true as well.
 * The late pass covers the one thing an observer cannot see: photographs
 * decoding at their natural heights inside columns that never changed width.
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
    const late = win.setTimeout(run, 1400);
    return () => {
      ro.disconnect();
      win.clearTimeout(late);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

const pct = (h: number, win: Window) =>
  Math.round((h / win.innerHeight) * 100);

/** How tall the surface standing over the page really is. */
const surfaceRead: Reader = (root, win) => {
  const el = root.querySelector<HTMLElement>(
    "[data-gs-door], .gs-sheet, .gs-dialog",
  );
  if (!el) return null;
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
  return `${lefts.size} columns of ${w} px`;
}

/**
 * Where the photographs begin under the chrome, the album's own shape, and how
 * far a guest scrolls before the actions leave the screen (which is where the
 * floating pill takes over, and the whole reason the dock option exists).
 */
const chromeRead: Reader = (root, win) => {
  const tile = root.querySelector<HTMLElement>("[data-media-tile]");
  const album = albumFacts(root);
  if (!tile || !album) return null;
  const top = Math.round(tile.getBoundingClientRect().top);
  const actions = root.querySelector<HTMLElement>("[data-gs-actions]");
  const box = actions?.getBoundingClientRect();
  const leaves =
    box && box.top < win.innerHeight && box.bottom < win.innerHeight
      ? `, and the actions leave the screen ${Math.round(box.bottom)} px down`
      : ", and the actions never leave the screen";
  return `Measured: the first photograph starts ${top} px down, ${album}${leaves}.`;
};

/** The album alone, for the decision that only changes what is in it. */
const albumRead: Reader = (root) => {
  const album = albumFacts(root);
  const n = root.querySelectorAll("[data-media-tile]").length;
  return album ? `Measured: ${n} photographs, ${album}.` : null;
};

/** How much screen the picture under "nothing here yet" takes. */
const nothingRead: Reader = (root, win) => {
  const el = root.querySelector<HTMLElement>("[data-gs-nothing]");
  if (!el) return null;
  const h = Math.round(el.getBoundingClientRect().height);
  if (h < 8) return null;
  return `Measured: ${h} px of screen, ${pct(h, win)} percent of it.`;
};

/** The viewer's pill, or the strip that replaces it. */
const pillRead: Reader = (root) => {
  const pill = root.querySelector<HTMLElement>("[data-gs-pill]");
  if (pill) {
    const n = pill.querySelectorAll("button").length;
    const w = Math.round(pill.getBoundingClientRect().width);
    return `Measured: ${n} actions in the pill, ${w} px wide.`;
  }
  const strip = root.querySelector<HTMLElement>("[data-gs-mine]");
  if (!strip) return null;
  const n = strip.querySelectorAll("[data-media-tile], button[aria-label]")
    .length;
  return `Measured: no viewer at all; ${Math.round(strip.getBoundingClientRect().height)} px of album given to the strip, ${n} controls in it.`;
};

/** What the page gives up to a panel that opens inside it. */
const inlineRead: Reader = (root, win) => {
  const panel = root.querySelector<HTMLElement>("[data-gs-inline]");
  if (!panel) return null;
  const h = Math.round(panel.getBoundingClientRect().height);
  return `Measured: ${h} px in the page, ${pct(h, win)} percent of the screen, and nothing dimmed.`;
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
      id={`gs-${id}-${screen}`}
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

/* ── 1. the door ─────────────────────────────────────────────────────────── */

const DOOR_CAPTION: Record<DoorShape, string> = {
  today:
    "Today. The welcome, with the gate on the screen behind it; the shell changes type at 640.",
  one: "One screen: the gate carries the invitation's two promises.",
  page: "No sheet at any width. The arrival is the screen itself.",
};

function doorScreen(shape: DoorShape, s: BoardState) {
  const screen = screenFor(s);
  const fixture = fixtureOf(s.event);
  const n = doorScreens(shape, fixture);
  return (
    <Screen
      id={`door-${shape}`}
      screen={screen}
      read={surfaceRead}
      caption={`${DOOR_CAPTION[shape]} ${n} screen${n === 1 ? "" : "s"} between the scan and the album.`}
    >
      <GuestPage
        screen={screen}
        fixture={fixture}
        chrome={TODAY.chrome}
        nothing={TODAY.nothing}
        dim={shape !== "page"}
        overlay={<Door shape={shape} screen={screen} fixture={fixture} />}
      />
    </Screen>
  );
}

/* ── 2. nothing here yet ─────────────────────────────────────────────────── */

const NOTHING_CAPTION: Record<NothingShape, string> = {
  two: "Two pictures made one family: the squares hold the lock, the river holds the album.",
  river:
    "One picture at two depths, the album's own river turned down behind the lock.",
  words: "No picture: the words carry it on the page's own paper.",
};

function nothingScreen(shape: NothingShape, s: BoardState) {
  const screen = screenFor(s);
  const locked = s.side !== "empty";
  return (
    <Screen
      id={`nothing-${shape}`}
      screen={screen}
      read={nothingRead}
      caption={NOTHING_CAPTION[shape]}
    >
      <GuestPage
        screen={screen}
        fixture={locked ? "password" : "empty"}
        chrome={TODAY.chrome}
        nothing={shape}
      />
    </Screen>
  );
}

/* ── 3. the album's chrome ───────────────────────────────────────────────── */

const CHROME_CAPTION: Record<ChromeShape, string> = {
  column:
    "Today. Two objects carry one act: this Add, and the pill that replaces it once it scrolls off.",
  bar: "The event on the left, the three actions at the album's right edge.",
  dock: "The top of the page is the event alone; the actions never leave the foot.",
};

function chromeScreen(shape: ChromeShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`chrome-${shape}`}
      screen={screen}
      read={chromeRead}
      caption={CHROME_CAPTION[shape]}
    >
      {/* The live signal is the NEXT question, so every chrome option wears
          today's answer to it and the axis stays one. */}
      <GuestPage
        screen={screen}
        fixture="open"
        chrome={shape}
        nothing={TODAY.nothing}
        live={TODAY.live}
      />
    </Screen>
  );
}

/* ── 4. the album filling ────────────────────────────────────────────────── */

const LIVE_CAPTION: Record<LiveShape, string> = {
  none: "Today. A photograph landed a second ago and nothing on the page says so.",
  line: "The count line admits it: a quiet dot, and how recently one landed.",
  land: "The photograph itself: the newest tile grows into its column and the album re-flows.",
};

function liveScreen(shape: LiveShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`live-${shape}`}
      screen={screen}
      read={albumRead}
      caption={LIVE_CAPTION[shape]}
    >
      {/* The one place the chrome answer is worn: where a live signal can sit
          is a different question once the header stopped carrying the actions. */}
      <GuestPage
        screen={screen}
        fixture="open"
        chrome={chromeOf(s.chrome)}
        nothing={TODAY.nothing}
        live={shape}
      />
    </Screen>
  );
}

/* ── 5. the other surfaces ───────────────────────────────────────────────── */

const DIALOG_CAPTION: Record<DialogShape, string> = {
  today: "Today. A laptop's float, dropped into the middle of a phone.",
  sheet: "The door's sheet, promoted: the foot of the phone, and a real handle.",
  inline: "No overlay: it opens where the button was, and the album stays put.",
};

function dialogScreen(shape: DialogShape, s: BoardState) {
  const screen = screenFor(s);
  const which = whichOf(s.which);
  return (
    <Screen
      id={`dialogs-${shape}`}
      screen={screen}
      read={shape === "inline" ? inlineRead : surfaceRead}
      caption={DIALOG_CAPTION[shape]}
    >
      <GuestPage
        screen={screen}
        fixture="open"
        chrome={TODAY.chrome}
        nothing={TODAY.nothing}
        underActions={
          shape === "inline" ? (
            <div data-gs-inline>
              <InlinePanel which={which} />
            </div>
          ) : undefined
        }
        dim={shape !== "inline"}
        overlay={
          shape === "inline" ? undefined : (
            <DialogOverlay shape={shape} screen={screen} which={which} />
          )
        }
      />
    </Screen>
  );
}

/* ── 6. a guest's own photograph ─────────────────────────────────────────── */

const YOURS_CAPTION: Record<YoursShape, string> = {
  never:
    "The terms are said at the act, and the viewer keeps the three actions it has.",
  window:
    "A Remove joins the pill on your own photograph, and the caption says how long is left.",
  mine: "Everything this device added, in one strip at the top of the album.",
};

function yoursScreen(shape: YoursShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`yours-${shape}`}
      screen={screen}
      read={pillRead}
      caption={YOURS_CAPTION[shape]}
    >
      <GuestPage
        screen={screen}
        fixture="open"
        chrome={TODAY.chrome}
        nothing={TODAY.nothing}
        underActions={shape === "never" ? <UploadPromise /> : undefined}
        aboveAlbum={shape === "mine" ? <MineStrip screen={screen} /> : undefined}
        dim={shape !== "mine"}
        overlay={<Yours shape={shape} screen={screen} />}
      />
    </Screen>
  );
}

/* ── 7. asking for an account ────────────────────────────────────────────── */

const ACCOUNT_CAPTION: Record<AccountShape, string> = {
  two: "Today. An invitation on the way in, and a sign-up form inside the album.",
  one: "One framing and one first field; the reason line is all that moves.",
  after:
    "Asked once at the door, so keeping the album is an offer rather than a second form.",
};

function accountScreen(shape: AccountShape, s: BoardState) {
  const screen = screenFor(s);
  const moment = momentOf(s.moment);
  // The surface this decision waits on: today's dialogs keep the centred
  // float; the sheet (and the inline option, which a gate cannot take) put the
  // two moments on the door's own shell.
  const shell: Shell = dialogOf(s.dialogs) === "today" ? "dialog" : "sheet";
  return (
    <Screen
      id={`account-${shape}`}
      screen={screen}
      read={surfaceRead}
      caption={ACCOUNT_CAPTION[shape]}
    >
      <GuestPage
        screen={screen}
        fixture={moment === "gate" ? "account" : "open"}
        chrome={TODAY.chrome}
        nothing={TODAY.nothing}
        live={TODAY.live}
        dim
        overlay={
          <AccountMoment
            shape={shape}
            moment={moment}
            screen={screen}
            shell={shell}
          />
        }
      />
    </Screen>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof GUEST_SHAPE> = {
  "door.today": (s) => doorScreen("today", s),
  "door.one": (s) => doorScreen("one", s),
  "door.page": (s) => doorScreen("page", s),

  "nothing.two": (s) => nothingScreen("two", s),
  "nothing.river": (s) => nothingScreen("river", s),
  "nothing.words": (s) => nothingScreen("words", s),

  "chrome.column": (s) => chromeScreen("column", s),
  "chrome.bar": (s) => chromeScreen("bar", s),
  "chrome.dock": (s) => chromeScreen("dock", s),

  "live.none": (s) => liveScreen("none", s),
  "live.line": (s) => liveScreen("line", s),
  "live.land": (s) => liveScreen("land", s),

  "dialogs.today": (s) => dialogScreen("today", s),
  "dialogs.sheet": (s) => dialogScreen("sheet", s),
  "dialogs.inline": (s) => dialogScreen("inline", s),

  "yours.never": (s) => yoursScreen("never", s),
  "yours.window": (s) => yoursScreen("window", s),
  "yours.mine": (s) => yoursScreen("mine", s),

  "account.two": (s) => accountScreen("two", s),
  "account.one": (s) => accountScreen("one", s),
  "account.after": (s) => accountScreen("after", s),
};

export function GuestShapeBoard() {
  return <ExplorationBoard spec={GUEST_SHAPE} previews={PREVIEWS} />;
}

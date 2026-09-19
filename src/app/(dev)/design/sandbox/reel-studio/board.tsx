"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { STYLES } from "./fixtures";
import {
  blockedOf,
  type BlockedShape,
  MomentGrid,
  PICKER_NOTE,
  PoolHead,
  RoomToast,
  StyleRail,
  StyleThree,
  StyleWall,
} from "./pickers";
import {
  Dock,
  lookOf,
  Room,
  roomMeta,
  roomOf,
  type RoomShape,
  SCREENS,
  type ScreenId,
  screenOf,
  sharedOf,
  TODAY_ROOM,
} from "./room";
import { useStills } from "./stills";
import { REEL_STUDIO } from "./spec";
import {
  Cinema,
  type DoorShape,
  EventPage,
  EventReelSection,
  FrameProgress,
  GuestAlbum,
  GuestReelBlock,
  type GuestShape,
  momentOf,
  QuietLine,
  StitchingDialog,
  StopSharingPanel,
  UndoToast,
} from "./surfaces";

/**
 * THE PREVIEWS, AND NOTHING ELSE: the Studio and the two surfaces beside it, at
 * a real 1440 by 900 and a real 375 by 812, over one wedding.
 *
 * ★ THE GROUND IS TODAY'S PRODUCT, EXCEPT WHERE A DECISION IS STAGED. Every
 * picture is the shipped surface with ONE thing changed, so a decision never
 * arrives quietly wearing the answer to a question he has not been asked: the
 * door, sharing and the guest's album are drawn in TODAY's room, and only the
 * three decisions staged behind `room` (the looks, the moments, the wait) wear
 * the room he picked. That is what the staging is for, and it is why `styles`
 * has an overrule about the workbench: its answer really does change.
 *
 * ★ THE NUMBERS UNDER EVERY FRAME ARE MEASURED, NEVER COMPUTED (docs/PROGRAM.md:
 * a board once drew an option with its formula's sign backwards and the tile
 * Will judged showed the opposite of its words). Each caption reads the laid
 * out DOM inside the frame's own document once it settles: how big the reel
 * really is, what really covers it, how many of fourteen looks and thirty
 * photographs are really reachable without a scroll. If the words above a frame
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
 * again whenever a new option re-flows. A hidden option on the stage is
 * `visibility: hidden`, which keeps its layout, so it measures true as well.
 * The late passes cover what an observer cannot see: photographs decoding at
 * their natural heights in columns that never changed width, and the engine's
 * fifteen stills landing after the first paint.
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
    const late = [900, 1800, 3200].map((ms) => win.setTimeout(run, ms));
    return () => {
      ro.disconnect();
      late.forEach((t) => win.clearTimeout(t));
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

type Box = { left: number; top: number; right: number; bottom: number };

const pct = (n: number, of: number) =>
  of <= 0 ? 0 : Math.round((n / of) * 100);

const viewport = (win: Window): Box => ({
  left: 0,
  top: 0,
  right: win.innerWidth,
  bottom: win.innerHeight,
});

const clipTo = (a: Box, b: Box): Box => ({
  left: Math.max(a.left, b.left),
  top: Math.max(a.top, b.top),
  right: Math.min(a.right, b.right),
  bottom: Math.min(a.bottom, b.bottom),
});

const areaOf = (b: Box) =>
  Math.max(0, b.right - b.left) * Math.max(0, b.bottom - b.top);

/** How many of these boxes are drawn whole, inside the viewport and any clip. */
function countWhole(
  els: NodeListOf<HTMLElement>,
  win: Window,
  clip?: Box | null,
): number {
  const view = clip ? clipTo(viewport(win), clip) : viewport(win);
  let n = 0;
  els.forEach((el) => {
    const b = el.getBoundingClientRect();
    if (b.width < 2 || b.height < 2) return;
    if (areaOf(clipTo(b, view)) >= b.width * b.height * 0.9) n += 1;
  });
  return n;
}

const boxOf = (el: Element | null): Box | null => {
  if (!el) return null;
  const b = el.getBoundingClientRect();
  return { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
};

/** The type size a sentence really renders at, in CSS pixels. */
const sizeOf = (el: Element | null, win: Window): number | null =>
  el ? Math.round(parseFloat(win.getComputedStyle(el).fontSize)) : null;

/** The reel's own box, what covers it, and what it costs the screen. */
function reelFacts(root: HTMLElement, win: Window) {
  const reel = root.querySelector<HTMLElement>("[data-rs-reel]");
  if (!reel) return null;
  const b = reel.getBoundingClientRect();
  if (b.height < 8) return null;
  const box: Box = {
    left: b.left,
    top: b.top,
    right: b.right,
    bottom: b.bottom,
  };
  const over = [
    ...root.querySelectorAll<HTMLElement>(
      "[data-rs-sheet],[data-rs-wait],[data-rs-toast]",
    ),
  ];
  const covered = over.reduce((sum, el) => {
    const o = boxOf(el);
    return o ? sum + areaOf(clipTo(box, o)) : sum;
  }, 0);
  return {
    w: Math.round(b.width),
    h: Math.round(b.height),
    share: pct(b.width * b.height, win.innerWidth * win.innerHeight),
    covered: Math.min(100, pct(covered, b.width * b.height)),
  };
}

/** Whichever surface is holding the work: a sheet, a column, or the foot band. */
const workBox = (root: HTMLElement): Box | null =>
  boxOf(
    root.querySelector("[data-rs-sheet]") ??
      root.querySelector("[data-rs-side]") ??
      root.querySelector("[data-rs-foot]"),
  );

/* the readers, one per decision */

const doorRead: Reader = (root, win) => {
  const door = root.querySelector<HTMLElement>("[data-rs-door]");
  const poster = root.querySelector<HTMLElement>("[data-rs-poster]");
  const reel = root.querySelector<HTMLElement>("[data-rs-reel]");
  if (!door || !poster || !reel) return null;
  const d = door.getBoundingClientRect();
  if (d.height < 4) return null;
  const card = Math.round(poster.getBoundingClientRect().width);
  const inner = Math.round(reel.getBoundingClientRect().width);
  const words = d.height < 40 ? ` at ${sizeOf(door, win)} px type` : "";
  return `Measured: the door is ${Math.round(d.width)} by ${Math.round(d.height)} px${words}, on a ${card} px card around a ${inner} px reel.`;
};

const roomRead: Reader = (root, win) => {
  const f = reelFacts(root, win);
  if (!f) return null;
  const side = root.querySelector<HTMLElement>("[data-rs-side]");
  const beside = side
    ? `, beside a ${Math.round(side.getBoundingClientRect().width)} px column`
    : "";
  return `Measured: the reel is ${f.w} by ${f.h} px, ${f.share} percent of the screen${beside}, with ${f.covered} percent of it covered.`;
};

const stylesRead: Reader = (root, win) => {
  const f = reelFacts(root, win);
  const thumbs = root.querySelectorAll<HTMLElement>("[data-rs-thumb]");
  if (!f || thumbs.length === 0) return null;
  const first = thumbs[0].getBoundingClientRect();
  if (first.width < 2) return null;
  const work = workBox(root);
  const panel = work ? Math.round(work.bottom - work.top) : 0;
  const seen = countWhole(thumbs, win, work);
  return `Measured: ${seen} of ${STYLES.length} looks whole in a ${panel} px panel, each ${Math.round(first.width)} px wide, with ${f.covered} percent of the reel covered.`;
};

const poolRead: Reader = (root, win) => {
  const tiles = root.querySelectorAll<HTMLElement>("[data-rs-tile]");
  if (tiles.length === 0) return null;
  const tray = root.querySelector<HTMLElement>("[data-rs-tray-bar]");
  if (tray) {
    const first = tiles[0].getBoundingClientRect();
    return `Measured: ${countWhole(tiles, win)} of ${tiles.length} photographs whole at ${Math.round(first.width)} px, under a ${Math.round(tray.getBoundingClientRect().height)} px tray.`;
  }
  const f = reelFacts(root, win);
  const first = tiles[0].getBoundingClientRect();
  const work = workBox(root);
  const panel = work ? Math.round(work.bottom - work.top) : 0;
  const seen = countWhole(tiles, win, work);
  return `Measured: ${seen} of ${tiles.length} photographs whole in a ${panel} px panel, each ${Math.round(first.width)} px, with ${f ? f.covered : 0} percent of the reel covered.`;
};

const blockedRead: Reader = (root, win) => {
  const blocked = root.querySelectorAll<HTMLElement>(
    "[data-rs-tile][data-blocked]",
  );
  if (blocked.length === 0) return null;
  const seen = countWhole(blocked, win, workBox(root));
  const toast = root.querySelector<HTMLElement>("[data-rs-toast]");
  const said = root.querySelector<HTMLElement>("[data-rs-tile] [data-rs-said]");
  const titled = root.querySelector<HTMLElement>("[data-rs-tile][title]");
  const where = toast
    ? `the reason is a ${Math.round(toast.getBoundingClientRect().height)} px line at ${sizeOf(toast, win)} px that leaves`
    : said
      ? `the reason is on the photograph at ${sizeOf(said, win)} px`
      : titled
        ? "the reason is an attribute no finger can reach"
        : "nothing says why";
  return `Measured: ${seen} blocked tile${seen === 1 ? "" : "s"} in view, and ${where}.`;
};

const sharingRead: Reader = (root, win) => {
  const share = root.querySelector<HTMLElement>("[data-rs-share]");
  if (!share) return null;
  const word = (share.textContent ?? "").trim();
  const back = root.querySelector<HTMLElement>("[data-rs-wayback]");
  const said = root.querySelector<HTMLElement>("[data-rs-said]");
  if (!back)
    return `Measured: the control reads "${word}", and nothing on the screen offers a way back.`;
  const b = back.getBoundingClientRect();
  return `Measured: the control reads "${word}", and the way back is ${Math.round(b.width)} by ${Math.round(b.height)} px at ${sizeOf(said, win)} px type.`;
};

const waitRead: Reader = (root, win) => {
  const f = reelFacts(root, win);
  const wait = root.querySelector<HTMLElement>("[data-rs-wait]");
  if (!f || !wait) return null;
  const w = wait.getBoundingClientRect();
  const blocks = root.querySelector("[data-rs-scrim]") !== null;
  return `Measured: the wait takes ${pct(w.width * w.height, win.innerWidth * win.innerHeight)} percent of the screen${blocks ? " over a scrim" : ""}, and covers ${f.covered} percent of the reel.`;
};

const guestRead: Reader = (root, win) => {
  const cinema = root.querySelector<HTMLElement>("[data-rs-cinema]");
  const reel = root.querySelector<HTMLElement>("[data-rs-reel]");
  if (cinema) {
    const r = reel?.getBoundingClientRect();
    return `Measured: the cinema is the whole screen, and the reel inside it is ${r ? Math.round(r.width) : 0} by ${r ? Math.round(r.height) : 0} px.`;
  }
  const block = root.querySelector<HTMLElement>("[data-rs-card]");
  const tile = root.querySelector<HTMLElement>("[data-media-tile]");
  if (!block) return null;
  const b = block.getBoundingClientRect();
  if (b.height < 8) return null;
  const top = tile ? Math.round(tile.getBoundingClientRect().top) : 0;
  return `Measured: the reel block is ${Math.round(b.width)} by ${Math.round(b.height)} px, ${pct(b.width * b.height, win.innerWidth * win.innerHeight)} percent of the first screen; the photographs start ${top} px down.`;
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
      id={`rs-${id}-${screen}`}
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

/**
 * ★ THE PAGE IS REALLY SCROLLED, NEVER FAKED. One decision lives at the foot of
 * a long page, and a negative margin would be a lie about where a host is
 * standing. The frame's OWN window is scrolled, and it runs again as the
 * photographs decode and the column heights settle, because a scroll taken
 * before the page has a height lands nowhere.
 */
function useScrollTo(offset: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const run = () => {
      const top = el.getBoundingClientRect().top + win.scrollY - offset;
      win.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    };
    run();
    const timers = [200, 800, 1600, 2600].map((ms) => win.setTimeout(run, ms));
    return () => timers.forEach((t) => win.clearTimeout(t));
  }, [offset]);
  return ref;
}

/* ── 1. the door ─────────────────────────────────────────────────────────── */

const DOOR_CAPTION: Record<DoorShape, string> = {
  link: "Today. The only visible way into the room is a text link at the page's smallest size, beside the status chip.",
  button:
    "The same row, a real control. It reads as a control from across the desk and costs one more object over the poster.",
  poster:
    "The picture is the press, and the card hugs the reel instead of spreading to the column. The link stays for a keyboard.",
};

function DoorScreen({ shape, s }: { shape: DoorShape; s: BoardState }) {
  const screen = screenFor(s);
  const { hero } = useStills();
  return (
    <Screen
      id={`door-${shape}`}
      screen={screen}
      read={doorRead}
      caption={DOOR_CAPTION[shape]}
    >
      <EventPage>
        <EventReelSection
          door={shape}
          shared={sharedOf(s.shared)}
          still={hero}
          styleId="classic"
        />
      </EventPage>
    </Screen>
  );
}

/* ── 2. the room ─────────────────────────────────────────────────────────── */

const ROOM_CAPTION: Record<RoomShape, string> = {
  capped:
    "Today. The player's own 360 px cap, wherever the room is. The style sheet is open, over the reel it is restyling.",
  float:
    "The caps gone: the reel takes the room and the chrome floats over the black it was already standing on.",
  bench:
    "The laptop's room, split. The reel keeps its natural height and the open work stands beside it. In a hand it is today's room.",
};

function RoomScreen({ shape, s }: { shape: RoomShape; s: BoardState }) {
  const screen = screenFor(s);
  const look = lookOf(s.look);
  const { hero, byStyle } = useStills();
  const wall = <StyleWall stills={byStyle} active={look} />;
  return (
    <Screen
      id={`room-${shape}`}
      screen={screen}
      read={roomRead}
      caption={ROOM_CAPTION[shape]}
    >
      <Room
        screen={screen}
        shape={shape}
        still={byStyle.get(look) ?? hero}
        shared={sharedOf(s.shared)}
        meta={roomMeta(look)}
        tray="Style"
        // The same open work in all three, so what moves is the ROOM: today it
        // covers the reel, on a bench it stands beside it.
        sheet={{ label: "Style", body: wall }}
        side={{ label: "Style", body: wall }}
      />
    </Screen>
  );
}

/* ── 3. the looks ────────────────────────────────────────────────────────── */

/** The option ids of each decision, as the preview keys spell them. A decision
 *  nothing is staged behind needs no coercer: its shape arrives from its key. */
type StyleShape = "wall" | "rail" | "three";

const STYLE_CAPTION: Record<StyleShape, string> = {
  wall: "Today. Four columns of full-width frames, so the sheet's width decides how big a look is and how many fit.",
  rail: "One row at a fixed size, in a short panel. The reel stays uncovered above it and a look is big enough to read.",
  three:
    "Three at a size you can judge, and the other eleven behind one control. The shortest path to a good enough answer.",
};

function StylesScreen({ shape, s }: { shape: StyleShape; s: BoardState }) {
  const screen = screenFor(s);
  const look = lookOf(s.look);
  const { byStyle, hero } = useStills();
  const body =
    shape === "wall" ? (
      <StyleWall stills={byStyle} active={look} />
    ) : shape === "rail" ? (
      <StyleRail stills={byStyle} active={look} />
    ) : (
      <StyleThree stills={byStyle} active={look} />
    );
  return (
    <Screen
      id={`styles-${shape}`}
      screen={screen}
      read={stylesRead}
      caption={STYLE_CAPTION[shape]}
    >
      <Room
        screen={screen}
        shape={roomOf(s.room)}
        still={byStyle.get(look) ?? hero}
        shared={sharedOf(s.shared)}
        meta={roomMeta(look)}
        tray="Style"
        sheet={{ label: "Style", body }}
        side={{ label: "Style", body }}
      />
    </Screen>
  );
}

/* ── 4. the moments ──────────────────────────────────────────────────────── */

type MomentShape = "sheet" | "pool" | "tray";
const momentShapeOf = (v: string | undefined): MomentShape =>
  v === "pool" || v === "tray" ? v : "sheet";

const MOMENT_CAPTION: Record<MomentShape, string> = {
  sheet:
    "Today. The pool in a sheet at 70 percent of the room's height, over the reel it is re-cutting.",
  pool: "The pool takes a column on a workbench and a band at the foot anywhere else. The reel gives up height and nothing covers it.",
  tray: "Off the room entirely: the event page's own gallery, at album size, under a tray holding the cut and the way in.",
};

/**
 * The event page carrying the cut in a tray at its foot.
 *
 * Picking happens in the host's OWN gallery, at the ~240 px tiles Will ruled
 * for it, so the photographs are the size they are everywhere else in the
 * product. The tile's grammar is the picker's unchanged: the violet position
 * disc, the check, the eye mark and whatever a blocked tile says are all drawn
 * ON the photograph, so they read on a light ground exactly as they do in the
 * dark room.
 */
function TrayPage({
  still,
  blocked,
  screen,
}: {
  still: string | null;
  blocked: BlockedShape;
  screen: ScreenId;
}) {
  const gallery = useScrollTo(16);
  return (
    <div className="relative min-h-screen pb-20">
      <EventPage>
        <EventReelSection
          door="poster"
          shared
          still={still}
          styleId="classic"
        />
        <div ref={gallery} className="pt-2">
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Gallery
          </p>
          {/* The host gallery's own tile: Will ruled it runs to the window at
              about 240 px (2026-09-19), which is two columns in a hand. */}
          <MomentGrid
            grid="fluid"
            min={screen === "375" ? 150 : 220}
            blocked={blocked}
            limit={18}
          />
        </div>
      </EventPage>
      <div
        data-rs-tray-bar
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-2.5 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <p className="shrink-0 text-[11px] font-medium text-muted-foreground tabular-nums">
            7 moments
          </p>
          <div className="min-w-0 flex-1 [&_p]:hidden">
            <Dock note={null} />
          </div>
          <span className="flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--radius-action-sm)] bg-foreground px-3 text-[11px] font-medium text-background">
            Open studio
          </span>
        </div>
      </div>
    </div>
  );
}

function MomentsScreen({ shape, s }: { shape: MomentShape; s: BoardState }) {
  const screen = screenFor(s);
  const look = lookOf(s.look);
  const { byStyle, hero } = useStills();
  const still = byStyle.get(look) ?? hero;
  const blocked = blockedOf(s.blocked);
  if (shape === "tray") {
    return (
      <Screen
        id={`moments-${shape}`}
        screen={screen}
        read={poolRead}
        caption={MOMENT_CAPTION[shape]}
      >
        <TrayPage still={still} blocked={blocked} screen={screen} />
      </Screen>
    );
  }
  const pool = (
    <>
      <PoolHead count={7} />
      <MomentGrid
        grid={shape === "sheet" ? "today" : "fluid"}
        blocked={blocked}
      />
      <p className="mt-2.5 text-center text-[10px] text-white/40">
        {PICKER_NOTE}
      </p>
    </>
  );
  return (
    <Screen
      id={`moments-${shape}`}
      screen={screen}
      read={poolRead}
      caption={MOMENT_CAPTION[shape]}
    >
      <Room
        screen={screen}
        shape={roomOf(s.room)}
        still={still}
        shared={sharedOf(s.shared)}
        meta={roomMeta(look)}
        tray="Moments"
        sheet={
          shape === "sheet"
            ? { label: "Moments", tall: true, body: pool }
            : null
        }
        side={shape === "pool" ? { label: "Moments", body: pool } : null}
        // On a stacked room the pool is a band under the reel; the dock is its
        // first row, so the two jobs finally share one surface.
        foot={
          shape === "pool" &&
          !(roomOf(s.room) === "bench" && screen === "1440") ? (
            <>
              <Dock note={null} />
              <div className="mt-2">{pool}</div>
            </>
          ) : undefined
        }
        dock={
          !(
            shape === "pool" &&
            !(roomOf(s.room) === "bench" && screen === "1440")
          )
        }
      />
    </Screen>
  );
}

/* ── 5. a tile it cannot take ────────────────────────────────────────────── */

const BLOCKED_CAPTION: Record<BlockedShape, string> = {
  title:
    "Today. The tile is disabled and the sentence rides a native tooltip, which a touch screen never fires.",
  toast:
    "The tap is answered. A line says what happened and offers the fix, then leaves with it.",
  caption:
    "The photograph says it itself, before anyone taps, and Show is a control rather than an instruction.",
};

function BlockedScreen({ shape, s }: { shape: BlockedShape; s: BoardState }) {
  const screen = screenFor(s);
  const look = lookOf(s.look);
  const { byStyle, hero } = useStills();
  const picker = momentShapeOf(s.moments);
  const pool = (
    <>
      <PoolHead count={7} />
      <MomentGrid
        grid={picker === "sheet" ? "today" : "fluid"}
        blocked={shape}
        limit={20}
      />
    </>
  );
  const stacked = !(roomOf(s.room) === "bench" && screen === "1440");
  const inFoot = picker === "pool" && stacked;
  if (picker === "tray") {
    return (
      <Screen
        id={`blocked-${shape}`}
        screen={screen}
        read={blockedRead}
        caption={BLOCKED_CAPTION[shape]}
      >
        <TrayPage
          still={byStyle.get(look) ?? hero}
          blocked={shape}
          screen={screen}
        />
      </Screen>
    );
  }
  return (
    <Screen
      id={`blocked-${shape}`}
      screen={screen}
      read={blockedRead}
      caption={BLOCKED_CAPTION[shape]}
    >
      <Room
        screen={screen}
        shape={roomOf(s.room)}
        still={byStyle.get(look) ?? hero}
        shared={sharedOf(s.shared)}
        meta={roomMeta(look)}
        tray="Moments"
        sheet={
          picker === "sheet"
            ? { label: "Moments", tall: true, body: pool }
            : null
        }
        side={picker !== "sheet" ? { label: "Moments", body: pool } : null}
        foot={inFoot ? <>{pool}</> : undefined}
        dock={!inFoot}
        overlay={
          shape === "toast" ? (
            <RoomToast>
              <span data-rs-said>Hidden moments cannot be added</span>
              <span className="font-semibold underline underline-offset-2">
                Show
              </span>
            </RoomToast>
          ) : undefined
        }
      />
    </Screen>
  );
}

/* ── 6. sharing ──────────────────────────────────────────────────────────── */

type ShareShape = "silent" | "undo" | "confirm";

const SHARE_CAPTION: Record<ShareShape, string> = {
  silent:
    "Today, one second after the tap. The light is out, the chip changed its word, and nothing else happened.",
  undo: "The same second, with the way back on the screen. It holds for a few seconds and then the room is quiet again.",
  confirm:
    "The second BEFORE the tap lands: the reel is still shared and still lit, and the panel says who is watching it.",
};

function SharingScreen({ shape, s }: { shape: ShareShape; s: BoardState }) {
  const screen = screenFor(s);
  const { hero } = useStills();
  // Two of the three are drawn AFTER the unshare; the confirm is the one that
  // happens before it, so it is the only one still lit.
  const shared = shape === "confirm";
  return (
    <Screen
      id={`sharing-${shape}`}
      screen={screen}
      read={sharingRead}
      caption={SHARE_CAPTION[shape]}
    >
      <Room
        screen={screen}
        shape={TODAY_ROOM}
        still={hero}
        shared={shared}
        meta={roomMeta("classic")}
        overlay={
          shape === "undo" ? (
            <UndoToast />
          ) : shape === "confirm" ? (
            <StopSharingPanel />
          ) : undefined
        }
      />
    </Screen>
  );
}

/* ── 7. the wait ─────────────────────────────────────────────────────────── */

type WaitShape = "dialog" | "player" | "quiet";

const WAIT_CAPTION: Record<WaitShape, string> = {
  dialog:
    "Today, at 62 percent. A light dialog over a near-black room, describing the thing it is covering.",
  player:
    "The same 62 percent, on the reel itself. It keeps playing while its own copy is made, and Cancel is in the bar.",
  quiet:
    "Nothing is interrupted. One line under the tray says it is happening, and the host carries on choosing moments.",
};

function WaitScreen({ shape, s }: { shape: WaitShape; s: BoardState }) {
  const screen = screenFor(s);
  const look = lookOf(s.look);
  const { byStyle, hero } = useStills();
  return (
    <Screen
      id={`wait-${shape}`}
      screen={screen}
      read={waitRead}
      caption={WAIT_CAPTION[shape]}
    >
      <Room
        screen={screen}
        shape={roomOf(s.room)}
        still={byStyle.get(look) ?? hero}
        shared
        meta={roomMeta(look)}
        tray={shape === "quiet" ? "Moments" : "Length"}
        frameFoot={
          shape === "player" ? <FrameProgress progress={62} /> : undefined
        }
        underTray={shape === "quiet" ? <QuietLine /> : undefined}
        overlay={
          shape === "dialog" ? <StitchingDialog progress={62} /> : undefined
        }
      />
    </Screen>
  );
}

/* ── 8. how a guest watches ──────────────────────────────────────────────── */

const GUEST_CAPTION: Record<GuestShape, string> = {
  overlay:
    "Today. A 4:5 cover photograph with a play badge, and no canvas anywhere until the tap.",
  playing:
    "The card IS the reel, at the reel's own shape, already moving. Every guest pays the engine on first paint.",
  inline:
    "The reel and its two verbs in the album's column. Nothing ever covers the page, and there is no opening.",
};

function GuestScreen({ shape, s }: { shape: GuestShape; s: BoardState }) {
  const screen = screenFor(s);
  const { hero } = useStills();
  const tapped = momentOf(s.moment) === "tap";
  // The two container answers open the same cinema; the inline one has none, so
  // the tap simply leaves it where it is.
  const cinema = tapped && shape !== "inline";
  return (
    <Screen
      id={`guests-${shape}`}
      screen={screen}
      read={guestRead}
      caption={GUEST_CAPTION[shape]}
    >
      <GuestAlbum
        reel={<GuestReelBlock shape={shape} still={hero} styleId="classic" />}
        overlay={cinema ? <Cinema still={hero} /> : undefined}
      />
    </Screen>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof REEL_STUDIO> = {
  "door.link": (s) => <DoorScreen shape="link" s={s} />,
  "door.button": (s) => <DoorScreen shape="button" s={s} />,
  "door.poster": (s) => <DoorScreen shape="poster" s={s} />,

  "room.capped": (s) => <RoomScreen shape="capped" s={s} />,
  "room.float": (s) => <RoomScreen shape="float" s={s} />,
  "room.bench": (s) => <RoomScreen shape="bench" s={s} />,

  "styles.wall": (s) => <StylesScreen shape="wall" s={s} />,
  "styles.rail": (s) => <StylesScreen shape="rail" s={s} />,
  "styles.three": (s) => <StylesScreen shape="three" s={s} />,

  "moments.sheet": (s) => <MomentsScreen shape="sheet" s={s} />,
  "moments.pool": (s) => <MomentsScreen shape="pool" s={s} />,
  "moments.tray": (s) => <MomentsScreen shape="tray" s={s} />,

  "blocked.title": (s) => <BlockedScreen shape="title" s={s} />,
  "blocked.toast": (s) => <BlockedScreen shape="toast" s={s} />,
  "blocked.caption": (s) => <BlockedScreen shape="caption" s={s} />,

  "sharing.silent": (s) => <SharingScreen shape="silent" s={s} />,
  "sharing.undo": (s) => <SharingScreen shape="undo" s={s} />,
  "sharing.confirm": (s) => <SharingScreen shape="confirm" s={s} />,

  "wait.dialog": (s) => <WaitScreen shape="dialog" s={s} />,
  "wait.player": (s) => <WaitScreen shape="player" s={s} />,
  "wait.quiet": (s) => <WaitScreen shape="quiet" s={s} />,

  "guests.overlay": (s) => <GuestScreen shape="overlay" s={s} />,
  "guests.playing": (s) => <GuestScreen shape="playing" s={s} />,
  "guests.inline": (s) => <GuestScreen shape="inline" s={s} />,
};

export function ReelStudioBoard() {
  return <ExplorationBoard spec={REEL_STUDIO} previews={PREVIEWS} />;
}

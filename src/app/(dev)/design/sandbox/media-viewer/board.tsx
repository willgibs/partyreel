"use client";

import "./media-viewer.css";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  ALBUM,
  CLIP_AT,
  CURRENT,
  EVENT,
  HOST_ALBUM,
  indexOf,
  LANDSCAPE,
  LANDSCAPE_AT,
  OPENED,
} from "./fixtures";
import {
  AlbumPage,
  BrowserBar,
  SCREENS,
  type ScreenId,
  screenOf,
  ShareSheet,
} from "./page-parts";
import { MEDIA_VIEWER } from "./spec";
import {
  type HoldsShape,
  holdsOf,
  type LinkShape,
  type NextShape,
  nextOf,
  type OpeningShape,
  openingOf,
  Viewer,
  VideoMedia,
  type VideoShape,
  type WayOutShape,
  type WhoShape,
  whoOf,
  type ZoomShape,
} from "./viewer";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is one open wedding album at a
 * real screen, with a photograph open on top of it in one of its shapes.
 *
 * ★ THE GROUND IS TODAY'S PRODUCT, EXCEPT WHERE A DECISION IS STAGED. Every
 * picture is the shipped viewer with ONE thing changed, so a decision never
 * arrives quietly wearing the answer to a question that has not been asked:
 * the chrome stays today's two capsules everywhere but on `holds`, which is the
 * question about it, and the counter stays on everywhere but where `next`
 * argues against it.
 *
 * ★ A STAGED DECISION WEARS ITS PARENT'S ANSWER, AND ITS PARENT'S DEFAULT IS
 * THE RECOMMENDATION. `defineExploration` mirrors each ask as a control whose
 * `default` is the recommended option and `useBoardState` fills every declared
 * control, so there is no "unanswered" value to read: before he answers
 * `opening`, `holds` is drawn inside the opening this board recommends. That is
 * what the staging is for, and it is why `who`'s three options are described as
 * PLACES ("a capsule of its own", "the chrome's own line", "the top edge")
 * rather than as a look: which chrome two of them sit in is the earlier
 * question's to decide.
 *
 * ★ EVERY NUMBER UNDER A FRAME IS MEASURED, NEVER COMPUTED. A board once drew
 * an option with its formula's sign backwards and the tile Will judged showed
 * the opposite of its words (docs/PROGRAM.md). So each caption reads the
 * laid-out DOM inside the frame's own document once it settles: how much of the
 * screen the photograph really covers, how much of it is really chrome, how
 * wide the photograph really renders, how big the smallest sentence really is.
 * If the words above a frame and the caption under it disagree, the caption is
 * the truth.
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
 * The late passes cover what an observer cannot see: photographs decoding at
 * their natural heights inside columns that never changed width, and the one
 * measurement on this board that waits on another (`grow` flies out of a tile
 * whose box is only known once the album has laid out).
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
  // in the render body is what the compiler's rule refuses, and the observer
  // below must not be torn down and rebuilt on every render.
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
    const late = [900, 1700].map((ms) => win.setTimeout(run, ms));
    return () => {
      ro.disconnect();
      late.forEach((t) => win.clearTimeout(t));
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

const pct = (n: number, of: number) =>
  of > 0 ? Math.round((n / of) * 100) : 0;
const round = (n: number) => Math.round(n);

/** The type size a sentence really renders at, in CSS pixels. */
const sizeOf = (el: Element | null, win: Window): number | null =>
  el ? Math.round(parseFloat(win.getComputedStyle(el).fontSize)) : null;

/**
 * How wide the PHOTOGRAPH is on the screen, which is not the box it sits in.
 * `object-contain` letterboxes inside the box and `object-cover` overflows it,
 * so the answer to "how close can a guest get" is the media's own width worked
 * out from its natural ratio against the box it was given. The box already
 * carries any transform, so a scaled picture measures scaled.
 */
function shownWidth(el: HTMLElement | null, win: Window): number {
  if (!el) return 0;
  const box = el.getBoundingClientRect();
  // ★ DUCK-TYPED, NOT `instanceof`. The element lives in the FRAME's realm, so
  // `instanceof HTMLImageElement` against this document's constructor is false
  // for every one of them, and `win.HTMLImageElement` is not on the `Window`
  // type at all. The natural size is read off the element itself instead.
  const m = el as Partial<HTMLImageElement & HTMLVideoElement>;
  const w = m.naturalWidth || m.videoWidth || 0;
  const h = m.naturalHeight || m.videoHeight || 0;
  const nat = w && h ? w / h : 0;
  if (!nat || box.height === 0) return box.width;
  const fit = win.getComputedStyle(el).objectFit;
  const byHeight = box.height * nat;
  if (fit === "cover") return Math.max(box.width, byHeight);
  return Math.min(box.width, byHeight);
}

/** How much of the screen a set of boxes actually covers. */
function screenShare(els: NodeListOf<HTMLElement>, win: Window): number {
  const vw = win.innerWidth;
  const vh = win.innerHeight;
  let area = 0;
  els.forEach((el) => {
    const b = el.getBoundingClientRect();
    const w = Math.max(0, Math.min(b.right, vw) - Math.max(b.left, 0));
    const h = Math.max(0, Math.min(b.bottom, vh) - Math.max(b.top, 0));
    area += w * h;
  });
  return pct(area, vw * vh);
}

/** The photograph, whichever element is carrying it. */
const mediaEl = (root: HTMLElement) =>
  root.querySelector<HTMLElement>("[data-mv-picture], [data-mv-video]") ??
  root.querySelector<HTMLElement>("[data-mv-flight] img");

/* ── what each decision measures ─────────────────────────────────────────── */

/**
 * The alpha of a computed colour, whatever function it is spelled in.
 *
 * ★ IT IS NOT `rgba()` ANY MORE. Tailwind v4 writes an opacity modifier as a
 * `color-mix`, and Chrome resolves `bg-black/60` to `oklab(0 0 0 / 0.6)`: an
 * `rgba`-only parser read it as zero and this caption told Will the album was
 * behind the growing photograph "at 100 percent" while the frame beside it
 * showed the wash. Both spellings are read, and the slash form is the common
 * one now.
 */
function alphaOf(colour: string): number {
  if (colour === "transparent") return 0;
  const inside = /\(([^)]+)\)/.exec(colour)?.[1];
  if (!inside) return 1;
  const slash = inside.split("/")[1];
  if (slash !== undefined) return parseFloat(slash.trim()) || 0;
  const parts = inside.split(",").map((p) => parseFloat(p.trim()));
  return parts.length > 3 ? (parts[3] ?? 1) : 1;
}

/**
 * The opening: how much screen the photograph takes, and what the ground behind
 * it really is.
 *
 * ★ THE GROUND IS THE RULED ONE AND THE READER HAS TO SAY SO (the overtaken
 * audit, 2026-09-21). It used to report a wash percentage, which was the right
 * reading of a `bg-black/90` dark room and the wrong reading of `glass-behind`:
 * that utility's own background is only a 35 percent tint and the rest of the
 * work is a backdrop FILTER, so an alpha-only reader called the ruled ground
 * "the album at 65 percent" and said nothing about the blur or the half
 * brightness that are the whole of it. The filter is read off the computed
 * style, and the wash is kept for the sheet, which really is a plain tint.
 *
 * ★ AND THE ALBUM IS NOT "COVERED" OR "NOT COVERED". The sheet covers part of
 * the screen outright and leaves the rest at full light. The first version of
 * this reader tested the viewer's top edge alone, which reported the sheet's
 * COVERED share as the lit one, with the sign backwards.
 */
const groundRead = (ground: HTMLElement | null, win: Window): string => {
  if (!ground) return "no ground behind it";
  const style = win.getComputedStyle(ground);
  const filter =
    style.backdropFilter ||
    (style as unknown as { webkitBackdropFilter?: string })
      .webkitBackdropFilter ||
    "none";
  if (filter && filter !== "none") {
    const blur = /blur\(([^)]+)\)/.exec(filter)?.[1] ?? "no blur";
    const bright = /brightness\(([^)]+)\)/.exec(filter)?.[1];
    const dim = bright ? `${Math.round(parseFloat(bright) * 100)} percent` : "full";
    return `the album behind it blurred at ${blur} and ${dim} brightness, the ruled ground`;
  }
  const wash = Math.round(alphaOf(style.backgroundColor) * 100);
  return `the album behind it at ${100 - wash} percent, unblurred`;
};

const openingRead: Reader = (root, win) => {
  const el = mediaEl(root);
  if (!el) return null;
  const box = el.getBoundingClientRect();
  if (box.height < 8) return null;
  const share = pct(box.width * box.height, win.innerWidth * win.innerHeight);
  const ground = root.querySelector<HTMLElement>("[data-mv-ground]");
  const panel = root.querySelector<HTMLElement>("[data-mv-sheet-viewer]");
  const open = panel ? round(panel.getBoundingClientRect().top) : 0;
  const left =
    open > 4
      ? `${pct(open, win.innerHeight)} percent of the screen left to the album, at full light`
      : groundRead(ground, win);
  return `Measured: the photograph covers ${share} percent of the screen at ${round(box.width)} by ${round(box.height)} px, with ${left}.`;
};

/** What it holds: how much of the screen is chrome at rest. */
const holdsRead: Reader = (root, win) => {
  const chrome = root.querySelector<HTMLElement>("[data-mv-chrome]");
  const close = root.querySelector<HTMLElement>("[data-mv-close]");
  const el = mediaEl(root);
  if (!el) return null;
  if (el.getBoundingClientRect().height < 8) return null;
  const hidden = chrome && Number(win.getComputedStyle(chrome).opacity) < 0.05;
  const said = root.querySelector("[data-mv-said]");
  const size = sizeOf(said, win);
  if (!chrome || hidden)
    return `Measured: nothing over the photograph but the ${close ? `${round(close.getBoundingClientRect().width)} px close circle` : "picture"}, and no words at all until a tap.`;
  const b = chrome.getBoundingClientRect();
  // A stacked chrome is a COLUMN of capsules and a strip is one ROW, so the
  // count is only a count of rows when the box stacks; reading the flex
  // direction is what keeps a one-line strip from being called two rows.
  const stacked = win
    .getComputedStyle(chrome)
    .flexDirection.startsWith("column");
  const rows = stacked ? chrome.querySelectorAll(":scope > *").length : 1;
  return `Measured: ${rows} row${rows === 1 ? "" : "s"} of chrome standing ${round(b.height)} px tall, ${pct(b.height, win.innerHeight)} percent of the screen, its words at ${size ?? "no"} px.`;
};

/**
 * Who took it: what is said, and how big.
 *
 * ★ THE SIZE IS THE NAME'S, NOT ITS WRAPPER'S (the overtaken audit,
 * 2026-09-21). Two of the three answers set the type on the box that holds the
 * credit, so reading the box was reading the name; the face-led one sets it on
 * the name inside a box that inherits, and the caption reported the inherited
 * 16 px for a name rendering at 14. The name carries `data-mv-name` in all
 * three now and the caption measures that, falling back to the box where a
 * future option has only a box.
 */
const whoRead: Reader = (root, win) => {
  const said = root.querySelector<HTMLElement>("[data-mv-said]");
  if (!mediaEl(root)) return null;
  if (!said)
    return "Measured: nothing on the photograph says who took it or where it sits.";
  const name = root.querySelector<HTMLElement>("[data-mv-name]");
  const size = sizeOf(name ?? said, win);
  const words = (said.innerText || "").trim().replace(/\s+/g, " ");
  return `Measured: "${words}" at ${size} px, ${round(said.getBoundingClientRect().width)} px wide.`;
};

/** The next one: what says where you are, and what the nav costs the picture. */
const nextRead: Reader = (root, win) => {
  const el = mediaEl(root);
  if (!el) return null;
  const box = el.getBoundingClientRect();
  if (box.height < 8) return null;
  const film = root.querySelector<HTMLElement>("[data-mv-film]");
  const peeks = root.querySelectorAll<HTMLElement>("[data-mv-peek]");
  const said = root.querySelector<HTMLElement>("[data-mv-said]");
  const counter = /\d+ of \d+/.test(said?.innerText ?? "");
  const cost = film
    ? `a ${round(film.getBoundingClientRect().height)} px filmstrip at its foot`
    : peeks.length
      ? `${screenShare(peeks, win)} percent of the screen given to the neighbours`
      : "two 30 percent bands carrying a chevron each";
  return `Measured: the photograph at ${round(box.width)} by ${round(box.height)} px with ${cost}, and ${counter ? "a written count" : "no written count"}.`;
};

/** Close up: how wide the photograph really renders, and what a detail measures. */
const closeupRead: Reader = (root, win) => {
  const el = mediaEl(root);
  if (!el) return null;
  const shown = shownWidth(el, win);
  if (shown < 8) return null;
  const times = shown / win.innerWidth;
  return `Measured: the photograph renders ${round(shown)} px wide, ${times.toFixed(2)} times the screen; a face a tenth of the frame across measures ${round(shown / 10)} px.`;
};

/** A video: what stands on a clip that nobody has played. */
const videoRead: Reader = (root, win) => {
  const v = root.querySelector<HTMLVideoElement>("[data-mv-video]");
  if (!v) return null;
  const box = v.getBoundingClientRect();
  if (box.height < 8) return null;
  const native = v.hasAttribute("controls");
  const playing = !v.paused && !v.ended;
  const still = root.querySelector(".mv-played");
  const ours = root.querySelectorAll<HTMLElement>(
    "[data-mv-chrome], [data-mv-close]",
  );
  // 64 px is `CONTROLS_STRIP_PX` in the shipped viewer: the band taken out of
  // the swipe so a playing video's native scrubber can be reached. It is a
  // constant in the code rather than a measurable box (the controls live in the
  // browser's own shadow tree), so it is named as the code's number.
  return `Measured: a ${round(box.width)} by ${round(box.height)} px clip on ${pct(box.width * box.height, win.innerWidth * win.innerHeight)} percent of the screen, ${native ? `wearing the browser's own bar, whose 64 px band is ${pct(64, box.height)} percent of it` : "with no bar of its own"}, ${playing ? "playing" : still ? "held at its first frame under the reduced-motion setting" : "waiting"}, under ${ours.length} pieces of our chrome.`;
};

/** The way out: how many, and how big the one a finger has to find is. */
const wayOutRead: Reader = (root, win) => {
  const close = root.querySelector<HTMLElement>("[data-mv-close]");
  const zones = root.querySelectorAll<HTMLElement>("[data-mv-zones] > *");
  const viewer = root.querySelector<HTMLElement>("[data-mv-viewer]");
  if (!viewer) return null;
  const top = round(viewer.getBoundingClientRect().top);
  if (zones.length) {
    const mid = zones[1].getBoundingClientRect();
    return `Measured: three ways out. One ${round(close?.getBoundingClientRect().width ?? 0)} px circle, one unmarked ${round(mid.width)} px band that closes, and a key.`;
  }
  if (top > 8)
    return `Measured: the photograph is ${top} px down and ${pct(top, win.innerHeight)} percent of the album is back, with the tile it is heading for lit.`;
  return `Measured: one way out, a ${round(close?.getBoundingClientRect().width ?? 0)} px circle in the corner, and nothing else on the photograph responds.`;
};

/** A link: what the address says, and what the phone would hand on. */
const linkRead: Reader = (root) => {
  const url = root.querySelector<HTMLElement>("[data-mv-url]");
  const sheet = root.querySelector<HTMLElement>("[data-mv-sheet]");
  if (!url) return null;
  const carries = !sheet
    ? "nothing"
    : sheet.dataset.mvCarries === "image"
      ? "the photograph's own bytes"
      : "a link";
  const words = (sheet?.innerText ?? "").split("\n")[1] ?? "";
  return `Measured: the address reads "${url.innerText.trim()}"; the sheet carries ${carries}${words ? `, headed "${words}"` : ""}.`;
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
      id={`mv-${id}-${screen}`}
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
const hostFor = (s: BoardState) => s.role === "host";
const shotFor = (s: BoardState) =>
  s.shot === "landscape"
    ? ({ item: LANDSCAPE, at: LANDSCAPE_AT } as const)
    : ({ item: CURRENT, at: OPENED } as const);

/* ── 1. the opening ──────────────────────────────────────────────────────── */

const OPENING_CAPTION: Record<OpeningShape, string> = {
  fade: "As wired, on the ruled ground: the album blurred at half brightness behind it, and the photograph centred inside a margin with nothing to say which tile it came from.",
  grow: "Caught at 62 percent of its flight out of the tile that was tapped, measured from that tile's own box, over the same ruled ground. It plays when the option is pressed.",
  sheet:
    "The sheet at rest, with the album above it keeping its own light and its own scroll position; only the gap is unblurred.",
};

function openingScreen(shape: OpeningShape, s: BoardState) {
  const screen = screenFor(s);
  const { item, at } = shotFor(s);
  return (
    <Screen
      id={`opening-${shape}`}
      screen={screen}
      read={openingRead}
      caption={OPENING_CAPTION[shape]}
    >
      <AlbumPage screen={screen} lit={at}>
        <Viewer screen={screen} item={item} opening={shape} />
      </AlbumPage>
    </Screen>
  );
}

/* ── 2. what it holds ────────────────────────────────────────────────────── */

const HOLDS_CAPTION: Record<HoldsShape, string> = {
  pills:
    "Today. Five icons in a capsule, a second capsule under it, a close circle and two chevrons, all of it on from the first frame.",
  quiet:
    "The photograph with nothing on it. A tap summons the chrome and a tap sends it away, which is the gesture the way out also wants.",
  strip:
    "One row: who and when at one end, the actions at the other, over a gradient rather than two floating capsules.",
};

function holdsScreen(shape: HoldsShape, s: BoardState) {
  const screen = screenFor(s);
  const opening = openingOf(s.opening);
  return (
    <Screen
      id={`holds-${shape}`}
      screen={screen}
      read={holdsRead}
      caption={HOLDS_CAPTION[shape]}
    >
      <AlbumPage screen={screen}>
        <Viewer
          screen={screen}
          opening={opening}
          holds={shape}
          host={hostFor(s)}
        />
      </AlbumPage>
    </Screen>
  );
}

/* ── 3. who took it ──────────────────────────────────────────────────────── */

const WHO_CAPTION: Record<WhoShape, string> = {
  pill: "As wired. A capsule of its own under the actions, carrying the name, the mark, the badge and the position together at 11 px.",
  foot: "The name, the mark and the time on the chrome's own line, with nothing built around them.",
  face: "The seeded face leading a pressable credit at the top edge, opposite the close circle, with the unproven mark on the disc's corner. Priya has not confirmed an address.",
};

function whoScreen(shape: WhoShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`who-${shape}`}
      screen={screen}
      read={whoRead}
      caption={WHO_CAPTION[shape]}
    >
      <AlbumPage screen={screen}>
        <Viewer
          screen={screen}
          item={hostFor(s) ? HOST_ALBUM[OPENED] : CURRENT}
          opening={openingOf(s.opening)}
          holds={holdsOf(s.holds)}
          who={shape}
          host={hostFor(s)}
          // `quiet` draws nothing at rest, and a question about what is said
          // cannot be asked of a screen that says nothing: under that answer
          // the chrome is drawn SUMMONED, which is the state it exists in.
          summoned
        />
      </AlbumPage>
    </Screen>
  );
}

/* ── 4. the next one ─────────────────────────────────────────────────────── */

const NEXT_CAPTION: Record<NextShape, string> = {
  swipe:
    "Today. Two 30 percent bands with a chevron each, and the position written out at the foot whether or not anyone is looking for it.",
  film: "Nine frames at the foot with the current one lifted: four back, four on, and the album's clip among them.",
  peek: "A sliver of the one before and the one after, at the photograph's own height, and no number anywhere.",
};

function nextScreen(shape: NextShape, s: BoardState) {
  const screen = screenFor(s);
  const { item, at } = shotFor(s);
  return (
    <Screen
      id={`next-${shape}`}
      screen={screen}
      read={nextRead}
      caption={NEXT_CAPTION[shape]}
    >
      <AlbumPage screen={screen} lit={at}>
        <Viewer screen={screen} item={item} next={shape} />
      </AlbumPage>
    </Screen>
  );
}

/* ── 5. close up ─────────────────────────────────────────────────────────── */

const CLOSEUP_CAPTION: Record<ZoomShape, string> = {
  browser:
    "Today. A pinch reaches the browser, the browser cannot answer it inside a fixed scroll-locked dialog, and the photograph stays exactly this size.",
  double:
    "One double-tap: the photograph fills the screen and the edges are cropped away.",
  pinch:
    "Two fingers at 2.4 times, opened on the faces. One finger pans from here, so it cannot also mean next.",
};

function closeupScreen(shape: ZoomShape, s: BoardState) {
  const screen = screenFor(s);
  const { item, at } = shotFor(s);
  return (
    <Screen
      id={`closeup-${shape}`}
      screen={screen}
      read={closeupRead}
      caption={CLOSEUP_CAPTION[shape]}
    >
      <AlbumPage screen={screen} lit={at}>
        <Viewer
          screen={screen}
          item={item}
          zoom={shape}
          next={nextOf(s.next)}
        />
      </AlbumPage>
    </Screen>
  );
}

/* ── 6. a video ──────────────────────────────────────────────────────────── */

const VIDEO_CAPTION: Record<VideoShape, string> = {
  controls:
    "Today. The browser draws its own bar on the picture before anything has played, and 64 px of the foot leaves the swipe to make room for it.",
  auto: "It plays the moment it is the one on screen, silent, with one chip to turn the sound on.",
  badge:
    "The shipped play badge, the same marker the tile wears, and no controls until it is playing.",
};

function videoScreen(shape: VideoShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`video-${shape}`}
      screen={screen}
      read={videoRead}
      caption={VIDEO_CAPTION[shape]}
    >
      <AlbumPage screen={screen} lit={CLIP_AT}>
        <Viewer
          screen={screen}
          item={ALBUM[CLIP_AT]}
          media={<VideoMedia shape={shape} radius="rounded-md" />}
        />
      </AlbumPage>
    </Screen>
  );
}

/* ── 7. the way out ──────────────────────────────────────────────────────── */

const WAYOUT_CAPTION: Record<WayOutShape, string> = {
  three:
    "Today, with the invisible geometry drawn: the middle band closes and the two beside it do the opposite. Nothing on the real screen says so.",
  down: "A finger part way through putting it back. The album is returning and the tile it will land in is lit.",
  x: "One circle, and a tap on the photograph does nothing at all.",
};

function wayOutScreen(shape: WayOutShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`wayout-${shape}`}
      screen={screen}
      read={wayOutRead}
      caption={WAYOUT_CAPTION[shape]}
    >
      <AlbumPage
        screen={screen}
        pageClass={shape === "down" ? "mv-returning" : undefined}
      >
        <Viewer
          screen={screen}
          // The way out is asked inside the chrome he chose, because a centre
          // tap cannot both close the viewer and summon a hidden pill, and
          // inside the opening that chrome sits in.
          opening={openingOf(s.opening)}
          holds={holdsOf(s.holds)}
          who={whoOf(s.who)}
          wayOut={shape}
        />
      </AlbumPage>
    </Screen>
  );
}

/* ── 8. a link ───────────────────────────────────────────────────────────── */

const LINK_CAPTION: Record<LinkShape, string> = {
  none: "Today. The address is the album's, so a refresh lands at the top of the grid and Share hands on the whole album.",
  query:
    "The photograph is in the address, so a refresh comes back to it and the link someone else opens lands on this picture.",
  file: "The photograph itself, leaving as a file: it arrives in a chat as an image and carries no way back to the album.",
};

const URLS: Record<LinkShape, string> = {
  none: `partyreel.com/e/${EVENT.token}`,
  query: `partyreel.com/e/${EVENT.token}?photo=${indexOf(CURRENT) + 1}`,
  file: `partyreel.com/e/${EVENT.token}`,
};

function linkScreen(shape: LinkShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`link-${shape}`}
      screen={screen}
      read={linkRead}
      caption={LINK_CAPTION[shape]}
    >
      <AlbumPage
        screen={screen}
        browser={<BrowserBar screen={screen} url={URLS[shape]} />}
      >
        <Viewer
          screen={screen}
          onTop={
            shape === "file" ? (
              <ShareSheet
                screen={screen}
                kind="image"
                thumb={CURRENT.url}
                title="IMG_4417.jpg"
                subtitle="Image, 3.1 MB"
              />
            ) : (
              <ShareSheet
                screen={screen}
                kind="link"
                thumb={shape === "query" ? CURRENT.url : ALBUM[0].url}
                title={
                  shape === "query" ? "A photo from Maya & Jay" : EVENT.name
                }
                subtitle={URLS[shape]}
              />
            )
          }
        />
      </AlbumPage>
    </Screen>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof MEDIA_VIEWER> = {
  "opening.fade": (s) => openingScreen("fade", s),
  "opening.grow": (s) => openingScreen("grow", s),
  "opening.sheet": (s) => openingScreen("sheet", s),

  "holds.pills": (s) => holdsScreen("pills", s),
  "holds.quiet": (s) => holdsScreen("quiet", s),
  "holds.strip": (s) => holdsScreen("strip", s),

  "who.pill": (s) => whoScreen("pill", s),
  "who.foot": (s) => whoScreen("foot", s),
  "who.face": (s) => whoScreen("face", s),

  "next.swipe": (s) => nextScreen("swipe", s),
  "next.film": (s) => nextScreen("film", s),
  "next.peek": (s) => nextScreen("peek", s),

  "closeup.browser": (s) => closeupScreen("browser", s),
  "closeup.double": (s) => closeupScreen("double", s),
  "closeup.pinch": (s) => closeupScreen("pinch", s),

  "video.controls": (s) => videoScreen("controls", s),
  "video.auto": (s) => videoScreen("auto", s),
  "video.badge": (s) => videoScreen("badge", s),

  "wayout.three": (s) => wayOutScreen("three", s),
  "wayout.down": (s) => wayOutScreen("down", s),
  "wayout.x": (s) => wayOutScreen("x", s),

  "link.none": (s) => linkScreen("none", s),
  "link.query": (s) => linkScreen("query", s),
  "link.file": (s) => linkScreen("file", s),
};

export function MediaViewerBoard() {
  return <ExplorationBoard spec={MEDIA_VIEWER} previews={PREVIEWS} />;
}

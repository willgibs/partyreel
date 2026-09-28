"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Fit, Frame, Measured } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import { HOUSE_HUES } from "@/lib/guest/door-light";

import { EVENT, HOST, type ReaderId } from "./fixtures";

/**
 * THE FRAME EVERY LOCKED DOOR IS READ IN.
 *
 * ★ A REAL VIEWPORT, NEVER A STYLED DIV: the door's sheet is a bottom sheet
 * under 640 and a panel from the right above it (`floatingEdgeEntranceResponsive`),
 * and its lamp turns with it (`lit.css`, 40rem), so only a same-origin frame at
 * the true width shows the posture a guest gets (the kit's `vw-in-a-narrow-div`
 * trap). 375 by 812 is the phone off a printed code; 1440 by 900 the laptop.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK, AND
 * NOTHING OPENS A RADIX PORTAL, which would land on the lab's document rather
 * than the phone being judged. So the header and the held sheet are QUOTED
 * (`parts.tsx`), and everything presentational is the real component: the
 * not-found screen, the lamp, the glyph, the heading, the ghost river.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER COMPUTED: how many words the
 * message runs and how many lines its headline takes, what of the album the
 * screen shows (found in the drawing by its marks, not assumed from the
 * option), which light the lamp wears (its own `data-door-hues`), and how tall
 * the sheet stands.
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;

export type ScreenId = keyof typeof SCREENS;

export const screenOf = (s: BoardState): ScreenId =>
  s.screen === "1440" ? "1440" : "375";

export type Probe = (root: HTMLElement, win: Window) => string | null;

export function Scene({
  id,
  screen,
  title,
  measure,
  short = false,
  again,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  measure: Probe;
  /** Anything that changes the drawing without moving its layout (the cover's
   *  hues landing), so the caption is read again when it does. */
  again?: string;
  /**
   * A laptop frame standing in a stack of three (`previous` at 1440), cut to
   * 600px so the three stay within reach (`event-safety`'s `short`, retyped).
   * Everything a door shows at a desk is at the panel's top or the column's
   * middle, so nothing is lost.
   */
  short?: boolean;
  children: ReactNode;
}) {
  const { w, h: full, name } = SCREENS[screen];
  const h = short && screen === "1440" ? 600 : full;
  const [caption, setCaption] = useState("measuring");
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${name}`}
        caption={caption}
      >
        <Measured
          probe={measure}
          deps={[id, screen, again]}
          onMeasure={setCaption}
          className="min-h-full"
        >
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/* ── the three readers, side by side ───────────────────────────────────────── */

type Heard = Partial<Record<ReaderId, string>>;
const TrioCtx = createContext<((id: ReaderId, words: string) => void) | null>(
  null,
);

/** A reader's frame hands its measured words to the row it stands in. */
export function useReport(): (id: ReaderId, words: string) => void {
  return useContext(TrioCtx) ?? noop;
}
const noop = () => {};

/**
 * THE THREE PEOPLE THE DOOR STOPS, IN ONE ROW (phones side by side; laptops
 * stacked, since three at 1440 are never side by side at 1:1). Above them, the
 * one comparison the `previous` ask exists for, read off the frames: whether
 * Dom's words are Priya's, word for word, and whether Priya's are the
 * newcomer's.
 */
export function Trio({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  const [heard, setHeard] = useState<Heard>({});
  const report = useCallback((id: ReaderId, words: string) => {
    setHeard((h) => (h[id] === words ? h : { ...h, [id]: words }));
  }, []);
  return (
    <TrioCtx.Provider value={report}>
      <div data-ld-trio className="flex flex-col gap-3">
        <p
          data-ld-compare
          className="max-w-3xl text-sm leading-snug text-muted-foreground"
        >
          {compare(heard)}
        </p>
        <div
          className={
            screen === "375"
              ? "flex flex-wrap items-start gap-6"
              : "flex flex-col gap-6"
          }
        >
          {children}
        </div>
      </div>
    </TrioCtx.Provider>
  );
}

function compare(h: Heard): string {
  const { newcomer, priya, dom } = h;
  if (!newcomer || !priya || !dom)
    return "Measuring what each of the three reads.";
  const trap =
    dom === priya
      ? "Dom, blocked, reads Priya's words, word for word"
      : "Dom's words are NOT Priya's: this line tells a block apart";
  const them =
    priya === newcomer
      ? "and Priya reads the newcomer's"
      : "and Priya reads words of her own, not the newcomer's";
  return `Measured: ${trap}, ${them}.`;
}

/* ── what the frames measure ───────────────────────────────────────────────── */

const clean = (s: string | null | undefined) =>
  (s ?? "").replace(/\s+/g, " ").trim();

export const textOf = (el: Element | null | undefined) =>
  clean((el as HTMLElement | null)?.innerText);

export const wordCount = (text: string) =>
  text.split(/\s+/).filter(Boolean).length;

export const lines = (n: number) => `${n} line${n === 1 ? "" : "s"}`;

/**
 * How many lines a block of text runs, read off its own line boxes (the rects
 * a Range draws over each text node, clustered by top so a glyph's rounding is
 * never a second line): `voice-guest`'s measure, retyped, since a board's
 * directory leaves with its ruling.
 */
export function lineCount(el: Element | null): number {
  if (!el) return 0;
  const doc = el.ownerDocument;
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const tops: number[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim()) continue;
    const range = doc.createRange();
    range.selectNodeContents(n);
    for (const r of Array.from(range.getClientRects())) {
      if (r.width < 1 || r.height < 1) continue;
      tops.push(r.top);
    }
  }
  tops.sort((a, b) => a - b);
  let count = 0;
  let last = -Infinity;
  for (const t of tops) {
    if (t - last > 6) count++;
    last = t;
  }
  return count;
}

/**
 * The screen's message, in reading order: every piece a drawing marks
 * `data-ld-words`, and the not-found screen's own headline, which the real
 * component renders from a string (so it cannot carry a mark of ours).
 */
const WORDS = "[data-ld-words], [data-not-found] h1";
const TITLE = "[data-ld-title], [data-not-found] h1";

export function messageOf(root: HTMLElement): string {
  return Array.from(root.querySelectorAll(WORDS))
    .map(textOf)
    .filter(Boolean)
    .join(" ");
}

/**
 * What of the album the drawing shows, found by what it contains rather than
 * by the option's name: the album's name anywhere in the page, the host's
 * byline, a photograph of the album's own.
 */
function showsOf(root: HTMLElement): string {
  const page = textOf(root);
  const name = page.includes(EVENT.name);
  const host = !!root.querySelector("[data-ld-shows='host']");
  const photo = root.querySelector<HTMLImageElement>("[data-ld-shows='photo']");
  const said = [
    name && "its name",
    host && `its host (${HOST.name})`,
    photo && "its newest photograph",
  ].filter(Boolean) as string[];
  if (!said.length) return "shows nothing of the album";
  const last = said.pop();
  return `shows ${said.length ? `${said.join(", ")} and ${last}` : last}`;
}

/** Which light the lamp wears, off its own attribute. */
function lampOf(root: HTMLElement): string {
  const lamp = root.querySelector("[data-door-hues]");
  if (!lamp)
    return root.querySelector("[data-ld-spill]")
      ? "the lock's pool in the house light"
      : "no lamp";
  const hues = (lamp.getAttribute("data-door-hues") ?? "").split(",");
  const house = HOUSE_HUES.slice(0, 3).map(Math.round).join(",");
  return hues.join(",") === house
    ? "the lamp in the house five"
    : `the lamp in the photograph's hues (${hues.join(", ")})`;
}

/**
 * THE CAPTION UNDER A LOCKED SCREEN: the message's size (the words, and the
 * headline's lines, since a headline that wraps to three at 375 is exactly what
 * a door board exists to catch), what it shows, its light, the sheet's height
 * where it stands in one, and whether the back-in line is drawn.
 */
export const measureLock =
  (screenH: number): Probe =>
  (root) => {
    const title = root.querySelector(TITLE);
    const message = messageOf(root);
    const titleLines = lineCount(title);
    if (!message || !titleLines) return null;
    const parts = [
      `${wordCount(message)} words, the headline on ${lines(titleLines)}`,
      showsOf(root),
      lampOf(root),
    ];
    const sheet = root.querySelector<HTMLElement>("[data-entry-sheet]");
    if (sheet) {
      const h = Math.round(sheet.getBoundingClientRect().height);
      if (!h) return null;
      parts.push(
        `the sheet stands ${h}px, ${Math.round((h / screenH) * 100)}% of the screen`,
      );
    }
    parts.push(
      root.querySelector("[data-ld-backin]")
        ? "the back-in line drawn"
        : "no back-in line",
    );
    return `Measured: ${parts.join("; ")}.`;
  };

/**
 * A reader's frame in the trio: its own caption, and its words handed to the
 * row for the comparison above it.
 */
export function useReaderProbe(id: ReaderId): Probe {
  const report = useReport();
  const ref = useRef(report);
  useEffect(() => {
    ref.current = report;
  });
  return useMemo<Probe>(
    () => (root) => {
      const message = messageOf(root);
      if (!message) return null;
      ref.current(id, message);
      const back = root.querySelector("[data-ld-backin]")
        ? "the back-in line drawn"
        : "no back-in line (this phone's email is confirmed)";
      return `Measured: ${wordCount(message)} words: "${message}"; ${back}.`;
    },
    [id],
  );
}

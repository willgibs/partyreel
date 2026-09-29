"use client";

import { type ReactNode, useState, useSyncExternalStore } from "react";

import { type BoardState, Fit, Frame, Measured } from "@/components/lab";
import { HOUSE_HUES } from "@/lib/guest/door-light";

import { EVENT, HOST } from "./fixtures";
import { WAY_OUT } from "./words";

/**
 * THE FRAMES THE DOOR IS READ IN, AND WHAT EACH ONE MEASURES.
 *
 * ★ A REAL VIEWPORT, NEVER A STYLED DIV: the door's sheet is a bottom sheet
 * under 640 and a panel from the right above it, and its lamp turns with it
 * (`lit.css`, 40rem), so only a same-origin frame at the true width shows the
 * posture a guest gets (the kit's `vw-in-a-narrow-div` trap). 375 by 812 is the
 * phone off a printed code; 1440 by 900 the laptop.
 *
 * ★ A FAMILY IS READ WHOLE (his note: "unlock something perfect for
 * everything"), so a direction is four frames in one row: the welcome, the
 * wait, the shut door, and the shut door as someone who was in reads it. Four
 * phones stand side by side in ONE zoom-fitted canvas (so they keep one scale
 * and one baseline); four laptops stack, since four 1440 frames side by side
 * would be drawn at a fifth of their size.
 *
 * ★ AND FOUR PHONES STACK ON A PHONE, for the laptops' reason: in the lab's
 * phone-width column a row of four is drawn at a fifth of its size, or at 1:1
 * one phone at a time behind a sideways scroll, where the state that told two
 * options apart sat off screen (`shape`'s split and bespoke differ only in the
 * wait, so at 375 they read as one picture, `lab:demo --width 375`). Stacked,
 * every state is read down the page at its own size, as a phone scrolls.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK, AND
 * NOTHING OPENS A RADIX PORTAL, which would land on the lab's document rather
 * than the phone being judged. So the header and the held sheet are QUOTED
 * (`furniture.tsx`), and everything presentational is the real piece. And
 * every frame is INERT, a picture and never a control: today's door is
 * production's own pieces, whose links would take the lab away and whose ask
 * would post (the help center's phone document holds its door the same way).
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER COMPUTED: the message's words
 * and the headline's lines, what of the album the screen shows (found by its
 * marks, never assumed from the option), whose light it wears (its own
 * `data-door-hues`), how tall the sheet stands, and which way on the foot
 * offers.
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;

export type ScreenId = keyof typeof SCREENS;

export const screenOf = (s: BoardState): ScreenId =>
  s.screen === "1440" ? "1440" : "375";

export type Probe = (root: HTMLElement, win: Window) => string | null;

/** The gap between two frames of a row, in the lab's own pixels. */
const GAP = 24;

/**
 * ONE FRAME. `bare` drops its own zoom-fit, for a frame standing in a row that
 * is fitted as one canvas.
 */
export function Scene({
  id,
  screen,
  title,
  measure,
  again,
  bare = false,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  measure: Probe;
  /** Anything that changes the drawing without moving its layout (sampled
   *  hues landing), so the caption is read again when it does. */
  again?: string;
  bare?: boolean;
  children: ReactNode;
}) {
  const { w, h, name } = SCREENS[screen];
  const [caption, setCaption] = useState("measuring");
  const frame = (
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
        <div inert>{children}</div>
      </Measured>
    </Frame>
  );
  return bare ? frame : <Fit w={w}>{frame}</Fit>;
}

export type StripFrame = {
  id: string;
  title: string;
  node: ReactNode;
  /** A frame whose drawing changes after layout (sampled hues landing). */
  again?: string;
};

/** The lab's own window at a phone's width: below `sm`, where its column is a phone's. */
const PHONE_WIDTH = "(width < 40rem)";

function onPhoneWidth(change: () => void) {
  const query = window.matchMedia(PHONE_WIDTH);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}

/** Whether the lab is being read on a phone (never on the server: a row until it knows). */
function useOnPhone(): boolean {
  return useSyncExternalStore(
    onPhoneWidth,
    () => window.matchMedia(PHONE_WIDTH).matches,
    () => false,
  );
}

/**
 * A STRIP OF FRAMES: phones side by side in one fitted canvas, laptops
 * stacked, and phones stacked too when the lab itself is read on a phone.
 * `lede` is the one line above the row saying what it holds.
 */
export function Strip({
  screen,
  frames,
  lede,
}: {
  screen: ScreenId;
  frames: readonly StripFrame[];
  lede?: ReactNode;
}) {
  const onPhone = useOnPhone();
  const head = lede ? (
    <p className="max-w-3xl text-sm leading-snug text-muted-foreground">
      {lede}
    </p>
  ) : null;
  if (screen === "1440" || onPhone) {
    return (
      <div data-ld-row className="flex flex-col gap-6">
        {head}
        {frames.map((f) => (
          <Scene
            key={f.id}
            id={f.id}
            screen={screen}
            title={f.title}
            measure={measureDoor(SCREENS[screen].h)}
            again={f.again}
          >
            {f.node}
          </Scene>
        ))}
      </div>
    );
  }
  const w = frames.length * SCREENS["375"].w + (frames.length - 1) * GAP;
  return (
    <div data-ld-row className="flex flex-col gap-3">
      {head}
      <Fit w={w}>
        <div className="flex items-start" style={{ gap: GAP }}>
          {frames.map((f) => (
            <Scene
              key={f.id}
              id={f.id}
              screen="375"
              title={f.title}
              measure={measureDoor(SCREENS["375"].h)}
              again={f.again}
              bare
            >
              {f.node}
            </Scene>
          ))}
        </div>
      </Fit>
    </div>
  );
}

/* ── what the frames measure ───────────────────────────────────────────────── */

const clean = (s: string | null | undefined) =>
  (s ?? "").replace(/\s+/g, " ").trim();

const textOf = (el: Element | null | undefined) =>
  clean((el as HTMLElement | null)?.innerText);

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

const lines = (n: number) => `${n} line${n === 1 ? "" : "s"}`;

/**
 * How many lines a block of text runs, read off its own line boxes (the rects
 * a Range draws over each text node, clustered by top so a glyph's rounding is
 * never a second line): `voice-guest`'s measure, retyped, since a board's
 * folder leaves when the board retires.
 */
function lineCount(el: Element | null): number {
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
 * `data-ld-words`, and what production's own pieces say from strings they
 * render themselves (so they cannot carry a mark of ours), found by their own
 * structure: the not-found screen's headline and the line under it, the door
 * heading's eyebrow, title and reason, and the held door's live mark. A piece
 * inside another that is read already is not read twice.
 */
const WORDS = [
  "[data-ld-words]",
  "[data-not-found] h1",
  "[data-not-found] h1 ~ p",
  "[data-door-heading] > *",
  "[data-door-waiting] > p",
].join(", ");
const TITLE =
  "[data-ld-title], [data-not-found] h1, [data-door-heading] .font-heading";

export function messageOf(root: HTMLElement): string {
  const found = Array.from(root.querySelectorAll(WORDS));
  return found
    .filter((el) => !found.some((o) => o !== el && o.contains(el)))
    .map(textOf)
    .filter(Boolean)
    .join(" ");
}

/**
 * What of the album the drawing shows, found by what it contains rather than
 * by the option's name: the album's name anywhere in the page (behind the
 * scrim counts: it is there to be read), the host's face, the album's own
 * photographs.
 */
function showsOf(root: HTMLElement): string {
  const page = textOf(root);
  const name = page.includes(EVENT.name);
  const host = !!root.querySelector("[data-ld-shows='host']");
  const photos = root.querySelectorAll("[data-ld-shows='photo']").length;
  const said = [
    name && "its name",
    host && `its host's face (${HOST.name})`,
    photos > 0 && `${photos} of its photographs`,
  ].filter(Boolean) as string[];
  if (!said.length) return "shows nothing of the album";
  const last = said.pop();
  return `shows ${said.length ? `${said.join(", ")} and ${last}` : last}`;
}

/**
 * Whose light the door wears, off the lit pieces' own attribute: the album's
 * sampled hues, or the house five (nothing of a closed album may be sampled).
 */
function lightOf(root: HTMLElement): string {
  const lit = Array.from(root.querySelectorAll("[data-door-hues]"));
  if (!lit.length) return "no light of its own";
  const house = HOUSE_HUES.slice(0, 3).map(Math.round).join(",");
  const worn = new Set(lit.map((el) => el.getAttribute("data-door-hues")));
  const album = [...worn].filter((h) => h && h !== house);
  return album.length
    ? `lit by the album's own hues (${album[0]!.split(",").join(", ")})`
    : "lit by the house five";
}

/**
 * Which way on the foot offers, read off the shut door's own marks (the
 * unlisted ask, the way back in) and the way out's words.
 */
function footOf(root: HTMLElement): string | null {
  if (root.querySelector("[data-shut-door-ask]"))
    return "the ask drawn (unlisted)";
  if (root.querySelector("[data-shut-door-back-in]"))
    return "the back-in line drawn";
  const out = Array.from(root.querySelectorAll("a, button")).some(
    (el) => textOf(el) === WAY_OUT,
  );
  return out ? "one way out" : null;
}

/**
 * THE CAPTION UNDER A DOOR: the message's size (the words, and the headline's
 * lines, since a headline that wraps to three at 375 is exactly what a door
 * board exists to catch), what it shows, its light, the sheet's height where
 * it stands in one, and the foot.
 */
export const measureDoor =
  (screenH: number): Probe =>
  (root) => {
    const title = root.querySelector(TITLE);
    const message = messageOf(root);
    const titleLines = lineCount(title);
    if (!message || !titleLines) return null;
    const parts = [
      `${wordCount(message)} words, the headline on ${lines(titleLines)}`,
      showsOf(root),
      lightOf(root),
    ];
    const sheet = root.querySelector<HTMLElement>("[data-entry-sheet]");
    if (sheet) {
      const h = Math.round(sheet.getBoundingClientRect().height);
      if (!h) return null;
      parts.push(
        `the sheet stands ${h}px, ${Math.round((h / screenH) * 100)}% of the screen`,
      );
    } else {
      parts.push("a page, no sheet");
    }
    const foot = footOf(root);
    if (foot) parts.push(foot);
    return `Measured: ${parts.join("; ")}.`;
  };

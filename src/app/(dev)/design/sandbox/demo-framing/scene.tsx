"use client";

import {
  type MouseEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useState,
} from "react";

import { Fit, Frame, Measured } from "@/components/lab";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN: a real viewport at a real width, the
 * real marketing and guest pieces portalled into it (the kit's `Frame`, a
 * same-origin iframe). Nothing here reaches a session, a Server Function or
 * the network, and nothing mounts a Radix portal: a Dialog or Sheet opened in
 * a portalled frame renders on the lab page's document, not the screen being
 * judged, so the demo's welcome sheet is QUOTED, never opened.
 *
 * ★ A SCREEN IS THE DEVICE'S OWN SCREEN (1440 by 900, 375 by 812): the hero
 * is exactly one screen tall, so its air and the card's place are only true
 * at a real height, and the album's first row is only where it is under a
 * real phone's fold.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: the link the card
 * prints and whether it fits its column, the count on its chip, the album's
 * title and stats, the welcome's sentence. If a caption and the words above a
 * frame disagree, the caption is the truth.
 */

export const SCREENS = {
  "1440": { w: 1440, h: 900 },
  "375": { w: 375, h: 812 },
} as const;

export type ScreenId = keyof typeof SCREENS;

export type Reader = (root: HTMLElement, win: Window) => string | null;

export function Scene({
  id,
  screen,
  title,
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  measure: Reader;
  children: ReactNode;
}) {
  const { w, h } = SCREENS[screen];
  const [caption, setCaption] = useState("measuring");
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={title}
        caption={caption}
        onApproach
      >
        <Measured
          probe={measure}
          deps={[id, screen]}
          onMeasure={setCaption}
          timers={[200, 900, 1800, 3200]}
          className="size-full"
        >
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/**
 * THE FRAMES OF ONE OPTION: the laptop first and alone (two 1440 frames side
 * by side would each be a thumbnail), the phones after it in one row, read
 * left to right as a visitor moves through them.
 */
export function Story({
  desk,
  phones,
  note,
}: {
  desk?: ReactNode;
  phones: ReactNode;
  /** One line under the frames: what the stand-ins stand in for. */
  note?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      {desk}
      <div className="flex flex-wrap items-start gap-6">{phones}</div>
      {note}
    </div>
  );
}

/**
 * THE CINEMA ROOM, as `(cinema)/layout.tsx` wraps every dark marketing page:
 * the descendant-scoped `dark` flip, `data-mkt` (the marketing tokens and
 * grammar are scoped to it) and the cinema skin.
 */
export function CinemaRoom({ children }: { children: ReactNode }) {
  return (
    <div
      className="dark h-full overflow-x-clip bg-background text-foreground"
      data-mkt
      data-mkt-skin="cinema"
    >
      {children}
    </div>
  );
}

/**
 * ★ A REAL <Link> IN A BOARD IS A TRAP THE BOARD DISARMS ITSELF: a frame is a
 * document of its own, so a press on the card, the eyebrow or a header link
 * would navigate the frame away from the page being judged. Every drawing
 * roots in this.
 */
export function stopLinks(e: MouseEvent) {
  if ((e.target as HTMLElement).closest?.("a[href]")) e.preventDefault();
}

/**
 * WHETHER THIS DRAWING IS OFF THE STAGE. The step draws every option at once
 * and hides all but one, which an IntersectionObserver still counts as on
 * screen, so every band would run for the one a reader sees. The step marks a
 * hidden option `data-paused`; a drawing lives in a frame's document, so it
 * finds that mark through the frame's own element.
 */
export function useOffStage(ref: RefObject<HTMLElement | null>): boolean {
  const [off, setOff] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const frame = el.ownerDocument.defaultView?.frameElement ?? null;
    const view = (frame ?? el).closest("[data-lab-view]");
    if (!view) return;
    const sync = () => setOff(view.hasAttribute("data-paused"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(view, { attributes: true, attributeFilter: ["data-paused"] });
    return () => mo.disconnect();
  }, [ref]);
  return off;
}

/* ── what the frames read ─────────────────────────────────────────────── */

/** An element's own words, whitespace folded. */
export const textOf = (el: Element | null | undefined) =>
  ((el as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim();

const px = (n: number) => `${Math.round(n)} px`;

/**
 * THE CARD, AS A VISITOR READS IT: the link it prints, what its chip counts,
 * and whether the slug sets whole in its column. The slug is `truncate`d in
 * production, so a long one is cut with an ellipsis rather than wrapped: the
 * type's own width is read off a Range over its text (the ellipsis is paint,
 * so the laid-out line keeps its whole length), against the column's box.
 */
export const cardSays: Reader = (root) => {
  const slug = root.querySelector<HTMLElement>("[data-df-slug]");
  const rest = textOf(root.querySelector("[data-df-rest]"));
  if (!slug || slug.clientWidth < 1) return null;
  const range = slug.ownerDocument.createRange();
  range.selectNodeContents(slug);
  const type = range.getBoundingClientRect().width;
  const column = slug.getBoundingClientRect().width;
  if (type < 1) return null;
  const link = `${textOf(root.querySelector("[data-df-domain]"))}${slug.textContent ?? ""}`;
  const fit =
    type > column + 0.5
      ? `the slug is cut: ${px(type)} of type in a ${px(column)} column`
      : `the slug sets whole, ${px(type)} of its ${px(column)}`;
  return `The card: ${link}, chip "${rest}"; ${fit}`;
};

/** The album's head, as the page says it: the title, then the stats line. */
export const albumSays: Reader = (root) => {
  const title = textOf(root.querySelector("[data-df-title]"));
  const stats = textOf(root.querySelector("[data-df-stats]"));
  const host = textOf(root.querySelector("[data-df-host]"));
  if (!title || !stats) return null;
  const row = root.querySelectorAll(
    "[data-df-first-row] [data-df-tile]",
  ).length;
  return `The album: "${title}", hosted by ${host}; ${stats}; ${row} photographs in its first row`;
};

/** The welcome's two sentences with a name in them, as the sheet sets them. */
export const welcomeSays: Reader = (root) => {
  const at = textOf(root.querySelector("[data-df-welcome-at]"));
  const as = textOf(root.querySelector("[data-df-welcome-as]"));
  if (!at || !as) return null;
  return `The welcome: "${at}"; "${as}"`;
};

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
 * the network, and the demo's welcome sheet is QUOTED, not opened: a portalled
 * frame hands a Radix layer its own body now (`portal-container.tsx`), so a
 * real one would land in the screen; mounting production's own is ROADMAP's
 * line.
 *
 * ★ A SCREEN IS THE DEVICE'S OWN SCREEN (1440 by 900, 375 by 812): the hero
 * is exactly one screen tall, so its air and the object's place are only true
 * at a real height. A `card` screen is the one exception, and says so: a
 * close-up of the card at a desk's size, at rest and under a pointer, which
 * no single real screen can show at once.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: the address the card
 * prints and whether each address the loop types sets whole in its column,
 * the album's title, the welcome's sentence, how far the card rises. If a
 * caption and the words above a frame disagree, the caption is the truth.
 */

export const SCREENS = {
  "1440": { w: 1440, h: 900 },
  "375": { w: 375, h: 812 },
  card: { w: 1100, h: 460 },
  plate: { w: 1100, h: 640 },
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
          timers={[200, 900, 1800, 3000]}
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
 * by side would each be a thumbnail), the loop's score right under it where
 * the motion is judged, the phones after it in one row, read left to right,
 * then any second screen, and a line under them.
 */
export function Story({
  desk,
  score,
  phones,
  after,
  note,
}: {
  desk?: ReactNode;
  /** The loop's score, under the laptop it describes. */
  score?: ReactNode;
  phones?: ReactNode;
  /** A second screen of the same option (the QR code page's), after the first. */
  after?: ReactNode;
  /** Under the frames: what the stand-ins stand in for. */
  note?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      {desk}
      {score}
      {phones ? (
        <div className="flex flex-wrap items-start gap-6">{phones}</div>
      ) : null}
      {after ? <div className="flex flex-col gap-6">{after}</div> : null}
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
 * document of its own, so a press on the card or a header link would navigate
 * the frame away from the page being judged. Every drawing roots in this.
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
 * EVERY ADDRESS THE OBJECT PRINTS, SET IN ITS OWN COLUMN, measured: a probe in
 * the slug's own line, in its font, holds each address in turn, and its width
 * is read against the room the line leaves it (the column less the caret and
 * the touch's mark). The slug is `truncate`d, so an address that does not fit
 * is cut with an ellipsis rather than wrapped; this is where that shows.
 */
function fitOf(root: HTMLElement, addresses: readonly string[]) {
  const line = root.querySelector<HTMLElement>("[data-df-slug]");
  const typed = line?.querySelector<HTMLElement>("[data-df-typed]");
  if (!line || !typed || line.clientWidth < 1) return null;
  const doc = line.ownerDocument;
  const room =
    line.getBoundingClientRect().width -
    [...line.children]
      .filter((c) => c !== typed)
      .reduce(
        (w, c) => w + (c as HTMLElement).getBoundingClientRect().width,
        0,
      );
  const probe = doc.createElement("span");
  probe.style.cssText =
    "position:absolute;visibility:hidden;white-space:nowrap";
  line.appendChild(probe);
  let widest = { slug: "", w: 0 };
  const cut: string[] = [];
  for (const a of addresses) {
    probe.textContent = a;
    const w = probe.getBoundingClientRect().width;
    if (w > widest.w) widest = { slug: a, w };
    if (w > room + 0.5) cut.push(a);
  }
  probe.remove();
  return { widest, room, cut };
}

/** The object's link, as a visitor reads it, and how every address it prints fits. */
export function addressSays(
  what: string,
  addresses: readonly string[],
): Reader {
  return (root) => {
    const domain = textOf(root.querySelector("[data-df-domain]"));
    const own =
      root.querySelector<HTMLElement>("[data-df-typed]")?.dataset.dfOwn ?? "";
    const rest = textOf(root.querySelector("[data-df-rest]"));
    const fit = fitOf(root, addresses);
    if (!fit || !own || !domain) return null;
    const chip = rest ? `, chip "${rest}"` : "";
    const types =
      addresses.length > 1 ? `; types ${addresses.slice(1).join(", ")}` : "";
    const sets =
      fit.cut.length > 0
        ? `CUT: ${fit.cut.join(", ")} past its ${px(fit.room)}`
        : `${addresses.length > 1 ? "the longest, " : ""}${fit.widest.slug}, sets whole, ${px(fit.widest.w)} of its ${px(fit.room)}`;
    return `${what}: ${domain}${own}${chip}${types}; ${sets}`;
  };
}

/** The album's head, as the page says it: the title, then the stats line. */
export const albumSays: Reader = (root) => {
  const title = textOf(root.querySelector("[data-df-title]"));
  const stats = textOf(root.querySelector("[data-df-stats]"));
  const host = textOf(root.querySelector("[data-df-host]"));
  if (!title || !stats) return null;
  return `The album: "${title}", hosted by ${host}; ${stats}`;
};

/** The welcome's two sentences with a name in them, as the sheet sets them. */
export const welcomeSays: Reader = (root) => {
  const at = textOf(root.querySelector("[data-df-welcome-at]"));
  const as = textOf(root.querySelector("[data-df-welcome-as]"));
  if (!at || !as) return null;
  return `The welcome: "${at}"; "${as}"`;
};

/** The QR code page's hero, as its first screen says it. */
export function qrSays(addresses: readonly string[]): Reader {
  const card = addressSays("its card", addresses);
  return (root, win) => {
    const h1 = textOf(root.querySelector("h1"));
    const frames = root.querySelectorAll(".hhs-card").length;
    const said = card(root, win);
    if (!h1 || !said) return null;
    return `The QR code page: "${h1}", the stream's ${frames} frames pouring from ${said}`;
  };
}

/**
 * WHAT THE TOUCH SHOWS, read off the specimen: the mark at rest (if any, and
 * its size) and how far the lifted card stands above the one at rest.
 */
export const touchSays: Reader = (root) => {
  const cards = root.querySelectorAll<HTMLElement>("[data-hero-object]");
  if (cards.length < 2) return null;
  // Each object against its own cell: the cells stand side by side, or one
  // over the other for the address plate.
  const inCell = (el: HTMLElement) =>
    el.getBoundingClientRect().top -
    (el.closest("[data-df-cell]")?.getBoundingClientRect().top ?? 0);
  const rest = inCell(cards[0]);
  const up = inCell(cards[1]);
  const mark = root.querySelector<HTMLElement>("[data-df-touch]");
  const kind = mark?.dataset.dfTouch;
  // The mark's own ink (the arrow's svg, the dot), never the room round it.
  const ink = mark?.querySelector("svg") ?? mark?.firstElementChild ?? mark;
  const size = ink ? px(ink.getBoundingClientRect().width) : "";
  const shown =
    kind === "arrow"
      ? `an arrow after the address, ${size}`
      : kind === "live"
        ? `the live dot before the domain, ${size}`
        : root.querySelector("[data-df-swell]")
          ? "no mark; the lamp swells every few seconds"
          : "nothing";
  return `At rest: ${shown}. Under the pointer: it rises ${px(rest - up)} and its fan opens`;
};

"use client";

import { type ReactNode, type RefObject, useEffect, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { decodedOf } from "./code";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN: a real viewport at a real width, the
 * real marketing and guest pieces portalled into it (the kit's `Frame`, a
 * same-origin iframe). Nothing here reaches a session, a Server Function or
 * the network.
 *
 * ★ A SCREEN IS THE DEVICE'S OWN SCREEN (1440 by 900, a tablet held upright
 * at 820 by 1180, 375 by 812): the hero is exactly one screen tall, so its air
 * and the object's place are only true at a real height. A `close` screen is
 * the one exception, and says so: the object at a desk's size, at rest and
 * under a pointer side by side, which no single real screen can show at once.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: the address's size
 * against the headline's, what the drawn code says when a camera reads it and
 * how large its modules are, the card's words, the credits on the
 * photographs, how far the object rises. If a caption and the words above a
 * frame disagree, the caption is the truth.
 */

export const SCREENS = {
  "1440": { w: 1440, h: 900 },
  tablet: { w: 820, h: 1180 },
  "375": { w: 375, h: 812 },
  close: { w: 1100, h: 420 },
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
 * the motion is judged, the tablet and the phone after it in one row, read
 * left to right, then any second screen.
 */
export function Story({
  desk,
  score,
  row,
  after,
}: {
  desk?: ReactNode;
  /** The loop's score, under the laptop it describes. */
  score?: ReactNode;
  /** The smaller screens, side by side. */
  row?: ReactNode;
  /** A second screen of the same option, after the first. */
  after?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      {desk}
      {score}
      {row ? (
        <div className="flex flex-wrap items-start gap-6">{row}</div>
      ) : null}
      {after ? <div className="flex flex-col gap-6">{after}</div> : null}
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

/** A computed font size, in whole px. */
const sizeOf = (el: Element | null, win: Window) =>
  el ? Math.round(Number.parseFloat(win.getComputedStyle(el).fontSize)) : 0;

/**
 * A phone reads a code off a screen from about 3 px a module (the demo
 * modal's own floor): under it the code is a picture a phone visitor taps.
 */
const SCAN_PX = 3;

/** What a code says, read off the frame by a camera's own reader. */
function codeSays(code: SVGSVGElement, win: Window): string | null {
  const modules = Number(code.dataset.dfModules ?? 0);
  const each = code.getBoundingClientRect().width / Math.max(1, modules);
  const read = decodedOf(code, win);
  if (read === null) return null;
  const heard =
    read === "unread"
      ? "no barcode reader in this browser to read it"
      : read === "nothing"
        ? "a camera reads nothing"
        : `a camera reads ${read.replace(/^https?:\/\//, "")}`;
  const kind = each >= SCAN_PX ? "a scan off a screen" : "a picture to tap";
  return `Its code: ${modules} modules at ${each.toFixed(1)} px each, ${kind}; ${heard}`;
}

/**
 * THE HERO, AS A VISITOR READS IT: the address and its size against the
 * headline's (his "so it doesn't fight with the H1"), the hosts' addresses it
 * types, the code (how large its modules are, and what a camera reads off the
 * drawn code), the card's words, and the credits on the photographs.
 */
export function heroSays(addresses: readonly string[]): Reader {
  return (root, win) => {
    const domain = textOf(root.querySelector("[data-df-domain]"));
    const own =
      root.querySelector<HTMLElement>("[data-df-typed]")?.dataset.dfOwn ?? "";
    const line = root.querySelector("[data-df-line]");
    const h1 = root.querySelector("h1");
    const object = root.querySelector("[data-hero-object]");
    if (!domain || !own || !line || !h1 || !object) return null;
    const types =
      addresses.length > 1 ? `; types ${addresses.slice(1).join(", ")}` : "";
    // The air between the object's foot and the headline's line box.
    const air =
      h1.getBoundingClientRect().top - object.getBoundingClientRect().bottom;
    const said = [
      `The address: ${domain}${own} at ${px(sizeOf(line, win))}, ${px(air)} over a ${px(sizeOf(h1, win))} headline${types}`,
    ];
    const code = root.querySelector<SVGSVGElement>("svg[data-df-live]");
    if (code) {
      const c = codeSays(code, win);
      if (c === null) return null;
      said.push(c);
    }
    const card = root.querySelector("[data-df-card]");
    if (card)
      said.push(
        `The card: "${textOf(card.querySelector("[data-df-title]"))}", ${textOf(card.querySelector("[data-df-meta]"))}`,
      );
    const credits = root.querySelectorAll("[data-df-credit]").length;
    const frames = root.querySelectorAll(".hhs-card").length;
    if (frames > 0) said.push(`${credits} of ${frames} photographs credited`);
    return said.join(". ");
  };
}

/**
 * THE SETTLED TOUCH, READ OFF THE CLOSE FRAME: the arrow at rest and how far
 * the object and its arrow move under a pointer.
 */
export const touchSays: Reader = (root) => {
  const objects = root.querySelectorAll<HTMLElement>("[data-hero-object]");
  if (objects.length < 2) return null;
  const inCell = (el: HTMLElement) =>
    el.getBoundingClientRect().top -
    (el.closest("[data-df-cell]")?.getBoundingClientRect().top ?? 0);
  const arrows = root.querySelectorAll<HTMLElement>("[data-df-touch] svg");
  const ink = arrows[0];
  if (!ink) return null;
  const rise = inCell(objects[0]) - inCell(objects[1]);
  return `At rest: an arrow after the address, ${px(ink.getBoundingClientRect().width)}. Under the pointer: the object rises ${px(rise)}, its shadow deepens and the arrow nudges toward where it goes`;
};

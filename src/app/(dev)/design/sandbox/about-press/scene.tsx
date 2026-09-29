"use client";

import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { Fit, Frame, Measured } from "@/components/lab";

/**
 * THE TWO SCREENS EVERY OPTION IS READ ON, AND WHAT EACH ONE SAYS IT SHOWS.
 *
 * ★ A REAL VIEWPORT AT A DEVICE'S OWN SIZE (1440 by 900, 375 by 812): About's
 * hero is a `display` lockup on a `vw` clamp, the gather straddles the cut by a
 * percentage of its stage, and the kit's plates reflow from four across to
 * two, so only a same-origin frame at the true width shows what a reader gets.
 * The whole page is drawn in each frame, and the frame opens scrolled to the
 * place the decision changes (the kit, else the facts, else the close), a
 * fifth of a screen under its top, so the tail of the convictions reads above
 * it. The frame scrolls, so the rest of the page is one flick away.
 *
 * ★ NOTHING HERE REACHES A SESSION OR THE NETWORK beyond the page's own images:
 * a link pressed in a drawing goes nowhere (the lab's router would take it),
 * and the header and footer are inert, because a nav panel or the demo's modal
 * portals onto the LAB's document, never the frame's.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER COMPUTED: how tall the kit is,
 * how many plates it shows, whether four facts are in it, and how long the
 * page runs. A drawing marks what it shows with `data-ap-*` and the reader
 * reads those marks back. If a caption and the words above a frame disagree,
 * the caption is the truth.
 */

export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;

export type ScreenId = keyof typeof SCREENS;

/** A link pressed inside a drawing goes nowhere: a frame is its own document. */
export function stopLinks(e: MouseEvent) {
  if ((e.target as HTMLElement).closest?.("a[href]")) e.preventDefault();
}

export type Reader = (root: HTMLElement, win: Window) => string | null;

/** The share of a screen left above the place a frame opens on. */
const LEAD = 0.2;

/**
 * OPENS THE FRAME AT THE PLACE THE DECISION CHANGES, and then leaves it alone.
 *
 * The page settles late (the webfont, the gather's photographs), so the scroll
 * is set again on a short schedule, and the first wheel, touch or key in the
 * frame ends it: a reader who has started scrolling is never pulled back. A
 * hidden option (the step stacks every option in one cell, `visibility:
 * hidden`) keeps its layout, so it opens in the right place too.
 */
function OpenAt({
  deps,
  children,
}: {
  deps: unknown[];
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    let touched = false;
    const stop = () => {
      touched = true;
    };
    const go = () => {
      if (touched) return;
      const target = el.querySelector<HTMLElement>("[data-ap-focus]");
      if (!target) return;
      const top =
        target.getBoundingClientRect().top +
        win.scrollY -
        win.innerHeight * LEAD;
      win.scrollTo({ top: Math.max(0, Math.round(top)), behavior: "instant" });
    };
    win.addEventListener("wheel", stop, { passive: true });
    win.addEventListener("touchstart", stop, { passive: true });
    win.addEventListener("keydown", stop);
    go();
    const timers = [150, 600, 1400, 2600, 4000].map((ms) =>
      win.setTimeout(go, ms),
    );
    return () => {
      timers.forEach((t) => win.clearTimeout(t));
      win.removeEventListener("wheel", stop);
      win.removeEventListener("touchstart", stop);
      win.removeEventListener("keydown", stop);
    };
    // The deps are the caller's: a new drawing is a new place to open on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <div ref={ref}>{children}</div>;
}

/** One screen: the frame, zoomed to the room it has, captioned by what it reads. */
export function Scene({
  id,
  screen,
  title,
  read,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  read: Reader;
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
          probe={read}
          deps={[id, screen]}
          onMeasure={setCaption}
          timers={[300, 1200, 2600, 4200]}
        >
          <OpenAt deps={[id, screen]}>{children}</OpenAt>
        </Measured>
      </Frame>
    </Fit>
  );
}

/* ── what the frames read ─────────────────────────────────────────────── */

const px = (n: number) => `${Math.round(n).toLocaleString("en-US")} px`;

const heightOf = (el: Element | null) =>
  el ? (el as HTMLElement).getBoundingClientRect().height : 0;

/** What each kit's block is called in a caption, by the mark it carries. */
const KIT_NAME: Record<string, string> = {
  chapter: "The chapter",
  band: "The band",
  line: "The close's line",
};

/**
 * THE PAGE, AS A READER MEETS IT AT THE KIT: which kit it holds and how tall,
 * how many plates it shows, where the four facts sit if any, and how long the
 * page runs. `null` until the page has laid out its photographs and type.
 */
export const readPage: Reader = (root) => {
  const page = root.querySelector<HTMLElement>("[data-ap-page]");
  if (!page) return null;
  const total = heightOf(page);
  if (total < 1500) return null;
  const kit = root.querySelector<HTMLElement>("[data-ap-kit]");
  const facts = root.querySelector<HTMLElement>("[data-ap-facts]");
  const parts: string[] = [];
  if (kit) {
    const plates = kit.querySelectorAll(
      "[data-ap-plate], [data-mkt-isolate-item]",
    ).length;
    const name = KIT_NAME[kit.dataset.apKit ?? ""] ?? "The kit";
    // The story's own height beside it, so "as tall as" is read, not said.
    const story = heightOf(root.querySelector("[data-ap-story]"));
    parts.push(
      `${name}: ${plates === 0 ? "no plates" : `${plates} plates`}, ${px(heightOf(kit))} tall (the story: ${px(story)})`,
    );
  } else {
    parts.push("No kit");
  }
  if (facts) {
    const n = facts.querySelectorAll("[data-ap-fact]").length;
    const inside = kit?.contains(facts);
    parts.push(
      inside
        ? `${n} facts inside it`
        : `${n} facts after the convictions, ${px(heightOf(facts))}`,
    );
  }
  return `${parts.join("; ")}. The page runs ${px(total)}.`;
};

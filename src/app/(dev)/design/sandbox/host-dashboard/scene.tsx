"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./knobs";

/**
 * THE FRAMES EVERY DECISION DRAWS IN: the dashboard at 1440 by 900 (a laptop,
 * the default) or 375 by 812 (a phone, on the Screen knob), 1:1 in the kit's
 * `Frame`, a same-origin iframe, so a line wraps where it will wrap.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK beyond the
 * stills and the code's renderer: the page is production's components fed the
 * fixtures, an event pressed opens a stand-in of its page, the router they ask
 * is the board's (`shell.tsx`), and the two presses in production's events list
 * that would call a Server Function (the view's cookie, a bin's Restore) are
 * caught before they reach it (`dashboard.tsx`).
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: how many events its
 * first screen shows, how far her next old event is, what the stage leads with.
 * If a caption and the words above a frame disagree, the caption is the truth.
 */

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
  const [measured, setMeasured] = useState("measuring");
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={title}
        caption={measured}
      >
        <Measured
          probe={measure}
          deps={[id, screen]}
          onMeasure={setMeasured}
          timers={[400, 1400, 2600, 4000]}
          className="min-h-full"
        >
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/** The frames of one option, side by side: laptops wrap two to a row, phones stand in one. */
export function Story({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  return (
    <div
      className="flex flex-wrap items-start gap-6"
      style={screen === "1440" ? { maxWidth: 2 * 1440 + 24 } : undefined}
    >
      {children}
    </div>
  );
}

/* ── what the frames read ──────────────────────────────────────────────── */

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

function seen(el: Element, win: Window): boolean {
  const r = el.getBoundingClientRect();
  return (
    // An open year keeps its thumbnail line in place, invisible.
    win.getComputedStyle(el).visibility !== "hidden" &&
    r.width > 0 &&
    r.height > 0 &&
    r.bottom > 0 &&
    r.top < win.innerHeight &&
    r.right > 0 &&
    r.left < win.innerWidth
  );
}

/**
 * Every event the page links to below the stage, by id: the tiles, the rows, a
 * folded year's thumbnails, the Recent row. An event's own page is
 * `/dashboard/<id>`; a guest album's is `/e/<token>`, named by its tile.
 */
function eventLinks(root: HTMLElement): Map<string, HTMLElement[]> {
  const out = new Map<string, HTMLElement[]>();
  for (const a of root.querySelectorAll<HTMLAnchorElement>(
    "[data-hd-collection] a[href]",
  )) {
    const href = a.getAttribute("href") ?? "";
    const id =
      href.match(/^\/dashboard\/([^/?#]+)/)?.[1] ??
      (href.startsWith("/e/") ? href : null);
    if (!id || id === "new") continue;
    out.set(id, [...(out.get(id) ?? []), a]);
  }
  return out;
}

/** A name for a folded or open year the page draws (production's `data-season`). */
function folds(root: HTMLElement): string[] {
  return [...root.querySelectorAll<HTMLElement>("[data-folded]")].map(
    (el) =>
      `${el.dataset.season?.replace("year-", "") ?? "a year"} folded (${el.dataset.folded})`,
  );
}

/**
 * THE COLLECTION, AS ITS FIRST SCREEN SHOWS IT: how many events are on screen
 * of how many, the pieces the option adds, and (where she has been saving old
 * weddings) how far the nearest of them is.
 */
export function readEvents(her: readonly string[] = []): Reader {
  return (root, win) => {
    if (root.querySelector("[data-hd-stand-in]")) return "an event is open";
    const links = eventLinks(root);
    if (links.size === 0) return null;
    // A folded year's thumbnail (44px, no name) is on screen without being readable there.
    const named = (el: HTMLElement) =>
      seen(el, win) && el.getBoundingClientRect().width > 60;
    const thumb = (el: HTMLElement) => seen(el, win) && !named(el);
    const all = [...links.values()];
    const shown = all.filter((els) => els.some(named)).length;
    const thumbs = all.filter(
      (els) => !els.some(named) && els.some(thumb),
    ).length;
    const parts = [
      `${shown} of ${links.size} events named on the first screen${thumbs ? `, ${thumbs} more as thumbnails` : ""}`,
    ];
    const recent = root.querySelector<HTMLElement>("[data-hd-recent]");
    if (recent) parts.push(`Recent holds ${recent.dataset.hdRecent}`);
    if (root.querySelector("[data-hd-display]")) parts.push("a Display menu");
    const list = root.querySelector<HTMLElement>("[data-hd-list]");
    if (list) parts.push(`a list of ${list.dataset.hdList}`);
    parts.push(...folds(root));
    if (her.length) {
      const on = her.filter((id) => (links.get(id) ?? []).some(named));
      const tops = her
        .filter((id) => !on.includes(id))
        .map((id) =>
          Math.min(
            ...(links.get(id) ?? [])
              .filter((el) => el.getBoundingClientRect().width > 60)
              .map((el) => Math.abs(el.getBoundingClientRect().top)),
          ),
        )
        .filter(Number.isFinite);
      const far = tops.length
        ? `, the nearest other ${(Math.min(...tops) / win.innerHeight).toFixed(1)} screens away`
        : on.length < her.length
          ? ", the others only as thumbnails"
          : "";
      parts.push(`her three weddings: ${on.length} named on screen${far}`);
    }
    return parts.join("; ");
  };
}

/** WHAT LEADS: the stage's event, its word, and the host's control on it if the option draws one. */
export const readStage: Reader = (root) => {
  const stage = root.querySelector<HTMLElement>("[data-stage]");
  if (!stage) return root.querySelector("[data-hd-page]") ? "no stage" : null;
  const word = stage.querySelector<HTMLElement>("[data-stage-word]");
  const what = `${stage.getAttribute("aria-label")}, ${(word?.innerText ?? "").trim().toLowerCase()}`;
  const tall = Math.round(stage.getBoundingClientRect().height);
  const parts = [
    stage.dataset.stage === "rest"
      ? `the stage rests, one line ${tall} px tall: ${what}`
      : `the stage: ${what}, ${tall} px tall`,
  ];
  const pick = root.querySelector<HTMLElement>("[data-hd-pick]");
  if (pick)
    parts.push(`its control: ${pick.innerText.replace(/\s+/g, " ").trim()}`);
  const list = root.ownerDocument.querySelectorAll(
    "[data-hd-pick-item]",
  ).length;
  if (list) parts.push(`${plural(list, "event")} to pick from`);
  return parts.join("; ");
};

/** Two readers, one caption: each part must have settled. */
export const both =
  (a: Reader, b: Reader): Reader =>
  (root, win) => {
    const x = a(root, win);
    const y = b(root, win);
    return x && y ? `${x}; ${y}` : null;
  };

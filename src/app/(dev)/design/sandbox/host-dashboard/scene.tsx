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
 * Every event the collection links to, by id: the tiles, the table's lines,
 * the rows, the Recent row. An event's own page is `/dashboard/<id>`; a guest
 * album's is `/e/<token>`, named by its href.
 */
function eventLinks(root: HTMLElement, within: string): Map<string, HTMLElement[]> {
  const out = new Map<string, HTMLElement[]>();
  for (const a of root.querySelectorAll<HTMLAnchorElement>(`${within} a[href]`)) {
    const href = a.getAttribute("href") ?? "";
    const id =
      href.match(/^\/dashboard\/([^/?#]+)/)?.[1] ??
      (href.startsWith("/e/") ? href : null);
    if (!id || id === "new") continue;
    out.set(id, [...(out.get(id) ?? []), a]);
  }
  return out;
}

/**
 * HER EVENTS, AS THE FRAME SHOWS THEM: how many are named on screen of how
 * many she has, the layout and what it is set to, the Recent row, and (where a
 * frame sends her back for an old party) whether that party is on screen.
 */
export function readEvents(target?: string): Reader {
  return (root, win) => {
    if (root.querySelector("[data-hd-stand-in]")) return "an event is open";
    const all = eventLinks(root, "[data-hd-events]");
    const arranged = root.querySelector<HTMLElement>("[data-hd-arranged]");
    if (!arranged && all.size === 0) {
      return root.querySelector("[data-hd-page]")
        ? "no events below the stage"
        : null;
    }
    const named = [...all.values()].filter((els) =>
      els.some((el) => seen(el, win)),
    ).length;
    const parts = [
      `${named} of ${arranged?.dataset.hdCount ?? all.size} events on screen, as ${arranged?.dataset.hdArranged ?? "nothing"}`,
    ];
    const recent = root.querySelector<HTMLElement>("[data-hd-recent]");
    if (recent)
      parts.push(
        `Recent ${recent.hasAttribute("data-hd-recent-open") ? "open" : "folded"}, ${recent.dataset.hdRecent}`,
      );
    const said = root.querySelector<HTMLElement>("[data-hd-said]");
    if (said) parts.push(`set to ${said.innerText.replace(/Reset$/, "").trim()}`);
    const chips = [...root.querySelectorAll<HTMLElement>("[data-hd-chip]")]
      .map((c) => c.innerText.trim())
      .filter(Boolean);
    if (chips.length) parts.push(`chips: ${chips.join(", ")}`);
    const views = root.querySelector<HTMLElement>("[aria-label='Your views'] [aria-selected='true']");
    if (views) parts.push(`view: ${views.innerText.replace(/\s+/g, " ").trim()}`);
    const menu = root.ownerDocument.querySelector("[data-radix-popper-content-wrapper]");
    if (menu) parts.push("its menu open");
    if (target) {
      const els = (all.get(target) ?? []).filter((el) => !el.closest("[data-hd-recent]"));
      const on = els.some((el) => seen(el, win));
      const inRecent = (all.get(target) ?? []).some(
        (el) => el.closest("[data-hd-recent]") && seen(el, win),
      );
      parts.push(
        on
          ? "the old wedding on screen"
          : inRecent
            ? "the old wedding in Recent"
            : els.length
              ? `the old wedding ${(Math.min(...els.map((el) => Math.abs(el.getBoundingClientRect().top))) / win.innerHeight).toFixed(1)} screens away`
              : "the old wedding not in the list",
      );
    }
    return parts.join("; ");
  };
}

/** THE STAGE: its event, its word, the way it is drawn without photographs, and its readiness. */
export const readStage: Reader = (root) => {
  const stage = root.querySelector<HTMLElement>("[data-stage]");
  if (!stage) return root.querySelector("[data-hd-page]") ? "no stage" : null;
  const word = stage.querySelector<HTMLElement>("[data-stage-word]");
  const tall = Math.round(stage.getBoundingClientRect().height);
  const empty = stage.dataset.hdEmpty;
  const parts = [
    `${stage.getAttribute("aria-label")}, ${(word?.innerText ?? "").trim().toLowerCase()}, ${tall} px tall`,
    empty ? `no photos: ${empty}, lamp ${stage.dataset.hdLamp}` : "its photographs",
  ];
  const ticks = stage.querySelectorAll("[data-stage-ticks] li, [data-stage-rail] li");
  if (ticks.length) {
    const done = stage.querySelectorAll(
      "[data-stage-ticks] li[data-done], [data-stage-rail] li[data-done]",
    ).length;
    parts.push(`${done} of ${plural(ticks.length, "step")} done`);
  }
  if (stage.querySelector("[data-stage-plate]")) parts.push("the code on it");
  return parts.join("; ");
};

/** THE RULE: which one she keeps, what it leads with, and where its control stands. */
export const readRule: Reader = (root) => {
  const page = root.querySelector<HTMLElement>("[data-hd-page]");
  if (!page) return null;
  const control = root.querySelector<HTMLElement>("[data-hd-rule]");
  const settings = root.querySelector("[data-hd-settings]");
  const stage = root.querySelector<HTMLElement>("[data-stage]");
  const items = root.ownerDocument.querySelectorAll("[data-hd-rule-item]").length;
  const on = root.ownerDocument.querySelector<HTMLElement>(
    "[data-hd-rule-item][aria-checked='true']",
  );
  const parts = [
    settings
      ? "Settings open"
      : `leads with ${stage?.getAttribute("aria-label") ?? "nothing"}`,
  ];
  if (on) parts.push(`rule: ${on.dataset.hdRuleItem}`);
  else if (control) parts.push(`rule: ${control.dataset.hdRule}`);
  if (items) parts.push(`${plural(items, "rule")} to choose`);
  else if (!control) parts.push("no control on this page");
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

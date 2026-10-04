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
 * fixtures, an event pressed opens a stand-in of its page, and the router they
 * ask is the board's (`shell.tsx`).
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: what the stage leads
 * with and by which rule, where the chooser stands, what the head and the week
 * say. If a caption and the words above a frame disagree, the caption is the
 * truth.
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

/** THE STAGE: its event, its word, how it is drawn, and its readiness. */
export const readStage: Reader = (root) => {
  const stage = root.querySelector<HTMLElement>("[data-stage]");
  if (!stage) return root.querySelector("[data-hd-page]") ? "no stage" : null;
  const word = stage.querySelector<HTMLElement>("[data-stage-phase]");
  const tall = Math.round(stage.getBoundingClientRect().height);
  const parts = [
    `${stage.getAttribute("aria-label")}, ${(word?.textContent ?? "").trim().toLowerCase()}, ${tall} px tall`,
    stage.dataset.stageLit
      ? `no photos: lit by lamp ${stage.dataset.stageLit}`
      : "its photographs",
  ];
  const ticks = stage.querySelectorAll("[data-stage-rail] li");
  if (ticks.length) {
    const done = stage.querySelectorAll("[data-stage-rail] li[data-done]").length;
    parts.push(`${done} of ${plural(ticks.length, "step")} done`);
  }
  return parts.join("; ");
};

/** THE RULE: which one she keeps, what it leads with, and where its control stands. */
export const readRule: Reader = (root, win) => {
  const page = root.querySelector<HTMLElement>("[data-hd-page]");
  if (!page) return null;
  if (root.querySelector("[data-hd-stand-in]")) return "an event is open";
  const control = root.querySelector<HTMLElement>("[data-hd-rule]");
  const stage = root.querySelector<HTMLElement>("[data-stage]");
  const items = root.ownerDocument.querySelectorAll("[data-hd-rule-item]").length;
  const on = root.ownerDocument.querySelector<HTMLElement>(
    "[data-hd-rule-item][aria-checked='true']",
  );
  const parts = [`leads with ${stage?.getAttribute("aria-label") ?? "nothing"}`];
  const kept = on?.dataset.hdRuleItem ?? control?.dataset.hdRule;
  if (kept) parts.push(`rule: ${kept}`);
  if (control && stage) {
    // Where the control stands against the band: on it (its corner or its
    // words), over it, or under it, read off the two boxes.
    const c = control.getBoundingClientRect();
    const b = stage.getBoundingClientRect();
    const on =
      c.top >= b.top - 1 && c.bottom <= b.bottom + 1
        ? c.left > b.left + b.width / 2
          ? "on the band's right"
          : "on the band's left"
        : c.bottom <= b.top + 1
          ? "over the band"
          : "under the band";
    parts.push(`control ${on}, ${Math.round(c.width)} by ${Math.round(c.height)} px`);
  } else if (!control) parts.push("no control on this page");
  if (items) parts.push(`${plural(items, "rule")} shown`);
  const menu = root.ownerDocument.querySelector<HTMLElement>(
    "[data-radix-popper-content-wrapper], [data-slot='responsive-menu-rows'], [data-hd-choosing]",
  );
  if (menu && menu.getBoundingClientRect().width > 0) {
    const m = menu.getBoundingClientRect();
    parts.push(
      `choosing: ${Math.round(m.width)} px wide${m.right > win.innerWidth + 1 || m.left < -1 ? ", past the screen's edge" : ""}`,
    );
  }
  return parts.join("; ");
};

/**
 * THE DETAILS (H6): what the head's line says, where the storage ring stands
 * (beside the day's row or under it), the stage's count word, and the week's
 * parties with their words.
 */
export const readDetails: Reader = (root) => {
  const head = root.querySelector<HTMLElement>("[data-home-head]");
  if (!head) return null;
  const parts: string[] = [];
  const line = head.querySelector<HTMLElement>("p");
  if (line) parts.push(`head: "${line.innerText.trim()}"`);
  const day = head.querySelector<HTMLElement>("h1, h2");
  const ring = head.querySelector<HTMLElement>("[inert]");
  if (day && ring) {
    const d = day.getBoundingClientRect();
    const r = ring.getBoundingClientRect();
    parts.push(
      Math.abs(d.top + d.height / 2 - (r.top + r.height / 2)) < d.height / 2
        ? "ring in the day's row"
        : "ring under the day",
    );
  }
  const count = root.querySelector<HTMLElement>("[data-stage-numbers] dt");
  if (count) parts.push(`count: "${count.innerText.trim()}"`);
  const week = root.querySelector<HTMLElement>("[data-week]");
  if (week) {
    const cards = [...week.querySelectorAll<HTMLElement>("[data-week-card]")];
    parts.push(
      `this week: ${cards.length ? cards.map((c) => c.innerText.split("\n").filter(Boolean).slice(0, 2).join(", ")).join("; ") : "nothing"}`,
    );
  } else parts.push("no week");
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

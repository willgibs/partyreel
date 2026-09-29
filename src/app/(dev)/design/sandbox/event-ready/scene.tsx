"use client";

import { type ReactNode, useState } from "react";

import { type BoardState, Fit, Frame, Measured } from "@/components/lab";

/**
 * THE FRAMES A HOST IS READ IN, AND WHAT EACH ONE SAYS IT SHOWS.
 *
 * ★ A REAL VIEWPORT, NEVER A STYLED DIV: the hub's cards are a 2x2 grid under
 * 640 and a row from `sm`, Settings is the whole screen in a hand and a panel
 * at a desk, and the dashboard's grid grows columns with the window, so only a
 * same-origin frame at the true width shows the posture a host gets. 375 by
 * 812 is her phone (hosts set events up on phones); 1440 by 900 her laptop.
 *
 * ★ A MOMENT IS READ WHOLE: a row holds the moments one option is judged
 * across (an hour after Create, three photos in, the night before), phones
 * side by side in ONE zoom-fitted canvas so they keep one scale and one
 * baseline, laptops stacked, since three 1440 frames side by side would be
 * drawn at a fifth of their size.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK: every
 * drawing roots in `Inert`, which swallows a link's press (a Next link in a
 * portalled frame would navigate the LAB, since the router is the lab's), and
 * the settings drawn on production's provider write through inert fakes.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER COMPUTED: what the checklist
 * says and how many of its items are ticked, where it stands, how many
 * photographs the album shows, which chips the band holds. A drawing marks
 * what it shows with `data-er-*`, and the probe reads those marks back.
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;

export type ScreenId = keyof typeof SCREENS;

export const screenOf = (s: BoardState): ScreenId =>
  s.screen === "1440" ? "1440" : "375";

/** A link pressed inside a drawing goes nowhere (the lab's router would take it). */
export function Inert({ children }: { children: ReactNode }) {
  return (
    <div
      className="contents"
      onClickCapture={(e) => {
        const el = e.target as HTMLElement;
        if (el.closest?.("a[href]")) e.preventDefault();
      }}
      onSubmitCapture={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}

export type Probe = (root: HTMLElement, win: Window) => string | null;

const GAP = 24;

/** One frame; `bare` drops its own zoom-fit, for a frame in a row fitted as one canvas. */
export function Scene({
  id,
  screen,
  title,
  measure,
  h,
  bare = false,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  measure: Probe;
  /** A shorter frame than the screen's own (the code's header strip). */
  h?: number;
  bare?: boolean;
  children: ReactNode;
}) {
  const { w, h: screenH, name } = SCREENS[screen];
  const [caption, setCaption] = useState("measuring");
  const frame = (
    <Frame
      id={`${id}-${screen}`}
      w={w}
      h={h ?? screenH}
      title={`${title}, ${name}`}
      caption={caption}
      onApproach
    >
      <Measured
        probe={measure}
        deps={[id, screen]}
        onMeasure={setCaption}
        className="min-h-full"
      >
        <Inert>{children}</Inert>
      </Measured>
    </Frame>
  );
  return bare ? frame : <Fit w={w}>{frame}</Fit>;
}

export type StripFrame = { id: string; title: string; node: ReactNode };

/**
 * A STRIP OF FRAMES: phones side by side in one fitted canvas, laptops
 * stacked. `lede` is the one line above the row saying what it holds.
 */
export function Strip({
  screen,
  frames,
  lede,
  measure,
  h,
  perRow,
}: {
  screen: ScreenId;
  frames: readonly StripFrame[];
  lede?: ReactNode;
  measure: Probe;
  h?: number;
  /** Phones a row: a long strip breaks into rows so each phone keeps its size. */
  perRow?: number;
}) {
  const head = lede ? (
    <p className="max-w-3xl text-sm leading-snug text-muted-foreground">
      {lede}
    </p>
  ) : null;
  if (screen === "1440") {
    return (
      <div data-er-row className="flex flex-col gap-6">
        {head}
        {frames.map((f) => (
          <Scene
            key={f.id}
            id={f.id}
            screen="1440"
            title={f.title}
            measure={measure}
            h={h}
          >
            {f.node}
          </Scene>
        ))}
      </div>
    );
  }
  const n = Math.min(perRow ?? frames.length, frames.length);
  const w = n * SCREENS["375"].w + (n - 1) * GAP;
  const rows: StripFrame[][] = [];
  for (let i = 0; i < frames.length; i += n) rows.push(frames.slice(i, i + n));
  return (
    <div data-er-row className="flex flex-col gap-3">
      {head}
      <Fit w={w}>
        <div className="flex flex-col" style={{ gap: GAP }}>
          {rows.map((row, i) => (
            <div key={i} className="flex items-start" style={{ gap: GAP }}>
              {row.map((f) => (
                <Scene
                  key={f.id}
                  id={f.id}
                  screen="375"
                  title={f.title}
                  measure={measure}
                  h={h}
                  bare
                >
                  {f.node}
                </Scene>
              ))}
            </div>
          ))}
        </div>
      </Fit>
    </div>
  );
}

/* ── what the frames read back ───────────────────────────────────────────── */

const clean = (s: string | null | undefined) =>
  (s ?? "").replace(/\s+/g, " ").trim();

export const textOf = (el: Element | null | undefined) =>
  clean((el as HTMLElement | null)?.innerText);

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/** The checklist, wherever it stands, and the album beside it. */
export const measureReady: Probe = (root) => {
  const said: string[] = [];
  const list = root.querySelector<HTMLElement>("[data-er-list]");
  const launch = root.querySelectorAll("[data-er-launch-item]").length;
  if (list) {
    const where = list.dataset.erHome ?? "";
    const done = list.querySelectorAll("[data-er-item][data-done]").length;
    const all = list.querySelectorAll("[data-er-item]").length;
    const folded = list.hasAttribute("data-er-folded");
    const head = textOf(
      list.querySelector("[data-er-list-head] h2") ??
        list.querySelector("[data-er-list-head]"),
    );
    said.push(
      folded
        ? `the checklist folded to one line (${head})${where ? ` ${where}` : ""}`
        : `the checklist${where ? ` ${where}` : ""}: ${head}, ${done} of ${all} ticked`,
    );
  } else if (launch) {
    said.push(`the launch list: ${plural(launch, "thing")} left`);
  } else {
    said.push("no list on screen");
  }
  const count = root.querySelector<HTMLElement>("[data-er-card-count]");
  if (count) said.push(`the Settings card says "${textOf(count)}"`);
  const photos = root.querySelectorAll("[data-er-photo]").length;
  if (root.querySelector("[data-er-album]"))
    said.push(
      photos
        ? `the album shows ${plural(photos, "photo")}`
        : "the album is empty",
    );
  return said.join("; ");
};

/** Settings, one level at a time: its head, its rows or its page, and what walks on. */
export const measureSettings: Probe = (whole) => {
  // Settings is read off its own panel: a desk draws the hub behind it, and
  // the hub's own checklist is not Settings'.
  const root = whole.querySelector<HTMLElement>("[data-er-panel]") ?? whole;
  const said: string[] = [];
  const head = textOf(root.querySelector("[data-er-panel-title]"));
  if (head) said.push(`Settings at "${head}"`);
  const steps = root.querySelectorAll("[data-er-step]").length;
  const ticked = root.querySelectorAll("[data-er-step][data-done]").length;
  if (steps) said.push(`${plural(steps, "numbered step")}, ${ticked} ticked`);
  const rows = root.querySelectorAll("[data-settings-row]").length;
  if (rows && !steps) said.push(`${plural(rows, "row")}`);
  const list = root.querySelector("[data-er-list]");
  if (list) said.push("the checklist above the rows");
  const next = textOf(root.querySelector("[data-er-next]"));
  if (next) said.push(`its foot reads "${next}"`);
  const progress = textOf(root.querySelector("[data-er-progress]"));
  if (progress) said.push(progress);
  return said.join("; ") || null;
};

/** Create's card: its title, its steps, and the ways off it; else what she meets next. */
export const measureCreate: Probe = (root, win) => {
  const title = textOf(root.querySelector("[data-er-create-title]"));
  if (!title) {
    return root.querySelector("[data-er-panel]")
      ? measureSettings(root, win)
      : measureReady(root, win);
  }
  const steps = Array.from(root.querySelectorAll("[data-er-create-step]"))
    .map(textOf)
    .filter(Boolean);
  const doors = Array.from(root.querySelectorAll("[data-er-door-out]"))
    .map(textOf)
    .filter(Boolean);
  const list = root.querySelectorAll("[data-er-item]").length;
  return [
    `"${title}"`,
    steps.length && `steps ${steps.join(", ")}`,
    list && `a list of ${plural(list, "thing")} left`,
    doors.length && `ways on: ${doors.join(", ")}`,
  ]
    .filter(Boolean)
    .join("; ");
};

/** The dashboard's first band and the cards' lines. */
export const measureDash: Probe = (root) => {
  const band = root.querySelector("[aria-label='What needs you']");
  if (!band) return null;
  const chips = Array.from(band.querySelectorAll("li"))
    .map(textOf)
    .filter(Boolean);
  const quiet = chips.length === 0 ? textOf(band) : null;
  const lines = Array.from(root.querySelectorAll("[data-er-card-job]"))
    .map(textOf)
    .filter(Boolean);
  const said = [
    quiet ? `the band reads "${quiet}"` : `the band holds ${chips.join(" · ")}`,
    lines.length
      ? `the cards say ${lines.join(" · ")}`
      : "the cards carry no job",
  ];
  return said.join("; ");
};

/** The code, and what it wears for the door. */
export const measureCode: Probe = (root) => {
  const door = root.querySelector<HTMLElement>("[data-er-code]");
  if (!door) return null;
  const mark = door.querySelector<HTMLElement>("[data-er-code-mark]");
  const sign = textOf(door.querySelector("[data-er-code-sign]"));
  const dim = door.querySelector("[data-er-code-dim]");
  const said = [
    dim ? "the code dimmed" : "the code at full strength",
    mark
      ? `a mark reading "${mark.getAttribute("aria-label") ?? textOf(mark)}"`
      : null,
    sign ? `a line reading "${sign}"` : null,
  ].filter(Boolean);
  return said.join("; ");
};

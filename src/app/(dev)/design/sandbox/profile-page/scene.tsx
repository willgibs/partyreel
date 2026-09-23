"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";
import type { Control } from "@/components/lab/board-spec";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN: a real viewport with the real profile
 * and album components portalled into it. Never a route: `/u/[slug]` is a
 * server component that awaits an RPC, `getUser()` and two presign rounds, so
 * mounting it here would put a live Supabase read behind every tile on the
 * stage. The parts are imported and re-composed instead (profile.tsx).
 *
 * ★ 375 FIRST, 1440 ON THE KNOB. A profile is met on a phone: the only thing
 * that links to one is a chip on an album somebody is looking at while standing
 * at a party. 1440 is still a knob on every page decision, because a host puts
 * their handle in a bio and the people who follow it are at a desk.
 */
export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

/** Declared in spec.ts as pure data too: a spec a server page reads may not
 *  import a client module, so the knob is written twice on purpose and this
 *  copy is the one the scene reads. */
export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

export function Scene({
  id,
  screen,
  title,
  caption,
  measure,
  short,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  /** A static caption. Omit and pass `measure` for a number read off the frame. */
  caption?: string;
  measure?: (root: HTMLElement, win: Window) => string;
  /** Caps a short surface well under the full viewport. */
  short?: boolean;
  children: ReactNode;
}) {
  const { w, h: full } = SCREENS[screen];
  const h = short ? Math.min(full, 620) : full;
  const [measured, setMeasured] = useState("measuring");

  const body = measure ? (
    <Measured probe={measure} deps={[screen, id]} onMeasure={setMeasured}>
      {children}
    </Measured>
  ) : (
    children
  );

  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${SCREENS[screen].name}`}
        caption={measure ? measured : caption}
      >
        {body}
      </Frame>
    </Fit>
  );
}

/** The ground every guest-side page stands on: the app background, the page's
 *  own min-height column, and the foreground colour. */
export function Ground({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      {children}
    </div>
  );
}

/* ── The probes ──────────────────────────────────────────────────────────── */

/** How much of the page a reader meets is a PICTURE, which is the whole of
 *  `made-of`: the argument is that Priya's page has none. */
export function measurePictures(root: HTMLElement, win: Window): string {
  const page = root.querySelector<HTMLElement>("[data-pp-page]");
  if (!page) return "measuring";
  const seen = page.getBoundingClientRect();
  const imgs = [...page.querySelectorAll<HTMLElement>("img")].filter(
    (el) => el.clientWidth > 40 && el.clientHeight > 40,
  );
  const area = imgs.reduce((n, el) => n + el.clientWidth * el.clientHeight, 0);
  const screen = win.innerWidth * win.innerHeight;
  const pct = Math.round((area / screen) * 100);
  return `${imgs.length} picture${imgs.length === 1 ? "" : "s"} over ${Math.round(
    seen.height,
  )}px of page: ${pct}% of the first screen`;
}

/** How much of the first screen is spent before the person, which is the whole
 *  of `head`: a header's cost is measured in the room it takes from them. */
export function measureHead(root: HTMLElement, win: Window): string {
  const page = root.querySelector<HTMLElement>("[data-pp-page]");
  const name = page?.querySelector<HTMLElement>("h1");
  if (!name) return "measuring";
  const head = page?.querySelector<HTMLElement>("header");
  const tall = head ? Math.round(head.getBoundingClientRect().height) : 0;
  const top = Math.round(name.getBoundingClientRect().top);
  return `${tall}px of chrome above them, and the name starts ${top}px down a ${win.innerHeight}px screen`;
}

/** How tall the guest list really stands, which is the whole of `list`. */
export function measureList(root: HTMLElement, win: Window): string {
  const list = root.querySelector<HTMLElement>("[data-pp-list]");
  if (!list) return "measuring";
  const r = list.getBoundingClientRect();
  const rows = [...list.querySelectorAll<HTMLElement>("li")].reduce(
    (tops: number[], el) => {
      const t = Math.round(el.getBoundingClientRect().top);
      return tops.some((p) => Math.abs(p - t) < 6) ? tops : [...tops, t];
    },
    [],
  );
  const n = Math.max(1, rows.length);
  return `the list stands ${Math.round(r.height)}px in ${n} row${
    n === 1 ? "" : "s"
  }, on a ${win.innerHeight}px screen`;
}

/** How much of the identity row the controls take, and how far down they sit:
 *  a claim about an affordance has to be a claim about the room it costs. */
export function measureReach(root: HTMLElement, win: Window): string {
  const act = root.querySelector<HTMLElement>("[data-pp-act]");
  if (!act) return `no control on this page, on a ${win.innerWidth}px screen`;
  const r = act.getBoundingClientRect();
  const row = act.parentElement?.getBoundingClientRect();
  const share = row?.width ? Math.round((r.width / row.width) * 100) : null;
  return `the controls take ${Math.round(r.width)}px${
    share ? ` of a ${Math.round(row!.width)}px row (${share}%)` : ""
  }, ${Math.round(r.top)}px down`;
}

/** How big a quick-look surface stands against the screen it opened on, which
 *  is the whole of `quick-look`: a peek that costs half the screen is not a
 *  peek. Absent on purpose for the option that skips a surface entirely, and
 *  for a name with no page behind it there is then nothing at all to open. */
export function measureCard(root: HTMLElement, win: Window): string {
  const card = root.querySelector<HTMLElement>("[data-pp-card]");
  if (!card && root.querySelector("[data-pp-inert]"))
    return "no look and no page: a tap on this name opens nothing at all";
  if (!card)
    return "no quick-look card on this option: a tap opens the full page directly";
  const r = card.getBoundingClientRect();
  const pct = Math.round(
    ((r.width * r.height) / (win.innerWidth * win.innerHeight)) * 100,
  );
  return `the card stands ${Math.round(r.width)}x${Math.round(
    r.height,
  )}px, ${pct}% of a ${win.innerWidth}x${win.innerHeight} screen`;
}

/** What `way-back` actually added, wherever it lives: a pill under the header
 *  or a row inside the account menu. Reports the browser's-back fallback when
 *  an option (or `arrived=direct`) adds nothing, which is the honest picture
 *  of that option rather than a blank measurement. Kept apart from
 *  `measureReach`: that probe already reads `[data-pp-act]` for the follow and
 *  block cluster, which sits on every one of these pages too. */
export function measureBack(root: HTMLElement, win: Window): string {
  const el = root.querySelector<HTMLElement>("[data-pp-back]");
  if (!el)
    return `nothing added: the browser's own back is the only way, on a ${win.innerWidth}px screen`;
  const r = el.getBoundingClientRect();
  return `${Math.round(r.width)}x${Math.round(r.height)}px, ${Math.round(
    r.top,
  )}px down a ${win.innerHeight}px screen`;
}

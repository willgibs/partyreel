"use client";

import { DEMO_QR_TOKEN } from "@/lib/demo";

import { labScenePath } from "@/components/lab";

/**
 * THE ROUNDING BOARD'S PAGES (round six; on the kit's Frame since the kit
 * round).
 *
 * A composition is honest about a component and dishonest about a page,
 * because what a corner has to survive is the REST of the page: the photograph
 * beside the card, the CTA under the chapter, the plan card in the band, the
 * tile in the grid. So the compare and the pages sections load the real thing.
 *
 * The iframe, the candidate injection, the scroll lock, the gate hold and the
 * blocked banner were all invented here and are the kit's `Frame` now, with
 * every landmine they cost written down once in `traps.ts`. What is left in
 * this file is what only this board knows: WHICH pages, what each one puts at
 * stake, and the fact that two of the five sit behind a sign-in and are served
 * from this lane's own route instead (screen/page.tsx).
 */

export type PageId = "home" | "pricing" | "album" | "guest" | "app";

export type Page = {
  id: PageId;
  label: string;
  /** What this page puts at stake that the others do not. */
  note: string;
  /** A lab route needs the gate key before it may load (the kit holds it). */
  gated?: boolean;
};

/** The URL of this lane's screen route. Every lab route is gated, so the key
 *  rides the query string; the kit's Frame holds a gated frame until the
 *  browser has answered rather than loading the lab's 404 first. */
export function screenPath(
  screen: string,
  ground: string,
  key: string | null,
): string {
  return labScenePath(
    "/design/sandbox/rounding/screen",
    { screen, ground },
    key,
  );
}

/**
 * The five, in the order a reader should take them.
 *
 * ★ TWO OF THEM ARE NOT ROUTES. The host's own screen is behind a sign-in and
 * cannot be loaded from a marketing URL, so this lane serves it from its own
 * gated route; the guest album is a real logged-out route when the demo event
 * exists and falls back to the same lane's grid when it does not, so the board
 * never shows an empty frame captioned as a guest's page.
 */
export const PAGES: Page[] = [
  {
    id: "home",
    label: "Home",
    note: "The whole arc in one scroll, and the only place all four rounding groups meet.",
  },
  {
    id: "pricing",
    label: "Pricing",
    note: "The plan cards are the loudest derived step in the product. This page settles the ladder.",
  },
  {
    id: "album",
    label: "Album",
    note: "The photograph's own page: visibility frames and take-home grids, all on the gap and the tile corner.",
  },
  {
    id: "guest",
    label: "Guest",
    note: DEMO_QR_TOKEN
      ? "The live demo album, logged out, exactly as a guest gets it. This is where the gap opens holes."
      : "The guest album's grid, served from this lane because no demo event is configured.",
    gated: !DEMO_QR_TOKEN,
  },
  {
    id: "app",
    label: "App",
    note: "An event as a host works it, served from this lane because the app is behind a sign-in.",
    gated: true,
  },
];

/**
 * Where a page id actually loads from, with the gate key when it needs one.
 *
 * ★ THE GROUND TRAVELS WITH IT. A marketing route runs next-themes in its own
 * document and follows the theme the reader is in; this lane's screen route
 * does not, so it is TOLD, and the board passes the same ground it paints its
 * own strips on. Without it a card showed a light strip above a dark phone,
 * which reads as two different products rather than two views of one corner.
 */
export function pathFor(
  id: PageId,
  key: string | null,
  ground: string = "app-light",
): string {
  switch (id) {
    case "pricing":
      return "/pricing";
    case "album":
      return "/features/album";
    case "guest":
      return DEMO_QR_TOKEN
        ? `/e/${DEMO_QR_TOKEN}`
        : screenPath("gallery", ground, key);
    case "app":
      return screenPath("event", ground, key);
    default:
      return "/";
  }
}

export function pageById(id: string | undefined): Page {
  return PAGES.find((p) => p.id === id) ?? PAGES[0];
}

"use client";

import { DEMO_QR_TOKEN } from "@/lib/demo";

import { Frame, FrameRow, labScenePath, useDesignKey } from "@/components/lab";

/**
 * THE ROUNDING BOARD'S PAGES (round four, 2026-09-15; on the kit's Frame since
 * the kit round).
 *
 * Will's note on this board: "I'd like more UI to preview the variations on.
 * Barely a single screen with a few components doesn't really give a real feel
 * of the marketing site or actual app rounding, or how the different rounding
 * groups work together."
 *
 * Three rounds answered that with compositions: real components, arranged by
 * this board, standing in for pages. A composition is honest about a component
 * and dishonest about a page, because the thing a radius has to survive is the
 * REST of the page. So round four stopped arranging and loaded the pages.
 *
 * The iframe, the candidate injection, the scroll lock, the gate hold and the
 * blocked banner were all invented here and are the kit's `Frame` now, with
 * every landmine they cost written down once in `traps.ts`. What is left in
 * this file is what only this board knows: WHICH pages, and why each one is on
 * the list.
 */

export type RouteId =
  | "home"
  | "pricing"
  | "help"
  | "how"
  | "album"
  | "contact"
  | "guest"
  | "login";

export type Route = {
  id: RouteId;
  label: string;
  path: string;
  /** What this page puts at stake that the others do not. */
  note: string;
};

const GUEST_PATH = DEMO_QR_TOKEN ? `/e/${DEMO_QR_TOKEN}` : null;

/** The pages the round named, in the order a reader should take them. */
export const ROUTES: Route[] = [
  {
    id: "home",
    label: "Home",
    path: "/",
    note: "The whole arc in one scroll: the hero, the film strip, the chapters, the plan band and the footer. Every rounding group meets here, which is the only place they can be judged together.",
  },
  {
    id: "pricing",
    label: "Pricing",
    path: "/pricing",
    note: "The plan cards are rounded-2xl, the loudest derived step in the product: 1.8x of the base on stock and 1.5x on quarters. This page is where the ladder is settled.",
  },
  {
    id: "help",
    label: "Help",
    path: "/help",
    note: "A page of cards and nothing else. If a base is wrong, a wall of the same card at that base is where it shows first.",
  },
  {
    id: "how",
    label: "How it works",
    path: "/how-it-works",
    note: "Chapter frames and device shapes over cinema, where a surface corner sits against a photograph rather than against paper.",
  },
  {
    id: "album",
    label: "Album",
    path: "/features/album",
    note: "The tile's home page: visibility frames, take-home grids, every one of them gap-gallery on radius-tile. The gap and the corner are the same argument here.",
  },
  {
    id: "contact",
    label: "Contact",
    path: "/contact",
    note: "The one paper chapter, and the test of the paste's selector: a paper surface has to inherit the root block rather than re-declare it.",
  },
  ...(GUEST_PATH
    ? [
        {
          id: "guest" as const,
          label: "Guest album",
          path: GUEST_PATH,
          note: "The live demo album, logged out, exactly as a guest gets it, and the one frame to take D on. Measured here: at D the tiles draw a 6px corner while the column gap stays at the literal 3px the guest masonry hard-codes, so four corners meet in three pixels and open a hole. That is the round's worst finding, on the page every guest sees, beside today.",
        },
      ]
    : []),
  {
    id: "login",
    label: "Sign in",
    path: "/login",
    note: "The one app-group page a logged-out frame can reach. Card, inputs and the provider buttons, on the app's own ground rather than the marketing skin.",
  },
];

export const ROUTE_OPTIONS = ROUTES.map((r) => ({ id: r.id, label: r.label }));

/* ── The rows ─────────────────────────────────────────── */

/** Part A's row: the SITE's own routes, which take no key, so no design island
 *  mounts inside these frames and a block applied to the site globally neither
 *  reaches them nor doubles up. They show the rail and only the rail. */
export function PageFrames({
  route,
  w,
  h,
  split,
  railCss,
  railLabel,
  todayCss,
  reloadKey,
}: {
  route: Route;
  w: number;
  h: number;
  split: boolean;
  railCss: string;
  railLabel: string;
  todayCss: string;
  reloadKey: number;
}) {
  return (
    <FrameRow lock={split}>
      {split ? (
        <Frame
          id="left"
          src={route.path}
          w={w}
          h={h}
          css={todayCss}
          title="A, today"
          caption="2 / 8 / 3, with the steps as they are today. The site as built, for the eye to come back to."
          reloadKey={reloadKey}
        />
      ) : null}
      <Frame
        id="right"
        src={route.path}
        w={w}
        h={h}
        css={railCss}
        title={split ? railLabel : `${railLabel}, live`}
        caption={
          split
            ? "The rail, scrolled with the frame beside it."
            : "Flip the rail in the dock and this page re-skins in place, with no reload and no scroll lost."
        }
        reloadKey={reloadKey}
      />
    </FrameRow>
  );
}

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
 * Part B's row: the same pair as part A on this lane's own screen route,
 * because the app sits behind a sign-in. It needs a scroll lock of its own (the
 * dock's Compare promises that on every part, not only part A) and its frames
 * are GATED, which is the one thing that differs from part A.
 */
export function ScreenFrames({
  screen,
  ground,
  w,
  h,
  split,
  railCss,
  railLabel,
  todayCss,
  reloadKey,
}: {
  screen: string;
  ground: string;
  w: number;
  h: number;
  split: boolean;
  railCss: string;
  railLabel: string;
  todayCss: string;
  reloadKey: number;
}) {
  const key = useDesignKey();
  const url = screenPath(screen, ground, key ?? null);
  return (
    <FrameRow lock={split}>
      {split ? (
        <Frame
          id="app-left"
          src={url}
          gated
          w={w}
          h={h}
          css={todayCss}
          title="A, today"
          caption="2 / 8 / 3, with the steps as they are today. The app as built, for the eye to come back to."
          reloadKey={reloadKey}
        />
      ) : null}
      <Frame
        id="app-right"
        src={url}
        gated
        w={w}
        h={h}
        css={railCss}
        title={split ? railLabel : `${railLabel}, live`}
        caption={
          split
            ? "The rail, written into this document and scrolled with the frame beside it."
            : "The rail, written into this document. Flip the dock and this screen re-skins in place."
        }
        reloadKey={reloadKey}
      />
    </FrameRow>
  );
}

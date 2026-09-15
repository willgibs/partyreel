"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DEMO_QR_TOKEN } from "@/lib/demo";
import { cn } from "@/lib/utils";

/**
 * THE ROUNDING BOARD'S PAGE FRAMES (round four, 2026-09-15).
 *
 * Will's note on this board: "I'd like more UI to preview the variations on.
 * Barely a single screen with a few components doesn't really give a real feel
 * of the marketing site or actual app rounding, or how the different rounding
 * groups work together."
 *
 * Three rounds answered that with compositions: real components, arranged by
 * this board, standing in for pages. A composition is honest about a component
 * and dishonest about a page, because the thing a radius has to survive is the
 * REST of the page. So round four stops arranging and loads the pages.
 *
 * ★ A SAME-ORIGIN IFRAME IS THE ONLY 1:1 SURFACE THE LAB HAS. The board runs
 * at /design/lab/rounding and the site runs at /, on one origin, so the frame's
 * `contentDocument` is reachable and a candidate can be written INTO it as a
 * style element: the real route, the real components, the real breakpoints,
 * the real scroll, wearing this column's radius and nobody else's. No zoom, no
 * transform, no re-implementation. That is what makes it evidence rather than
 * a picture of evidence.
 *
 * Three things follow from it, and all three are the reason the code below is
 * not two lines:
 *
 * 1. THE STYLE MUST BE LAST IN THE HEAD. The paste rewrites `.rounded-xl` and
 *    its siblings (the derived ladder is baked into the utilities by
 *    @theme inline, so it cannot be a token), and a utility override at the
 *    same specificity wins only on source order. Every injection appends,
 *    which moves it back to the end, and a settle pass re-appends after Next
 *    has finished adding its own.
 * 2. WHAT A FRAME WEARS DEPENDS ON WHETHER ITS ROUTE IS GATED, and the two
 *    kinds on this board differ. Part A loads the SITE's own routes, which
 *    take no key, so no design island mounts inside those frames: they show
 *    the rail and ONLY the rail, and a block applied to the site globally
 *    neither reaches them nor doubles up. Parts B and G load this lane's own
 *    screen route, which is a lab route and therefore gated, so their URL
 *    MUST carry the key and the island DOES mount in them. That is why the
 *    paste goes last in the body rather than the head (see `inject`), and why
 *    those frames wait for the key instead of rendering on the server without
 *    it: a keyless lab URL answers `notFound()` on every build but local dev,
 *    so a server-rendered src would load the lab's 404 and then reload.
 * 3. A FRAME THAT CANNOT BE RE-SKINNED MUST SAY SO. Every access is guarded,
 *    and a failure renders a warning on the frame rather than an unstyled page
 *    that reads as a candidate.
 */

const STYLE_ID = "rnd-candidate";

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

/* ── The scroll lock ───────────────────────────────────────────────────── */

/**
 * Frames of the same page, scrolled together, is the whole point of a row of
 * them: a difference of four pixels in a corner is invisible unless the two
 * shapes are at the same place on the same screen at the same moment.
 *
 * The guard is a frame flag rather than a distance test: a distance test
 * cannot tell the echo of a programmatic scroll from a real one when the
 * documents are the same height, which they are here by construction (every
 * frame in a row loads the same route and differs only in its radius).
 *
 * ★ ONE LOCK PER ROW, NEVER ONE PER PAGE. Each call owns its own Map, so the
 * site's two frames, the app's two and the phone row's four move with their
 * own row and not with each other. Every row on this board holds a lock: part
 * A's (PageFrames), part B's (ScreenFrames) and part G's (PhoneRow, in
 * board.tsx, which is why this is exported).
 */
export function useScrollLock(enabled: boolean) {
  const wins = useRef<Map<string, { win: Window; handler: () => void }>>(
    new Map(),
  );
  const echo = useRef(false);
  const on = useRef(enabled);
  useEffect(() => {
    on.current = enabled;
  }, [enabled]);

  // ★ The handler is STORED, not rebuilt. removeEventListener compares by
  // identity, so registering with a fresh closure each time would leave a
  // listener on every document a frame ever held, and the second page would
  // then be scrolled by three ghosts. `on` is a ref for the same reason: the
  // registration must not change when the split toggles.
  const register = useCallback((id: string, win: Window | null) => {
    const prev = wins.current.get(id);
    if (prev) {
      try {
        prev.win.removeEventListener("scroll", prev.handler);
      } catch {
        // Already gone with its document.
      }
      wins.current.delete(id);
    }
    if (!win) return;
    const handler = () => {
      if (!on.current || echo.current) return;
      echo.current = true;
      wins.current.forEach((other, otherId) => {
        if (otherId === id) return;
        try {
          other.win.scrollTo(win.scrollX, win.scrollY);
        } catch {
          // A frame mid-navigation: the next scroll catches it up.
        }
      });
      requestAnimationFrame(() => {
        echo.current = false;
      });
    };
    wins.current.set(id, { win, handler });
    win.addEventListener("scroll", handler, { passive: true });
  }, []);

  return register;
}

/* ── One frame ─────────────────────────────────────────────────────────── */

export function PageFrame({
  id,
  path,
  w,
  h,
  css,
  title,
  caption,
  reloadKey,
  register,
  className,
}: {
  id: string;
  path: string;
  w: number;
  h: number;
  /** The candidate, as the paste a ruling would land. Empty = the baked site. */
  css: string;
  title: string;
  caption: React.ReactNode;
  /** Bump to force the route to reload (a frame the reader navigated away). */
  reloadKey: number;
  register?: (id: string, win: Window | null) => void;
  className?: string;
}) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const [loads, setLoads] = useState(0);
  const [reach, setReach] = useState<"waiting" | "ok" | "blocked">("waiting");

  /** Returns what the write found, so the effect can report it on a later
   *  tick: a setState in the body of an effect cascades renders. */
  const inject = useCallback((): "waiting" | "ok" | "blocked" => {
    const frame = ref.current;
    if (!frame) return "waiting";
    try {
      const doc = frame.contentDocument;
      const host = doc?.body;
      if (!doc || !host) return "waiting";
      let el = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
      if (!el) {
        el = doc.createElement("style");
        el.id = STYLE_ID;
      }
      el.textContent = css;
      // ★ LAST CHILD OF <body>, not the head. The paste rewrites utilities
      // (the derived ladder is baked into them by @theme inline, so it cannot
      // be a token), and a utility override at equal specificity wins on
      // source order alone. The head is not far enough: a lab route inside a
      // frame mounts CandidateStyle, which renders the globally applied block
      // as a <style> INSIDE the body, and that would then beat this one. The
      // last child of the body is after everything either of them can write.
      host.appendChild(el);
      return "ok";
    } catch {
      // A cross-origin document (a frame the reader navigated off-site) or a
      // document torn down mid-write. Say so rather than show a page that
      // looks like a candidate and is not one.
      return "blocked";
    }
  }, [css]);

  useEffect(() => {
    let alive = true;
    const run = () => {
      const result = inject();
      if (alive && result !== "waiting") setReach(result);
    };
    // Two passes, both on a later tick: the first as soon as the browser will
    // paint, the second after Next has finished adding its own style elements
    // during hydration, which is what puts the paste back at the end.
    const frame = requestAnimationFrame(run);
    const settle = window.setTimeout(run, 500);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, [inject, loads]);

  // ★ THE LOCK IS JOINED FROM AN EFFECT, NOT FROM onLoad ALONE. A frame in the
  // server-rendered HTML starts loading before React hydrates, so its load
  // event is gone by the time an onLoad handler exists: measured on a local
  // production build, the split did not scroll together on first open and only
  // began to after "Reload frames" (which remounts the element, so its load
  // lands after hydration). The effect re-runs on every load, and `register`
  // drops the previous window for this id first, so a frame is in the row
  // exactly once whichever path got there.
  useEffect(() => {
    let win: Window | null = null;
    try {
      win = ref.current?.contentWindow ?? null;
    } catch {
      win = null; // A frame the reader navigated off-origin.
    }
    register?.(id, win);
    return () => register?.(id, null);
  }, [id, register, loads]);

  return (
    <figure className={cn("m-0 flex min-w-0 flex-col gap-2", className)}>
      <figcaption className="flex flex-col gap-0.5" style={{ width: w }}>
        <span className="text-sm font-medium">{title}</span>
        {/* A fixed floor so four frames in a row line up at the top whatever
            their captions run to. */}
        <span className="min-h-[2.75rem] text-[11px] leading-snug text-muted-foreground">
          {caption}
        </span>
      </figcaption>
      <div
        // ★ AN OUTLINE, NOT A BORDER. A bordered box is border-box here, so a
        // 1px frame on each side hands the iframe a 1438px viewport while the
        // caption says 1440: a two pixel lie on a board whose whole argument is
        // that a size must be its own. An outline is painted outside the box
        // and takes no layout. No corner on it either, because a radius on the
        // frame's own chrome would sit a pixel from the radius being judged.
        className="relative shrink-0 bg-background"
        style={{
          width: w,
          height: h,
          outline: "1px solid var(--border)",
          outlineOffset: 0,
        }}
      >
        <iframe
          ref={ref}
          key={`${path}-${reloadKey}`}
          src={path}
          title={`${title}, ${path}`}
          width={w}
          height={h}
          className="block h-full w-full border-0"
          onLoad={() => {
            // The count is what re-runs the injection AND the registration
            // above: one signal, so a frame that loads twice cannot end up
            // holding two listeners or a stale window.
            setLoads((n) => n + 1);
            setReach(inject());
          }}
        />
        {reach === "blocked" ? (
          <p className="absolute inset-x-0 top-0 bg-destructive px-2 py-1 text-[11px] font-medium text-white">
            This frame could not be re-skinned, so it is showing the site as
            built. Reload it to bring the candidate back.
          </p>
        ) : null}
      </div>
    </figure>
  );
}

/* ── The part ──────────────────────────────────────────────────────────── */

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
  const register = useScrollLock(split);
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex w-fit gap-4">
        {split ? (
          <PageFrame
            id="left"
            path={route.path}
            w={w}
            h={h}
            css={todayCss}
            title="Today"
            caption="2 / 8 / 3, stock ladder. The site as built, for the eye to come back to."
            reloadKey={reloadKey}
            register={register}
          />
        ) : null}
        <PageFrame
          id="right"
          path={route.path}
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
          register={register}
        />
      </div>
    </div>
  );
}

/* ── The app screens, as frames ────────────────────────────────────────── */

/**
 * The URL of this lane's screen route. The key rides the query string because
 * every lab route is gated; in local dev the gate is open and the key is
 * absent, which is why it is optional rather than required.
 */
export function screenPath(
  screen: string,
  ground: string,
  key: string | null,
): string {
  const q = new URLSearchParams({ screen, ground });
  if (key) q.set("key", key);
  return `/design/sandbox/rounding/screen?${q.toString()}`;
}

/**
 * A frame's box before it is allowed to load, so the row holds its place and
 * nothing jumps when the real frame arrives. It is here rather than a spinner
 * because the wait is one tick: the board holds a gated frame until it is
 * mounted and the key is readable (header note 2).
 */
function FrameHold({ w, h, title }: { w: number; h: number; title: string }) {
  return (
    <figure className="m-0 flex min-w-0 flex-col gap-2">
      <figcaption className="flex flex-col gap-0.5" style={{ width: w }}>
        <span className="text-sm font-medium">{title}</span>
        <span className="min-h-[2.75rem] text-[11px] leading-snug text-muted-foreground">
          The app screens are served from a gated lab route, so this frame waits
          for the key on the URL rather than loading a 404 first.
        </span>
      </figcaption>
      <div
        className="shrink-0 bg-background"
        style={{
          width: w,
          height: h,
          outline: "1px solid var(--border)",
          outlineOffset: 0,
        }}
      />
    </figure>
  );
}

/**
 * Part B's row: the same pair as part A, on this lane's screen route instead
 * of the site's. It is a component of its own for two reasons, both of which
 * were bugs when it was written inline on the board: it needs a scroll lock of
 * its own (the app's two frames scroll with each other, and the dock's
 * "Compare" promises that on every part, not only part A), and it must not
 * render a keyless frame on the server.
 */
export function ScreenFrames({
  url,
  w,
  h,
  split,
  railCss,
  railLabel,
  todayCss,
  reloadKey,
  ready,
}: {
  url: string;
  w: number;
  h: number;
  split: boolean;
  railCss: string;
  railLabel: string;
  todayCss: string;
  reloadKey: number;
  /** False until the browser has the gate key. See header note 2. */
  ready: boolean;
}) {
  const register = useScrollLock(split);
  const frame = (
    id: string,
    css: string,
    title: string,
    caption: string,
  ): React.ReactNode =>
    ready ? (
      <PageFrame
        id={id}
        path={url}
        w={w}
        h={h}
        css={css}
        title={title}
        caption={caption}
        reloadKey={reloadKey}
        register={register}
      />
    ) : (
      <FrameHold w={w} h={h} title={title} />
    );

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex w-fit gap-4">
        {split
          ? frame(
              "app-left",
              todayCss,
              "Today",
              "2 / 8 / 3, stock ladder. The app as built, for the eye to come back to.",
            )
          : null}
        {frame(
          "app-right",
          railCss,
          split ? railLabel : `${railLabel}, live`,
          split
            ? "The rail, written into this document and scrolled with the frame beside it."
            : "The rail, written into this document. Flip the dock and this screen re-skins in place.",
        )}
      </div>
    </div>
  );
}

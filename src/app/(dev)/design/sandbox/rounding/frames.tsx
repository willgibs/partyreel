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
 * at /design/c/rounding and the site runs at /, on one origin, so the frame's
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
 * 2. THE FRAME IS LOADED WITHOUT `?key=`, so no design island mounts inside
 *    it. A frame therefore shows the rail and ONLY the rail: whatever is
 *    applied to the site globally does not reach it, and cannot double up.
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
          note: "The live demo album, logged out, exactly as a guest gets it. The masonry's gap is a literal 3px here while its tiles ride the token, so this frame is where the round's worst finding is visible on the real page.",
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
 * Two frames of the same page, scrolled together, is the whole point of the
 * split: a difference of four pixels in a corner is invisible unless the two
 * shapes are at the same place on the same screen at the same moment.
 *
 * The guard is a frame flag rather than a distance test: a distance test
 * cannot tell the echo of a programmatic scroll from a real one when the two
 * documents are the same height, which they are here by construction.
 */
function useScrollLock(enabled: boolean) {
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

  useEffect(() => {
    return () => register?.(id, null);
  }, [id, register]);

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
        // No corner on the frame's own chrome: a radius here would be the lab's
        // and would sit a pixel from the radius being judged.
        className="relative shrink-0 border border-border bg-background"
        style={{ width: w, height: h }}
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
            setLoads((n) => n + 1);
            try {
              register?.(id, ref.current?.contentWindow ?? null);
            } catch {
              register?.(id, null);
            }
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

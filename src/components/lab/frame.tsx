"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

import { useMountOnApproach } from "./approach";
import { useDesignKey } from "./walk";

/**
 * THE FRAME: A REAL VIEWPORT, 1:1, WEARING A CANDIDATE.
 *
 * ★ A SAME-ORIGIN IFRAME IS THE ONLY 1:1 SURFACE THE LAB HAS, and it is the
 * reason this file is not two lines. The board runs at /design/lab/<id> and the
 * site runs at /, on one origin, so the frame's `contentDocument` is reachable
 * and a candidate can be written INTO it: the real route, the real components,
 * the real breakpoints, the real scroll, wearing this frame's candidate and
 * nobody else's. No zoom, no transform, no re-implementation. A Stage is a div,
 * and a div lies twice over: a Tailwind breakpoint prefix inside it reads the
 * BROWSER's width rather than the canvas's, and a radix panel portals out of it
 * entirely. A frame lies about neither. That is what makes it evidence rather
 * than a picture of evidence.
 *
 * Five things follow, and each one was a bug before it was a rule:
 *
 * 1. ★ THE CANDIDATE GOES IN AN ADOPTED STYLESHEET, CONSTRUCTED IN THE FRAME'S
 *    OWN REALM. A candidate paste usually rewrites UTILITIES (`@theme inline`
 *    bakes a derived ladder into them, so it cannot be a token), and a utility
 *    override at equal specificity wins on SOURCE ORDER alone. `adoptedStyleSheets`
 *    is ordered after every author sheet in the document, including any a lab
 *    island writes into the body later, so it wins without a specificity war and
 *    without re-appending on every mutation. It must be `new win.CSSStyleSheet()`
 *    from the FRAME's window: a sheet constructed in the parent realm throws on
 *    adoption. Where that is unavailable the fallback is the last child of
 *    <body>, which is after everything either Next or a design island can write,
 *    and the `settle` pass re-appends after hydration finishes adding sheets.
 * 2. ★ A GATED FRAME MUST NOT BE SERVER RENDERED. Every lab route is gated and
 *    the key is browser-only, so a frame built from the server would ship
 *    `<iframe src="/design/sandbox/...">` in the HTML, the browser would start
 *    that load before hydration, and `requireDesignKey` answers a keyless lab
 *    URL with notFound() on every build but local dev. The reader would watch a
 *    404 paint inside the frame and then watch it reload. `gated` holds the box
 *    until the key is readable. A SITE route takes no key and renders normally.
 * 3. ★ THE SCROLL LOCK IS JOINED FROM AN EFFECT, NOT FROM onLoad ALONE. A frame
 *    in the server-rendered HTML starts loading before React hydrates, so its
 *    load event is gone by the time an onLoad handler exists: measured on a
 *    local production build, a split did not scroll together on first open and
 *    only began to after a reload. The effect re-runs on every load and the
 *    register drops the previous window for this id first, so a frame is in the
 *    group exactly once whichever path got there.
 * 4. ★ KNOBS ARE PUSHED AS AN EVENT, NEVER THROUGH THE URL. Changing `src`
 *    reloads the document: the scroll position, the injected candidate and the
 *    frame's place in its lock group all go, and a reader flipping a knob sees
 *    the page blink. `push` dispatches `lab:set` into the frame's window with
 *    the state, and a lab scene listens for it.
 * 5. ★ A FRAME THAT CANNOT BE RE-SKINNED MUST SAY SO. Every access is guarded,
 *    and a failure draws a banner rather than showing an unstyled page that
 *    reads as a candidate.
 *
 * An outline rather than a border, because a bordered box is border-box here: a
 * 1px frame each side hands the iframe a 1438px viewport while the caption says
 * 1440, which is a two pixel lie on a board arguing about pixels. And no radius
 * on the frame's own chrome, which would sit a pixel from the corner being
 * judged.
 */

const SHEET_ID = "lab-candidate";

/* ── The scroll lock ───────────────────────────────────────────────────── */

/** Returns whether the window was joined; false means it is off-origin. */
type Register = (id: string, win: Window | null) => boolean;

/**
 * Frames of the same page, scrolled together, is the whole point of a row of
 * them: a four pixel difference in a corner is invisible unless the two shapes
 * are at the same place on the same screen at the same moment.
 *
 * ★ ONE LOCK PER ROW, NEVER ONE PER PAGE. Each call owns its own Map, so a
 * board's site pair, its app pair and its phone row move with their own row and
 * not with each other.
 *
 * ★ THE GUARD IS A FLAG, NOT A DISTANCE TEST. A distance test cannot tell the
 * echo of a programmatic scroll from a real one when the documents are the same
 * height, which they are here by construction (every frame in a row loads the
 * same route and differs only in its candidate).
 *
 * ★ AND THE HANDLER IS STORED, NOT REBUILT. removeEventListener compares by
 * identity, so registering with a fresh closure each time leaves a listener on
 * every document a frame ever held, and the second page is then scrolled by
 * three ghosts. `on` is a ref for the same reason: the registration must not
 * change when the lock toggles.
 *
 * ★ A CROSS-ORIGIN `contentWindow` IS NOT NULL, IT IS A PROXY, and that is the
 * one that crashed a board. Reading `frame.contentWindow` off an off-origin
 * frame succeeds and hands back a WindowProxy; the SecurityError is thrown
 * later, on the first real property access, which here was `addEventListener`
 * INSIDE this function, outside the caller's try. A reader clicking a link in a
 * frame that left the origin took the whole board to its error boundary. So the
 * join is guarded here, and whether it succeeded is the honest reachability
 * signal: `register` returns false when the window could not be joined, and the
 * frame draws its banner instead of pretending it is still wearing a candidate.
 */
export function useFrameLock(enabled = true): Register {
  const wins = useRef<Map<string, { win: Window; handler: () => void }>>(
    new Map(),
  );
  const echo = useRef(false);
  const on = useRef(enabled);
  useEffect(() => {
    on.current = enabled;
  }, [enabled]);

  return useCallback((id: string, win: Window | null) => {
    const prev = wins.current.get(id);
    if (prev) {
      try {
        prev.win.removeEventListener("scroll", prev.handler);
      } catch {
        // Already gone with its document.
      }
      wins.current.delete(id);
    }
    if (!win) return false;
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
    // The guarded join, which is also the reachability test: any property
    // access on an off-origin WindowProxy throws, and this is the first one.
    try {
      win.addEventListener("scroll", handler, { passive: true });
    } catch {
      return false;
    }
    wins.current.set(id, { win, handler });
    return true;
  }, []);
}

const LockCtx = createContext<Register | null>(null);

/* ── The lab's own scene routes ────────────────────────────────────────── */

/**
 * The URL of a lab scene (an app screen a frame cannot reach because it is
 * behind a sign-in, so a board serves it from a route of its own). The key
 * rides the query string because every lab route is gated; it is optional
 * because the gate is open in local dev.
 */
export function labScenePath(
  route: string,
  params: Record<string, string>,
  key: string | null,
): string {
  const q = new URLSearchParams(params);
  if (key) q.set("key", key);
  const qs = q.toString();
  return qs ? `${route}?${qs}` : route;
}

/* ── One frame ─────────────────────────────────────────────────────────── */

export type FrameProps = {
  /** Unique within its lock group. */
  id: string;
  /** The route to load. Omit and pass `children` to portal a scene instead. */
  src?: string;
  /** A composition with no route of its own, rendered INTO the frame document. */
  children?: React.ReactNode;
  w: number;
  h: number;
  /** The candidate, as the paste a ruling would land. Empty = the site as built. */
  css?: string;
  title: string;
  caption?: React.ReactNode;
  /** A lab route needs the browser's key before it may load. See landmine 2. */
  gated?: boolean;
  /** Bump to reload (a frame the reader navigated away). */
  reloadKey?: number;
  /** Re-apply this many ms after load, once hydration has added its own sheets. */
  settle?: number;
  /** Board state pushed into the frame as a `lab:set` event. See landmine 4. */
  push?: Record<string, string>;
  /** Join a scroll group. Defaults to the enclosing FrameRow's. */
  lock?: Register | null;
  /** Load only when the reader is nearly there (a row of four is four loads). */
  onApproach?: boolean;
  className?: string;
};

export function Frame({
  id,
  src,
  children,
  w,
  h,
  css = "",
  title,
  caption,
  gated = false,
  reloadKey = 0,
  settle = 500,
  push,
  lock,
  onApproach = false,
  className,
}: FrameProps) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const [loads, setLoads] = useState(0);
  const [reach, setReach] = useState<"waiting" | "ok" | "blocked">("waiting");
  const [doc, setDoc] = useState<Document | null>(null);
  const rowLock = useContext(LockCtx);
  const register = lock === undefined ? rowLock : lock;
  const key = useDesignKey();
  const [box, near] = useMountOnApproach();
  // The parent's theme classes, so a portalled scene lands on the same ground.
  const themeClass = useSyncExternalStore(
    () => () => {},
    () => document.documentElement.className,
    () => "",
  );

  // A gated frame waits for the key; an ungated one never waits. `key` is null
  // on the server AND in open dev, so the readiness test is "the browser has
  // answered", which useDesignKey reports as a non-undefined value.
  const ready = (!gated || key !== undefined) && (!onApproach || near);

  /** Returns what the write found, so the effect reports it on a later tick: a
   *  setState in the body of an effect cascades renders. */
  const inject = useCallback((): "waiting" | "ok" | "blocked" => {
    const frame = ref.current;
    if (!frame) return "waiting";
    try {
      const win = frame.contentWindow;
      const fdoc = frame.contentDocument;
      if (!win || !fdoc?.body) return "waiting";
      // Landmine 1: adopted first, constructed in the frame's own realm.
      const Sheet = (win as Window & { CSSStyleSheet?: typeof CSSStyleSheet })
        .CSSStyleSheet;
      if (Sheet && "adoptedStyleSheets" in fdoc) {
        type Tagged = CSSStyleSheet & { [SHEET_ID]?: true };
        const kept = fdoc.adoptedStyleSheets.filter(
          (s) => !(s as Tagged)[SHEET_ID],
        );
        if (css) {
          const sheet = new Sheet() as Tagged;
          sheet.replaceSync(css);
          sheet[SHEET_ID] = true;
          fdoc.adoptedStyleSheets = [...kept, sheet];
        } else if (kept.length !== fdoc.adoptedStyleSheets.length) {
          fdoc.adoptedStyleSheets = kept;
        }
        return "ok";
      }
      // The fallback: last child of <body>, after anything Next or a design
      // island can write. Appending moves it back to the end every pass.
      let el = fdoc.getElementById(SHEET_ID) as HTMLStyleElement | null;
      if (!el) {
        el = fdoc.createElement("style");
        el.id = SHEET_ID;
      }
      el.textContent = css;
      fdoc.body.appendChild(el);
      return "ok";
    } catch {
      // A cross-origin document (a frame the reader navigated off-site) or one
      // torn down mid-write. Say so rather than show a page that looks like a
      // candidate and is not one.
      return "blocked";
    }
  }, [css]);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    const run = () => {
      const result = inject();
      if (alive && result !== "waiting") setReach(result);
    };
    const frame = requestAnimationFrame(run);
    const timer = window.setTimeout(run, settle);
    // ★ AND IT KEEPS CHECKING, because the way a frame really goes unreachable
    // is a reader clicking a link inside it that leaves the origin. That is a
    // navigation this component never hears about: the load event fires on the
    // element, but only a re-render would re-run the check, and nothing
    // re-renders. Without this poll the frame keeps showing the last skinned
    // page under a caption naming a candidate it is no longer wearing, which is
    // the exact lie landmine 5 exists to prevent. Two seconds is cheap: it is
    // one try/catch property read.
    const watch = window.setInterval(run, 2000);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.clearInterval(watch);
    };
  }, [inject, loads, settle, ready]);

  // Landmine 3, and the cross-origin proxy with it: `contentWindow` hands back
  // a WindowProxy rather than null for an off-origin frame, so the join is what
  // reports reachability and a refused join draws the banner.
  useEffect(() => {
    if (!ready) return;
    let win: Window | null = null;
    try {
      win = ref.current?.contentWindow ?? null;
    } catch {
      win = null;
    }
    const joined = register?.(id, win);
    if (win && joined === false) setReach("blocked");
    return () => {
      register?.(id, null);
    };
  }, [id, register, loads, ready]);

  // Landmine 4: knobs travel as an event, so the document is never reloaded.
  useEffect(() => {
    if (!push || !ready) return;
    try {
      const win = ref.current?.contentWindow;
      win?.dispatchEvent(new CustomEvent("lab:set", { detail: push }));
    } catch {
      // Cross-origin or mid-teardown; the next load carries it.
    }
  }, [push, loads, ready]);

  // A portalled scene has no route, so it needs the parent's stylesheets copied
  // into about:blank or it renders unstyled. Copied once per load, and only what
  // the parent already parsed, so nothing is fetched twice.
  //
  // ★ THE THEME CLASS GOES ON A WRAPPER, NOT ON THE FRAME'S <html>. Writing it
  // there means mutating a node reached through a ref, which React's rules
  // rightly refuse, and it would also be undone by anything that re-renders the
  // document. A wrapper inside the body carries the class and the reset, and it
  // is what the portal renders into.
  useEffect(() => {
    if (!children || !ready) return;
    try {
      const fdoc = ref.current?.contentDocument;
      if (!fdoc?.head || fdoc.head.querySelector("[data-lab-copied]")) return;
      document
        .querySelectorAll<HTMLElement>('style, link[rel="stylesheet"]')
        .forEach((node) => {
          const copy = node.cloneNode(true) as HTMLElement;
          copy.dataset.labCopied = "";
          fdoc.head.appendChild(copy);
        });
      const reset = fdoc.createElement("style");
      reset.dataset.labCopied = "";
      reset.textContent = "body{margin:0}";
      fdoc.head.appendChild(reset);
      setDoc(fdoc);
    } catch {
      setReach("blocked");
    }
  }, [children, loads, ready]);

  return (
    <figure
      ref={box}
      className={cn("m-0 flex min-w-0 flex-col gap-2", className)}
    >
      <figcaption className="flex flex-col gap-0.5" style={{ width: w }}>
        <span className="text-sm font-medium">{title}</span>
        {/* A fixed floor so frames in a row line up at the top whatever their
            captions run to. */}
        <span className="min-h-[2.75rem] text-[11px] leading-snug text-muted-foreground">
          {caption}
        </span>
      </figcaption>
      <div
        className="relative shrink-0 bg-background"
        style={{ width: w, height: h, outline: "1px solid var(--border)" }}
      >
        {ready ? (
          <iframe
            ref={ref}
            key={`${src ?? "portal"}-${reloadKey}`}
            src={src ?? "about:blank"}
            title={src ? `${title}, ${src}` : title}
            width={w}
            height={h}
            className="block h-full w-full border-0"
            onLoad={() => {
              // One signal re-runs the injection AND the registration, so a
              // frame that loads twice cannot hold two listeners or a stale
              // window.
              setLoads((n) => n + 1);
              setReach(inject());
            }}
          />
        ) : null}
        {children && doc
          ? createPortal(
              <div className={themeClass}>{children}</div>,
              doc.body,
            )
          : null}
        {reach === "blocked" ? (
          <p className="absolute inset-x-0 top-0 bg-destructive px-2 py-1 text-[11px] font-medium text-white">
            This frame could not be re-skinned, so it is showing the page as
            built. Reload it to bring the candidate back.
          </p>
        ) : null}
      </div>
    </figure>
  );
}

/* ── A row of frames ───────────────────────────────────────────────────── */

/**
 * Frames of one page side by side, in one scroll group. The row scrolls
 * sideways rather than shrinking its frames, because a frame narrower than its
 * declared width is the one thing a frame exists to prevent.
 */
export function FrameRow({
  lock = true,
  children,
  className,
}: {
  /** False shows the frames without tying their scroll together. */
  lock?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const register = useFrameLock(lock);
  return (
    <LockCtx.Provider value={register}>
      <div className={cn("overflow-x-auto pb-2", className)}>
        <div className="flex w-fit gap-4">{children}</div>
      </div>
    </LockCtx.Provider>
  );
}

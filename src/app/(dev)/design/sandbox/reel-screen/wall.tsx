"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { Frame, useLabPrefs } from "@/components/lab";
import type { Control } from "@/components/lab/board-spec";
import { sharedBitmapCache } from "@/lib/reel/engine/asset-cache";
import { loadReelAssets, type ReelAssets } from "@/lib/reel/engine/assets";
import { FPS, reelDimensions } from "@/lib/reel/engine/constants";
import {
  drawReelFrame,
  engineStyleDuration,
  makeScaledDrawEnv,
  resolveEngineStyle,
} from "@/lib/reel/engine/registry";
import type { ReelProps } from "@/lib/reel/engine/reel-types";

/**
 * THE STAGE IS A WALL: 1920 BY 1080, WHICH THE KIT DOES NOT DRAW.
 *
 * ★ `Stage`'s canvases stop at 1440 (`CANVAS.desktop`), and that is right for
 * every board before this one: a hero, a sheet and an album are judged at the
 * widths people browse at. A venue screen is not browsed at, it is LOOKED AT
 * from across a room, and its only real size is the television's. So this board
 * draws its own canvas, and it draws it in a `Frame` rather than a div, for the
 * reason the kit's own head comment gives: a div lies twice over (a Tailwind
 * breakpoint prefix inside it reads the BROWSER's width, and a portal escapes
 * it), and a same-origin iframe is the only 1:1 surface the lab has. A 1920
 * iframe is a real 1920 viewport.
 *
 * The knob is the other television in the room: 1440 by 810, the same 16:9 wall
 * on a smaller screen, which is where type that only works enormous gives
 * itself away.
 *
 * ★ THE ENGINE DRAWS THE PICTURE, NEVER `CanvasReelPlayer`. The shipped player
 * is the ALBUM's player: it caps itself at `max-w-[640px]`, wears a rounded
 * border and carries a scrubber and a play button under it. A wall is
 * full-bleed and has no chrome at all. What is shared, and what actually
 * matters, is the DRAW: `drawReelFrame` over `loadReelAssets`, the same
 * statements the player runs and the encoder steps, so the grade, the
 * letterbox, the vignette and the Ken-Burns framing on this wall are the
 * style's own.
 */

export const SCREENS = {
  "1920": { w: 1920, h: 1080, name: "a 1920 wall" },
  "1440": { w: 1440, h: 810, name: "a 1440 wall" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "1920";

export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1920", label: "1920, the wall" },
    { id: "1440", label: "1440, a smaller one" },
  ],
  default: "1920",
};

/** The host's own laptop, where `open` is decided. Not a wall: a browser window. */
export const DESK = {
  "1920": { w: 1920, h: 1000, name: "a 1920 desk" },
  "1440": { w: 1440, h: 900, name: "a 1440 desk" },
} as const;

/* ── fit, pause and the reader's own eye ─────────────────────────────────── */

/**
 * A 1920 canvas in a lab column is ALWAYS scaled or scrolled, so the box says
 * which (`data-stage-fit`) and the step reads the zoom off it, exactly as a
 * `Stage` reports its own.
 */
function Fit({ w, children }: { w: number; children: ReactNode }) {
  const { fit } = useLabPrefs();
  const zoomed = fit === "zoom";
  const box = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || !zoomed) return;
    const sync = () => setRoom(el.getBoundingClientRect().width);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [zoomed]);

  const k = zoomed && room ? Math.min(1, room / w) : 1;
  return (
    <div
      ref={box}
      data-stage-fit={zoomed ? "zoom" : "true"}
      className={zoomed ? "min-w-0 overflow-hidden" : "min-w-0 overflow-x-auto"}
    >
      <div style={{ width: w, zoom: k }}>{children}</div>
    </div>
  );
}

/**
 * ★ AN OPTION OFF THE STAGE IS PAUSED, AND IT CANNOT READ THAT FOR ITSELF. The
 * step marks the hidden options `data-paused` on their own wrappers
 * (step.tsx), and a wall's canvas lives inside a portalled iframe, so
 * `closest()` from the canvas never reaches that wrapper. The read is done out
 * here, where the DOM is continuous, and handed down: three running walls with
 * two of them stopped is the difference between a board and a space heater.
 */
const PausedCtx = createContext(false);
export const useWallPaused = () => useContext(PausedCtx);

function usePausedAbove(el: HTMLElement | null): boolean {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!el) return;
    const view = el.closest<HTMLElement>("[data-lab-view]");
    if (!view) return;
    const read = () => setPaused(view.hasAttribute("data-paused"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(view, { attributes: true, attributeFilter: ["data-paused"] });
    return () => mo.disconnect();
  }, [el]);
  return paused;
}

const REDUCED = "(prefers-reduced-motion: reduce)";
export function usePrefersReduced(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(REDUCED);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(REDUCED).matches,
    () => true,
  );
}

/** A number read off the frame's own document, never computed from the source. */
function Measured({
  probe,
  deps,
  onMeasure,
  children,
}: {
  /** `null` means "not settled yet": the read is skipped rather than
   *  overwriting the caption with a lie. */
  probe: (root: HTMLElement) => string | null;
  deps: unknown[];
  onMeasure: (text: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const report = useRef(onMeasure);
  useEffect(() => {
    report.current = onMeasure;
  });
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const read = () => {
      try {
        const said = probe(el);
        if (said) report.current(said);
      } catch {
        // Not settled yet; the next timer or resize catches it.
      }
    };
    read();
    const timers = [200, 900, 2200].map((ms) => win.setTimeout(read, ms));
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    return () => {
      timers.forEach((t) => win.clearTimeout(t));
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <div ref={ref} className="size-full">{children}</div>;
}

/* ── the wall itself ─────────────────────────────────────────────────────── */

export function Wall({
  id,
  screen,
  title,
  caption,
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  /** A static caption. Omit and pass `measure` for a number read off the frame. */
  caption?: ReactNode;
  measure?: (root: HTMLElement) => string | null;
  children: ReactNode;
}) {
  const { w, h } = SCREENS[screen];
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(hostRef.current), []);
  const paused = usePausedAbove(host);
  const [measured, setMeasured] = useState("measuring");
  const body = measure ? (
    <Measured probe={measure} deps={[screen, id]} onMeasure={setMeasured}>
      {children}
    </Measured>
  ) : (
    children
  );
  return (
    <div ref={hostRef}>
      <Fit w={w}>
        <PausedCtx.Provider value={paused}>
          <Frame
            id={`${id}-${screen}`}
            w={w}
            h={h}
            title={`${title}, ${SCREENS[screen].name}`}
            caption={measure ? measured : caption}
          >
            {/* ★ THE TELEVISION TAKES THE FRAME'S OWN VIEWPORT, NOT `100%`. A
                portalled frame's <body> has no height of its own (the Frame
                writes only `body{margin:0}` into it), so a `size-full`
                television collapsed to zero and every absolutely placed corner
                landed above the top of the wall. Inside the iframe `100vw` and
                `100vh` ARE the declared w and h, which is the whole point of
                judging on a frame rather than a div. */}
            <div
              className="relative overflow-hidden bg-black text-white"
              style={{ width: "100vw", height: "100vh" }}
            >
              {body}
            </div>
          </Frame>
        </PausedCtx.Provider>
      </Fit>
    </div>
  );
}

/** The host's laptop, for the one decision that is not about the wall at all. */
export function Desk({
  id,
  screen,
  title,
  caption,
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  caption?: ReactNode;
  measure?: (root: HTMLElement) => string | null;
  children: ReactNode;
}) {
  const { w, h } = DESK[screen];
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
        title={`${title}, ${DESK[screen].name}`}
        caption={measure ? measured : caption}
      >
        <div
          className="dark bg-background text-foreground"
          style={{ minHeight: "100vh" }}
        >
          {body}
        </div>
      </Frame>
    </Fit>
  );
}

/* ── the moving picture ──────────────────────────────────────────────────── */

/**
 * THE WALL, RUNNING: `drawReelFrame` on a rAF clock, full bleed.
 *
 * ★ REDUCED MOTION SCRUB-LOCKS RATHER THAN BLANKING. The player's own rule is
 * "start paused on frame 0", and three pacing options paused on frame 0 are
 * three identical pictures: the one decision this board asks about motion would
 * arrive at the review as a wall of the same photograph three times, and
 * `lab:demo` runs under reduced motion by design. So a reduced reader gets the
 * frame each pace is ACTUALLY ON at the same wall-clock second, which is the
 * difference the question is about, held still. On the wall itself reduced
 * motion is overridden by the host's explicit act (the round's own call), and
 * this board says so in the ask rather than pretending the wall obeys it.
 */
export function LiveWall({
  reelProps,
  /** The second to hold on when motion is not allowed. */
  holdAt,
  className,
}: {
  reelProps: ReelProps;
  holdAt: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [assets, setAssets] = useState<{
    props: ReelProps;
    set: ReelAssets;
  } | null>(null);
  const paused = useWallPaused();
  const reduced = usePrefersReduced();
  const composition = reelDimensions(reelProps.orientation);
  // The backing store: half the wall's pixels, which is where a raster's cost
  // lives. The draw still runs in COMPOSITION space (makeScaledDrawEnv), so the
  // style never learns it is small.
  const bw = Math.round(composition.width / 2);
  const bh = Math.round(composition.height / 2);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const set = await loadReelAssets(reelProps.clips, {
          ...resolveEngineStyle(reelProps.styleId).assetNeeds(reelProps),
          frame: { width: bw, height: bh },
          decode: sharedBitmapCache.decode,
        });
        if (alive) setAssets({ props: reelProps, set });
      } catch {
        // A capability gap: the wall stays on its theme colour, never a crash.
      }
    })();
    return () => {
      alive = false;
    };
  }, [reelProps, bw, bh]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const set = assets && assets.props === reelProps ? assets.set : null;
    if (!canvas || !set) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const env = makeScaledDrawEnv(composition);
    const total = Math.max(
      1,
      engineStyleDuration(reelProps.styleId, reelProps),
    );
    const paint = (frame: number) => {
      ctx.setTransform(bw / composition.width, 0, 0, bh / composition.height, 0, 0);
      drawReelFrame(ctx, frame % total, reelProps, set, env);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    if (reduced || paused) {
      paint(Math.round(holdAt * FPS));
      return;
    }

    let raf = 0;
    let last = performance.now();
    let time = holdAt;
    const tick = (now: number) => {
      // A hidden tab freezes the clock rather than fast-forwarding it, which is
      // the player's own rule and the reason a wall left up all night does not
      // jump when the laptop wakes.
      if (!document.hidden) time += (now - last) / 1000;
      last = now;
      paint(Math.floor(time * FPS));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [assets, reelProps, composition, bw, bh, paused, reduced, holdAt]);

  return (
    <canvas
      ref={canvasRef}
      width={bw}
      height={bh}
      data-rsc-live=""
      aria-label="The reel, playing"
      className={className ?? "absolute inset-0 size-full bg-[#07080a]"}
    />
  );
}

"use client";

import "./deck.css";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { Fit, Frame, Measured } from "@/components/lab";
import { cn } from "@/lib/utils";

import { SCREENS, type ScreenId } from "../knobs";
import { SLIDES, type SlideId, type Vision } from "./contract";

/**
 * THE DECK: one vision's fourteen slides, each a real viewport (`Frame`, a
 * same-origin iframe), in the contract's one order, so the stage lays a deck
 * out as a sheet of slides whole and as the deck itself at 1:1.
 *
 * ★ THE DECK'S HEAD IS THE AGENCY'S, NEVER THE VISION'S. Every slide carries
 * the same running head (the vision's name, its number, its title, and on a
 * touchpoint the brief's own caption, "a sketch: to judge the system, not the
 * design"), drawn here over the slide's top edge, so three teams' decks read
 * as one presentation and no team can drop the caption. A slide keeps its top
 * `HEAD` pixels clear of words for it (a photograph may run under it).
 *
 * ★ A HIDDEN OPTION STOPS ITS LOOPS. The lab pauses an option off the stage
 * with `[data-lab-view][data-paused] *`, which cannot reach into an iframe's
 * own document, so each slide watches its view's `data-paused` from outside
 * and mirrors it onto its root inside (`data-bd-paused`, `deck.css`): three
 * decks of drifting light would otherwise all run at once.
 *
 * ★ EVERY CAPTION IS READ OFF THE SLIDE: the photographs it drew and loaded,
 * and every piece a drawing marks (`data-bd-read="<what>"` for its words and
 * size, `data-bd-contrast="<what>"` for its text's contrast on the ground
 * behind it), so a slide that claims "4.6:1" says what the frame measured.
 */

/** The running head's band, in px, at each screen: a slide keeps it clear of words. */
export const HEAD: Record<ScreenId, number> = { "1440": 56, "375": 52 };

type SlideCtx = {
  vision: Vision;
  id: SlideId;
  n: number;
  screen: ScreenId;
  w: number;
  h: number;
};

const Ctx = createContext<SlideCtx | null>(null);

/** Where a drawing is: its vision, its slide, the screen and the slide's size. */
export function useSlide(): SlideCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSlide is for a drawing inside a brand slide");
  return c;
}

const two = (n: number) => String(n).padStart(2, "0");

/* ── the caption, read off the slide ────────────────────────────────────── */

const textOf = (el: Element) =>
  ((el as HTMLElement).innerText ?? el.textContent ?? "")
    .replace(/\s+/g, " ")
    .trim();
const clip = (s: string, n = 64) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** sRGB channels of a computed colour, or null when it is not a plain rgb(a). */
function rgba(v: string): [number, number, number, number] | null {
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
}
const lum = ([r, g, b]: number[]) => {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

/** The first opaque background behind an element, read up its ancestors. */
function groundOf(el: Element, win: Window): number[] | null {
  for (let e: Element | null = el; e; e = e.parentElement) {
    const c = rgba(win.getComputedStyle(e).backgroundColor);
    if (c && c[3] > 0.95) return c;
  }
  return null;
}

function readSlide(root: HTMLElement, win: Window): string | null {
  const imgs = [...root.querySelectorAll("img")];
  const loaded = imgs.filter((i) => i.complete && i.naturalWidth > 0).length;
  const parts: string[] = [];
  if (imgs.length)
    parts.push(
      `${loaded} of ${imgs.length} photograph${imgs.length === 1 ? "" : "s"} drawn`,
    );
  for (const el of root.querySelectorAll<HTMLElement>("[data-bd-read]")) {
    const b = el.getBoundingClientRect();
    const words = textOf(el);
    parts.push(
      `${el.dataset.bdRead}: ${words ? `"${clip(words)}" ` : ""}${Math.round(b.width)}×${Math.round(b.height)}`,
    );
  }
  for (const el of root.querySelectorAll<HTMLElement>("[data-bd-contrast]")) {
    const fg = rgba(win.getComputedStyle(el).color);
    const bg = groundOf(el, win);
    if (!fg || !bg) continue;
    const a = lum(fg);
    const b = lum(bg);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    parts.push(`${el.dataset.bdContrast} ${ratio.toFixed(1)}:1`);
  }
  return parts.length ? parts.join("; ") : "nothing marked to read";
}

/* ── one slide ──────────────────────────────────────────────────────────── */

function Slide({
  vision,
  id,
  n,
  screen,
}: {
  vision: Vision;
  id: SlideId;
  n: number;
  screen: ScreenId;
}) {
  const def = SLIDES[n - 1];
  const { w, h: deskH } = SCREENS[screen];
  const h = screen === "375" ? (vision.phoneHeight?.[id] ?? deskH) : deskH;
  const tone = vision.tone?.[id] ?? "dark";
  const [caption, setCaption] = useState("measuring");

  // The view's pause, mirrored into the frame (see the header).
  const outer = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const view = outer.current?.closest("[data-lab-view]");
    if (!view) return;
    const sync = () => setPaused(view.getAttribute("data-paused") === "true");
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(view, { attributes: true, attributeFilter: ["data-paused"] });
    return () => mo.disconnect();
  }, []);

  const title = `${vision.name} · ${two(n)} ${def.title}${def.touchpoint ? " (a sketch)" : ""}, ${SCREENS[screen].name}`;
  return (
    <div ref={outer} className="min-w-0">
      <Fit w={w}>
        <Frame
          id={`brand-${vision.id}-${id}-${screen}`}
          w={w}
          h={h}
          title={title}
          caption={caption}
        >
          <Measured
            probe={readSlide}
            deps={[vision.id, id, screen]}
            onMeasure={setCaption}
            timers={[400, 1400, 3000]}
          >
            <Ctx.Provider value={{ vision, id, n, screen, w, h }}>
              <div
                data-bd-slide={id}
                data-bd-screen={screen}
                data-bd-tone={tone}
                data-bd-paused={paused ? "" : undefined}
                className={cn("bd-slide", vision.fonts)}
                style={{ width: w, height: h }}
              >
                {vision.slides[id]({ screen })}
                <SlideHead
                  vision={vision}
                  n={n}
                  title={def.title}
                  touchpoint={def.touchpoint}
                  screen={screen}
                />
              </div>
            </Ctx.Provider>
          </Measured>
        </Frame>
      </Fit>
    </div>
  );
}

/** The agency's running head over every slide (see the header). */
function SlideHead({
  vision,
  n,
  title,
  touchpoint,
  screen,
}: {
  vision: Vision;
  n: number;
  title: string;
  touchpoint: boolean;
  screen: ScreenId;
}) {
  const desk = screen === "1440";
  return (
    <header
      data-bd-head=""
      className="bd-head"
      style={{ height: HEAD[screen] }}
      aria-label={`${vision.name}, slide ${n} of ${SLIDES.length}: ${title}`}
    >
      <span className="bd-head-name">
        Partyreel <span aria-hidden>×</span> {vision.name}
      </span>
      <span className="bd-head-where">
        <span className="tabular-nums">
          {two(n)}
          {desk && <span className="bd-head-of"> / {SLIDES.length}</span>}
        </span>
        <span>{title}</span>
        {touchpoint && (
          <span className="bd-head-sketch">
            {desk
              ? "A sketch: to judge the system, not the design"
              : "A sketch: the system, not the design"}
          </span>
        )}
      </span>
    </header>
  );
}

/* ── the deck ───────────────────────────────────────────────────────────── */

/**
 * THE AUTHOR'S NARROWING, read off the lab page's own address: `only=<vision>`
 * draws one deck and leaves the others empty, `slides=<id>,<id>` draws those
 * slides alone, so a team iterating on its own deck loads fourteen frames
 * rather than forty-two. Absent (always, for Will), every deck is whole. The
 * server snapshot is "absent", so a narrowed page hydrates whole and narrows
 * on its first client render, which `useSyncExternalStore` makes legal.
 */
const noop = () => () => {};
function useNarrowing(): { only: string | null; slides: string[] | null } {
  const search = useSyncExternalStore(
    noop,
    () => window.location.search,
    () => "",
  );
  const p = new URLSearchParams(search);
  const slides = p.get("slides");
  return {
    only: p.get("only"),
    slides: slides ? slides.split(",").filter(Boolean) : null,
  };
}

/**
 * A VISION'S DECK: its slides top to bottom (a column of frames, which the
 * whole stage lays out as a sheet that wraps), at the screen the board's knob
 * reads on.
 */
export function Deck({
  vision,
  screen,
}: {
  vision: Vision;
  screen: ScreenId;
}): ReactNode {
  const { only, slides } = useNarrowing();
  if (only && only !== vision.id)
    return (
      <p className="text-sm text-muted-foreground">
        Narrowed to {only}: this deck is not drawn.
      </p>
    );
  return (
    <div className="flex flex-col gap-8">
      {SLIDES.map((s, i) =>
        slides && !slides.includes(s.id) ? null : (
          <Slide
            key={`${vision.id}-${s.id}-${screen}`}
            vision={vision}
            id={s.id}
            n={i + 1}
            screen={screen}
          />
        ),
      )}
    </div>
  );
}

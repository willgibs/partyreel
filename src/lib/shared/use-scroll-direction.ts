"use client";

/**
 * WHICH WAY THE PAGE IS MOVING, as a store (`on-scroll=hide`, Will 2026-09-19:
 * "Hides going down, returns coming up").
 *
 * ★ THE ONE PASSIVE SCROLL LISTENER ON THE SITE, AND WHY THE HOUSE RULE STILL
 * HOLDS. The chrome's standing rule ("never a scroll listener",
 * header-shell.tsx and use-in-view-sentinel.ts) is about a BOOLEAN ABOUT ONE
 * ELEMENT: whether the header is past the top of the page is exactly what an
 * IntersectionObserver answers, off the main thread, for free. Direction is a
 * different question. It is the SIGN OF THE DELTA between two scroll
 * positions, no element has it, and no observer reports it. So the listener
 * lives here, once, and pays for itself:
 *   • `{ passive: true }`, so it can never block a scroll;
 *   • rAF-coalesced, so a 120 Hz trackpad firing sixty events a frame still
 *     measures once, at the moment the frame is about to paint;
 *   • ONE module-level store shared by every consumer, attached on the first
 *     subscriber and detached on the last, so the page carries no listener at
 *     all while nothing is reading it;
 *   • the measurement is a single `window.scrollY` read and no DOM write, so
 *     it can never force a layout.
 *
 * ★ THE STATE MACHINE IS ASYMMETRIC, ON PURPOSE. Hiding the bar takes 8px of
 * deliberate downward movement; returning it takes ANY upward movement at all.
 * A bar that leaves is a thing the reader did not ask for, so it must be sure;
 * a bar that comes back is the thing they DID ask for, so it must be eager.
 * The same asymmetry runs the clocks in header-shell.tsx.
 *
 * The reducer is exported pure so the machine is tested as arithmetic rather
 * than as a browser (use-scroll-direction.test.ts).
 */
import { useSyncExternalStore } from "react";

/**
 * Where the page is, as far as the chrome cares.
 *   • `top`  — inside the reveal zone at the head of the page.
 *   • `up`   — the last real movement was upward (and a page that loaded
 *              already scrolled seeds here: nothing has been scrolled yet, and
 *              the visible state is the default, bible 5).
 *   • `down` — the reader is moving away, past the hysteresis.
 * `top` and `up` read identically to a consumer; only `down` hides anything.
 */
export type ScrollDirection = "top" | "up" | "down";

export type ScrollState = { direction: ScrollDirection; anchor: number };

/**
 * The head of the page where the bar always shows, in pixels. One
 * `--mkt-header-h` (4rem, marketing.css): a bar may not hide while it would
 * still be standing over its own first screen, and a zone rather than a pixel
 * is what stops an elastic overscroll from flickering it. A literal because
 * the root 404 renders this chrome WITHOUT marketing.css, so the token is
 * simply unset there; a source pin in header-shell-contract.test.tsx holds the
 * two numbers in step.
 */
const REVEAL_ZONE_PX = 64;

/** How far down the reader must commit before the bar leaves. */
const DOWN_HYSTERESIS_PX = 8;

/**
 * The machine, pure. `anchor` is the furthest point reached in the CURRENT
 * direction, never the point of the last flip: without that trailing, a slow
 * reader who drifts 8px down over ten frames would flip the bar off on the
 * eleventh and a fast one never would.
 */
export function step(state: ScrollState, rawY: number): ScrollState {
  // Rounded so sub-pixel jitter on a fractional-DPR display cannot read as an
  // upward gesture; clamped so an iOS rubber-band (a negative scrollY) is the
  // top of the page rather than a scroll upward past it.
  const y = Math.max(0, Math.round(rawY));
  if (y <= REVEAL_ZONE_PX) return { direction: "top", anchor: y };
  // Any upward movement at all, checked BEFORE the downward gate: this is the
  // eager half of the asymmetry.
  if (y < state.anchor) return { direction: "up", anchor: y };
  if (y > state.anchor + DOWN_HYSTERESIS_PX)
    return { direction: "down", anchor: y };
  // Inside the band. Trail the anchor while already moving down so the next
  // 8px is measured from here; otherwise hold everything still.
  if (state.direction === "down" && y > state.anchor)
    return { direction: "down", anchor: y };
  return state;
}

/** The position a fresh reading starts from: shown, whatever the scroll. */
export function seedFrom(rawY: number): ScrollState {
  const y = Math.max(0, Math.round(rawY));
  return { direction: y <= REVEAL_ZONE_PX ? "top" : "up", anchor: y };
}

/* ── The store ───────────────────────────────────────────────────────────── */

let state: ScrollState = { direction: "top", anchor: 0 };
let frame = 0;
const listeners = new Set<() => void>();

function commit(next: ScrollState) {
  const changed = next.direction !== state.direction;
  state = next;
  // Only a DIRECTION change is a new snapshot; an anchor that trails the
  // scroll is bookkeeping and must never wake React.
  if (changed) for (const listener of listeners) listener();
}

function measure() {
  commit(step(state, window.scrollY));
}

function onScroll() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    measure();
  });
}

/** A restore from the back-forward cache keeps React's state AND the scroll
 *  position, so a bar that was hidden when the reader left would still be
 *  hidden when they come back to a page they did not scroll. Re-seed instead. */
function onPageShow() {
  commit(seedFrom(window.scrollY));
}

function subscribe(onStoreChange: () => void) {
  if (listeners.size === 0) {
    // Seeded before the listener is registered, so this first read never
    // notifies: React re-reads the snapshot after subscribing anyway.
    state = seedFrom(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pageshow", onPageShow);
  }
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size > 0) return;
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pageshow", onPageShow);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    // A module store outlives the component. Reset, or a header that unmounts
    // hidden (a cinema → paper navigation swaps the group layout) would mount
    // hidden on a page nobody has scrolled.
    state = { direction: "top", anchor: 0 };
  };
}

const getSnapshot = () => state.direction;
/** Prerender and the first client render agree on SHOWN, so ~50 static
 *  marketing routes hydrate identically (bible 5). */
const getServerSnapshot = (): ScrollDirection => "top";

export function useScrollDirection(): ScrollDirection {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Re-seed after a client navigation. The App Router scrolls the new page to the
 * top a beat AFTER it commits, so a reader who left through a footer link while
 * the bar was hidden would watch it slide back in over the new page's first
 * paint. Called from a layout effect, never during render.
 */
export function resetScrollDirection() {
  commit(seedFrom(window.scrollY));
}

import { type RefObject, useLayoutEffect, useRef } from "react";

/**
 * ★ THE FOLD: the five cards become the five pills as the row reaches the bar, and the pills the cards as it leaves, one
 * continuous movement, each piece travelling from where it stood to where it stands (FLIP: first, last, invert, play).
 * Event-header r4's cards, Will's pick; the board drew it (r6's `useFold`) and this is the production's.
 *
 * ★ THE BAND'S `data-stuck` IS FLIPPED HERE, BY HAND, BETWEEN THE TWO READS: React never writes it, so the old form is
 * still on screen when this effect reads it and the new one is there to read next. The attribute is also the whole of the
 * condense: the same DOM in both forms, never a second component swapped in, because a remount would drop the code chip's
 * `view-transition-name` mid-morph and restart the ticking count.
 *
 * ★ EVERYTHING THAT MOVES IS A TRANSFORM, AN OPACITY OR THE SKIN'S ABSOLUTELY PLACED BOX. The band's own height never
 * animates, so the footprint it sits in (`useStuckBand`) can never read it half done: it holds the resting height, read
 * only at rest (the loop `event-cards-row.tsx` describes). And the flip happens in a layout effect, so the footprint has
 * the band in its new form before anything reads it.
 *
 * ★ REVIEW FIRST: the doors leave in a cascade from the row's middle out (Review, the door pressed most at a party, then
 * its neighbours, the row's ends last), a few milliseconds apart, so five pieces landing at once read as one movement
 * with a direction rather than a jump.
 *
 * ★ INTERRUPTIBLE: a fold reversed mid-flight starts from where each piece visibly is, since a rect reads its running
 * animation, never from where it was headed. A row that is stuck from its first report (a reload restored below the bar)
 * flips at once: that page was never at rest to fold from.
 *
 * ★ REDUCED MOTION DISSOLVES, NEVER SNAPS (r6's carried `reduced-fold`): the new form develops in place over 150ms and
 * nothing travels, the band's ground there at once and its doors fading up on it. Web animations are outside the global
 * guard's clamp, which is why this one is written here and kept to an opacity.
 *
 * ★ NO CSS TRANSITION ON ANYTHING IT CARRIES (`room-card.css`): a running transition outranks an animation in the cascade
 * and would steal its frames.
 */

/** The fold is occasional (once a pass of the bar), so it is quick: under 300ms (bible 5). */
const FOLD_MS = 260;

/** Between one door and the next, from the row's middle out. */
const CASCADE_MS = 12;

/** Reduced motion's fold: the new form develops in place (the reveal chips' own 150ms, linear). */
const DISSOLVE_MS = 150;

/** The drawer's curve (`--ease-drawer`), read where the token is unreadable. */
const DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";

/** Where a piece stands, how round its corner is and how lit, as the eye sees it now (a running fold included). */
function stance(el: HTMLElement, win: Window) {
  const style = win.getComputedStyle(el);
  return {
    box: el.getBoundingClientRect(),
    radius: parseFloat(style.borderTopLeftRadius) || 0,
    opacity: parseFloat(style.opacity),
  };
}

/**
 * Folds `band`'s pieces (every `[data-fold]` in it) as `stuck` changes. `instantRef` is read once per change and cleared: the
 * row sets it for a first report that finds the page already below the bar.
 */
export function useDoorFold(
  band: RefObject<HTMLDivElement | null>,
  stuck: boolean,
  instantRef: RefObject<boolean>,
) {
  const flights = useRef<Animation[]>([]);
  useLayoutEffect(() => {
    const el = band.current;
    if (!el) return;
    const win = el.ownerDocument.defaultView ?? window;
    const skip = instantRef.current;
    instantRef.current = false;
    if (el.hasAttribute("data-stuck") === stuck) return;
    const settle = () => {
      for (const f of flights.current) f.cancel();
      flights.current = [];
    };
    if (skip || typeof el.animate !== "function") {
      settle();
      el.toggleAttribute("data-stuck", stuck);
      return;
    }
    if (!win.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      settle();
      el.toggleAttribute("data-stuck", stuck);
      // What stands on the band develops (the face, the doors, the code); its ground is there at once, as in the moving fold.
      for (const p of el.querySelectorAll<HTMLElement>(
        ':scope > :not([data-fold="veil"])',
      ))
        flights.current.push(
          p.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: DISSOLVE_MS,
            easing: "linear",
          }),
        );
      return;
    }
    const parts = [...el.querySelectorAll<HTMLElement>("[data-fold]")];
    // ★ Read where each piece visibly is BEFORE the flights in the air are cancelled: a rect reads a running animation, so
    // a fold reversed mid-flight starts from there rather than jumping to where the last one was headed.
    const from = parts.map((p) => stance(p, win));
    const was = new Map(parts.map((p, i) => [p, from[i]] as const));
    settle();
    el.toggleAttribute("data-stuck", stuck);
    const to = parts.map((p) => stance(p, win));
    const ease =
      win.getComputedStyle(el).getPropertyValue("--ease-drawer").trim() ||
      DRAWER;
    const doors = [...el.querySelectorAll<HTMLElement>(".hub-door")];
    /** A door's piece waits its turn: Review first, then its neighbours, the row's ends last. */
    const turn = (p: HTMLElement) => {
      const door = p.closest<HTMLElement>(".hub-door");
      const i = door ? doors.indexOf(door) : -1;
      return i < 0 ? 0 : Math.abs(i - 2) * CASCADE_MS;
    };
    const fly = (
      p: HTMLElement,
      frames: Keyframe[],
      extra: KeyframeAnimationOptions = {},
    ) =>
      flights.current.push(
        p.animate(frames, {
          duration: FOLD_MS,
          easing: ease,
          fill: "backwards",
          ...extra,
        }),
      );
    parts.forEach((p, i) => {
      const a = from[i];
      const b = to[i];
      // Hidden in the new form: it simply goes, as an exit should (faster than an entrance).
      if (b.box.width === 0) return;
      const kind = p.dataset.fold;
      const arrives = a.box.width === 0;
      const delay = turn(p);
      // ★ The band's ground is there from the fold's first frame: a ground that faded in let the album's own words print
      // through the gaps and under the face as it arrived. Everything else moves over it.
      if (kind === "veil") return;
      if (kind === "lead" || kind === "code") {
        // The cover's face slides in at the band's head; the code arrives once the doors nearest it have passed the place
        // it stands.
        if (arrives)
          fly(
            p,
            kind === "lead"
              ? [
                  { opacity: 0, transform: "translateX(-8px)" },
                  { opacity: 1, transform: "none" },
                ]
              : [
                  { opacity: 0, transform: "scale(0.9)" },
                  { opacity: 1, transform: "none" },
                ],
            kind === "lead"
              ? { duration: 200, delay: 60 }
              : { duration: 160, delay: 120 },
          );
        return;
      }
      if (kind === "title" || kind === "word") {
        // The card's title becomes the pill's word and back, flying with its glyph from wherever its other form stood, so
        // no word lands while a glyph is still crossing it.
        const other = p
          .closest(".hub-door")
          ?.querySelector<HTMLElement>(
            `[data-fold="${kind === "title" ? "word" : "title"}"]`,
          );
        const o = other ? was.get(other) : undefined;
        if (arrives && o && o.box.width > 0) {
          fly(
            p,
            [
              {
                transformOrigin: "0 0",
                transform: `translate(${o.box.left - b.box.left}px, ${o.box.top - b.box.top}px) scale(${o.box.height / b.box.height})`,
              },
              { transformOrigin: "0 0", transform: "none" },
            ],
            { delay },
          );
          return;
        }
      }
      if (kind === "title" || kind === "word" || kind === "text" || arrives) {
        // Words with no other form to fly from (a card's line, a hand's titles) and a badge only one form shows (a count
        // hers, on a pill) develop in the fold's last stretch, once the glyphs beside them have all but landed.
        if (arrives)
          fly(p, [{ opacity: 0 }, { opacity: 1 }], {
            duration: 130,
            delay: 140 + delay,
            easing: "ease-out",
          });
        return;
      }
      const dx = a.box.left - b.box.left;
      const dy = a.box.top - b.box.top;
      if (kind === "skin") {
        // The surface's own box travels, so its corner and its shadow never stretch.
        fly(
          p,
          [
            {
              left: `${dx}px`,
              top: `${dy}px`,
              width: `${a.box.width}px`,
              height: `${a.box.height}px`,
              borderRadius: `${Math.min(a.radius, a.box.height / 2)}px`,
            },
            {
              left: "0px",
              top: "0px",
              width: `${b.box.width}px`,
              height: `${b.box.height}px`,
              borderRadius: `${Math.min(b.radius, b.box.height / 2)}px`,
            },
          ],
          { delay },
        );
        return;
      }
      // A glyph, its disc or its badge: carried and scaled whole, never stretched, and a piece lit in one form and clear in
      // the other (the disc) fading on the way.
      const s = a.box.width / b.box.width;
      const lit = a.opacity !== b.opacity;
      fly(
        p,
        [
          {
            transformOrigin: "0 0",
            transform: `translate(${dx}px, ${dy}px) scale(${s})`,
            ...(lit ? { opacity: a.opacity } : {}),
          },
          {
            transformOrigin: "0 0",
            transform: "none",
            ...(lit ? { opacity: b.opacity } : {}),
          },
        ],
        { delay },
      );
    });
  }, [band, stuck, instantRef]);
}

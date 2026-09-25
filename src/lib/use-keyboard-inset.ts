"use client";

/**
 * THE KEYBOARD, AS A NUMBER A SHEET CAN STAND ON.
 *
 * A phone's software keyboard does not shrink the page on iOS: the layout viewport keeps its full
 * height, so a `position: fixed; bottom: 0` sheet stays glued to the bottom of the SCREEN and the
 * keyboard slides up over it. What does shrink is the visual viewport, and iOS may also pan it
 * down (`offsetTop`) to reveal the focused field. The part of the layout viewport the keyboard
 * hides is therefore everything below `offsetTop + height`, and lifting the sheet by exactly that
 * much keeps its foot on the keyboard's top edge whatever iOS does with the pan:
 *
 *   inset = max(0, round(innerHeight − (vv.offsetTop + vv.height)))
 *
 * ★ vaul's `repositionInputs` got this wrong in two ways, which is why the door left it: it lifted
 * by `innerHeight − vv.height` and ignored `offsetTop`, so its lift STACKED with iOS's own pan and
 * threw the sheet up past the keyboard; and it pinned the drawer's height the first time the
 * keyboard opened and never reset it, across steps of different heights.
 *
 * ★ THE INSET IS 0 UNLESS A TEXT FIELD INSIDE THE SHEET HOLDS FOCUS. That one condition does three
 * jobs: a sheet nobody is typing into is byte-for-byte the sheet it always was (every guest and
 * host phone sheet rides this primitive), a pinch-zoom never moves a sheet, and iOS 26's stale
 * `offsetTop` after the keyboard closes (the visual viewport forgets to come back) cannot strand a
 * sheet mid-screen, because closing the keyboard blurs the field.
 *
 * ★ ANDROID, TWO WAYS. Chrome's default (`resizes-visual`) behaves like iOS and the formula lifts;
 * with the guest layout's `interactive-widget=resizes-content` the layout viewport itself shrinks,
 * `vv.height === innerHeight`, the inset is 0 and nothing needs lifting. The keyboard is still up
 * there, so `open` reads it off the layout viewport shrinking from its resting height instead.
 */
import { useEffect } from "react";

/** One reading of the viewport, everything the decision needs and nothing it has to look up. */
export type ViewportReading = {
  innerHeight: number;
  vvHeight: number;
  vvOffsetTop: number;
  /** A text field inside the sheet holds focus. */
  fieldFocused: boolean;
  /** `innerHeight` as it last stood with no field focused (the resizes-content baseline). */
  restHeight: number;
};

export type KeyboardReading = {
  /** How far the keyboard overlaps the layout viewport's foot, in px (0 when nothing is typed). */
  inset: number;
  /** The keyboard is up: it overlays the page, or the page was resized around it. */
  open: boolean;
};

/**
 * Below this much visible height a sticky foot would sit on the very field being typed into (a
 * phone in landscape: an iPhone SE shows 81px above its keyboard), so the sheet is marked `tight`
 * instead of `open` and its primary scrolls with the content.
 */
export const TIGHT_PX = 200;

/**
 * Less than this and it is not a keyboard: a rounding sliver, an iPad's floating shortcut strip,
 * or Safari's toolbar settling. It gates `open` only; the inset itself is applied as measured.
 */
export const KEYBOARD_MIN_PX = 60;

/** The pure decision, unit-tested (`use-keyboard-inset.test.ts`). */
export function readKeyboard(r: ViewportReading): KeyboardReading {
  if (!r.fieldFocused) return { inset: 0, open: false };
  const inset = Math.max(
    0,
    Math.round(r.innerHeight - (r.vvOffsetTop + r.vvHeight)),
  );
  // ★ "OPEN" IS THE KEYBOARD'S SIZE, NEVER THE LIFT'S. A pan shrinks the lift (measured on an
  // iPhone SE: iOS scrolled 191px and left a 36px inset under a 226px keyboard), so the foot must
  // read how much of the layout viewport the keyboard covers, pan or no pan; or, where the page
  // was resized around it instead, how far the layout viewport shrank from rest.
  const covered = r.innerHeight - r.vvHeight;
  const resized = r.restHeight - r.innerHeight;
  return {
    inset,
    open: covered >= KEYBOARD_MIN_PX || resized >= KEYBOARD_MIN_PX,
  };
}

/** Input types that raise no keyboard (a tap on them never needs the sheet lifted). */
const NO_KEYBOARD = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

/** Whether an element takes typing: an editable text input, a textarea, or contenteditable. */
export function isTextField(
  el: EventTarget | null | undefined,
): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (el instanceof HTMLTextAreaElement) return !el.readOnly && !el.disabled;
  if (el instanceof HTMLInputElement) {
    return !NO_KEYBOARD.has(el.type) && !el.readOnly && !el.disabled;
  }
  return el instanceof HTMLElement && el.isContentEditable;
}

/**
 * THE FOCUSED FIELD, SCROLLED INTO VIEW INSIDE THE SHEET AND NOWHERE ELSE (`block: "nearest"`).
 *
 * `scrollIntoView` would do this in one line and also scroll every scrollable ancestor, the page
 * behind a modal included, which on iOS means nudging the very visual viewport the inset is
 * computed from. So the nearest-edge arithmetic is done here against the sheet's own scroller:
 * nothing moves when the field is already in view, and a field under the sticky primary (the
 * sheet's foot while the keyboard is up) counts as hidden.
 */
export function revealInSheet(field: HTMLElement, sheet: HTMLElement): void {
  let scroller: HTMLElement | null = null;
  for (
    let node: HTMLElement | null = field.parentElement;
    node;
    node = node === sheet ? null : node.parentElement
  ) {
    const { overflowY } = getComputedStyle(node);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      scroller = node;
      break;
    }
  }
  if (!scroller) return;

  const box = scroller.getBoundingClientRect();
  const f = field.getBoundingClientRect();
  // The visible band ends where the sticky foot begins, wherever it is stuck (the scroller's own
  // padding sits under it). Only a foot that comes AFTER the field can cover it: a primary above
  // the field scrolls away with the content.
  let limit = box.bottom;
  for (const el of scroller.querySelectorAll<HTMLElement>(
    "[data-sheet-primary]",
  )) {
    if (el.contains(field)) continue;
    if (getComputedStyle(el).position !== "sticky") continue;
    if (el.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_PRECEDING) {
      limit = Math.min(limit, el.getBoundingClientRect().top);
    }
  }
  const MARGIN = 8;
  const top = box.top + MARGIN;
  const bottom = limit - MARGIN;
  if (f.bottom > bottom) {
    scroller.scrollTop += Math.min(f.bottom - bottom, f.top - top);
  } else if (f.top < top) {
    scroller.scrollTop -= top - f.top;
  }
}

/** The desk half, where a sheet is a side panel from the right edge. */
const DESK = "(min-width: 640px)";
/** A touch screen: a phone (either orientation) or a tablet, where a software keyboard exists. */
const COARSE = "(pointer: coarse)";

/**
 * iOS and iPadOS, whichever browser: all of them are WebKit underneath, and they share the two
 * habits the hook works around (scrolling the page to reveal a field, and reporting the keyboard
 * only once it has finished rising). iPadOS reports itself as a Mac, so touch points tell it apart.
 */
export function isIOSWebKit(
  nav: Pick<Navigator, "userAgent" | "maxTouchPoints"> = navigator,
): boolean {
  return (
    /iP(hone|od|ad)/.test(nav.userAgent) ||
    (/Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1)
  );
}

/** Which keyboard a field raises: they differ in height (the email one has no suggestions row). */
export function keyboardKind(field: HTMLElement): "text" | "email" | "numeric" {
  if (field instanceof HTMLInputElement) {
    if (field.type === "email" || field.inputMode === "email") return "email";
    if (
      field.type === "number" ||
      field.type === "tel" ||
      field.inputMode === "numeric" ||
      field.inputMode === "decimal" ||
      field.inputMode === "tel"
    ) {
      return "numeric";
    }
  }
  return "text";
}

/** How long a focus waits for the keyboard's first measurement before it trusts that none is coming. */
const PREDICT_MS = 1000;
/**
 * A first guess at a portrait phone's keyboard, as a share of Safari's visible height, for the
 * first focus of a visit (nothing remembered yet): the midpoints of what an iPhone SE on iOS 17
 * and an iPhone 17 on iOS 26 measured (text 227 of 547 and 337 of 714; email and digits 183 of
 * 547 and 310 of 714). Within about 30px either way, so the sheet rides up with the keyboard and
 * settles by that much when the real height lands, instead of jumping the whole way after it.
 */
const KEYBOARD_GUESS = { text: 0.44, email: 0.385, numeric: 0.385 } as const;
const SEEN_KEY = "pr_keyboard_seen";
/** The keyboards measured this visit, by viewport size and kind (and the tab's, via sessionStorage). */
const seen = new Map<string, number>();

function recallKeyboard(key: string): number | undefined {
  if (seen.has(key)) return seen.get(key);
  try {
    const stored = JSON.parse(
      sessionStorage.getItem(SEEN_KEY) ?? "{}",
    ) as Record<string, unknown>;
    const px = stored[key];
    if (typeof px === "number" && px > 0 && px < 2000) {
      seen.set(key, px);
      return px;
    }
  } catch {
    // Blocked or corrupt storage: this visit measures its own.
  }
  return undefined;
}

function rememberKeyboard(key: string, px: number) {
  if (seen.get(key) === px) return;
  seen.set(key, px);
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(Object.fromEntries(seen)));
  } catch {
    // A convenience only: the next focus measures again.
  }
}

/**
 * Write the keyboard onto a sheet: `--kb-inset` (the lift), `--vv-h` (the visible height its
 * ceiling is measured from), `--vv-top` (where the visible area starts, which the desk half's
 * full-height panel stands on) and `data-keyboard="open"`, one update per frame from the visual
 * viewport's resize and scroll, the sheet's own focus changes and the glides settling inside it.
 * Everything is removed whenever no text field inside holds focus, on a laptop's desk half (a fine
 * pointer, no software keyboard), and on unmount. A phone turned to landscape crosses the desk
 * breakpoint and keeps it: its pointer is coarse.
 *
 * ★ THE PAGE BEHIND NEVER SCROLLS (iOS). Measured on the simulators with a sheet open over a long
 * album: focusing a field near the sheet's foot made iOS scroll the page itself (191px on an
 * iPhone SE, 426px on an iPhone 17) to centre the field above the keyboard, and the album stayed
 * scrolled after the sheet closed; `overflow: hidden` on the body stops none of it. So, on iOS only
 * and only for a text field inside this sheet:
 *   1. a TAP on a field is taken over at `touchend` and the field focused here, having first been
 *      moved (for one frame, by a transform) to the top of what is visible, where there is nothing
 *      for iOS to reveal; the same shelter is applied in the focus event for the keyboard's
 *      previous and next arrows (react-aria's recipe, the one vaul carried, minus its page jump:
 *      the field goes to the top of the VISIBLE area rather than 2000px up, so a page that is
 *      already scrolled has nothing to scroll back to);
 *   2. while a field is focused, the page's scroll is held where it was, and any scroll iOS still
 *      makes is put straight back (the last resort).
 * A scroll gesture that happens to end on a field is not a tap and is left alone.
 *
 * ★ iOS REPORTS THE KEYBOARD LATE: `visualViewport` resizes once the keyboard has finished rising,
 * so a sheet that waits for it is covered for a beat and then jumps. The height a keyboard kind
 * took on this viewport is remembered (this visit, and the tab's `sessionStorage`), and the next
 * focus lifts to it at once, riding up WITH the keyboard; the measurement that follows only
 * corrects it. The first focus of a visit has nothing to recall and lifts when the keyboard lands.
 * A prediction that no keyboard confirms within a second (a hardware keyboard) is dropped.
 *
 * Pass the element itself (a callback-ref'd state), not a ref: a Radix sheet's content mounts a
 * render after its portal, so a ref read in the first effect would still be null.
 */
export function useKeyboardInset(el: HTMLElement | null, enabled = true) {
  useEffect(() => {
    const vv = typeof window === "undefined" ? null : window.visualViewport;
    if (!enabled || !el || !vv) return;
    const desk = window.matchMedia(DESK);
    const coarse = window.matchMedia(COARSE);
    const ios = isIOSWebKit();
    let frame = 0;
    let restHeight = window.innerHeight;
    let lastInset = -1;
    let lastField: Element | null = null;
    let settled = false;
    // A field inside holds focus (as of the last update).
    let typing = false;
    // Until when a focus may stand on a remembered keyboard before the real one is measured.
    let predictUntil = 0;
    let predictTimer = 0;
    // The page's scroll, held while a field is focused (iOS).
    let pinnedY: number | null = null;
    let touchAt: { x: number; y: number } | null = null;

    const clear = () => {
      el.style.removeProperty("--kb-inset");
      el.style.removeProperty("--vv-h");
      el.style.removeProperty("--vv-top");
      el.removeAttribute("data-keyboard");
    };

    const typingSurface = () => !desk.matches || coarse.matches;

    const apply = () => {
      frame = 0;
      const active = document.activeElement;
      // A phone in either orientation, or a tablet: wherever a software keyboard can rise. A
      // landscape phone is wider than the desk breakpoint, so width alone would miss it; a laptop
      // (a fine pointer at the desk half) never reads the keyboard at all.
      const fieldFocused =
        typingSurface() && isTextField(active) && el.contains(active);
      if (!fieldFocused) {
        restHeight = window.innerHeight;
        lastInset = -1;
        lastField = null;
        settled = false;
        typing = false;
        pinnedY = null;
        predictUntil = 0;
        clear();
        return;
      }
      typing = true;
      const kind = keyboardKind(active);
      const key = `${window.innerWidth}x${window.innerHeight}:${kind}`;
      const covered = window.innerHeight - vv.height;
      const arrived = covered > 0 || restHeight - window.innerHeight > 0;
      let reading = readKeyboard({
        innerHeight: window.innerHeight,
        vvHeight: vv.height,
        vvOffsetTop: vv.offsetTop,
        fieldFocused,
        restHeight,
      });
      let vvHeight = vv.height;
      if (reading.open && covered >= KEYBOARD_MIN_PX) {
        rememberKeyboard(key, covered);
      } else if (!arrived && ios && performance.now() < predictUntil) {
        // The keyboard is rising and has not been measured yet: stand on the one last seen here,
        // or, on a portrait phone that has seen none, on a guess of it.
        const portraitPhone =
          !desk.matches && window.innerHeight > window.innerWidth;
        const predicted =
          recallKeyboard(key) ??
          (portraitPhone
            ? Math.round(window.innerHeight * KEYBOARD_GUESS[kind])
            : undefined);
        if (predicted !== undefined) {
          reading = { inset: predicted, open: true };
          vvHeight = window.innerHeight - predicted;
        }
      }
      const { inset, open } = reading;
      el.style.setProperty("--kb-inset", `${inset}px`);
      el.style.setProperty("--vv-h", `${Math.round(vvHeight)}px`);
      el.style.setProperty("--vv-top", `${Math.round(vv.offsetTop)}px`);
      if (open) {
        el.setAttribute(
          "data-keyboard",
          vvHeight < TIGHT_PX ? "tight" : "open",
        );
      } else {
        el.removeAttribute("data-keyboard");
      }
      // On focus, on every change of the lift (the keyboard arriving, iOS panning, a rotation),
      // and whenever a glide inside the sheet settles, the field is brought into view inside it.
      if (settled || active !== lastField || inset !== lastInset) {
        revealInSheet(active, el);
      }
      settled = false;
      lastField = active;
      lastInset = inset;
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    /** For one frame, stand the field at the top of what is visible, where iOS has nothing to reveal. */
    const shelter = (field: HTMLElement) => {
      if (field.dataset.keyboardShelter !== undefined) return;
      const lift = Math.round(
        vv.offsetTop + 8 - field.getBoundingClientRect().top,
      );
      if (lift >= 0) return;
      const before = field.style.transform;
      field.dataset.keyboardShelter = "";
      field.style.transform = `translateY(${lift}px)`;
      requestAnimationFrame(() => {
        field.style.transform = before;
        delete field.dataset.keyboardShelter;
      });
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      touchAt = t ? { x: t.clientX, y: t.clientY } : null;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const field = e.target;
      if (
        !ios ||
        !typingSurface() ||
        !isTextField(field) ||
        field === document.activeElement ||
        !el.contains(field)
      ) {
        return;
      }
      const t = e.changedTouches[0];
      // The end of a scroll that happened to start on a field is not a tap on it.
      if (
        !t ||
        !touchAt ||
        Math.hypot(t.clientX - touchAt.x, t.clientY - touchAt.y) > 10
      ) {
        return;
      }
      e.preventDefault();
      if (pinnedY === null) pinnedY = window.scrollY;
      shelter(field);
      field.focus({ preventScroll: true });
    };

    const onFocusIn = (e: FocusEvent) => {
      const field = e.target;
      if (ios && typingSurface() && isTextField(field)) {
        if (pinnedY === null) pinnedY = window.scrollY;
        // The keyboard's previous and next arrows move focus without a tap: shelter here too.
        shelter(field);
        if (!typing) {
          // The keyboard is about to rise: a remembered height may be stood on until it is measured.
          predictUntil = performance.now() + PREDICT_MS;
          window.clearTimeout(predictTimer);
          predictTimer = window.setTimeout(schedule, PREDICT_MS + 50);
        }
      }
      schedule();
    };

    const onWindowScroll = () => {
      if (pinnedY !== null && window.scrollY !== pinnedY) {
        window.scrollTo(window.scrollX, pinnedY);
      }
    };

    // ★ A GLIDE THAT SETTLES CAN MOVE THE FIELD: the door's step container eases its height over
    // 300ms (the ghost line opening into a field, an error line arriving), and the sheet's own lift
    // eases its `bottom`, so a field revealed at the focus can end up under the sticky foot once
    // the height lands. Their `transitionend` re-reveals it.
    const onTransitionEnd = (e: TransitionEvent) => {
      if (
        e.propertyName === "height" ||
        e.propertyName === "max-height" ||
        e.propertyName === "bottom" ||
        e.propertyName === "top"
      ) {
        settled = true;
        schedule();
      }
    };

    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", schedule);
    el.addEventListener("transitionend", onTransitionEnd);
    if (ios) {
      el.addEventListener("touchstart", onTouchStart, {
        capture: true,
        passive: true,
      });
      el.addEventListener("touchend", onTouchEnd, {
        capture: true,
        passive: false,
      });
      window.addEventListener("scroll", onWindowScroll);
    }
    schedule();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(predictTimer);
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", schedule);
      el.removeEventListener("transitionend", onTransitionEnd);
      el.removeEventListener("touchstart", onTouchStart, true);
      el.removeEventListener("touchend", onTouchEnd, true);
      window.removeEventListener("scroll", onWindowScroll);
      clear();
    };
  }, [el, enabled]);
}

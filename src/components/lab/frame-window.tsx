"use client";

import { useLayoutEffect } from "react";

import { GlowFilter } from "@/components/shared/glow-filter";
import { EPHEMERAL_ROLES, MODAL_ROLES } from "@/components/ui/layer-is-up";
import { PortalContainerProvider } from "@/components/ui/portal-container";
import { MediaWindowProvider } from "@/lib/use-media-query";

/**
 * THE FRAME'S OWN WINDOW (lab-frame, from ROADMAP's five lines on the lab's
 * frame): what a portalled scene needs so production's own components draw in
 * it as they draw on a page, at any width, without a board quoting them.
 *
 * A portalled scene is the LAB's React tree drawn into the frame's document,
 * so every global a production component reaches is the lab's: its `window`,
 * its `document`, its body. Two of the frame's own are handed to the scene by
 * the contexts the product already reads, and one is put in its document:
 *
 * - the frame's window, to the media hooks (`MediaWindowProvider`): a frame
 *   375 wide answers a phone's query, and Settings' popup stands as a phone's
 *   screen rather than a desk's panel;
 * - the frame's body, to every radix `Portal` (`usePortalContainer`): a layer
 *   opens inside the page it belongs to;
 * - a glow filter host (`GlowFilter`, one per document): `Glow`,
 *   `SectionLight` and `ScreenLamp` reach `#glw-warp` in their own document,
 *   where a missing host drops the whole filter chain, warp and blur.
 *
 * ★ AND RADIX'S PAGE-WIDE EFFECTS ARE KEPT INSIDE THE FRAME (`holdFrame`), which
 * no context can do: a modal layer's scroll lock and both of its focus guards
 * are written by module code onto the realm's `document.body`, the lab's, so a
 * frame's open popup locked the LAB's page (and cancelled its wheel and its
 * finger) and left the frame's own page scrolling under it. Here the frame's
 * body is the one locked, and the guards stand at its edges, each while a layer
 * of the frame holds them; the lab keeps them only for a layer of its own.
 */
export function FrameWindow({
  doc,
  win,
  children,
}: {
  /** The frame's document, which stays (the copy effect's note in `frame.tsx`). */
  doc: Document;
  /** Its window: `defaultView`, or the iframe's own where a test's document has none. */
  win: Window | null;
  children: React.ReactNode;
}) {
  // A LAYOUT effect, on purpose: every layout effect of a commit runs before
  // any passive one, and radix writes its lock, its guards and its wheel
  // listener from passive effects. A layer drawn open from the first commit
  // (a portal handed a container renders in that same commit) is held from
  // the start.
  useLayoutEffect(() => holdFrame(doc), [doc]);
  return (
    <MediaWindowProvider value={win}>
      <PortalContainerProvider value={doc.body}>
        <GlowFilter />
        {children}
      </PortalContainerProvider>
    </MediaWindowProvider>
  );
}

/* ── Radix's page-wide effects, kept in the document that holds the layer ── */

/** Radix's lock (react-remove-scroll-bar) and its count, on the body. */
const LOCK = "data-scroll-locked";
/** Radix's focus guards, two tabbable spans at the body's edges. */
const GUARD = "data-radix-focus-guard";
/** aria-hidden's mark on what a modal layer hides (radix's `hideOthers`). */
const HIDDEN = "data-aria-hidden";
/**
 * The layers that guard their focus: Dialog's content (and a confirm's), and
 * Popover's, Menu's and Select's, each wearing radix's `data-state`; the roles
 * are `layer-is-up.ts`'s. A tooltip's content takes no role, and no guards.
 */
const GUARDED = [...MODAL_ROLES, ...EPHEMERAL_ROLES]
  .map((role) => `[role="${role}"][data-state]`)
  .join(",");
/** The scene's own ground in the frame's body (`frame.tsx`), which is no layer. */
export const SCENE_ATTR = "data-lab-scene";

/**
 * WHERE A LOCK STANDS: a modal layer hides every other child of its body
 * (`hideOthers`, which reads the content's own document), so a mark on a child
 * of THIS body is a modal layer of THIS document. It is radix's own lock's
 * companion: Dialog (with its overlay), a modal Popover and Menu, and Select
 * take both or neither.
 */
function holdsALock(body: HTMLElement): boolean {
  for (const child of body.children)
    if (child.hasAttribute(HIDDEN)) return true;
  return false;
}

/**
 * WHERE GUARDS STAND: a layer that guards its focus is a portal's root on this
 * body, or the first child of one (the popper's wrapper, Select's).
 */
function holdsAGuardedLayer(body: HTMLElement): boolean {
  for (const child of body.children) {
    if (child.hasAttribute(SCENE_ATTR)) continue;
    if (child.matches(GUARDED) || child.firstElementChild?.matches(GUARDED))
      return true;
  }
  return false;
}

type Held = {
  doc: Document;
  /** The frame's own two guards, made once and placed or taken out as it holds a layer. */
  guards: [HTMLElement, HTMLElement] | null;
  /** The frame's lock sheet, while its body is locked. */
  sheet: HTMLStyleElement | null;
};

const held = new Set<Held>();

/**
 * Holds a frame's document while it is drawn: its layers' lock and guards stay
 * in it, and the realm is readied once (`readyTheRealm`). Returns the release,
 * which takes the frame's own lock and guards back out.
 */
function holdFrame(doc: Document): () => void {
  readyTheRealm();
  const h: Held = { doc, guards: null, sheet: null };
  held.add(h);
  const settle = () => settleFrame(h);
  // Two observers: a layer arrives and leaves as a child of the body, and a
  // modal one marks the body's children; a whole-subtree watch of every
  // child list would wake on every tile a scene draws.
  const roots = new MutationObserver(settle);
  roots.observe(doc.body, { childList: true });
  const marks = new MutationObserver(settle);
  marks.observe(doc.body, {
    attributes: true,
    subtree: true,
    attributeFilter: [HIDDEN],
  });
  settle();
  return () => {
    roots.disconnect();
    marks.disconnect();
    held.delete(h);
    unlock(h);
    h.guards?.forEach((g) => g.remove());
  };
}

/** The frame as its own layers would leave a page: locked, guarded, or neither. */
function settleFrame(h: Held) {
  const body = h.doc.body;
  if (!body) return;
  const locked = holdsALock(body);
  if (locked && !body.hasAttribute(LOCK)) lock(h);
  else if (!locked && body.hasAttribute(LOCK)) unlock(h);
  if (locked || holdsAGuardedLayer(body)) {
    h.guards ??= [makeGuard(h.doc), makeGuard(h.doc)];
    const [first, last] = h.guards;
    // Re-placed only when moved off an edge (a portal appended after the
    // last), so placing them wakes the observer once and settles.
    if (body.firstElementChild !== first)
      body.insertAdjacentElement("afterbegin", first);
    if (body.lastElementChild !== last)
      body.insertAdjacentElement("beforeend", last);
  } else {
    h.guards?.forEach((g) => g.remove());
  }
}

/** Radix's guard, as `@radix-ui/react-focus-guards` makes it. */
function makeGuard(doc: Document): HTMLElement {
  const el = doc.createElement("span");
  el.setAttribute(GUARD, "");
  el.tabIndex = 0;
  el.style.outline = "none";
  el.style.opacity = "0";
  el.style.position = "fixed";
  el.style.pointerEvents = "none";
  return el;
}

/**
 * Radix's lock, on the frame's body: react-remove-scroll-bar's rule in its
 * default (margin) mode, with the scrollbar's width measured off the FRAME'S
 * window before the lock takes it away. The helper classes it also writes
 * (`right-scroll-bar-position`, `width-before-scroll-bar`) are worn by nothing
 * in the product, so they are not copied.
 */
function lock(h: Held) {
  const { doc } = h;
  const body = doc.body;
  const win = doc.defaultView;
  const px = (v: string | undefined) => parseInt(v || "", 10) || 0;
  const cs = win?.getComputedStyle(body);
  const left = px(cs?.marginLeft);
  const top = px(cs?.marginTop);
  const right = px(cs?.marginRight);
  const gap = Math.max(
    0,
    (win?.innerWidth ?? 0) - doc.documentElement.clientWidth + right - left,
  );
  const sheet = doc.createElement("style");
  sheet.dataset.labFrameLock = "";
  sheet.textContent = `body[${LOCK}]{overflow:hidden!important;overscroll-behavior:contain;position:relative!important;padding-left:${left}px;padding-top:${top}px;padding-right:${right}px;margin-left:0;margin-top:0;margin-right:${gap}px!important;--removed-body-scroll-bar-size:${gap}px}`;
  doc.head.appendChild(sheet);
  h.sheet = sheet;
  body.setAttribute(LOCK, "1");
}

function unlock(h: Held) {
  h.doc.body?.removeAttribute(LOCK);
  h.sheet?.remove();
  h.sheet = null;
}

/* ── The lab's realm: readied once, for every frame it will hold ─────────── */

let ready = false;

/**
 * THE LAB'S PAGE KEEPS RADIX'S EFFECTS ONLY FOR A LAYER OF ITS OWN. Radix's
 * module code writes every layer's lock and guards onto the realm's body (the
 * lab's), and counts them there, whichever document the layer stands in. So
 * the lab's body is settled against the lab's own layers (its palette, its
 * sidebar's sheet): a lock stands while a modal layer of the lab's stands, the
 * guards while a guarding layer of the lab's does, and what a frame's layer
 * wrote is taken away. Radix reads its own count back off the body each time
 * (the lock's attribute, the guards it finds), so taking them away is what it
 * would have done when that layer closed, and it recounts from there.
 *
 * ★ AND A LOCK'S WHEEL NEVER STOPS THE LAB'S PAGE UNLESS THE LAB HOLDS IT. The
 * lock also listens on the realm's document for every wheel and touch move
 * outside its layer and cancels them (react-remove-scroll), and the lab's page
 * is outside every frame's layer: a frame's open popup made the lab's page
 * unscrollable by wheel and by finger even with the body's lock taken away. A
 * cancelling (non-passive) wheel or touch-move listener on the lab's document
 * now runs only while the lab holds a lock of its own; nothing else in the
 * product listens there that way (React's own are passive).
 *
 * ★ AND A LAYER'S OWN IDS ARE FOUND WHERE IT STANDS. Radix's Dialog checks its
 * Title and Description by `document.getElementById`, the lab's, and called
 * every production dialog in a frame inaccessible in the console (an error
 * and a warning per dialog, on a production build too). A `radix-` id the lab
 * does not hold is looked up in the frames this realm holds.
 *
 * Readied by the first frame and kept: each piece is a no-op while no frame
 * stands (the lab's own layers lock, guard and find their ids as before), and
 * a cancelling listener a frame's layer registered must still be found by its
 * own removal after that frame has gone.
 */
function readyTheRealm() {
  if (ready || typeof document === "undefined") return;
  ready = true;

  const body = document.body;
  const settle = () => settleLab(body);
  new MutationObserver(settle).observe(body, { childList: true });
  new MutationObserver(settle).observe(body, {
    attributes: true,
    subtree: true,
    attributeFilter: [LOCK, HIDDEN],
  });

  const add = document.addEventListener;
  const remove = document.removeEventListener;
  const gated = new WeakMap<EventListener, EventListener>();
  const cancels = (type: string, options: unknown) =>
    (type === "wheel" || type === "touchmove") &&
    typeof options === "object" &&
    options !== null &&
    (options as AddEventListenerOptions).passive === false;
  document.addEventListener = function (
    this: Document,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (typeof listener === "function" && cancels(type, options)) {
      let gate = gated.get(listener);
      if (!gate) {
        const own = listener;
        gate = function (this: unknown, event: Event) {
          if (holdsALock(document.body)) own.call(this, event);
        };
        gated.set(listener, gate);
      }
      return add.call(this, type, gate, options);
    }
    return add.call(this, type, listener, options);
  } as typeof document.addEventListener;
  document.removeEventListener = function (
    this: Document,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ) {
    const gate =
      typeof listener === "function" ? gated.get(listener) : undefined;
    if (gate) remove.call(this, type, gate, options);
    return remove.call(this, type, listener, options);
  } as typeof document.removeEventListener;

  const byId = document.getElementById;
  document.getElementById = function (this: Document, id: string) {
    const own = byId.call(this, id);
    if (own || !id.startsWith("radix-")) return own;
    for (const h of held) {
      const there = h.doc.getElementById(id);
      if (there) return there;
    }
    return null;
  };

  settle();
}

function settleLab(body: HTMLElement) {
  const locked = holdsALock(body);
  if (!locked && body.hasAttribute(LOCK)) body.removeAttribute(LOCK);
  if (!locked && !holdsAGuardedLayer(body))
    body
      .querySelectorAll(`:scope > [${GUARD}]`)
      .forEach((guard) => guard.remove());
}

"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * THE CONTINUOUS STEP CONTAINER. Swapping the entry steps by bare key-remount
 * is an instant content jump and a height snap between a tall welcome and a
 * short gate, which feels like disconnected steps on an iPhone. This container
 * makes the handoff ONE motion:
 *
 * - HEIGHT: a ResizeObserver feeds the content's px height into a CSS height
 *   transition (300ms, the strong in-out "move" curve), so step swaps AND
 *   same-step growth (an error line appearing, the OTP swap) glide. Height is
 *   a layout property, but the sheet is position:fixed so the reflow stays
 *   inside the overlay - the sanctioned exception to transform-only motion.
 * - DIRECTION: the incoming step enters from the side it narratively comes
 *   from (fwd = right, back = left) via the [data-entry-step][data-dir]
 *   @starting-style variants in door.css. The FIRST layer of a mount gets
 *   no direction (the base rise) - nothing was there to hand off from. And
 *   `place` is the one handoff that is not a move: "You're in" arrives where
 *   the step stood, its own check and words being its entrance (`beat=lit`).
 * - SETTLED: once a sliding layer's move has landed it carries `data-settled`,
 *   which is what lets the door's text reveal tell words that rode the slide in
 *   (standing down, door.css) from words that change later inside the step
 *   (revealing in place: the code screen, the upload step's own views).
 * - EXIT: the outgoing step leaves a STATIC clone of its final DOM behind
 *   (captured in the unmounting layer's effect cleanup, which runs before the
 *   new layer paints). The clone is inert pixels: aria/test/query attributes
 *   are stripped so it can never be focused, submitted, or matched by
 *   assistive tech or tests. It mounts visible and transitions to hidden
 *   ([data-entry-exit]'s INVERTED @starting-style), then removes itself.
 *
 * - CLIPPED, NOT A SCROLLER: the container clips with `overflow: clip`, which
 *   establishes no scroll container, so a step's primary action can stick to
 *   the SHEET's foot while the keyboard is up (`floatingKeyboardFoot`); an
 *   `overflow: hidden` here would make this box its scrollport and the sticky
 *   foot would never stick. `hidden` stays underneath as the class, for an
 *   engine that has no `clip`.
 * - WITH A GUTTER FOR WHAT DRAWS PAST THE COLUMN: a focused field's ring
 *   (`ring-3`) draws 3px outside it, and the keep's lit check glows past its
 *   disc, while a full-width field, the code's outer slots and that check sit
 *   exactly at the column's sides, so the clip used to shave the ring flat and
 *   cut the glow with a hard edge. The box reaches 12px into the sheet's 24px
 *   padding on each side (`-mx-3 px-3`), which moves nothing the step draws and
 *   leaves both room (a slide's 16px travel now fades out inside the margin
 *   rather than against the column); the exit clone is inset by the same 12px
 *   so it stands exactly where its step stood.
 * - A FOCUSED FIELD NEVER LEAVES WITH ITS STEP: the outgoing layer blurs one
 *   before its node is removed (door-flow's focus rules). The steps let go of
 *   focus themselves before they hand forward; this is the last resort, so a
 *   removed input can never take the iOS keyboard down mid-transition.
 *
 * The container reads `direction` from a data attribute at cleanup time:
 * React commits the attribute update BEFORE running the old layer's cleanup,
 * so the exiting clone always animates with the INCOMING transition's
 * direction without threading props through unmount closures.
 */
/** How a step arrives: from the right, from the left, or where the last one stood. */
export type StepDirection = "fwd" | "back" | "place";

export function EntryStepTransition({
  stepKey,
  direction,
  children,
}: {
  stepKey: string;
  direction: StepDirection;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  // The very first layer enters with the base rise, not a directional slide
  // (the sanctioned adjust-state-during-render pattern, no refs/effects).
  const [keyState, setKeyState] = useState({ key: stepKey, changed: false });
  if (keyState.key !== stepKey) {
    setKeyState({ key: stepKey, changed: true });
  }

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    setHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      data-dir={direction}
      // shrink-0: the sheet around this is a flex column with a ceiling, and a flex item may shrink
      // below its height; this box would then clip its own step instead of letting the SHEET scroll
      // (measured with the keyboard up on an iPhone SE: the ghost line sat clipped and unreachable).
      className="relative -mx-3 shrink-0 overflow-hidden px-3"
      style={{
        height: height ?? undefined,
        transition: "height 300ms var(--ease-in-out-strong)",
        overflow: "clip",
      }}
    >
      <div ref={innerRef}>
        <StepLayer
          key={stepKey}
          containerRef={containerRef}
          dir={keyState.changed ? direction : undefined}
        >
          {children}
        </StepLayer>
      </div>
    </div>
  );
}

// The exit clone outlives the 160ms transition by a margin, then removes
// itself even if transitionend never fires (reduced motion hides it via CSS).
const EXIT_REMOVE_MS = 320;

// A sliding layer's 220ms move (door.css), with a margin: past it the layer is
// settled, and words that change inside it reveal in place.
const SETTLE_MS = 280;

function StepLayer({
  containerRef,
  dir,
  children,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  dir: StepDirection | undefined;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // SETTLED, written straight onto the node (a presentational flag the text reveal reads, never
  // React state: nothing re-renders for it). Only a sliding layer needs one; the first layer and
  // an in-place arrival never stand the reveal down.
  useEffect(() => {
    if (dir !== "fwd" && dir !== "back") return;
    const el = ref.current;
    const t = setTimeout(() => el?.setAttribute("data-settled", ""), SETTLE_MS);
    return () => clearTimeout(t);
  }, [dir]);

  // The last resort for "never unmount a focused field": a layout effect's cleanup runs before
  // React removes this layer's node, so a field still holding focus lets go while it is attached.
  useLayoutEffect(() => {
    const el = ref.current;
    return () => {
      const active = document.activeElement;
      if (el && active instanceof HTMLElement && el.contains(active)) {
        active.blur();
      }
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    // The container div is identity-stable for the layer's whole life, so
    // capturing it at setup reads the SAME node the cleanup needs (and its
    // data-dir attribute is read fresh off the DOM at cleanup time).
    const container = containerRef.current;
    return () => {
      // el.isConnected discriminates a REAL key-swap deletion (the node is
      // already detached when this passive cleanup runs; cloneNode still
      // captures its final DOM) from a dev StrictMode setup->cleanup->setup
      // cycle (the node is still live - cloning it would paint a ghost
      // duplicate over the real content on every step in dev).
      if (!el || el.isConnected || !container || !container.isConnected) return;
      const exitDir = container.dataset.dir ?? "fwd";
      const clone = el.cloneNode(true) as HTMLElement;
      clone.removeAttribute("data-entry-step");
      clone.removeAttribute("data-dir");
      clone.removeAttribute("data-settled");
      clone.setAttribute("data-entry-exit", "");
      clone.setAttribute("data-exit-dir", exitDir);
      // Pure pixels: never focusable, submittable, announced, or matched.
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("inert", "");
      clone.style.pointerEvents = "none";
      clone.style.position = "absolute";
      // The container's gutter (`px-3`), so the clone overlays its step exactly.
      clone.style.insetInline = "0.75rem";
      clone.style.top = "0";
      for (const attr of ["aria-label", "data-testid", "id", "name", "for"]) {
        clone.querySelectorAll(`[${attr}]`).forEach((n) => {
          n.removeAttribute(attr);
        });
      }
      container.appendChild(clone);
      const remove = () => clone.remove();
      clone.addEventListener("transitionend", remove, { once: true });
      setTimeout(remove, EXIT_REMOVE_MS);
    };
  }, [containerRef]);

  return (
    <div ref={ref} data-entry-step data-dir={dir}>
      {children}
    </div>
  );
}

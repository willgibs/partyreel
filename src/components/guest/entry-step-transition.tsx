"use client";

import { useEffect, useRef, useState } from "react";

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
 *   @starting-style variants in globals.css. The FIRST layer of a mount gets
 *   no direction (the base rise) - nothing was there to hand off from.
 * - EXIT: the outgoing step leaves a STATIC clone of its final DOM behind
 *   (captured in the unmounting layer's effect cleanup, which runs before the
 *   new layer paints). The clone is inert pixels: aria/test/query attributes
 *   are stripped so it can never be focused, submitted, or matched by
 *   assistive tech or tests. It mounts visible and transitions to hidden
 *   ([data-entry-exit]'s INVERTED @starting-style), then removes itself.
 *
 * The container reads `direction` from a data attribute at cleanup time:
 * React commits the attribute update BEFORE running the old layer's cleanup,
 * so the exiting clone always animates with the INCOMING transition's
 * direction without threading props through unmount closures.
 */
export function EntryStepTransition({
  stepKey,
  direction,
  children,
}: {
  stepKey: string;
  direction: "fwd" | "back";
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
      className="relative overflow-hidden"
      style={{
        height: height ?? undefined,
        transition: "height 300ms var(--ease-in-out-strong)",
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

function StepLayer({
  containerRef,
  dir,
  children,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  dir: "fwd" | "back" | undefined;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

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
      if (!el || el.isConnected || !container || !container.isConnected)
        return;
      const exitDir = container.dataset.dir ?? "fwd";
      const clone = el.cloneNode(true) as HTMLElement;
      clone.removeAttribute("data-entry-step");
      clone.removeAttribute("data-dir");
      clone.setAttribute("data-entry-exit", "");
      clone.setAttribute("data-exit-dir", exitDir);
      // Pure pixels: never focusable, submittable, announced, or matched.
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("inert", "");
      clone.style.pointerEvents = "none";
      clone.style.position = "absolute";
      clone.style.insetInline = "0";
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

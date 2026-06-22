"use client";

/* eslint-disable react-hooks/immutability -- a FLIP imperatively mutates DOM element
   styles (transform/transition) in a layout effect; that imperative DOM write IS the
   technique. The lint guards against mutating React-owned values, not the live DOM. */
import { useCallback, useLayoutEffect, useRef } from "react";

// A hand-rolled FLIP (First-Last-Invert-Play) for the C2 reorder variant: when the
// section order changes, each tracked node is snapped back to its previous box with
// no transition, then transitioned to its new place. This is the pure-CSS answer to
// what motion's `layout` prop does for free (C3) - the lab compares the two.
// Reduced motion: skip the invert (instant reflow).
function readMs(varName: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function useFlip(orderKey: string) {
  const nodes = useRef(new Map<string, HTMLElement>());
  const prev = useRef(new Map<string, DOMRect>());

  const register = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) nodes.current.set(key, el);
      else nodes.current.delete(key);
    },
    [],
  );

  useLayoutEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const dur = readMs("--tune-reorder-ms", 360);
    for (const [key, el] of nodes.current) {
      const now = el.getBoundingClientRect();
      const was = prev.current.get(key);
      if (was && !reduce) {
        const dy = was.top - now.top;
        if (dy) {
          el.style.transition = "none";
          el.style.transform = `translateY(${dy}px)`;
          void el.offsetWidth; // force reflow so the invert is the starting point
          requestAnimationFrame(() => {
            el.style.transition = `transform ${dur}ms var(--ease-in-out-strong)`;
            el.style.transform = "";
          });
        }
      }
      prev.current.set(key, now);
    }
  }, [orderKey]);

  return register;
}

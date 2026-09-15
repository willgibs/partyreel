"use client";

import { useEffect, useRef, useState } from "react";

/**
 * MOUNT WHEN THE READER IS NEARLY THERE.
 *
 * A board is tens of thousands of pixels and a single row of true-viewport
 * frames is four page loads. Mounting all of them on open costs the reader a
 * board that stutters for ten seconds before it can be read at all, and costs
 * the measurements their meaning (the cost meter on the light board measures
 * the BOARD, not the proposal, if twenty other lamps are running).
 *
 * ★ THE MARGIN IS GENEROUS ON PURPOSE. A frame that begins loading when its top
 * edge crosses the viewport arrives blank under the reader's eye and paints
 * while being looked at, which reads as a broken board rather than a loading
 * one. 300px is roughly one flick of a trackpad ahead.
 *
 * ★ AND IT NEVER UNMOUNTS. `seen` latches: a frame that unloaded on scroll-past
 * would lose its scroll position, its injected candidate and its place in a
 * scroll-lock group, and the reader would find a different page on the way back
 * up. Cheap to keep, expensive to rebuild.
 */
export function useMountOnApproach(
  margin = "300px",
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setSeen(true);
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, margin]);
  return [ref, seen];
}

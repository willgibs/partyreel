"use client";

import { useEffect } from "react";

/**
 * ONE delegated handler for every heading's copy-link affordance (R6): the
 * server-rendered H2/H3 emit plain `<a data-anchor-copy>` markup (a real anchor,
 * so no-JS still jumps), and this single island upgrades them all — N headings,
 * one client component. Click: keep the reader where they are, put the hash in
 * the URL, copy the deep link, and flip the icon-swap to the drawn check for a
 * beat. Mounted by the help article page only; on blog (which shares the MDX
 * components) the anchors gracefully stay plain links.
 */
export function HeadingAnchorsDelegate() {
  useEffect(() => {
    const timers = new Map<Element, number>();

    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const anchor = target?.closest<HTMLAnchorElement>("a[data-anchor-copy]");
      if (!anchor) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();

      const id = anchor.dataset.anchorCopy;
      if (!id) return;
      history.replaceState(null, "", `#${id}`);
      void navigator.clipboard
        ?.writeText(`${location.origin}${location.pathname}#${id}`)
        .catch(() => {
          // Clipboard can be unavailable (permissions, http): the URL hash
          // still updated, which is the fallback worth having.
        });

      const swap = anchor.querySelector(".mkt-icon-swap");
      if (swap) {
        swap.setAttribute("data-state", "b");
        const existing = timers.get(swap);
        if (existing) window.clearTimeout(existing);
        timers.set(
          swap,
          window.setTimeout(() => swap.setAttribute("data-state", "a"), 1400),
        );
      }
    }

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return null;
}

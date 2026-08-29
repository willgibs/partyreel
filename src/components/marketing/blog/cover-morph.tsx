"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * THE COVER MORPH — the index card's photograph grows into the article's plate on navigation.
 *
 * ★ NATIVE View Transitions API, deliberately NOT React's <ViewTransition>. React's component is
 * the nicer authoring model and it is NOT AVAILABLE TO US: it requires
 * `experimental.viewTransition` in next.config, and enabling that flag swaps the ENTIRE app's React
 * runtime from our pinned 19.2.4 to 19.3.0-canary (measured, not assumed — a probe build reported
 * React.version). Trading the React build under the host app, the guest upload flow, checkout and
 * the admin portal is a product-wide decision, not something a blog polish round gets to make. The
 * native API is a baseline web standard and costs the rest of the product nothing.
 *
 * ONE DELEGATED ISLAND, the HeadingAnchorsDelegate pattern: every card stays a SERVER component and
 * ships no JS, and N cards cost one listener. Cards opt in by rendering `data-cover-morph` on the
 * link and `data-cover-plate` on the image wrapper.
 *
 * Every guard here is a way the morph must degrade to an ordinary navigation, never to a broken
 * one: no API support, reduced motion, modified clicks (a new tab must stay a new tab), and a hard
 * TIMEOUT — the transition holds a full-screen overlay until its callback settles, so a navigation
 * that stalls would freeze the page. Resolving early only costs the animation.
 */

/** One name, because only ONE element is ever named at a time (the card being clicked). */
const MORPH_NAME = "blog-cover";

/** The article's own cover: the morph TARGET, named at rest so an incoming document can be matched. */
const TARGET = '[data-cover-plate="target"]';

/** The overlay must never outlive a slow navigation. Generous for a prefetched static route. */
const NAV_TIMEOUT_MS = 700;

/** Strip the name from EVERY plate. See restoreTarget for why this has to be indiscriminate. */
function clearAll() {
  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-cover-plate]",
  )) {
    el.style.removeProperty("view-transition-name");
  }
}

/**
 * Reset naming to "only the article's own cover is the target".
 *
 * ★ This is the fix for a real break, not tidiness. clearAll() strips the name from the INCOMING
 * article's cover too, and React will not put it back: the `style` prop is identical across the
 * navigation, so reconciliation has no reason to touch a node we mutated behind its back. Without
 * this, the first morph silently disarms every morph after it (verified: a client-navigated article
 * reported no name where a fresh load reported `blog-cover`). Clearing first also means an
 * article-to-article hop cannot leave the clicked "Keep reading" card named alongside the new
 * cover, which is a duplicate-name error the browser resolves by skipping the transition.
 */
function restoreTarget() {
  clearAll();
  document
    .querySelector<HTMLElement>(TARGET)
    ?.style.setProperty("view-transition-name", MORPH_NAME);
}

export function CoverMorphDelegate() {
  const router = useRouter();
  const pathname = usePathname();
  const settle = useRef<(() => void) | null>(null);

  // The route committed. Name the incoming cover FIRST, then release the transition — the browser
  // snapshots the new DOM the moment the callback settles, so the target has to be named before
  // that, not after. Restoring here rather than in `transition.finished` also removes a dependency
  // on the animation ever completing: `finished` never settles in a backgrounded tab (animations
  // are suspended), which would strand the page with no target for the next morph.
  useEffect(() => {
    restoreTarget();
    settle.current?.();
    settle.current = null;
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      // Left click only, and never steal a deliberate new-tab/window/download click.
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // Read the API at CALL time, never captured at effect setup: a stale closure would miss a
      // browser that gains support mid-session, and — the reason it changed — it makes the guard
      // observable. `startViewTransition` is not in lib.dom for our TS target yet.
      const start = (
        document as Document & {
          startViewTransition?: (cb: () => Promise<void>) => {
            finished: Promise<void>;
          };
        }
      ).startViewTransition;
      if (typeof start !== "function") return;

      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        "a[data-cover-morph]",
      );
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || link.target === "_blank") return;

      const plate = link.querySelector<HTMLElement>("[data-cover-plate]");
      if (!plate) return;

      // ★ CAPTURE-PHASE INTERCEPT, and stopPropagation is load-bearing. next/link attaches its own
      // click handler to the anchor and calls preventDefault() there to run its client navigation.
      // On a bubble-phase document listener that handler ALWAYS wins the race, so this delegate saw
      // `defaultPrevented` already true and bailed on every single click — the morph silently did
      // nothing, while the page still navigated perfectly and looked fine. Capturing puts us ahead
      // of it; stopping propagation keeps Link from also navigating, which would otherwise push the
      // same route twice. Prefetch is untouched (it runs on hover/viewport, not on click).
      event.preventDefault();
      event.stopPropagation();
      clearAll();
      plate.style.setProperty("view-transition-name", MORPH_NAME);

      const transition = start.call(
        document,
        () =>
          new Promise<void>((resolve) => {
            let done = false;
            const finish = () => {
              if (done) return;
              done = true;
              window.clearTimeout(timer);
              resolve();
            };
            const timer = window.setTimeout(finish, NAV_TIMEOUT_MS);
            settle.current = finish;
            router.push(href);
          }),
      );

      // Belt to the route-commit braces: if the transition ends without a navigation (a failed
      // push, a same-route click), naming still returns to its resting shape.
      void transition.finished.finally(restoreTarget);
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      clearAll();
    };
  }, [router]);

  return null;
}

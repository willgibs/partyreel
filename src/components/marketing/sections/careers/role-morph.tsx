"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * THE ROLE MORPH - the listing card's emblem grows into the role page's avatar.
 *
 * ★ This is the SAME MECHANISM as the blog round's cover morph
 * (components/marketing/blog/cover-morph.tsx, developed in parallel on
 * lp/blog-redesign). Every constraint below was proven there first and applies
 * here unchanged; when both rounds are integrated these two should collapse
 * into one parameterised delegate rather than staying near-duplicates. Keeping
 * them separate for now is a merge decision, not a design one.
 *
 * ★ NATIVE View Transitions API, deliberately NOT React's <ViewTransition>.
 * React's component needs `experimental.viewTransition` in next.config, and
 * that flag swaps the ENTIRE app's React runtime from our pinned 19.2.4 to a
 * canary (measured on the blog round, not assumed). Trading the React build
 * under the host app, the guest upload flow, checkout and admin is a
 * product-wide decision; a careers polish round does not get to make it. The
 * native API is a baseline web standard and costs the rest of the product
 * nothing.
 *
 * ONE DELEGATED ISLAND: every card stays a server component and ships no JS,
 * and N cards cost one listener.
 *
 * Every guard is a way the morph degrades to an ORDINARY navigation, never to a
 * broken one: no API support, reduced motion, modified clicks (a new tab must
 * stay a new tab), and a hard timeout, because the transition holds a
 * full-screen overlay until its callback settles and a stalled navigation would
 * otherwise freeze the page.
 */

/** One name, because only ONE element is ever named at a time. */
const MORPH_NAME = "role-emblem";

/** The role page's own emblem: the morph TARGET, named at rest. */
const TARGET = '[data-role-emblem="target"]';

const NAV_TIMEOUT_MS = 700;

function clearAll() {
  for (const el of document.querySelectorAll<HTMLElement>("[data-role-emblem]")) {
    el.style.removeProperty("view-transition-name");
  }
}

/**
 * ★ Reset to "only the role page's own emblem is named". This is the fix for a
 * real break, not tidiness: clearAll() strips the name from the INCOMING page's
 * emblem too, and React will not put it back, because the `style` prop is
 * identical across the navigation so reconciliation has no reason to touch a
 * node we mutated behind its back. Without this the first morph silently
 * disarms every morph after it.
 */
function restoreTarget() {
  clearAll();
  document
    .querySelector<HTMLElement>(TARGET)
    ?.style.setProperty("view-transition-name", MORPH_NAME);
}

export function RoleMorphDelegate() {
  const router = useRouter();
  const pathname = usePathname();
  const settle = useRef<(() => void) | null>(null);

  // The route committed. Name the incoming emblem FIRST, then release the
  // transition: the browser snapshots the new DOM the moment the callback
  // settles, so the target must already be named. Doing it here rather than in
  // `transition.finished` also drops any dependency on the animation actually
  // completing, which never happens in a backgrounded tab.
  useEffect(() => {
    restoreTarget();
    settle.current?.();
    settle.current = null;
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // Read the API at CALL time, never captured at setup: a stale closure
      // would miss a browser that gains support mid-session, and it makes the
      // guard observable. Not in lib.dom for our TS target yet.
      const start = (
        document as Document & {
          startViewTransition?: (cb: () => Promise<void>) => {
            finished: Promise<void>;
          };
        }
      ).startViewTransition;
      if (typeof start !== "function") return;

      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        "a[data-role-morph]",
      );
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || link.target === "_blank") return;

      const plate = link.querySelector<HTMLElement>("[data-role-emblem]");
      if (!plate) return;

      // ★ CAPTURE-PHASE INTERCEPT, and stopPropagation is load-bearing.
      // next/link attaches its own click handler to the anchor and calls
      // preventDefault() there. On a bubble-phase document listener that
      // handler always wins the race, so the delegate sees defaultPrevented
      // already true and bails on every click: the morph silently does nothing
      // while the page still navigates and looks fine. Capturing puts us ahead
      // of it; stopping propagation keeps Link from navigating the same route
      // twice. Prefetch is untouched (it runs on hover/viewport, not click).
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

      // Belt to the route-commit braces: a transition that ends without a
      // navigation still returns naming to its resting shape.
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

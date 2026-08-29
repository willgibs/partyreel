"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * THE MORPH DELEGATE — a clicked card's plate grows into the destination page's
 * plate instead of the two pages cutting.
 *
 * ★ ONE COMPONENT, TWO CONSUMERS (collapsed at the careers merge, 2026-08-29,
 * on Will's ruling). The blog round and the careers round built this in
 * parallel, arrived at the same mechanism and the same four guards, and shipped
 * two files that differed in exactly three strings. The careers author left the
 * call to the integrator: "these two delegates are near-duplicates by necessity,
 * not design... keeping them separate is a merge decision, not a design one."
 * Every constraint below was learned once and is now written once; a third
 * morph is a config object, not a fourth copy.
 *
 * ★ NATIVE View Transitions API, deliberately NOT React's <ViewTransition>.
 * React's component is the nicer authoring model and it is NOT AVAILABLE TO US:
 * it requires `experimental.viewTransition` in next.config, and that flag swaps
 * the ENTIRE app's React runtime from our pinned 19.2.4 to 19.3.0-canary
 * (measured on the blog round, not assumed — a probe build reported
 * React.version). Trading the React build under the host app, the guest upload
 * flow, checkout and the admin portal is a product-wide decision, not something
 * a marketing polish round gets to make. The native API is a baseline web
 * standard and costs the rest of the product nothing.
 *
 * ONE DELEGATED ISLAND, the HeadingAnchorsDelegate pattern: every card stays a
 * SERVER component and ships no JS, and N cards cost one listener. A consumer
 * mounts this from the narrowest layout that covers both ends of the hop, so no
 * other route pays for the listener.
 *
 * Every guard here is a way the morph must degrade to an ORDINARY navigation,
 * never to a broken one: no API support, reduced motion, modified clicks (a new
 * tab must stay a new tab), and a hard TIMEOUT — the transition holds a
 * full-screen overlay until its callback settles, so a navigation that stalls
 * would freeze the page. Resolving early only costs the animation.
 *
 * ★ THE CSS LIVES IN marketing.css, name-scoped, and the binding between `name`
 * here and `::view-transition-group(<name>)` there is pinned by
 * marketing-css-policy.test.ts — a rename that touched only one side used to
 * drop the morph's timing silently.
 */

/** The overlay must never outlive a slow navigation. Generous for a prefetched static route. */
const NAV_TIMEOUT_MS = 700;

export type MorphConfig = {
  /**
   * The `view-transition-name` this morph owns. Exactly ONE element carries it
   * at a time (the card being clicked, or the destination's own plate at rest),
   * because a duplicate name is an error the browser resolves by skipping the
   * transition entirely.
   */
  name: string;
  /** Attribute marking a link that opts in, e.g. "data-cover-morph". */
  linkAttr: string;
  /**
   * Attribute marking the morphing plate, e.g. "data-cover-plate". The
   * DESTINATION page sets it to "target" so an incoming document can be matched.
   */
  plateAttr: string;
};

/** Strip the name from EVERY plate. See restoreTarget for why this is indiscriminate. */
function clearAll(plateAttr: string) {
  for (const el of document.querySelectorAll<HTMLElement>(`[${plateAttr}]`)) {
    el.style.removeProperty("view-transition-name");
  }
}

/**
 * Reset naming to "only the destination page's own plate is the target".
 *
 * ★ This is the fix for a real break, not tidiness. clearAll() strips the name
 * from the INCOMING page's plate too, and React will not put it back: the
 * `style` prop is identical across the navigation, so reconciliation has no
 * reason to touch a node we mutated behind its back. Without this, the first
 * morph silently disarms every morph after it (verified on the blog round: a
 * client-navigated article reported no name where a fresh load reported
 * `blog-cover`). Clearing first also means a card-to-card hop cannot leave the
 * clicked card named alongside the new plate, which is a duplicate-name error
 * the browser resolves by skipping the transition.
 */
// Takes only the two fields it needs: naming is independent of which links opt in.
function restoreTarget({
  name,
  plateAttr,
}: Pick<MorphConfig, "name" | "plateAttr">) {
  clearAll(plateAttr);
  document
    .querySelector<HTMLElement>(`[${plateAttr}="target"]`)
    ?.style.setProperty("view-transition-name", name);
}

export function MorphDelegate({ name, linkAttr, plateAttr }: MorphConfig) {
  const router = useRouter();
  const pathname = usePathname();
  const settle = useRef<(() => void) | null>(null);

  useEffect(() => {
    // The route committed. Name the incoming plate FIRST, then release the
    // transition — the browser snapshots the new DOM the moment the callback
    // settles, so the target has to be named before that, not after. Restoring
    // here rather than in `transition.finished` also removes a dependency on the
    // animation ever completing: `finished` never settles in a backgrounded tab
    // (animations are suspended), which would strand the page with no target.
    restoreTarget({ name, plateAttr });
    settle.current?.();
    settle.current = null;
  }, [pathname, name, plateAttr]);

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
      // Read the API at CALL time, never captured at effect setup: a stale
      // closure would miss a browser that gains support mid-session, and — the
      // reason it changed — it makes the guard observable. `startViewTransition`
      // is not in lib.dom for our TS target yet.
      const start = (
        document as Document & {
          startViewTransition?: (cb: () => Promise<void>) => {
            finished: Promise<void>;
          };
        }
      ).startViewTransition;
      if (typeof start !== "function") return;

      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        `a[${linkAttr}]`,
      );
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || link.target === "_blank") return;

      const plate = link.querySelector<HTMLElement>(`[${plateAttr}]`);
      if (!plate) return;

      // ★ CAPTURE-PHASE INTERCEPT, and stopPropagation is load-bearing.
      // next/link attaches its own click handler to the anchor and calls
      // preventDefault() there to run its client navigation. On a bubble-phase
      // document listener that handler ALWAYS wins the race, so this delegate
      // saw `defaultPrevented` already true and bailed on every single click —
      // the morph silently did nothing, while the page still navigated
      // perfectly and looked fine. Capturing puts us ahead of it; stopping
      // propagation keeps Link from also navigating, which would otherwise push
      // the same route twice. Prefetch is untouched (hover/viewport, not click).
      event.preventDefault();
      event.stopPropagation();
      clearAll(plateAttr);
      plate.style.setProperty("view-transition-name", name);

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

      // Belt to the route-commit braces: if the transition ends without a
      // navigation (a failed push, a same-route click), naming still returns to
      // its resting shape.
      void transition.finished.finally(() =>
        restoreTarget({ name, plateAttr }),
      );
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      clearAll(plateAttr);
    };
  }, [router, name, linkAttr, plateAttr]);

  return null;
}

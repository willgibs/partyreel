"use client";

import {
  type ComponentProps,
  type CSSProperties,
  useSyncExternalStore,
} from "react";

import { trackAttrs } from "@/lib/analytics/events";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { cn } from "@/lib/utils";

import { ensureDemoModalHost } from "./host";
import { isDesk, opensModal, readScreen, subscribeScreen } from "./opens";
import { openDemoModal } from "./store";

/**
 * A DOOR TO THE DEMO: one link that opens the demo modal at a desk and the demo
 * itself, in a new tab, on a phone (`opens.ts` holds which is which). Every
 * pointer to the demo renders through this, so the demo has one door with many
 * handles: the home hero's eyebrow, `DemoCtaLink` in its nineteen places, the
 * footer's pile, the nav's pane and the event pages' button.
 *
 * ★ IT IS A REAL LINK FIRST. The markup is an `<a href target="_blank">` the
 * server renders, so a phone, a modified press, a reader with no script and a
 * crawler all meet the demo's own address; the modal is what a plain press at
 * a desk adds on top. `aria-haspopup` joins it only once the browser has said
 * this is a desk (the server cannot know), so a screen reader hears "popup"
 * only where there is one.
 *
 * ★ THE DOOR ASKS AND THE PAGE'S ONE HOST DRAWS (`store.ts`, `host.tsx`): a
 * door can leave the page while its modal is up (the nav's pane does, with its
 * panel), and a modal it owned would leave with it.
 *
 * ★ PRESENTATION IS THE CALLER'S. Each door keeps its own classes, its own
 * accessible name and its own `demo_open` source, as each one did as a plain
 * link; this adds the behaviour and nothing visible. It composes an incoming
 * `onClick` before its own (the nav pane's link wraps it through radix's
 * `asChild`, whose select handler closes the menu), and forwards the rest,
 * `ref` included, so `Button asChild` and `NavigationMenuLink asChild` can
 * take it as their child.
 *
 * ★ FOCUS GOES BACK TO THE OPENER. Radix returns focus to a `DialogTrigger`,
 * and a door is a link rather than a trigger, so the store holds the opener
 * and the host hands focus back on close. `returnFocus` is for a door that may
 * be gone by then: the nav's pane names its panel's trigger.
 */
export function DemoDoor({
  href,
  source,
  returnFocus,
  onClick,
  children,
  ...props
}: Omit<ComponentProps<"a">, "href" | "target" | "rel"> & {
  /** The demo's address: where a phone and the modal's button both go. */
  href: string;
  /** The `demo_open` analytics source for this door. */
  source: string;
  /** Where focus returns if the opener has left the page by the time the modal closes. */
  returnFocus?: (opener: HTMLElement) => HTMLElement | null;
}) {
  // False on the server and through hydration, the real answer after it.
  const desk = useSyncExternalStore(
    subscribeScreen,
    () => isDesk(readScreen()),
    () => false,
  );

  return (
    <a
      {...props}
      {...trackAttrs("demo_open", { source })}
      href={href}
      target="_blank"
      rel="noopener"
      aria-haspopup={desk ? "dialog" : undefined}
      onClick={(e) => {
        // Read before the caller's handler runs: radix's select handler closes
        // the nav's panel synchronously (it dispatches under flushSync), and
        // the panel's trigger is only findable while the panel is open.
        const fallback = returnFocus?.(e.currentTarget) ?? null;
        onClick?.(e);
        if (!opensModal(e, readScreen())) return;
        e.preventDefault();
        ensureDemoModalHost();
        openDemoModal({ href, opener: e.currentTarget, fallback });
      }}
    >
      {children}
    </a>
  );
}

/**
 * THE LIVE DOT (`reel-story` r3 `beside=live`): the success dot the album
 * door's "Filling live" chip wears, breathing on the house pulse, which says
 * the album behind the door is live. Decorative: the door's words carry its
 * name.
 *
 * ★ THE RING IS THE PULSE'S OWN CUSTOM PROPERTY, RE-POINTED AT THE DOT'S
 * COLOUR. The house ring is ink-tinted for a QR plate (and resolves to almost
 * nothing on paper), and a grey halo round a green dot reads as two things;
 * the success token holds on the cinema room and on paper alike.
 *
 * ★ IT KEEPS THE LOOP-PAUSE CONTRACT: `[data-mkt-pulse]` is an infinite
 * animation, so the dot mirrors `useAmbientPause` onto `data-paused` (off
 * screen, a hidden tab, reduced motion), and marketing.css only ever starts
 * the pulse under `no-preference`: under reduced motion the dot stands still.
 */
const LIVE_RING = {
  "--mkt-pulse-ring": "color-mix(in oklab, var(--success) 45%, transparent)",
} as CSSProperties;

export function LiveDot({ className }: { className?: string }) {
  const { ref, paused } = useAmbientPause<HTMLSpanElement>();
  return (
    <span
      ref={ref}
      aria-hidden
      data-mkt-pulse=""
      data-paused={paused ? "true" : undefined}
      className={cn("size-2 shrink-0 rounded-full bg-success", className)}
      style={LIVE_RING}
    />
  );
}

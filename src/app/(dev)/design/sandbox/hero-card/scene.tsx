"use client";

import { type ReactNode, type RefObject, useEffect, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./screens";

/**
 * THE ONE FRAME EVERY OPTION DRAWS IN: the home's first screen, a real
 * viewport at a real width, the real marketing pieces portalled into it
 * (nothing here reaches a session, a Server Function or the network).
 *
 * ★ A REAL FRAME, NEVER A STYLED DIV. Every `lg:` in the hero, every step of
 * the type ladder (a `vw` clamp) and the band's 50cqw answer the width they lay
 * out in, and only an iframe claims a width of its own (the kit's
 * `vw-in-a-narrow-div` trap).
 *
 * ★ THE BAND RUNS INSIDE IT, MEASURED (`reel-story`'s finding, 2026-09-25): the
 * observer `useAmbientPause` creates lives in the lab's realm with the implicit
 * root, which is the top-level viewport, so it sees a target inside a
 * same-origin frame and the loop stops when the frame scrolls away. What cannot
 * cross is a radix portal (it lands in the lab page's body), so nothing drawn
 * here opens one.
 *
 * ★ A SCREEN IS THE DEVICE'S OWN SCREEN (1440 by 900, 375 by 812), because the
 * hero is exactly one screen tall and a caption about air over the headline is
 * only true at a real height.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER COMPUTED: a size is the box the
 * browser drew, a count is the images it painted.
 */
export function Scene({
  id,
  screen,
  title,
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  measure: (root: HTMLElement, win: Window) => string | null;
  children: ReactNode;
}) {
  const { w, h, name } = SCREENS[screen];
  const [caption, setCaption] = useState("measuring");
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${w} wide, ${name}`}
        caption={caption}
        onApproach
      >
        <Measured
          probe={measure}
          deps={[screen, id]}
          onMeasure={setCaption}
          timers={[200, 900, 1800, 3200]}
          className="size-full"
        >
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/**
 * THE CINEMA ROOM, as `(cinema)/layout.tsx` wraps every dark marketing page:
 * the descendant-scoped `dark` flip, `data-mkt` (the marketing tokens and
 * grammar are scoped to it) and the cinema skin.
 */
export function CinemaRoom({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "dark overflow-x-clip bg-background text-foreground" +
        (className ? ` ${className}` : "")
      }
      data-mkt
      data-mkt-skin="cinema"
    >
      {children}
    </div>
  );
}

/**
 * ★ A REAL <Link> IN A BOARD IS A TRAP THE BOARD DISARMS ITSELF: the step
 * swallows a click on a link on its own stage, but a frame is a document of
 * its own, so every drawing roots in this, which keeps the frame on the page
 * it is judged on.
 */
export function stopLinks(e: React.MouseEvent) {
  if ((e.target as HTMLElement).closest?.("a[href]")) e.preventDefault();
}

/**
 * WHETHER THIS DRAWING IS OFF THE STAGE. The step draws every option at once
 * and hides all but one, which an IntersectionObserver still counts as on
 * screen, so every band would run for the one a reader sees. The step marks a
 * hidden option `data-paused`; a drawing lives in a frame's document, so it
 * finds that mark through the frame's own element.
 */
export function useOffStage(ref: RefObject<HTMLElement | null>): boolean {
  const [off, setOff] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const frame = el.ownerDocument.defaultView?.frameElement ?? null;
    const view = (frame ?? el).closest("[data-lab-view]");
    if (!view) return;
    const sync = () => setOff(view.hasAttribute("data-paused"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(view, { attributes: true, attributeFilter: ["data-paused"] });
    return () => mo.disconnect();
  }, [ref]);
  return off;
}

/** A caption quoting the frame's own measurements, never a literal. */
export function px(n: number): string {
  return `${Math.round(n)}px`;
}

"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Phone } from "@/components/marketing/sections/how-it-works/picture-parts";

/**
 * A PHONE'S SCREEN, AS ITS OWN DOCUMENT (help-center r1 `article=screen`, the board's `Shot` made
 * production's): a 375px page inside the walkthrough's phone, scaled into a 200px step slot.
 *
 * ★ A DOCUMENT, NEVER A DIV. The door's type is clamped on the viewport and it reads `sm:` and
 * `40rem` breakpoints, so a phone drawn inside a 1440 page would wear the desk's sizes. An iframe
 * of its own is a 375px viewport, so every piece resolves exactly as it does in a guest's hand.
 *
 * ★ PAID FOR ONLY WHEN IT IS NEARLY IN VIEW. The frame renders at once, at its final size (so
 * nothing shifts), and the document is made only as the reader approaches: each one parses the
 * site's stylesheets, and a how-to carries seven.
 *
 * ★ THE PARENT'S STYLES, COPIED AND KEPT IN STEP. A `srcdoc` document has no route to load its
 * own, so every sheet the page has is cloned in (links re-read from cache), and a sheet that lands
 * later, like the door's own when its pieces arrive on demand, is cloned as it lands. The document
 * wears the page's font classes minus `dark`: a help article is on paper, so it shows the light
 * door.
 *
 * ★ A PICTURE, NEVER A CONTROL. The content is `inert` (nothing in it can take focus, so the page
 * never scrolls to a field inside a picture), the frame is one `img` to a screen reader, and every
 * animation is off inside: a picture at rest is the state each entrance settles on (the door's own
 * clone rule), and a lamp drifting in seven pictures at once is seven clocks for nothing.
 */

/** The phone's own CSS size, and the slot's. */
const SCREEN_W = 375;
const SCREEN_H = 640;
export const SHOT_W = 200;
/** `Phone`'s body pads 8px a side, so the screen inside it is 16px narrower. */
const SCALE = (SHOT_W - 16) / SCREEN_W;

const SHOT_DOC =
  '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>';

const RESET =
  "html,body{height:100%}body{margin:0;overflow:hidden}" +
  "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}";

const SHEETS = 'style, link[rel="stylesheet"]';

function copySheet(node: Element, into: Document) {
  const copy = node.cloneNode(true) as HTMLElement;
  copy.dataset.shotCopied = "";
  into.head.appendChild(copy);
}

/** Near enough to start building: a screen or so ahead of the reader. */
function useNearView(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setNear(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near]);
  return [ref, near];
}

export function PhoneDocument({
  label,
  children,
}: {
  /** What a screen reader hears for the picture. */
  label: string;
  children: ReactNode;
}) {
  const [slot, near] = useNearView();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!near) return;
    const frame = frameRef.current;
    if (!frame) return;
    let watcher: MutationObserver | null = null;
    const mount = () => {
      const doc = frame.contentDocument;
      if (!doc?.head || !doc.body) return;
      if (!doc.head.querySelector("[data-shot-copied]")) {
        document
          .querySelectorAll(SHEETS)
          .forEach((node) => copySheet(node, doc));
        const reset = doc.createElement("style");
        reset.dataset.shotCopied = "";
        reset.textContent = RESET;
        doc.head.appendChild(reset);
        doc.documentElement.setAttribute(
          "class",
          document.documentElement.className.replace(/\bdark\b/g, " ").trim(),
        );
        // A sheet that arrives later (a lazily loaded piece's own CSS) is copied as it lands. The
        // `srcdoc` swaps the frame's first blank document for its own on load, so a watcher over the
        // one it replaced is let go first: one watcher, one live document.
        watcher?.disconnect();
        watcher = new MutationObserver((records) => {
          for (const record of records) {
            record.addedNodes.forEach((node) => {
              if (node instanceof Element && node.matches(SHEETS)) {
                copySheet(node, doc);
              }
            });
          }
        });
        watcher.observe(document.head, { childList: true });
      }
      setBody(doc.body);
    };
    mount();
    frame.addEventListener("load", mount);
    return () => {
      frame.removeEventListener("load", mount);
      watcher?.disconnect();
    };
  }, [near]);

  return (
    <Phone className="w-[200px] shrink-0">
      <div
        ref={slot}
        role="img"
        aria-label={label}
        className="pointer-events-none relative overflow-hidden bg-background"
        style={{ width: SCREEN_W * SCALE, height: SCREEN_H * SCALE }}
      >
        {near && (
          <iframe
            ref={frameRef}
            srcDoc={SHOT_DOC}
            title={label}
            tabIndex={-1}
            aria-hidden
            width={SCREEN_W}
            height={SCREEN_H}
            className="absolute top-0 left-0 block border-0"
            style={{ transform: `scale(${SCALE})`, transformOrigin: "0 0" }}
          />
        )}
        {body &&
          createPortal(
            <div inert className="h-full bg-background text-foreground">
              {children}
            </div>,
            body,
          )}
      </div>
    </Phone>
  );
}

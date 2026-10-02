"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { Dialog as DialogPrimitive } from "radix-ui";
import { usePortalContainer } from "@/components/ui/portal-container";
import { useLayoutEffect, useRef, useState } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { GLASS, GLASS_BEHIND, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import type { PeekRequest } from "./album-fill-grid";

/**
 * THE EASTER EGG'S LIGHTBOX (`loose-ends` r1, `everywhere-pill=corner`, his
 * note: "a fun little lightbox preview when clicked ... it should clearly feel
 * like a fun easter egg demo, not trap visitors in a demo they didn't ask
 * for"). A press on a tile of the Everywhere stage opens the photograph large,
 * in the album viewer's own grammar (the blurred album for a ground, the
 * uploader's name, the glass close circle at the top right), and it is a demo
 * and says so in words: nothing here is saved or sent, there is no call to
 * action and no product behind it, and ANY tap closes it (the photograph, the
 * ground, the close circle) as does Escape.
 *
 * ★ ONE TAP CLOSES, AND ONLY CLOSES. The whole card is one close button (a
 * stretched `Dialog.Close` laid over it, so the markup stays valid: nothing
 * else inside is interactive), and Radix closes on a press on the ground. It
 * takes the page's scroll and its focus while it is up, which is what a modal
 * is, so the way out has to be as big as the card. No like, no download, no
 * "Start free": a visitor who tapped a tile out of curiosity is not asked for
 * anything back (the contained reel player keeps them in the marketing lane by
 * putting Start free beside the film; an easter egg does the opposite).
 *
 * ★ THE CARD GROWS OUT OF THE TILE THAT WAS PRESSED, on the marketing ease,
 * and the ground fades under it: the connection between the press and the
 * photograph is the whole delight, so it opens from where the finger was. The
 * exit is the house dialog's (a fade and a hair of scale, faster than the way
 * in). Reduced motion skips the travel and keeps the fades.
 *
 * ★ THE PHOTOGRAPH ARRIVES IN TWO STEPS. The tile's own loaded image (already
 * in the browser's cache, handed over as `poster`) sits under the sharp one, so
 * the card never opens on a black box while the larger variant is fetched.
 *
 * It portals to <body> like every Radix dialog, outside the cinema room and the
 * `[data-mkt]` skin, so the card names its own ground (`bg-gallery`, always dark
 * in both themes) rather than reading a token that depends on where it lands.
 * `peek` is kept after close so the exit still draws the photograph it is
 * fading; the caller only ever replaces it.
 */

/** The marketing ease (`--ease-emphasis`); Web Animations takes no var(). */
const EASE_EMPHASIS = "cubic-bezier(0.23, 1, 0.32, 1)";

/** Grows the card from the pressed tile's box to its own: translate and scale
 *  about the centre, the FLIP arithmetic the album's tiles already use. Returns
 *  the animation so the caller can cancel it: a second measurement taken while
 *  the first still holds the card at its start would read the tile's box as the
 *  card's own and grow nothing (React's dev double-invoke did exactly that). */
function growFrom(el: HTMLElement | null, from: DOMRect): Animation | null {
  if (!el || typeof el.animate !== "function") return null;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return null;
  const to = el.getBoundingClientRect();
  if (to.width === 0 || to.height === 0) return null;
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const scale = Math.min(1, Math.max(0.15, from.width / to.width));
  return el.animate(
    [
      {
        transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        opacity: 0.35,
      },
      { transform: "none", opacity: 1 },
    ],
    { duration: 280, easing: EASE_EMPHASIS },
  );
}

function PeekCard({ peek }: { peek: PeekRequest }) {
  const image = marketingImage(peek.id);
  const cardRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Once per open: the card mounts with the dialog and `from` is that press's box.
  useLayoutEffect(() => {
    const grow = growFrom(cardRef.current, peek.from);
    return () => grow?.cancel();
  }, [peek.from]);

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-float bg-gallery text-gallery-foreground shadow-layer ring-1 ring-white/10"
    >
      <div
        className="relative w-full bg-gallery"
        style={{ aspectRatio: `${image.width} / ${image.height}` }}
      >
        {peek.poster && (
          <span
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${JSON.stringify(peek.poster)})` }}
          />
        )}
        <Image
          src={image.src}
          alt={image.subject}
          fill
          sizes="(min-width: 640px) 448px, calc(100vw - 2rem)"
          loading="eager"
          fetchPriority="high"
          draggable={false}
          onLoad={() => setReady(true)}
          className={cn(
            "object-cover transition-opacity duration-200 motion-reduce:transition-none",
            ready ? "opacity-100" : "opacity-0",
          )}
        />
        {/* The viewer's own close circle, top right. Drawn, not a control: the
            whole card is the button beneath. */}
        <span
          aria-hidden
          className={cn(
            "absolute top-3 right-3 flex size-9 items-center justify-center rounded-full text-white",
            GLASS,
          )}
        >
          <X className={cn("size-4", GLASS_MARK_LIT)} />
        </span>
      </div>

      <div className="flex flex-col gap-1.5 px-4 py-3">
        <DialogPrimitive.Title className="sr-only">
          A demo photo added by {peek.by}
        </DialogPrimitive.Title>
        <div aria-hidden className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-white/15 text-caption font-medium">
            {peek.by.charAt(0)}
          </span>
          <span className="text-working font-medium">{peek.by}</span>
        </div>
        <DialogPrimitive.Description className="text-caption text-gallery-muted">
          Just a demo. Tap anywhere to close.
        </DialogPrimitive.Description>
      </div>

      <DialogPrimitive.Close
        aria-label="Close the demo photo"
        className="absolute inset-0 z-10 cursor-pointer rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset"
      />
    </div>
  );
}

export function EverywherePeek({
  peek,
  open,
  onOpenChange,
}: {
  /** The photograph asked for; kept after close so the exit still draws it. */
  peek: PeekRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const container = usePortalContainer();
  if (!peek) return null;
  const image = marketingImage(peek.id);
  const ratio = image.width / image.height;
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 ease-emphasis",
            // The viewer's ground: the page behind, blurred at half brightness,
            // on its own element and never around the photograph.
            GLASS_BEHIND,
            "data-open:animate-in data-open:duration-200 data-open:fade-in-0",
            "data-closed:animate-out data-closed:duration-150 data-closed:fade-out-0",
          )}
        />
        <DialogPrimitive.Content
          // A card as wide as the phone allows or 448, and never taller than
          // the screen: a portrait photograph narrows it instead of scrolling.
          style={{
            width: `min(28rem, calc(100vw - 2rem), calc(68svh * ${ratio}))`,
          }}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 ease-emphasis outline-none",
            "data-closed:animate-out data-closed:duration-150 data-closed:fade-out-0 data-closed:zoom-out-95",
            "motion-reduce:data-closed:zoom-out-100",
          )}
        >
          <PeekCard peek={peek} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

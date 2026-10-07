"use client";

/**
 * THE REEL'S CURTAIN (guest-moments r1, Will's `opening=still`): what a viewer who owes no door meets when she arrives
 * on `?reel` (the owner from her hub's Reel card, a returning guest on a shared reel link), from the page's first
 * byte until the reel's view stands over it.
 *
 * ★ THE CURTAIN IS THE REEL'S FIRST PHOTOGRAPH, WITH CLOSE BESIDE IT. It was a black with no mark for as long as the
 * view's chunk and the player's first window took (about a second on a slow phone, a third warmed), which at the very
 * start of the reel read as broken. The cover's first still is already on the page (`OpeningStill`: the seed's slot 0,
 * the reel's own opening), so it stands edge to edge at once, the view stands the same picture until its first frame
 * (`live-reel-view.tsx`'s `opening`) and the reel starts from it. An album with nothing to show (sealed until its
 * develop, or a seed still on its way) keeps a quiet dark, with Close.
 *
 * ★ FROM THE FIRST BYTE, BEFORE THE HEAD. It is the page's first child (ROADMAP's curtain line: drawn after the album's
 * head, a hard `?reel` on a slow link painted the head for the 25 KB that streamed before it), the photograph in a
 * boundary of its own that streams with the seed, as the cover's does.
 *
 * ★ CLOSE WORKS BEFORE THE ALBUM HAS ARRIVED, AND BEFORE THE PAGE HAS HYDRATED. It is a link to the album's own address
 * (a plain navigation before any script runs, the router's after), and once the album's controller stands it closes
 * the reel as the view's own Close does (the head's bridge: the owner back where she came from). Escape is Close.
 *
 * ★ A CEILING, SO A REEL THAT NEVER COMES IS A STATE, NEVER A STRANDING (ROADMAP's second curtain line: a seed or a view
 * chunk that never lands left the owner on black until Back). Past `REEL_CURTAIN_CEILING_MS` the curtain says so at its
 * foot, with Try again (the page asked again) beside Close; under a view that did arrive it is never seen.
 */
import Link from "next/link";
import { X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import {
  OpeningStill,
  type HeadBridge,
} from "@/components/guest/event-experience-head";
import {
  REEL_CLOSE_SPOT,
  REEL_KEY,
  REEL_KEY_HOVER,
  REEL_TOP_WHISPER,
} from "@/components/guest/reel/reel-close";
import { Button } from "@/components/ui/button";
import type { GallerySeed } from "@/lib/events/gallery-seed";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

/**
 * How long the curtain stands before it says the reel has not come. Generous on purpose: a slow phone's seed, the view's
 * chunk and the first window's stills (each waits up to its own 3 s for a link) all fit inside it, so it speaks only
 * when something has stopped answering.
 */
export const REEL_CURTAIN_CEILING_MS = 12_000;

/** The curtain's words, in one place. */
export const REEL_CURTAIN_WORDS = {
  /** The dialog's name: what the view's own dialog is called. */
  name: "Highlight reel",
  /** The view's own Close says the same. */
  close: "Close",
  late: "The reel is taking a while.",
  again: "Try again",
} as const;

export function ReelCurtain({
  seed,
  bridge,
  eventId,
  albumHref,
  onClosed,
}: {
  seed: Promise<GallerySeed>;
  bridge: HeadBridge;
  eventId: string;
  /** The album's own address, with no `?reel`: where Close goes before the album's controller can close the reel. */
  albumHref: string;
  /** Close was pressed: the page lets the curtain go at once (the address follows). */
  onClosed: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLAnchorElement>(null);
  const [late, setLate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLate(true), REEL_CURTAIN_CEILING_MS);
    return () => clearTimeout(t);
  }, []);
  // She starts inside it, as she would inside the view's own dialog (a pointer's arrival draws no halo).
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  const onClose = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      onClosed();
      // The album's controller closes the reel as the view's own Close would; until it stands, the link does.
      const reel = bridge.get()?.reel;
      if (!reel) return;
      e.preventDefault();
      reel.close();
    },
    [bridge, onClosed],
  );

  // Escape is Close; Tab keeps to the curtain's own keys, as a dialog's does.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeRef.current?.click();
      return;
    }
    if (e.key !== "Tab") return;
    const keys = [
      ...(rootRef.current?.querySelectorAll<HTMLElement>("a[href], button") ??
        []),
    ];
    if (keys.length === 0) return;
    const at = keys.indexOf(document.activeElement as HTMLElement);
    const next = e.shiftKey
      ? at <= 0
        ? keys.length - 1
        : at - 1
      : at === keys.length - 1
        ? 0
        : at + 1;
    e.preventDefault();
    keys[next]!.focus();
  };

  return (
    <div
      ref={rootRef}
      data-reel-curtain=""
      role="dialog"
      aria-modal="true"
      aria-label={REEL_CURTAIN_WORDS.name}
      data-surface="photo"
      onKeyDown={onKeyDown}
      // Over everything on the page and under the view's own overlay (z-50), which lands on the same picture.
      className="dark fixed inset-0 z-[49] touch-none overflow-hidden bg-black text-white"
    >
      <OpeningStill
        seed={seed}
        bridge={bridge}
        eventId={eventId}
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />
      <div aria-hidden className={REEL_TOP_WHISPER} />
      <div className={REEL_CLOSE_SPOT}>
        <Link
          ref={closeRef}
          href={albumHref}
          replace
          scroll={false}
          // Never fetched on sight: the album's page is a whole server render, asked for only if she presses.
          prefetch={false}
          onClick={onClose}
          aria-label={REEL_CURTAIN_WORDS.close}
          title={REEL_CURTAIN_WORDS.close}
          data-reel-curtain-close=""
          className={cn(REEL_KEY, REEL_KEY_HOVER, GLASS)}
        >
          <X className={cn("size-4", GLASS_MARK_LIT)} aria-hidden />
        </Link>
      </div>
      {late && (
        <div className="absolute inset-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-4">
          <div
            role="status"
            data-reel-curtain-late=""
            className={cn(
              "flex max-w-full items-center gap-3 rounded-full py-1.5 pr-1.5 pl-4 text-sm text-white",
              GLASS,
            )}
          >
            <span className={GLASS_MARK_LIT}>{REEL_CURTAIN_WORDS.late}</span>
            <Button
              type="button"
              variant="on-photo"
              size="sm"
              className="shrink-0 rounded-full"
              onClick={() => window.location.reload()}
            >
              {REEL_CURTAIN_WORDS.again}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { EyeOff, Lock, Pause, type LucideIcon } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { CodeMat } from "@/components/ui/code-mat";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useInViewSentinel } from "@/lib/shared/use-in-view-sentinel";
import { useHydrated } from "@/lib/shared/use-hydrated";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { trackAttrs } from "@/lib/analytics/events";
import { stepOf, type Door } from "@/lib/event/door/door";
import {
  codeMark,
  type CodeMark,
  type CodeMarkGlyph,
} from "@/lib/events/visibility-labels";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { useEventShare } from "./event-share-provider";

import "./share.css";

/** ~112px reads as a 33-module code at arm's length — the size a guest can
 *  scan leaning over a laptop, which is the whole reason the code is on the
 *  page at rest rather than behind a button. */
const CODE_PX = 112;

/**
 * THE LIVE CODE AT THE LEFT OF THE TITLE (Will, `event` note: "I'd like to
 * include a QR code horizontally centered to the left of the title + metadata
 * stack. This should be clickable and open the share modal. Get the QR and
 * sharing more infusion to the album UI visually").
 *
 * ★ IT IS A REAL, SCANNABLE CODE AT REST, not a glyph that stands for one. That
 * is what carries his `front` remark on the other question — "On the event
 * itself, always there ... I did like your option 3 a lot" — without giving the
 * header over to a sharing block: the code IS the header's left column.
 *
 * ★ A BUTTON BESIDE THE h1, NEVER INSIDE IT. An h1 that contains a control
 * reads to a screen reader as a heading you can press, and the accessible name
 * of the page stops being the event's name. Its own label says what it opens.
 *
 * ★ THE CODE IS THE DOOR, AND WEARS IT ON ITS CORNER (event-ready, `door=mark`,
 * Will 2026-10-02: "the mark keeps the header from getting too crowded with
 * text where icons will likely work 99% of the time, and we could add tooltips
 * to clarify on the mark"). A lock for a gate, a closed eye for Only me, a
 * pause for paused uploads, and the count in the needs-action tone while people
 * wait at the door; a Public album taking uploads wears nothing. The code
 * dims where a guest who scans it meets a door that takes no photo (paused, Only
 * me). The mark sits OUTSIDE the mat's edge, so nothing lands on the modules or
 * the quiet zone the code scans by (`module-floor.ts`).
 */
export function EventCodeDoor({
  eventName,
  joinUrl,
  qrStyle,
  door,
  acceptingUploads,
  waiting,
}: {
  eventName: string;
  joinUrl: string;
  qrStyle: string;
  /** Who can get in (`lib/event/door/door.ts`). */
  door: Door;
  acceptingUploads: boolean;
  /** People waiting at the door for the host (`DoorCounts.waiting`). */
  waiting: number;
}) {
  const { openCode, morphNameFor, setHeaderCodeHidden } = useEventShare();
  // The sticky row's QR pill appears only once THIS code has left the screen,
  // so nothing is duplicated at rest. One sentinel, read by the provider.
  const { sentinelRef, inView } = useInViewSentinel<HTMLSpanElement>();

  useEffect(() => {
    setHeaderCodeHidden(!inView);
  }, [inView, setHeaderCodeHidden]);

  const mark = codeMark({ door, acceptingUploads, waiting });
  const dimmed = !acceptingUploads || stepOf(door) === "only_me";

  return (
    <>
      <span ref={sentinelRef} aria-hidden className="sr-only" />
      <span data-code-door="" className="relative shrink-0">
        {/* The code on its white mat (`ui/code-mat.tsx`): the mat owns the press and the dim, this
            door owns what a press opens and the morph's name while the code is the one on screen. */}
        <CodeMat
          onClick={openCode}
          aria-label={`Show the code for ${eventName}`}
          dimmed={dimmed}
          style={{ viewTransitionName: morphNameFor("header") }}
          {...trackAttrs("cta_click", { cta: "event-code", location: "hub" })}
        >
          {/* The code's own box, held before its script draws it, so the head never moves. */}
          <span className="block" style={{ width: CODE_PX, height: CODE_PX }}>
            <StyledQr
              value={joinUrl}
              size={CODE_PX}
              style={resolveQrPreset(qrStyle)}
            />
          </span>
        </CodeMat>
        {mark ? <CornerMark mark={mark} /> : null}
      </span>
    </>
  );
}

const GLYPHS: Record<CodeMarkGlyph, LucideIcon> = {
  "only-me": EyeOff,
  paused: Pause,
  gate: Lock,
};

/**
 * THE MARK, AND ITS WORDS ON EVERY INPUT: a tooltip on hover and on a keyboard's
 * focus, and a tap shows the same words, so a phone is never left with a glyph
 * it cannot ask about (the tooltip primitive refuses a tap on purpose, so the
 * tap is answered here: it toggles the tooltip open and shut).
 *
 * ★ ITS OWN BUTTON, BESIDE THE CODE'S, never inside it: pressing the code opens
 * the code card, and asking what a corner means must not.
 *
 * ★ THE RICH TOOLTIP MOUNTS ONLY AFTER HYDRATION (`architecture.md`: radix
 * tooltips on an SSR'd surface left the host page unhydrated in production). The
 * server's paint and the hydrating render carry the browser's own `title`, and
 * the swap is an ordinary later render, the bulk bar's arrangement.
 */
function CornerMark({ mark }: { mark: CodeMark }) {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  // How the press began, and whether the tooltip stood open then: a tap's own
  // pointerleave reaches the tooltip before its click does.
  const press = useRef<{ touch: boolean; wasOpen: boolean } | null>(null);
  const Icon = GLYPHS[mark.glyph];
  const waiting = mark.waiting > 0;

  const face = (
    <button
      type="button"
      data-code-mark={mark.glyph}
      aria-label={mark.words}
      title={hydrated ? undefined : mark.words}
      onPointerDown={(event) => {
        press.current = {
          touch: event.pointerType !== "mouse",
          wasOpen: open,
        };
        // Radix closes an open tooltip on any press of its trigger; the click
        // below decides instead.
        event.preventDefault();
      }}
      onClick={(event) => {
        // Radix's own click closes the tooltip; this one owns what a press does.
        event.preventDefault();
        const began = press.current;
        press.current = null;
        if (began?.touch) setOpen(!began.wasOpen);
        // A keyboard's Enter or Space toggles, as a tap does; a cursor's click keeps it.
        else if (event.detail === 0) setOpen((o) => !o);
        else setOpen(true);
      }}
      className={cn(
        "absolute -top-2 -right-2 z-10 flex h-6 min-w-6 items-center justify-center gap-0.5 rounded-full px-1.5 ring-2 ring-background outline-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        // A finger's target past the 24px glyph, without growing it.
        "before:absolute before:-inset-2 before:content-['']",
        waiting
          ? "bg-warning text-warning-foreground"
          : "bg-neutral-900 text-white",
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
      {waiting ? (
        <span className="text-[11px] font-semibold tabular-nums">
          {formatCount(mark.waiting)}
        </span>
      ) : null}
    </button>
  );

  if (!hydrated) return face;
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>{face}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-60 text-pretty">
        {mark.words}
      </TooltipContent>
    </Tooltip>
  );
}

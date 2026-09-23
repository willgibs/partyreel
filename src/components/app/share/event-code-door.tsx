"use client";

import { useEffect } from "react";

import { StyledQr } from "@/components/app/styled-qr";
import { useInViewSentinel } from "@/lib/shared/use-in-view-sentinel";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { trackAttrs } from "@/lib/analytics/events";
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
 * ★ "ACCEPTING UPLOADS" IS NOW THE CODE'S OWN STATE. The header used to carry
 * two chips; a paused event dims the code and says "Paused" over it instead,
 * which puts the status on the object the status is ABOUT — a code nobody can
 * upload through is a code that is off, and that is worth seeing at a glance
 * while standing at a door. Visibility moved to the Settings card's value line.
 */
export function EventCodeDoor({
  eventName,
  joinUrl,
  qrStyle,
  acceptingUploads,
}: {
  eventName: string;
  joinUrl: string;
  qrStyle: string;
  acceptingUploads: boolean;
}) {
  const { openCode, morphNameFor, setHeaderCodeHidden } = useEventShare();
  // The sticky row's QR pill appears only once THIS code has left the screen,
  // so nothing is duplicated at rest. One sentinel, read by the provider.
  const { sentinelRef, inView } = useInViewSentinel<HTMLSpanElement>();

  useEffect(() => {
    setHeaderCodeHidden(!inView);
  }, [inView, setHeaderCodeHidden]);

  return (
    <>
      <span ref={sentinelRef} aria-hidden className="sr-only" />
      <button
        type="button"
        onClick={openCode}
        aria-label={`Show the code for ${eventName}`}
        style={{ viewTransitionName: morphNameFor("header") }}
        className={cn(
          "group relative shrink-0 rounded-lg bg-white p-2 outline-none transition-transform duration-150 ease-emphasis",
          "hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.98]",
          "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        )}
        {...trackAttrs("cta_click", { cta: "event-code", location: "hub" })}
      >
        <span
          className={cn(
            "block transition-opacity duration-200",
            !acceptingUploads && "opacity-25",
          )}
        >
          <StyledQr
            value={joinUrl}
            size={CODE_PX}
            style={resolveQrPreset(qrStyle)}
          />
        </span>
        {!acceptingUploads && (
          // The badge says the short word and the native title says the whole
          // state. Both are deliberate: "Paused" is what reads at 112px over a
          // dimmed code, and "Uploads paused" is the phrase the product has
          // always used for it — the words the retired header chip carried and
          // the words the help centre quotes.
          <span
            className="absolute inset-0 flex items-center justify-center"
            title="Uploads paused"
          >
            <span className="rounded-full bg-neutral-900/85 px-2 py-0.5 text-xs font-medium text-white">
              Paused
            </span>
          </span>
        )}
      </button>
    </>
  );
}

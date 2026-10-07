"use client";

import { useSyncExternalStore } from "react";
import { Check, Copy, Printer, Share2 } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { useCopyLink } from "@/components/app/share/use-copy-link";
import { Glow } from "@/components/shared/glow";
import { trackAttrs } from "@/lib/analytics/events";
import { QR_PRESETS, type QrStyleKey } from "@/lib/constants/qr-presets";
import { type Readiness, stillNeeded } from "@/lib/events/readiness";

/**
 * THE BEAT, DEVELOPED (create-wizard r2 `beat=develop`, Will 2026-10-03: "This is a beautiful screen and
 * allows everything to breathe, with lots of our aurora identity infused"). Round one's `hand=lit` settled
 * what it is: the code alone, lit, the first win, leading on into Get it ready and Settings' first step;
 * See it as a guest stays the hub's payoff, never offered here.
 *
 * ★ THE SAMPLE DEVELOPS INTO HER CODE WHERE IT STANDS, WHILE CREATE RUNS (r4's `wait=breath`, as built).
 * The press of Create event lands here at once: the sample she styled, in her look, breathing like a print
 * in the tray, while the event is made (a status says so, for a reader and under reduced motion). When the
 * event exists her own code comes up sharp under the sample, the sample softens away, and its one word
 * goes; then the question, the two doors and the close, then the foot. A failed Create is held right here,
 * the sample standing still (the wizard's `held.ts`). One moment from her pick to her code, and nothing on
 * the screen ever says "live" before it is.
 *
 * ★ THE LIGHT IS THE CODE'S OWN: a bloom behind the plate that ignites as the code turns real and rests
 * lit (the QR hero's composition, design-system.md: the bloom is a one-time glow that rests lit, the
 * mark of a live subject), while the room's floor is dimmed for it: one lamp to a screen.
 *
 * ★ PRINT AND SHARE STAND AS ROUNDS, the code's two ways out, each its word under it: Print opens the
 * table cards in a tab of their own; Share hands the link to the phone's own sheet, and where a browser
 * has none (most laptops) it is Copy link, with the press's own confirmation in place of a toast.
 *
 * ★ THE CLOSE IS ONE LINE, WHAT GUESTS STILL NEED (r4's `close=next`, his note: "I do like the subtlety
 * versus the steps"): the code, sent or printed, which the two rounds right above it do. Settings' five
 * marks went with it; Get it ready still opens Settings on its first step. Room, once the account runs
 * short, is said beside the line (the carried `room`), never in it: it is the plan's.
 */

export function BeatCode({
  look,
  name,
  sampleUrl,
  realUrl,
}: {
  look: QrStyleKey;
  name: string;
  /** What the sample she styled encodes (`previewJoinUrl`). */
  sampleUrl: string;
  /** Her event's own link, once Create has made it. */
  realUrl: string | null;
}) {
  const options = QR_PRESETS[look].options;
  const code = "[&>svg]:block [&>svg]:h-auto [&>svg]:w-full";
  return (
    <span data-beat-plate="" className="relative isolate block">
      {/* The code's light: a bloom from the plate that ignites as the code turns real and rests lit. It
          mounts with her code, never with the sample (a bloom arms the moment it is in view), on its own
          layer behind the plate and outside it, so the quiet zone stays white. */}
      {realUrl ? (
        <span
          aria-hidden
          data-beat-light=""
          className="pointer-events-none absolute -inset-28 -z-10 md:-inset-36"
        >
          <Glow
            shape="bloom"
            drive="mask"
            vars={{
              "--glw-from-x": "50%",
              "--glw-from-y": "56%",
              "--glw-reach": "58%",
              "--glw-strength": "0.9",
              "--glw-base": "0.4",
              "--glw-blur": "28px",
            }}
          />
        </span>
      ) : null}
      <span className="relative flex w-[14.125rem] flex-col items-center rounded-[calc(var(--radius)*2.6)] bg-white p-[0.8125rem] pb-2.5 text-neutral-950 md:w-[17.75rem] md:p-4 md:pb-3">
        <span
          data-beat-sample-word=""
          data-state={realUrl ? "gone" : "on"}
          aria-hidden={realUrl ? true : undefined}
          className="cr-sample-word absolute top-[3px] left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/[0.06] px-2 py-px text-micro font-medium tracking-[0.1em] text-black/55 uppercase"
        >
          Sample
        </span>
        {/* The code's square: her own under the sample, so the one becomes the other where it stands. The
            word Sample sits over the sample's quiet zone, never its modules, and goes with it. */}
        <span className="relative block aspect-square w-full">
          {realUrl ? (
            <span data-beat-real="" className="cr-real-code absolute inset-0">
              <StyledQr
                value={realUrl}
                size={256}
                style={options}
                className={code}
              />
            </span>
          ) : null}
          <span
            data-beat-sample=""
            className="cr-sample-code absolute inset-0 bg-white"
          >
            <StyledQr
              value={sampleUrl}
              size={256}
              style={options}
              className={code}
            />
          </span>
        </span>
        <span className="max-w-full truncate px-2 pt-1 font-heading text-working md:text-card-title">
          {name}
        </span>
      </span>
    </span>
  );
}

/** Print and Share, the code's two ways out, as rounds of the room's own material. */
export function BeatActs({
  eventId,
  eventName,
  joinUrl,
}: {
  eventId: string;
  eventName: string;
  joinUrl: string;
}) {
  const { copied, copy } = useCopyLink(joinUrl);
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && "share" in navigator,
    () => false,
  );

  async function share() {
    if (canShare) {
      try {
        await navigator.share({
          title: eventName,
          // "and", never "&": the house style for this native-share line.
          text: `Add your photos and videos to ${eventName}`,
          url: joinUrl,
        });
        return;
      } catch {
        // Dismissed, or refused. The clipboard is the same intent, so fall to it rather than leaving
        // the press with nothing to show for itself.
      }
    }
    void copy();
  }

  const act =
    "cr-act group/act flex w-20 flex-col items-center gap-2 rounded-xl text-caption text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:text-foreground";
  const round =
    "cr-round size-14 group-focus-visible/act:ring-3 group-focus-visible/act:ring-ring/50";
  const ShareIcon = copied ? Check : canShare ? Share2 : Copy;
  return (
    <div data-beat-rounds="" className="flex justify-center gap-6">
      <a
        href={`/dashboard/${eventId}/print`}
        target="_blank"
        rel="noopener noreferrer"
        className={act}
        {...trackAttrs("cta_click", {
          cta: "print-stock",
          location: "create-beat",
        })}
      >
        <span aria-hidden className={round}>
          <Printer className="size-5" />
        </span>
        Print
      </a>
      <button
        type="button"
        onClick={share}
        className={act}
        {...trackAttrs("cta_click", {
          cta: "copy-event-link",
          location: "create-beat",
        })}
      >
        <span aria-hidden className={round}>
          <span data-copy-pop={copied ? "on" : undefined} className="flex">
            <ShareIcon className="size-5" />
          </span>
        </span>
        {copied ? "Copied" : canShare ? "Share" : "Copy link"}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}

/**
 * WHAT CREATE CLOSES ON, UNDER PRINT AND SHARE: one quiet line saying what guests still need, read off
 * the new event's own readiness (`stillNeeded`), so it is the checklist's truth and never a sentence of
 * Create's. The line breaks after its colon when a narrow screen or a large text size cannot hold it
 * whole, so what is needed and how to do it each stay in one piece.
 */
export function BeatClose({
  r,
  onPlans,
}: {
  r: Readiness;
  /** Room's own way on, the plans, where the account runs short. */
  onPlans: () => void;
}) {
  const line = stillNeeded(r);
  const at = line.indexOf(": ");
  const room = r.items.find((i) => i.id === "room") ?? null;
  return (
    <div data-beat-close="" className="flex flex-col items-center gap-2.5">
      <p
        data-beat-needs=""
        className="max-w-[18rem] text-center text-caption text-balance text-muted-foreground md:max-w-none"
      >
        {at > 0 ? (
          <>
            <span className="inline-block">{line.slice(0, at + 1)}</span>{" "}
            <span className="inline-block">{line.slice(at + 2)}</span>
          </>
        ) : (
          line
        )}
      </p>
      {room ? (
        <p
          data-beat-room=""
          className="flex items-center gap-2 text-caption text-muted-foreground"
        >
          <span aria-hidden className="size-1.5 rounded-full bg-warning" />
          {room.line}
          <button
            type="button"
            onClick={onPlans}
            className="focus-halo rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline"
          >
            {room.actions[0]?.label ?? "See plans"}
          </button>
        </p>
      ) : null}
    </div>
  );
}

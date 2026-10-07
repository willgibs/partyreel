"use client";

import { type CSSProperties, useSyncExternalStore } from "react";
import { Check, Copy, Printer, Share2 } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { useCopyLink } from "@/components/app/share/use-copy-link";
import { trackAttrs } from "@/lib/analytics/events";
import { orbFor } from "@/lib/avatar/gradient";
import { QR_PRESETS, type QrStyleKey } from "@/lib/constants/qr-presets";
import type { ReadyItem } from "@/lib/events/readiness";

/**
 * THE BEAT, DEVELOPED (create-wizard r2 `beat=develop`, Will 2026-10-03: "This is a beautiful screen and
 * allows everything to breathe"), CREATE'S PAYOFF (r5's `close=enter`, Will 2026-10-07): her code, lit, the line
 * under the question saying share it, Print and Share under the code, and the one press that carries her into her
 * event, her code flying to its place there (`create-event-wizard.tsx`'s entry).
 *
 * ★ THE SAMPLE DEVELOPS INTO HER CODE WHERE IT STANDS, WHILE CREATE RUNS (r4's `wait=breath`, as built).
 * The press of Create event lands here at once: the sample she styled, in her look, breathing like a print
 * in the tray, while the event is made (a status says so, for a reader and under reduced motion). When the
 * event exists her own code comes up sharp under the sample, the sample softens away, and its one word
 * goes; then the question and its line, the link and the two doors, then the foot. A failed Create is held
 * right here, the sample standing still (the wizard's `held.ts`). Nothing on the screen ever says "live"
 * before it is.
 *
 * ★ THE ROOM'S FIRST LIGHT IS THE CODE'S, IN THE EVENT'S SEED (signature r1's `create=dark`, Will 2026-10-07):
 * every step before it stands unlit (`room.tsx`), and as the code turns real one soft light ignites behind its
 * plate, once, in the hue her event's own seed gives it (`seedLight`: a new event has no photograph yet, and its
 * seed is the light before the first one), then rests lit. Soft, never a neon edge: the seed's hue made lighter and
 * less saturated, an ellipse a little wider than the plate and a little above it, spent before the doors under it.
 *
 * ★ HER LINK, AS THE MESSAGE GUESTS RECEIVE (r5's `close=enter`, his addition: "a mini compact link/share card
 * beneath the QR ... a polished design of what you'd kind of expect to send/receive in a group message with an easy
 * one-tap to copy"): the album's own share card (the real `/e/<token>/card`, so it follows the day the card is
 * redrawn), its title and the link, the plate's own width under it, one press copying the link, no instruction.
 *
 * ★ PRINT AND SHARE STAND AS ROUNDS, the code's two ways out, each its word under it: Print opens the
 * table cards in a tab of their own; Share hands the message to the phone's own sheet. Where a browser has none
 * (most laptops) the link above is the copy, so the round is not drawn twice (`copyLink`).
 */

/**
 * THE EVENT'S SEED, AS LIGHT: the hue `orbFor` gives her event's id (the generator every face's colour comes from, so
 * a seed reads as one family across the product), lighter and four tenths less saturated than a face, so it glows
 * rather than paints (signature r1's `dark` drawing).
 */
export function seedLight(seed: string): string {
  return `oklch(0.8 0.085 ${Math.round(orbFor(seed).hue)})`;
}

export function BeatCode({
  look,
  name,
  sampleUrl,
  realUrl,
  seed,
}: {
  look: QrStyleKey;
  name: string;
  /** What the sample she styled encodes (`previewJoinUrl`). */
  sampleUrl: string;
  /** Her event's own link, once Create has made it. */
  realUrl: string | null;
  /** Her event's seed (its id): the hue of the code's light. Absent, the link stands in for it. */
  seed?: string;
}) {
  const options = QR_PRESETS[look].options;
  const code = "[&>svg]:block [&>svg]:h-auto [&>svg]:w-full";
  return (
    <span data-beat-plate="" className="relative isolate block">
      {/* The code's light: the event's seed, igniting once as the code turns real and resting lit. It mounts with
          her code, never with the sample, on its own layer behind the plate and outside it, so the quiet zone stays
          white. */}
      {realUrl ? (
        <span
          aria-hidden
          data-beat-light=""
          className="cr-seed-light"
          style={{ "--cr-seed": seedLight(seed ?? realUrl) } as CSSProperties}
        />
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

/**
 * THE SHARE'S OWN MESSAGE: "and", never "&", the house style for this native-share line, and only what the plan's
 * album takes (a Free event takes photos alone: the ROADMAP line this closes said videos to a Free host's guests).
 */
export function shareMessage(eventName: string, videos: boolean): string {
  return `Add your photos${videos ? " and videos" : ""} to ${eventName}`;
}

/**
 * HER LINK, AS GUESTS WILL RECEIVE IT: the album's own share card (its image, its title, the link), the plate's width
 * under the code, one press copying the link, confirmed in place. Read as one control: "Copy the link", then what it
 * shows.
 */
export function BeatLink({
  joinUrl,
  cardSrc,
  title,
}: {
  /** The permanent link: what is copied, and what the card's foot shows. */
  joinUrl: string;
  /** The album's share card (`/e/<token>/card`, the address its page names for an album taking photos). */
  cardSrc: string;
  /** The link's own title as a chat unfurls it (`openAlbumWords`). */
  title: string;
}) {
  const { copied, failed, copy } = useCopyLink(joinUrl);
  const shown = joinUrl.replace(/^https?:\/\//, "");
  return (
    <>
      <button
        type="button"
        data-beat-link=""
        data-copied={copied ? "" : undefined}
        onClick={() => void copy()}
        className="cr-link group/link relative flex w-[14.125rem] items-center gap-2.5 text-left outline-none md:w-[17.75rem]"
        {...trackAttrs("cta_click", {
          cta: "copy-event-link",
          location: "create-beat-link",
        })}
      >
        <span className="sr-only">Copy the link, </span>
        {/* The album's own card, at the size a chat's compact preview draws it: a picture, its words beside it. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- our own share card route, never user media */}
        <img
          src={cardSrc}
          alt=""
          width={1200}
          height={630}
          decoding="async"
          draggable={false}
          className="cr-link-card"
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* Two lines for the title, as a chat's compact preview gives it: a phone's plate leaves it a narrow column. */}
          <span className="line-clamp-2 text-caption leading-tight font-medium text-pretty text-foreground">
            {title}
          </span>
          <span
            aria-hidden={copied || failed ? true : undefined}
            className="truncate text-micro text-muted-foreground"
          >
            {copied ? "Copied" : failed ? "Couldn't copy it here" : shown}
          </span>
          {copied || failed ? <span className="sr-only">{shown}</span> : null}
        </span>
        <span
          aria-hidden
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 group-hover/link:text-foreground"
        >
          <span data-copy-pop={copied ? "on" : undefined} className="flex">
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </span>
        </span>
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied" : failed ? "The link could not be copied" : ""}
      </span>
    </>
  );
}

/** Print and Share, the code's two ways out, as rounds of the room's own material. */
export function BeatActs({
  eventId,
  eventName,
  joinUrl,
  videos = false,
  copyLink = true,
}: {
  eventId: string;
  eventName: string;
  joinUrl: string;
  /** The album takes videos (a paid plan, the Videos switch on by birth): what the share's message says. */
  videos?: boolean;
  /**
   * Where the device has no share sheet, the Share round copies the link (a surface without the link of its own).
   * False where the link above already is the copy (the beat's `BeatLink`): the round is then drawn only where a
   * sheet exists.
   */
  copyLink?: boolean;
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
          text: shareMessage(eventName, videos),
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
      {canShare || copyLink ? (
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
      ) : null}
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}

/**
 * ROOM, ONCE THE ACCOUNT RUNS SHORT (create-wizard r2's carried `room`), said under the two rounds and never as a
 * debt of the event's: it is the plan's, and its way on is the plans. Nothing where the account has room.
 */
export function BeatRoom({
  room,
  onPlans,
}: {
  /** Readiness's room item, present once the account's storage runs short (`roomItem`). */
  room: ReadyItem | null;
  onPlans: () => void;
}) {
  if (!room) return null;
  return (
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
  );
}

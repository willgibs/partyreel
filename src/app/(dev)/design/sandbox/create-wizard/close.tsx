"use client";

import { useSyncExternalStore } from "react";
import { Aperture, Check, Copy, Link2, Printer, Share2 } from "lucide-react";

import { BeatActs } from "@/components/app/create-event-wizard/beat";
import { useCopyLink } from "@/components/app/share/use-copy-link";
import { BRAND_HEX } from "@/lib/constants/site";

import { EVENT_ID, HER_PHOTOS } from "./fixtures";

/**
 * WHAT CREATE'S LAST SCREEN SAYS AND DOES (round five's `close`), three answers to Will's round four note, each ending
 * in her event (the room opens into the hub, `entry.ts`), each on production's beat (her code developing into the real
 * one, lit, "… is live"):
 *
 *  - `enter`: the beat is the whole payoff. The line moves up into the room's own place for words, the sub under the
 *    question, said as an invitation ("Share it, and guests can start adding photos"); Print and Share stay under her
 *    code; the foot is Go to your event, and the head's close goes once the event exists (one way forward).
 *  - `invite`: the beat is her code alone; its foot, Invite guests, opens one screen of the room for the one thing a new
 *    event lacks: the message her guests will get (the share's own words, her link unfurled as a chat draws it), Share,
 *    Copy link and Print, then Go to your event.
 *  - `photos`: Print and Share under her code, and the album's own empty voice under them ("The album starts with
 *    you"); the foot, Add your first photos, sends a few of hers up, each developing as it lands, and the room opens into
 *    her event with them in it. The head's close reads Your event, the way in for a host with no photos yet.
 *
 * ★ EVERY WORD A HOST ALREADY MEETS IS PRODUCTION'S (the question, the rounds, the share's own message, the card's
 * words); the board writes only each answer's new words, here, where a wiring lane finds them.
 */

export type CloseWay = "enter" | "invite" | "photos";

/** The beat's sub, under its question, once the event exists: the line said in the room's one place for words. */
export const BEAT_SUB: Record<CloseWay, string | null> = {
  enter: "Share it, and guests can start adding photos",
  invite: null,
  photos: null,
};

/** The beat's foot, once the event exists. */
export const BEAT_GO: Record<CloseWay, string> = {
  enter: "Go to your event",
  invite: "Invite guests",
  photos: "Add your first photos",
};

/** The invite screen's question and its quiet line. */
export const INVITE_QUESTION = "Invite your guests";
export const INVITE_SUB = "Now, or any time from your event";

/** The foot that takes her in, from the invite screen. */
export const GO_IN = "Go to your event";

/** Her photos going up: the foot's working words. */
export const PHOTOS_WORKING = "Adding your photos";

/** The album's own empty voice (Will's pick for an empty album), said under her code before her photos; a line of the room's, no period. */
const STARTS = "The album starts with you";

export type PhotosPhase = "none" | "going" | "landed";

/**
 * UNDER HER CODE, in the way asked: the rounds and what each answer says there, in the cell production keeps under the
 * code (`cr-beat-below`), so the code never moves between the wait and the arrival.
 */
export function BeatUnder({
  way,
  eventName,
  joinUrl,
  phase,
  up,
}: {
  way: CloseWay;
  eventName: string;
  joinUrl: string;
  phase: PhotosPhase;
  /** How many of her photos have landed while they go up. */
  up: number;
}) {
  if (way === "invite")
    return <span data-cw-under="invite" className="cw-under-invite block" />;
  return (
    <div
      data-cw-under={way}
      className="flex w-full flex-col items-center gap-7 md:gap-9"
    >
      <BeatActs eventId={EVENT_ID} eventName={eventName} joinUrl={joinUrl} />
      {way === "photos" ? (
        phase === "none" ? (
          <p
            data-cw-starts=""
            className="text-center text-working text-muted-foreground"
          >
            {STARTS}
          </p>
        ) : (
          <PhotoTiles up={up} />
        )
      ) : null}
    </div>
  );
}

/**
 * HER PICKS, GOING UP: square tiles in the album's radius, each soft and dim until its bytes are up, then sharp, the
 * beat's own develop now hers. Never an upload list: no names, no percentages.
 */
function PhotoTiles({ up }: { up: number }) {
  return (
    <span
      data-cw-tiles=""
      role="status"
      aria-label={`${up} of ${HER_PHOTOS.length} photos added`}
      className="cw-tiles flex justify-center"
    >
      {HER_PHOTOS.map((p, i) => (
        <span
          key={p.id}
          data-state={i < up ? "up" : "going"}
          className="cw-tile relative block overflow-hidden rounded-[var(--radius-tile)] bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a marketing still standing in for her photo */}
          <img
            src={p.tile}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        </span>
      ))}
    </span>
  );
}

/* ── the invite screen (`invite`) ───────────────────────────────────── */

/** The share's own message (`BeatActs`: "and", never "&", the house style for this line). */
const shareText = (name: string) => `Add your photos and videos to ${name}`;

/**
 * THE MESSAGE HER GUESTS WILL GET, drawn plain in the room's ink (never a messenger's colours): the share's own line,
 * then her link as a chat unfurls it, the event's share card (`/e/[token]/card`: the dark card, the mark, her name large)
 * over the page's own title and the site. A picture, decorative: the words beside the rounds say what each does.
 */
function MessagePicture({ name }: { name: string }) {
  const heading = name.length > 70 ? `${name.slice(0, 69)}…` : name;
  return (
    <span
      role="img"
      aria-label={`The message guests get: ${shareText(name)}, with your link`}
      className="cw-message"
    >
      <span className="cw-bubble cw-bubble-text">{shareText(name)}</span>
      <span className="cw-bubble cw-bubble-link">
        <span className="cw-card">
          <span className="cw-card-brand">
            <span className="cw-card-mark">
              <Aperture style={{ color: BRAND_HEX }} />
            </span>
            Partyreel
          </span>
          <span className="cw-card-name">{heading}</span>
          <span className="cw-card-foot">
            See the photos &amp; videos on Partyreel
          </span>
        </span>
        <span className="cw-unfurl">
          <span className="cw-unfurl-title">{`Add photos to ${name}`}</span>
          <span className="cw-unfurl-site">partyreel.com</span>
        </span>
      </span>
    </span>
  );
}

/** The invite's three ways out, as rounds of the room's own material (`cr-act`, `cr-round`), each confirming in place. */
function InviteActs({ name, joinUrl }: { name: string; joinUrl: string }) {
  const link = useCopyLink(joinUrl);
  const message = useCopyLink(`${shareText(name)} ${joinUrl}`);
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && "share" in navigator,
    () => false,
  );
  async function share() {
    if (canShare) {
      try {
        await navigator.share({ title: name, text: shareText(name), url: joinUrl });
        return;
      } catch {
        // Dismissed, or refused: the message on the clipboard is the same intent.
      }
    }
    void message.copy();
  }
  const act =
    "cr-act group/act flex w-20 flex-col items-center gap-2 rounded-xl text-caption text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:text-foreground";
  const round =
    "cr-round size-14 group-focus-visible/act:ring-3 group-focus-visible/act:ring-ring/50";
  return (
    <div data-cw-invite-acts="" className="flex justify-center gap-6">
      <button type="button" onClick={share} className={act}>
        <span aria-hidden className={round}>
          {message.copied ? (
            <Check className="size-5" />
          ) : canShare ? (
            <Share2 className="size-5" />
          ) : (
            <Copy className="size-5" />
          )}
        </span>
        {message.copied ? "Copied" : canShare ? "Share" : "Copy message"}
      </button>
      <button type="button" onClick={() => void link.copy()} className={act}>
        <span aria-hidden className={round}>
          {link.copied ? <Check className="size-5" /> : <Link2 className="size-5" />}
        </span>
        {link.copied ? "Copied" : "Copy link"}
      </button>
      <a
        href={`/dashboard/${EVENT_ID}/print`}
        target="_blank"
        rel="noopener noreferrer"
        className={act}
      >
        <span aria-hidden className={round}>
          <Printer className="size-5" />
        </span>
        Print
      </a>
      <span aria-live="polite" className="sr-only">
        {link.copied || message.copied ? "Copied" : ""}
      </span>
    </div>
  );
}

/** The invite screen's centre: the message, then the ways out. */
export function InviteScreen({
  name,
  joinUrl,
}: {
  name: string;
  joinUrl: string;
}) {
  return (
    <div
      data-cw-invite=""
      className="cw-invite flex w-full flex-col items-center"
    >
      <MessagePicture name={name} />
      <InviteActs name={name} joinUrl={joinUrl} />
    </div>
  );
}

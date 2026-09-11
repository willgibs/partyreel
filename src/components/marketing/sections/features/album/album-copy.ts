import { planById } from "@/lib/constants/tiers";
import { MAX_EXPORT_ITEMS } from "@/lib/export/build-manifest";
import { INACTIVE_DAYS, WARN_BEFORE_DAYS } from "@/lib/lifecycle/inactivity";
import { OVER_CAP_GRACE_DAYS } from "@/lib/lifecycle/over-cap";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import { UPLOAD_CAP_PRESETS } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

/**
 * THE ALBUM PAGE'S COPY, AS SETS (the finish pass, 2026-09-02).
 *
 * Will's reading rule, made mechanical: "people tend not to read most copy on
 * a site", and a list whose siblings wrap to different row counts reads as
 * unbalanced before anyone reads a word. So every multi-item list on the page
 * is written here as a SET and held in one length band by album-copy.test.ts
 * (the `directoryLine` mechanism from the hub). Numbers derive from the same
 * constants the product enforces, so a band can only drift by a word.
 *
 * Pure on purpose: strings and the constants that fill them, no React, so the
 * test imports this without dragging a component into vitest.
 *
 * Bands, measured at 1440 in Inter `text-sm leading-relaxed`: a media-split
 * column (~433px) holds ~64 characters a row, a three-up column (~300px) ~40,
 * a four-up (~250px) ~34. Two rows is the target for every supporting line.
 */

export type CopyItem = { title: string; body: string };

const FREE_CAP = formatBytes(planById("free").storageBytes);
const PASS_DAYS = planById("event_pass").termDays ?? 365;
const CAP_LOW = UPLOAD_CAP_PRESETS[UPLOAD_CAP_PRESETS.length - 1].label;
const CAP_HIGH = UPLOAD_CAP_PRESETS[1].label;

/** Getting in: the phone's index. Media-split column, two rows each. */
export const GETTING_IN = {
  subhead:
    "Guests point a camera at the code, land on a welcome screen, and start adding. New events ask for an email first.",
  facts: [
    {
      title: "No app, ever",
      body: "The code opens the album in the browser they already have. Point, tap, add. Nothing to install.",
    },
    {
      title: "Names, if you want them",
      body: "Require accounts and guests confirm an email once. Switch it off and anyone with the link can add.",
    },
    {
      title: "One link, forever",
      body: "The code is the album link. Scan it, tap it in a chat, open it later. Pro and Event Pass can name it.",
    },
  ] satisfies CopyItem[],
};

export const EVERYWHERE = {
  body: "One upload, every open album at once: the phones in the room, the laptop by the door, the TV above the bar. No refresh.",
};

/** Your call: the switch's hints and the settings document. */
export const YOUR_CALL = {
  subhead:
    "Guests only ever see approved photos. Whether that means the moment they land, or after you say so, is one switch.",
  hints: {
    live: "Uploads appear the moment they land. Hide any with a tap.",
    review:
      "Every upload waits for you. Guests see: Sent, waiting for host approval",
  },
  settings: [
    {
      title: "Accepting uploads",
      // The settings card's own helper, verbatim (pinned by mock-parity).
      body: "Turn off to freeze the album. Guests can still view it.",
    },
    {
      title: "Max size per upload",
      body: `From ${CAP_LOW} to ${CAP_HIGH} per file. Your own uploads are never capped.`,
    },
    {
      title: "Hidden stays hidden",
      body: "Off every guest's album at once. Dimmed in yours, one tap back.",
    },
  ] satisfies CopyItem[],
};

/** Names: one lead, then the pill's three states as an index. */
export const NAMES = {
  lead: "Open any photo and the name is right there. Guests pick a display name once, with a free account.",
  states: [
    {
      title: "A display name",
      body: "Picked once, it rides on everything they add.",
    },
    {
      title: "Host",
      body: "Your own uploads carry the badge, always.",
    },
    {
      title: "Anonymous",
      body: "One switch allows it. Sign in later to claim yours.",
    },
  ] satisfies CopyItem[],
};

/** Who can open it: the subhead and the two closing facts (the four cell
 *  hints are the app's own, imported in the plate). */
export const WHO_CAN_OPEN = {
  subhead:
    "One setting decides who sees the album. A new event asks guests for an email first.",
  facts: [
    "Password protection comes with Pro and Event Pass.",
    "Album links are never listed by search engines.",
  ],
};

/** Taking it home: three plates, titles parallel, two rows each. */
export const TAKE_HOME = {
  subhead:
    "The album is the share. Save one shot, take the whole thing, and watch the reel.",
  plates: [
    {
      title: "Save one",
      body: "Save hands back the file that was uploaded, at the size it was shot.",
    },
    {
      title: "Take all of it",
      body: `One zip of the originals: everything, photos, or videos. Up to ${MAX_EXPORT_ITEMS.toLocaleString("en-US")} items.`,
    },
    {
      title: "Keep the reel",
      body: "Publish it and it lands in the album. When uploads close, it takes the top.",
    },
  ] satisfies CopyItem[],
};

/** How much fits: the subhead and the two facts beside the refusal. */
export const HOW_MUCH_FITS = {
  subhead:
    "A plan is an amount of album, not a count of photos. Every file draws from one pool.",
  facts: [
    "Delete anything and the room is back at once. Your own uploads count too.",
    "Pick a video on Free and guests see “This event accepts photos only.”",
  ],
};

/** It stays: four steps on the hairline, then three notes on the same grid. */
export const STAYS = {
  subhead:
    "An album is for after, not just the day. Here is how long it stays.",
  steps: [
    { title: "Created", body: "It exists the moment you name the event." },
    { title: "Stays", body: "No end date. Up until you say otherwise." },
    {
      title: "You delete",
      body: `Waits ${RECENTLY_DELETED_WINDOW_DAYS} days in Trash. Restores as it was.`,
    },
    { title: "Gone", body: "After that, the files are deleted for good." },
  ] satisfies CopyItem[],
  notes: [
    {
      title: "Stop paying, keep everything",
      body: `End Pro and the album stays. Over the ${FREE_CAP} Free cap? ${OVER_CAP_GRACE_DAYS} days to trim first.`,
    },
    {
      title: "A pass covers its year",
      body: `${PASS_DAYS} days per pass. Renew, move to Pro, or lapse into the same ${OVER_CAP_GRACE_DAYS}-day window.`,
    },
    {
      title: "Free albums need a visit",
      body: `Idle ${Math.round(INACTIVE_DAYS / 30)} months? An email ${Math.round(WARN_BEFORE_DAYS / 7)} weeks ahead, then ${RECENTLY_DELETED_WINDOW_DAYS} days in Trash to restore.`,
    },
  ] satisfies CopyItem[],
  backup:
    "Every file is copied to a second region within seconds and held for 35 days.",
};

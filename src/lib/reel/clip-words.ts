/**
 * THE CLIP'S OWN WORDS, IN ONE PLACE: the lines the creator and the reel's view say about a clip
 * that depend on who is reading them (a guest or the host, a free event or a paid one, a moderated
 * album or a live one), so each variant is written once and pinned once.
 *
 * The nouns are Will's (reel-cut round 1): the thing a viewer makes is a "clip", the door is "Make
 * your own", the way back into the album is "Add to event". No em-dashes (bible 10).
 *
 * Pure: no DOM, no React.
 */
import { slugify } from "@/lib/slug";
import { formatBytes } from "@/lib/utils";

/** A tap on the greyed Make your own, on a browser that cannot encode (`noencode=greyed`). */
export const NO_ENCODER_WORDS =
  "This browser can't make clips. Open the album on another device to make one.";

/**
 * THE FREE MARK'S LINE, QUIETER BUT FINDABLE (`mark=line`, as Will amended it: free users should
 * want rid of it with a clear way to, never think every clip carries it). A guest cannot upgrade
 * someone else's event, so hers says which events mark and which do not; the host's names the way
 * past it.
 */
export function markWords(isOwner: boolean): { lead: string; tail: string } {
  return isOwner
    ? { lead: "Your free event marks its clips.", tail: "Remove it with Pro" }
    : { lead: "Free events mark their clips.", tail: "Pro events don't" };
}

/**
 * The export's minute, stacked on the clip's own frame (`wait=stack`). `count` is the whole line
 * ("3 of 8 moments left"); `figure` and `unit` are its two halves, for a frame too narrow to hold
 * it on one line.
 */
export function makingWords(input: {
  left: number;
  total: number;
  paused: boolean;
}): { count: string; figure: string; unit: string; line: string } {
  const figure = `${input.left} of ${input.total}`;
  const unit = `${input.total === 1 ? "moment" : "moments"} left`;
  return {
    count: `${figure} ${unit}`,
    figure,
    unit,
    line: input.paused
      ? "Paused while this tab is in the background. Come back to finish."
      : "Drawing your clip on this device. Keep this tab open.",
  };
}

/**
 * ADD TO EVENT, BEHIND A CONFIRM (Will: "so they know what they're doing and don't accidentally
 * click"). The host's clip lands approved and costs her storage; a guest on a moderated album
 * learns the host sees it first; everyone learns the live reel never plays it.
 */
export function addConfirmWords(input: {
  eventName: string;
  isOwner: boolean;
  moderated: boolean;
  bytes: number;
}): { title: string; body: string } {
  const title = `Add your clip to ${input.eventName}?`;
  const reel = "The live reel won't play it.";
  if (input.isOwner) {
    return {
      title,
      body: `It goes into the album approved and uses about ${formatBytes(input.bytes)} of your storage. ${reel}`,
    };
  }
  if (input.moderated) {
    return {
      title,
      body: `The host reviews it before it shows in the album, where everyone can watch and save it. ${reel}`,
    };
  }
  return {
    title,
    body: `It goes into the album, where everyone can watch and save it. ${reel}`,
  };
}

/** The file's name: the event's own slug, so a camera roll full of clips says whose night each is. */
export function clipFilename(eventName: string): string {
  return `${slugify(eventName) || "partyreel"}-clip.mp4`;
}

/** The tray's Length value and its menu words. */
export function lengthWords(length: "auto" | number): {
  value: string;
  item: string;
} {
  if (length === "auto") return { value: "Auto", item: "Auto" };
  const clock = `${Math.floor(length / 60)}:${String(length % 60).padStart(2, "0")}`;
  return { value: clock, item: `${length} seconds` };
}

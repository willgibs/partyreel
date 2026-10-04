import type { Capture } from "@/lib/disposable/facts";
import type { DevelopState } from "@/lib/disposable/reveal";
import { ROLL_SHOTS } from "@/lib/disposable/roll";
import type { Door } from "@/lib/event/door/door";
import { spokenRange } from "@/lib/utils";

/**
 * THE SETTINGS, READ AS SENTENCES (event-settings r1, Will 2026-09-29: `structure=summary`, with his
 * note on the sentences option: "effectively be used as some sort of natural language overview/config
 * of their current settings").
 *
 * Each of the four groups says where it stands in one sentence, and the sentence's key words are the
 * controls themselves: tap "Anyone with the link" to change who gets in, "straight into the album" to
 * hold uploads for review. So the one home for these words hands back PARTS, plain text and the words
 * that are live, and the row renders a live word as a control and the rest as prose; `sentenceText`
 * flattens the same parts wherever a sentence is only read (a label, a test).
 *
 * ★ WHERE THINGS STAND, NEVER WHAT A GROUP IS FOR. Its row's title already says what the group is
 * ("Who can get in"), so the sentence answers it for this album, and only with what is true of the
 * state it was handed: a switch that does nothing right now (A photo first while uploads are paused,
 * the email step under Only me) is not said, since it is not what a guest meets.
 *
 * Pure (no client or server imports), so the rows, the hub and a test read the same words.
 */

/** The four groups, in the order a guest meets them. */
export type SettingsGroup = "door" | "adds" | "reel" | "event";

/** The words a sentence can hand back as live controls. */
export type SentenceWord =
  | "door"
  | "email"
  | "photo"
  | "uploads"
  | "review"
  | "reel"
  | "look"
  | "hold"
  | "profile";

/** One stretch of a sentence: prose, or a word that is a control. */
export type SentencePart = {
  text: string;
  word?: SentenceWord;
  /** The text is a date range as a formatter wrote it, so it is drawn by `RangeText` and spoken with its "to". */
  range?: true;
};

/** What the sentences are made from: the album's settings as a host has them now. */
export type SettingsFacts = {
  door: Door;
  requireVerifiedEmail: boolean;
  requireUploadToView: boolean;
  acceptingUploads: boolean;
  /** Uploads wait for the host before they appear (`moderation_mode = hold_for_approval`). */
  review: boolean;
  /** A guest may add a video: the plan takes video and the host's Videos switch is on. */
  videos: boolean;
  showReel: boolean;
  /** The look every guest starts on, by its name. */
  lookLabel: string;
  holdSec: number;
  name: string;
  /** The date as the hub writes it, or null when none is set. */
  dateLabel: string | null;
  /** Listed on the host's public profile, or null where the profile's key is not read. */
  onProfile: boolean | null;
  /**
   * How guests add and where a develop stands (20261002200000): free uploads or the album's camera (its roll's size),
   * and none, waiting or developed. Optional, so facts built anywhere but Settings' state (a Library stand-in, a test)
   * read as free uploads with no develop, which every event was.
   */
  develop?: {
    capture: Capture;
    rollSize: number | null;
    state: DevelopState["kind"];
  };
};

/** The group titles, which the sentence under each one answers. */
export const SETTINGS_GROUP_TITLES: Record<SettingsGroup, string> = {
  door: "Who can get in",
  adds: "What guests can add",
  reel: "Highlight reel",
  event: "This event",
};

/** Who comes in at each door, as the sentence's first (live) words. */
export const DOOR_WHO: Record<Door, string> = {
  open: "Anyone with the link",
  password: "Anyone with the password",
  approve: "People you let in",
  invite: "People you invite",
  closed: "Only people already in",
  private: "Only you",
};

export const secondsLabel = (s: number) =>
  `${s} ${s === 1 ? "second" : "seconds"}`;

const word = (text: string, w: SentenceWord): SentencePart => ({
  text,
  word: w,
});
const prose = (text: string): SentencePart => ({ text });
/** A date as the hub writes it, which may be a range: its own part, so a dash in an event's NAME is never read as one. */
const date = (text: string): SentencePart => ({ text, range: true });

/**
 * WHO GETS IN, AND WHAT THEY DO FIRST. ★ AN ADDRESS GATE HOLDS THE EMAIL STEP ON (letting each person
 * in and the invite list both match a confirmed address), so there it is said as prose, never as a
 * control a host could turn off.
 */
function doorSentence(f: SettingsFacts): SentencePart[] {
  const who = word(DOOR_WHO[f.door], "door");
  if (f.door === "private") {
    return [who, prose(". Guests meet a closed album.")];
  }
  if (f.door === "closed") {
    return [who, prose(". Nobody new can join.")];
  }
  if (f.door === "invite") {
    return [
      who,
      prose(", after confirming an email; anyone else can ask you."),
    ];
  }
  const identity =
    f.door === "approve"
      ? prose("confirming an email")
      : word(
          f.requireVerifiedEmail ? "confirming an email" : "typing a name",
          "email",
        );
  // A photo first does nothing while uploads are paused (nobody can add one), so it is not said.
  const photo = f.requireUploadToView && f.acceptingUploads;
  return photo
    ? [
        who,
        prose(", after "),
        identity,
        prose(" and "),
        word("adding a photo", "photo"),
        prose("."),
      ]
    : [who, prose(", after "), identity, prose(".")];
}

function addsSentence(f: SettingsFacts): SentencePart[] {
  if (!f.acceptingUploads) {
    return [word("Paused", "uploads"), prose(". Guests can still look.")];
  }
  const what = word(f.videos ? "Photos and videos" : "Photos", "uploads");
  // ★ THE CAMERA says its roll after what guests add; the three-way "when everyone sees" follows. The review word
  // stays a live word only where it says the whole answer: with a develop time set, the page owns the answer (its
  // time is no word a sentence can pick), so it is said as prose.
  const camera = f.develop?.capture === "camera";
  const lead: SentencePart[] = camera
    ? [
        what,
        prose(
          ` on the album's camera, ${f.develop?.rollSize ?? ROLL_SHOTS} shots each, `,
        ),
      ]
    : [what, prose(", ")];
  const state = f.develop?.state ?? "none";
  if (state === "waiting") {
    return [
      ...lead,
      prose(
        f.review
          ? "held for your approval and hidden until the album develops."
          : "hidden until the album develops.",
      ),
    ];
  }
  if (state === "developed") {
    return [
      ...lead,
      prose(
        f.review
          ? "developed; new ones wait for your approval."
          : "developed; new ones show straight away.",
      ),
    ];
  }
  return [
    ...lead,
    word(
      f.review ? "held until you approve them" : "straight into the album",
      "review",
    ),
    prose("."),
  ];
}

function reelSentence(f: SettingsFacts): SentencePart[] {
  if (!f.showReel) {
    return [word("Off", "reel"), prose(". Guests see only the album.")];
  }
  return [
    word("On", "reel"),
    prose(", in "),
    word(f.lookLabel, "look"),
    prose(", "),
    word(secondsLabel(f.holdSec), "hold"),
    prose(" a photo."),
  ];
}

function eventSentence(f: SettingsFacts): SentencePart[] {
  const named = f.dateLabel
    ? [prose(`${f.name}, `), date(f.dateLabel), prose(".")]
    : [prose(`${f.name}.`)];
  if (f.onProfile === null) return named;
  return [
    ...named,
    prose(" "),
    word(f.onProfile ? "On your profile" : "Not on your profile", "profile"),
    prose("."),
  ];
}

/** The one sentence a group says about itself, as its parts. */
export function settingsSentence(
  group: SettingsGroup,
  facts: SettingsFacts,
): SentencePart[] {
  switch (group) {
    case "door":
      return doorSentence(facts);
    case "adds":
      return addsSentence(facts);
    case "reel":
      return reelSentence(facts);
    case "event":
      return eventSentence(facts);
  }
}

/** A sentence's parts, read as one string. */
export function sentenceText(parts: readonly SentencePart[]): string {
  // A label is read aloud, so a range in it is said with its "to" (`spokenRange`).
  return parts.map((p) => (p.range ? spokenRange(p.text) : p.text)).join("");
}

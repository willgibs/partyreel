import { DEFAULT_HOLD_SEC } from "@/lib/reel/defaults";
import {
  DEFAULT_THEME_ID,
  THEME_LABELS,
  type ThemeId,
} from "@/lib/reel/engine/themes";

import { EVENT } from "./fixtures";

/**
 * ONE EVENT'S SETTINGS, AND HOW A FRAME IS ASKED TO DRAW THEM.
 *
 * ★ EVERY STRUCTURE DRAWS FROM THIS ONE MODEL, and every ask only varies it.
 * The structure question and the seven staged behind it all draw the same
 * wedding: a join question is the access group of whichever structure he
 * picked with one field changed, an idle setting is the same group with the
 * reel off. So nothing a staged ask draws can drift from the structure it is
 * asked in, which is the whole point of staging it (the step hands the picked
 * answer in, `exploration.ts`'s `Preview`).
 *
 * Pure on purpose (no React), so the sentences a summary row says are one
 * function a Vitest-free reader can check by eye, and the settings' words
 * live in one place per rung.
 */

/** The six rungs of who can get in, open to closed (the `join` ask's ladder). */
export type Rung =
  | "anyone"
  | "password"
  | "list"
  | "approve"
  | "closed"
  | "private";

export type Structure =
  | "today"
  | "groups"
  | "summary"
  | "sentences"
  | "presets";
export type JoinForm = "ladder" | "two" | "steps";
export type IdleForm = "hidden" | "greyed" | "live";
export type LockForm = "chip" | "switch" | "line";
export type OpensForm = "page" | "inplace";
export type InsideForm = "sentence" | "count";
export type EditorForm = "one" | "paste" | "both";

/** The four groups every new structure holds, in the order a guest meets them. */
export type Group = "access" | "adds" | "reel" | "event";

export type Model = {
  plan: "free" | "pro";
  /* the event's own state */
  rung: Rung;
  /** Require verified emails. */
  email: boolean;
  /** Require an upload to view. */
  photoFirst: boolean;
  /** Accepting uploads. */
  uploads: boolean;
  /** Review uploads before they appear. */
  review: boolean;
  /** Show the reel. */
  reel: boolean;
  look: ThemeId;
  hold: number;
  /** Show on my profile. */
  profile: boolean;
  /* how the drawing is asked to look */
  structure: Structure;
  /**
   * The `join` ask's form, or `none`: today's three-way Who can see alone, which
   * is what every structure holds on the structure question, so the structures
   * are compared holding the same settings and the join modes are judged on
   * their own step, in the structure he picks.
   */
  join: JoinForm | "none";
  idle: IdleForm;
  lock: LockForm;
  opens: OpensForm;
  inside: InsideForm;
  editor: EditorForm;
  /** The group a frame is about: scrolled to, opened, or its page. */
  focus?: Group;
  /** The sentences structure's chooser, open over the phrase that asked. */
  chooser?: "uploads";
  /**
   * THE ONE THING A FRAME'S CAPTION MEASURES (`data-set-reach`, `scene.tsx`'s
   * `reach`): the choice of who gets in, what the chosen rung adds under it
   * (the list, the count), the pause, the lock, today's Save.
   */
  mark?: Mark;
  /** Today's cards exactly as they ship, with no join modes (the structure ask's reference). */
  asBuilt?: boolean;
  /** Today's form holds an unsaved change, so its Save is lit. */
  dirty?: boolean;
};

export type Mark = "choice" | "extra" | "uploads" | "lock" | "save";

/**
 * MAYA'S WEDDING AS IT STANDS, and every drawing's recommended forms: the
 * state is production's defaults for an event made in the wizard (public,
 * verified emails on, a photo first off, uploads open and live, the reel on in
 * the default mood and hold, not on her profile).
 */
export const BASE: Model = {
  plan: "free",
  rung: "anyone",
  email: true,
  photoFirst: false,
  uploads: true,
  review: false,
  reel: true,
  look: DEFAULT_THEME_ID,
  hold: DEFAULT_HOLD_SEC,
  profile: false,
  structure: "summary",
  join: "ladder",
  idle: "hidden",
  lock: "line",
  opens: "page",
  inside: "sentence",
  editor: "both",
};

/* ── the words ────────────────────────────────────────────────────────────── */

export const GROUP_TITLE: Record<Group, string> = {
  access: "Who can get in",
  adds: "What guests can add",
  reel: "Highlight reel",
  event: "This event",
};

/** Each rung's name and the one line that says what a guest meets. */
export const RUNGS: readonly { id: Rung; label: string; line: string }[] = [
  {
    id: "anyone",
    label: "Anyone with the link",
    line: "Anyone with the link or the code comes in.",
  },
  {
    id: "password",
    label: "Anyone with the password",
    line: "The link, then the password you share with them.",
  },
  {
    id: "list",
    label: "People on your list",
    line: "Listed addresses come straight in. Anyone else can ask you.",
  },
  {
    id: "approve",
    label: "People you let in",
    line: "Newcomers confirm an email, then wait for you.",
  },
  {
    id: "closed",
    label: "Only people already in",
    line: "Everyone in keeps going. Nobody new can join.",
  },
  {
    id: "private",
    label: "Only you",
    line: "Guests meet a closed album until you open it.",
  },
];

export const rungOf = (id: Rung) => RUNGS.find((r) => r.id === id)!;

/** A list and letting people in both work on a proved address. */
export const emailHeld = (m: Model): string | null =>
  m.rung === "list"
    ? "On while your list is the way in."
    : m.rung === "approve"
      ? "On while you let people in."
      : null;

/** Whether the door's two steps do anything at all (only you: nobody reaches them). */
export const doorOpen = (m: Model) => m.rung !== "private";

/** Whether A photo first does anything: nobody can add one while uploads are paused. */
export const photoFirstLive = (m: Model) => doorOpen(m) && m.uploads;

export const lookLabel = (m: Model) => THEME_LABELS[m.look];

export const seconds = (s: number) => `${s} ${s === 1 ? "second" : "seconds"}`;

/**
 * THE ONE SENTENCE EACH GROUP SAYS ABOUT ITSELF (the summary's rows, the
 * presets' kinds): where things stand, never what the group is for. Placeholder
 * words, judged for their size and wrapping (PROGRAM: placeholder copy), but
 * each is true of the state it is handed.
 */
export function groupSentence(g: Group, m: Model): string {
  switch (g) {
    case "access": {
      if (m.rung === "private") return "Only you. Guests meet a closed album.";
      if (m.rung === "closed")
        return "Only people already in. Nobody new can join.";
      const who = rungOf(m.rung).label;
      if (m.rung === "list") return `${who}; anyone else can ask you.`;
      if (m.rung === "approve") return `${who}, after confirming an email.`;
      const how = m.email ? "confirming an email" : "typing a name";
      return photoFirstLive(m) && m.photoFirst
        ? `${who}, after ${how} and adding a photo.`
        : `${who}, after ${how}.`;
    }
    case "adds": {
      if (!m.uploads) return "Paused. Guests can still look.";
      const what = m.plan === "pro" ? "Photos and videos" : "Photos";
      return m.review
        ? `${what}, held until you approve them.`
        : `${what}, straight into the album.`;
    }
    case "reel":
      return m.reel
        ? `On, in ${lookLabel(m)}, ${seconds(m.hold)} a photo.`
        : "Off. Guests see only the album.";
    case "event":
      return `${EVENT.name}, ${EVENT.date}. ${m.profile ? "On" : "Not on"} your profile.`;
  }
}

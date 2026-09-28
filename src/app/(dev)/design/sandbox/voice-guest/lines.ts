import { keepCopy, keepSentLine } from "@/components/guest/save-account-prompt";
import { TRACKER_WORDS } from "@/lib/guest/upload-tracker";

/**
 * THE CANDIDATE WORDS, AND NOTHING ELSE (the retired `voice` board's own
 * shape: the words in one pure module, so the preview that sets a line, the
 * reader that measures it and the Handoff that quotes it read one string).
 *
 * ★ TODAY IS READ OUT OF PRODUCTION, NEVER RETYPED. The tracker's words
 * (`TRACKER_WORDS`), the keep's ask (`keepCopy`) and its Sent line
 * (`keepSentLine`) are imported from the files that ship them, so an option
 * that says "as shipped" is the shipped string to the letter, and a change in
 * production shows here before a reviewer is shown a stale "today".
 *
 * ★ EVERY LINE CLEARS THE FENCES BEFORE IT IS A CANDIDATE: no em-dash, never
 * "no account", never "anonymous", the album is the noun, "in your account"
 * and never "on your profile", no promise of what the host will decide, and
 * nothing cute at a moment that tells a guest something went against her (his
 * `failed=exact` note: "we don't want to obscure the problem behind cute
 * copy").
 *
 * Round one's five picks left the asks and hold as he took them; nothing on
 * these screens carries one of their lines, so none is re-typed here.
 */

/* ── 1. held: where a held photograph shows to the guest who sent it ─────────── */

export type HeldPlace = "tiles" | "uploads" | "line" | "toast";

/**
 * The words the two new places say, in TODAY's status words (`status` asks
 * those; every decision holds the others as shipped). The line at the album's
 * head counts hers and names where its tap goes; the toast is the keep's own
 * Sent sentence for a held event, so one moment has one sentence wherever a
 * guest meets it.
 */
export const HELD_LINE = (n: number) => `${n} of yours waiting for the host`;
export const HELD_TOAST = (n: number) => keepSentLine({ count: n, held: true });
/** Both open her uploads, and say so in the list's own title. */
export const UPLOADS_TITLE = "Your uploads";

/* ── 2. status: what her uploads call a waiting and a left-out photograph ─────── */

export type StatusWords = "today" | "host" | "approval" | "apart";

export type StatusLines = {
  /** A photograph the host is still deciding on. */
  waiting: string;
  /** One the host left out, on its own row; null where the row says nothing. */
  refused: string | null;
  /** `apart`: the left-out ones gather in a section of their own at the foot. */
  section?: { heading: string; why: (n: number) => string };
};

/** "In the album" in every option: the one status nobody asked about. */
export const IN_THE_ALBUM = TRACKER_WORDS.approved;

export const STATUS: Record<StatusWords, StatusLines> = {
  today: {
    waiting: TRACKER_WORDS.waiting,
    refused: TRACKER_WORDS.refused,
  },
  // Plain and warm: the waiting line keeps its one name on the page, and the
  // left-out one says who decided, in the words a friend would use.
  host: {
    waiting: TRACKER_WORDS.waiting,
    refused: "The host didn’t add this one",
  },
  // Quiet and exact: both lines name the review she read about at upload
  // ("The host reviews uploads before they appear in the album.").
  approval: {
    waiting: "Waiting for approval",
    refused: "Not approved",
  },
  // Handled differently in the list: the rows keep today's words, and a
  // left-out photograph leaves them for a section at the foot with one
  // sentence of why, said once rather than squeezed into a row's label. The
  // list's own line already says the host reviews every upload, so the why
  // says only what she cannot infer: whose choice it was, and who sees it.
  apart: {
    waiting: TRACKER_WORDS.waiting,
    refused: null,
    section: {
      heading: "Not added to the album",
      why: (n) =>
        n === 1
          ? "The host chose not to add this one. Other guests don’t see it."
          : "The host chose not to add these. Other guests don’t see them.",
    },
  },
};

/* ── 3. keep: the ask on the door's last screen ────────────────────────────── */

/**
 * ROUND ONE'S FIVE REGISTERS, KEPT AS HE READ THEM: `today` the shipped
 * string, `warm` plain and warm, `bright` bright and playful, `exact` quiet and
 * exact, `tender` soft and tender. The keys ARE the option ids.
 */
export type Register = "today" | "warm" | "bright" | "exact" | "tender";

/**
 * The ask's title and line (`save-account-prompt.tsx`, `KeepOffer`, which
 * reads `keepCopy`), redrawn on the door's last screen under "Sent" and where
 * her photos went. Round one's words, carried unchanged from the card they
 * were first drawn on: he asked whether the question was a repeat, not for new
 * words. Every one is true only after an upload, which is the only moment this
 * screen exists; the account door's shared keep wear, which opens before one,
 * is the carried call `keep-confirm`.
 */
export const KEEP_ASK: Record<
  Register,
  { title: (n: number) => string; reason: (n: number, event: string) => string }
> = {
  today: {
    title: (n) => keepCopy(n).title,
    reason: (n) => keepCopy(n).reason,
  },
  warm: {
    title: () => "Keep this event",
    reason: (n, event) =>
      `Confirm your email and ${event} stays in your account with your ${n} photos, to come back to anytime.`,
  },
  bright: {
    title: () => "Take it with you",
    reason: (n, event) =>
      `Confirm your email and ${event} goes where you go, with your ${n} photos and the whole album.`,
  },
  exact: {
    title: (n) => `Keep your ${n} photos`,
    reason: () =>
      "Confirm your email to keep this event and your photos in your account.",
  },
  tender: {
    title: () => "Hold onto today",
    reason: (n, event) =>
      `Confirm your email and today stays with you: ${event}, your ${n} photos, kept safe in your account.`,
  },
};

/** What went, above the ask: the shipped Sent line, on the open wedding. */
export const KEEP_SENT = (n: number, host: string) =>
  keepSentLine({ count: n, held: false, hostName: host });

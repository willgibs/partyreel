/**
 * THE ALBUM'S STYLE: ONE PICK OF A NAMED ALBUM OVER THE EVENT'S TWO ANSWERS (the-wait r1, Will's desk on build 45:
 * "the option 2 album styles settings design seems far superior - cleaner design/presentation, difference feels more
 * clear"). How guests add is `events.capture`; when everyone sees is `moderation_mode` with `develops_at` (`reveal.ts`).
 * A style is words and a picture over those columns, never a column of its own:
 *  - Live: free uploads, each shown the moment it's added;
 *  - Review: free uploads, each held until the host lets it in (the name is where those photos go: her Review room);
 *  - Disposable: the album's camera with a develop time (the preset's name, Will's `name=disposable`).
 * A mix outside the three (the camera showing live or under approval, free uploads with a develop time) is no style:
 * Settings shows it under Customize, where the two answers stand apart.
 *
 * ★ A STYLE IS ONE SAVE OF ALL THREE COLUMNS (`patchForStyle`), so no half-state is ever stored, and what a switch
 * shows or releases is said before it saves (`styleSwitchConsequence`); nothing else asks.
 *
 * ★ APPROVAL NEVER STANDS WITH A DEVELOP (Will's `both=never`: hosts "enable approval as a safety measure but forget to
 * approve everything prior to the disposables developing ... approval can remain on live, where it serves a real
 * benefit to moderation"). The database refuses the pair (`events_approval_never_develops`, 20261003100000); the
 * host's write says it in words first (`approvalWithADevelop`). A host checks a disposable by lifting her cover
 * before it develops, and moves the develop time if she needs longer.
 *
 * ★ THE NAMES ARE THE CAMERA'S VOICE, ONE WORD EACH (Will's pick on create-wizard r3, "should we go with a more simple
 * 'Review'?"): Live, Review and Disposable stand as three modes of one album, wherever a style is named (Create's add
 * step, Settings' cards, the help). `lib/admin/reports.ts`' "Reviewed" is a report's status, never this.
 *
 * Create reads these words and `patchForStyle`'s columns too (create-wizard r3's add=styles): a new event is born with
 * a style's three columns in one insert (`createFieldsOf`), so what Create shows and what Settings shows can never differ.
 *
 * Pure and isomorphic, like its neighbours.
 */
import type { Capture } from "@/lib/disposable/facts";
import { defaultDevelopAt, developState } from "@/lib/disposable/reveal";
import { ROLL_SHOTS } from "@/lib/disposable/roll";

export const ALBUM_STYLES = ["live", "approval", "disposable"] as const;
export type AlbumStyle = (typeof ALBUM_STYLES)[number];

/** The preset's name, wherever a host picks it or a guest meets it (Will's `name=disposable`). */
export const PRESET_NAME = "Disposable";

export const STYLE_NAMES: Record<AlbumStyle, string> = {
  live: "Live",
  approval: "Review",
  disposable: PRESET_NAME,
};

/** A style's one line, the roll's own size on the disposable's. */
export function styleLine(
  style: AlbumStyle,
  input: { rollSize: number | null },
): string {
  if (style === "live") return "Every photo shows the moment it's added.";
  if (style === "approval")
    return "You let each photo in before anyone sees it.";
  return `The album's camera, ${input.rollSize ?? ROLL_SHOTS} shots each. Everyone's develop at once.`;
}

/** The columns a style is drawn over, as Settings holds them. */
export type StyleColumns = {
  capture: Capture;
  /** Uploads wait for the host (`moderation_mode = hold_for_approval`). */
  review: boolean;
  /** The develop time, ISO, or null for none. A time reached has developed. */
  developsAt: string | null;
};

/** Which style the columns say, or null for a mix outside the three. A disposable that developed is still one. */
export function styleOf(v: StyleColumns): AlbumStyle | null {
  if (v.capture === "upload" && v.developsAt === null) {
    return v.review ? "approval" : "live";
  }
  if (v.capture === "camera" && v.developsAt !== null && !v.review) {
    return "disposable";
  }
  return null;
}

/**
 * The one save a style's press writes: all three columns. A disposable keeps a develop time still ahead, else offers
 * 9 am the day after the party in the party's own zone (`defaultDevelopAt`, `zone`: the event's, or the one Create will
 * carry), the browser's only where no zone can be named, and never approval.
 */
export function patchForStyle(
  style: AlbumStyle,
  current: StyleColumns,
  opts: {
    eventDate: string | null;
    eventEndDate?: string | null;
    nowMs?: number;
    /** The party's zone (`hostPartyZone`), or null/absent where none can be named. */
    zone?: string | null;
  },
): StyleColumns {
  if (style === "live")
    return { capture: "upload", review: false, developsAt: null };
  if (style === "approval")
    return { capture: "upload", review: true, developsAt: null };
  const nowMs = opts.nowMs ?? Date.now();
  const ahead = developState(current.developsAt, nowMs).kind === "waiting";
  return {
    capture: "camera",
    review: false,
    developsAt: ahead
      ? current.developsAt
      : defaultDevelopAt({
          eventDate: opts.eventDate,
          eventEndDate: opts.eventEndDate,
          now: new Date(nowMs),
          zone: opts.zone,
        }).toISOString(),
  };
}

/**
 * A STYLE'S COLUMNS IN THE NAMES THE CREATE CARRIES (`createEventSchema`): the one write a new event is born with, so a
 * style is never a half-state at birth either. `capture`, `roll_size` and `develops_at` are the foundation's
 * INSERT-granted columns (20261002200000); `moderation_mode` is the event's own answer, `hold_for_approval` where the
 * host reviews. ★ THE ROLL RIDES ONLY WITH THE CAMERA (customize r1's `roll=both`): a Disposable is born with the roll
 * she picked under it, and a Live or Review album with none, so what Create showed is what is born (her pick is kept
 * inside Create across a switch of style, `useAddChoice`; an album born without one meets 24 when its camera starts).
 */
export function createFieldsOf(
  v: StyleColumns,
  rollSize: number | null = null,
): {
  capture: Capture;
  moderation_mode: "live" | "hold_for_approval";
  roll_size: number | null;
  develops_at: string | null;
} {
  return {
    capture: v.capture,
    moderation_mode: v.review ? "hold_for_approval" : "live",
    roll_size: v.capture === "camera" ? rollSize : null,
    develops_at: v.developsAt,
  };
}

/**
 * WHAT A SWITCH SHOWS OR RELEASES, said before it saves (the door's `ConsequenceLine`):
 *  - leaving a develop still ahead puts every photo added so far in front of every guest;
 *  - leaving approval with photos held approves them: shown now, or (★ settled with Will the night of build 45) into
 *    a develop time they join the roll, approved and sealed, developing with everyone's and removable before it.
 * Null where nothing waits and nothing is held: nothing else asks.
 */
export type StyleConsequence =
  | { kind: "show-waiting" }
  | { kind: "approve-held"; count: number }
  | { kind: "join-roll"; count: number };

export function styleSwitchConsequence(input: {
  from: StyleColumns;
  to: StyleColumns;
  heldCount: number;
  nowMs?: number;
}): StyleConsequence | null {
  const nowMs = input.nowMs ?? Date.now();
  const waiting = developState(input.from.developsAt, nowMs).kind === "waiting";
  const toAhead = developState(input.to.developsAt, nowMs).kind === "waiting";
  if (waiting && !toAhead) return { kind: "show-waiting" };
  if (input.from.review && !input.to.review && input.heldCount > 0) {
    return toAhead
      ? { kind: "join-roll", count: input.heldCount }
      : { kind: "approve-held", count: input.heldCount };
  }
  return null;
}

/** The host's write refuses approval with a develop time, in these words, whichever way it is asked for. */
export const APPROVAL_NEVER_WITH_A_DEVELOP =
  "An album with a develop time can't also wait for your approval. Before it develops, look under its cover on your event page to take anything out, or move the develop time.";

/** Whether one patch asks for both at once (approval, and a develop time). A row's own columns are the database's. */
export function approvalWithADevelop(patch: {
  moderation_mode?: string;
  develops_at?: string | null;
}): boolean {
  return (
    patch.moderation_mode === "hold_for_approval" &&
    typeof patch.develops_at === "string"
  );
}

/** The CHECK that refuses the pair (20261003100000), by name: the write reads its refusal by it. */
export const APPROVAL_NEVER_WITH_A_DEVELOP_CHECK =
  "events_approval_never_develops";

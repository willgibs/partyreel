import {
  gateOf,
  stepOf,
  type Door,
  type DoorStep,
  type PrivateGate,
} from "@/lib/event/door/door";
import { peopleWaiting } from "@/lib/event/door/words";

/**
 * THE DOOR'S WORDS, SINGLE-SOURCED: the settings, the hub, the Library and marketing's plates all read
 * this one module, and nothing re-types a door word next to the data. Server-safe on purpose (no "use
 * client"), so an RSC dots into it as readily as the door page.
 *
 * ★ "Open" is never a door word: it is the ACCEPTING-UPLOADS state (`uploadsLabel`, the event card's Open and
 * Paused). The two were written separately once, and the settings said Public while the event header said
 * Open for the same row ("Public sounds much clearer than open"). The data's `open` reads Public.
 */

/* ── the door, in steps (event-settings r1, Will 2026-09-29, `join=steps`) ─────────────────────── */

/**
 * STEP ONE'S THREE ANSWERS: what the link opens. His words: "'public' (anyone type acceptance),
 * 'private' (password, approval, invites, etc), and 'me' (host only, reframes private as gated)".
 *
 * ★ THESE ARE THE HOST'S WORDS, AND THEY NEVER COLLIDE WITH A VISITOR'S. A public profile labels a
 * hosted card "Private" or "Password" and counts "2 private events" (`u/[slug]`), both from where a
 * VISITOR stands: every album she cannot simply walk into is private to her, Only me and a gate alike.
 * The host's Private is that same album seen from inside, a gate she keeps; so the settings never call
 * Only me "Private", and the profile never says "Only me" (the "me" is the host).
 */
export const DOOR_STEP_LABELS: Record<DoorStep, string> = {
  public: "Public",
  private: "Private",
  only_me: "Only me",
};

/** What a guest meets at each of step one's answers, in one line. */
export const DOOR_STEP_LINES: Record<DoorStep, string> = {
  public: "Anyone with the link or the code comes in.",
  private: "Guests meet the gate you pick before the album.",
  only_me: "Only you can open it. Guests meet a closed album.",
};

/** The gates a Private album keeps, in the order the door page lists them. */
export const GATE_LABELS: Record<PrivateGate, string> = {
  password: "A password",
  approve: "You let each person in",
  invite: "Your invite list",
  closed: "Only people already in",
};

/** What a guest meets at each gate, in one line (his "each gate should have a clear tooltip"). */
export const GATE_LINES: Record<PrivateGate, string> = {
  password: "The link, then the password you share with them.",
  approve: "Newcomers confirm an email, then wait for you to let them in.",
  invite: "Addresses you invite come straight in. Anyone else can ask you.",
  closed: "Everyone already in keeps adding. Nobody new can join.",
};

/**
 * THE (i) BESIDE EACH GATE: what it is FOR, so a host "never has to guess here" (his `join` note), one
 * tap away rather than an article link per row. The help center's own article says the rest.
 */
export const GATE_HELP: Record<PrivateGate, string> = {
  password:
    "For an album you share by word of mouth: the link alone is not enough, and a guest types the password you gave them once on each phone.",
  approve:
    "For a party where strangers might find the link: each newcomer confirms an email and waits at the door, and you let them in from Guests, or decline, which blocks them.",
  invite:
    "For a guest list you already have: the addresses you invite come straight in once they confirm their email, and anyone else can ask you to let them in.",
  closed:
    "For after the party, or when enough people are in: everyone already inside keeps adding, and nobody new can join until you open it again.",
};

/** A gate in a word or two, after "Private ·". */
const DOOR_GATE_SHORT: Record<PrivateGate, string> = {
  password: "Password",
  approve: "You let in",
  invite: "Invites",
  closed: "Closed",
};

/**
 * THE DOOR IN ONE LINE, for the hub's Settings card and anywhere else a door is named in passing:
 * one function words the door everywhere (the brief's "through one function that words the door
 * everywhere"). Short on purpose: the card's value line is a phone's half width.
 */
export function doorLabel(door: Door): string {
  const step = stepOf(door);
  const gate = gateOf(door);
  if (step !== "private" || !gate) return DOOR_STEP_LABELS[step];
  return `${DOOR_STEP_LABELS.private} · ${DOOR_GATE_SHORT[gate]}`;
}

/* ── whether guests can add, beside the door ────────────────────────────────────────────────────── */

/**
 * WHETHER GUESTS CAN ADD, IN ONE WORD: the dashboard card's (crumbs-42, from `event-ready`). Open while
 * they can; Paused while the host has paused uploads, the word Settings' own sentence says ("Paused.
 * Guests can still look."). ★ Never "Closed": that is the door's word for Only people already in
 * ("Private · Closed", above), and the card that said it for paused uploads told a host her door had shut.
 */
export function uploadsLabel(acceptingUploads: boolean): "Open" | "Paused" {
  return acceptingUploads ? "Open" : "Paused";
}

/* ── the code as the door (event-ready, `door=mark`, Will 2026-10-02) ─────────────────────────────── */

/** The glyph on the code's corner: a closed eye for Only me, a pause for paused uploads, a lock for a gate. */
export type CodeMarkGlyph = "only-me" | "paused" | "gate";

export type CodeMark = {
  glyph: CodeMarkGlyph;
  /** People waiting at a gate for the host, drawn beside the glyph in the needs-action tone; 0 for none. */
  waiting: number;
  /** What the mark means, whole: its tooltip, its tap and its accessible name. */
  words: string;
};

/**
 * WHAT THE HUB'S CODE WEARS ON ITS CORNER, or null for a Public album taking uploads, which needs no mark.
 * His note: "the mark keeps the header from getting too crowded with text where icons will likely work 99%
 * of the time, and we could add tooltips to clarify on the mark". So the glyph is the glance and these words
 * are the clarification, said in the door's own words from this one home.
 *
 * ★ ONE GLYPH, THE STRONGEST: Only me (no guest gets in at all) over paused uploads (guests get in and
 * cannot add) over a gate (guests get in past it). The words say all of what holds, so a paused Private
 * album still names its gate. The waiting count is a gate's alone: Public lets everyone waiting in, and
 * nobody waits at Only me.
 */
export function codeMark(input: {
  door: Door;
  acceptingUploads: boolean;
  waiting: number;
}): CodeMark | null {
  if (stepOf(input.door) === "only_me") {
    return { glyph: "only-me", waiting: 0, words: DOOR_STEP_LINES.only_me };
  }
  const gate = gateOf(input.door);
  const paused = !input.acceptingUploads;
  if (!gate && !paused) return null;
  const waiting = gate && input.waiting > 0 ? input.waiting : 0;
  const words = [
    paused ? "Uploads paused. Guests can still look." : null,
    gate
      ? `${DOOR_STEP_LABELS.private}: ${GATE_LABELS[gate].toLowerCase()}.`
      : null,
    waiting > 0 ? `${peopleWaiting(waiting)} at the door.` : null,
  ]
    .filter(Boolean)
    .join(" ");
  return { glyph: paused ? "paused" : "gate", waiting, words };
}

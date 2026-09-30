/**
 * THE PER-EVENT BLOCK, THE PURE HALF (event-safety r1, Will 2026-09-28): who a Block names, and every
 * sentence the host reads about one. Node-safe and client-safe, so the confirm, the Blocked list and
 * their tests share one set of words; the reads and writes are `db/queries/event-blocks.ts` and
 * `db/mutations/event-blocks.ts`, the rule itself is the migration's (20260928120000).
 *
 * ★ A BLOCK NAMES A PERSON THE WAY THE SURFACE THAT PRESSED IT KNOWS THEM, and the database decides who
 * that is (the guest list's own rule, `lib/events/event-guests.ts`): the Guests room knows a confirmed
 * guest by their account and a typed name by its guest row; the viewer's credit and Review's peek know
 * a photograph. None of them ever holds a person's address or a device, and none needs to.
 *
 * ★ THE HOST'S WORDS SAY WHAT HAPPENS, the person's never do: the host is told their uploads move to
 * Deleted and that the blocked person meets a private album; the blocked person is never told
 * anything (the door is the private album's, word for word, `closed-door.server.ts`).
 */
import { z } from "zod";

import type { Door } from "@/lib/event/door/door";

/** Who a host is blocking, as the surface that pressed Block knows them. */
export type BlockTarget =
  /** A confirmed guest in the Guests room: their account, at this event. */
  | { kind: "account"; eventId: string; userId: string }
  /** A typed name in the Guests room: its guest row (which names its own event). */
  | { kind: "row"; guestId: string }
  /** A photograph in the viewer or Review: whoever sent it (it names its own event). */
  | { kind: "media"; mediaId: string };

/** The Server Functions' boundary: a target is a raw client value until this parses it. */
export const blockTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("account"), eventId: z.uuid(), userId: z.uuid() }),
  z.object({ kind: z.literal("row"), guestId: z.uuid() }),
  z.object({ kind: z.literal("media"), mediaId: z.uuid() }),
]);

/** block_from_event's named parameters for one target (exactly one person, one way). */
export function blockTargetParams(target: BlockTarget): {
  p_event_id?: string;
  p_user_id?: string;
  p_guest_id?: string;
  p_media_id?: string;
} {
  switch (target.kind) {
    case "account":
      return { p_event_id: target.eventId, p_user_id: target.userId };
    case "row":
      return { p_guest_id: target.guestId };
    case "media":
      return { p_media_id: target.mediaId };
  }
}

/** What the confirm shows before the host presses Block (the act's own preview, so they agree). */
export type BlockPreview = {
  eventId: string;
  /** The name the host sees (the profile's, or the typed one); null for a nameless row. */
  label: string | null;
  /** A proved identity (a confirmed email), so the block keys the account and the address. */
  verified: boolean;
  /** Their live uploads here, which the block moves to Deleted. */
  uploads: number;
  /** The event does not require verified emails, so the confirm offers the switch. */
  namesOnly: boolean;
  /** They are blocked already. */
  already: boolean;
};

/** The person as a sentence starts them: their name, or a plain stand-in for a nameless row. */
export function blockName(name: string | null | undefined): string {
  return name?.trim() || "This guest";
}

/** The confirm's title. */
export function blockTitle(name: string | null | undefined): string {
  const who = name?.trim();
  return who
    ? `Block ${who} from this event?`
    : "Block this guest from this event?";
}

/**
 * The confirm's one line under the title. ★ IT PROMISES ONLY WHAT THE KEYS HOLD: the account and the
 * phone they used (a typed name's ticket, a confirmed guest's account and address), never a person,
 * because an open album still opens to anyone signed out with its link, and a host who blocked someone
 * must not believe otherwise (the names-only offer is the rest of the answer).
 */
export const BLOCK_LEDE =
  "They won't be able to open or add to this album from the account or phone they used. You can let them back in from Guests.";

/**
 * "What this touches", one line each (the destructive confirm's own grammar,
 * `admin/destructive-sheet.tsx`): the uploads that leave, the list they leave, and what they meet.
 */
export function blockTouches(uploads: number): string[] {
  return [
    uploads === 0
      ? "Nothing of theirs is in the album right now"
      : uploads === 1
        ? "Their 1 upload moves to Deleted"
        : `Their ${formatMediaUploads(uploads)} move to Deleted`,
    "They leave the guest list",
    "They see this album as private, and nothing tells them they were blocked",
  ];
}

/** "7 uploads", counted the way every other host surface counts them. */
function formatMediaUploads(n: number): string {
  return `${n.toLocaleString("en-US")} uploads`;
}

/**
 * The names-only offer: why a block on an album that takes typed names can be walked around, and what
 * the switch does about it. A typed name's block holds on the phone that used it; a confirmed guest's
 * holds on their account and address, yet the album would still take them under a typed name. Either
 * way the switch makes a new name alone not enough (a new confirmed address still is: the one thing
 * no block keys on is a person, so the words never promise one).
 */
export function namesOnlyOffer(verified: boolean): {
  label: string;
  description: string;
} {
  return {
    // The door's own words for the switch (event-settings r1: step 3 of Who can get in).
    label: "Also ask for an email first",
    description: verified
      ? "This album also takes typed names, so they could come back under one. With this on, everyone confirms an email before adding, so a new name alone can't bring them back."
      : "They typed a name, so this block holds on the phone they used. With this on, everyone confirms an email before adding, so a new name alone can't bring them back.",
  };
}

/** The success toast after a block. */
export function blockedToast(
  name: string | null | undefined,
  removed: number,
): { title: string; description?: string } {
  const who = name?.trim();
  return {
    title: who ? `${who} is blocked.` : "Blocked.",
    ...(removed > 0
      ? {
          description:
            removed === 1
              ? "1 upload moved to Deleted."
              : `${formatMediaUploads(removed)} moved to Deleted.`,
        }
      : {}),
  };
}

/** The Blocked list's note, which only the host ever reads. */
export const BLOCKED_NOTE =
  "Only you see this list. Blocked people see this album as private, never the word blocked.";

/** One blocked person, as the host's Blocked list and the way back need them (server-shaped). */
export type BlockedPerson = {
  /** The block's own id: Let back in names the block, never the person. */
  id: string;
  name: string | null;
  /** A proved identity, which shows the host its confirmed address and wears no mark. */
  verified: boolean;
  /** The confirmed address the block keys on, the host's to see as it was in the room. */
  email: string | null;
  avatarUrl: string | null;
  /** The person's colour (`seedFor`, never a raw id); null for a typed name. */
  seed: string | null;
  /** "Blocked Sep 28", in the viewer's own zone, formatted by the server. */
  since: string;
  /** Uploads this block moved to Deleted that can still come back. */
  restorable: number;
  /** When the first of those leaves Deleted for good, formatted by the server ("October 28"); null with none. */
  restorableUntil: string | null;
  /** Where Let back in leaves them (`blockedLanding`), which is what its words promise. */
  lands: BlockedLanding;
};

/**
 * WHERE LET BACK IN LEAVES SOMEONE (build 23's NIT-3; crumbs-24 made it read the door as it stands):
 *   - `in`: they can open the album and add again: they were in (a gate never stops someone already
 *     in), the album is Public, or the invite list, being the door, names them (let_back_in lets a
 *     waiting one in, and a new join is minted in);
 *   - `only_me`: they were in, and the album is Only me, which shuts even the people already in: the
 *     block is lifted, and they meet a closed album until the host opens it (crumbs-27);
 *   - `door`: back at a door the host answers: their ask still stands (the host lets them in from At
 *     the door, as the decline's Undo does), or the door takes asks and they can ask again;
 *   - `password`: they never got in, and the album takes a password now: they meet it like anyone new
 *     (the password ended their ask, 20260929230000, and nobody waits there);
 *   - `out`: they never got in, and the album takes nobody new (closed, or Only me).
 */
export type BlockedLanding = "in" | "only_me" | "door" | "password" | "out";

/**
 * The landing for one blocked person, from where they stood here before the block and the door as it
 * stands. ★ A NEWCOMER IS SOMEONE WITH NO ROW PAST THE DOOR, never someone with a waiting row: a password
 * deletes every waiting row (her ask ends with it), so reading the waiting row alone promised a
 * declined newcomer the album she would meet the password at.
 */
export function blockedLanding(standing: {
  /** A row of theirs here is past the door. */
  wasIn: boolean;
  /** A row of theirs here still waits on the host. */
  waiting: boolean;
  /** The invite list names the confirmed address the block keys on. */
  listed: boolean;
  /** The door as it stands. */
  door: Door;
}): BlockedLanding {
  // ★ SOMEONE WHO WAS IN IS BACK IN AT EVERY DOOR BUT ONE: a gate stops newcomers, and only Only me and a block
  // shut out someone already in (`decideDoor`), so with the block lifted Only me is what still does.
  if (standing.wasIn) return standing.door === "private" ? "only_me" : "in";
  if (standing.door === "open") return "in";
  if (standing.door === "invite" && standing.listed) return "in";
  if (standing.door === "password") return "password";
  if (standing.waiting) return "door";
  if (standing.door === "approve" || standing.door === "invite") return "door";
  return "out";
}

/**
 * The line under a blocked person's name, in its two halves: who they were (the address the block keys
 * on, or that they typed a name) and since when, with what waits in Deleted. The row sets them on one
 * line at a desk and two in a hand, so "since when" is never the half a narrow screen cuts.
 */
export function blockedLineParts(person: BlockedPerson): {
  who: string;
  when: string;
} {
  const when = [person.since];
  if (person.restorable > 0) {
    when.push(
      person.restorable === 1
        ? "1 upload in Deleted"
        : `${formatMediaUploads(person.restorable)} in Deleted`,
    );
  }
  return { who: person.email ?? "Typed a name", when: when.join(" · ") };
}

/** The way back's title and line. */
export function letBackInTitle(name: string | null | undefined): string {
  const who = name?.trim();
  return who ? `Let ${who} back in?` : "Let this guest back in?";
}

/**
 * ★ IT PROMISES WHERE THEY LAND (build 23's NIT-3, crumbs-24): someone who was in comes back in, unless
 * the album is Only me, where they meet a closed album until the host opens it (crumbs-27); a newcomer
 * declined at the door goes back to it, where the host still lets her in, as the decline's Undo does; at
 * a password she meets it like anyone new; and where nobody new gets in, she stays out.
 */
export function letBackInLede(
  eventName: string,
  lands: BlockedLanding = "in",
): string {
  switch (lands) {
    case "in":
      return `They'll be able to open ${eventName} and add photos again.`;
    case "only_me":
      return `${eventName} is Only me right now, so they'll meet a closed album until you open it. Then they can add photos again.`;
    case "door":
      return "They'll be back at the door, and you can let them in from there.";
    case "password":
      return "They'll need the password to get in, like anyone new.";
    case "out":
      return `${eventName} takes nobody new right now, so they'll stay out until you change who can get in.`;
  }
}

/**
 * The restore's switch (Will, `restore=ask`: "I like the confirmation, with default toggled off. I'd
 * expect the more likely case here is giving someone a second chance, but keeping their original media
 * that led to the blocking as removed"). Off unless the host turns it on.
 */
export function restoreOffer(
  person: Pick<BlockedPerson, "restorable" | "restorableUntil">,
): {
  label: string;
  description: string;
} | null {
  if (person.restorable <= 0) return null;
  const what =
    person.restorable === 1
      ? "1 upload waits"
      : `${formatMediaUploads(person.restorable)} wait`;
  return {
    label: "Also restore their uploads",
    description: person.restorableUntil
      ? `${what} in Deleted until ${person.restorableUntil}.`
      : `${what} in Deleted.`,
  };
}

/**
 * The toast after letting someone back in: who, and what came back or could not. ★ "BACK WHERE IT
 * WAS", NEVER "BACK IN THE ALBUM": the restore returns each upload to the status it had before the
 * block (a hidden one comes back hidden), and `let_back_in` counts them without saying which, so
 * the line says what it did for every one of them.
 */
export function letBackInToast(
  name: string | null | undefined,
  restored: number,
  noRoom: number,
  lands: BlockedLanding = "in",
): { title: string; description?: string } {
  const who = name?.trim();
  // The block is lifted and nothing more is promised: where nobody new gets in, and at Only me.
  const lifted = who
    ? `${who} is no longer blocked.`
    : "They're no longer blocked.";
  // A newcomer had nothing in the album, so there is nothing to say came back: only where she is.
  if (lands === "door") {
    return {
      title: who ? `${who} is back at the door.` : "They're back at the door.",
    };
  }
  if (lands === "password") {
    return {
      title: who
        ? `${who} can come in with the password.`
        : "They can come in with the password.",
    };
  }
  if (lands === "out") return { title: lifted };
  const lines: string[] = [];
  if (restored > 0) {
    lines.push(
      restored === 1
        ? "1 upload is back where it was."
        : `${formatMediaUploads(restored)} are back where they were.`,
    );
  }
  if (noRoom > 0) {
    lines.push(
      noRoom === 1
        ? "1 stayed in Deleted: the album is full."
        : `${noRoom.toLocaleString("en-US")} stayed in Deleted: the album is full.`,
    );
  }
  // ★ AT ONLY ME THE BLOCK IS LIFTED AND THE ALBUM STAYS SHUT, so the title says only the first (the
  // lede told the host when they can add again); what came back is true whatever the door.
  const title =
    lands === "only_me"
      ? lifted
      : who
        ? `${who} can join again.`
        : "They can join again.";
  return {
    title,
    ...(lines.length > 0 ? { description: lines.join(" ") } : {}),
  };
}

/** The part of a date that differs by zone: the calendar year, day and month, in one zone. */
function partsIn(value: string, zone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * "Blocked Sep 28" in the viewer's own zone (the dashboard's day rule, `dashboard/viewer-day.ts`),
 * with the year only when it is not this one.
 */
export function blockedSince(
  value: string,
  zone: string,
  now: Date = new Date(),
): string {
  const at = partsIn(value, zone);
  const today = partsIn(now.toISOString(), zone);
  return at.year === today.year
    ? `Blocked ${at.month} ${at.day}`
    : `Blocked ${at.month} ${at.day}, ${at.year}`;
}

/** "October 28": the day the first restorable upload leaves Deleted for good, in the viewer's zone. */
export function deletedUntil(value: string, zone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

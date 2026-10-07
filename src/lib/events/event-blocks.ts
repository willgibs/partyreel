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
  /** The person's colour (`seedFor`, never a raw id): an account's, or a typed name's own row's. */
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
 * WHERE THE WAY BACK LEAVES SOMEONE (build 23's NIT-3; crumbs-24 made it read the door as it stands; host-moments r1,
 * `let-back=straight`, made a standing ask the act's own to answer):
 *   - `in`: they can open the album and add again: they were in (a gate never stops someone already
 *     in), or, with no ask of theirs left, the album is Public or the invite list, being the door, names
 *     them (a new join is minted in);
 *   - `only_me`: they were in, and the album is Only me, which shuts even the people already in: the
 *     block is lifted, and they meet a closed album until the host opens it (crumbs-27);
 *   - `let_in`: a newcomer whose ask still stands (a decline keeps it, for the way back): the act is Let in,
 *     and one press lets them in on every device they asked from (`let_back_in`'s `p_let_in`, 20261007020000);
 *   - `let_in_only_me`: the same ask at an Only me album, which keeps its asks but shuts everyone until the
 *     host opens it: Let in lets them in to an album they meet closed, as the host's Let in at the door does
 *     there (crumbs-30), so the act says so before it acts;
 *   - `door`: a newcomer with no ask left, at a door that takes asks: back at it, they can ask again;
 *   - `password`: they never got in, and the album takes a password now: they meet it like anyone new
 *     (the password ended their ask, 20260929230000, and nobody waits there);
 *   - `out`: they never got in, and the album takes nobody new (closed, or Only me).
 */
export type BlockedLanding =
  | "in"
  | "only_me"
  | "let_in"
  | "let_in_only_me"
  | "door"
  | "password"
  | "out";

/** The two landings whose act is Let in: the newcomer's ask stands, and the press answers it. */
export function isLetIn(lands: BlockedLanding): boolean {
  return lands === "let_in" || lands === "let_in_only_me";
}

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
  // A password ended every ask there (20260929230000): a stranded one never promises the album.
  if (standing.door === "password") return "password";
  // ★ AN ASK THAT STANDS IS THE ACT'S TO ANSWER (host-moments r1, `let-back=straight`: "Let back in lets him in"):
  // undoing a decline means yes, so wherever her ask stands the press lets her in (at Public and at a list that names
  // her the door's own arms do it first, in the same call). Only me keeps her ask too, and lets her in to an album it
  // keeps shut.
  if (standing.waiting)
    return standing.door === "private" ? "let_in_only_me" : "let_in";
  if (standing.door === "open") return "in";
  if (standing.door === "invite" && standing.listed) return "in";
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

/** The one word for answering an ask yes, wherever she gives it: At the door's row, Blocked's, the decline's toast. */
export const LET_IN = "Let in";

/**
 * THE WAY BACK'S ACT, AS ITS ROW AND ITS CONFIRM NAME IT (host-moments r1, `let-back=straight`): Let in where the
 * press answers a standing ask, so the word means what she wants (in), and Let back in where it lifts the block and
 * the door as it stands decides the rest. The decline's own toast offers the same Let in (`at-the-door.tsx`).
 */
export function letBackInAct(lands: BlockedLanding = "in"): {
  label: string;
  working: string;
} {
  return isLetIn(lands)
    ? { label: LET_IN, working: "Letting in" }
    : { label: "Let back in", working: "Letting back in" };
}

/**
 * ★ ONE PRESS WHERE THE PRESS IS THE WHOLE ANSWER (host-moments r1, `let-back=straight`: "one press, and the album
 * opens for him where he waits"): a declined newcomer's Let in at a door that lets her straight into the album asks
 * nothing first. A confirm stays where it carries something the host decides or should hear before it happens: the
 * restore's switch (Will, `restore=ask`: "I like the confirmation, with default toggled off"), an Only me album she
 * would meet closed, or a door that decides what lifting the block leaves her at.
 */
export function letInAtOnce(
  person: Pick<BlockedPerson, "lands" | "restorable" | "restorableUntil">,
): boolean {
  return person.lands === "let_in" && restoreOffer(person) === null;
}

/** What a one-press row says under the name, before the press: where Let in takes them (the board's drawn line). */
export const LET_IN_LINE = "Let in: into the album, now";

/** The way back's title, in its act's own word. */
export function letBackInTitle(
  name: string | null | undefined,
  lands: BlockedLanding = "in",
): string {
  const who = name?.trim();
  if (isLetIn(lands)) return who ? `Let ${who} in?` : "Let this guest in?";
  return who ? `Let ${who} back in?` : "Let this guest back in?";
}

/**
 * ★ IT PROMISES WHERE THEY LAND (build 23's NIT-3, crumbs-24): someone who was in comes back in, unless
 * the album is Only me, where they meet a closed album until the host opens it (crumbs-27); a declined newcomer
 * whose ask stands is let in by the press itself (host-moments r1), and at Only me is told that it lets her in to
 * that closed album (crumbs-30's clause); one with no ask left is back at a door she can ask at again; at a password
 * she meets it like anyone new; and where nobody new gets in, she stays out.
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
    case "let_in":
      return `They'll be in at once: their link opens ${eventName} for them.`;
    case "let_in_only_me":
      return `They'll be in, but ${eventName} is Only me right now, so they'll meet a closed album until you open it.`;
    case "door":
      return "They'll be back at the door, and can ask you again from there.";
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
 * THE TOAST AFTER SHE LETS SOMEONE IN, wherever she pressed it (At the door's Let in, Blocked's, the decline's own
 * toast): who, and where the album opens for them, in one set of words. ★ WHERE THEY STAND DECIDES THE SECOND LINE:
 * someone waiting stands at a held door that opens by itself at its next check-in ("right where they wait"); someone
 * declined met the shut door, which opens nothing by itself and told them the link works again the moment the host
 * lets them in ("their link opens the album"); and at Only me no album opens until the host opens it.
 */
export function letInToast(
  name: string | null | undefined,
  at: { from: "door" | "decline"; onlyMe: boolean },
): { title: string; description: string } {
  const who = name?.trim();
  return {
    title: who ? `${who} is in.` : "They're in.",
    description: at.onlyMe
      ? "The album is Only me right now, so they'll meet it closed until you open it."
      : at.from === "door"
        ? "The album opens for them right where they wait."
        : "Their link opens the album for them now.",
  };
}

/**
 * The toast after letting someone back in: who, and what came back or could not. ★ "BACK WHERE IT
 * WAS", NEVER "BACK IN THE ALBUM": the restore returns each upload to the status it had before the
 * block (a hidden one comes back hidden), and `let_back_in` counts them without saying which, so
 * the line says what it did for every one of them. ★ A LET IN SAYS WHAT THE ANSWER SAYS (`admitted`, the people
 * the call let in): a door that moved under the press (a password ended her ask) let nobody in, and the toast then
 * promises nothing past the lifted block; a stand-in that answers no count (the Library's) is taken at its word.
 */
export function letBackInToast(
  name: string | null | undefined,
  restored: number,
  noRoom: number,
  lands: BlockedLanding = "in",
  admitted?: number,
): { title: string; description?: string } {
  const who = name?.trim();
  // The block is lifted and nothing more is promised: where nobody new gets in, and at Only me.
  const lifted = who
    ? `${who} is no longer blocked.`
    : "They're no longer blocked.";
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
  if (isLetIn(lands)) {
    if (admitted === 0) {
      return lines.length > 0
        ? { title: lifted, description: lines.join(" ") }
        : { title: lifted };
    }
    const told = letInToast(name, {
      from: "decline",
      onlyMe: lands === "let_in_only_me",
    });
    return {
      title: told.title,
      description: [told.description, ...lines].join(" "),
    };
  }
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

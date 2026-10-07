/**
 * THE PER-EVENT BLOCK'S PURE HALF: who a Block names (the Server Functions' boundary) and every
 * sentence the host reads about one. The words are pinned where they carry a rule: the count, the
 * default-off restore, the names-only offer, and that the host is told what the blocked person meets
 * (a private album) while nothing here is ever addressed to that person.
 */
import { describe, expect, it } from "vitest";

import {
  BLOCK_LEDE,
  BLOCKED_NOTE,
  blockName,
  blockTargetParams,
  blockTargetSchema,
  blockTitle,
  blockTouches,
  blockedLanding,
  blockedLineParts,
  blockedSince,
  blockedToast,
  deletedUntil,
  isLetIn,
  LET_IN,
  LET_IN_LINE,
  letBackInAct,
  letBackInLede,
  letBackInTitle,
  letBackInToast,
  letInAtOnce,
  letInToast,
  namesOnlyOffer,
  restoreOffer,
  type BlockedPerson,
} from "@/lib/events/event-blocks";

const EVENT = "11111111-2222-4333-8444-555555555555";
const USER = "22222222-3333-4444-8555-666666666666";
const GUEST = "33333333-4444-4555-8666-777777777777";
const MEDIA = "44444444-5555-4666-8777-888888888888";

describe("blockTargetSchema: a target is a raw client value until it parses", () => {
  it("takes exactly the three shapes, each with real uuids", () => {
    for (const target of [
      { kind: "account", eventId: EVENT, userId: USER },
      { kind: "row", guestId: GUEST },
      { kind: "media", mediaId: MEDIA },
    ]) {
      expect(blockTargetSchema.safeParse(target).success).toBe(true);
    }
  });

  it("refuses anything else: another kind, a missing id, a non-uuid, an address or a device", () => {
    for (const target of [
      null,
      "row",
      {},
      { kind: "email", email: "sam@example.com" },
      { kind: "device", ip: "203.0.113.9" },
      { kind: "account", userId: USER },
      { kind: "account", eventId: EVENT, userId: "not-a-uuid" },
      { kind: "row", guestId: "" },
      { kind: "media", mediaId: 42 },
      { kind: "media", mediaId: `${MEDIA}' or 1=1` },
    ]) {
      expect(
        blockTargetSchema.safeParse(target).success,
        JSON.stringify(target),
      ).toBe(false);
    }
  });

  it("strips anything a client adds beside the target", () => {
    const parsed = blockTargetSchema.parse({
      kind: "row",
      guestId: GUEST,
      eventId: EVENT,
      email: "sam@example.com",
    });
    expect(parsed).toEqual({ kind: "row", guestId: GUEST });
  });
});

describe("blockTargetParams: exactly one person, one way", () => {
  it("names the event only for an account (a row and a photograph name their own)", () => {
    expect(
      blockTargetParams({ kind: "account", eventId: EVENT, userId: USER }),
    ).toEqual({ p_event_id: EVENT, p_user_id: USER });
    expect(blockTargetParams({ kind: "row", guestId: GUEST })).toEqual({
      p_guest_id: GUEST,
    });
    expect(blockTargetParams({ kind: "media", mediaId: MEDIA })).toEqual({
      p_media_id: MEDIA,
    });
  });
});

describe("the confirm's words", () => {
  it("titles the person, or a plain stand-in for a nameless row", () => {
    expect(blockTitle("Sam")).toBe("Block Sam from this event?");
    expect(blockTitle("  ")).toBe("Block this guest from this event?");
    expect(blockTitle(null)).toBe("Block this guest from this event?");
    expect(blockName(null)).toBe("This guest");
    expect(blockName(" Theo ")).toBe("Theo");
  });

  it("says what the block touches: their uploads to Deleted, off the list, and a private album", () => {
    expect(blockTouches(0)[0]).toBe(
      "Nothing of theirs is in the album right now",
    );
    expect(blockTouches(1)[0]).toBe("Their 1 upload moves to Deleted");
    expect(blockTouches(1234)[0]).toBe("Their 1,234 uploads move to Deleted");
    expect(blockTouches(3).slice(1)).toEqual([
      "They leave the guest list",
      "They see this album as private, and nothing tells them they were blocked",
    ]);
    expect(BLOCK_LEDE).toContain("let them back in from Guests");
    // ★ Never a promise past the keys: an open album still opens to anyone signed out with its link.
    expect(BLOCK_LEDE).toContain("from the account or phone they used");
  });

  it("the names-only offer says why a block can be walked around, fitted to who is blocked", () => {
    // The switch's own name since the doors (event-settings r1: step 3, "An email first").
    expect(namesOnlyOffer(false).label).toBe("Also ask for an email first");
    expect(namesOnlyOffer(true).label).toBe("Also ask for an email first");
    // A typed name is held on its phone; a confirmed guest on their account, yet a typed name is open.
    expect(namesOnlyOffer(true).description).toContain(
      "could come back under one",
    );
    expect(namesOnlyOffer(true).description).not.toContain("phone");
    // ★ Never a promise the switch cannot keep: a new confirmed address still gets anyone in.
    for (const offer of [namesOnlyOffer(false), namesOnlyOffer(true)]) {
      expect(offer.description).toContain(
        "a new name alone can't bring them back",
      );
      expect(offer.description).not.toMatch(/can't come back|never come back/);
    }
    expect(namesOnlyOffer(false).description).toContain(
      "holds on the phone they used",
    );
  });

  it("the toast says who, and how many moved", () => {
    expect(blockedToast("Sam", 0)).toEqual({ title: "Sam is blocked." });
    expect(blockedToast(null, 1)).toEqual({
      title: "Blocked.",
      description: "1 upload moved to Deleted.",
    });
    expect(blockedToast("Sam", 12).description).toBe(
      "12 uploads moved to Deleted.",
    );
  });
});

const person = (over: Partial<BlockedPerson> = {}): BlockedPerson => ({
  id: "block-1",
  name: "Sam",
  verified: true,
  email: "sam@example.com",
  avatarUrl: null,
  seed: null,
  since: "Blocked Sep 28",
  restorable: 0,
  restorableUntil: null,
  lands: "in",
  ...over,
});

describe("the Blocked list and the way back", () => {
  it("a row says the address or that they typed a name, then since when and what waits in Deleted", () => {
    expect(blockedLineParts(person())).toEqual({
      who: "sam@example.com",
      when: "Blocked Sep 28",
    });
    expect(blockedLineParts(person({ email: null, verified: false })).who).toBe(
      "Typed a name",
    );
    expect(blockedLineParts(person({ restorable: 1 })).when).toBe(
      "Blocked Sep 28 · 1 upload in Deleted",
    );
    expect(blockedLineParts(person({ restorable: 5 })).when).toBe(
      "Blocked Sep 28 · 5 uploads in Deleted",
    );
    expect(BLOCKED_NOTE).toMatch(/^Only you see this list\./);
  });

  it("★ the restore is offered only while something can come back, and says until when", () => {
    expect(restoreOffer({ restorable: 0, restorableUntil: null })).toBeNull();
    expect(
      restoreOffer({ restorable: 0, restorableUntil: "October 28" }),
    ).toBeNull();
    expect(
      restoreOffer({ restorable: 1, restorableUntil: "October 28" }),
    ).toEqual({
      label: "Also restore their uploads",
      description: "1 upload waits in Deleted until October 28.",
    });
    expect(
      restoreOffer({ restorable: 3, restorableUntil: null })?.description,
    ).toBe("3 uploads wait in Deleted.");
  });

  it("the way back's title, line and toast", () => {
    expect(letBackInTitle("Sam")).toBe("Let Sam back in?");
    expect(letBackInTitle(null)).toBe("Let this guest back in?");
    expect(letBackInLede("Maya's 30th")).toBe(
      "They'll be able to open Maya's 30th and add photos again.",
    );
    expect(letBackInToast("Sam", 0, 0)).toEqual({
      title: "Sam can join again.",
    });
    // ★ Back where each was, never "back in the album": the restore returns an upload to the status
    // it had, so a hidden one comes back hidden (build 17's red-team read the old line on one).
    expect(letBackInToast(null, 2, 1)).toEqual({
      title: "They can join again.",
      description:
        "2 uploads are back where they were. 1 stayed in Deleted: the album is full.",
    });
    expect(letBackInToast("Sam", 1, 0).description).toBe(
      "1 upload is back where it was.",
    );
    for (const restored of [1, 2, 40]) {
      expect(letBackInToast("Sam", restored, 0).description).not.toMatch(
        /in the album/,
      );
    }
  });

  it("★ a newcomer with no ask left is told she goes back to the door, not into the album (build 23's NIT-3)", () => {
    // ★ RESHAPED ON PURPOSE (crumbs-24; scar kept: back at the door, never the album): the flag became the landing,
    // since a newcomer can land somewhere other than the door. ★ AND AGAIN (host-moments r1, `let-back=straight`;
    // scar kept): the expired reason is "her ask still stands there, and the host lets her in from it". A standing ask
    // is the act's own to answer now (Let in, below), so `door` is a newcomer whose ask ended, who can ask again.
    expect(letBackInLede("Maya's 30th", "door")).toBe(
      "They'll be back at the door, and can ask you again from there.",
    );
    expect(letBackInToast("Wren", 0, 0, "door")).toEqual({
      title: "Wren is back at the door.",
    });
    expect(letBackInToast(null, 0, 0, "door")).toEqual({
      title: "They're back at the door.",
    });
    // Neither promises the album she still has to be let into.
    for (const said of [
      letBackInLede("Maya's 30th", "door"),
      letBackInToast("Wren", 0, 0, "door").title,
    ]) {
      expect(said).not.toMatch(/open|add photos|join again/);
    }
  });

  it("★ a newcomer whose ask a password ended meets it like anyone new: the words never promise the album (crumbs-24)", () => {
    expect(letBackInLede("Maya's 30th", "password")).toBe(
      "They'll need the password to get in, like anyone new.",
    );
    expect(letBackInToast("Wren", 0, 0, "password")).toEqual({
      title: "Wren can come in with the password.",
    });
    expect(letBackInToast(null, 0, 0, "password")).toEqual({
      title: "They can come in with the password.",
    });
    for (const said of [
      letBackInLede("Maya's 30th", "password"),
      letBackInToast("Wren", 0, 0, "password").title,
    ]) {
      expect(said).not.toMatch(/add photos|join again|back at the door/);
    }
  });

  it("★ someone who was in, at Only me, is told the album stays closed to them until the host opens it, before and after (crumbs-27)", () => {
    // Where Let back in only lifts the block: the album itself is shut to everyone, so the words promise
    // the album once it opens and not before ("open X and add photos again" was true only then).
    expect(letBackInLede("Maya's 30th", "only_me")).toBe(
      "Maya's 30th is Only me right now, so they'll meet a closed album until you open it. Then they can add photos again.",
    );
    expect(letBackInToast("Sam", 0, 0, "only_me")).toEqual({
      title: "Sam is no longer blocked.",
    });
    expect(letBackInToast(null, 0, 0, "only_me")).toEqual({
      title: "They're no longer blocked.",
    });
    // What came back is true whatever the door: the uploads returned to the album the host alone opens.
    expect(letBackInToast("Sam", 2, 1, "only_me")).toEqual({
      title: "Sam is no longer blocked.",
      description:
        "2 uploads are back where they were. 1 stayed in Deleted: the album is full.",
    });
    // Neither says they can join again, which they cannot until it opens.
    for (const said of [
      letBackInToast("Sam", 1, 0, "only_me").title,
      letBackInToast(null, 0, 0, "only_me").title,
    ]) {
      expect(said).not.toMatch(/join again|add photos/);
    }
    expect(letBackInLede("Maya's 30th", "only_me")).not.toBe(
      letBackInLede("Maya's 30th", "in"),
    );
  });

  it("★ a declined newcomer whose ask stands at Only me is told, before the press, that it lets her in to an album she meets closed (crumbs-30)", () => {
    // ★ RESHAPED ON PURPOSE (host-moments r1, `let-back=straight`; scar kept: at Only me the words never promise the
    // album, which stays shut to everyone until the host opens it). The expired reason: "she is back at the door, and
    // the host's Let in there leaves her at a closed album". The press is the Let in now, so the confirm says that one
    // thing before it acts, and the toast after it.
    expect(letBackInLede("Maya's 30th", "let_in_only_me")).toBe(
      "They'll be in, but Maya's 30th is Only me right now, so they'll meet a closed album until you open it.",
    );
    expect(letBackInTitle("Wren", "let_in_only_me")).toBe("Let Wren in?");
    expect(letBackInToast("Wren", 0, 0, "let_in_only_me", 1)).toEqual({
      title: "Wren is in.",
      description:
        "The album is Only me right now, so they'll meet it closed until you open it.",
    });
    for (const said of [
      letBackInLede("Maya's 30th", "let_in_only_me"),
      letBackInToast("Wren", 0, 0, "let_in_only_me", 1).description ?? "",
    ]) {
      expect(said).not.toMatch(/add photos|join again|opens .* for them/);
    }
  });

  it("where nobody new gets in, a newcomer is told she stays out, and nothing more", () => {
    expect(letBackInLede("Maya's 30th", "out")).toBe(
      "Maya's 30th takes nobody new right now, so they'll stay out until you change who can get in.",
    );
    expect(letBackInToast("Wren", 0, 0, "out")).toEqual({
      title: "Wren is no longer blocked.",
    });
    expect(letBackInToast(null, 0, 0, "out")).toEqual({
      title: "They're no longer blocked.",
    });
  });
});

describe("★ Let in, the way back for a declined newcomer whose ask stands (host-moments r1, `let-back=straight`)", () => {
  it("the act is Let in where the press answers a standing ask, Let back in everywhere else", () => {
    for (const lands of ["let_in", "let_in_only_me"] as const) {
      expect(isLetIn(lands)).toBe(true);
      expect(letBackInAct(lands)).toEqual({
        label: LET_IN,
        working: "Letting in",
      });
    }
    for (const lands of ["in", "only_me", "door", "password", "out"] as const) {
      expect(isLetIn(lands)).toBe(false);
      expect(letBackInAct(lands)).toEqual({
        label: "Let back in",
        working: "Letting back in",
      });
    }
    expect(LET_IN).toBe("Let in");
  });

  it("★ one press only where the press is the whole answer: no restore to decide, no Only me to hear first", () => {
    const declined = person({ lands: "let_in" });
    expect(letInAtOnce(declined)).toBe(true);
    // Will's restore=ask holds its confirm wherever something of theirs could come back.
    expect(letInAtOnce({ ...declined, restorable: 2 })).toBe(false);
    expect(letInAtOnce(person({ lands: "let_in_only_me" }))).toBe(false);
    for (const lands of ["in", "only_me", "door", "password", "out"] as const) {
      expect(letInAtOnce(person({ lands })), lands).toBe(false);
    }
    // The one-press row says where it takes her before the press (the board's drawn line).
    expect(LET_IN_LINE).toBe("Let in: into the album, now");
  });

  it("the confirm, where one stands, asks in the act's own word and says she will be in", () => {
    expect(letBackInTitle("Dev", "let_in")).toBe("Let Dev in?");
    expect(letBackInTitle(null, "let_in")).toBe("Let this guest in?");
    expect(letBackInTitle("Ray", "in")).toBe("Let Ray back in?");
    expect(letBackInLede("Maya's 30th", "let_in")).toBe(
      "They'll be in at once: their link opens Maya's 30th for them.",
    );
  });

  it("★ the toast says what the answer says: in, or only lifted where nobody was let in", () => {
    expect(letBackInToast("Dev", 0, 0, "let_in", 1)).toEqual({
      title: "Dev is in.",
      description: "Their link opens the album for them now.",
    });
    // A stand-in that answers no count is taken at its word.
    expect(letBackInToast("Dev", 0, 0, "let_in")).toEqual(
      letBackInToast("Dev", 0, 0, "let_in", 1),
    );
    // A door that moved under the press (a password ended her ask) let nobody in: nothing past the lifted block.
    expect(letBackInToast("Dev", 0, 0, "let_in", 0)).toEqual({
      title: "Dev is no longer blocked.",
    });
    expect(letBackInToast(null, 0, 0, "let_in", 0)).toEqual({
      title: "They're no longer blocked.",
    });
    // What the restore brought back is said after where she is.
    expect(letBackInToast("Dev", 2, 0, "let_in", 1)).toEqual({
      title: "Dev is in.",
      description:
        "Their link opens the album for them now. 2 uploads are back where they were.",
    });
  });

  it("★ one set of words for every Let in, the second line where the person stands", () => {
    // At the door: a held door, which opens by itself at its next check-in.
    expect(letInToast("Wren", { from: "door", onlyMe: false })).toEqual({
      title: "Wren is in.",
      description: "The album opens for them right where they wait.",
    });
    // Declined: the shut door opens nothing by itself, and told them the link works again once let in.
    expect(letInToast("Dev", { from: "decline", onlyMe: false })).toEqual({
      title: "Dev is in.",
      description: "Their link opens the album for them now.",
    });
    // ★ Only me opens no album for anyone, wherever she let them in from.
    for (const from of ["door", "decline"] as const) {
      expect(letInToast("Wren", { from, onlyMe: true }).description).toBe(
        "The album is Only me right now, so they'll meet it closed until you open it.",
      );
    }
    expect(letInToast(" ", { from: "door", onlyMe: false }).title).toBe(
      "They're in.",
    );
  });
});

describe("blockedLanding: where Let back in leaves them, from the door as it stands (crumbs-24)", () => {
  const at = (
    door: Parameters<typeof blockedLanding>[0]["door"],
    over: Partial<Parameters<typeof blockedLanding>[0]> = {},
  ) =>
    blockedLanding({
      wasIn: false,
      waiting: false,
      listed: false,
      door,
      ...over,
    });

  // ★ RESHAPED ON PURPOSE (crumbs-27; scar kept: a gate never stops someone already in): "at every door" read Only
  // me too, and Let back in then promised someone who was in "They'll be able to open X and add photos again",
  // true only once the host opens the album, since Only me shuts even the people already in.
  it("someone who was in comes back in at every door a gate keeps (a gate never stops someone already in)", () => {
    for (const door of [
      "open",
      "password",
      "approve",
      "invite",
      "closed",
    ] as const) {
      expect(at(door, { wasIn: true }), door).toBe("in");
    }
  });

  it("★ at Only me they are back on a closed album: nobody gets in until the host opens it, the people already in included (crumbs-27)", () => {
    expect(at("private", { wasIn: true })).toBe("only_me");
    // Not a newcomer's landing: someone who never got in stays out (an ask of hers that stands is below).
    expect(at("private")).toBe("out");
  });

  it("★ a declined newcomer at a password meets it like anyone new: her ask ended with it, and a stranded one never promises the album", () => {
    expect(at("password")).toBe("password");
    expect(at("password", { waiting: true })).toBe("password");
  });

  // ★ RESHAPED ON PURPOSE (crumbs-30; scar kept: an ask that stands is the host's to answer): Only me left this list
  // for its own landing below, since the host's Let in there leaves her at a closed album. ★ AND AGAIN (host-moments
  // r1, `let-back=straight`; scar kept): the expired reason is "keeps her at a door the host answers, from At the
  // door". Undoing a decline means yes, so the press itself answers the ask, wherever it stands (Public and the list
  // let her in by their own arms in the same call, which is why they read as Let in too).
  it("★ an ask that stands is the press's to answer: Let in, at every door that keeps one", () => {
    for (const door of ["approve", "invite", "closed", "open"] as const) {
      expect(at(door, { waiting: true }), door).toBe("let_in");
    }
    expect(at("invite", { waiting: true, listed: true })).toBe("let_in");
    // With no ask left, the list that names her and Public let her in by lifting the block alone.
    expect(at("invite", { listed: true })).toBe("in");
    expect(at("open")).toBe("in");
  });

  it("★ an ask that stands at Only me is Let in to an album it keeps shut (crumbs-30)", () => {
    expect(at("private", { waiting: true })).toBe("let_in_only_me");
    // Someone who was in is the album's own Only me landing, whatever rows of hers wait.
    expect(at("private", { wasIn: true, waiting: true })).toBe("only_me");
  });

  it("with no ask left: a door that takes asks lets her ask again; one that takes nobody new keeps her out", () => {
    expect(at("approve")).toBe("door");
    expect(at("invite")).toBe("door");
    expect(at("closed")).toBe("out");
    expect(at("private")).toBe("out");
  });
});

describe("dates, in the viewer's own zone", () => {
  const NOW = new Date("2026-09-28T12:00:00Z");

  it("the day the block was made, in the host's zone, with the year only when it is not this one", () => {
    // 02:30 UTC on the 29th is still the 28th in Los Angeles.
    expect(
      blockedSince("2026-09-29T02:30:00Z", "America/Los_Angeles", NOW),
    ).toBe("Blocked Sep 28");
    expect(blockedSince("2026-09-29T02:30:00Z", "Europe/London", NOW)).toBe(
      "Blocked Sep 29",
    );
    expect(blockedSince("2025-12-31T12:00:00Z", "UTC", NOW)).toBe(
      "Blocked Dec 31, 2025",
    );
  });

  it("the day the first restorable upload leaves Deleted for good", () => {
    expect(deletedUntil("2026-10-28T03:00:00Z", "America/New_York")).toBe(
      "October 27",
    );
    expect(deletedUntil("2026-10-28T03:00:00Z", "UTC")).toBe("October 28");
  });
});

describe("the bible's copy rules hold in every sentence here", () => {
  it("no em-dash anywhere the host reads", () => {
    const words = [
      BLOCK_LEDE,
      BLOCKED_NOTE,
      namesOnlyOffer(false).label,
      namesOnlyOffer(false).description,
      namesOnlyOffer(true).description,
      blockTitle("Sam"),
      ...blockTouches(2),
      blockedToast("Sam", 2).title,
      blockedToast("Sam", 2).description ?? "",
      blockedLineParts(person({ restorable: 2 })).when,
      letBackInTitle("Sam"),
      letBackInLede("Party"),
      letBackInLede("Party", "password"),
      letBackInLede("Party", "out"),
      letBackInLede("Party", "only_me"),
      letBackInLede("Party", "let_in"),
      letBackInLede("Party", "let_in_only_me"),
      letBackInLede("Party", "door"),
      letBackInTitle("Sam", "let_in"),
      LET_IN_LINE,
      letInToast("Sam", { from: "door", onlyMe: false }).description,
      letInToast("Sam", { from: "decline", onlyMe: false }).description,
      letInToast("Sam", { from: "decline", onlyMe: true }).description,
      restoreOffer({ restorable: 2, restorableUntil: "October 28" })
        ?.description ?? "",
      letBackInToast("Sam", 2, 2).description ?? "",
    ];
    for (const line of words) expect(line).not.toMatch(/—/);
  });
});

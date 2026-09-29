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
  blockedLineParts,
  blockedSince,
  blockedToast,
  deletedUntil,
  letBackInLede,
  letBackInTitle,
  letBackInToast,
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
    expect(namesOnlyOffer(false).label).toBe("Also require verified emails");
    expect(namesOnlyOffer(true).label).toBe("Also require verified emails");
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
    expect(letBackInToast(null, 2, 1)).toEqual({
      title: "They can join again.",
      description:
        "2 uploads are back in the album. 1 stayed in Deleted: the album is full.",
    });
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
      restoreOffer({ restorable: 2, restorableUntil: "October 28" })
        ?.description ?? "",
      letBackInToast("Sam", 2, 2).description ?? "",
    ];
    for (const line of words) expect(line).not.toMatch(/—/);
  });
});

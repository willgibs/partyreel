import { describe, expect, it } from "vitest";

import {
  decideDoor,
  readStanding,
  readsAlbum,
  showsTheEvent,
  type DoorStanding,
} from "@/lib/event/door/decide";
import type { Door } from "@/lib/event/door/door";

/** A stranger at a door: found, and nothing else true. */
const stranger = (door: Door, over: Partial<DoorStanding> = {}): DoorStanding => ({
  found: true,
  door,
  host: false,
  blocked: false,
  wasIn: false,
  in: false,
  waiting: false,
  listed: false,
  confirmed: false,
  ...over,
});

const already = (door: Door, over: Partial<DoorStanding> = {}) =>
  stranger(door, { wasIn: true, in: true, confirmed: true, ...over });

describe("the one rule for everyone already in", () => {
  it.each(["open", "password", "approve", "invite", "closed"] as const)(
    "someone already in goes through the %s door, past the password and every gate",
    (door) => {
      expect(decideDoor(already(door))).toEqual({ kind: "through", admitted: true });
    },
  );

  it("only Only me shuts someone already in, with the previous guest's line", () => {
    expect(decideDoor(already("private"))).toEqual({ kind: "shut", previous: true });
  });

  it("and a block, at any door, with the same line, so the block reads as Only me", () => {
    for (const door of ["open", "password", "approve", "invite", "closed", "private"] as const) {
      expect(decideDoor(already(door, { blocked: true, in: false }))).toEqual({
        kind: "shut",
        previous: true,
      });
    }
  });

  it("the host goes through every door, Only me included", () => {
    for (const door of ["open", "password", "approve", "invite", "closed", "private"] as const) {
      expect(decideDoor(stranger(door, { host: true }))).toEqual({
        kind: "through",
        admitted: true,
      });
    }
  });
});

describe("every newcomer turned away meets one shut screen", () => {
  it("Only me, a closed door and a block answer the same, with no previous line", () => {
    const shut = { kind: "shut", previous: false };
    expect(decideDoor(stranger("private"))).toEqual(shut);
    expect(decideDoor(stranger("closed", { confirmed: true }))).toEqual(shut);
    expect(decideDoor(stranger("closed"))).toEqual(shut);
    // A decline is a block, and a blocked newcomer was never in.
    expect(decideDoor(stranger("approve", { blocked: true, confirmed: true }))).toEqual(shut);
    expect(decideDoor(stranger("invite", { blocked: true, confirmed: true, listed: true }))).toEqual(
      shut,
    );
  });

  it("someone waiting at a door that closed meets it too, never a door that says she asked", () => {
    expect(decideDoor(stranger("closed", { waiting: true, confirmed: true }))).toEqual({
      kind: "shut",
      previous: false,
    });
    expect(decideDoor(stranger("private", { waiting: true }))).toEqual({
      kind: "shut",
      previous: false,
    });
  });
});

describe("the doors a newcomer stands at", () => {
  it("Public and the password send a newcomer on to the album's own gates, not admitted", () => {
    expect(decideDoor(stranger("open"))).toEqual({ kind: "through", admitted: false });
    expect(decideDoor(stranger("password"))).toEqual({ kind: "through", admitted: false });
  });

  it("letting each person in: the door's steps (or one tap to ask, once confirmed), then waiting, then in", () => {
    expect(decideDoor(stranger("approve"))).toEqual({ kind: "newcomer", gate: "approve" });
    expect(decideDoor(stranger("approve", { confirmed: true }))).toEqual({
      kind: "ask",
      gate: "approve",
    });
    expect(decideDoor(stranger("approve", { confirmed: true, waiting: true }))).toEqual({
      kind: "waiting",
    });
  });

  it("the invite list: the email first, then the list comes straight in and anyone else may ask", () => {
    expect(decideDoor(stranger("invite"))).toEqual({ kind: "newcomer", gate: "invite" });
    expect(decideDoor(stranger("invite", { confirmed: true }))).toEqual({
      kind: "ask",
      gate: "invite",
    });
    expect(decideDoor(stranger("invite", { confirmed: true, waiting: true }))).toEqual({
      kind: "waiting",
    });
    expect(decideDoor(stranger("invite", { confirmed: true, listed: true }))).toEqual({
      kind: "through",
      admitted: true,
    });
    // The list is the host's own yes: it lets in someone who asked before she was listed.
    expect(
      decideDoor(stranger("invite", { confirmed: true, listed: true, waiting: true })),
    ).toEqual({ kind: "through", admitted: true });
  });
});

describe("what a decision shows", () => {
  it("only going through reads the album; every door but the shut one shows the event", () => {
    expect(readsAlbum({ kind: "through", admitted: false })).toBe(true);
    for (const decision of [
      { kind: "waiting" },
      { kind: "ask", gate: "invite" },
      { kind: "newcomer", gate: "approve" },
      { kind: "shut", previous: true },
    ] as const) {
      expect(readsAlbum(decision)).toBe(false);
    }
    expect(showsTheEvent({ kind: "waiting" })).toBe(true);
    expect(showsTheEvent({ kind: "ask", gate: "approve" })).toBe(true);
    expect(showsTheEvent({ kind: "newcomer", gate: "invite" })).toBe(true);
    expect(showsTheEvent({ kind: "shut", previous: false })).toBe(false);
  });
});

describe("the server's answer, read defensively", () => {
  it("reads the RPC's own keys", () => {
    expect(
      readStanding({
        found: true,
        door: "approve",
        host: false,
        blocked: false,
        was_in: false,
        in: false,
        waiting: true,
        listed: false,
        confirmed: true,
      }),
    ).toEqual(stranger("approve", { waiting: true, confirmed: true }));
  });

  it("reads anything missing or malformed as a stranger at a private album", () => {
    for (const raw of [null, undefined, "private", 3, [], {}, { door: "ajar", in: "yes" }]) {
      const standing = readStanding(raw);
      expect(standing.door).toBe("private");
      expect(standing.in).toBe(false);
      expect(standing.host).toBe(false);
      expect(decideDoor(standing).kind).toBe("shut");
    }
  });
});

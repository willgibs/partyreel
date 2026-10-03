import { describe, expect, it } from "vitest";

import { decideDoor, type DoorStanding } from "@/lib/event/door/decide";
import { type Door, DOORS } from "@/lib/event/door/door";
import { GATE_LINES } from "@/lib/events/visibility-labels";
import { createEventSchema } from "@/lib/validation/event";

import {
  checklistOver,
  doorLetsGuestsIn,
  newEventFacts,
  type ReadyFacts,
  readiness,
  readyHead,
  settingsReadiness,
  settingsSteps,
  stepsLeft,
  stepWants,
  storageUsedPct,
} from "./readiness";

/**
 * READY FOR GUESTS (Will's `event-ready` picks, 2026-10-02): what the hub's checklist, Settings' rail and
 * Create's hand-off all read. These are the claims the three make, held on the one function, so a tick in
 * one is a tick in all of them.
 */

const FRESH: ReadyFacts = {
  door: "open",
  hasPassword: false,
  guestsIn: 0,
  invited: 0,
  acceptingUploads: true,
  approved: 0,
  playable: 0,
  showReel: true,
  liveReelEnabled: true,
  eventDate: null,
  description: null,
  opened: 0,
  storagePct: 3,
};

const ids = (f: ReadyFacts) => readiness(f).left.map((i) => i.id);

describe("ready", () => {
  it("is not ready an hour after Create: the code has never been opened", () => {
    const r = readiness(FRESH);
    expect(r.ready).toBe(false);
    expect(ids(FRESH)).toEqual(["code", "photos", "welcome"]);
    expect(r.done).toBe(2);
    expect(r.total).toBe(5);
    expect(r.needed).toEqual({ done: 2, of: 3 });
  });

  it("waits only on what a guest needs: the note, the date and the photos never hold it back", () => {
    const r = readiness({ ...FRESH, opened: 1 });
    expect(r.ready).toBe(true);
    expect(r.left.map((i) => i.id)).toEqual(["photos", "welcome"]);
  });

  // ★ RESHAPED ON PURPOSE (the wiring, 2026-10-02): the board's code row read Print then Share. Its door
  // onto the code card reads Invite, as every door onto the card does (`share=card`), and leads, since
  // most hosts send the link before any paper is printed; Print stays beside it.
  it("ticks the code at its first open, the host's own test scan included", () => {
    const code = (opened: number) =>
      readiness({ ...FRESH, opened }).items.find((i) => i.id === "code")!;
    expect(code(0).done).toBe(false);
    expect(code(0).actions.map((a) => a.to)).toEqual(["invite", "print"]);
    expect(code(0).actions[0]!.label).toBe("Invite");
    expect(code(1).done).toBe(true);
    expect(code(1).line).toBe("Opened 1 time.");
    expect(code(1).actions).toEqual([]);
  });

  it("reads the door as a guest meets it", () => {
    const lets = (over: Partial<ReadyFacts>) =>
      doorLetsGuestsIn({ ...FRESH, ...over });
    expect(lets({ door: "open" })).toBe(true);
    expect(lets({ door: "approve" })).toBe(true);
    expect(lets({ door: "private" })).toBe(false);
    // An invite list needs no names: anyone else can ask the host.
    expect(lets({ door: "invite", invited: 0 })).toBe(true);
    expect(lets({ door: "invite", invited: 12 })).toBe(true);
    expect(lets({ door: "closed", guestsIn: 0 })).toBe(false);
    expect(lets({ door: "closed", guestsIn: 31 })).toBe(true);
    expect(lets({ door: "password", hasPassword: false })).toBe(false);
    expect(lets({ door: "password", hasPassword: true })).toBe(true);
    // Every door has an answer, so a new door is a compile error, not a blank.
    for (const door of DOORS)
      expect(typeof lets({ door, invited: 1, guestsIn: 1 })).toBe("boolean");
  });

  it("stands an invite door done with an empty list, in production's own words", () => {
    const empty: ReadyFacts = {
      ...FRESH,
      door: "invite",
      invited: 0,
      opened: 1,
    };
    const door = readiness(empty).items.find((i) => i.id === "door")!;
    expect(door.done).toBe(true);
    expect(door.line).toBe(GATE_LINES.invite);
    expect(door.actions).toEqual([]);
    expect(readiness(empty).ready).toBe(true);
  });

  // ★ THE SCAR: the door item read an empty invite list as "nobody can get in yet" while production lets
  // anyone else ask to be let in. The decision a guest actually meets is `decideDoor`'s, so the checklist
  // is held to it.
  it("never shuts a door that production keeps open to a stranger, nor the reverse", () => {
    const stranger = (door: Door): DoorStanding => ({
      found: true,
      door,
      host: false,
      blocked: false,
      wasIn: false,
      in: false,
      waiting: false,
      listed: false,
      confirmed: true,
    });
    for (const door of ["open", "approve", "invite", "private"] as const) {
      const shut = decideDoor(stranger(door)).kind === "shut";
      expect(doorLetsGuestsIn({ ...FRESH, door, invited: 0 }), door).toBe(
        !shut,
      );
    }
  });

  it("holds Only me and paused uploads back from ready", () => {
    expect(readiness({ ...FRESH, opened: 3, door: "private" }).ready).toBe(
      false,
    );
    expect(
      readiness({ ...FRESH, opened: 3, acceptingUploads: false }).ready,
    ).toBe(false);
  });

  it("seeds the album when the reel plays, or with one photo when the reel is off", () => {
    const photos = (over: Partial<ReadyFacts>) =>
      readiness({ ...FRESH, ...over }).items.find((i) => i.id === "photos")!;
    expect(photos({ approved: 1, playable: 1 }).done).toBe(false);
    expect(photos({ approved: 1, playable: 1 }).line).toBe(
      "One more photo starts the highlight reel.",
    );
    expect(photos({ approved: 2, playable: 2 }).done).toBe(true);
    expect(photos({ approved: 2, playable: 2 }).line).toBe(
      "2 in the album, and the highlight reel is playing.",
    );
    expect(photos({ approved: 1, playable: 1, showReel: false }).done).toBe(
      true,
    );
    // The platform's lever off is a reel off, whatever the host's switch says.
    expect(
      photos({ approved: 1, playable: 1, liveReelEnabled: false }).line,
    ).toBe("1 in the album.");
  });

  it("lists room only once the shelf runs short, and waits on it only when full", () => {
    expect(ids({ ...FRESH, storagePct: 85 })).not.toContain("room");
    const short = readiness({ ...FRESH, opened: 1, storagePct: 92 });
    expect(short.left.map((i) => i.id)).toEqual(["room", "photos", "welcome"]);
    expect(short.ready).toBe(true);
    const full = readiness({ ...FRESH, opened: 1, storagePct: 100 });
    expect(full.items.map((i) => i.id).slice(0, 4)).toEqual([
      "door",
      "adds",
      "code",
      "room",
    ]);
    expect(full.ready).toBe(false);
  });
});

describe("the head every home reads", () => {
  it("counts what guests still need, then says ready and what is worth doing", () => {
    expect(readyHead(readiness(FRESH))).toEqual({
      title: "Before guests arrive",
      line: "Guests still need one more thing.",
    });
    expect(readyHead(readiness({ ...FRESH, door: "private" })).line).toBe(
      "Guests still need 2 more things.",
    );
    expect(readyHead(readiness({ ...FRESH, opened: 1 }))).toEqual({
      title: "Ready for guests",
      line: "2 things still worth doing.",
    });
    const done: ReadyFacts = {
      ...FRESH,
      opened: 1,
      approved: 3,
      playable: 3,
      eventDate: "2026-10-10",
      description: "Bring everything",
    };
    expect(readyHead(readiness(done))).toEqual({
      title: "Ready for guests",
      line: "Everything is set.",
    });
    expect(readiness(done).left).toEqual([]);
  });
});

describe("Settings' rail", () => {
  it("holds what Settings can finish: room stays the hub's and the plan's", () => {
    const full = { ...FRESH, opened: 1, storagePct: 100 };
    expect(readiness(full).ready).toBe(false);
    expect(settingsReadiness(full).ready).toBe(true);
    expect(settingsReadiness(full).items.map((i) => i.id)).not.toContain(
      "room",
    );
    expect(stepsLeft(full)).toBe(0);
  });

  it("counts for the hub's Settings card what a guest still needs, 0 once ready", () => {
    expect(stepsLeft(FRESH)).toBe(1);
    expect(
      stepsLeft({ ...FRESH, door: "private", acceptingUploads: false }),
    ).toBe(3);
    expect(stepsLeft({ ...FRESH, opened: 4 })).toBe(0);
  });

  it("says only what a step still wants, and nothing once it is ticked", () => {
    expect(stepWants("door", FRESH)).toBeNull();
    expect(stepWants("door", { ...FRESH, door: "private" })).toBe(
      "Nobody else can get in yet.",
    );
    expect(stepWants("door", { ...FRESH, door: "closed" })).toBe(
      "Nobody is in yet.",
    );
    expect(stepWants("door", { ...FRESH, door: "password" })).toBe(
      "No password set yet.",
    );
    expect(stepWants("adds", { ...FRESH, acceptingUploads: false })).toBeNull();
    expect(stepWants("photos", FRESH)).toBe(
      "It starts at two photos; none yet.",
    );
    expect(stepWants("photos", { ...FRESH, approved: 1, playable: 1 })).toBe(
      "One more photo starts it.",
    );
    // A reel turned off is never promised; the album's first photo is what the step waits on.
    expect(stepWants("photos", { ...FRESH, showReel: false })).toBe(
      "No photos in the album yet.",
    );
    expect(
      stepWants("photos", { ...FRESH, approved: 2, playable: 2 }),
    ).toBeNull();
    expect(stepWants("welcome", FRESH)).toBe("No date or note yet.");
    expect(stepWants("welcome", { ...FRESH, eventDate: "2026-10-10" })).toBe(
      "No note yet.",
    );
    expect(stepWants("welcome", { ...FRESH, description: "Hi" })).toBe(
      "No date yet.",
    );
    expect(stepWants("code", { ...FRESH, opened: 2 })).toBeNull();
  });
});

describe("when the checklist steps aside", () => {
  it("from the day after the event's date, done or not; an undated event keeps it", () => {
    expect(checklistOver("2026-10-10", "2026-10-09")).toBe(false);
    expect(checklistOver("2026-10-10", "2026-10-10")).toBe(false);
    expect(checklistOver("2026-10-10", "2026-10-11")).toBe(true);
    expect(checklistOver("2025-12-31", "2026-01-01")).toBe(true);
    expect(checklistOver(null, "2026-10-11")).toBe(false);
  });
});

describe("a new event, as Create hands it over", () => {
  it("reads what Create sent: the schema's defaults, nothing in it, never opened", () => {
    const sent = createEventSchema.parse({ name: "Maya's 30th" });
    const f = newEventFacts(sent);
    expect(f.door).toBe("open");
    expect(f.acceptingUploads).toBe(true);
    expect(f.opened).toBe(0);
    // Create asks for the name alone: an empty note and date are none, never "".
    expect(f.description).toBeNull();
    expect(f.eventDate).toBeNull();
    expect(readiness(f).left.map((i) => i.id)).toEqual([
      "code",
      "photos",
      "welcome",
    ]);
  });

  it("never reads a password it could not have stored", () => {
    // `createEvent` stores a password request as open: no hash exists yet.
    expect(
      newEventFacts({ visibility: "password", accepting_uploads: true }).door,
    ).toBe("open");
    expect(
      newEventFacts({ visibility: "private", accepting_uploads: false }),
    ).toMatchObject({ door: "private", acceptingUploads: false });
  });

  it("★ says room once the account runs short, as the hub's checklist does (create-wizard r2's carried `room`)", () => {
    // The route reads the account's storage and hands it over: past the dashboard's own threshold room
    // joins what is left (worth doing), at 100 a guest needs it; at or under the threshold, nothing.
    const sent = createEventSchema.parse({ name: "Maya's 30th" });
    expect(readiness(newEventFacts(sent)).left.map((i) => i.id)).not.toContain(
      "room",
    );
    expect(
      readiness(newEventFacts(sent, 85)).left.map((i) => i.id),
    ).not.toContain("room");
    const short = readiness(newEventFacts(sent, 92));
    expect(short.left.map((i) => i.id)).toEqual([
      "code",
      "room",
      "photos",
      "welcome",
    ]);
    expect(short.items.find((i) => i.id === "room")?.essential).toBe(false);
    expect(
      readiness(newEventFacts(sent, 100)).items.find((i) => i.id === "room")
        ?.essential,
    ).toBe(true);
  });
});

describe("Settings' five steps, laid out for a surface that draws them", () => {
  it("stands them in the rail's order, each the checklist item it finishes, titled as Settings titles it", () => {
    const steps = settingsSteps(readiness(FRESH));
    expect(steps.map((s) => s.item)).toEqual([
      "door",
      "adds",
      "photos",
      "welcome",
      "code",
    ]);
    expect(steps.map((s) => s.n)).toEqual([1, 2, 3, 4, 5]);
    expect(steps.map((s) => s.title)).toEqual([
      "Who can get in",
      "What guests can add",
      "Highlight reel",
      "This event",
      "The code",
    ]);
  });

  it("ticks a step exactly when its item is done, so the beat and Settings never disagree", () => {
    const fresh = settingsSteps(readiness(FRESH));
    expect(fresh.map((s) => s.done)).toEqual([true, true, false, false, false]);
    const scanned = settingsSteps(
      readiness({ ...FRESH, opened: 1, door: "private" }),
    );
    expect(scanned.map((s) => s.done)).toEqual([
      false,
      true,
      false,
      false,
      true,
    ]);
  });

  it("never draws room as a step: it is the plan's, said beside them", () => {
    const steps = settingsSteps(readiness({ ...FRESH, storagePct: 100 }));
    expect(steps).toHaveLength(5);
    expect(steps.map((s) => s.item)).not.toContain("room");
  });
});

describe("the account's storage, as the whole percent readiness reads", () => {
  it("is the dashboard meter's own math: active bytes over the cap, rounded, never past 100", () => {
    expect(storageUsedPct(920, 1000)).toBe(92);
    expect(storageUsedPct(854, 1000)).toBe(85);
    expect(storageUsedPct(1200, 1000)).toBe(100);
    expect(storageUsedPct(0, 1000)).toBe(0);
  });

  it("reads 0 where there is no cap to run short of", () => {
    expect(storageUsedPct(5000, null)).toBe(0);
    expect(storageUsedPct(5000, 0)).toBe(0);
  });
});

import { describe, expect, it } from "vitest";

import { decideDoor, type DoorStanding } from "@/lib/event/door/decide";
import { type Door, DOORS } from "@/lib/event/door/door";
import { GATE_LINES } from "@/lib/events/visibility-labels";

import {
  doorLetsGuestsIn,
  type JobEvent,
  nextJob,
  type ReadyFacts,
  readiness,
  readyWord,
} from "./readiness";

/**
 * THE BOARD'S PROPOSAL, HELD: what "ready" means and the never-empty job, as
 * the pure function the wiring would lift. The drawings all read it, so these
 * are the claims the board's pictures make.
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

const event = (over: Partial<JobEvent> = {}): JobEvent => ({
  id: "e1",
  name: "Maya's 30th",
  pending: 0,
  waiting: 0,
  reelItems: 0,
  ...FRESH,
  ...over,
});

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

  it("ticks the code at its first open, the host's own test scan included", () => {
    const code = (opened: number) =>
      readiness({ ...FRESH, opened }).items.find((i) => i.id === "code")!;
    expect(code(0).done).toBe(false);
    expect(code(0).actions.map((a) => a.to)).toEqual(["print", "share"]);
    expect(code(1).done).toBe(true);
    expect(code(1).line).toBe("Opened 1 time.");
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

  // ★ THE SCAR: the door item read an empty invite list as "nobody can get in
  // yet" while production lets anyone else ask to be let in. The decision a
  // guest actually meets is `decideDoor`'s, so the proposal is held to it.
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
    expect(photos({ approved: 1, playable: 1, showReel: false }).done).toBe(
      true,
    );
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
    expect(readiness({ ...FRESH, opened: 1, storagePct: 100 }).ready).toBe(
      false,
    );
  });
});

describe("what needs you, never empty", () => {
  const TODAY = "2026-10-02";

  it("names one job for every event before its date and in the month after it", () => {
    const states: Partial<JobEvent>[] = [
      {},
      {
        opened: 5,
        approved: 12,
        playable: 12,
        eventDate: "2026-10-10",
        description: "Hi",
      },
      { eventDate: "2026-09-26" },
      { door: "private" },
      { acceptingUploads: false },
      { pending: 4 },
      { waiting: 2 },
    ];
    for (const s of states) {
      const job = nextJob(event(s), TODAY);
      expect(job?.label.length).toBeGreaterThan(0);
      expect(job?.eventId).toBe("e1");
    }
  });

  it("lets a party long past go quiet until something waits", () => {
    const old = { eventDate: "2025-07-19", opened: 88, approved: 214 };
    expect(nextJob(event(old), TODAY)).toBeNull();
    expect(nextJob(event({ ...old, pending: 3 }), TODAY)?.kind).toBe("review");
    // The month after: its album, whatever the checklist left undone.
    expect(nextJob(event({ eventDate: "2026-09-26" }), TODAY)?.kind).toBe(
      "album",
    );
    expect(nextJob(event({ eventDate: "2026-09-02" }), TODAY)?.kind).toBe(
      "album",
    );
    expect(nextJob(event({ eventDate: "2026-09-01" }), TODAY)).toBeNull();
  });

  it("keeps production's order for what waits, first", () => {
    expect(nextJob(event({ waiting: 2, pending: 4 }), TODAY)?.kind).toBe(
      "door",
    );
    expect(nextJob(event({ pending: 4 }), TODAY)?.kind).toBe("review");
    expect(nextJob(event({ acceptingUploads: false }), TODAY)?.kind).toBe(
      "paused",
    );
    // The day before, the code's own step leads, as it does today.
    expect(nextJob(event({ eventDate: "2026-10-03" }), TODAY)?.kind).toBe(
      "print",
    );
  });

  it("then the checklist's first item left, its essentials first", () => {
    expect(nextJob(event(), TODAY)?.kind).toBe("code");
    expect(nextJob(event({ door: "private" }), TODAY)?.kind).toBe("door-shut");
    expect(nextJob(event({ opened: 2 }), TODAY)?.kind).toBe("photos");
    // An empty invite list is no job: anyone else can ask the host.
    expect(nextJob(event({ door: "invite", opened: 2 }), TODAY)?.kind).toBe(
      "photos",
    );
  });

  it("and, with nothing left, guests before the date", () => {
    const done = {
      opened: 5,
      approved: 12,
      playable: 12,
      description: "Bring everything",
    };
    expect(
      nextJob(event({ ...done, eventDate: "2026-10-10" }), TODAY)?.kind,
    ).toBe("invite");
    // Undated, the welcome still wants its date, so that is the job.
    expect(nextJob(event({ ...done, eventDate: null }), TODAY)?.kind).toBe(
      "welcome",
    );
  });

  it("counts what is left, or says ready", () => {
    expect(readyWord(event()).short).toBe("1 left");
    expect(readyWord(event({ opened: 1 })).short).toBe("Ready, 2 worth doing");
    expect(
      readyWord(
        event({
          opened: 1,
          approved: 3,
          playable: 3,
          eventDate: "2026-10-10",
          description: "Hi",
        }),
      ).short,
    ).toBe("Ready");
  });
});

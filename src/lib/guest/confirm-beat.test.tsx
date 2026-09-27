import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  confirmBeatToast,
  ELSEWHERE_LINE,
  lastClaimPlayedMoment,
  mergeConfirmBeats,
  onConfirmBeat,
  readTypedName,
  recordMomentPlayed,
  reportConfirmBeat,
  toldNameLine,
  type ConfirmBeat,
} from "@/lib/guest/confirm-beat";

// The claim's own module (whose sentence the lone toast keeps) reaches the browser client.
vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));

/**
 * ONE BEAT PER CONFIRMATION (`guest-capture` r1: `follow=card` "needs to work within any
 * multi-claim handling", `name=told`). What is pinned is the words the one toast says when no
 * moment card plays, and the plumbing that lets every door report to the one page that says it.
 */
beforeEach(() => {
  localStorage.clear();
});

describe("confirmBeatToast", () => {
  it("leads with the name her photographs now carry, in the board's words", () => {
    expect(confirmBeatToast({ name: "Priya", elsewhere: 0 })).toEqual({
      title: "You're on as Priya.",
    });
    expect(toldNameLine("Priya")).toBe("You're on as Priya.");
  });

  it("says the other events once, as the name's second line, never as a second toast", () => {
    expect(confirmBeatToast({ name: "Priya", elsewhere: 2 })).toEqual({
      title: "You're on as Priya.",
      description: ELSEWHERE_LINE,
    });
  });

  it("alone, the other events keep the claim's own sentence", () => {
    expect(confirmBeatToast({ name: null, elsewhere: 3 })).toEqual({
      title: "We added your uploads to your account.",
    });
  });

  it("has nothing to say about nothing", () => {
    expect(confirmBeatToast({ name: null, elsewhere: 0 })).toBeNull();
  });
});

describe("mergeConfirmBeats", () => {
  const beat = (b: Partial<ConfirmBeat>): ConfirmBeat => ({
    album: "a1",
    name: null,
    elsewhere: 0,
    ...b,
  });

  it("two beats before the page says either become one", () => {
    expect(
      mergeConfirmBeats(beat({ elsewhere: 2 }), beat({ name: "Priya" })),
    ).toEqual(beat({ name: "Priya", elsewhere: 2 }));
  });

  it("a beat for another album replaces, never mixes", () => {
    expect(
      mergeConfirmBeats(beat({ name: "Sam" }), beat({ album: "a2" })),
    ).toEqual(beat({ album: "a2" }));
  });
});

describe("the channel and the moment's record", () => {
  it("every listener hears a reported beat, and stops hearing once unsubscribed", () => {
    const heard: ConfirmBeat[] = [];
    const stop = onConfirmBeat((b) => heard.push(b));
    reportConfirmBeat({ album: "a1", name: "Priya", elsewhere: 0 });
    stop();
    reportConfirmBeat({ album: "a1", name: "Sam", elsewhere: 0 });
    expect(heard.map((b) => b.name)).toEqual(["Priya"]);
  });

  it("remembers, per album, whether the last claim played the moment", () => {
    recordMomentPlayed("a1", true);
    recordMomentPlayed("a2", false);
    expect(lastClaimPlayedMoment("a1")).toBe(true);
    expect(lastClaimPlayedMoment("a2")).toBe(false);
    expect(lastClaimPlayedMoment("never-heard")).toBe(false);
  });
});

describe("readTypedName", () => {
  it("reads the name this device typed at this album, trimmed, and nothing for a blank one", () => {
    localStorage.setItem("pr_guest_name_a1", "  Priya ");
    localStorage.setItem("pr_guest_name_a2", "   ");
    expect(readTypedName("a1")).toBe("Priya");
    expect(readTypedName("a2")).toBeNull();
    expect(readTypedName("a3")).toBeNull();
  });
});

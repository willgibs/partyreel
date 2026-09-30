import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  confirmBeatToast,
  ELSEWHERE_LINE,
  lastClaimPlayedMoment,
  leftForAddressWords,
  mergeConfirmBeats,
  onConfirmBeat,
  otherEventsLine,
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
    expect(confirmBeatToast({ name: null, elsewhere: 0, left: 0 })).toBeNull();
  });

  it("★ photos here left for the address typed with them: says where they are and how to keep them, and tells no name", () => {
    // crumbs-24, shared-claims' second Question: dana@work typed under "Dana" here, the keep confirmed
    // as dana@gmail. The claim rightly moves nothing; the beat must not say "You're on as Dana." over
    // photos that stay Unverified, and must never name the address, which the phone does not hold.
    const words = confirmBeatToast({ name: "Dana", elsewhere: 0, left: 3 });
    expect(words).toEqual({
      title: "Your 3 photos here were added with another email.",
      description:
        "They stay with the email you added with your name. Sign in with that email to keep them.",
    });
    expect(`${words?.title} ${words?.description}`).not.toMatch(
      /You're on as|@/,
    );
    expect(leftForAddressWords(1)).toEqual({
      title: "Your photo here was added with another email.",
      description:
        "It stays with the email you added with your name. Sign in with that email to keep it.",
    });
  });

  it('left photos and other events: the other events are said once, never "too" beside photos that did not move', () => {
    expect(confirmBeatToast({ name: null, elsewhere: 2, left: 1 })).toEqual({
      title: "Your photo here was added with another email.",
      description:
        "It stays with the email you added with your name. Sign in with that email to keep it. Your uploads from other events are in your account.",
    });
  });

  it("★ before her first upload: the toast (a confirmation that plays no moment) never speaks of the events waiting under her email", () => {
    // `identity-claims` r3: "Don't want too many complications around this, especially prior to
    // upload." The toast takes no count of them at all; whatever it is handed, it says nothing
    // that points to her dashboard.
    for (const name of [null, "Priya"]) {
      for (const elsewhere of [0, 1, 4]) {
        const words = confirmBeatToast({ name, elsewhere });
        const said = `${words?.title ?? ""} ${words?.description ?? ""}`;
        expect(said).not.toMatch(/dashboard|waiting/i);
      }
    }
  });
});

/**
 * THE OTHER EVENTS, SAID ONCE (`identity-claims` r3, Will's `pointer=line`, as his note shapes it:
 * "Simply acknowledging the existence of other events and allowing that to be handled back on the
 * dashboard later is enough"). Two facts can be about other events: her uploads there, which the
 * claim carried into her account, and events waiting under her email on her dashboard. The line is
 * true in each case and says "other events" at most once.
 */
describe("otherEventsLine", () => {
  const otherEvents = (line: string | null) =>
    (line?.match(/other events/g) ?? []).length;

  it("here only: nothing about other events", () => {
    expect(otherEventsLine({ elsewhere: 0, waiting: 0 })).toBeNull();
  });

  it("elsewhere only: the claim's other events, in the words the toast says too", () => {
    expect(otherEventsLine({ elsewhere: 3, waiting: 0 })).toBe(ELSEWHERE_LINE);
    expect(ELSEWHERE_LINE).toBe(
      "Your uploads from other events are in your account too.",
    );
  });

  it("waiting only: they are on her dashboard whenever she likes, counted as his tile counted them", () => {
    expect(otherEventsLine({ elsewhere: 0, waiting: 4 })).toBe(
      "4 more events have photos waiting on your dashboard, whenever you like.",
    );
    expect(otherEventsLine({ elsewhere: 0, waiting: 1 })).toBe(
      "Another event has photos waiting on your dashboard, whenever you like.",
    );
    expect(otherEventsLine({ elsewhere: 0, waiting: 1234 })).toBe(
      "1,234 more events have photos waiting on your dashboard, whenever you like.",
    );
  });

  it("both: one line says both, and says other events once", () => {
    const four = otherEventsLine({ elsewhere: 2, waiting: 4 });
    expect(four).toBe(
      "Your uploads from other events are in your account too, and 4 more events have photos waiting on your dashboard, whenever you like.",
    );
    expect(otherEvents(four)).toBe(1);
    expect(otherEventsLine({ elsewhere: 1, waiting: 1 })).toBe(
      "Your uploads from other events are in your account too, and another event has photos waiting on your dashboard, whenever you like.",
    );
  });

  it("every case says other events at most once", () => {
    for (const elsewhere of [0, 1, 2]) {
      for (const waiting of [0, 1, 4]) {
        expect(
          otherEvents(otherEventsLine({ elsewhere, waiting })),
        ).toBeLessThanOrEqual(1);
      }
    }
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

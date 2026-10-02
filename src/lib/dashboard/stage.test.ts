import { describe, expect, it } from "vitest";

import { itemFor } from "./attention";
import { readyFactsOf } from "./home-event";
import {
  stageActsOf,
  stageDateLine,
  stageNumbersOf,
  stageTicksOf,
  stageWordsOf,
} from "./stage";
import { homeContext, homeEvent } from "./testing/home";
import { phaseOfEvent } from "./when";

/**
 * THE STAGE'S WORDS (host-dashboard r1, `purpose=stage`): what the stage says over the name, the numbers
 * that move, the ticks before the day and the acts. What leads is `moment.test.ts`'s; this pins what
 * the stage then says about it, honest at every hour and for an undated album too.
 */

const FRIDAY = "2026-10-02";
const afternoon = homeContext(FRIDAY);
const evening = homeContext(FRIDAY, { evening: true });

const words = (e: ReturnType<typeof homeEvent>, ctx = afternoon) =>
  stageWordsOf(e, phaseOfEvent(e, ctx.today), ctx);

describe("the words over the name", () => {
  const tonight = homeEvent({ date: FRIDAY });

  it("says live tonight from the evening of a dated party, with its last hour beside it", () => {
    expect(words(tonight, evening)).toEqual({
      word: "Live tonight",
      live: true,
      pulse: null,
    });
    expect(
      words({ ...tonight, arrivals: { today: 90, lastHour: 31 } }, evening),
    ).toEqual({ word: "Live tonight", live: true, pulse: 31 });
  });

  it("says today, and live only while photographs land, before the evening", () => {
    expect(words(tonight)).toEqual({ word: "Today", live: false, pulse: null });
    expect(words({ ...tonight, arrivals: { today: 4, lastHour: 4 } })).toEqual({
      word: "Live today",
      live: true,
      pulse: 4,
    });
  });

  it("★ never claims an undated album's evening: its day is its photographs', not a date", () => {
    const album = homeEvent({
      approved: 30,
      lastArrival: { at: "2026-10-02T20:00:00Z", day: FRIDAY },
    });
    expect(words(album, evening)).toEqual({
      word: "Today",
      live: false,
      pulse: null,
    });
    expect(
      words({ ...album, arrivals: { today: 30, lastHour: 9 } }, evening),
    ).toEqual({ word: "Live today", live: true, pulse: 9 });
  });

  it("counts down before, and dates the past", () => {
    expect(words(homeEvent({ date: "2026-10-03" })).word).toBe("Tomorrow");
    expect(words(homeEvent({ date: "2026-10-06" })).word).toBe("Tuesday");
    expect(words(homeEvent({ date: "2026-10-14" })).word).toBe("In 12 days");
    expect(words(homeEvent({ date: "2026-10-01" })).word).toBe("Yesterday");
    expect(words(homeEvent({ date: "2025-06-07" })).word).toBe("Jun 2025");
    expect(words(homeEvent()).word).toBe("No date yet");
  });

  it("dates the line under the name in full, with a year that is not this one", () => {
    expect(stageDateLine(homeEvent({ date: "2026-10-03" }), FRIDAY)).toBe(
      "Saturday, October 3",
    );
    expect(stageDateLine(homeEvent({ date: "2025-10-03" }), FRIDAY)).toBe(
      "Friday, October 3, 2025",
    );
    expect(stageDateLine(homeEvent(), FRIDAY)).toBeNull();
  });
});

describe("the numbers that move", () => {
  it("count the album, never as photos, with who came and who waits", () => {
    const e = homeEvent({
      date: FRIDAY,
      approved: 142,
      waiting: 2,
      pending: 5,
    });
    expect(stageNumbersOf(e, "live", 23)).toEqual([
      { key: "album", label: "in the album", value: 142 },
      { key: "guests", label: "guests", value: 23 },
      { key: "door", label: "at the door", value: 2, tone: "waiting" },
      { key: "review", label: "to review", value: 5, tone: "waiting" },
    ]);
  });

  it("leave out a guest count that was not read, and stand aside for the ticks before the day", () => {
    const e = homeEvent({ approved: 3 });
    expect(stageNumbersOf(e, "after", null).map((n) => n.key)).toEqual([
      "album",
    ]);
    expect(stageNumbersOf(e, "before", 4)).toEqual([]);
  });
});

describe("the ticks before the day", () => {
  it("are readiness's essentials, a word each, and say when all are done", () => {
    const ready = stageTicksOf(
      readyFactsOf(homeEvent({ date: "2026-10-03" }), afternoon),
    );
    expect(ready?.ticks.map((t) => [t.word, t.done])).toEqual([
      ["Door", true],
      ["Uploads", true],
      ["Code", true],
    ]);
    expect(ready?.ready).toBe(true);

    const notYet = stageTicksOf(
      readyFactsOf(
        homeEvent({ date: "2026-10-03", ready: { opened: 0, guestsIn: 0 } }),
        homeContext(FRIDAY, { storagePct: 100 }),
      ),
    );
    expect(notYet?.ticks.map((t) => [t.word, t.done])).toEqual([
      ["Door", true],
      ["Uploads", true],
      ["Code", false],
      ["Room", false],
    ]);
    expect(notYet?.ready).toBe(false);
  });

  it("are not drawn where readiness was not read", () => {
    expect(
      stageTicksOf(readyFactsOf(homeEvent({ ready: null }), afternoon)),
    ).toBeNull();
  });
});

describe("the acts", () => {
  const acts = (e: ReturnType<typeof homeEvent>) =>
    stageActsOf(e, phaseOfEvent(e, FRIDAY), itemFor(e, afternoon));

  it("lets the waiting in, with their number, the event's own one press behind", () => {
    expect(acts(homeEvent({ date: FRIDAY, waiting: 2 }))).toEqual({
      primary: { label: "Let 2 in", to: "guests" },
      secondary: { label: "Open", to: "hub" },
    });
    expect(
      acts(homeEvent({ date: "2025-01-01", pending: 18 })).primary,
    ).toEqual({ label: "Review 18", to: "review" });
  });

  it("invites and prints a code nobody has opened", () => {
    expect(
      acts(
        homeEvent({ date: "2026-10-05", ready: { opened: 0, guestsIn: 0 } }),
      ),
    ).toEqual({
      primary: { label: "Invite", to: "invite" },
      secondary: { label: "Print", to: "print" },
    });
  });

  it("asks nothing of a quiet event but its phase's own act", () => {
    expect(acts(homeEvent({ date: "2026-10-09" })).primary.label).toBe(
      "Invite",
    );
    expect(
      acts(homeEvent({ date: FRIDAY, approved: 40, playable: 2 })),
    ).toEqual({
      primary: { label: "Open", to: "hub" },
      secondary: null,
    });
    expect(
      acts(homeEvent({ date: "2026-09-26", approved: 300 })).primary,
    ).toEqual({
      label: "Share the album",
      to: "invite",
    });
  });
});

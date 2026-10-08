/**
 * THE CAMERA'S WORDS: the album's reveal decides what a shot is told, and the develop time is said from now.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { browserZone } from "@/lib/event/zone";
import { ROLL_MAX, ROLL_MIN, rollSpentMessage } from "@/lib/disposable/roll";

import { reelCells } from "./reel";
import { rollView } from "./roll-view";
import {
  addWords,
  afterShotHint,
  CAMERA_HINT,
  cameraSubLine,
  clockWords,
  developsWhen,
  freeAFrameLine,
  freshRollLine,
  newestShotLabel,
  reelCaption,
  reelLabel,
  removingSpentLine,
  reshootsLeft,
  reshootsSpentLine,
  revealFor,
  rollCount,
  rollDoneLine,
  SHOT_WORDS,
  shotsCountLine,
  shotsWaitingLine,
  TAKE_BACK,
  takeBackLine,
  takenBackLine,
  unsentLine,
  yourShotsLine,
} from "./words";

/** 10:40 pm on a Saturday, the party's clock (local time, as the guest's browser keeps it). */
const PARTY = new Date(2026, 5, 13, 22, 40).getTime();
const NINE_AM = new Date(2026, 5, 14, 9, 0).toISOString();

describe("revealFor", () => {
  it("is the develop while a develop time is ahead, whatever the review switch says", () => {
    expect(
      revealFor({ develops_at: NINE_AM, moderation_mode: "live" }, PARTY),
    ).toBe("develop");
    expect(
      revealFor(
        { develops_at: NINE_AM, moderation_mode: "hold_for_approval" },
        PARTY,
      ),
    ).toBe("develop");
  });
  it("is the host's approval, or straight in, once there is no develop ahead", () => {
    const after = new Date(2026, 5, 14, 9, 30).getTime();
    expect(
      revealFor({ develops_at: NINE_AM, moderation_mode: "live" }, after),
    ).toBe("live");
    expect(
      revealFor(
        { develops_at: null, moderation_mode: "hold_for_approval" },
        PARTY,
      ),
    ).toBe("approve");
    expect(revealFor({}, PARTY)).toBe("live");
  });
});

describe("the develop time, said from now", () => {
  it("says a clock as a person does", () => {
    expect(clockWords(new Date(2026, 5, 14, 9, 0))).toBe("9 am");
    expect(clockWords(new Date(2026, 5, 14, 21, 30))).toBe("9:30 pm");
    expect(clockWords(new Date(2026, 5, 14, 12, 0))).toBe("12 pm");
    expect(clockWords(new Date(2026, 5, 14, 0, 5))).toBe("12:05 am");
  });
  it("needs no day today, says tomorrow, a weekday inside a week, then the date", () => {
    // PARTY is 10:40 pm Saturday: Sunday's 9 am is tomorrow's, ten hours on.
    expect(developsWhen(NINE_AM, PARTY)).toBe("tomorrow at 9 am");
    expect(developsWhen(new Date(2026, 5, 17, 9, 0).toISOString(), PARTY)).toBe(
      "Wednesday at 9 am",
    );
    expect(developsWhen(new Date(2026, 6, 4, 9, 0).toISOString(), PARTY)).toBe(
      "Jul 4 at 9 am",
    );
  });

  /* ★ THE DAY IS HERS, NOT 24 HOURS (red-team 46's NIT): at Saturday 11:50 am a Sunday 9 am develop read "at 9 am" (it
     is under a day away), three hours after today's 9 am. A day is the calendar's in her own clock, so the words turn
     at her midnight, and a clock pinned either side of it says which. */
  it("★ says tomorrow for tomorrow's 9 am though it is under a day away, and at 9 am only for today's", () => {
    const sat1150 = new Date(2026, 9, 10, 11, 50).getTime();
    const sunday9 = new Date(2026, 9, 11, 9, 0).toISOString();
    const saturday9pm = new Date(2026, 9, 10, 21, 0).toISOString();
    expect(developsWhen(sunday9, sat1150)).toBe("tomorrow at 9 am");
    expect(developsWhen(saturday9pm, sat1150)).toBe("at 9 pm");
  });

  it("★ turns at her midnight: tomorrow's 9 am one minute before it, today's one minute after", () => {
    const sunday9 = new Date(2026, 9, 11, 9, 0).toISOString();
    const before = new Date(2026, 9, 10, 23, 59).getTime();
    const after = new Date(2026, 9, 11, 0, 1).getTime();
    expect(developsWhen(sunday9, before)).toBe("tomorrow at 9 am");
    expect(developsWhen(sunday9, after)).toBe("at 9 am");
  });

  it("★ a develop past midnight on the far side of a day is tomorrow's too, however near the clocks sit", () => {
    // 11:58 pm to 12:05 am: seven minutes, and a day's turn.
    const justAfter = new Date(2026, 9, 11, 0, 5).toISOString();
    expect(
      developsWhen(justAfter, new Date(2026, 9, 10, 23, 58).getTime()),
    ).toBe("tomorrow at 12:05 am");
  });

  it("the week says its day by the calendar: two days on is a weekday, a week on is a date, never today's own name", () => {
    const sat1150 = new Date(2026, 9, 10, 11, 50).getTime();
    expect(
      developsWhen(new Date(2026, 9, 12, 9, 0).toISOString(), sat1150),
    ).toBe("Monday at 9 am");
    expect(
      developsWhen(new Date(2026, 9, 16, 21, 0).toISOString(), sat1150),
    ).toBe("Friday at 9 pm");
    // Next Saturday is under seven days of hours away, and "Saturday" would be today's own name.
    expect(
      developsWhen(new Date(2026, 9, 17, 9, 0).toISOString(), sat1150),
    ).toBe("Oct 17 at 9 am");
  });

  it("★ a day is a day across the clocks' change (the autumn day that holds 25 hours)", () => {
    // 2026-11-01 is the US fall-back; whatever the zone this runs in, the calendar's tomorrow is tomorrow.
    const sat = new Date(2026, 9, 31, 23, 30).getTime();
    expect(developsWhen(new Date(2026, 10, 1, 9, 0).toISOString(), sat)).toBe(
      "tomorrow at 9 am",
    );
    const sun = new Date(2026, 10, 1, 23, 30).getTime();
    expect(developsWhen(new Date(2026, 10, 2, 9, 0).toISOString(), sun)).toBe(
      "tomorrow at 9 am",
    );
  });
});

/* THE ALBUM'S ONE ADD (red-team 46's NIT): See it as a guest said "Take the first photo" over 102 developing shots, where a
   newcomer reads "Take photos"; the view and the guest page word it from one function's four phrases. */
describe("the album's one Add", () => {
  it("says Take at the album's camera and Add elsewhere, and the first photo only over an album nothing was added to", () => {
    expect(addWords({ camera: true, empty: false })).toBe("Take photos");
    expect(addWords({ camera: true, empty: true })).toBe(
      "Take the first photo",
    );
    expect(addWords({ camera: false, empty: false })).toBe("Add photos");
    expect(addWords({ camera: false, empty: true })).toBe(
      "Add the first photo",
    );
  });

  /* ★ RESHAPED ON PURPOSE (crumbs-61, red-team 48's NIT): the page carried the four phrases inline and a grep held them to
     this function's, which is two homes for one string. Its scar is kept (the view and the page cannot word the Add apart
     again) the surer way: the page CALLS the function, and none of its phrases is written there. */
  it("★ the guest page words it from this function, never from four phrases of its own", () => {
    const page = readFileSync(
      join(process.cwd(), "src/components/guest/event-experience.tsx"),
      "utf8",
    );
    expect(page).toContain("addWords({");
    for (const camera of [true, false]) {
      for (const empty of [true, false]) {
        expect(page).not.toContain(`"${addWords({ camera, empty })}"`);
      }
    }
  });
});

describe("the lines", () => {
  it("names the album's reveal under the event's name", () => {
    const base = { recording: false, done: false, nowMs: PARTY };
    expect(
      cameraSubLine({ ...base, reveal: "develop", developsAt: NINE_AM }),
    ).toBe("Develops tomorrow at 9 am");
    expect(
      cameraSubLine({ ...base, reveal: "approve", developsAt: null }),
    ).toBe("The host approves each shot");
    expect(cameraSubLine({ ...base, reveal: "live", developsAt: null })).toBe(
      "Every shot goes straight in",
    );
    expect(
      cameraSubLine({
        ...base,
        recording: true,
        reveal: "live",
        developsAt: null,
      }),
    ).toBe("Filming");
    expect(
      cameraSubLine({ ...base, done: true, reveal: "live", developsAt: null }),
    ).toBe("Your roll is done");
  });

  it("ends the roll with when it comes back", () => {
    expect(
      rollDoneLine({
        held: 24,
        reveal: "develop",
        developsAt: NINE_AM,
        nowMs: PARTY,
      }),
    ).toBe(
      "24 shots, developing with everyone’s. They’re back tomorrow at 9 am.",
    );
    expect(
      rollDoneLine({ held: 24, reveal: "approve", developsAt: null }),
    ).toBe("24 shots, waiting for the host.");
    expect(rollDoneLine({ held: 1, reveal: "live", developsAt: null })).toBe(
      "1 shot, all in the album.",
    );
    // ★ A roll the host made smaller after she shot (red-team 56's LOW): her two shots are two, never "1 shot".
    expect(rollDoneLine({ held: 2, reveal: "live", developsAt: null })).toBe(
      "2 shots, all in the album.",
    );
  });

  it("★ at the held door says her shots go in once she is let in, never straight in (crumbs-85)", () => {
    const base = { developsAt: null, recording: false, done: false };
    expect(cameraSubLine({ ...base, reveal: "door" })).toBe(
      "They go in once you’re let in",
    );
    expect(yourShotsLine({ reveal: "door", developsAt: null })).toBe(
      "They go in once you’re let in.",
    );
    expect(rollDoneLine({ held: 3, reveal: "door", developsAt: null })).toBe(
      "3 shots. They go in once you’re let in.",
    );
  });

  it("★ a far party's develop time is said in both clocks; a party in her own zone, or none, in hers (crumbs-85)", () => {
    const zone = vi.spyOn(browserZone, "zoneName");
    try {
      zone.mockReturnValue("America/Los_Angeles");
      const at = "2026-10-04T01:00:00.000Z";
      expect(
        developsWhen(at, Date.parse(at) - 3_600_000, "Asia/Makassar"),
      ).toBe("Sun, Oct 4 at 9 am in Makassar, Sat 6 pm yours");
      expect(
        cameraSubLine({
          reveal: "develop",
          developsAt: at,
          recording: false,
          done: false,
          zone: "Asia/Makassar",
        }),
      ).toBe("Develops Sun, Oct 4 at 9 am in Makassar, Sat 6 pm yours");
      // Her own zone, or no zone at all: her own clock, as always.
      const near = developsWhen(at, Date.parse(at) - 3_600_000);
      expect(
        developsWhen(at, Date.parse(at) - 3_600_000, "America/Los_Angeles"),
      ).toBe(near);
      expect(near).not.toMatch(/yours/);
    } finally {
      zone.mockRestore();
    }
  });

  it("says what her shots are waiting for", () => {
    expect(
      yourShotsLine({ reveal: "develop", developsAt: NINE_AM, nowMs: PARTY }),
    ).toBe("Only you can see these until they develop tomorrow at 9 am.");
  });

  it("counts the frames and what is still on its way", () => {
    const base = { cap: 24, done: false, host: false, sending: 0 };
    expect(reelCaption({ ...base, frame: 7 })).toBe("Frame 7 of 24");
    expect(reelCaption({ ...base, frame: 9, sending: 2 })).toBe(
      "Frame 9 of 24 · sending 2",
    );
    expect(reelCaption({ ...base, frame: 24, done: true })).toBe("24 of 24");
    // A roll the ceiling ended with a frame free (her re-shoots spent): what she holds, never the roll's size.
    expect(reelCaption({ ...base, held: 23, frame: 24, done: true })).toBe(
      "23 of 24",
    );
    // ★ Two shots under a roll of 1 (red-team 56's LOW): what she holds, never "1 of 1" beside two shots.
    expect(
      reelCaption({ ...base, cap: 1, held: 2, frame: 1, done: true }),
    ).toBe("2 on a roll of 1");
    expect(rollCount(1, 1)).toBe("1 of 1");
    expect(rollCount(6, 24)).toBe("6 of 24");
    expect(reelCaption({ ...base, frame: 4, host: true })).toBe(
      "No roll for the host",
    );
  });

  /* ★ RESHAPED ON PURPOSE (red-team 44's NIT; scar kept: the press says the shot in its own frame, the host's as a
     guest's): a guest's said "Shot 6 is on the roll." at the press, and the server then refused it (the album closed to
     uploads, a roll spent from another tab), both lines inside a second. The press says only what is true at the
     press, that the shot was taken; the roll's count and a refusal's own words say the rest. */
  it("★ says a shot as taken, never on the roll the server has not counted it on yet", () => {
    expect(afterShotHint(7)).toBe("Shot 7 taken.");
    expect(CAMERA_HINT.afterVideo).toBe("Video taken.");
    expect(afterShotHint(7)).not.toMatch(/roll/);
    expect(CAMERA_HINT.afterVideo).not.toMatch(/roll/);
  });

  it("says a failure and the reel's name", () => {
    expect(unsentLine(1)).toBe("1 shot didn’t send.");
    expect(unsentLine(3)).toBe("3 shots didn’t send.");
    expect(reelLabel(6)).toBe("Your shots, 6 on the roll");
    expect(reelLabel(2, true)).toBe("Your shots, 2 taken");
  });
});

/**
 * ★ A ROLL IN A DEAD ZONE (no-signal r1, Will's `roll=taken`): every press spends a frame at once, sent or not, so the
 * camera says what waits for the line in the state's own word, with no press, its caption counts what waits, its end
 * says the wait first, and her list says each one waits, in the queue's own word.
 */
describe("the roll in a dead zone", () => {
  it("★ the line under the shutter says the shots wait and go by themselves, never a press", () => {
    expect(shotsWaitingLine(1)).toBe(
      "No connection: your shot waits, and goes in once it’s back.",
    );
    expect(shotsWaitingLine(4)).toBe(
      "No connection: 4 shots wait, and go in once it’s back.",
    );
    expect(shotsWaitingLine(4)).not.toMatch(/retry|try again|didn/i);
  });

  it("★ the caption counts what waits, said over anything still sending", () => {
    const base = { cap: 24, done: false, host: false, sending: 0 };
    expect(reelCaption({ ...base, frame: 23, waiting: 2 })).toBe(
      "Frame 23 of 24 · 2 waiting",
    );
    expect(reelCaption({ ...base, frame: 24, done: true, waiting: 4 })).toBe(
      "24 of 24 · 4 waiting",
    );
    expect(reelCaption({ ...base, frame: 9, sending: 1, waiting: 0 })).toBe(
      "Frame 9 of 24 · sending 1",
    );
  });

  it("★ the roll's end says the wait first, then how the roll comes back, in every album's truth", () => {
    expect(
      rollDoneLine({
        held: 24,
        reveal: "develop",
        developsAt: NINE_AM,
        nowMs: PARTY,
        waiting: 4,
      }),
    ).toBe(
      "24 shots; 4 wait for your connection, then develop with everyone’s. They’re back tomorrow at 9 am.",
    );
    expect(
      rollDoneLine({
        held: 24,
        reveal: "develop",
        developsAt: NINE_AM,
        nowMs: PARTY,
        waiting: 1,
      }),
    ).toBe(
      "24 shots; 1 waits for your connection, then develops with everyone’s. They’re back tomorrow at 9 am.",
    );
    expect(
      rollDoneLine({
        held: 24,
        reveal: "approve",
        developsAt: null,
        waiting: 2,
      }),
    ).toBe("24 shots; 2 wait for your connection, then wait for the host.");
    expect(
      rollDoneLine({ held: 12, reveal: "live", developsAt: null, waiting: 1 }),
    ).toBe("12 shots; 1 waits for your connection, then goes into the album.");
    // Nothing waits: the roll's own end, as ever.
    expect(
      rollDoneLine({ held: 24, reveal: "live", developsAt: null, waiting: 0 }),
    ).toBe("24 shots, all in the album.");
    // At the held door nothing is sent anyway: the door's own end.
    expect(
      rollDoneLine({ held: 3, reveal: "door", developsAt: null, waiting: 3 }),
    ).toBe("3 shots. They go in once you’re let in.");
  });

  it("her list says a waiting shot in the state's own word, short enough for a tile of three across", () => {
    expect(SHOT_WORDS.waiting).toBe("No connection");
  });
});

/**
 * ★ ANY ROLL A HOST MAY NAME (customize r1's `roll=both`: 1 to 99): the camera's count, its caption, its end and the
 * server's refusal say a roll of one and a roll of 99 as they say film's 24, and the reel draws every frame of either.
 */
describe("the camera at any roll a host may name", () => {
  it("counts, ends and refuses a roll of one and of ninety-nine in the same words", () => {
    for (const cap of [ROLL_MIN, 12, 36, 50, ROLL_MAX]) {
      const base = { cap, done: false, host: false, sending: 0 };
      expect(reelCaption({ ...base, frame: 1 })).toBe(`Frame 1 of ${cap}`);
      expect(reelCaption({ ...base, frame: cap, done: true })).toBe(
        `${cap} of ${cap}`,
      );
      expect(
        reelCells({ cap, used: 0, recording: false, recent: [] }),
      ).toHaveLength(cap);
      expect(rollView({ server: null, rollSize: cap, pending: 0 }).cap).toBe(
        cap,
      );
    }
    expect(
      rollDoneLine({ held: ROLL_MIN, reveal: "live", developsAt: null }),
    ).toBe("1 shot, all in the album.");
    expect(
      rollDoneLine({ held: ROLL_MAX, reveal: "live", developsAt: null }),
    ).toBe("99 shots, all in the album.");
    expect(
      rollView({ server: null, rollSize: ROLL_MAX, pending: ROLL_MAX }).refusal,
    ).toBe(rollSpentMessage(ROLL_MAX));
  });
});

/* ── her 3 re-shoots, said where she takes one back (guest-moments r1's `limit=three` and `where=reel`) ─────────── */
describe("her re-shoots", () => {
  it("counts them as a number she can hold, at her list's head", () => {
    expect(reshootsLeft(3)).toBe("3 re\u2011shoots left");
    expect(reshootsLeft(1)).toBe("1 re\u2011shoot left");
    expect(reshootsLeft(0)).toBe("No re\u2011shoots left");
    expect(shotsCountLine(6, 24, 2)).toBe("6 of 24 · 2 re\u2011shoots left");
    expect(shotsCountLine(2, 1, 0)).toBe(
      "2 on a roll of 1 · No re\u2011shoots left",
    );
  });

  it("says at the roll's end what a take-back still frees, and when they are spent", () => {
    expect(freeAFrameLine(3)).toBe(
      "Take a shot back to free its frame: 3 re\u2011shoots left.",
    );
    expect(freeAFrameLine(1)).toBe(
      "Take a shot back to free its frame: 1 re\u2011shoot left.",
    );
    expect(reshootsSpentLine(3)).toBe("Your 3 re\u2011shoots are used.");
    expect(reshootsSpentLine(1)).toBe("Your 1 re\u2011shoot is used.");
    expect(removingSpentLine(3)).toBe(
      "Your 3 re\u2011shoots are used, so removing a shot won’t free its frame.",
    );
  });

  it.each([
    [
      { reshoots: 3, allowance: 3, frees: true },
      "Taking it back frees its frame: 1 of your 3 re\u2011shoots.",
    ],
    [
      { reshoots: 2, allowance: 3, frees: true },
      "Taking it back frees its frame: 1 of your 2 re\u2011shoots left.",
    ],
    [
      { reshoots: 1, allowance: 3, frees: true },
      "Taking it back frees its frame: your last re\u2011shoot.",
    ],
    [
      { reshoots: 0, allowance: 3, frees: false },
      "Your 3 re\u2011shoots are used: taking it back won’t free its frame.",
    ],
    [
      { reshoots: 2, allowance: 3, frees: false },
      "Your roll is smaller now: taking it back won’t free a frame.",
    ],
  ])(
    "the newest shot's sheet says what taking it back does: %o",
    (input, line) => {
      expect(takeBackLine(input)).toBe(line);
    },
  );

  it("names the sheet's keys and the reel's newest frame, and says what is left once one is taken back", () => {
    expect([TAKE_BACK.take, TAKE_BACK.keep]).toEqual([
      "Take it back",
      "Keep it",
    ]);
    // Working words, never an ellipsis: the key's arc says it goes on.
    expect(TAKE_BACK.taking).toBe("Taking it back");
    expect(newestShotLabel("10:41")).toBe("Your newest shot, 10:41");
    expect(newestShotLabel()).toBe("Your newest shot");
    expect(takenBackLine({ reshoots: 2, freed: true })).toBe(
      "Taken back. 2 re\u2011shoots left.",
    );
    expect(takenBackLine({ reshoots: 0, freed: true })).toBe(
      "Taken back. No re\u2011shoots left.",
    );
    expect(takenBackLine({ reshoots: 0, freed: false })).toBe("Taken back.");
  });
});

/* ── a fresh roll, said once (host-moments r1's `fresh-roll=panel`) ─────────────────────────────────────────────── */
describe("a fresh roll", () => {
  it("says why it started again and when it develops, in the drawing's words", () => {
    expect(
      freshRollLine({
        host: "Maya",
        roll: 24,
        reveal: "develop",
        developsAt: NINE_AM,
        nowMs: PARTY,
      }),
    ).toBe(
      "Maya set a develop time, so everyone starts again with 24 shots. Everything develops together tomorrow at 9 am.",
    );
  });

  it("names the host where the page holds no name, and a camera started again with no develop says only the roll", () => {
    expect(
      freshRollLine({
        host: null,
        roll: 1,
        reveal: "develop",
        developsAt: NINE_AM,
        nowMs: PARTY,
      }),
    ).toMatch(
      /^The host set a develop time, so everyone starts again with 1 shot\./,
    );
    expect(
      freshRollLine({ host: "  ", roll: 12, reveal: "live", developsAt: null }),
    ).toBe(
      "The host started the camera again, so everyone starts again with 12 shots.",
    );
  });
});

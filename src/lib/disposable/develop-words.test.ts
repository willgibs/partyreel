/**
 * THE DEVELOP TIME'S WORDS, THE HOST'S FORMAT: her Settings says the time through this one function ("Develops Sat,
 * Oct 3, 9:00 AM."), and every guest screen through the wait's own words (`wait-words.ts`), so neither side's sentences
 * can drift from the format it reads.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEVELOP_TITLES,
  developClockLine,
  developSentence,
  developTimeWords,
} from "@/lib/disposable/develop-words";
import { WAIT_TITLE } from "@/lib/disposable/wait-words";

describe("developTimeWords", () => {
  // A time built in the machine's own zone, so the answer cannot depend on where the suite runs: the words are
  // the viewer's, never the server's.
  const saturdayMorning = new Date(2026, 9, 3, 9, 0);

  it("says a time as weekday, month, day and the hour, in 12-hour words (a space, or the narrow one ICU now writes)", () => {
    expect(developTimeWords(saturdayMorning.toISOString())).toMatch(
      /^Sat, Oct 3, 9:00\s[AP]M$/,
    );
    expect(
      developTimeWords(new Date(2026, 9, 3, 21, 30).toISOString()),
    ).toMatch(/^Sat, Oct 3, 9:30\sPM$/);
  });

  it("reads the instant, however the wire spells it", () => {
    expect(developTimeWords("2026-10-03T09:00:00Z")).toBe(
      developTimeWords("2026-10-03T05:00:00-04:00"),
    );
    expect(developTimeWords("2026-10-03T09:00:00.000+00:00")).toBe(
      developTimeWords("2026-10-03T09:00:00Z"),
    );
  });

  it("is nothing for no time, or a time it cannot read, never a throw", () => {
    expect(developTimeWords(null)).toBeNull();
    expect(developTimeWords(undefined)).toBeNull();
    expect(developTimeWords("")).toBeNull();
    expect(developTimeWords("not a time")).toBeNull();
  });
});

/* RESHAPED (the-wait r1, Will's `model=time`): the guest's tracker and keep said the host's own format ("when it
   develops, Sat, Oct 3, 9:00 AM"); every guest screen now says the wait in one set of words (`wait-words.ts`: "All at
   once at 9 am"), its time from now as the album's camera always said it (`developsWhen`). The scar kept: each side
   says the time through ONE home of its own, and no screen builds a formatter: the host's Settings through this file,
   every guest screen through the wait's words. */
describe("one home for each side's develop words", () => {
  const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
  const HOST = [
    // The host's Settings: "Develops ..." and "Developed ...".
    "src/components/app/event-settings/camera-settings.tsx",
  ];
  const GUEST = [
    // Her tracker, the keep, the failure sheet, the album's rule and its sheet: the wait's one set of words.
    "src/components/guest/upload-tracker.tsx",
    "src/components/guest/save-account-prompt.tsx",
    "src/components/guest/upload/failure-sheet.tsx",
    "src/components/guest/gallery-empty-state-wait.tsx",
    "src/components/guest/gallery-empty-state-sheet.tsx",
  ];

  it("the host's Settings reads its words from here, and builds no formatter of its own", () => {
    for (const rel of HOST) {
      const source = read(rel);
      expect(source, `${rel} stopped reading develop-words`).toContain(
        "@/lib/disposable/develop-words",
      );
      expect(source, `${rel} formats the time itself`).not.toMatch(
        /Intl\.DateTimeFormat|toLocale(?:Date|Time)?String/,
      );
    }
  });

  it("every guest screen reads the wait's words, and none builds a formatter of its own", () => {
    for (const rel of GUEST) {
      const source = read(rel);
      expect(source, `${rel} stopped reading the wait's words`).toContain(
        "@/lib/disposable/wait-words",
      );
      expect(source, `${rel} formats the time itself`).not.toMatch(
        /Intl\.DateTimeFormat|toLocale(?:Date|Time)?String/,
      );
    }
  });
});

/* THE ARRIVAL'S WORDS (the-wait r2, Will's `arrival=in-place`): the sheet's word turning, its clock as the night said
   it, and what a screen reader hears; every time in them the wait's own words, so this side builds no formatter. */
describe("the develop's own words", () => {
  // Times built in the machine's own zone, so the words cannot depend on where the suite runs.
  const nineAm = new Date(2026, 9, 4, 9, 0);
  const iso = nineAm.toISOString();
  const later = (days: number, hours = 1) =>
    new Date(2026, 9, 4 + days, 9 + hours, 0).getTime();

  it("★ the word turns from the wait's own to 'Developed'", () => {
    expect(DEVELOP_TITLES.before).toBe(WAIT_TITLE);
    expect(DEVELOP_TITLES.after).toBe("Developed");
  });

  it("★ the clock is the night's line, said of a time that has come", () => {
    expect(developClockLine(iso, later(0))).toBe("All at once at 9 am");
    expect(developClockLine(iso, later(1))).toBe("All at once yesterday");
    expect(developClockLine(iso, later(3))).toMatch(
      /^All at once on (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/,
    );
    expect(developClockLine(iso, later(12))).toBe("All at once on Oct 4");
    // Before her clock is known, the line reads whole without a time.
    expect(developClockLine(iso, null)).toBe("All at once");
    expect(developClockLine("not a time", later(0))).toBe("All at once");
  });

  it("what a screen reader hears: the roll, hers in it, when, and a noun only as exact as the roll", () => {
    expect(
      developSentence({
        count: 24,
        hers: 3,
        videos: false,
        developsAt: iso,
        nowMs: later(0),
      }),
    ).toBe("24 photos developed at 9 am, 3 of them yours.");
    expect(
      developSentence({
        count: 1,
        hers: 0,
        videos: true,
        developsAt: iso,
        nowMs: null,
      }),
    ).toBe("1 photo or video developed.");
    expect(
      developSentence({
        count: 1200,
        hers: 0,
        videos: true,
        developsAt: iso,
        nowMs: later(1),
      }),
    ).toBe("1,200 photos and videos developed yesterday.");
  });
});

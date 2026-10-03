/**
 * THE DEVELOP TIME'S WORDS, ONE FORMAT FOR BOTH SIDES: the host's Settings and the guest's tracker and keep prompt
 * say the time through this one function, so "Develops Sat, Oct 3, 9:00 AM." and "when it develops, Sat, Oct 3,
 * 9:00 AM" can never drift apart.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { developTimeWords } from "@/lib/disposable/develop-words";

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

describe("one home for the develop time's words", () => {
  const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
  const SAYERS = [
    // The host's Settings: "Develops ..." and "Developed ...".
    "src/components/app/event-settings/camera-settings.tsx",
    // The guest's tracker: "when it develops, ...".
    "src/components/guest/upload-tracker.tsx",
    // Where the tracker's readers (the keep prompt among them) take it from.
    "src/lib/guest/upload-tracker.ts",
  ];

  it("each side that words it reads it from here, and none builds a formatter of its own", () => {
    for (const rel of SAYERS) {
      const source = read(rel);
      expect(source, `${rel} stopped reading develop-words`).toContain(
        "@/lib/disposable/develop-words",
      );
      expect(source, `${rel} formats the time itself`).not.toMatch(
        /Intl\.DateTimeFormat|toLocale(?:Date|Time)?String/,
      );
    }
  });
});

/**
 * A DEVELOP TIME ONTO A RUNNING CAMERA STARTS EVERY ROLL AGAIN (host-moments r1's `tell=line`): when Settings asks, and
 * what its line says. The rule is `events_reveal_stamp`'s own (a develop time coming ahead from none, or from one
 * reached, begins a new period), held to a camera that runs before and after the change.
 */
import { describe, expect, it } from "vitest";

import {
  freshRollsLine,
  startsFreshRolls,
} from "@/components/app/event-settings/camera-settings-fresh-rolls";

const NOW = Date.parse("2026-10-02T20:00:00Z");
const AHEAD = "2026-10-03T16:00:00.000Z";
const LATER = "2026-10-04T16:00:00.000Z";
const PAST = "2026-10-01T16:00:00.000Z";

const camera = (developsAt: string | null) => ({
  capture: "camera",
  developsAt,
});
const uploads = (developsAt: string | null) => ({
  capture: "upload",
  developsAt,
});

describe("startsFreshRolls", () => {
  it.each([
    [
      "a running camera gains a develop time",
      camera(null),
      camera(AHEAD),
      true,
    ],
    ["a developed camera waits again", camera(PAST), camera(AHEAD), true],
    [
      "a waiting develop moves to another time",
      camera(AHEAD),
      camera(LATER),
      false,
    ],
    ["a develop time goes", camera(AHEAD), camera(null), false],
    ["Develop now", camera(AHEAD), camera(PAST), false],
    ["free uploads gain a develop time", uploads(null), uploads(AHEAD), false],
    [
      "the camera begins with a develop time",
      uploads(null),
      camera(AHEAD),
      false,
    ],
    ["the camera ends", camera(null), uploads(AHEAD), false],
  ])("%s: %s", (_case, from, to, fresh) => {
    expect(startsFreshRolls(from, to, NOW)).toBe(fresh);
  });
});

describe("freshRollsLine", () => {
  it("says the roll, the time she chose and what stays, in the brief's words", () => {
    expect(
      freshRollsLine({
        roll: 24,
        developsAt: new Date(2026, 9, 3, 9, 0).toISOString(),
        nowMs: new Date(2026, 9, 2, 21, 40).getTime(),
      }),
    ).toBe(
      "Every guest's roll starts again: 24 fresh shots each, developing together tomorrow at 9 am. What's in the album now stays in view.",
    );
  });

  it("says one shot as one, the held photos that join, and no time before hydration", () => {
    expect(
      freshRollsLine({ roll: 1, developsAt: AHEAD, nowMs: null, held: 1 }),
    ).toBe(
      "Every guest's roll starts again: 1 fresh shot each, developing together. 1 photo under review joins the roll, approved. What's in the album now stays in view.",
    );
    expect(
      freshRollsLine({ roll: 12, developsAt: AHEAD, nowMs: null, held: 3 }),
    ).toContain("3 photos under review join the roll, approved.");
  });

  it("a party far from home says its own clock and its place", () => {
    expect(
      freshRollsLine({
        roll: 24,
        developsAt: "2026-10-04T15:00:00.000Z",
        nowMs: NOW,
        far: "America/Mexico_City",
      }),
    ).toContain("developing together Sun, Oct 4 at 9 am in Mexico City.");
  });
});

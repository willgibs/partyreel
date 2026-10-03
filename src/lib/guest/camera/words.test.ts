/**
 * THE CAMERA'S WORDS: the album's reveal decides what a shot is told, and the develop time is said from now.
 */
import { describe, expect, it } from "vitest";

import {
  afterShotHint,
  CAMERA_HINT,
  cameraSubLine,
  clockWords,
  developsWhen,
  reelCaption,
  reelLabel,
  revealFor,
  rollDoneLine,
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
  it("needs no day inside a day, a weekday inside a week, then the date", () => {
    expect(developsWhen(NINE_AM, PARTY)).toBe("at 9 am");
    expect(developsWhen(new Date(2026, 5, 17, 9, 0).toISOString(), PARTY)).toBe(
      "Wednesday at 9 am",
    );
    expect(developsWhen(new Date(2026, 6, 4, 9, 0).toISOString(), PARTY)).toBe(
      "Jul 4 at 9 am",
    );
  });
});

describe("the lines", () => {
  it("names the album's reveal under the event's name", () => {
    const base = { recording: false, done: false, nowMs: PARTY };
    expect(
      cameraSubLine({ ...base, reveal: "develop", developsAt: NINE_AM }),
    ).toBe("Develops at 9 am");
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
        cap: 24,
        reveal: "develop",
        developsAt: NINE_AM,
        nowMs: PARTY,
      }),
    ).toBe("24 shots, developing with everyone’s. They’re back at 9 am.");
    expect(rollDoneLine({ cap: 24, reveal: "approve", developsAt: null })).toBe(
      "24 shots, waiting for the host.",
    );
    expect(rollDoneLine({ cap: 1, reveal: "live", developsAt: null })).toBe(
      "1 shot, all in the album.",
    );
  });

  it("says what her shots are waiting for", () => {
    expect(
      yourShotsLine({ reveal: "develop", developsAt: NINE_AM, nowMs: PARTY }),
    ).toBe("Only you can see these until they develop at 9 am.");
  });

  it("counts the frames and what is still on its way", () => {
    const base = { cap: 24, done: false, host: false, sending: 0 };
    expect(reelCaption({ ...base, frame: 7 })).toBe("Frame 7 of 24");
    expect(reelCaption({ ...base, frame: 9, sending: 2 })).toBe(
      "Frame 9 of 24 · sending 2",
    );
    expect(reelCaption({ ...base, frame: 24, done: true })).toBe("24 of 24");
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

import { describe, expect, it } from "vitest";

import {
  DOOR_WHO,
  sentenceText,
  settingsSentence,
  type SettingsFacts,
} from "@/lib/events/guest-experience-summary";
import { DOORS } from "@/lib/event/door/door";

/**
 * THE SETTINGS READ AS SENTENCES (event-settings r1, `structure=summary`): each group says where it
 * stands in one sentence whose key words are its live controls.
 *
 * FUNCTION, NOT COPY: the words may be retuned freely. What is held is what makes a sentence TRUE of
 * the state it was handed, and the one thing that makes a word a control: it names the setting that
 * choosing it changes. So a door that holds the email step on never offers it as a word, a setting
 * that does nothing right now is not said, and every group's first word is live.
 */
const BASE: SettingsFacts = {
  door: "open",
  requireVerifiedEmail: true,
  requireUploadToView: false,
  acceptingUploads: true,
  review: false,
  videos: false,
  showReel: true,
  lookLabel: "Golden hour",
  holdSec: 3,
  name: "Maya's 30th",
  dateLabel: "October 10, 2026",
  onProfile: false,
};

const say = (group: Parameters<typeof settingsSentence>[0], over: Partial<SettingsFacts> = {}) =>
  settingsSentence(group, { ...BASE, ...over });

const words = (parts: ReturnType<typeof say>) =>
  parts.filter((p) => p.word).map((p) => p.word);

describe("who can get in", () => {
  it("leads with who, as the live word that changes the door, at every door", () => {
    for (const door of DOORS) {
      const parts = say("door", { door });
      expect(parts[0]).toEqual({ text: DOOR_WHO[door], word: "door" });
    }
  });

  it("says what a guest does first, as a word that changes it", () => {
    expect(sentenceText(say("door"))).toContain("confirming an email");
    expect(sentenceText(say("door", { requireVerifiedEmail: false }))).toContain(
      "typing a name",
    );
    expect(words(say("door"))).toContain("email");
  });

  it("★ a gate that matches an address holds the email step on: said as prose, never a control", () => {
    for (const door of ["approve", "invite"] as const) {
      const parts = say("door", { door, requireVerifiedEmail: false });
      expect(sentenceText(parts)).toContain("confirming an email");
      expect(words(parts)).not.toContain("email");
    }
  });

  it("says a photo first only when it does something: on, with uploads open", () => {
    expect(words(say("door", { requireUploadToView: true }))).toContain("photo");
    expect(
      sentenceText(say("door", { requireUploadToView: true, acceptingUploads: false })),
    ).not.toContain("photo");
    expect(sentenceText(say("door"))).not.toContain("photo");
  });

  it("Only me and a closed door say who is left out, and nothing about steps nobody reaches", () => {
    expect(sentenceText(say("door", { door: "private" }))).toContain(
      "closed album",
    );
    expect(sentenceText(say("door", { door: "closed" }))).toContain(
      "Nobody new can join",
    );
    for (const door of ["private", "closed"] as const) {
      expect(words(say("door", { door }))).toEqual(["door"]);
    }
  });
});

describe("what guests can add", () => {
  it("names what guests add, and where it goes, each a word", () => {
    const parts = say("adds");
    expect(sentenceText(parts)).toBe("Photos, straight into the album.");
    expect(words(parts)).toEqual(["uploads", "review"]);
    expect(sentenceText(say("adds", { videos: true, review: true }))).toBe(
      "Photos and videos, held until you approve them.",
    );
  });

  it("paused says only that, and that guests can still look", () => {
    const parts = say("adds", { acceptingUploads: false, review: true });
    expect(sentenceText(parts)).toBe("Paused. Guests can still look.");
    expect(words(parts)).toEqual(["uploads"]);
  });

  // THE CAMERA AND THE DEVELOP (20261002200000): the camera says its roll; a develop time owns the answer, so the
  // review word is said as prose wherever one is set (its time is no word a sentence can pick).
  const camera = (over: Partial<NonNullable<SettingsFacts["develop"]>> = {}) => ({
    develop: { capture: "camera" as const, rollSize: 24, state: "none" as const, ...over },
  });

  it("the album's camera says its roll, and where the shots go, still a word", () => {
    const parts = say("adds", camera());
    expect(sentenceText(parts)).toBe(
      "Photos on the album's camera, 24 shots each, straight into the album.",
    );
    expect(words(parts)).toEqual(["uploads", "review"]);
    expect(sentenceText(say("adds", camera({ rollSize: 12 })))).toContain("12 shots each");
  });

  it("★ a develop time ahead: hidden until it develops, the review word no longer a word", () => {
    const upload = say("adds", { develop: { capture: "upload", rollSize: null, state: "waiting" } });
    expect(sentenceText(upload)).toBe("Photos, hidden until the album develops.");
    expect(words(upload)).toEqual(["uploads"]);
    expect(sentenceText(say("adds", { ...camera({ state: "waiting" }), videos: true }))).toBe(
      "Photos and videos on the album's camera, 24 shots each, hidden until the album develops.",
    );
    // Approve plus develop, as the schema allows it: both said, neither a word.
    const both = say("adds", { ...camera({ state: "waiting" }), review: true });
    expect(sentenceText(both)).toBe(
      "Photos on the album's camera, 24 shots each, held for your approval and hidden until the album develops.",
    );
    expect(words(both)).toEqual(["uploads"]);
  });

  it("developed: says so, and what new ones do", () => {
    const parts = say("adds", { develop: { capture: "upload", rollSize: null, state: "developed" } });
    expect(sentenceText(parts)).toBe("Photos, developed; new ones show straight away.");
    expect(words(parts)).toEqual(["uploads"]);
    expect(
      sentenceText(say("adds", { review: true, develop: { capture: "upload", rollSize: null, state: "developed" } })),
    ).toBe("Photos, developed; new ones wait for your approval.");
  });

  it("paused is paused, camera and develop alike", () => {
    expect(sentenceText(say("adds", { ...camera({ state: "waiting" }), acceptingUploads: false }))).toBe(
      "Paused. Guests can still look.",
    );
  });
});

describe("the reel and this event", () => {
  it("the reel says its look and hold only while it plays", () => {
    expect(sentenceText(say("reel"))).toBe("On, in Golden hour, 3 seconds a photo.");
    expect(words(say("reel"))).toEqual(["reel", "look", "hold"]);
    expect(sentenceText(say("reel", { showReel: false }))).toBe(
      "Off. Guests see only the album.",
    );
    expect(sentenceText(say("reel", { holdSec: 1 }))).toContain("1 second a photo");
  });

  it("the event says its name and date, and the profile as a word where it is read", () => {
    expect(sentenceText(say("event"))).toBe(
      "Maya's 30th, October 10, 2026. Not on your profile.",
    );
    expect(words(say("event"))).toEqual(["profile"]);
    expect(sentenceText(say("event", { onProfile: null, dateLabel: null }))).toBe(
      "Maya's 30th.",
    );
  });

  // Q2: a range's dash is read as "to" in a label, and only the DATE is a range: a dash in a name is a dash.
  it("★ marks the date as the one range part, said with its 'to' where the sentence is only read", () => {
    const parts = say("event", { dateLabel: "October 3–5, 2026" });
    expect(parts.filter((p) => p.range)).toEqual([
      { text: "October 3–5, 2026", range: true },
    ]);
    expect(sentenceText(parts)).toBe(
      "Maya's 30th, October 3 to 5, 2026. Not on your profile.",
    );
    const named = say("event", {
      name: "Sam – Wedding",
      dateLabel: "October 3, 2026",
    });
    expect(sentenceText(named)).toContain("Sam – Wedding, October 3, 2026.");
  });
});

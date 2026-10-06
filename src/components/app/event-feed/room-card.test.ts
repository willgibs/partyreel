import { describe, expect, it } from "vitest";

import {
  countWord,
  guestsCardFace,
  reelCardFace,
  reviewCardFace,
  ROOM_LABEL,
  ROOM_SHORT,
  settingsCardFace,
} from "./room-card";

/**
 * THE DOORS' WORDS (`room-card.ts`): what each door says is one pure function of the facts, read by the page's first paint
 * and by the row's live counts alike, so the two can never word a door two ways.
 */

describe("a door's names", () => {
  it("names the five doors, the reel last-but-never-least a word shorter where a narrow card needs one", () => {
    expect(ROOM_LABEL).toEqual({
      reel: "Highlight reel",
      guests: "Guests",
      review: "Review",
      settings: "Settings",
      "as-guest": "As a guest",
    });
    // Only the reel's name is too long for a phone's card; every other door's short word is its whole name.
    expect(ROOM_SHORT.reel).toBe("Reel");
    expect({ ...ROOM_SHORT, reel: ROOM_LABEL.reel }).toEqual(ROOM_LABEL);
  });
});

describe("a waiting line once its numeral stands on its own", () => {
  it("leaves the word the count counts", () => {
    expect(countWord("8 waiting", 8)).toBe("waiting");
    expect(countWord("2 waiting", 2)).toBe("waiting");
  });

  it("reads the count's own grouping, so a comma never leaves a stray digit", () => {
    expect(countWord("1,234 waiting", 1234)).toBe("waiting");
  });

  it("leaves a line that does not lead with its count whole", () => {
    expect(countWord("All caught up", 0)).toBe("All caught up");
  });
});

describe("the Reel card's face, one pure function of the reel's state", () => {
  it("counts to two, then says it is live, and says Off when it is off", () => {
    expect(reelCardFace("counting", 0, 2, false)).toBe("Starts at 2 photos");
    expect(reelCardFace("counting", 1, 2, false)).toBe("1 more photo");
    expect(reelCardFace("live", 2, 2, false)).toBe("Live for guests");
    expect(reelCardFace("off", 2, 2, false)).toBe("Off");
  });

  it("★ never says it is live for guests while the develop is ahead: guests get it later", () => {
    // Red-team 43's NIT: on a sealed album every guest's reel is empty until the develop.
    expect(reelCardFace("live", 2, 2, true)).toBe("Guests get it later");
    // And a counting or switched-off card has nothing to add about the develop.
    expect(reelCardFace("counting", 1, 2, true)).toBe("1 more photo");
    expect(reelCardFace("off", 2, 2, true)).toBe("Off");
  });
});

describe("the Review card's face", () => {
  it("lights only while uploads wait in a moderated event", () => {
    expect(reviewCardFace(true, 8)).toEqual({
      value: "8 waiting",
      amber: true,
      count: 8,
    });
    expect(reviewCardFace(true, 0)).toEqual({
      value: "All caught up",
      amber: false,
      count: undefined,
    });
    expect(reviewCardFace(false, 8)).toEqual({
      value: "Off",
      amber: false,
      count: undefined,
    });
  });
});

describe("the Guests card's face", () => {
  it("says who waits at her door first, in the needs-action light", () => {
    expect(guestsCardFace({ waiting: 2, guests: 31, shots: 0 })).toEqual({
      value: "2 waiting",
      amber: true,
      count: 2,
    });
    // Who waits outranks a roll that develops: letting her in is hers to do now.
    expect(guestsCardFace({ waiting: 1, guests: 0, shots: 6 })).toEqual({
      value: "1 waiting",
      amber: true,
      count: 1,
    });
  });

  it("says how many are in, in the plain ink", () => {
    expect(guestsCardFace({ waiting: 0, guests: 31, shots: 0 })).toEqual({
      value: "31 guests",
    });
    expect(guestsCardFace({ waiting: 0, guests: 1, shots: 0 })).toEqual({
      value: "1 guest",
    });
    expect(guestsCardFace({ waiting: 0, guests: 1234, shots: 0 }).value).toBe(
      "1,234 guests",
    );
  });

  // ★ crumbs-81, the Guests room's own line: a guest whose only approved shots wait for the develop joins the list at the
  // develop, so while a roll is shot the count is zero. The card said "0 guests" over a party that had filled it.
  it("★ says the roll is developing, never nobody, while the list is empty only because the album has not developed", () => {
    expect(guestsCardFace({ waiting: 0, guests: 0, shots: 6 })).toEqual({
      value: "6 shots developing",
    });
    expect(guestsCardFace({ waiting: 0, guests: 0, shots: 1 })).toEqual({
      value: "1 shot developing",
    });
    expect(guestsCardFace({ waiting: 0, guests: 0, shots: 2500 }).value).toBe(
      "2,500 shots developing",
    );
  });

  it("is never amber for a roll: nothing waits on her, it waits on the clock", () => {
    const face = guestsCardFace({ waiting: 0, guests: 0, shots: 6 });
    expect(face.amber).toBeUndefined();
    expect(face.count).toBeUndefined();
  });

  it("counts the guests who are in once anyone is, whatever else is held under the seal", () => {
    // Some guests are in (their shots are visible); others' shots still wait. The number of guests is true and stands.
    expect(guestsCardFace({ waiting: 0, guests: 4, shots: 9 })).toEqual({
      value: "4 guests",
    });
  });

  it("an album that holds nothing back with nobody in says so plainly", () => {
    expect(guestsCardFace({ waiting: 0, guests: 0, shots: 0 })).toEqual({
      value: "0 guests",
    });
  });
});

/**
 * THE CARRIED CALL G4 (event-header r4): Settings' count is plain, never amber (nothing waits on her), and paused uploads
 * read Paused, the uploads' own word and never Closed, which is a door's.
 */
describe("the Settings card's face", () => {
  it("★ counts what is left in the plain ink, never the needs-action light", () => {
    const face = settingsCardFace({ left: 2, accepting: true, door: "open" });
    expect(face).toEqual({ value: "2 left", strong: true, left: 2 });
    expect(face).not.toHaveProperty("amber");
  });

  it("★ says Paused, the uploads' own word, once its steps are done and uploads are off", () => {
    expect(
      settingsCardFace({ left: 0, accepting: false, door: "approve" }),
    ).toEqual({ value: "Paused", paused: true });
  });

  it("★ steps left outrank a pause: what a guest still needs is the news", () => {
    expect(
      settingsCardFace({ left: 1, accepting: false, door: "open" }),
    ).toEqual({ value: "1 left", strong: true, left: 1 });
  });

  it("says the door in the one function that words it everywhere, once nothing is left and uploads are on", () => {
    expect(
      settingsCardFace({ left: 0, accepting: true, door: "open" }),
    ).toEqual({ value: "Public" });
    expect(
      settingsCardFace({ left: 0, accepting: true, door: "approve" }),
    ).toEqual({ value: "Private · You let in" });
  });

  it("never says Closed for paused uploads", () => {
    const face = settingsCardFace({
      left: 0,
      accepting: false,
      door: "closed",
    });
    expect(face.value).toBe("Paused");
    expect(face.value).not.toMatch(/closed/i);
  });
});

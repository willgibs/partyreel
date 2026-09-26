import { describe, expect, it } from "vitest";

import {
  addConfirmWords,
  clipFilename,
  lengthWords,
  makingWords,
  markWords,
  NO_ENCODER_WORDS,
} from "./clip-words";

/**
 * THE CLIP'S OWN WORDS: each variant a reader can meet, written once. What is pinned is who hears
 * what (the host's confirm names her storage, a moderated guest's names the review, everyone's
 * names the live reel), and the one rule every line keeps: no em-dash (bible 10).
 */

const EVERY_LINE = [
  NO_ENCODER_WORDS,
  ...Object.values(markWords(true)),
  ...Object.values(markWords(false)),
  ...Object.values(makingWords({ left: 3, total: 8, paused: false })),
  ...Object.values(makingWords({ left: 1, total: 1, paused: true })),
  ...[true, false].flatMap((isOwner) =>
    [true, false].flatMap((moderated) =>
      Object.values(
        addConfirmWords({
          eventName: "Maya & Jay",
          isOwner,
          moderated,
          bytes: 1,
        }),
      ),
    ),
  ),
];

describe("the clip's words", () => {
  it("never carry an em-dash", () => {
    for (const line of EVERY_LINE) expect(line).not.toMatch(/—/);
  });

  it("tell a guest which events mark, and the host the way past it", () => {
    expect(markWords(false)).toEqual({
      lead: "Free events mark their clips.",
      tail: "Pro events don't",
    });
    expect(markWords(true)).toEqual({
      lead: "Your free event marks its clips.",
      tail: "Remove it with Pro",
    });
  });

  it("count moments while it draws, and say when a hidden tab holds it", () => {
    expect(makingWords({ left: 3, total: 8, paused: false })).toEqual({
      count: "3 of 8 moments left",
      figure: "3 of 8",
      unit: "moments left",
      line: "Drawing your clip on this device. Keep this tab open.",
    });
    expect(makingWords({ left: 1, total: 1, paused: true }).count).toBe(
      "1 of 1 moment left",
    );
    expect(makingWords({ left: 1, total: 4, paused: true }).line).toMatch(
      /Paused while this tab is in the background/,
    );
  });

  it("confirm the host's add with what it costs her, approved", () => {
    const words = addConfirmWords({
      eventName: "Maya & Jay",
      isOwner: true,
      moderated: true,
      bytes: 18 * 1024 * 1024,
    });
    expect(words.title).toBe("Add your clip to Maya & Jay?");
    expect(words.body).toMatch(/approved and uses about 18 MB of your storage/);
    expect(words.body).toMatch(/The live reel won't play it\.$/);
    // The host is the moderator: nothing waits on a review for her.
    expect(words.body).not.toMatch(/reviews/);
  });

  it("tell a moderated guest the host sees it first, and a live one that it goes straight in", () => {
    const held = addConfirmWords({
      eventName: "Maya & Jay",
      isOwner: false,
      moderated: true,
      bytes: 1,
    });
    expect(held.body).toMatch(
      /^The host reviews it before it shows in the album/,
    );
    const live = addConfirmWords({
      eventName: "Maya & Jay",
      isOwner: false,
      moderated: false,
      bytes: 1,
    });
    expect(live.body).toMatch(/^It goes into the album/);
    for (const words of [held, live]) {
      expect(words.body).not.toMatch(/storage/);
      expect(words.body).toMatch(/The live reel won't play it\./);
    }
  });

  it("name the file after the event, safely", () => {
    expect(clipFilename("Maya & Jay's Wedding")).toBe(
      "maya-jays-wedding-clip.mp4",
    );
    expect(clipFilename("🎉🎉")).toBe("partyreel-clip.mp4");
  });

  it("read a length as a clock in the tray and in words in its menu", () => {
    expect(lengthWords("auto")).toEqual({ value: "Auto", item: "Auto" });
    expect(lengthWords(15)).toEqual({ value: "0:15", item: "15 seconds" });
    expect(lengthWords(60)).toEqual({ value: "1:00", item: "60 seconds" });
  });
});

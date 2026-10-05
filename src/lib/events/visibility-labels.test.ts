import { describe, expect, it } from "vitest";

import { DOORS, PRIVATE_GATES } from "@/lib/event/door/door";
import {
  sentenceText,
  settingsSentence,
  type SettingsFacts,
} from "@/lib/events/guest-experience-summary";
import {
  doorGuestLine,
  doorLabel,
  DOOR_STEP_LABELS,
  DOOR_STEP_LINES,
  GATE_HELP,
  GATE_LABELS,
  GATE_LINES,
  uploadsLabel,
} from "@/lib/events/visibility-labels";

/**
 * THE DOOR'S WORDS, ONE HOME (event-settings r1): the hub's Settings card, the door page and every
 * sentence name the door through this module.
 *
 * FUNCTION, NOT COPY. Held: every door has a label and every gate its line and its (i); a Private door
 * names its gate so two Private albums never read the same on the hub; and the settings never call Only
 * me "Private", since "Private" is the word a public profile uses for every album a visitor cannot walk
 * into (`u/[slug]`: "2 private events"), and the host's Only me must not collide with it.
 */
describe("the door's one line", () => {
  it("words all six doors, and no two alike", () => {
    const labels = DOORS.map(doorLabel);
    expect(new Set(labels).size).toBe(DOORS.length);
    for (const label of labels) expect(label.length).toBeGreaterThan(0);
  });

  it("names step one first, and a Private door's gate after it", () => {
    expect(doorLabel("open")).toBe(DOOR_STEP_LABELS.public);
    expect(doorLabel("private")).toBe(DOOR_STEP_LABELS.only_me);
    for (const gate of PRIVATE_GATES) {
      expect(doorLabel(gate).startsWith(DOOR_STEP_LABELS.private)).toBe(true);
    }
  });

  it("★ never calls Only me Private", () => {
    expect(doorLabel("private")).not.toMatch(/private/i);
  });

  it("stays short enough for the hub card's half-width line", () => {
    for (const door of DOORS)
      expect(doorLabel(door).length).toBeLessThanOrEqual(22);
  });
});

describe("every gate says what a guest meets, and what it is for", () => {
  it.each(PRIVATE_GATES)("%s", (gate) => {
    expect(GATE_LABELS[gate].length).toBeGreaterThan(0);
    expect(GATE_LINES[gate].length).toBeGreaterThan(0);
    expect(GATE_HELP[gate].length).toBeGreaterThan(GATE_LINES[gate].length);
  });
});

describe("whether guests can add, beside the door (crumbs-42, from event-ready)", () => {
  // The dashboard card said Closed for paused uploads while the hub's Settings card said "Private · Closed"
  // for Only people already in: one word, two states. Whether guests can add is its own state, so neither
  // of its words is ever a word the door wears.
  it("★ says Open and Paused, neither of them a word any door wears", () => {
    expect(uploadsLabel(true)).toBe("Open");
    expect(uploadsLabel(false)).toBe("Paused");
    for (const door of DOORS) {
      const words = doorLabel(door).split(" · ");
      expect(words, door).not.toContain(uploadsLabel(true));
      expect(words, door).not.toContain(uploadsLabel(false));
    }
  });
});

/**
 * WHAT A GUEST MEETS AT THE DOOR, AS THIS ALBUM HAS IT SET (red-team 53b's NIT, crumbs-66): the hub's "What a guest
 * needs" list said "Anyone with the link or the code comes in." where the album asks for a confirmed email first, and
 * Settings said "after confirming an email". The line reads Settings' own sentence from Settings' own facts.
 */
describe("the door's line for a guest, from what the album asks", () => {
  const ASKS = {
    requireVerifiedEmail: true,
    requireUploadToView: false,
    acceptingUploads: true,
  };
  const SETTINGS: SettingsFacts = {
    ...ASKS,
    door: "open",
    review: false,
    videos: false,
    showReel: true,
    lookLabel: "Golden hour",
    holdSec: 3,
    name: "Maya's 30th",
    dateLabel: null,
    onProfile: null,
  };

  it("★ never says a Public door lets a guest in where the album asks for an email first", () => {
    const line = doorGuestLine("open", ASKS);
    expect(line).toBe("Anyone with the link, after confirming an email.");
    expect(line).not.toBe(DOOR_STEP_LINES.public);
    expect(
      doorGuestLine("open", { ...ASKS, requireVerifiedEmail: false }),
    ).toBe("Anyone with the link, after typing a name.");
  });

  it("says a photo first too, but only while uploads are open to add one", () => {
    const photo = { ...ASKS, requireUploadToView: true };
    expect(doorGuestLine("open", photo)).toBe(
      "Anyone with the link, after confirming an email and adding a photo.",
    );
    expect(doorGuestLine("open", { ...photo, acceptingUploads: false })).toBe(
      "Anyone with the link, after confirming an email.",
    );
  });

  it("★ is Settings' own sentence at a Public and a password door, whatever the facts", () => {
    for (const door of ["open", "password"] as const)
      for (const requireVerifiedEmail of [true, false])
        for (const requireUploadToView of [true, false])
          for (const acceptingUploads of [true, false]) {
            const asks = {
              requireVerifiedEmail,
              requireUploadToView,
              acceptingUploads,
            };
            expect(
              doorGuestLine(door, asks),
              JSON.stringify([door, asks]),
            ).toBe(
              sentenceText(
                settingsSentence("door", { ...SETTINGS, door, ...asks }),
              ),
            );
          }
  });

  it("keeps a gate's own line and Only me's, which ask nothing the line leaves out", () => {
    for (const gate of ["approve", "invite", "closed"] as const)
      expect(doorGuestLine(gate, ASKS)).toBe(GATE_LINES[gate]);
    expect(doorGuestLine("private", ASKS)).toBe(DOOR_STEP_LINES.only_me);
  });

  it("says something for every door", () => {
    for (const door of DOORS)
      expect(doorGuestLine(door, ASKS).length, door).toBeGreaterThan(0);
  });
});

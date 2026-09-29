import { describe, expect, it } from "vitest";

import { DOORS, PRIVATE_GATES } from "@/lib/event/door/door";
import {
  doorLabel,
  DOOR_STEP_LABELS,
  GATE_HELP,
  GATE_LABELS,
  GATE_LINES,
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
    for (const door of DOORS) expect(doorLabel(door).length).toBeLessThanOrEqual(22);
  });
});

describe("every gate says what a guest meets, and what it is for", () => {
  it.each(PRIVATE_GATES)("%s", (gate) => {
    expect(GATE_LABELS[gate].length).toBeGreaterThan(0);
    expect(GATE_LINES[gate].length).toBeGreaterThan(0);
    expect(GATE_HELP[gate].length).toBeGreaterThan(GATE_LINES[gate].length);
  });
});

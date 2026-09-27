import { describe, expect, it } from "vitest";

import { emptyPageLine } from "./empty-page";

/**
 * THE EMPTY PAGE'S ONE LINE (`identity-profile` r1, `page=count`): "2 private events" for an active
 * person keeping her events to herself, the plain line for a page with nothing behind it.
 */
describe("emptyPageLine", () => {
  it("says the count, singular and plural, grouped like every count", () => {
    expect(emptyPageLine(1)).toBe("1 private event");
    expect(emptyPageLine(2)).toBe("2 private events");
    expect(emptyPageLine(1249)).toBe("1,249 private events");
  });

  it("says the plain line when there is nothing to count, withheld, or not yet in the payload", () => {
    expect(emptyPageLine(0)).toBe("No events here yet");
    expect(emptyPageLine(null)).toBe("No events here yet");
    expect(emptyPageLine(undefined)).toBe("No events here yet");
  });
});

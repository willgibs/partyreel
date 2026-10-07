/**
 * ★ A FILE STANDING BY FOR THE LINE (no-signal r1, `drop=standby`): queued with its last try's cause, the connection.
 * Everything that draws a wait apart from a send reads this one predicate.
 */
import { describe, expect, it } from "vitest";

import { waitsForLine } from "./standby";

describe("waitsForLine", () => {
  it("is a queued file whose last try the connection ended, and nothing else", () => {
    expect(waitsForLine({ status: "queued", cause: "dropped" })).toBe(true);
    expect(waitsForLine({ status: "queued" })).toBe(false);
    expect(waitsForLine({ status: "uploading", cause: "dropped" })).toBe(false);
    // A failure is never a wait, whatever its cause said (none fails for the line any more).
    expect(waitsForLine({ status: "error", cause: "dropped" })).toBe(false);
    expect(waitsForLine({ status: "done" })).toBe(false);
  });
});

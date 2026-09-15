import { describe, expect, it } from "vitest";

import { proposalStatus } from "./status";

/**
 * The clause, taken whole (the Library x Lab round, 2026-09-15). The fixtures
 * are the shapes the proposals under docs/specs actually use, hard wraps and
 * all, because the wrap is the thing that broke the old reading.
 */
describe("a proposal's standing", () => {
  it("de-wraps the blockquote before taking the clause", () => {
    expect(
      proposalStatus(
        [
          "# Light",
          "",
          "> **ROLE:** the light exploration's proposal, kept here so it",
          "> outlives the track manifest. **NOT LAW** until Will rules; the",
          "> board is `/design/lab/light` while it stands.",
          "",
          "Round four.",
        ].join("\n"),
      ),
    ).toBe("NOT LAW until Will rules");
  });

  it("takes a STATUS clause to the end of its sentence", () => {
    expect(
      proposalStatus(
        "# Voice\n\n> STATUS: a PROPOSAL (the brand-voice track, round four,\n> 2026-09-15). Bible 20 says the rest.",
      ),
    ).toBe(
      "STATUS: a PROPOSAL (the brand-voice track, round four, 2026-09-15)",
    );
  });

  it("is null when the document states neither", () => {
    expect(
      proposalStatus("# A spec\n\n> ROLE: the reel's shipped spec."),
    ).toBeNull();
    expect(proposalStatus("# A spec\n\nNo blockquote at all.")).toBeNull();
  });
});

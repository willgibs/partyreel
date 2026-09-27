import { describe, expect, it } from "vitest";

import {
  PROFILE_SLUG_MAX_LENGTH,
  profileSlugSchema,
} from "@/lib/validation/profile";

import { handleCandidates } from "./handle-suggestion";

/**
 * THE PREFILLED FIRST SCREEN'S SPELLINGS. Every candidate is one a save would accept, so the wizard
 * never opens on an address it would refuse; the database then says which is free.
 */
describe("handleCandidates", () => {
  it("makes a display name into a handle, then numbered spellings of it", () => {
    const out = handleCandidates("Priya Patel");
    expect(out[0]).toBe("priya-patel");
    expect(out.slice(1, 3)).toEqual(["priya-patel-2", "priya-patel-3"]);
    expect(out).toHaveLength(9);
  });

  it("keeps a letter's base when an accent is dropped", () => {
    expect(handleCandidates("Zoë Ångström")[0]).toBe("zoe-angstrom");
  });

  it("collapses anything that is not a letter or a digit into one hyphen, never at an edge", () => {
    expect(handleCandidates("  Maya & Jay's   Friend!! ")[0]).toBe(
      "maya-jays-friend",
    );
    expect(handleCandidates("Tara\u2019s crew")[0]).toBe("taras-crew");
  });

  it("suggests nothing for a name that makes no valid handle", () => {
    expect(handleCandidates("AJ")).toEqual([]); // two letters
    expect(handleCandidates("李")).toEqual([]); // nothing survives
    expect(handleCandidates(null)).toEqual([]);
    expect(handleCandidates("Admin")).toEqual([]); // a reserved word, numbered or not
  });

  it("never offers a spelling a save would refuse, at the length cap either", () => {
    const long = "Alexandria Catherine Montgomery-Worthington";
    const out = handleCandidates(long);
    expect(out.length).toBeGreaterThan(0);
    for (const candidate of out) {
      expect(candidate.length).toBeLessThanOrEqual(PROFILE_SLUG_MAX_LENGTH);
      expect(profileSlugSchema.safeParse(candidate).success, candidate).toBe(
        true,
      );
    }
  });
});

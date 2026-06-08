import { describe, expect, it } from "vitest";

import { containsProfanity } from "@/lib/validation/profanity";

// Calibration guard: the matcher is tuned so it does NOT false-positive on real (often
// non-Western) names while still blocking slurs/profanity. If a future tweak regresses either
// side, these fail. See profanity.ts for the why.
describe("containsProfanity", () => {
  it("allows real names that contain profane substrings (no Scunthorpe)", () => {
    const realNames = [
      "Will", "AJ", "MJ", "Bo", "Cassandra", "Cockburn", "Hancock", "Babcock",
      "Dickson", "Dickinson", "Sexton", "Sussex", "Anushka", "Saanvi", "Shitij",
      "Francesca", "Cumberbatch", "Cummings", "Titus", "Analiese", "Scunthorpe",
      "Fukuda", "Phuc", "Nguyen", "Kumar", "Essex", "Sandeep", "Dixit",
    ];
    for (const name of realNames) {
      expect(containsProfanity(name), `expected "${name}" allowed`).toBe(false);
    }
  });

  it("blocks slurs, core profanity, compounds, and leetspeak", () => {
    const bad = [
      "fuck", "fuckface", "motherfucker", "sh1t", "b!tch", "n1gger", "FUCKER",
      "pussy", "cuntface", "a$$hole", "assh0le", "bullsh1t", "dick", "shit",
      "whore", "cunt", "faggot", "dickhead", "bullshit", "asshole", "dumbass",
      "cocksucker", "slut", "Nigga", "d1ckhead",
    ];
    for (const term of bad) {
      expect(containsProfanity(term), `expected "${term}" blocked`).toBe(true);
    }
  });

  it("treats empty / whitespace as clean (length is the schema's job)", () => {
    expect(containsProfanity("")).toBe(false);
    expect(containsProfanity("   ")).toBe(false);
  });
});

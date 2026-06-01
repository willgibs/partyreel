import { describe, expect, it } from "vitest";

import { getJob } from "@/lib/constants/careers";
import { TRIAGE_STATUSES, triageStatusSchema } from "@/lib/constants/triage";

// Guards the admin triage surfaces (support + applicants). The status set is the single source
// for the zod write-validation AND the DB CHECK constraint, so they must stay in lockstep.
describe("triageStatusSchema", () => {
  it("accepts every known status", () => {
    for (const status of TRIAGE_STATUSES) {
      expect(triageStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it("rejects unknown / off-set statuses", () => {
    for (const bad of ["", "spam", "archived", "New", "open", "resolved"]) {
      expect(triageStatusSchema.safeParse(bad).success).toBe(false);
    }
  });
});

// The Applicants list maps role_slug -> title via getJob(slug)?.title ?? slug. A removed/unknown
// posting must fall back to the raw slug rather than crash.
describe("getJob (applicants role title fallback)", () => {
  it("resolves a known posting to a title", () => {
    expect(getJob("general")?.title).toBeTruthy();
  });

  it("returns undefined for an unknown slug (caller falls back to the slug)", () => {
    expect(getJob("role-that-does-not-exist")).toBeUndefined();
  });
});

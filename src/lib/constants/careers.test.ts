import { describe, expect, it } from "vitest";

import {
  getJob,
  IS_HIRING,
  JOB_OPENINGS,
  JOB_SLUGS,
  OPEN_ROLES,
} from "@/lib/constants/careers";

describe("careers constants", () => {
  it("has unique slugs and complete role fields", () => {
    expect(new Set(JOB_SLUGS).size).toBe(JOB_SLUGS.length);
    expect(JOB_OPENINGS.length).toBeGreaterThan(0);
    for (const job of JOB_OPENINGS) {
      for (const field of [
        job.slug,
        job.title,
        job.team,
        job.type,
        job.hook,
        job.summary,
      ]) {
        expect(field.trim()).not.toBe("");
      }
      expect(job.requirements.length).toBeGreaterThan(0);
      for (const item of [...job.requirements, ...job.responsibilities]) {
        expect(item.trim()).not.toBe("");
      }
      for (const item of job.offer ?? []) {
        expect(item.trim()).not.toBe("");
      }
    }
  });

  it("keeps the General Application perk-neutral (no location/offer claims)", () => {
    const general = getJob("general");
    expect(general).toBeDefined();
    expect(general?.location).toBeUndefined();
    expect(general?.offer).toBeUndefined();
  });

  it("the hiring signal counts real vacancies, not the catch-all", () => {
    // The footer's "We're hiring" badge reads IS_HIRING, so the catch-all must
    // never be able to keep it lit on its own: a site advertising a vacancy it
    // does not have is the failure this guards.
    expect(OPEN_ROLES.every((job) => !job.catchAll)).toBe(true);
    expect(OPEN_ROLES.length).toBe(
      JOB_OPENINGS.filter((job) => !job.catchAll).length,
    );
    expect(IS_HIRING).toBe(OPEN_ROLES.length > 0);
    // The General Application is the catch-all and is flagged as such.
    expect(JOB_OPENINGS.find((job) => job.slug === "general")?.catchAll).toBe(
      true,
    );
  });

  it("getJob resolves known slugs and rejects unknown", () => {
    for (const slug of JOB_SLUGS) {
      expect(getJob(slug)?.slug).toBe(slug);
    }
    expect(getJob("not-a-role")).toBeUndefined();
  });
});

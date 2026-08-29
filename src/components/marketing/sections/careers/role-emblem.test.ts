/**
 * The role emblem's resolution contract, pinned at the careers merge
 * (2026-08-29). Two properties matter and neither is visible in a screenshot.
 */
import { describe, expect, it } from "vitest";

import { JOB_SLUGS } from "@/lib/constants/careers";

import {
  roleEmblemKind,
  type RoleEmblemKind,
} from "@/components/marketing/sections/careers/role-emblem";

/** Marks that ASSERT something about the role they sit on. */
const CLAIMED: RoleEmblemKind[] = [
  "reel", // the film reel: the graphics role's own mark
  "open", // the empty slide mount: "the catch-all, always open"
];

describe("roleEmblemKind", () => {
  it("is total: every listing has an emblem", () => {
    for (const slug of JOB_SLUGS) {
      expect(roleEmblemKind(slug), slug).toBeTruthy();
    }
  });

  it("★ is DETERMINISTIC, because it runs twice on every page view", () => {
    // The component renders on the server and again at hydration. A fallback
    // built on Math.random() would disagree between the two and hand React a
    // hydration mismatch, so the hash is integer-only. Same input, same output,
    // and stable across calls rather than merely within one.
    const once = JOB_SLUGS.map(roleEmblemKind);
    const again = JOB_SLUGS.map(roleEmblemKind);
    expect(again).toEqual(once);
    for (const slug of ["designer", "founding-engineer", "", "ops-lead-2027"]) {
      expect(roleEmblemKind(slug)).toBe(roleEmblemKind(slug));
    }
  });

  it("★ never hands an UNMAPPED role a mark that claims something", () => {
    // The fallback exists so a listing written next year is never emblem-less.
    // It must not solve that by borrowing a mark that means something specific:
    // a "Designer" opening wearing the film reel says it is the graphics role,
    // and one wearing the empty slide mount says it is not a real vacancy. The
    // album plate claims nothing, which is why it is the only neutral member
    // today. Add to NEUTRAL_KINDS when the family grows, never to make variety.
    for (const slug of [
      "designer",
      "founding-engineer",
      "ops-lead",
      "growth",
      "support",
      "",
      "a",
      "zzzzzzzz",
    ]) {
      expect(CLAIMED, `${slug} inherited a claimed mark`).not.toContain(
        roleEmblemKind(slug),
      );
    }
  });
});

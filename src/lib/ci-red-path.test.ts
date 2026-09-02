import { describe, expect, it } from "vitest";

/**
 * THROWAWAY. This file exists for exactly one commit, to prove that the CI gate
 * (.github/workflows/ci.yml) actually turns a push red rather than reporting a
 * green run it never earned. The next commit reverts it; both stay on
 * lp/ci-workflow as the proof. If you are reading this on any other branch,
 * delete it: it fails on purpose.
 */
describe("ci red path", () => {
  it("fails on purpose so the workflow's pnpm test step goes red", () => {
    expect(1).toBe(2);
  });
});

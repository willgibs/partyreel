/**
 * ★ A HANDLE HELD BEFORE A RULE GREW READS AS CURRENT (crumbs-11). The brand's family now refuses
 * `partyr33l`, and the operator's own page already lives there: nothing re-reads a stored handle,
 * so it keeps resolving, and Change opens the field on it. That field must say "current", never
 * "reserved", while any OTHER value still meets every rule.
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BRAND_NAME_MESSAGE } from "@/lib/constants/reserved-slugs";

const checkProfileSlugAction = vi.hoisted(() =>
  vi.fn(async () => ({ available: true })),
);
vi.mock("@/app/(app)/account/social-actions", () => ({
  checkProfileSlugAction,
}));

const { useHandleStatus } = await import("./handle-field");

describe("useHandleStatus", () => {
  it("reads the held handle as current, even one the family now refuses", () => {
    const { result } = renderHook(() =>
      useHandleStatus(" Partyr33l ", "partyr33l"),
    );
    expect(result.current.status).toEqual({ kind: "current" });
    expect(checkProfileSlugAction).not.toHaveBeenCalled();
  });

  it("holds every other value to the rules, the family included", () => {
    const { result } = renderHook(() =>
      useHandleStatus("partyr33l-2", "partyr33l"),
    );
    expect(result.current.status).toEqual({
      kind: "invalid",
      message: BRAND_NAME_MESSAGE,
    });
  });

  it("checks a valid, changed handle", () => {
    const { result } = renderHook(() => useHandleStatus("maya-j", "maya"));
    expect(result.current.status).toEqual({ kind: "checking", slug: "maya-j" });
  });
});

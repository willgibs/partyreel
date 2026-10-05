/**
 * THE GUEST ALBUM'S VIEW MENU, AS ARITHMETIC (`gallery-view.ts`): Size, Sort and Filter, and nothing more.
 *
 * ★ MOVED HERE FROM `live-gallery.test.tsx` WITH THE BUILDER (album-order), and reshaped on purpose: the Showing group
 * (Everyone's / Yours) became the Filter group (All / Photos / Videos / Yours). Its scars stay: Yours joins only when
 * she owns something, its count is inside its own label, the value is the live lens and never a stale intent, a pick
 * reaches its setter as the setter's own type, and the slider speaks in photographs a row once the rows are laid.
 */
import { describe, expect, it, vi } from "vitest";

import { buildGuestViewGroups } from "@/components/guest/gallery-view";
import type { ViewMenuGroup } from "@/components/shared/view-menu";
import type { RowStep } from "@/lib/shared/album-rows";

function base(
  overrides: Partial<Parameters<typeof buildGuestViewGroups>[0]> = {},
): Parameters<typeof buildGuestViewGroups>[0] {
  return {
    step: 1 as RowStep,
    setStep: vi.fn(),
    boxWidth: null,
    sort: "newest",
    filter: "all",
    setFilter: vi.fn(),
    kinds: { photos: 12, videos: 0 },
    ownedCount: 0,
    ...overrides,
  };
}
const radio = (g: unknown) => g as ViewMenuGroup;
const byId = (groups: ReturnType<typeof buildGuestViewGroups>, id: string) =>
  radio(groups.find((g) => g.id === id));

describe("Size", () => {
  it("is the density slider alone on a standalone photo album she owns nothing of", () => {
    const groups = buildGuestViewGroups(base());
    expect(groups.map((g) => g.id)).toEqual(["size"]);
    expect(groups[0]).toMatchObject({
      kind: "density",
      label: "Size",
      value: 1,
    });
  });

  it("speaks in photographs a row once the album has laid its rows, and in plain names before", () => {
    const [cold] = buildGuestViewGroups(base());
    expect("perRow" in cold && cold.perRow).toBeFalsy();
    const [laid] = buildGuestViewGroups(base({ boxWidth: 1400 }));
    expect(laid.kind).toBe("density");
    if (laid.kind !== "density") return;
    // A desk: 3, 5 or 8 a row (album-rows.ts' ROW_CLASSES).
    expect([0, 1, 2].map((s) => laid.perRow?.(s as RowStep))).toEqual([
      3, 5, 8,
    ]);
  });

  it("routes the slider's pick to setStep as the step itself", () => {
    const setStep = vi.fn();
    const [size] = buildGuestViewGroups(base({ setStep }));
    if (size.kind !== "density") throw new Error("expected the density group");
    size.onChange(2);
    expect(setStep).toHaveBeenCalledWith(2);
  });
});

describe("Sort: the host's own control, wherever the page hands an order down", () => {
  it("joins with the page's order, the host's two words, its value the album's order as she sees it", () => {
    const groups = buildGuestViewGroups(
      base({ sort: "oldest", setSort: vi.fn() }),
    );
    expect(groups.map((g) => g.id)).toEqual(["size", "sort"]);
    const sort = byId(groups, "sort");
    expect(sort.label).toBe("Sort");
    expect(sort.value).toBe("oldest");
    expect(sort.options).toEqual([
      { value: "newest", label: "Newest first" },
      { value: "oldest", label: "Oldest first" },
    ]);
  });

  it("hands her pick on as an order, never the raw string", () => {
    const setSort = vi.fn();
    const sort = byId(buildGuestViewGroups(base({ setSort })), "sort");
    sort.onChange("oldest");
    expect(setSort).toHaveBeenLastCalledWith("oldest");
    sort.onChange("anything else");
    expect(setSort).toHaveBeenLastCalledWith("newest");
  });
});

describe("Filter: only what has something to show", () => {
  it("offers Photos and Videos only where the album holds both kinds", () => {
    const one = buildGuestViewGroups(base({ kinds: { photos: 5, videos: 0 } }));
    expect(one.map((g) => g.id)).not.toContain("filter");
    const both = buildGuestViewGroups(
      base({ kinds: { photos: 5, videos: 2 } }),
    );
    expect(byId(both, "filter").options).toEqual([
      { value: "all", label: "All" },
      { value: "photos", label: "Photos" },
      { value: "videos", label: "Videos" },
    ]);
  });

  it("adds Yours once she owns something, the count inside Yours' own label", () => {
    const groups = buildGuestViewGroups(base({ ownedCount: 3 }));
    expect(groups.map((g) => g.id)).toEqual(["size", "filter"]);
    expect(byId(groups, "filter").options).toEqual([
      { value: "all", label: "All" },
      { value: "yours", label: "Yours (3)" },
    ]);
  });

  it("its value is the live lens, never a stale intent", () => {
    const on = buildGuestViewGroups(base({ ownedCount: 2, filter: "yours" }));
    expect(byId(on, "filter").value).toBe("yours");
    const off = buildGuestViewGroups(base({ ownedCount: 2, filter: "all" }));
    expect(byId(off, "filter").value).toBe("all");
  });

  it("routes a pick to setFilter as a lens, never a value it does not know", () => {
    const setFilter = vi.fn();
    const filter = byId(
      buildGuestViewGroups(
        base({ ownedCount: 1, kinds: { photos: 3, videos: 1 }, setFilter }),
      ),
      "filter",
    );
    filter.onChange("videos");
    expect(setFilter).toHaveBeenLastCalledWith("videos");
    filter.onChange("yours");
    expect(setFilter).toHaveBeenLastCalledWith("yours");
    filter.onChange("mine");
    expect(setFilter).toHaveBeenLastCalledWith("all");
  });
});

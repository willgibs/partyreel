/**
 * Behavior pins for the shared multi-select primitive. The load-bearing one is the LAST block:
 * when the id universe changes (a background poll / revalidate), `selected` must PRUNE to the
 * surviving ids, never reset to empty — else a host's in-progress album multi-select is wiped the
 * instant any unrelated refresh lands.
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useSelection } from "./use-selection";

describe("useSelection", () => {
  it("toggles ids in and out of the set", () => {
    const { result } = renderHook(() => useSelection(["a", "b", "c"]));
    expect(result.current.selected.size).toBe(0);
    act(() => result.current.toggle("a"));
    act(() => result.current.toggle("b"));
    expect([...result.current.selected].sort()).toEqual(["a", "b"]);
    act(() => result.current.toggle("a"));
    expect([...result.current.selected]).toEqual(["b"]);
  });

  it("selectAll fills then clears; allSelected tracks the boundary", () => {
    const { result } = renderHook(() => useSelection(["a", "b", "c"]));
    expect(result.current.allSelected).toBe(false);
    act(() => result.current.selectAll());
    expect(result.current.selected.size).toBe(3);
    expect(result.current.allSelected).toBe(true);
    act(() => result.current.selectAll());
    expect(result.current.selected.size).toBe(0);
    expect(result.current.allSelected).toBe(false);
  });

  it("allSelected is false for an empty universe", () => {
    const { result } = renderHook(() => useSelection([]));
    expect(result.current.allSelected).toBe(false);
  });

  it("enterSelect(seed) opens select mode seeded with one id; exitSelect clears + closes", () => {
    const { result } = renderHook(() => useSelection(["a", "b", "c"]));
    act(() => result.current.enterSelect("b"));
    expect(result.current.selectMode).toBe(true);
    expect([...result.current.selected]).toEqual(["b"]);
    act(() => result.current.exitSelect());
    expect(result.current.selectMode).toBe(false);
    expect(result.current.selected.size).toBe(0);
  });

  it("enterSelect() with no seed opens select mode with an empty selection", () => {
    const { result } = renderHook(() => useSelection(["a", "b"]));
    act(() => result.current.enterSelect());
    expect(result.current.selectMode).toBe(true);
    expect(result.current.selected.size).toBe(0);
  });

  it("PRUNES (not resets) selection when the id universe changes", () => {
    const { result, rerender } = renderHook(
      ({ ids }: { ids: string[] }) => useSelection(ids),
      { initialProps: { ids: ["a", "b", "c"] } },
    );
    act(() => result.current.toggle("a"));
    act(() => result.current.toggle("b"));
    expect([...result.current.selected].sort()).toEqual(["a", "b"]);

    // A revalidate drops "b" (and adds "d"): the surviving "a" stays selected, "b" is pruned,
    // and crucially the selection is NOT wiped to empty.
    rerender({ ids: ["a", "c", "d"] });
    expect([...result.current.selected]).toEqual(["a"]);
  });

  it("keeps the full selection when the universe is unchanged across rerenders", () => {
    const { result, rerender } = renderHook(
      ({ ids }: { ids: string[] }) => useSelection(ids),
      { initialProps: { ids: ["a", "b", "c"] } },
    );
    act(() => result.current.selectAll());
    expect(result.current.selected.size).toBe(3);
    // A new array with the SAME ids must not disturb the selection.
    rerender({ ids: ["a", "b", "c"] });
    expect(result.current.selected.size).toBe(3);
  });
});

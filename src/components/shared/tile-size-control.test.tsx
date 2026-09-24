import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TileSizeControl } from "@/components/shared/tile-size-control";
import {
  DEFAULT_TILE_SIZE,
  resolveTileSize,
  TILE_SIZES,
} from "@/lib/shared/tile-size-cookie";
import { useTileSize } from "@/lib/shared/use-tile-size";

/**
 * `app-vocabulary` r1, `gallery-controls-home=cluster`: three steps, the
 * reserved slots, and the cookie persistence that overrules the board's own
 * `device`=localStorage answer (host-app.md, the hub gallery). What this
 * guards is FUNCTION — three real steps, the pressed one named, the reserved
 * slots inert, the hook optimistic and fire-and-forget — never a px value,
 * a color or a glyph shape.
 */

describe("resolveTileSize", () => {
  it("accepts exactly the three wired steps", () => {
    for (const size of TILE_SIZES) {
      expect(resolveTileSize(String(size))).toBe(size);
    }
  });

  it("falls back to the wired default on anything else", () => {
    for (const raw of [undefined, null, "", "0", "999", "not-a-number"]) {
      expect(resolveTileSize(raw)).toBe(DEFAULT_TILE_SIZE);
    }
  });
});

describe("useTileSize", () => {
  it("starts at the server-resolved size and updates optimistically", () => {
    const onPersist = vi.fn();
    const { result } = renderHook(() => useTileSize(180, onPersist));
    expect(result.current.size).toBe(180);
    act(() => result.current.setTileSize(300));
    expect(result.current.size).toBe(300);
    expect(onPersist).toHaveBeenCalledWith(300);
  });

  it("never persists a no-op pick", () => {
    const onPersist = vi.fn();
    const { result } = renderHook(() => useTileSize(240, onPersist));
    act(() => result.current.setTileSize(240));
    expect(onPersist).not.toHaveBeenCalled();
  });
});

describe("TileSizeControl", () => {
  it("draws exactly the three wired steps, the current one pressed", () => {
    render(<TileSizeControl value={240} onChange={() => {}} />);
    expect(screen.getByRole("group", { name: "Tile size" })).toBeTruthy();
    for (const size of TILE_SIZES) {
      const btn = screen.getByRole("button", {
        name: `Tile size ${size === 180 ? "small" : size === 240 ? "medium" : "large"}`,
      });
      expect(btn.getAttribute("aria-pressed")).toBe(String(size === 240));
    }
  });

  it("calls onChange with the pressed step", () => {
    const onChange = vi.fn();
    render(<TileSizeControl value={240} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Tile size large" }));
    expect(onChange).toHaveBeenCalledWith(300);
  });

  it("names Sort and Filter as reserved, inert slots", () => {
    render(<TileSizeControl value={240} onChange={() => {}} />);
    expect(screen.getByText("Sort")).toBeTruthy();
    expect(screen.getByText("Filter")).toBeTruthy();
    // Reserved: neither is a button, a link, or otherwise operable yet.
    expect(screen.queryByRole("button", { name: "Sort" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Filter" })).toBeNull();
  });
});

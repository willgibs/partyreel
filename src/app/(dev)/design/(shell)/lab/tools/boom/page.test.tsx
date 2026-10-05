import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE BOUNDARY PROBE HAS TWO MODES, AND THE GATE COMES FIRST IN BOTH (crumbs-78). Bare, it crashes the page during
 * server render, into the root `error.tsx` (it always did). `?boundary=global` draws a page that crashes the ROOT
 * LAYOUT instead, the only way to `global-error.tsx` (`root-layout-crash.test.tsx` pins how). Anything but exactly
 * `global` is the bare probe, so a mangled link still exercises a boundary rather than nothing.
 */
const requireDesignKey = vi.hoisted(() =>
  vi.fn<(searchParams: Promise<unknown>) => Promise<string | null>>(
    async () => null,
  ),
);
vi.mock("@/lib/design-gate/server", () => ({ requireDesignKey }));
vi.mock("@/app/(dev)/design/(shell)/_shell/page-header", () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock("./root-layout-crash", () => ({
  RootLayoutCrash: () => <div data-testid="root-layout-crash" />,
}));

const { default: BoundaryProbe } = await import("./page");

const BARE = "design-lab boundary probe: intentional render crash";

function search(params: Record<string, string | string[] | undefined>) {
  return { searchParams: Promise.resolve(params) };
}

beforeEach(() => {
  requireDesignKey.mockReset();
  requireDesignKey.mockResolvedValue(null);
});

describe("the bare probe", () => {
  it("crashes during server render, as it always did", async () => {
    await expect(BoundaryProbe(search({}))).rejects.toThrow(BARE);
  });

  it("is still the bare probe with only a key", async () => {
    await expect(BoundaryProbe(search({ key: "k" }))).rejects.toThrow(BARE);
  });

  it.each([
    ["another case", "Global"],
    ["a padded one", "global "],
    ["a repeated one", ["global", "global"]],
    ["an empty one", ""],
    ["another boundary's name", "root"],
  ])("is the bare probe for %s", async (_, boundary) => {
    await expect(BoundaryProbe(search({ boundary }))).rejects.toThrow(BARE);
  });
});

describe("?boundary=global", () => {
  it("★ draws its page and mounts the root layout's crash, and does not throw itself", async () => {
    render(await BoundaryProbe(search({ boundary: "global" })));
    expect(
      screen.getByRole("heading", { name: "Boundary probe: the root layout" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("root-layout-crash")).toBeInTheDocument();
    expect(screen.getByText("It crashes on purpose")).toBeInTheDocument();
  });
});

describe("the gate", () => {
  it.each([
    ["the bare probe", {}],
    ["?boundary=global", { boundary: "global" }],
  ])(
    "★ comes first for %s: a refused key draws and crashes nothing",
    async (_, params) => {
      requireDesignKey.mockRejectedValue(
        new Error("NEXT_HTTP_ERROR_FALLBACK;404"),
      );
      const { searchParams } = search(params);
      await expect(BoundaryProbe({ searchParams })).rejects.toThrow(
        "NEXT_HTTP_ERROR_FALLBACK;404",
      );
      expect(requireDesignKey).toHaveBeenCalledWith(searchParams);
      expect(screen.queryByTestId("root-layout-crash")).toBeNull();
    },
  );
});

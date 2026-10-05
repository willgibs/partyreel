import type { ReactNode } from "react";

import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";

import { HostGridArrivalDemo } from "./host-grid-arrival-demo";

/**
 * THE ARRIVAL SPECIMEN'S STORE IS THE WHOLE HARNESS (`host-grid-arrival-demo.tsx`): a list in state and a button that puts a
 * photograph at its head, so the real grid does what it does on the hub, and nothing here fakes the arrival itself.
 *
 * Pinned through the REAL `HostMediaGrid` (its masonry is a spy, as the grid's own test has it): the album opens on eight
 * photographs and none is held (the first render marks nothing), a guest's photograph is held out of the rows until it is
 * decoded and then laid at the head, a burst of five arrives together, the buttons stop when the pool is spent, and Start
 * again puts the album back as it opened.
 */
const { gridSpy } = vi.hoisted(() => ({ gridSpy: vi.fn() }));
vi.mock("@/components/shared/masonry", () => ({
  MasonryColumns: (props: unknown) => {
    gridSpy(props);
    return <div data-testid="grid" />;
  },
}));
vi.mock("@/components/app/event-feed/host-album", () => ({
  useHubWrites: () => ({}),
}));
vi.mock("@/components/app/host-selection-provider", () => ({
  useHostSelection: () => null,
}));
vi.mock("@/components/app/export/use-export-download", () => ({
  useExportDownload: () => ({ startDownload: vi.fn() }),
}));
vi.mock("@/components/likes/likes-provider", () => ({
  LikesProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useLikes: () => null,
}));
vi.mock("@/components/likes/like-button", () => ({
  useLikeAction: () => () => null,
}));

type GridProps = { items: GridMedia[]; arrivedIds?: ReadonlySet<string> };
const laid = () =>
  (gridSpy.mock.calls.at(-1)![0] as GridProps).items.map((item) => item.id);
const glowing = () => [
  ...((gridSpy.mock.calls.at(-1)![0] as GridProps).arrivedIds ?? []),
];

let decodes: { src: string; resolve: () => void }[] = [];
class FakeImage {
  decoding = "";
  src = "";
  decode() {
    return new Promise<void>((resolve) => {
      decodes.push({ src: this.src, resolve });
    });
  }
}

beforeEach(() => {
  decodes = [];
  gridSpy.mockClear();
  vi.useFakeTimers();
  vi.stubGlobal("Image", FakeImage);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const press = async (name: RegExp) => {
  await act(async () => {
    screen.getByRole("button", { name }).click();
  });
};
const flush = (ms = 0) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

describe("a guest sends a photograph", () => {
  it("★ the album opens on eight photographs, and none of them is held or lit", () => {
    render(<HostGridArrivalDemo />);
    expect(laid()).toEqual(Array.from({ length: 8 }, (_, i) => `album-${i}`));
    expect(glowing()).toEqual([]);
    expect(decodes).toHaveLength(0);
  });

  it("★ the new one waits at the door for its photograph, then lands at the head and glows", async () => {
    render(<HostGridArrivalDemo />);
    await press(/a guest sends a photo/i);
    await flush();
    // Held: it is in the album's store and not yet in the rows, and its photograph has been sent for.
    expect(laid()).toHaveLength(8);
    expect(laid()).not.toContain("sent-0");
    expect(decodes).toHaveLength(1);
    expect(screen.getByText(/9 in the album/i)).toBeInTheDocument();

    await act(async () => {
      decodes[0].resolve();
    });
    await flush();
    expect(laid()[0]).toBe("sent-0");
    expect(laid()).toHaveLength(9);
    expect(glowing()).toEqual(["sent-0"]);
  });

  it("★ five at once is a burst: all five are held together and land newest first", async () => {
    render(<HostGridArrivalDemo />);
    await press(/five at once/i);
    await flush();
    expect(laid()).toHaveLength(8);
    expect(decodes).toHaveLength(5);
    await act(async () => {
      decodes.forEach((d) => d.resolve());
    });
    await flush();
    expect(laid().slice(0, 5)).toEqual([
      "sent-4",
      "sent-3",
      "sent-2",
      "sent-1",
      "sent-0",
    ]);
  });

  it("stops when the pool is spent, and Start again puts the album back as it opened", async () => {
    render(<HostGridArrivalDemo />);
    for (let i = 0; i < 6; i++) await press(/five at once/i);
    await flush(2500);
    expect(screen.getByText(/38 in the album/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /five at once/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /a guest sends a photo/i }),
    ).toBeDisabled();
    await press(/start again/i);
    await flush();
    expect(laid()).toEqual(Array.from({ length: 8 }, (_, i) => `album-${i}`));
    expect(screen.getByRole("button", { name: /five at once/i })).toBeEnabled();
  });
});

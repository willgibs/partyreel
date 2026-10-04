/**
 * THE STORAGE CHART, PINNED BY BEHAVIOUR (trash-in-storage): one bar against the cap with her albums and her Deleted
 * drawn apart, and beside it the two acts that free room without leaving it. What is pinned is what each act asks and
 * writes, never how it looks: Empty Deleted always asks (it cannot be undone), the switch asks only when it turns OFF
 * (from then a full plan refuses her guests' uploads), a refused write puts the switch back and says so, and every act
 * that landed refreshes the page that drew the figures. Its writes are a fake source, as the size list's are.
 */
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GIGABYTE } from "@/lib/constants/tiers";

vi.mock("@/app/(app)/dashboard/storage-actions", () => ({
  readStorageListAction: vi.fn(),
  deleteStorageItemsAction: vi.fn(),
  emptyDeletedAction: vi.fn(),
  setMakeRoomFromDeletedAction: vi.fn(),
}));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

import { StorageChart } from "./storage-chart";
import { StorageSourceProvider, type StorageSource } from "./storage-source";

const CAP = 100 * GIGABYTE;

function fakeSource(over: Partial<StorageSource> = {}): StorageSource {
  return {
    read: vi.fn(),
    deleteForGood: vi.fn(),
    emptyDeleted: vi.fn(async () => ({
      ok: true as const,
      items: 9,
      events: 1,
      freedBytes: 30 * GIGABYTE,
    })),
    setMakeRoom: vi.fn(async (on: unknown) => ({
      ok: true as const,
      on: on === true,
    })),
    switchPlan: vi.fn(),
    ...over,
  };
}

function draw(
  source: StorageSource,
  figures: Partial<{
    activeBytes: number;
    deletedBytes: number;
    capBytes: number | null;
    makeRoom: boolean;
  }> = {},
) {
  const { container } = render(
    <StorageSourceProvider source={source}>
      <StorageChart
        activeBytes={70 * GIGABYTE}
        deletedBytes={30 * GIGABYTE}
        capBytes={CAP}
        makeRoom
        {...figures}
      />
    </StorageSourceProvider>,
  );
  return container.querySelector("[data-storage-chart]") as HTMLElement;
}

const width = (chart: HTMLElement, segment: "albums" | "deleted") =>
  (chart.querySelector(`[data-segment="${segment}"]`) as HTMLElement).style
    .width;

async function answerConfirm(label: string) {
  const confirm = await screen.findByRole("alertdialog");
  await userEvent.click(within(confirm).getByRole("button", { name: label }));
}

beforeEach(() => {
  refresh.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe("the bar", () => {
  it("draws her albums and her Deleted apart, each as its share of the cap", () => {
    const chart = draw(fakeSource(), {
      activeBytes: 40 * GIGABYTE,
      deletedBytes: 10 * GIGABYTE,
    });
    expect(width(chart, "albums")).toBe("40%");
    expect(width(chart, "deleted")).toBe("10%");
    expect(
      chart.querySelector('[data-legend="albums"]')?.textContent,
    ).toContain("40 GB");
    expect(
      chart.querySelector('[data-legend="deleted"]')?.textContent,
    ).toContain("10 GB");
  });

  it("keeps an empty plan's bar bare, with no key to read", () => {
    const chart = draw(fakeSource(), { activeBytes: 0, deletedBytes: 0 });
    expect(chart.querySelector("[data-legend]")).toBeNull();
    expect(chart.querySelector("[data-empty-deleted]")).toBeNull();
    expect(chart.textContent).toContain("0 GB of 100 GB");
  });
});

describe("Make room from Deleted", () => {
  it("turns off only once she confirms, and writes it", async () => {
    const source = fakeSource();
    const chart = draw(source);
    const toggle = within(chart).getByRole("switch");
    expect(toggle.getAttribute("aria-checked")).toBe("true");

    await userEvent.click(toggle);
    await waitFor(() => expect(screen.getByRole("alertdialog")).toBeTruthy());
    expect(source.setMakeRoom).not.toHaveBeenCalled();

    await answerConfirm("Turn it off");
    await waitFor(() => expect(source.setMakeRoom).toHaveBeenCalledWith(false));
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it("stays on when she keeps it", async () => {
    const source = fakeSource();
    const chart = draw(source);
    await userEvent.click(within(chart).getByRole("switch"));
    await answerConfirm("Keep it on");
    expect(source.setMakeRoom).not.toHaveBeenCalled();
    expect(within(chart).getByRole("switch").getAttribute("aria-checked")).toBe(
      "true",
    );
  });

  it("turns on at once, asking nothing", async () => {
    const source = fakeSource();
    const chart = draw(source, { makeRoom: false });
    await userEvent.click(within(chart).getByRole("switch"));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    await waitFor(() => expect(source.setMakeRoom).toHaveBeenCalledWith(true));
  });

  it("goes back and says so when the write is refused", async () => {
    const source = fakeSource({
      setMakeRoom: vi.fn(async () => ({
        ok: false as const,
        code: "unknown" as const,
        message: "Couldn't save that. Please try again.",
      })),
    });
    const chart = draw(source, { makeRoom: false });
    const toggle = within(chart).getByRole("switch");
    await userEvent.click(toggle);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("★ reads the setting it shows: off, a full plan with Deleted to empty warns and names that fix", () => {
    // 70 GB kept and 30 GB in Deleted, full. On, an upload takes its room from Deleted: no warning.
    const on = draw(fakeSource());
    expect(on.querySelector("[data-storage-note]")?.textContent).not.toMatch(
      /almost full/i,
    );
    cleanup();
    const off = draw(fakeSource(), { makeRoom: false });
    expect(off.querySelector("[data-storage-note]")?.textContent).toMatch(
      /empty Deleted/i,
    );
  });
});

describe("Empty Deleted", () => {
  it("asks first, then empties it, says what it freed, and refreshes what is behind", async () => {
    const source = fakeSource();
    const chart = draw(source);
    await userEvent.click(
      chart.querySelector("[data-empty-deleted]") as HTMLElement,
    );
    expect(source.emptyDeleted).not.toHaveBeenCalled();
    await answerConfirm("Empty Deleted");
    await waitFor(() => expect(source.emptyDeleted).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("30 GB"),
      ),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it("empties nothing when she cancels", async () => {
    const source = fakeSource();
    const chart = draw(source);
    await userEvent.click(
      chart.querySelector("[data-empty-deleted]") as HTMLElement,
    );
    await answerConfirm("Cancel");
    expect(source.emptyDeleted).not.toHaveBeenCalled();
  });

  it("says so when emptying fails, and refreshes nothing", async () => {
    const source = fakeSource({
      emptyDeleted: vi.fn(async () => ({
        ok: false as const,
        code: "unknown" as const,
        message: "Couldn't empty Deleted. Please try again.",
      })),
    });
    const chart = draw(source);
    await userEvent.click(
      chart.querySelector("[data-empty-deleted]") as HTMLElement,
    );
    await answerConfirm("Empty Deleted");
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("is not offered while Deleted holds nothing", () => {
    const chart = draw(fakeSource(), { deletedBytes: 0 });
    expect(chart.querySelector("[data-empty-deleted]")).toBeNull();
  });
});

/**
 * THE SIZE LIST, PINNED BY BEHAVIOUR (host-storage r1: `order=flat` with the All or per-event
 * filter, `goal=live`, `refusal=inline`'s list door; round one's carried Download and bulk Remove
 * with the product's one Undo). Its reads and writes are a fake source, so these pin what the list
 * DOES with their answers: what it shows and in what order, what it sends to the server grouped
 * how, what it puts back, and what the strip's button runs, in what order. Words are read for
 * their facts, never their phrasing.
 */
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StorageListAnswer } from "@/app/(app)/dashboard/storage-actions";
import { GIGABYTE, planById } from "@/lib/constants/tiers";
import type { StorageItem } from "@/lib/db/queries/storage-list";

import { setReducedMotion } from "../../../../vitest.setup";

// The default source imports the Server Functions; every test hands its own instead.
vi.mock("@/app/(app)/dashboard/storage-actions", () => ({
  readStorageListAction: vi.fn(),
  removeStorageItemsAction: vi.fn(),
  restoreStorageItemsAction: vi.fn(),
}));
const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));
const startDownload = vi.fn(async () => true);
vi.mock("@/components/app/export/use-export-download", () => ({
  useExportDownload: () => ({ startDownload, fetchSummary: vi.fn() }),
}));

import { StorageList, type StorageGoal } from "./storage-list";
import { StorageSourceProvider, type StorageSource } from "./storage-source";

const WEDDING = "10000000-0000-4000-8000-000000000001";
const PARTY = "10000000-0000-4000-8000-000000000002";

function item(
  n: number,
  gb: number,
  eventId = WEDDING,
  over: Partial<StorageItem> = {},
): StorageItem {
  return {
    id: `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    eventId,
    type: "video",
    bytes: Math.round(gb * GIGABYTE),
    durationSeconds: 300,
    createdAt: "2026-06-14T18:00:00.000000+00:00",
    url: `https://r2.test/${n}`,
    previewUrl: null,
    by: { name: null, isHost: true, isVerified: true },
    ...over,
  };
}

const BIG = item(1, 9.4);
const MID = item(2, 4.1, PARTY);
const SMALL = item(3, 1.2);
const STORED = Math.round(110.83 * GIGABYTE);

function firstAnswer(items = [BIG, MID, SMALL]): StorageListAnswer {
  return {
    ok: true,
    items,
    next: null,
    overview: {
      storedBytes: STORED,
      events: [
        {
          id: WEDDING,
          name: "Maya & Theo",
          bytes: 80 * GIGABYTE,
          count: 2,
        },
        { id: PARTY, name: "Ivy turns one", bytes: 30 * GIGABYTE, count: 1 },
      ],
    },
  };
}

function fakeSource(over: Partial<StorageSource> = {}): StorageSource {
  return {
    read: vi.fn(async (ask: unknown) => {
      const eventId = (ask as { eventId?: string | null }).eventId ?? null;
      if (eventId === PARTY) {
        return { ok: true as const, items: [MID], next: null, overview: null };
      }
      return firstAnswer();
    }),
    remove: vi.fn(async () => ({ ok: true as const, removed: 1 })),
    restore: vi.fn(async (ids: unknown) => ({
      ok: true as const,
      restored: ids as string[],
      refused: [],
      message: null,
    })),
    switchPlan: vi.fn(async () => ({
      kind: "redirect" as const,
      url: "https://billing.stripe.test/confirm",
    })),
    ...over,
  };
}

function open(
  source: StorageSource,
  goal: StorageGoal | null = null,
  onChanged?: () => void,
) {
  render(
    <StorageSourceProvider source={source}>
      <StorageList
        back="Dashboard"
        goal={goal}
        open
        onOpenChange={() => {}}
        onChanged={onChanged}
      />
    </StorageSourceProvider>,
  );
  return screen.getByRole("dialog");
}

const rowIds = (dialog: HTMLElement) =>
  [...dialog.querySelectorAll("[data-storage-row]")].map((el) =>
    el.getAttribute("data-storage-row"),
  );

const checkboxFor = (dialog: HTMLElement, it: StorageItem) =>
  within(
    dialog.querySelector(`[data-storage-row="${it.id}"]`) as HTMLElement,
  ).getByRole("checkbox");

beforeEach(() => {
  setReducedMotion(true);
  push.mockReset();
  refresh.mockReset();
  startDownload.mockClear();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast).mockReset();
});

describe("what she stores, largest first", () => {
  it("opens on every event's items, largest first, with a chip per event", async () => {
    const source = fakeSource();
    const dialog = open(source);
    await waitFor(() => expect(rowIds(dialog)).toHaveLength(3));
    expect(rowIds(dialog)).toEqual([BIG.id, MID.id, SMALL.id]);
    expect(source.read).toHaveBeenCalledWith({ withOverview: true });
    const chips = dialog.querySelectorAll("[data-storage-chip]");
    expect([...chips].map((c) => c.getAttribute("data-storage-chip"))).toEqual([
      "all",
      WEDDING,
      PARTY,
    ]);
  });

  it("shows one event under its chip, read the first time it is chosen", async () => {
    const source = fakeSource();
    const dialog = open(source);
    await waitFor(() => expect(rowIds(dialog)).toHaveLength(3));
    await userEvent.click(
      dialog.querySelector(`[data-storage-chip="${PARTY}"]`) as HTMLElement,
    );
    await waitFor(() => expect(rowIds(dialog)).toEqual([MID.id]));
    expect(source.read).toHaveBeenLastCalledWith(
      expect.objectContaining({ eventId: PARTY, withOverview: false }),
    );
  });
});

describe("remove, and Undo", () => {
  it("removes a selection grouped by event, leading with the result, and offers it back", async () => {
    const source = fakeSource();
    const dialog = open(source);
    await waitFor(() => expect(rowIds(dialog)).toHaveLength(3));
    await userEvent.click(checkboxFor(dialog, BIG));
    await userEvent.click(checkboxFor(dialog, MID));
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Remove to Deleted" }),
    );
    await waitFor(() => expect(rowIds(dialog)).toEqual([SMALL.id]));
    expect(source.remove).toHaveBeenCalledWith([
      { id: BIG.id, eventId: WEDDING },
      { id: MID.id, eventId: PARTY },
    ]);

    // The act's own toast, with its one Undo: the rows come back, then the server restores.
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    const options = vi.mocked(toast.success).mock.calls[0][1] as unknown as {
      action: { onClick: () => void };
    };
    await act(async () => options.action.onClick());
    await waitFor(() =>
      expect(rowIds(dialog)).toEqual([BIG.id, MID.id, SMALL.id]),
    );
    expect(source.restore).toHaveBeenCalledWith([BIG.id, MID.id]);
  });

  it("puts the rows back and says why when the removal fails", async () => {
    const source = fakeSource({
      remove: vi.fn(async () => ({
        ok: false as const,
        code: "unknown" as const,
        message: "Couldn't remove those items. Please try again.",
        removedEvents: [],
      })),
    });
    const dialog = open(source);
    await waitFor(() => expect(rowIds(dialog)).toHaveLength(3));
    await userEvent.click(checkboxFor(dialog, SMALL));
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Remove to Deleted" }),
    );
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(rowIds(dialog)).toEqual([BIG.id, MID.id, SMALL.id]);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("tells its door and refreshes the page behind once, as it closes, never while open", async () => {
    // Opened from a refused price, the list lives inside that price's flipped row: a plan
    // re-read while it is open could put the row back and unmount the list under her.
    const changed = vi.fn();
    const dialog = open(fakeSource(), null, changed);
    await waitFor(() => expect(rowIds(dialog)).toHaveLength(3));
    await userEvent.click(checkboxFor(dialog, SMALL));
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Remove to Deleted" }),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(changed).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Close" }),
    );
    expect(changed).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});

describe("download hands off to the export", () => {
  it("starts one event's selection at once, and asks which when it spans two", async () => {
    const source = fakeSource();
    const dialog = open(source);
    await waitFor(() => expect(rowIds(dialog)).toHaveLength(3));
    await userEvent.click(checkboxFor(dialog, BIG));
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Download" }),
    );
    expect(startDownload).toHaveBeenCalledWith("host", {
      event_id: WEDDING,
      ids: [BIG.id],
      types: "all",
      include_hidden: true,
    });

    startDownload.mockClear();
    await userEvent.click(checkboxFor(dialog, MID));
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Download" }),
    );
    expect(startDownload).not.toHaveBeenCalled();
    const menu = await screen.findByRole("menu");
    const rows = within(menu).getAllByRole("menuitem");
    expect(rows).toHaveLength(2);
    await userEvent.click(rows[1]);
    expect(startDownload).toHaveBeenCalledWith(
      "host",
      expect.objectContaining({ event_id: PARTY, ids: [MID.id] }),
    );
  });
});

describe("the goal strip", () => {
  const pro100 = { ...planById("pro_100"), id: "pro_100" as const };
  const goal: StorageGoal = {
    target: pro100,
    capBytes: planById("pro_500").storageBytes,
    canSwitch: true,
    returnTo: "/account",
  };

  it("counts down, removes what is only selected, then asks the change-plan route", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    const order: string[] = [];
    const source = fakeSource({
      remove: vi.fn(async () => {
        order.push("remove");
        return { ok: true as const, removed: 2 };
      }),
      switchPlan: vi.fn(async () => {
        order.push("switch");
        return { kind: "redirect" as const, url: "https://stripe.test/c" };
      }),
    });
    const dialog = open(source, goal);
    await waitFor(() =>
      expect(dialog.querySelector("[data-storage-goal]")).toBeTruthy(),
    );
    const strip = dialog.querySelector("[data-storage-goal]") as HTMLElement;
    expect(strip.getAttribute("data-state")).toBe("counting");
    // Nothing to press until enough is freed.
    expect(within(strip).queryByRole("button")).toBeNull();

    await userEvent.click(checkboxFor(dialog, BIG));
    await userEvent.click(checkboxFor(dialog, MID));
    expect(strip.getAttribute("data-state")).toBe("remove-and-switch");
    await userEvent.click(within(strip).getByRole("button"));

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith("https://stripe.test/c"),
    );
    expect(order).toEqual(["remove", "switch"]);
    expect(source.switchPlan).toHaveBeenCalledWith("pro_100", "/account");
    vi.unstubAllGlobals();
  });

  it("re-bases on a refused switch, and says what is left", async () => {
    const source = fakeSource({
      switchPlan: vi.fn(async () => ({
        kind: "refused" as const,
        refusal: {
          code: "over_new_cap" as const,
          planId: "pro_100" as const,
          storedBytes: 104 * GIGABYTE,
          capBytes: 100 * GIGABYTE,
          gapBytes: 4 * GIGABYTE,
          fits: [],
          message: "You're storing 104 GB.",
        },
      })),
    });
    const dialog = open(source, goal);
    await waitFor(() => expect(rowIds(dialog)).toHaveLength(3));
    await userEvent.click(checkboxFor(dialog, BIG));
    await userEvent.click(checkboxFor(dialog, MID));
    const strip = dialog.querySelector("[data-storage-goal]") as HTMLElement;
    await userEvent.click(within(strip).getByRole("button"));
    // 13.5 GB went; a guest's uploads meanwhile left 104 GB against 100 GB.
    await waitFor(() =>
      expect(strip.getAttribute("data-state")).toBe("counting"),
    );
    expect(strip.textContent).toContain("4 GB");
    expect(toast).toHaveBeenCalledWith("You're storing 104 GB.");
  });

  // ★ crumbs-20 (one of the ROADMAP's six bare `/login`s): a session that lapsed while the list was open
  // sends her to sign in and back to the page she was on, not to the dashboard.
  it("sends her to sign in, carrying this page, when the switch finds her signed out", async () => {
    vi.stubGlobal("location", { ...window.location, pathname: "/dashboard" });
    try {
      const source = fakeSource({
        switchPlan: vi.fn(async () => ({ kind: "signin" as const })),
      });
      const dialog = open(source, goal);
      await waitFor(() => expect(rowIds(dialog)).toHaveLength(3));
      await userEvent.click(checkboxFor(dialog, BIG));
      await userEvent.click(checkboxFor(dialog, MID));
      const strip = dialog.querySelector("[data-storage-goal]") as HTMLElement;
      await userEvent.click(within(strip).getByRole("button"));
      await waitFor(() =>
        expect(push).toHaveBeenCalledWith("/login?next=%2Fdashboard"),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("offers no switch while her subscription cannot change here", async () => {
    const dialog = open(fakeSource(), { ...goal, canSwitch: false });
    await waitFor(() => expect(rowIds(dialog)).toHaveLength(3));
    await userEvent.click(checkboxFor(dialog, BIG));
    await userEvent.click(checkboxFor(dialog, MID));
    const strip = dialog.querySelector("[data-storage-goal]") as HTMLElement;
    expect(strip.getAttribute("data-state")).toBe("remove-and-switch");
    expect(within(strip).queryByRole("button")).toBeNull();
  });
});

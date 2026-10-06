/**
 * THE SIZE LIST, PINNED BY BEHAVIOUR (host-storage r1: `order=flat` with the All or per-event
 * filter, `goal=live`, `refusal=inline`'s list door; round one's carried Download). Its reads and
 * writes are a fake source, so these pin what the list DOES with their answers: what it shows and
 * in what order, what it sends to the server grouped how, what it puts back, and what the strip's
 * button runs, in what order. Words are read for their facts, never their phrasing.
 *
 * ★ RESHAPED ON PURPOSE (trash-in-storage, 2026-10-03; scar kept: grouped by event, leading with the
 * result, a failure put back and said, the door told once as the list closes, the strip deleting
 * before it switches). Deleted counts in storage, so the bar's Remove to Deleted and its Undo
 * retired: its act is Delete for good, behind a confirm since it cannot be undone, and Deleted
 * heads the list with its own Empty.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
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
  deleteStorageItemsAction: vi.fn(),
  emptyDeletedAction: vi.fn(),
  setMakeRoomFromDeletedAction: vi.fn(),
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

import { PricingDoorsProvider } from "@/components/app/pricing/pricing-doors";

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
/** What her Deleted holds: with her events' 60 GB, she stores 60.83 GB. */
const DELETED = Math.round(0.83 * GIGABYTE);

function firstAnswer(
  items = [BIG, MID, SMALL],
  deletedBytes = DELETED,
): StorageListAnswer {
  return {
    ok: true,
    items,
    next: null,
    overview: {
      storedBytes: 60 * GIGABYTE + deletedBytes,
      deletedBytes,
      events: [
        {
          id: WEDDING,
          name: "Maya & Theo",
          bytes: 40 * GIGABYTE,
          count: 2,
        },
        { id: PARTY, name: "Ivy turns one", bytes: 20 * GIGABYTE, count: 1 },
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
    deleteForGood: vi.fn(async (items: unknown) => ({
      ok: true as const,
      deleted: (items as unknown[]).length,
    })),
    emptyDeleted: vi.fn(async () => ({
      ok: true as const,
      items: 4,
      events: 0,
      freedBytes: DELETED,
      more: false,
    })),
    setMakeRoom: vi.fn(async (on: unknown) => ({
      ok: true as const,
      on: Boolean(on),
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

/** The one confirm every act that cannot be undone passes through: answer it with one of its two buttons. */
async function answerConfirm(label: string) {
  const confirm = await screen.findByRole("alertdialog");
  await userEvent.click(within(confirm).getByRole("button", { name: label }));
}

/**
 * ★ THE LIST'S FIRST RENDER GETS A LOADED MACHINE'S TIME (crumbs-83, gate 24). The body is `storage-list.tsx`'s lazy
 * chunk, so the first test of a run transforms and imports it inside its first wait; on a quiet machine that is well
 * under `waitFor`'s default second, but with another lane's build holding nine cores the first test timed out on a list
 * that renders fine. Whichever test runs first pays it (`-t` can make any one first), so every test's first wait is
 * this one, and each test is given room past it. A budget, not a timing claim: a list that never renders still fails,
 * only later.
 */
const FIRST_RENDER = { timeout: 10_000 };
vi.setConfig({ testTimeout: 20_000 });

/** Every item of the first read, listed: the list has rendered. */
const firstRows = (dialog: HTMLElement) =>
  waitFor(() => expect(rowIds(dialog)).toHaveLength(3), FIRST_RENDER);

/** The goal strip, drawn over the first read: the list has rendered. */
const firstStrip = (dialog: HTMLElement) =>
  waitFor(
    () => expect(dialog.querySelector("[data-storage-goal]")).toBeTruthy(),
    FIRST_RENDER,
  );

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
    await firstRows(dialog);
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
    await firstRows(dialog);
    await userEvent.click(
      dialog.querySelector(`[data-storage-chip="${PARTY}"]`) as HTMLElement,
    );
    await waitFor(() => expect(rowIds(dialog)).toEqual([MID.id]));
    expect(source.read).toHaveBeenLastCalledWith(
      expect.objectContaining({ eventId: PARTY, withOverview: false }),
    );
  });
});

describe("Delete for good", () => {
  it("asks first, then deletes a selection grouped by event, leading with the result", async () => {
    const source = fakeSource();
    const dialog = open(source);
    await firstRows(dialog);
    await userEvent.click(checkboxFor(dialog, BIG));
    await userEvent.click(checkboxFor(dialog, MID));
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Delete for good" }),
    );
    // Nothing leaves until she says so: it cannot be undone.
    expect(source.deleteForGood).not.toHaveBeenCalled();
    expect(rowIds(dialog)).toHaveLength(3);

    await answerConfirm("Delete for good");
    await waitFor(() => expect(rowIds(dialog)).toEqual([SMALL.id]));
    expect(source.deleteForGood).toHaveBeenCalledWith([
      { id: BIG.id, eventId: WEDDING },
      { id: MID.id, eventId: PARTY },
    ]);
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("deletes nothing when she cancels", async () => {
    const source = fakeSource();
    const dialog = open(source);
    await firstRows(dialog);
    await userEvent.click(checkboxFor(dialog, SMALL));
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Delete for good" }),
    );
    await answerConfirm("Cancel");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(source.deleteForGood).not.toHaveBeenCalled();
    expect(rowIds(dialog)).toHaveLength(3);
  });

  it("puts the rows back and says why when the deletion fails", async () => {
    const source = fakeSource({
      deleteForGood: vi.fn(async () => ({
        ok: false as const,
        code: "unknown" as const,
        message: "Couldn't remove those items. Please try again.",
        deletedEvents: [],
      })),
    });
    const dialog = open(source);
    await firstRows(dialog);
    await userEvent.click(checkboxFor(dialog, SMALL));
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Delete for good" }),
    );
    await answerConfirm("Delete for good");
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(rowIds(dialog)).toEqual([BIG.id, MID.id, SMALL.id]);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("tells its door and refreshes the page behind once, as it closes, never while open", async () => {
    // Opened from a refused price, the list lives inside that price's flipped row: a plan
    // re-read while it is open could put the row back and unmount the list under her.
    const changed = vi.fn();
    const dialog = open(fakeSource(), null, changed);
    await firstRows(dialog);
    await userEvent.click(checkboxFor(dialog, SMALL));
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Delete for good" }),
    );
    await answerConfirm("Delete for good");
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

/**
 * ★ DELETED HEADS THE LIST (trash-in-storage): what she already deleted still counts toward her plan, so it is the
 * first room to free, in one press, before anything she kept; emptied, the figures the list counts from drop by it.
 */
describe("Deleted, first", () => {
  it("names what Deleted holds and empties it, once she confirms", async () => {
    const source = fakeSource();
    const dialog = open(source);
    await firstRows(dialog);
    const deleted = dialog.querySelector(
      "[data-storage-deleted]",
    ) as HTMLElement;
    expect(deleted.textContent).toContain("850 MB");
    await userEvent.click(
      within(deleted).getByRole("button", { name: "Empty" }),
    );
    expect(source.emptyDeleted).not.toHaveBeenCalled();

    await answerConfirm("Empty Deleted");
    await waitFor(() =>
      expect(dialog.querySelector("[data-storage-deleted]")).toBeNull(),
    );
    expect(source.emptyDeleted).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalled();
    // Her kept items are untouched.
    expect(rowIds(dialog)).toEqual([BIG.id, MID.id, SMALL.id]);
  });

  it("is not there when Deleted holds nothing", async () => {
    const dialog = open(
      fakeSource({ read: vi.fn(async () => firstAnswer(undefined, 0)) }),
    );
    await firstRows(dialog);
    expect(dialog.querySelector("[data-storage-deleted]")).toBeNull();
  });

  it("stays where it was and says why when emptying fails", async () => {
    const source = fakeSource({
      emptyDeleted: vi.fn(async () => ({
        ok: false as const,
        code: "unknown" as const,
        message: "Couldn't empty Deleted. Please try again.",
      })),
    });
    const dialog = open(source);
    await firstRows(dialog);
    const deleted = dialog.querySelector(
      "[data-storage-deleted]",
    ) as HTMLElement;
    await userEvent.click(
      within(deleted).getByRole("button", { name: "Empty" }),
    );
    await answerConfirm("Empty Deleted");
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(dialog.querySelector("[data-storage-deleted]")).toBeTruthy();
    expect(toast.success).not.toHaveBeenCalled();
  });

  // The Advisor's Q23: Empty Deleted goes a batch a call, so an action that ran out of time answers what it freed with
  // more still there; the row keeps what is left, with its Empty to finish.
  it("keeps what is left, with its Empty, when an Empty answers with more still there", async () => {
    const source = fakeSource({
      emptyDeleted: vi.fn(async () => ({
        ok: true as const,
        items: 2_000,
        events: 0,
        freedBytes: Math.round(0.5 * GIGABYTE),
        more: true,
      })),
    });
    const dialog = open(source);
    await firstRows(dialog);
    const deleted = dialog.querySelector(
      "[data-storage-deleted]",
    ) as HTMLElement;
    await userEvent.click(
      within(deleted).getByRole("button", { name: "Empty" }),
    );
    await answerConfirm("Empty Deleted");
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/still holds more/),
      ),
    );
    const left = dialog.querySelector("[data-storage-deleted]") as HTMLElement;
    // 850 MB less the 512 MB that left, rounded up.
    expect(left.textContent).toContain("338 MB");
    expect(within(left).getByRole("button", { name: "Empty" })).toBeTruthy();
  });

  it("counts what emptying it freed toward her own plan's goal", async () => {
    // 60.83 GB stored on a 60 GB plan: Deleted's 850 MB is the whole gap.
    const dialog = open(fakeSource(), {
      kind: "fit",
      capBytes: 60 * GIGABYTE,
    });
    await firstStrip(dialog);
    const strip = dialog.querySelector("[data-storage-goal]") as HTMLElement;
    expect(strip.getAttribute("data-state")).toBe("counting");
    const deleted = dialog.querySelector(
      "[data-storage-deleted]",
    ) as HTMLElement;
    await userEvent.click(
      within(deleted).getByRole("button", { name: "Empty" }),
    );
    await answerConfirm("Empty Deleted");
    await waitFor(() => expect(strip.getAttribute("data-state")).toBe("fits"));
  });
});

describe("download hands off to the export", () => {
  it("starts one event's selection at once, and asks which when it spans two", async () => {
    const source = fakeSource();
    const dialog = open(source);
    await firstRows(dialog);
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
  const pro50 = { ...planById("pro_50"), id: "pro_50" as const };
  const goal: StorageGoal = {
    target: pro50,
    canSwitch: true,
    returnTo: "/account",
  };

  /* RESHAPED ON PURPOSE (crumbs-83; scar kept: it counts down, asks once, deletes first, then asks the route). It ended in
     `window.location.assign`, which left for Stripe past the pricing doors' way out: on a phone, over the list's own
     history entry and the plan's under it. The strip leaves by the doors' `leave` now (`leave.ts` decides the history,
     and `pricing-sheet.back.test.tsx` walks the phone's Backs home); this pins that it takes no other way. */
  it("counts down, asks once, deletes what is only selected, then asks the change-plan route, and leaves by the doors' way out", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    const leave = vi.fn((url: string) => {
      order.push(`leave ${url}`);
    });
    const order: string[] = [];
    const source = fakeSource({
      deleteForGood: vi.fn(async () => {
        order.push("delete");
        return { ok: true as const, deleted: 2 };
      }),
      switchPlan: vi.fn(async () => {
        order.push("switch");
        return { kind: "redirect" as const, url: "https://stripe.test/c" };
      }),
    });
    render(
      <PricingDoorsProvider
        doors={{
          readFacts: async () => null,
          startCheckout: vi.fn(),
          openPortal: vi.fn(),
          changePlan: vi.fn(),
          leave,
        }}
      >
        <StorageSourceProvider source={source}>
          <StorageList
            back="Your plan"
            goal={goal}
            open
            onOpenChange={() => {}}
          />
        </StorageSourceProvider>
      </PricingDoorsProvider>,
    );
    const dialog = screen.getByRole("dialog");
    await firstStrip(dialog);
    const strip = dialog.querySelector("[data-storage-goal]") as HTMLElement;
    expect(strip.getAttribute("data-state")).toBe("counting");
    // Nothing to press until enough is freed.
    expect(within(strip).queryByRole("button")).toBeNull();

    await userEvent.click(checkboxFor(dialog, BIG));
    await userEvent.click(checkboxFor(dialog, MID));
    expect(strip.getAttribute("data-state")).toBe("delete-and-switch");
    await userEvent.click(within(strip).getByRole("button"));
    expect(order).toEqual([]);
    await answerConfirm("Delete and switch");

    await waitFor(() =>
      expect(leave).toHaveBeenCalledWith("https://stripe.test/c"),
    );
    expect(order).toEqual(["delete", "switch", "leave https://stripe.test/c"]);
    expect(source.switchPlan).toHaveBeenCalledWith("pro_50", "/account");
    // The old strip's own way out, past the doors.
    expect(assign).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("re-bases on a refused switch, and says what is left", async () => {
    const source = fakeSource({
      switchPlan: vi.fn(async () => ({
        kind: "refused" as const,
        refusal: {
          code: "over_new_cap" as const,
          planId: "pro_50" as const,
          storedBytes: 54 * GIGABYTE,
          capBytes: 50 * GIGABYTE,
          gapBytes: 4 * GIGABYTE,
          fits: [],
          message: "You're storing 54 GB.",
        },
      })),
    });
    const dialog = open(source, goal);
    await firstRows(dialog);
    await userEvent.click(checkboxFor(dialog, BIG));
    await userEvent.click(checkboxFor(dialog, MID));
    const strip = dialog.querySelector("[data-storage-goal]") as HTMLElement;
    await userEvent.click(within(strip).getByRole("button"));
    await answerConfirm("Delete and switch");
    // 13.5 GB went; a guest's uploads meanwhile left 54 GB against 50 GB.
    await waitFor(() =>
      expect(strip.getAttribute("data-state")).toBe("counting"),
    );
    expect(strip.textContent).toContain("4 GB");
    expect(toast).toHaveBeenCalledWith("You're storing 54 GB.");
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
      await firstRows(dialog);
      await userEvent.click(checkboxFor(dialog, BIG));
      await userEvent.click(checkboxFor(dialog, MID));
      const strip = dialog.querySelector("[data-storage-goal]") as HTMLElement;
      await userEvent.click(within(strip).getByRole("button"));
      await answerConfirm("Delete and switch");
      await waitFor(() =>
        expect(push).toHaveBeenCalledWith("/login?next=%2Fdashboard"),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("offers no switch while her subscription cannot change here", async () => {
    const dialog = open(fakeSource(), { ...goal, canSwitch: false });
    await firstRows(dialog);
    await userEvent.click(checkboxFor(dialog, BIG));
    await userEvent.click(checkboxFor(dialog, MID));
    const strip = dialog.querySelector("[data-storage-goal]") as HTMLElement;
    expect(strip.getAttribute("data-state")).toBe("delete-and-switch");
    expect(within(strip).queryByRole("button")).toBeNull();
  });
});

/**
 * ★ HER OWN PLAN AS THE GOAL (crumbs-32, from `storage-wiring`): the over-cap grace banner said "largest files first"
 * with no door. Its door (and the meter's, while she is over) opens the list counting down to her own cap: the gap
 * is what she stores past it, Deleted included, the count runs on what she selects and deletes for good, and nothing
 * is switched (there is no plan to switch to), so the strip carries no button and the bar's Delete for good is the act.
 */
describe("her own plan's goal", () => {
  // She stores 60.83 GB on a 50 GB plan: 10.83 GB past it.
  const fit: StorageGoal = { kind: "fit", capBytes: 50 * GIGABYTE };

  it("★ counts down to her own cap and says where she stands, with nothing to switch", async () => {
    const source = fakeSource();
    const dialog = open(source, fit);
    await firstStrip(dialog);
    const strip = dialog.querySelector("[data-storage-goal]") as HTMLElement;
    expect(strip.getAttribute("data-state")).toBe("counting");
    expect(strip.textContent).toContain("10.9 GB");
    expect(strip.textContent).toContain("to fit your plan");
    expect(within(strip).queryByRole("button")).toBeNull();

    // 9.4 GB selected leaves 1.43 GB; 4.1 GB more closes it, only selected.
    await userEvent.click(checkboxFor(dialog, BIG));
    expect(strip.getAttribute("data-state")).toBe("counting");
    expect(strip.textContent).toContain("1.5 GB");
    await userEvent.click(checkboxFor(dialog, MID));
    expect(strip.getAttribute("data-state")).toBe("delete");
    expect(within(strip).queryByRole("button")).toBeNull();

    // The bar's Delete for good is the act: deleted, the gap is freed.
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Delete for good" }),
    );
    await answerConfirm("Delete for good");
    await waitFor(() => expect(strip.getAttribute("data-state")).toBe("fits"));
    expect(source.deleteForGood).toHaveBeenCalledTimes(1);
    expect(source.switchPlan).not.toHaveBeenCalled();
  });

  it("keeps Deleted's own note: her plan holds her events and Deleted together", async () => {
    const dialog = open(fakeSource(), fit);
    await firstRows(dialog);
    expect(
      dialog
        .querySelector("[data-storage-note]")
        ?.getAttribute("data-storage-note"),
    ).toBe("deleted");
  });
});

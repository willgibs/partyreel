/**
 * THE UPLOADS LINE IN THE STORAGE RING'S POPOVER, PINNED BY BEHAVIOUR (uploads-meter-ui): the host sees this month's
 * uploads against her plan's own allowance, so Free's 300 MB a month is never a surprise. What has to hold, never how it
 * looks:
 *
 *  1. IT READS ONLY WHEN THE POPOVER OPENS: nothing is asked while it is closed (never a call on the dashboard's load,
 *     never a poll: the compute budget counts every call), one read per open, and the last figure stays for the next
 *     look while it refreshes.
 *  2. IT SAYS WHAT IS KNOWN AND NEVER A GUESS: a read that fails, a pass (it counts its own year, which the month's
 *     ledger is not) and an unmetered Pro say nothing at all, and never a zero.
 *  3. AT THE ALLOWANCE IT SAYS WHAT PAUSES AND WHEN IT RESUMES, in the warning tone.
 *  4. WHILE THE READ IS OUT IT HOLDS ITS PLACE, only where a line will come, so nothing below it jumps when it lands
 *     and a plan with no line never waits for one.
 *
 * Lines are found by what they are FOR (`data-uploads`), never by their words; the words are read for their facts.
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlanFacts } from "@/lib/billing/plan-facts";
import { GIGABYTE, MEGABYTE, planById } from "@/lib/constants/tiers";

vi.mock("@/app/(app)/dashboard/storage-actions", () => ({
  readStorageListAction: vi.fn(),
  deleteStorageItemsAction: vi.fn(),
  emptyDeletedAction: vi.fn(),
  setMakeRoomFromDeletedAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { StorageMeter } from "./storage-meter";

const FREE_ROOM = planById("free").storageBytes;

/** What `/api/stripe/plan-facts` would answer; null = the read fails (the Library, or an outage). */
let served: PlanFacts | null = null;
/** A held read: the answer waits for it. */
let gate: Promise<void> | null = null;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  served = null;
  gate = null;
  fetchMock = vi.fn(async (url: string) => {
    if (gate) await gate;
    if (url !== "/api/stripe/plan-facts" || !served) {
      return { ok: false, json: async () => ({}) };
    }
    return { ok: true, json: async () => ({ ok: true, facts: served }) };
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function facts(over: Partial<PlanFacts>): PlanFacts {
  return {
    tier: "free",
    hasBilling: false,
    passExpiry: null,
    storedBytes: 40 * MEGABYTE,
    deletedBytes: 0,
    capBytes: FREE_ROOM,
    monthUploadedBytes: 0,
    currentPlanId: null,
    changeBlocked: null,
    ...over,
  };
}

function draw(props: Partial<React.ComponentProps<typeof StorageMeter>> = {}) {
  render(
    <StorageMeter
      activeBytes={40 * MEGABYTE}
      deletedBytes={0}
      storageCap={FREE_ROOM}
      makeRoom
      passExpiry={null}
      planName="Free"
      hasBilling={false}
      isEventPass={false}
      tier="free"
      {...props}
    />,
  );
}

async function openPopover() {
  await userEvent.click(screen.getByRole("button", { name: /^Storage:/ }));
  return screen.findByRole("dialog");
}

const line = () => document.querySelector<HTMLElement>("[data-uploads]");

describe("when it reads", () => {
  it("asks nothing until the popover opens, then once for the open", async () => {
    served = facts({ monthUploadedBytes: 240 * MEGABYTE });
    draw();
    expect(fetchMock).not.toHaveBeenCalled();

    await openPopover();
    await waitFor(() => expect(line()?.textContent).toContain("240 MB"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/stripe/plan-facts",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("asks again at the next open, and shows the last figure at once while it refreshes", async () => {
    served = facts({ monthUploadedBytes: 240 * MEGABYTE });
    draw();
    await openPopover();
    await waitFor(() => expect(line()?.textContent).toContain("240 MB"));

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(line()).toBeNull());

    // The second read is held: the figure from the first stays on screen meanwhile.
    let release: () => void = () => {};
    gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    served = facts({ monthUploadedBytes: 260 * MEGABYTE });
    await openPopover();
    expect(line()?.textContent).toContain("240 MB");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => release());
    await waitFor(() => expect(line()?.textContent).toContain("260 MB"));
  });
});

describe("what it says", () => {
  it("reads Free's month against Free's own allowance", async () => {
    served = facts({ monthUploadedBytes: Math.round(1.2 * GIGABYTE) });
    draw();
    await openPopover();
    await waitFor(() => expect(line()).not.toBeNull());
    const text = line()?.textContent ?? "";
    expect(text).toContain("1.2 GB");
    expect(text).toContain("300 MB");
    expect(text).toMatch(/uploads/i);
  });

  it("reads a Pro host against her size's allowance, from the read's own cap", async () => {
    const pro = planById("pro_200");
    served = facts({
      tier: "pro",
      capBytes: pro.storageBytes,
      monthUploadedBytes: 150 * GIGABYTE,
    });
    draw({ tier: "pro", storageCap: pro.storageBytes, planName: "Pro" });
    await openPopover();
    await waitFor(() => expect(line()).not.toBeNull());
    expect(line()?.textContent).toContain("150 GB");
    expect(line()?.textContent).toContain("200 GB");
    expect(line()?.hasAttribute("data-paused")).toBe(false);
  });

  it("★ at the allowance, says what pauses and when it resumes, in the warning tone", async () => {
    served = facts({ monthUploadedBytes: planById("free").uploadsBytes });
    draw();
    await openPopover();
    await waitFor(() => expect(line()?.hasAttribute("data-paused")).toBe(true));
    const text = line()?.textContent ?? "";
    expect(text).toMatch(/new uploads/i);
    expect(text).toMatch(/guests/);
    expect(text).toMatch(/paused until [A-Z][a-z]+ 1\b/);
    // The figure's own line is the one that turns amber.
    expect(line()?.querySelector("p")?.className).toMatch(/text-warning/);
  });

  it("★ says nothing for a pass, whose year the month's ledger is not", async () => {
    served = facts({
      tier: "event_pass",
      capBytes: planById("event_pass").storageBytes,
      monthUploadedBytes: 3 * GIGABYTE,
    });
    draw({ tier: "event_pass", isEventPass: true, planName: "Event Pass" });
    await openPopover();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await act(async () => {});
    expect(line()).toBeNull();
    expect(screen.queryByText(/Uploads this/)).toBeNull();
  });

  it("★ says nothing for a Pro whose cap is not on record (unmetered), and nothing when the month's figure is unknown", async () => {
    served = facts({
      tier: "pro",
      capBytes: null,
      monthUploadedBytes: GIGABYTE,
    });
    draw({ tier: "pro", storageCap: null, planName: "Pro" });
    await openPopover();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await act(async () => {});
    expect(line()).toBeNull();
  });

  it("★ says nothing, never a zero, when the read fails or the ledger's figure is missing", async () => {
    // The whole read fails (a 401 in the Library, an outage).
    served = null;
    draw();
    await openPopover();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() => expect(line()).toBeNull());
    expect(screen.queryByText(/Uploads this/)).toBeNull();
  });

  it("says nothing when the route answered without the month's figure (its own ledger read failed)", async () => {
    served = facts({ monthUploadedBytes: null });
    draw();
    await openPopover();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await act(async () => {});
    expect(line()).toBeNull();
    expect(screen.queryByText(/0 MB of 300 MB/)).toBeNull();
  });
});

describe("while the read is out", () => {
  it("holds the line's place for a plan that has one, then fills it", async () => {
    let release: () => void = () => {};
    gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    served = facts({ monthUploadedBytes: 100 * MEGABYTE });
    draw();
    await openPopover();
    expect(line()?.getAttribute("data-uploads")).toBe("waiting");
    expect(line()?.getAttribute("aria-busy")).toBe("true");

    await act(async () => release());
    await waitFor(() => expect(line()?.getAttribute("data-uploads")).toBe(""));
    expect(line()?.textContent).toContain("100 MB");
    expect(line()?.hasAttribute("aria-busy")).toBe(false);
  });

  it("takes its place away when the read comes back empty", async () => {
    let release: () => void = () => {};
    gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    served = null;
    draw();
    await openPopover();
    expect(line()?.getAttribute("data-uploads")).toBe("waiting");

    await act(async () => release());
    await waitFor(() => expect(line()).toBeNull());
  });

  it("holds no place for a plan that never gets a line", async () => {
    gate = new Promise<void>(() => {});
    draw({ tier: "event_pass", isEventPass: true, planName: "Event Pass" });
    await openPopover();
    expect(line()).toBeNull();
  });
});

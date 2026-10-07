/**
 * THE OVER-CAP GRACE BANNER (crumbs-32's door; host-moments r1, `banner=number`): it says how far over she is and by
 * when, and its one key, Free <the number>, opens the size list counting down that same number to her own plan's
 * cap, Deleted at its head (trash-in-storage: what she already deleted counts, and leaves first at the deadline), with
 * See plans beside it. The list's reads are a fake source (as `storage-list.test.tsx`'s), and the plans sheet a
 * stand-in: what is pinned is the number, said once for the banner and the list, and the door opening on her cap.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { GIGABYTE } from "@/lib/constants/tiers";

vi.mock("@/app/(app)/dashboard/storage-actions", () => ({
  readStorageListAction: vi.fn(),
  deleteStorageItemsAction: vi.fn(),
  emptyDeletedAction: vi.fn(),
  setMakeRoomFromDeletedAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/app/export/use-export-download", () => ({
  useExportDownload: () => ({ startDownload: vi.fn(), fetchSummary: vi.fn() }),
}));
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: ({ children }: { children: ReactNode }) => children,
}));

import { GraceBanner, graceWords, planWithCap } from "./grace-banner";
import {
  StorageSourceProvider,
  type StorageSource,
} from "@/components/app/storage/storage-source";

const WEDDING = "10000000-0000-4000-8000-000000000001";

// The list's body is a lazy chunk (`storage-list.tsx`), so the first open pays a cold import of its whole module graph:
// about a quarter of a second alone, and a loaded machine stretches it past the one second a `waitFor` gives. Awaited
// here, under the hook's own longer budget, so the waits below are only for the list's own states. (What is left in
// them is React's: a lazy body shows 300 ms after its skeleton, a fixed floor that never scales with the machine.)
beforeAll(async () => {
  await import("@/components/app/storage/storage-list-body");
});

function source(): StorageSource {
  return {
    read: vi.fn(async () => ({
      ok: true as const,
      items: [
        {
          id: "20000000-0000-4000-8000-000000000001",
          eventId: WEDDING,
          type: "video" as const,
          bytes: Math.round(0.4 * GIGABYTE),
          durationSeconds: 300,
          createdAt: "2026-06-14T18:00:00.000000+00:00",
          url: "https://r2.test/1",
          previewUrl: null,
          by: { name: null, isHost: true, isVerified: true },
        },
      ],
      next: null,
      overview: {
        // A lapsed plan's 100 MB cap, 1.25 GB stored: 1 GB in her event, 0.25 GB in Deleted.
        storedBytes: Math.round(1.25 * GIGABYTE),
        deletedBytes: Math.round(0.25 * GIGABYTE),
        events: [
          {
            id: WEDDING,
            name: "Maya & Theo",
            bytes: 1 * GIGABYTE,
            count: 1,
          },
        ],
      },
    })),
    deleteForGood: vi.fn(),
    emptyDeleted: vi.fn(),
    setMakeRoom: vi.fn(),
    switchPlan: vi.fn(),
  };
}

describe("the over-cap grace banner", () => {
  // ★ RESHAPED ON PURPOSE (host-moments r1, `banner=number`; scar kept: the banner's door opens the size list on her
  // own plan's cap, counting down, Deleted at its head). The expired reason: "see what's using space", a link in a
  // sentence; the door is the banner's one key now, and it says the number the list counts down.
  it("★ its one key says the number, and opens the size list counting down that same number to her cap", async () => {
    render(
      <StorageSourceProvider source={source()}>
        <GraceBanner
          deadline="November 3"
          storageUsed={Math.round(1.25 * GIGABYTE)}
          storageCap={100 * 1024 ** 2}
          plan={{ tier: "free", hasBilling: true }}
        />
      </StorageSourceProvider>,
    );
    const banner = document.querySelector<HTMLElement>("[data-grace-banner]")!;
    // 1.25 GB stored against 100 MB: 1.15 GB to free, printed up to the tenth as every figure she must free is.
    expect(banner.textContent).toContain("1.2 GB over Free 100 MB");
    expect(banner.textContent).toContain("Free it by November 3");
    // Both ways out are keys: the freeing first, the plans beside it.
    expect(screen.getByRole("button", { name: "See plans" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Free 1.2 GB" }));
    const dialog = await screen.findByRole("dialog");
    await waitFor(() =>
      expect(dialog.querySelector("[data-storage-goal]")).toBeTruthy(),
    );
    const strip = dialog.querySelector("[data-storage-goal]") as HTMLElement;
    expect(strip.getAttribute("data-state")).toBe("counting");
    // ★ The list counts down the banner's own number.
    expect(strip.textContent).toContain("1.2 GB");
    // What she already deleted heads the list: the first room to free, as it is the sweep's first.
    expect(dialog.querySelector("[data-storage-deleted]")).toBeTruthy();
  });

  it("★ says nothing where nothing is over: room already freed, or a plan with no cap", () => {
    const { container, rerender } = render(
      <GraceBanner
        deadline="November 3"
        storageUsed={100 * 1024 ** 2}
        storageCap={100 * 1024 ** 2}
        plan={{ tier: "free", hasBilling: false }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
    rerender(
      <GraceBanner
        deadline="November 3"
        storageUsed={5 * GIGABYTE}
        storageCap={null}
        plan={{ tier: "pro", hasBilling: true }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("the banner's words", () => {
  it("the number over her plan, named with its size; by when; and the key that frees it", () => {
    expect(
      graceWords({
        storedBytes: Math.round(55.3 * GIGABYTE),
        capBytes: 50 * GIGABYTE,
        tier: "pro",
        deadline: "November 5",
      }),
    ).toEqual({
      title: "5.3 GB over Pro 50 GB",
      line: "Free it by November 5, or choose a bigger plan. After that we'll make room for you: Deleted first, then your largest files.",
      free: "Free 5.3 GB",
    });
  });

  it("★ rounds the number up, so freeing exactly what it says is enough", () => {
    // 5.21 GB over reads 5.3 GB, never the nearest tenth's 5.2 GB, which would leave her 0.01 GB over.
    expect(
      graceWords({
        storedBytes: Math.round(55.21 * GIGABYTE),
        capBytes: 50 * GIGABYTE,
        tier: "pro",
        deadline: "November 5",
      })?.free,
    ).toBe("Free 5.3 GB");
  });

  it("offers a bigger plan only where one exists, and names each plan by its size", () => {
    const largest = graceWords({
      storedBytes: 1100 * GIGABYTE,
      capBytes: 1024 * GIGABYTE,
      tier: "pro",
      deadline: "November 5",
    });
    expect(largest?.title).toBe("76 GB over Pro 1 TB");
    expect(largest?.line).toMatch(/^Free it by November 5\. After that/);
    expect(planWithCap("free", 100 * 1024 ** 2)).toBe("Free 100 MB");
    expect(planWithCap("event_pass", 50 * GIGABYTE)).toBe("Event Pass 50 GB");
    expect(
      graceWords({
        storedBytes: 50 * GIGABYTE,
        capBytes: 50 * GIGABYTE,
        tier: "pro",
        deadline: "November 5",
      }),
    ).toBeNull();
  });
});

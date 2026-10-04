/**
 * THE OVER-CAP GRACE BANNER'S DOOR (crumbs-32, from `storage-wiring`): it said "largest files first" with no way to
 * see them. Its door opens the size list counting down to her own plan's cap, Deleted at its head (trash-in-storage:
 * what she already deleted counts, and leaves first at the deadline), so she chooses what goes before the sweep does.
 * The list's reads are a fake source (as `storage-list.test.tsx`'s), and the plans sheet a stand-in: what is pinned is
 * that the door opens the list on her cap.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

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

import { GraceBanner } from "./grace-banner";
import {
  StorageSourceProvider,
  type StorageSource,
} from "@/components/app/storage/storage-source";

const WEDDING = "10000000-0000-4000-8000-000000000001";

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
  it("★ opens the size list counting down to her own plan's cap", async () => {
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
    // Both of the ways out it names are doors.
    expect(screen.getByRole("button", { name: "See plans" })).toBeTruthy();
    await userEvent.click(
      screen.getByRole("button", { name: "see what’s using space" }),
    );
    const dialog = await screen.findByRole("dialog");
    await waitFor(() =>
      expect(dialog.querySelector("[data-storage-goal]")).toBeTruthy(),
    );
    const strip = dialog.querySelector("[data-storage-goal]") as HTMLElement;
    expect(strip.getAttribute("data-state")).toBe("counting");
    // 1.25 GB stored against 100 MB: 1.15 GB to free, printed up to the tenth as every stored figure is.
    expect(strip.textContent).toContain("1.2 GB");
    expect(strip.textContent).toContain("to fit your plan");
    // What she already deleted heads the list: the first room to free, as it is the sweep's first.
    expect(dialog.querySelector("[data-storage-deleted]")).toBeTruthy();
  });
});

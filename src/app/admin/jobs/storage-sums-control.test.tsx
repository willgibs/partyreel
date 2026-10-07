import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const rebuildStorageSumsAction = vi.fn(async (_host: string) => ({
  ok: true as const,
}));

vi.mock("@/app/admin/jobs/actions", () => ({
  rebuildStorageSumsAction: (host: string) => rebuildStorageSumsAction(host),
}));

const { StorageSumsRebuild } =
  await import("@/app/admin/jobs/storage-sums-control");

const HOST = "6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b";

/**
 * REBUILD, BESIDE A HOST THE STORAGE SUMS' CHECK NAMES (storage-sums-signal): behind the portal's one confirmation,
 * which names her and says what it rewrites before it asks the server, then asks once, for her id alone.
 */
describe("StorageSumsRebuild", () => {
  it("★ names her and what it rewrites before it runs, then rebuilds her once", async () => {
    render(<StorageSumsRebuild hostId={HOST} name="willg97@gmail.com" />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Rebuild the storage sums of willg97@gmail.com",
      }),
    );
    expect(
      await screen.findByText("Rebuild the storage sums of willg97@gmail.com?"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /dropped and made again from her media; nothing else of hers is written/,
      ),
    ).toBeTruthy();
    expect(screen.getByText(/checked against the walk at once/)).toBeTruthy();
    expect(rebuildStorageSumsAction).not.toHaveBeenCalled();
    const confirm = screen
      .getAllByRole("button", { name: "Rebuild" })
      .find((b) => b.closest("[data-severity]"));
    expect(confirm?.closest("[data-severity]")).toHaveAttribute(
      "data-severity",
      "reversible",
    );
    fireEvent.click(confirm!);
    await waitFor(() =>
      expect(rebuildStorageSumsAction).toHaveBeenCalledWith(HOST),
    );
    expect(rebuildStorageSumsAction).toHaveBeenCalledTimes(1);
  });
});

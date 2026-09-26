import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { finishClaimsAction } from "@/app/(app)/dashboard/claims-actions";
import type { ClaimableEventRow } from "@/lib/db/queries/claims";
import { formatEventDate } from "@/lib/utils";

import { ClaimsCard } from "./claims-card";

vi.mock("@/app/(app)/dashboard/claims-actions", () => ({
  finishClaimsAction: vi.fn(),
}));

/**
 * THE TICKET'S CONTRACT (the guest identity round, 2026-09-22): one decision
 * per EVENT (never per guest row — the query layer already grouped those),
 * "Claim all" as a no-confirmation shortcut that sends `null`, and "Finish"
 * that asks ONLY when something would be left unclaimed — an explicit "Not
 * mine" and a row nobody touched are the same outcome, because either way
 * nothing was affirmatively claimed.
 */

const rowA: ClaimableEventRow = {
  eventId: "e-a",
  eventName: "Maya & Theo's Wedding",
  eventDate: "2026-10-01",
  names: ["Priya"],
  uploadCount: 3,
  lastUploadAt: "2026-10-02T10:00:00Z",
};

const rowB: ClaimableEventRow = {
  eventId: "e-b",
  eventName: "Summer BBQ",
  eventDate: null,
  names: [],
  uploadCount: 1,
  lastUploadAt: null,
};

function rowButton(eventName: string, label: "Claim" | "Not mine") {
  const li = screen.getByText(eventName).closest("li");
  if (!li) throw new Error(`row not found: ${eventName}`);
  return within(li as HTMLElement).getByRole("button", { name: label });
}

beforeEach(() => {
  vi.mocked(finishClaimsAction).mockReset();
});

describe("an empty ticket", () => {
  it("renders nothing", () => {
    const { container } = render(<ClaimsCard rows={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("a grouped row", () => {
  it("shows the event, its date, every typed name and its photo count", () => {
    render(<ClaimsCard rows={[rowA]} />);
    expect(screen.getByText(rowA.eventName)).toBeInTheDocument();
    const meta = screen.getByText(/Added as Priya/);
    expect(meta.textContent).toContain(formatEventDate("2026-10-01"));
    expect(meta.textContent).toContain("3 photos");
  });

  it("withholds a gated date and an untyped name rather than inventing either", () => {
    render(<ClaimsCard rows={[rowB]} />);
    expect(screen.queryByText(/Added as/)).not.toBeInTheDocument();
    expect(screen.getByText(/1 photo\b/)).toBeInTheDocument();
  });
});

/**
 * EVERY COUNT ON THE TICKET, GROUPED (the 1,000-row round's follow-on): a guest with more than
 * 999 uploads under their email read "1249 photos" on the row, in the confirmation and in the
 * toast. All three go through `formatCount`.
 */
describe("a count past 999", () => {
  const big: ClaimableEventRow = { ...rowA, uploadCount: 1249 };

  it("is grouped on the row", () => {
    render(<ClaimsCard rows={[big]} />);
    expect(screen.getByText(/Added as Priya/).textContent).toContain(
      "1,249 photos",
    );
  });

  it("is grouped in the confirmation", () => {
    render(<ClaimsCard rows={[big]} />);
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(
      within(screen.getByRole("dialog")).getByText(
        "Permanently delete the 1,249 photos and videos added under your email at this event?",
      ),
    ).toBeInTheDocument();
  });

  it("is grouped in the toast", async () => {
    vi.mocked(finishClaimsAction).mockResolvedValue({
      ok: true,
      claimedEvents: 1,
    });
    render(<ClaimsCard rows={[big]} />);
    fireEvent.click(screen.getByRole("button", { name: "Claim all" }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Added 1,249 photos to your account.",
      ),
    );
  });
});

describe("Claim all", () => {
  it("sends null, claims every row and skips the confirmation entirely", async () => {
    vi.mocked(finishClaimsAction).mockResolvedValue({
      ok: true,
      claimedEvents: 2,
    });
    render(<ClaimsCard rows={[rowA, rowB]} />);

    fireEvent.click(screen.getByRole("button", { name: "Claim all" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(finishClaimsAction).toHaveBeenCalledWith({
        claimIds: null,
        disownIds: [],
      }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Added 4 photos to your account.",
      ),
    );
  });
});

describe("Finish", () => {
  it("asks nothing once every row has been explicitly claimed", async () => {
    vi.mocked(finishClaimsAction).mockResolvedValue({
      ok: true,
      claimedEvents: 2,
    });
    render(<ClaimsCard rows={[rowA, rowB]} />);

    fireEvent.click(rowButton(rowA.eventName, "Claim"));
    fireEvent.click(rowButton(rowB.eventName, "Claim"));
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(finishClaimsAction).toHaveBeenCalledWith({
        claimIds: [rowA.eventId, rowB.eventId],
        disownIds: [],
      }),
    );
  });

  it("confirms and names an event nobody touched before releasing it", async () => {
    vi.mocked(finishClaimsAction).mockResolvedValue({
      ok: true,
      claimedEvents: 1,
    });
    render(<ClaimsCard rows={[rowA, rowB]} />);

    fireEvent.click(rowButton(rowA.eventName, "Claim"));
    // rowB is left untouched entirely — still counts as "unclaimed".
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Permanently delete/)).toBeInTheDocument();
    expect(within(dialog).getByText(rowB.eventName)).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete and finish" }),
    );

    await waitFor(() =>
      expect(finishClaimsAction).toHaveBeenCalledWith({
        claimIds: [rowA.eventId],
        disownIds: [rowB.eventId],
      }),
    );
  });

  it("writes an explicit Not mine the same as an untouched row", async () => {
    vi.mocked(finishClaimsAction).mockResolvedValue({
      ok: true,
      claimedEvents: 1,
    });
    render(<ClaimsCard rows={[rowA, rowB]} />);

    fireEvent.click(rowButton(rowA.eventName, "Claim"));
    fireEvent.click(rowButton(rowB.eventName, "Not mine"));
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));

    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete and finish" }),
    );

    await waitFor(() =>
      expect(finishClaimsAction).toHaveBeenCalledWith({
        claimIds: [rowA.eventId],
        disownIds: [rowB.eventId],
      }),
    );
  });

  /**
   * The confirm-delete title's pluralisation, pinned the moment it was
   * written (a count-bearing sentence gets its pin immediately): one upload
   * is "photo or video" (never "photo", which would lie when the one upload
   * is a video) and several are "photos and videos"; one event is "this
   * event" and several name the count. `uploadCount` totals across the
   * leftover ROWS, so a 1-photo/2-event case uses a second row with nothing
   * uploaded under it yet.
   */
  it.each([
    {
      rows: [{ ...rowA, uploadCount: 1 }],
      title:
        "Permanently delete the 1 photo or video added under your email at this event?",
    },
    {
      rows: [
        { ...rowA, uploadCount: 1 },
        { ...rowB, uploadCount: 0 },
      ],
      title:
        "Permanently delete the 1 photo or video added under your email at these 2 events?",
    },
    {
      rows: [{ ...rowA, uploadCount: 2 }],
      title:
        "Permanently delete the 2 photos and videos added under your email at this event?",
    },
    {
      rows: [
        { ...rowA, uploadCount: 1 },
        { ...rowB, uploadCount: 1 },
      ],
      title:
        "Permanently delete the 2 photos and videos added under your email at these 2 events?",
    },
  ])("reads correctly for $title", ({ rows, title }) => {
    render(<ClaimsCard rows={rows} />);

    // Nobody claims anything, so every row is left over at Finish.
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(title)).toBeInTheDocument();
  });

  it("Go back cancels without writing anything", () => {
    render(<ClaimsCard rows={[rowA, rowB]} />);

    fireEvent.click(rowButton(rowA.eventName, "Claim"));
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));

    expect(finishClaimsAction).not.toHaveBeenCalled();
    expect(screen.getByText(rowA.eventName)).toBeInTheDocument();
  });

  it("keeps the ticket and the picks standing when the server call fails", async () => {
    vi.mocked(finishClaimsAction).mockResolvedValue({
      ok: false,
      message: "Try again.",
    });
    render(<ClaimsCard rows={[rowA]} />);

    fireEvent.click(rowButton(rowA.eventName, "Claim"));
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Try again."));
    expect(screen.getByText(rowA.eventName)).toBeInTheDocument();
  });
});

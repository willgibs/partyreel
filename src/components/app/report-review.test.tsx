import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReviewReport } from "@/lib/db/queries/reports";

/**
 * THE REPORTS INBOX'S CLOSED LOG (admin-triage r1, Will 2026-09-28). The open queue moved to the review grid in
 * round two (`components/admin/report-queue.test.tsx` proves its verbs); what stays here is the closed line: it
 * offers Undo only where its own removal waits or its dismissal is inside its window (build 19's red-team), and
 * an open report is never drawn here at all.
 */

const actions = vi.hoisted(() => ({
  dismissReportAction: vi.fn(
    async (): Promise<
      { ok: true } | { ok: false; code: string; message: string }
    > => ({ ok: true as const }),
  ),
  actionReportAction: vi.fn(async () => ({ ok: true as const })),
  undoReportAction: vi.fn(async () => ({ ok: true as const })),
  reopenReportAction: vi.fn(async () => ({ ok: true as const })),
  holdScopeAction: vi.fn(async () => ({
    ok: true as const,
    scope: {
      kind: "photo" as const,
      eventName: "Hannah and Theo",
      others: 3,
      uploader: "guest" as const,
    },
  })),
  holdFromReportAction: vi.fn(async () => ({ ok: true as const })),
}));
vi.mock("@/app/admin/reports/actions", () => actions);
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { toast } = await import("sonner");
const { ReportReviewList } = await import("./report-review");

const ITEM_ID = "8d2f0b14-6a37-4c51-9f0e-2b7a41c9de83";

function report(over: Partial<ReviewReport> = {}): ReviewReport {
  return {
    id: ITEM_ID,
    reason:
      "That's my daughter in the background and she is twelve. Please take it down.",
    created_at: "2026-09-28T22:41:00.000Z",
    status: "open",
    resolved_at: null,
    resolution_note: null,
    event: { id: "e1", name: "Hannah and Theo" },
    media: {
      id: "m1",
      type: "photo",
      url: "https://r2.test/m1.jpg",
      previewUrl: "https://r2.test/m1.webp",
      standing: "live",
      held: false,
    },
    wayBack: null,
    ...over,
  };
}

beforeEach(() => {
  for (const fn of Object.values(actions)) fn.mockClear();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

describe("the closed log never draws an open report", () => {
  it("leaves the open ones to the grid", () => {
    render(<ReportReviewList reports={[report()]} />);
    expect(document.querySelectorAll("[data-closed-report]")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull();
  });
});

describe("a closed report is one line (`closed=window`)", () => {
  const closed = (id: string, over: Partial<ReviewReport>) =>
    report({
      id,
      status: "actioned",
      resolved_at: "2026-09-28T23:00:00.000Z",
      ...over,
    });

  it("★ offers Undo only where its own removal waits out the window, Held where it is held", async () => {
    const user = userEvent.setup();
    const undoId = "33333333-3333-4333-8333-333333333333";
    render(
      <ReportReviewList
        reports={[
          closed(undoId, {
            wayBack: "undo",
            resolution_note: "Card number legible.",
          }),
          closed("44444444-4444-4444-8444-444444444444", { wayBack: "held" }),
          closed("55555555-5555-4555-8555-555555555555", {
            status: "dismissed",
            wayBack: null,
          }),
        ]}
      />,
    );
    const lines = document.querySelectorAll("[data-closed-report]");
    expect(lines).toHaveLength(3);
    // No open card: a closed report never offers a verdict again.
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull();

    const [undo, held, none] = [...lines] as HTMLElement[];
    expect(within(undo).getByText("Card number legible.")).toBeInTheDocument();
    expect(within(held).getByText("Held")).toBeInTheDocument();
    expect(within(held).queryByRole("button")).toBeNull();
    expect(within(none).getByText("No note")).toBeInTheDocument();
    expect(within(none).queryByRole("button")).toBeNull();

    await user.click(within(undo).getByRole("button", { name: /Undo/ }));
    expect(actions.undoReportAction).toHaveBeenCalledWith(undoId);
    expect(actions.reopenReportAction).not.toHaveBeenCalled();
    expect(
      screen.getByText(/only Forensics releases a hold/),
    ).toBeInTheDocument();
  });

  it("★ a dismissal inside its window reopens from its line, and restores nothing", async () => {
    const user = userEvent.setup();
    const reopenId = "66666666-6666-4666-8666-666666666666";
    render(
      <ReportReviewList
        reports={[
          closed(reopenId, {
            status: "dismissed",
            wayBack: "reopen",
            resolution_note: "Not harm.",
          }),
        ]}
      />,
    );
    const line = document.querySelector("[data-closed-report]") as HTMLElement;
    expect(within(line).getByText("Dismissed")).toBeInTheDocument();
    await user.click(
      within(line).getByRole("button", { name: "Undo: reopen the report" }),
    );
    expect(actions.reopenReportAction).toHaveBeenCalledWith(reopenId);
    expect(actions.undoReportAction).not.toHaveBeenCalled();
    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("The report is open again."),
    );
    expect(
      screen.getByText(/a dismissal reopens its report/),
    ).toBeInTheDocument();
  });
});

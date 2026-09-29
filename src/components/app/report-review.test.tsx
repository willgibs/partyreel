import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReviewReport } from "@/lib/db/queries/reports";

/**
 * THE OPERATOR'S REPORTS AS ADMIN-TRIAGE ROUND ONE LEFT THEM (Will, 2026-09-28). The portal cannot be
 * signed in locally, so this proves the wiring in the component: every verdict is handed the report's
 * id and the note the operator wrote, the confirms say what is true AFTER the press, the hold reads
 * what it reaches before it asks, and a closed line offers Undo only where its own removal waits or
 * its dismissal is inside its window (build 19's red-team), as Dismiss's toast does.
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

/** The Undo a success toast carried, pressed as sonner presses it. */
function pressToastUndo(message: string) {
  const call = vi
    .mocked(toast.success)
    .mock.calls.find(([text]) => text === message);
  expect(call, `a "${message}" toast`).toBeDefined();
  const options = call![1] as {
    action?: { label: string; onClick: () => void };
  };
  expect(options.action?.label).toBe("Undo");
  options.action!.onClick();
}

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

function openPicker() {
  // Radix's dropdown trigger opens on pointerdown, not click (the house technique).
  fireEvent.pointerDown(screen.getByRole("button", { name: /^Status: Open/ }), {
    ctrlKey: false,
    button: 0,
  });
}

beforeEach(() => {
  for (const fn of Object.values(actions)) fn.mockClear();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

describe("a report with nothing said (`reason=marked`)", () => {
  it("keeps its place in time order and says so, muted", () => {
    render(
      <ReportReviewList
        reports={[
          report({ id: "11111111-1111-4111-8111-111111111111" }),
          report({ id: "22222222-2222-4222-8222-222222222222", reason: null }),
        ]}
      />,
    );
    const cards = document.querySelectorAll("[data-report-id]");
    expect(cards).toHaveLength(2);
    const silent = within(cards[1] as HTMLElement).getByText(
      "No reason provided.",
    );
    expect(silent.className).toContain("text-muted-foreground");
  });
});

describe("the verdict (`verdict=note`)", () => {
  it("★ Dismiss is one press, and carries the line Add a note opened", async () => {
    const user = userEvent.setup();
    render(<ReportReviewList reports={[report()]} />);
    await user.click(screen.getByRole("button", { name: "Add a note" }));
    const field = screen.getByRole("textbox", { name: /note/i });
    expect(document.activeElement).toBe(field);
    await user.type(field, "Not harm: a guest who dislikes the photo.");
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(actions.dismissReportAction).toHaveBeenCalledWith(
      ITEM_ID,
      "Not harm: a guest who dislikes the photo.",
    );
    // One press: no confirm opened on the way.
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("★ Dismiss's toast carries its way back: Undo reopens the report, and says so", async () => {
    const user = userEvent.setup();
    render(<ReportReviewList reports={[report()]} />);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(actions.reopenReportAction).not.toHaveBeenCalled();

    pressToastUndo("Report dismissed.");
    expect(actions.reopenReportAction).toHaveBeenCalledWith(ITEM_ID);
    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("The report is open again."),
    );
  });

  it("a Dismiss that failed says why, and offers nothing to undo", async () => {
    const user = userEvent.setup();
    actions.dismissReportAction.mockResolvedValueOnce({
      ok: false,
      code: "validation",
      message: "That report was already decided. The page has the latest.",
    });
    render(<ReportReviewList reports={[report()]} />);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't dismiss the report.", {
        description:
          "That report was already decided. The page has the latest.",
      }),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("★ Remove opens the one confirm, starting from the note, saying what is true after the press", async () => {
    const user = userEvent.setup();
    render(<ReportReviewList reports={[report()]} />);
    await user.click(screen.getByRole("button", { name: "Add a note" }));
    await user.type(
      screen.getByRole("textbox", { name: /note/i }),
      "Child in frame.",
    );
    await user.click(screen.getByRole("button", { name: "Remove…" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Remove this photo?")).toBeInTheDocument();
    const touches = within(dialog)
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(touches.join(" ")).not.toMatch(/already says|Not in the album/);
    expect(touches).toContain(
      "-Gone from the host's album and her Deleted at once; she is sent nothing",
    );
    expect(touches).toContain(
      "-Undo on the closed report for 30 days, then the purge deletes it unless it is held",
    );
    const note = within(dialog).getByRole("textbox", { name: /note/i });
    expect(note).toHaveValue("Child in frame.");
    await user.type(note, " Parent asked.");
    await user.click(within(dialog).getByRole("button", { name: "Remove" }));
    expect(actions.actionReportAction).toHaveBeenCalledWith(
      ITEM_ID,
      "Child in frame. Parent asked.",
    );
  });

  it("an item already out of the album is taken from the host's Deleted, in words that say so", async () => {
    const user = userEvent.setup();
    const base = report();
    render(
      <ReportReviewList
        reports={[report({ media: { ...base.media!, standing: "removed" } })]}
      />,
    );
    expect(screen.getByText(/already out of the album/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove…" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText(/this takes it out of the host's Deleted too/),
    ).toBeInTheDocument();
    const touches = within(dialog)
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(touches).toContain(
      "-Out of the host's Deleted at once, so she can no longer restore it; she is sent nothing",
    );
    expect(touches).toContain(
      "-Restorable from Albums until its 30 days run out, then the purge deletes it unless it is held",
    );
  });

  it("an album report closes through its own confirm, touching nothing else", async () => {
    const user = userEvent.setup();
    render(
      <ReportReviewList reports={[report({ media: null, reason: null })]} />,
    );
    await user.click(screen.getByRole("button", { name: "Action…" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Action this report?")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /hold/i })).toBeNull();
    await user.click(within(dialog).getByRole("button", { name: "Action" }));
    expect(actions.actionReportAction).toHaveBeenCalledWith(ITEM_ID, "");
  });

  it("the shared picker moves a report in Reports' own words", async () => {
    render(<ReportReviewList reports={[report()]} />);
    openPicker();
    const items = screen.getAllByRole("menuitem").map((i) => i.textContent);
    expect(items).toEqual(["Dismissed", "Actioned…"]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Dismissed" }));
    await vi.waitFor(() =>
      expect(actions.dismissReportAction).toHaveBeenCalledWith(ITEM_ID, ""),
    );
  });
});

describe("Hold for forensics (`escalate=door`)", () => {
  it("★ reads what the hold reaches first, then asks, filled in from the report", async () => {
    const user = userEvent.setup();
    render(<ReportReviewList reports={[report()]} />);
    await user.click(
      screen.getByRole("button", { name: "Hold for forensics" }),
    );
    expect(actions.holdScopeAction).toHaveBeenCalledWith(ITEM_ID);

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Hold and preserve this photo?"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "This photo in Hannah and Theo, and the 3 other uploads this guest sent there",
      ),
    ).toBeInTheDocument();
    const reason = within(dialog).getByRole("textbox", { name: /reason/i });
    expect(reason).toHaveValue(`Report ${ITEM_ID}`);
    await user.type(reason, ", CyberTipline filing");
    await user.click(
      within(dialog).getByRole("button", { name: "Set hold and preserve" }),
    );
    expect(actions.holdFromReportAction).toHaveBeenCalledWith(
      ITEM_ID,
      `Report ${ITEM_ID}, CyberTipline filing`,
    );
  });

  it("a held item says so, and offers no second hold", () => {
    const base = report();
    render(
      <ReportReviewList
        reports={[report({ media: { ...base.media!, held: true } })]}
      />,
    );
    expect(screen.getByText(/Held for forensics/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Hold for forensics" }),
    ).toBeNull();
  });

  it("an album report has no door: there is no item to hold", () => {
    render(<ReportReviewList reports={[report({ media: null })]} />);
    expect(
      screen.queryByRole("button", { name: "Hold for forensics" }),
    ).toBeNull();
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
    expect(document.querySelectorAll("[data-report-id]")).toHaveLength(0);

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

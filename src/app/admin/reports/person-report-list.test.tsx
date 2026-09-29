import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReviewProfileReport } from "@/lib/db/queries/reports";

/**
 * THE PEOPLE ARM, IN THE SAME WORDS AS THE ALBUM ARM (admin-triage r1, Will 2026-09-28): a wordless
 * report says "No reason provided." muted, as the album arm always has (it printed "No reason given."
 * at full weight); both verbs stay one press and carry the note; a closed report is one line, and a
 * dismissal has the album arm's way back (build 19's red-team).
 */

const actions = vi.hoisted(() => ({
  dismissReportAction: vi.fn(async () => ({ ok: true as const })),
  actionReportAction: vi.fn(async () => ({ ok: true as const })),
  undoReportAction: vi.fn(async () => ({ ok: true as const })),
  reopenReportAction: vi.fn(async () => ({ ok: true as const })),
  holdScopeAction: vi.fn(),
  holdFromReportAction: vi.fn(),
}));
vi.mock("@/app/admin/reports/actions", () => actions);
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { toast } = await import("sonner");
const { PersonReportList } = await import("./person-report-list");

const ID = "3e81c5a9-47d2-4f60-b1e8-9a2c6d0f7b35";

function person(over: Partial<ReviewProfileReport> = {}): ReviewProfileReport {
  return {
    id: ID,
    reason: null,
    created_at: "2026-09-28T21:37:00.000Z",
    status: "open",
    resolved_at: null,
    resolution_note: null,
    profile: { id: "p1", displayName: "Jordan Pike", slug: "jordanpike" },
    wayBack: null,
    ...over,
  };
}

beforeEach(() => {
  for (const fn of Object.values(actions)) fn.mockClear();
  vi.mocked(toast.success).mockClear();
});

describe("a reported person", () => {
  it("says a wordless report in the album arm's words, muted", () => {
    render(<PersonReportList reports={[person()]} />);
    const line = screen.getByText("No reason provided.");
    expect(line.className).toContain("text-muted-foreground");
    expect(screen.queryByText("No reason given.")).toBeNull();
  });

  it("★ Mark actioned is one press and carries the note, where the operator says what was done", async () => {
    const user = userEvent.setup();
    render(<PersonReportList reports={[person()]} />);
    await user.click(screen.getByRole("button", { name: "Add a note" }));
    await user.type(
      screen.getByRole("textbox", { name: /note/i }),
      "Handle released; bio cleared.",
    );
    await user.click(screen.getByRole("button", { name: "Mark actioned" }));
    expect(actions.actionReportAction).toHaveBeenCalledWith(
      ID,
      "Handle released; bio cleared.",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Dismiss is one press, with or without a note, and its toast's Undo reopens it", async () => {
    const user = userEvent.setup();
    render(<PersonReportList reports={[person()]} />);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(actions.dismissReportAction).toHaveBeenCalledWith(ID, "");
    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Report dismissed.",
        expect.objectContaining({
          action: expect.objectContaining({ label: "Undo" }),
        }),
      ),
    );
    const [, options] = vi
      .mocked(toast.success)
      .mock.calls.find(([text]) => text === "Report dismissed.")!;
    const undo = (
      options as { action?: { label: string; onClick: () => void } }
    ).action;
    undo!.onClick();
    expect(actions.reopenReportAction).toHaveBeenCalledWith(ID);
  });

  it("★ a dismissal inside its window reopens from its line; Mark actioned's line offers nothing", async () => {
    const user = userEvent.setup();
    const actionedId = "9b0c1d2e-3f4a-4b5c-8d6e-7f8a9b0c1d2e";
    render(
      <PersonReportList
        reports={[
          person({
            status: "dismissed",
            resolved_at: "2026-09-28T22:00:00.000Z",
            wayBack: "reopen",
          }),
          person({
            id: actionedId,
            status: "actioned",
            resolved_at: "2026-09-28T22:05:00.000Z",
          }),
        ]}
      />,
    );
    const [dismissed, actioned] = [
      ...document.querySelectorAll("[data-closed-report]"),
    ] as HTMLElement[];
    expect(within(actioned).queryByRole("button")).toBeNull();
    await user.click(
      within(dismissed).getByRole("button", {
        name: "Undo: reopen the report",
      }),
    );
    expect(actions.reopenReportAction).toHaveBeenCalledWith(ID);
    expect(
      screen.getByText(/Undo reopens a dismissed report/),
    ).toBeInTheDocument();
  });

  it("a closed one is a line: its verdict, its note and the handle, and no verdict to press", () => {
    render(
      <PersonReportList
        reports={[
          person({
            status: "actioned",
            resolved_at: "2026-09-28T22:00:00.000Z",
            resolution_note: "Handle released.",
          }),
        ]}
      />,
    );
    const line = document.querySelector("[data-closed-report]") as HTMLElement;
    expect(line).not.toBeNull();
    expect(within(line).getByText("Actioned")).toBeInTheDocument();
    expect(within(line).getByText("Handle released.")).toBeInTheDocument();
    expect(within(line).getByText("@jordanpike")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark actioned" })).toBeNull();
  });
});

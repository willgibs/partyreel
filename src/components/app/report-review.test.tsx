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
      covered: false,
      url: "https://r2.test/m1.jpg",
      previewUrl: "https://r2.test/m1.webp",
      standing: "live",
      held: false,
    },
    wayBack: null,
    strike: null,
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

describe("the worst kinds stay covered in the closed log (build 23's NIT-7)", () => {
  it("★ a dismissed child-abuse report's item draws the cover and loads no picture", () => {
    render(
      <ReportReviewList
        reports={[
          report({
            id: "77777777-7777-4777-8777-777777777777",
            status: "dismissed",
            resolved_at: "2026-09-28T23:00:00.000Z",
            media: {
              id: "m2",
              type: "photo",
              covered: true,
              url: null,
              previewUrl: null,
              standing: "live",
              held: false,
            },
          }),
          report({
            id: "88888888-8888-4888-8888-888888888888",
            status: "dismissed",
            resolved_at: "2026-09-28T23:00:00.000Z",
          }),
        ]}
      />,
    );
    const [covered, plain] = [
      ...document.querySelectorAll("[data-closed-report]"),
    ] as HTMLElement[];
    expect(
      within(covered).getByRole("img", { name: "Covered" }),
    ).toBeInTheDocument();
    expect(covered.querySelector("img, video")).toBeNull();
    expect(within(plain).queryByRole("img", { name: "Covered" })).toBeNull();
  });
});

describe("a report whose item is gone reads as that item's (crumbs-21, migration 20260929231000)", () => {
  it("★ says a photo or a video was deleted, where an album report draws its plain square", () => {
    const closed = (id: string, over: Partial<ReviewReport>) =>
      report({
        id,
        status: "dismissed",
        resolved_at: "2026-09-28T23:00:00.000Z",
        media: null,
        ...over,
      });
    render(
      <ReportReviewList
        reports={[
          closed("11111111-1111-4111-8111-111111111111", {
            deleted: { id: "m9", type: "video" },
          }),
          closed("22222222-2222-4222-8222-222222222222", {
            deleted: { id: "m8", type: null },
          }),
          closed("33333333-3333-4333-8333-333333333333", { deleted: null }),
        ]}
      />,
    );
    const [video, unknown, album] = [
      ...document.querySelectorAll("[data-closed-report]"),
    ] as HTMLElement[];
    expect(
      within(video).getByRole("img", { name: "Video, deleted" }),
    ).toHaveAttribute(
      "title",
      "The video was deleted. The report still names it.",
    );
    // Before the migration stands the kind is unknown, and the line still says an item, never an album.
    expect(
      within(unknown).getByRole("img", { name: "Item, deleted" }),
    ).toBeInTheDocument();
    expect(album.querySelector("[data-report-deleted]")).toBeNull();
    for (const line of [video, unknown, album]) {
      expect(line.querySelector("img, video")).toBeNull();
    }
  });
});

/**
 * ★ A DISMISSED CHILD-ABUSE REPORT'S CLOSED LINE SAYS ITS STRIKE (crumbs-36, a board idea from crumbs-33): whether it
 * is still a strike and until when, what its address holds, and that its Undo takes it back, so an operator reading
 * past dismissals sees what each one costs its address. The numbers arrive decided on the server (`ClosedStrike`,
 * from `report_strikes`); the line only says them, and the row itself stays one line.
 */
describe("a dismissed child-abuse report's strike on its closed line", () => {
  const dismissed = (over: Partial<ReviewReport>) =>
    report({
      id: "99999999-9999-4999-8999-999999999999",
      status: "dismissed",
      resolved_at: "2026-09-15T08:30:00.000Z",
      ...over,
    });
  const live = {
    state: "live" as const,
    at: "2027-03-14T08:30:00.000Z",
    live: 2,
    bar: 3,
    barredUntil: null,
  };
  const line = () =>
    document.querySelector("[data-closed-report]") as HTMLElement;
  const caption = () =>
    line().querySelector("[data-closed-strike]") as HTMLElement | null;

  it("★ says a live strike, until when and what the address holds, and its Undo while it can be reopened", () => {
    render(
      <ReportReviewList
        reports={[dismissed({ strike: live, wayBack: "reopen" })]}
      />,
    );
    expect(caption()).toHaveAttribute("data-closed-strike", "live");
    expect(caption()).toHaveTextContent(
      "A strike on its address until Mar 14, 2027 UTC; the address holds 2 of 3. Undo takes it back.",
    );
    // The row is still one line: the verdict, the Undo button and the strike under it.
    expect(
      within(line()).getByRole("button", { name: "Undo: reopen the report" }),
    ).toBeInTheDocument();
  });

  it("★ never offers an Undo it cannot do: a strike past its reopen window says only that it counts", () => {
    render(
      <ReportReviewList
        reports={[dismissed({ strike: live, wayBack: null })]}
      />,
    );
    expect(caption()).toHaveTextContent(
      "A strike on its address until Mar 14, 2027 UTC; the address holds 2 of 3.",
    );
    expect(caption()).not.toHaveTextContent(/Undo/);
    expect(within(line()).queryByRole("button")).toBeNull();
  });

  it("says when the address is barred, and until when its reports stop hiding right away", () => {
    render(
      <ReportReviewList
        reports={[
          dismissed({
            strike: {
              ...live,
              live: 3,
              barredUntil: "2027-01-10T10:00:00.000Z",
            },
            wayBack: null,
          }),
        ]}
      />,
    );
    expect(caption()).toHaveTextContent(
      "the address holds 3 strikes, so its reports don't hide right away until Jan 10, 2027 UTC.",
    );
  });

  it("says a strike that lapsed, and one that never was (no address kept)", () => {
    render(
      <ReportReviewList
        reports={[
          dismissed({
            strike: { state: "lapsed", at: "2026-08-28T10:00:00.000Z" },
          }),
          dismissed({
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            strike: { state: "none" },
          }),
        ]}
      />,
    );
    const [lapsed, none] = [
      ...document.querySelectorAll("[data-closed-report]"),
    ] as HTMLElement[];
    expect(lapsed.querySelector("[data-closed-strike]")).toHaveTextContent(
      "Its strike lapsed Aug 28, 2026 UTC.",
    );
    expect(none.querySelector("[data-closed-strike]")).toHaveTextContent(
      "Not a strike: it kept no address to count against.",
    );
  });

  it("★ draws nothing for any other closed report, or while the strikes cannot be read", () => {
    render(
      <ReportReviewList
        reports={[
          dismissed({ strike: null, wayBack: "reopen" }),
          report({
            id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            status: "actioned",
            resolved_at: "2026-09-28T23:00:00.000Z",
            wayBack: "undo",
          }),
        ]}
      />,
    );
    expect(document.querySelectorAll("[data-closed-strike]")).toHaveLength(0);
  });
});

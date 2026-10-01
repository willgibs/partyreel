import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addressStrikes } from "@/lib/admin/reports";
import type { EntryReport, ReviewEntry } from "@/lib/db/queries/reports";

/**
 * THE REPORTS QUEUE AS THE REVIEW GRID (admin-triage r2, Will 2026-09-29). The portal cannot be signed in locally,
 * so this proves the wiring in the component: harm in front (never ticked, the worst covered), the sweep's ticks
 * and its one Dismiss with the product's Undo, the host queue's keys (and no key that closes a report of harm),
 * the report whole with every verb, the hold's Take it down too, Ask for proof behind its switch, and a phone's
 * two acts, each one press.
 */

const actions = vi.hoisted(() => ({
  dismissReportAction: vi.fn(
    async (
      id: string,
      note?: string | null,
    ): Promise<
      | { ok: true; reportIds: string[]; restored: boolean }
      | { ok: false; code: string; message: string }
    > => {
      void note;
      return { ok: true, reportIds: [id], restored: false };
    },
  ),
  dismissReportsAction: vi.fn(async (ids: string[]) => ({
    ok: true as const,
    reportIds: ids,
    restored: false,
  })),
  reopenReportsAction: vi.fn(async () => ({ ok: true as const })),
  reopenReportAction: vi.fn(async () => ({ ok: true as const })),
  actionReportAction: vi.fn(async () => ({ ok: true as const })),
  undoReportAction: vi.fn(async () => ({ ok: true as const })),
  askProofAction: vi.fn(async () => ({ ok: true as const })),
  takeDownAction: vi.fn(async () => ({
    ok: true as const,
    at: "2026-09-29T09:00:00.000Z",
  })),
  undoTakeDownAction: vi.fn(async () => ({ ok: true as const })),
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
const { ReportQueue } = await import("./report-queue");

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function report(n: number, over: Partial<EntryReport> = {}): EntryReport {
  return {
    id: uuid(n),
    reason: `reason ${n}`,
    createdAt: "2026-09-28T22:41:00.000Z",
    kind: "other",
    signedIn: false,
    canAsk: false,
    byHost: false,
    hidAt: null,
    strikes: null,
    proof: null,
    ...over,
    // A report that can be asked was sent from a confirmed address.
    confirmed: over.confirmed ?? over.canAsk ?? false,
  };
}

function entry(
  n: number,
  over: Partial<ReviewEntry> = {},
  reports: EntryReport[] = [report(n)],
): ReviewEntry {
  const kind = over.kind ?? reports[0].kind;
  const lane =
    over.lane ?? (kind === "other" ? ("sweep" as const) : ("front" as const));
  return {
    key: `item:m${n}`,
    reportId: reports[0].id,
    subject: "item",
    lane,
    kind,
    newestAt: reports[0].createdAt,
    reports,
    event: {
      id: "e1",
      name: "Hannah and Theo",
      host: "maya.whitlock@gmail.com",
      uploads: 212,
      guests: 64,
    },
    media: {
      id: `m${n}`,
      type: "photo",
      url: `https://r2.test/m${n}.jpg`,
      previewUrl: `https://r2.test/m${n}.webp`,
      standing: "live",
      held: false,
      hidden: false,
    },
    uploader: {
      name: "Kerry",
      verified: false,
      isHost: false,
      more: 14,
      otherReports: 1,
      held: 0,
    },
    ...over,
  };
}

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

beforeEach(() => {
  for (const fn of Object.values(actions)) fn.mockClear();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

describe("the lanes (`look=grid`, `harm=kinds`)", () => {
  it("puts harm in front as split cards, People between, and the rest in the sweep with ticks", () => {
    render(
      <ReportQueue
        proofOn={false}
        entries={[
          entry(1, {}, [report(1, { kind: "consent" })]),
          entry(2),
          entry(3),
        ]}
        people={<section data-testid="people">People</section>}
      />,
    );
    const front = document.querySelector(
      "[data-report-lane='front']",
    ) as HTMLElement;
    const sweep = document.querySelector(
      "[data-report-lane='sweep']",
    ) as HTMLElement;
    expect(front.querySelectorAll("[data-report-front]")).toHaveLength(1);
    // The chip, at a desk and in the phone's card (one is hidden by width, never both drawn to a person).
    expect(within(front).getAllByText("Me or my child").length).toBeGreaterThan(
      0,
    );
    // The front is never ticked: no tick anywhere in it.
    expect(within(front).queryByRole("button", { name: "Tick" })).toBeNull();
    // Two tiles at a desk, two at a phone: each tile ticks at a desk only.
    expect(within(sweep).getAllByRole("button", { name: "Tick" })).toHaveLength(
      2,
    );
    // People sits between the two lanes.
    const people = screen.getByTestId("people");
    expect(
      front.compareDocumentPosition(people) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      people.compareDocumentPosition(sweep) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("★ covers the two sexual kinds until someone looks, once, and never the others", async () => {
    const user = userEvent.setup();
    render(
      <ReportQueue
        proofOn={false}
        entries={[
          entry(1, {}, [report(1, { kind: "child" })]),
          entry(2, {}, [report(2, { kind: "violence" })]),
        ]}
      />,
    );
    const covered = document.querySelectorAll("[data-report-covered]");
    // The child report's frame is covered at a desk and at a phone; the violence one is not.
    expect(covered.length).toBeGreaterThanOrEqual(2);
    expect(
      document.querySelector("img[src='https://r2.test/m1.webp']"),
    ).toBeNull();
    expect(
      document.querySelector("img[src='https://r2.test/m2.webp']"),
    ).not.toBeNull();

    await user.click(
      screen.getAllByRole("button", { name: "Open this report whole" })[0],
    );
    const peek = await screen.findByRole("dialog");
    await user.click(within(peek).getByRole("button", { name: "View once" }));
    expect(within(peek).queryByText("Covered")).toBeNull();
    expect(
      peek.querySelector("img[src='https://r2.test/m1.jpg']"),
    ).not.toBeNull();
  });
});

describe("the sweep (`look=grid`: tick many, one Dismiss)", () => {
  it("★ ticks, dismisses every ticked report in one press, and Undo reopens exactly those", async () => {
    const user = userEvent.setup();
    render(
      <ReportQueue proofOn={false} entries={[entry(1), entry(2), entry(3)]} />,
    );
    const sweep = document.querySelector(
      "[data-report-lane='sweep']",
    ) as HTMLElement;
    const ticks = within(sweep).getAllByRole("button", { name: "Tick" });
    await user.click(ticks[0]);
    await user.click(ticks[2]);
    const bar = document.querySelector("[data-report-bulk]") as HTMLElement;
    expect(within(bar).getByText("2 ticked")).toBeInTheDocument();
    await user.click(within(bar).getByRole("button", { name: "Dismiss 2" }));
    expect(actions.dismissReportsAction).toHaveBeenCalledWith([
      uuid(1),
      uuid(3),
    ]);
    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Dismissed 2 reports.",
        expect.anything(),
      ),
    );
    pressToastUndo("Dismissed 2 reports.");
    expect(actions.reopenReportsAction).toHaveBeenCalledWith([
      uuid(1),
      uuid(3),
    ]);
  });

  it("★ takes the host queue's keys: X ticks, Enter dismisses, and Enter on harm only opens it", async () => {
    render(
      <ReportQueue
        proofOn={false}
        entries={[entry(1, {}, [report(1, { kind: "private" })]), entry(2)]}
      />,
    );
    // The first arrow puts the cursor on the first report, in front.
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    fireEvent.keyDown(document.body, { key: "Enter" });
    // Enter on a report of harm opens it whole; it never closes it.
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(actions.dismissReportAction).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    // Into the sweep, X ticks it and Enter dismisses what is ticked.
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    fireEvent.keyDown(document.body, { key: "x" });
    expect(
      document.querySelectorAll(
        "[data-report-lane='sweep'] [aria-pressed='true']",
      ),
    ).toHaveLength(1);
    fireEvent.keyDown(document.body, { key: "Enter" });
    await vi.waitFor(() =>
      expect(actions.dismissReportsAction).not.toHaveBeenCalled(),
    );
    expect(actions.dismissReportAction).toHaveBeenCalledWith(uuid(2), null);
  });
});

describe("a confirm standing over the queue (crumbs-20)", () => {
  // Every confirm popup is an `alertdialog` now (ui/popup.tsx), so "another layer is up: its keys are its
  // own" has to see it as one; a queue that only looked for `dialog` swept and dismissed under a confirm.
  it("★ leaves every key to it, and takes them back once it is gone", async () => {
    render(<ReportQueue proofOn={false} entries={[entry(1), entry(2)]} />);
    const confirm = document.createElement("div");
    confirm.setAttribute("role", "alertdialog");
    document.body.appendChild(confirm);
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    fireEvent.keyDown(document.body, { key: "x" });
    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(actions.dismissReportAction).not.toHaveBeenCalled();
    expect(actions.dismissReportsAction).not.toHaveBeenCalled();
    expect(
      document.querySelectorAll(
        "[data-report-lane='sweep'] [aria-pressed='true']",
      ),
    ).toHaveLength(0);

    confirm.remove();
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    fireEvent.keyDown(document.body, { key: "x" });
    fireEvent.keyDown(document.body, { key: "Enter" });
    await vi.waitFor(() =>
      expect(actions.dismissReportAction).toHaveBeenCalledTimes(1),
    );
  });
});

describe("the report whole", () => {
  async function openPeek(e: ReviewEntry, proofOn = false) {
    const user = userEvent.setup();
    render(<ReportQueue proofOn={proofOn} entries={[e]} />);
    const open = screen.queryAllByRole("button", {
      name: "Open this report whole",
    });
    await user.click(
      open[0] ??
        screen.getAllByRole("button", { name: /^Open the report on/ })[0],
    );
    const peek = await screen.findByRole("dialog");
    const verbs = peek.querySelector("[data-report-verbs]") as HTMLElement;
    return { user, peek, verbs };
  }

  it("says every reason, who sent each, who uploaded it and the album", async () => {
    const { peek } = await openPeek(
      entry(1, {}, [
        report(1, { reason: "please delete this one", signedIn: true }),
        report(9, { reason: null }),
      ]),
    );
    expect(
      within(peek).getByText("please delete this one"),
    ).toBeInTheDocument();
    expect(within(peek).getByText("No reason provided.")).toBeInTheDocument();
    expect(within(peek).getByText("2 reports")).toBeInTheDocument();
    expect(
      within(peek).getByText(
        /Kerry, unverified · 14 more here · 1 other report/,
      ),
    ).toBeInTheDocument();
    expect(
      within(peek).getByText(/Hannah and Theo · 212 uploads · maya.whitlock/),
    ).toBeInTheDocument();
    expect(
      within(peek).getAllByText(/Signed-in guest, can't be asked/).length,
    ).toBeGreaterThan(0);
  });

  it("★ the album's own host reads as the host, never as a guest (build 23's LOW-2)", async () => {
    const { peek } = await openPeek(
      entry(1, {}, [
        report(1, {
          kind: "violence",
          signedIn: true,
          canAsk: true,
          byHost: true,
        }),
      ]),
    );
    expect(
      within(peek).getAllByText(/The host, can be asked/).length,
    ).toBeGreaterThan(0);
    expect(within(peek).queryByText(/Signed-in guest/)).toBeNull();
  });

  it("one upload is one (build 23's NIT-10)", async () => {
    const { peek } = await openPeek(
      entry(1, {
        event: {
          id: "e1",
          name: "RT23 Free D",
          host: "Partyreel",
          uploads: 1,
          guests: 0,
        },
      }),
    );
    expect(
      within(peek).getByText(/RT23 Free D · 1 upload · Partyreel/),
    ).toBeInTheDocument();
    expect(within(peek).queryByText(/1 uploads/)).toBeNull();
  });

  it("★ Dismiss is one press, carries the note Add a note opened, and its Undo reopens every report it closed", async () => {
    actions.dismissReportAction.mockResolvedValueOnce({
      ok: true,
      reportIds: [uuid(1), uuid(9)],
      restored: true,
    });
    const { user, verbs } = await openPeek(entry(1));
    await user.click(within(verbs).getByRole("button", { name: "Add a note" }));
    await user.type(
      within(verbs).getByRole("textbox"),
      "Not harm: a guest who dislikes the photo.",
    );
    await user.click(within(verbs).getByRole("button", { name: "Dismiss" }));
    expect(actions.dismissReportAction).toHaveBeenCalledWith(
      uuid(1),
      "Not harm: a guest who dislikes the photo.",
    );
    // A false report's hide came back with it, and the toast says so.
    const restored =
      "Report dismissed, and the item it hid is back where it was.";
    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(restored, expect.anything()),
    );
    pressToastUndo(restored);
    expect(actions.reopenReportsAction).toHaveBeenCalledWith([
      uuid(1),
      uuid(9),
    ]);
  });

  it("★ Remove opens the one confirm, saying what is true after the press, and hands over the note", async () => {
    const { user, verbs } = await openPeek(entry(1));
    await user.click(within(verbs).getByRole("button", { name: "Remove…" }));
    const confirm = screen
      .getAllByRole("alertdialog")
      .find((d) => within(d).queryByText("Remove this photo?"))!;
    const touches = within(confirm)
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(touches).toContain(
      "-Gone from the host's album and her Deleted at once; she is sent nothing",
    );
    expect(touches).toContain("-This report moves to Actioned");
    await user.type(
      within(confirm).getByRole("textbox", { name: /note/i }),
      "Child in frame.",
    );
    await user.click(within(confirm).getByRole("button", { name: "Remove" }));
    expect(actions.actionReportAction).toHaveBeenCalledWith(
      uuid(1),
      "Child in frame.",
    );
  });

  it("★ Hold for forensics takes it down too by default, and unticked is the quiet hold", async () => {
    const { user, verbs } = await openPeek(entry(1));
    await user.click(
      within(verbs).getByRole("button", { name: "Hold for forensics" }),
    );
    expect(actions.holdScopeAction).toHaveBeenCalledWith(uuid(1));
    const confirm = await vi.waitFor(
      () =>
        screen
          .getAllByRole("alertdialog")
          .find((d) => within(d).queryByText("Hold and preserve this photo?"))!,
    );
    const toggle = within(confirm).getByRole("switch", {
      name: "Take it down too",
    });
    expect(toggle).toBeChecked();
    expect(
      within(confirm).getByText(
        /Each leaves the album and the host's Deleted at once/,
      ),
    ).toBeInTheDocument();
    expect(
      within(confirm).getByRole("textbox", { name: /reason/i }),
    ).toHaveValue(`Report ${uuid(1)}`);
    await user.click(toggle);
    expect(
      within(confirm).getByText(/Nothing leaves the album/),
    ).toBeInTheDocument();
    await user.click(
      within(confirm).getByRole("button", { name: "Set hold and preserve" }),
    );
    expect(actions.holdFromReportAction).toHaveBeenCalledWith(
      uuid(1),
      `Report ${uuid(1)}`,
      false,
    );
  });

  it("a held item says so, and offers no second hold", async () => {
    const base = entry(1);
    const { peek } = await openPeek({
      ...base,
      media: { ...base.media!, held: true },
    });
    expect(
      within(peek).getByText(/Only Forensics releases it/),
    ).toBeInTheDocument();
    expect(
      within(peek).queryByRole("button", { name: "Hold for forensics" }),
    ).toBeNull();
  });

  it("★ Ask for proof waits for its switch, is never offered on the worst kind, and sends the operator's own question", async () => {
    const askable = entry(1, {}, [
      report(1, { kind: "consent", canAsk: true, signedIn: true }),
    ]);
    const off = await openPeek(askable, false);
    const disabled = within(off.verbs).getByRole("button", {
      name: "Ask for proof",
    });
    expect(disabled).toBeDisabled();
    expect(
      within(off.peek).getByText(
        "Asking by mail is off until the proof mail is switched on.",
      ),
    ).toBeInTheDocument();
  });

  it("sends the question once the switch is on", async () => {
    const askable = entry(1, {}, [
      report(1, { kind: "consent", canAsk: true, signedIn: true }),
    ]);
    const { user, verbs } = await openPeek(askable, true);
    await user.click(
      within(verbs).getByRole("button", { name: "Ask for proof" }),
    );
    const confirm = screen
      .getAllByRole("alertdialog")
      .find((d) => within(d).queryByText("Ask the reporter for proof?"))!;
    await user.type(
      within(confirm).getByRole("textbox", { name: /your question/i }),
      "Which photo is it?",
    );
    await user.click(
      within(confirm).getByRole("button", { name: "Send the question" }),
    );
    expect(actions.askProofAction).toHaveBeenCalledWith(
      uuid(1),
      "Which photo is it?",
    );
  });

  it("never offers Ask for proof on a child-abuse report, whoever sent it", async () => {
    const { verbs } = await openPeek(
      entry(1, {}, [report(1, { kind: "child", canAsk: true })]),
      true,
    );
    expect(
      within(verbs).queryByRole("button", { name: "Ask for proof" }),
    ).toBeNull();
  });
});

describe("a phone's two acts (`phone=stop`, and his note)", () => {
  it("★ takes it down in one press with an Undo, and holds in one press, the report left open", async () => {
    const user = userEvent.setup();
    render(
      <ReportQueue
        proofOn={false}
        entries={[entry(1, {}, [report(1, { kind: "child" })])]}
      />,
    );
    const card = document.querySelector(
      "[data-report-phone-front]",
    ) as HTMLElement;
    const acts = card.querySelector("[data-report-phone-acts]") as HTMLElement;
    // Two acts and nothing else: no Dismiss, no note, no proof.
    expect(within(acts).getAllByRole("button")).toHaveLength(2);
    expect(within(card).queryByRole("button", { name: "Dismiss" })).toBeNull();

    await user.click(
      within(acts).getByRole("button", { name: "Take it down now" }),
    );
    expect(actions.takeDownAction).toHaveBeenCalledWith(uuid(1));
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalled());
    pressToastUndo("Taken down. The report stays open for a desk.");
    expect(actions.undoTakeDownAction).toHaveBeenCalledWith(
      uuid(1),
      "2026-09-29T09:00:00.000Z",
    );

    await user.click(
      within(acts).getByRole("button", { name: "Hold for forensics" }),
    );
    expect(actions.holdFromReportAction).toHaveBeenCalledWith(
      uuid(1),
      null,
      true,
    );
  });

  it("offers an album report nothing to take down from a phone", () => {
    render(
      <ReportQueue
        proofOn={false}
        entries={[
          entry(1, { subject: "album", media: null, uploader: null }, [
            report(1, { kind: "violence" }),
          ]),
        ]}
      />,
    );
    const card = document.querySelector(
      "[data-report-phone-front]",
    ) as HTMLElement;
    expect(
      within(card).getByText("An album is acted on from a desk."),
    ).toBeInTheDocument();
    expect(within(card).queryByRole("button")).toBeNull();
  });
});

describe("a reopened report whose item is gone is that item's (crumbs-21, migration 20260929231000)", () => {
  // A dismissal reopened after the purge took its item: the report still names the item and its kind, so
  // the queue never draws it as its album's, and its verdict only closes (nothing is left to take down).
  const gone = (type: "photo" | "video" | null) =>
    entry(1, { media: null, uploader: null, deleted: { id: "m1", type } }, [
      report(1, { kind: "violence" }),
    ]);

  it("★ says the video was deleted where the picture would be, and wears Deleted", () => {
    render(<ReportQueue proofOn={false} entries={[gone("video")]} />);
    const still = document.querySelector(
      "[data-report-deleted]",
    ) as HTMLElement;
    expect(still.dataset.reportDeleted).toBe("video");
    expect(
      within(still).getByText("The video was deleted."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Hannah and Theo", {
        selector: "[data-report-deleted] *",
      }),
    ).toBeNull();
    expect(screen.getAllByText("Deleted").length).toBeGreaterThan(0);
    expect(document.querySelector("img, video")).toBeNull();
  });

  it("★ its verdict closes the report and says nothing of the album", async () => {
    const user = userEvent.setup();
    render(<ReportQueue proofOn={false} entries={[gone("photo")]} />);
    const open = screen.queryAllByRole("button", {
      name: "Open this report whole",
    });
    await user.click(
      open[0] ??
        screen.getAllByRole("button", { name: /^Open the report on/ })[0],
    );
    const peek = await screen.findByRole("dialog");
    expect(within(peek).getByText(/^A photo, /)).toBeInTheDocument();
    const verbs = peek.querySelector("[data-report-verbs]") as HTMLElement;
    // Nothing to hold or take down: its item is gone.
    expect(
      within(verbs).queryByRole("button", { name: "Hold for forensics…" }),
    ).toBeNull();
    await user.click(within(verbs).getByRole("button", { name: "Action…" }));
    // The confirm is found by its words whatever its role (a dialog today; crumbs-20 announces every
    // confirm as an alertdialog): what this pins is what it says.
    const confirm = [
      ...screen.queryAllByRole("dialog"),
      ...screen.queryAllByRole("alertdialog"),
    ].find((d) => within(d).queryByText("Close this report as Actioned?"))!;
    expect(confirm).toBeDefined();
    expect(
      within(confirm).getByText(
        "The photo is already deleted; the report closes as Actioned.",
      ),
    ).toBeInTheDocument();
    const touches = within(confirm)
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(touches).toEqual(["-This report moves to Actioned"]);
  });

  it("★ its tile in the sweep names the item, never the whole album (build 27's red-team)", () => {
    // Reopened after the purge took its photo, the tile's line read "The whole album · <album>" beside its
    // own "The photo was deleted.": the line fell back to the album whenever the uploader was unknown,
    // which a gone item's report always is. The peek says "A photo"; so does the tile.
    render(
      <ReportQueue
        proofOn={false}
        entries={[
          entry(
            1,
            {
              media: null,
              uploader: null,
              deleted: { id: "m1", type: "photo" },
            },
            [report(1, { kind: "other" })],
          ),
        ]}
      />,
    );
    const tile = document.querySelector(
      '[data-report-lane="sweep"] [data-report-tile]',
    ) as HTMLElement;
    expect(
      tile.querySelector('[data-report-fact="uploader"]')?.textContent,
    ).toBe("A photo");
    expect(tile.textContent).not.toMatch(/whole album/i);
  });

  it("an album's own report still says the whole album on its tile", () => {
    render(
      <ReportQueue
        proofOn={false}
        entries={[
          entry(1, { subject: "album", media: null, uploader: null }, [
            report(1, { kind: "other" }),
          ]),
        ]}
      />,
    );
    const tile = document.querySelector(
      '[data-report-lane="sweep"] [data-report-tile]',
    ) as HTMLElement;
    expect(
      tile.querySelector('[data-report-fact="uploader"]')?.textContent,
    ).toBe("The whole album");
  });

  it("a phone says a desk closes it, in the item's own words", () => {
    render(<ReportQueue proofOn={false} entries={[gone(null)]} />);
    const card = document.querySelector(
      "[data-report-phone-front]",
    ) as HTMLElement;
    expect(
      within(card).getByText(
        "The item is already deleted, so this one waits for a desk to close it.",
      ),
    ).toBeInTheDocument();
    expect(within(card).queryByRole("button")).toBeNull();
  });
});

/**
 * ★ A CHILD-ABUSE REPORT SAYS ITS ADDRESS'S STRIKES (crumbs-33, a board idea from `hide-strikes`): "nothing in the
 * portal shows a strike", so the operator could not know when a Dismiss is an address's third and takes its
 * instant hide away. The line, on the card and in the report whole, says how many live strikes its address holds
 * and what a Dismiss would make of it. The address itself never shows: the read keys on its hash.
 */
describe("a child-abuse report's strikes", () => {
  const RULE = { strikes: 3, freshLapsesAt: "2027-03-30T09:00:00.000Z" };
  const childReport = (
    n: number,
    reading: { live: number; barred: boolean; lapses: string[] } | null,
    over: Partial<EntryReport> = {},
  ) =>
    report(n, {
      kind: "child",
      signedIn: true,
      confirmed: true,
      strikes: reading ? addressStrikes(reading, RULE, 1) : null,
      ...over,
    });
  const TWO = {
    live: 2,
    barred: false,
    lapses: ["2027-02-20T21:05:00.000Z", "2026-12-02T19:30:00.000Z"],
  };

  it("★ the card says when a Dismiss is the third, and until when its reports stop hiding", () => {
    render(
      <ReportQueue
        proofOn={false}
        entries={[entry(1, {}, [childReport(1, TWO)])]}
      />,
    );
    const line = document.querySelector(
      "[data-report-front] [data-report-fact='strikes']",
    ) as HTMLElement;
    expect(line).not.toBeNull();
    expect(line.textContent).toBe(
      "This address has 2 strikes of 3. A Dismiss makes 3, and its reports stop hiding right away until Dec 2, 2026 UTC.",
    );
    // The press that ends the hide is the one the line marks.
    expect(line.hasAttribute("data-strikes-end")).toBe(true);
    // The address never shows (the entry carries none): only what the read counted.
  });

  it("★ the report whole says each report's own address, and an address already barred", async () => {
    const user = userEvent.setup();
    render(
      <ReportQueue
        proofOn={false}
        entries={[
          entry(1, {}, [
            childReport(1, {
              live: 3,
              barred: true,
              lapses: [
                "2027-03-01T10:00:00.000Z",
                "2027-02-01T10:00:00.000Z",
                "2027-01-10T10:00:00.000Z",
              ],
            }),
            childReport(2, { live: 0, barred: false, lapses: [] }),
          ]),
        ]}
      />,
    );
    await user.click(
      screen.getAllByRole("button", { name: "Open this report whole" })[0],
    );
    const peek = await screen.findByRole("dialog");
    const lines = [
      ...peek.querySelectorAll("[data-report-fact='strikes']"),
    ].map((l) => l.textContent);
    expect(lines).toEqual([
      "This address has 3 strikes, so its reports don't hide right away until Jan 10, 2027 UTC. A Dismiss makes 4, until Feb 1, 2027 UTC.",
      "This address has no strikes. A Dismiss makes 1 of 3.",
    ]);
  });

  it("says nothing of strikes where there is no reading, and on any other kind", () => {
    render(
      <ReportQueue
        proofOn={false}
        entries={[
          entry(1, {}, [childReport(1, null)]),
          entry(2, {}, [report(2, { kind: "violence", canAsk: true })]),
        ]}
      />,
    );
    expect(document.querySelector("[data-report-fact='strikes']")).toBeNull();
    expect(document.body.textContent).not.toMatch(/strike/i);
  });
});

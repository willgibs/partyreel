/**
 * THE REPORTER'S ANSWER (admin-triage r2, `proof=confirm`): one field, one press, and the link spent once it
 * lands. It sends the link's token and her words in the body, never a URL; says it landed in place, with no
 * second send; and says a refusal in the route's own words (a used or closed link reads the same).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReportAnswerForm } from "./report-answer-form";

const TOKEN = "a".repeat(64);

function respond(status: number, body: unknown) {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

beforeEach(() => {
  global.fetch = vi.fn();
  respond(200, { ok: true });
});

describe("ReportAnswerForm", () => {
  it("★ sends the token and her words in the body, then says it landed, with no second send", async () => {
    render(<ReportAnswerForm token={TOKEN} />);
    const send = screen.getByRole("button", { name: "Add to my report" });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Your answer"), {
      target: { value: "  The one of the toast.  " },
    });
    fireEvent.click(send);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your answer is on your report",
    );
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe("/api/reports/answer");
    expect(JSON.parse(String(init?.body))).toEqual({
      token: TOKEN,
      answer: "The one of the toast.",
    });
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("says a refusal in the route's own words, and keeps what she wrote", async () => {
    respond(404, {
      ok: false,
      message:
        "This link has already been used, or the report it belongs to is closed.",
    });
    render(<ReportAnswerForm token={TOKEN} />);
    fireEvent.change(screen.getByLabelText("Your answer"), {
      target: { value: "Here it is." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to my report" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "This link has already been used",
      ),
    );
    expect(screen.getByLabelText("Your answer")).toHaveValue("Here it is.");
  });
});

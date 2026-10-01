import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { track } from "@/lib/analytics/web";
import { JOB_OPENINGS } from "@/lib/constants/careers";

import { setReducedMotion } from "../../../../../../vitest.setup";
import { submitApplication } from "../actions";
import { ApplicationForm } from "./application-form";

/**
 * A JOB APPLICATION ENDS ON ITS RECEIPT (mkt-polish): the form ended on a toast and a bare drawn check,
 * while /contact's card became the receipt for the note it carried. One contract now: the card is the
 * receipt (the role, the applicant's own words, where the reply goes, one onward link, Send another),
 * no toast repeats the thanks, and a Server Function that never answers is a failed send with every word
 * kept. The write path is `public-form-submit.test.ts`'s.
 */

vi.mock("../actions", () => ({ submitApplication: vi.fn() }));
vi.mock("@/lib/analytics/web", () => ({ track: vi.fn() }));

/** A real listing (the first, whichever role it is), so the receipt names what the page does. */
const ROLE = JOB_OPENINGS[0];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(submitApplication).mockReset();
  setReducedMotion(true);
});

async function apply(user: ReturnType<typeof userEvent.setup>) {
  render(<ApplicationForm roleSlug={ROLE.slug} roleTitle={ROLE.title} />);
  await user.type(screen.getByPlaceholderText("Your name"), "Ada Lovelace");
  await user.type(
    screen.getByPlaceholderText("you@example.com"),
    "ada@example.com",
  );
  await user.type(
    screen.getByRole("textbox", { name: "Note" }),
    "I would love to own the reel's rendering pipeline.",
  );
  await user.click(screen.getByRole("button", { name: "Submit application" }));
}

describe("the application form", () => {
  it("becomes the application's receipt, and thanks once, on the card", async () => {
    vi.mocked(submitApplication).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    await apply(user);

    const heading = await screen.findByRole("heading", {
      level: 3,
      name: /On its way, Ada/,
    });
    // The news reaches a screen reader first.
    expect(heading).toHaveTextContent("Application sent. On its way, Ada.");
    expect(heading).toHaveFocus();
    expect(
      screen.queryByRole("button", { name: "Submit application" }),
    ).toBeNull();
    expect(submitApplication).toHaveBeenCalledWith(
      ROLE.slug,
      expect.objectContaining({
        name: "Ada Lovelace",
        email: "ada@example.com",
      }),
    );
    expect(track).toHaveBeenCalledWith("careers_apply");
    expect(toast.success).not.toHaveBeenCalled();
    // The applicant's own words come back on the card.
    expect(screen.getByText(ROLE.title)).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(
      screen.getByText("I would love to own the reel's rendering pipeline."),
    ).toBeInTheDocument();
  });

  it("returns an empty form, with the keyboard on its first field, for Send another", async () => {
    vi.mocked(submitApplication).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    await apply(user);
    await screen.findByRole("heading", { name: /On its way/ });

    await user.click(screen.getByRole("button", { name: "Send another" }));
    expect(screen.getByPlaceholderText("Your name")).toHaveFocus();
    expect(screen.getByPlaceholderText("Your name")).toHaveValue("");
  });

  it("treats a send that never answers as a failed send, words kept", async () => {
    vi.mocked(submitApplication).mockRejectedValue(
      new TypeError("Failed to fetch"),
    );
    const user = userEvent.setup();
    await apply(user);

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.queryByRole("heading", { name: /On its way/ })).toBeNull();
    expect(screen.getByPlaceholderText("Your name")).toHaveValue(
      "Ada Lovelace",
    );
    expect(
      screen.getByRole("button", { name: "Submit application" }),
    ).toBeEnabled();
    expect(track).not.toHaveBeenCalled();
  });
});

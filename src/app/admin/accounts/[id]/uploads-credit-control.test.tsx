import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MEGABYTE } from "@/lib/constants/tiers";

/**
 * ★ THE OPERATOR'S UPLOADS CREDIT SAYS WHAT IT DOES BEFORE IT RUNS (crumbs-92, X6): an amount that is a whole number
 * within the room the bound leaves, then the portal's one confirmation, listing what it reaches and holding its verb until
 * the reason is written. Nothing is sent until the verb is pressed, and then once, for this account, as whole megabytes
 * with the reason and the sheet's own key. A refusal leaves the sheet open on the same key (a repeat press is the same
 * credit); a sheet closed and opened again is a new one.
 */

const action = vi.hoisted(() =>
  vi.fn(
    async (
      ..._args: unknown[]
    ): Promise<
      { ok: true } | { ok: false; code: "unknown"; message: string }
    > => ({
      ok: true,
    }),
  ),
);
vi.mock("@/app/admin/accounts/actions", () => ({
  creditUploadsAsOperatorAction: action,
}));

const { UploadsCreditControl, creditTouches } =
  await import("./uploads-credit-control");

const KEYS = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
];

function control(room = 300 * MEGABYTE) {
  render(
    <UploadsCreditControl
      userId="u-1"
      who="A host"
      room={room}
      until="Nov 1, 2026 UTC, when the month turns"
    />,
  );
}

const amount = () => screen.getByLabelText("Credit her uploads");
const press = () => screen.getByRole("button", { name: /Credit…/ });
const type = (value: string) =>
  fireEvent.change(amount(), { target: { value } });

beforeEach(() => {
  action.mockReset().mockResolvedValue({ ok: true });
  let n = 0;
  vi.stubGlobal("crypto", { randomUUID: () => KEYS[n++ % KEYS.length] });
});

describe("the amount", () => {
  it("★ waits for a whole number within the room, and says the room before anyone presses", () => {
    control();
    expect(press()).toBeDisabled();
    expect(
      screen.getByText(
        "Up to 300 MB more fits. It ends with the window, Nov 1, 2026 UTC, when the month turns.",
      ),
    ).toBeInTheDocument();

    type("100");
    expect(press()).toBeEnabled();
    type("300");
    expect(press()).toBeEnabled();
  });

  it("★ says why a press waits: not a number, nothing, too much", () => {
    control(200 * MEGABYTE);
    type("1.5");
    expect(press()).toBeDisabled();
    expect(screen.getByText("Enter a whole number.")).toBeInTheDocument();
    expect(amount()).toHaveAttribute("aria-invalid", "true");
    type("0");
    expect(screen.getByText("A credit is at least 1 MB.")).toBeInTheDocument();
    type("201");
    expect(press()).toBeDisabled();
    expect(screen.getByText("At most 200 MB more fits.")).toBeInTheDocument();
    type("200");
    expect(press()).toBeEnabled();
    expect(amount()).not.toHaveAttribute("aria-invalid");
  });

  it("reads GB as 1,024 MB", () => {
    control(5 * 1024 * MEGABYTE);
    fireEvent.change(screen.getByLabelText("Unit"), {
      target: { value: "GB" },
    });
    type("2");
    fireEvent.click(press());
    expect(
      screen.getByText(/Gives A host 2 GB more uploads until Nov 1, 2026 UTC/),
    ).toBeInTheDocument();
  });
});

describe("the confirmation", () => {
  it("★ lists what it reaches, holds its verb for the reason, and sends nothing until then", async () => {
    control();
    type("100");
    fireEvent.click(press());
    const dialog = screen.getByRole("alertdialog");
    const touches = [
      ...dialog.querySelectorAll("[data-slot='destructive-touches'] li"),
    ].map((li) => li.textContent?.replace(/^-/, "").trim());
    expect(touches).toEqual(
      creditTouches(100 * MEGABYTE, "Nov 1, 2026 UTC, when the month turns"),
    );
    expect(touches[0]).toBe(
      "Adds 100 MB to her uploads allowance until Nov 1, 2026 UTC, when the month turns; her plan's own number does not change",
    );
    expect(touches[2]).toMatch(/Edits no count and no file/);
    expect(touches[3]).toMatch(/has no undo/);

    const verb = within(dialog).getByRole("button", { name: "Credit uploads" });
    expect(verb).toBeDisabled();
    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: "   " },
    });
    expect(verb).toBeDisabled();
    expect(action).not.toHaveBeenCalled();
  });

  it("★ sends whole megabytes, the reason trimmed and the sheet's key, once, and starts the field clean", async () => {
    control();
    type("100");
    fireEvent.click(press());
    const dialog = screen.getByRole("alertdialog");
    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: "  She wrote in: her guests were refused  " },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Credit uploads" }),
    );
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action).toHaveBeenCalledWith(
      "u-1",
      100,
      "She wrote in: her guests were refused",
      KEYS[0],
    );
    await waitFor(() => expect(amount()).toHaveValue(""));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("★ a refusal leaves the sheet open, and the repeat press is the same credit (the same key)", async () => {
    action.mockResolvedValueOnce({
      ok: false,
      code: "unknown",
      message: "The credit did not go through. Press Credit uploads again.",
    });
    control();
    type("100");
    fireEvent.click(press());
    const dialog = screen.getByRole("alertdialog");
    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: "why" },
    });
    const verb = within(dialog).getByRole("button", { name: "Credit uploads" });
    fireEvent.click(verb);
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    // Still open, still on its key, the field untouched.
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(amount()).toHaveValue("100");
    await waitFor(() => expect(verb).toBeEnabled());
    fireEvent.click(verb);
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(action.mock.calls[0][3]).toBe(KEYS[0]);
    expect(action.mock.calls[1][3]).toBe(KEYS[0]);
  });

  it("a sheet closed and opened again is a new press with a new key", async () => {
    control();
    type("100");
    fireEvent.click(press());
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    fireEvent.click(press());
    const dialog = screen.getByRole("alertdialog");
    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: "why" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Credit uploads" }),
    );
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][3]).toBe(KEYS[1]);
  });
});

describe("what the sheet promises", () => {
  it("says the amount in the bytes' own unit and the window", () => {
    expect(
      creditTouches(2 * 1024 * MEGABYTE, "her soonest live pass ends")[0],
    ).toBe(
      "Adds 2 GB to her uploads allowance until her soonest live pass ends; her plan's own number does not change",
    );
  });
});

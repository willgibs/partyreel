// @contract-for: src/components/guest/add-email-dialog.tsx
/**
 * THE SECOND CHANCE AT THE OPTIONAL ADDRESS (Will, 2026-09-22).
 *
 * Four functions, none of them a look:
 *   1. IT SENDS THE ADDRESS AND THE TOKEN IN THE BODY, never a URL, over the
 *      route that owns the parse and the limiter.
 *   2. IT RECORDS A BOOLEAN AND NOTHING ELSE. The device learns that an address
 *      is on the row; it never learns which one, because a phone at a party
 *      belongs to whoever is holding it.
 *   3. A REFUSAL LANDS UNDER THE FIELD. One small optional act never earns a
 *      toast that outlives the surface it is about.
 *   4. THE WAY PAST THE MIDDLE STATE IS ALWAYS THERE. "Confirm it now instead"
 *      hands over to the real code door, because confirming is the better
 *      outcome and the guest should never have to find it twice.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddEmailDialog } from "./add-email-dialog";

function respond(status: number, body: unknown) {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

function mount(props: Partial<React.ComponentProps<typeof AddEmailDialog>> = {}) {
  return render(
    <AddEmailDialog
      qrToken="tok-1"
      sessionToken="sess-1"
      open
      onOpenChange={vi.fn()}
      onConfirmInstead={vi.fn()}
      {...props}
    />,
  );
}

const field = () => screen.getByLabelText("Email");

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  global.fetch = vi.fn();
});

describe("AddEmailDialog", () => {
  it("makes the door's own promise, word for word", () => {
    mount();
    expect(
      screen.getByText(
        "Come back to this album anytime, with every photo you add.",
      ),
    ).toBeInTheDocument();
  });

  it("sends the token and the address in the BODY, never a URL", async () => {
    respond(200, { ok: true, email_attached: true });
    mount();
    fireEvent.change(field(), { target: { value: " Priya@Example.com " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe("/api/guests/email");
    expect(String(url)).not.toContain("priya");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      qr_token: "tok-1",
      session_token: "sess-1",
      email: "priya@example.com",
    });
  });

  it("records a BOOLEAN on this device, and never the address", async () => {
    respond(200, { ok: true, email_attached: true });
    const onOpenChange = vi.fn();
    mount({ onOpenChange });
    fireEvent.change(field(), { target: { value: "priya@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(localStorage.getItem("pr_guest_email_attached_tok-1")).toBe("1"),
    );
    expect(JSON.stringify(localStorage)).not.toContain("priya@example.com");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("refuses junk under the field, before anything is sent", async () => {
    mount();
    fireEvent.change(field(), { target: { value: "priya@@example" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(screen.getByText("Check that email address.")).toBeInTheDocument(),
    );
    expect(global.fetch).not.toHaveBeenCalled();
    expect(localStorage.getItem("pr_guest_email_attached_tok-1")).toBeNull();
  });

  it("says a refusal from the route in the same slot, and flags nothing", async () => {
    respond(401, {
      ok: false,
      code: "invalid_session",
      message: "Start again from the album.",
    });
    mount();
    fireEvent.change(field(), { target: { value: "priya@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(
        screen.getByText("Start again from the album."),
      ).toBeInTheDocument(),
    );
    expect(localStorage.getItem("pr_guest_email_attached_tok-1")).toBeNull();
  });

  it("hands over to the real door on 'Confirm it now instead'", () => {
    const onConfirmInstead = vi.fn();
    const onOpenChange = vi.fn();
    mount({ onConfirmInstead, onOpenChange });
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm it now instead" }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirmInstead).toHaveBeenCalled();
  });
});

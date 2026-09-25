/**
 * THE EMAIL ROW, DRIVEN THROUGH THE DOM (lp/identity-email): the two-code change end to end with the
 * server functions stubbed. The machine's every transition is pinned in email-change.test.ts; this
 * pins what the person sees and what reaches the server:
 *
 *   - Change, an address, Send codes: the request carries the typed address and nothing else, and two
 *     code fields open, one per address;
 *   - each code goes to the server with ITS SIDE only (never an address);
 *   - the first confirmation asks for the other address's code and moves the caret there, the second
 *     completes, says so and refreshes the page;
 *   - a refused code shows its line on that side and clears that field, and the other side keeps
 *     its state;
 *   - a refused request says why under the field; Not now parks the change one tap away.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  request: vi.fn(),
  confirm: vi.fn(),
  refresh: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("./email-actions", () => ({
  requestEmailChangeAction: state.request,
  confirmEmailChangeAction: state.confirm,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: state.refresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: state.toastSuccess, error: state.toastError },
}));

const { EmailSection } = await import("./email-section");

const OLD = "old@example.com";
const NEW = "new@example.com";

function codeField(address: string): HTMLInputElement {
  return screen.getByLabelText(`The code sent to ${address}`);
}

/** Type a whole code the way a paste or an autofill lands it: one change event. */
async function enterCode(address: string, code: string) {
  await act(async () => {
    fireEvent.change(codeField(address), { target: { value: code } });
  });
}

async function openPending() {
  const user = userEvent.setup();
  render(<EmailSection email={OLD} pending={null} hint={null} />);
  await user.click(screen.getByRole("button", { name: "Change" }));
  await user.type(screen.getByLabelText("New email"), NEW);
  await user.click(screen.getByRole("button", { name: "Send codes" }));
  return user;
}

beforeEach(() => {
  // input-otp probes for a password manager's badge with elementFromPoint, which jsdom lacks.
  document.elementFromPoint = () => null;
  state.request.mockReset();
  state.request.mockResolvedValue({ ok: true, pending: NEW });
  state.confirm.mockReset();
  state.refresh.mockClear();
  state.toastSuccess.mockClear();
  state.toastError.mockClear();
});

describe("EmailSection", () => {
  it("shows the address with a way to change it", () => {
    render(<EmailSection email={OLD} pending={null} hint={null} />);
    expect(screen.getByText(OLD)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Change" })).toBeTruthy();
  });

  it("asks for the change with the typed address, then opens one code field per address", async () => {
    await openPending();
    expect(state.request).toHaveBeenCalledWith(NEW);
    expect(codeField(OLD)).toBeTruthy();
    expect(codeField(NEW)).toBeTruthy();
    expect(screen.getByText(/each address, in either order/)).toBeTruthy();
  });

  it("★ sends each code with its side only, and completes on the second", async () => {
    await openPending();
    state.confirm.mockResolvedValueOnce({
      ok: true,
      state: "half",
      confirmed: "current",
    });
    await enterCode(OLD, "111111");
    expect(state.confirm).toHaveBeenLastCalledWith("current", "111111");
    expect(
      screen.getByText(`Confirmed. Now enter the code we sent to ${NEW}.`),
    ).toBeTruthy();
    expect(screen.queryByLabelText(`The code sent to ${OLD}`)).toBeNull();
    expect(document.activeElement).toBe(codeField(NEW));

    state.confirm.mockResolvedValueOnce({
      ok: true,
      state: "done",
      email: NEW,
    });
    await enterCode(NEW, "222222");
    expect(state.confirm).toHaveBeenLastCalledWith("new", "222222");
    expect(state.toastSuccess).toHaveBeenCalledWith(
      `Your email is now ${NEW}.`,
    );
    expect(state.refresh).toHaveBeenCalledTimes(1);
    // The row shows the new address, and the line under it names it again.
    expect(screen.getAllByText(NEW)).toHaveLength(2);
    expect(screen.getByText(/Sign-in codes go to/)).toBeTruthy();
    expect(screen.queryByLabelText(`The code sent to ${NEW}`)).toBeNull();
  });

  it("a refused code shows its line on that side only, and clears that field", async () => {
    await openPending();
    state.confirm.mockResolvedValueOnce({
      ok: true,
      state: "half",
      confirmed: "new",
    });
    await enterCode(NEW, "222222");
    state.confirm.mockResolvedValueOnce({
      ok: false,
      code: "wrong_code",
      message: "That code didn't work.",
    });
    await enterCode(OLD, "999999");
    expect(screen.getByRole("alert").textContent).toBe(
      "That code didn't work.",
    );
    expect(codeField(OLD).value).toBe("");
    // The new side stays confirmed.
    expect(screen.queryByLabelText(`The code sent to ${NEW}`)).toBeNull();
    expect(screen.getByText("Confirmed")).toBeTruthy();
  });

  it("a refused request says why under the field and opens nothing", async () => {
    state.request.mockResolvedValueOnce({
      ok: false,
      code: "same",
      message: "That's already your email.",
    });
    const user = userEvent.setup();
    render(<EmailSection email={OLD} pending={null} hint={null} />);
    await user.click(screen.getByRole("button", { name: "Change" }));
    await user.type(screen.getByLabelText("New email"), OLD);
    await user.click(screen.getByRole("button", { name: "Send codes" }));
    expect(screen.getByRole("alert").textContent).toBe(
      "That's already your email.",
    );
    expect(screen.queryByLabelText(`The code sent to ${OLD}`)).toBeNull();
  });

  it("Not now parks the change one tap away", async () => {
    const user = await openPending();
    await user.click(screen.getByRole("button", { name: "Not now" }));
    expect(screen.queryByLabelText(`The code sent to ${NEW}`)).toBeNull();
    expect(screen.getByText(/waiting for both codes/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Enter the codes" }));
    expect(codeField(NEW)).toBeTruthy();
  });

  it("a change still waiting when the page loads opens its fields, with a tapped link's news", () => {
    render(
      <EmailSection
        email={OLD}
        pending={{ address: NEW, sentAt: "2026-09-25T10:00:00.000Z" }}
        hint="half"
      />,
    );
    expect(codeField(OLD)).toBeTruthy();
    expect(codeField(NEW)).toBeTruthy();
    expect(
      screen.getByText(/One of the two addresses is confirmed/),
    ).toBeTruthy();
  });
});

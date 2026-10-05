/**
 * ★ NO WORD ON A DRIVE SURFACE DELETES (crumbs-82; the Drive re-walk's finding). Disconnect's confirm said Partyreel
 * "deletes its key to it" in the same breath as "Everything already sent stays in your Drive", the one delete word on a
 * surface whose promise is that Partyreel deletes nothing of hers (PRICING.md: "Export is an off-ramp, never a one-click
 * exit"). The key is forgotten, in the confirm and in the warning a Disconnect Google did not confirm leaves behind.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const disconnect = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() => ({
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}));
vi.mock("./actions", () => ({ disconnectDriveAction: disconnect }));
vi.mock("sonner", () => ({ toast }));

const { DriveDisconnect } = await import("./drive-disconnect");

beforeEach(() => {
  vi.clearAllMocks();
});

async function openConfirm(running = 0) {
  const user = userEvent.setup();
  render(<DriveDisconnect email="p3@example.com" running={running} />);
  await user.click(screen.getByRole("button", { name: "Disconnect" }));
  return user;
}

describe("Disconnect's confirm", () => {
  it("★ says Partyreel forgets its key, and that everything already sent stays", async () => {
    await openConfirm();
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent(
      "Partyreel stops sending to p3@example.com and forgets its key to it. Everything already sent stays in your Drive.",
    );
    expect(dialog.textContent).not.toMatch(/delet/i);
  });

  it("still says what stops, in the same words, while a send is under way", async () => {
    await openConfirm(2);
    expect(await screen.findByRole("alertdialog")).toHaveTextContent(
      "forgets its key to it. Everything already sent stays in your Drive. 2 sends in progress will stop.",
    );
  });
});

describe("what Disconnect says after", () => {
  it("says Google is disconnected when Google confirmed the revoke", async () => {
    disconnect.mockResolvedValue({ ok: true, revoked: true });
    const user = await openConfirm();
    const buttons = await screen.findAllByRole("button", {
      name: "Disconnect",
    });
    await user.click(buttons[buttons.length - 1]!);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Google Drive is disconnected.",
        { description: "Everything already sent stays in your Drive." },
      ),
    );
  });

  it("★ says the key was forgotten, never deleted, when Google did not confirm the revoke", async () => {
    disconnect.mockResolvedValue({ ok: true, revoked: false });
    const user = await openConfirm();
    const buttons = await screen.findAllByRole("button", {
      name: "Disconnect",
    });
    await user.click(buttons[buttons.length - 1]!);
    await waitFor(() => expect(toast.warning).toHaveBeenCalled());
    const [title] = toast.warning.mock.calls[0]!;
    expect(title).toBe("Partyreel forgot its key to your Drive.");
    expect(title).not.toMatch(/delet/i);
  });
});

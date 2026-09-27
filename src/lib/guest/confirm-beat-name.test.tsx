import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { openToldNameChange, ToldNameForm } from "./confirm-beat-name";

const updateDisplayNameAction = vi.fn();
vi.mock("@/app/(app)/account/actions", () => ({
  updateDisplayNameAction: (name: string) => updateDisplayNameAction(name),
}));

/**
 * THE TOLD NAME'S CHANGE, FROM THE TOAST (`popups` r1, `forms=dialog`). Function only: the form
 * opens on the name she was told, writes the ACCOUNT's name through the one server write (never a
 * guest row: a confirmed account's name is its profile's), shows a refusal where the field is, and
 * hands the page the name her photographs now carry so it can patch them at once. How it looks is
 * the form kind's.
 */
beforeEach(() => {
  updateDisplayNameAction.mockReset();
});

function openOn(name: string, onRenamed = vi.fn()) {
  render(<ToldNameForm onRenamed={onRenamed} />);
  act(() => openToldNameChange(name));
  return { onRenamed };
}

describe("the told name's small form", () => {
  it("opens on the name she was told, as a form", () => {
    openOn("Priya Shah");
    expect(screen.getByRole("dialog", { name: "Change your name" })).toBeInTheDocument();
    expect((screen.getByLabelText("Your name") as HTMLInputElement).value).toBe(
      "Priya Shah",
    );
  });

  it("writes the account's name and hands the page the new one", async () => {
    updateDisplayNameAction.mockResolvedValue({ ok: true });
    const { onRenamed } = openOn("Priya Shah");
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Priya S." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    await waitFor(() => expect(onRenamed).toHaveBeenCalledWith("Priya S."));
    expect(updateDisplayNameAction).toHaveBeenCalledWith("Priya S.");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Change your name" })).toBeNull(),
    );
  });

  it("refuses an empty name before it asks the server, and says so at the field", () => {
    openOn("Priya Shah");
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    expect(updateDisplayNameAction).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("keeps the form open with the server's refusal, and renames nothing", async () => {
    updateDisplayNameAction.mockResolvedValue({
      ok: false,
      message: "Please choose a different name.",
    });
    const { onRenamed } = openOn("Priya Shah");
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/different name/),
    );
    expect(onRenamed).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Change your name" })).toBeInTheDocument();
  });
});

/**
 * Behavior pins for the password gate (Phase 4.5 S2): the NO-AUTOFOCUS rule
 * (the iOS keyboard ambush fix - R3), the error copy, and the unlock call
 * contract. The 5-strikes/20s cooldown machinery predates this phase and is
 * exercised via its copy. Behaviors only - no classes, no timings.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PasswordGate } from "@/components/guest/password-gate";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => refresh() }),
}));

beforeEach(() => {
  refresh.mockClear();
  vi.stubGlobal("fetch", vi.fn());
});

function renderGate(onUnlocked?: () => void) {
  return render(
    <PasswordGate
      token="testtoken1234"
      eventName="Test Wedding"
      onUnlocked={onUnlocked}
    />,
  );
}

function submit(value: string) {
  fireEvent.change(screen.getByLabelText("Event password"), {
    target: { value },
  });
  fireEvent.submit(
    screen.getByLabelText("Event password").closest("form")!,
  );
}

describe("PasswordGate", () => {
  it("NEVER autofocuses the input (the keyboard rises on an intentional tap only)", () => {
    renderGate();
    expect(document.activeElement).not.toBe(
      screen.getByLabelText("Event password"),
    );
  });

  it("posts the unlock and refreshes the router on ok", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);
    renderGate();
    submit("right-password");
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/guests/unlock",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("fires onUnlocked once, blurs the input, and blocks a re-submit on ok", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);
    const onUnlocked = vi.fn();
    renderGate(onUnlocked);
    const input = screen.getByLabelText("Event password");
    input.focus();
    submit("right-password");
    await waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
    // Blurred so the iOS keyboard retracts during the success beat.
    expect(document.activeElement).not.toBe(input);
    // The form is now disabled: a second submit fires nothing more.
    fireEvent.submit(input.closest("form")!);
    expect(onUnlocked).toHaveBeenCalledTimes(1);
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1);
  });

  it("the ratified in-place morph: the gate stays planted and the button turns success", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);
    renderGate(vi.fn());
    submit("right-password");
    // The button itself morphs (data-unlock-success span: check + "You're in")
    // while the WHOLE gate stays mounted - no step swap.
    expect(await screen.findByText(/You(’|')re in/)).toBeInTheDocument();
    expect(screen.getByLabelText("Event password")).toBeInTheDocument();
    expect(screen.getByLabelText("Event password")).toBeDisabled();
    expect(screen.getByText("Opening the album")).toBeInTheDocument();
  });

  it("a stalled hold turns the button into Retry (the form never re-enables)", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);
    const onRetry = vi.fn();
    const { rerender } = render(
      <PasswordGate
        token="testtoken1234"
        eventName="Test Wedding"
        onUnlocked={vi.fn()}
        onRetry={onRetry}
      />,
    );
    submit("right-password");
    await screen.findByText(/You(’|')re in/);
    rerender(
      <PasswordGate
        token="testtoken1234"
        eventName="Test Wedding"
        onUnlocked={vi.fn()}
        stalled
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open the album" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Event password")).toBeDisabled();
  });

  it("does not fire onUnlocked on a wrong password", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response);
    const onUnlocked = vi.fn();
    renderGate(onUnlocked);
    submit("wrong");
    await screen.findByText("That password didn't work. Give it another try.");
    expect(onUnlocked).not.toHaveBeenCalled();
  });

  it("shows the error copy on a wrong password and clears it on typing", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response);
    renderGate();
    submit("wrong");
    expect(
      await screen.findByText("That password didn't work. Give it another try."),
    ).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Event password"), {
      target: { value: "wrong2" },
    });
    expect(
      screen.queryByText("That password didn't work. Give it another try."),
    ).toBeNull();
  });
});

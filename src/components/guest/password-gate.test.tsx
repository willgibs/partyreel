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

function renderGate() {
  return render(<PasswordGate token="testtoken1234" eventName="Test Wedding" />);
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

  it("shows the error copy on a wrong password and clears it on typing", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response);
    renderGate();
    submit("wrong");
    expect(
      await screen.findByText("That password didn't work. Try again."),
    ).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Event password"), {
      target: { value: "wrong2" },
    });
    expect(
      screen.queryByText("That password didn't work. Try again."),
    ).toBeNull();
  });
});

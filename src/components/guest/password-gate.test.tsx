/**
 * Behavior pins for the password gate: the NO-AUTOFOCUS rule (an autofocused
 * field would ambush a guest with the iOS keyboard), the error copy, and the
 * unlock call contract. The 5-strikes/20s cooldown machinery is exercised via
 * its copy. Behaviors only - no classes, no timings.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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

/**
 * HOW LONG A BEAT MAY TAKE TO ARRIVE UNDER THE FULL SUITE'S LOAD (crumbs-28). The unlock's beat lands after
 * a mocked fetch, a transition and a render, which takes milliseconds alone; with every worker busy it once
 * took past `findBy`'s default second, and the stalled-hold test failed while passing alone 3 of 3
 * (`demo-framing-r2`). A budget, not a timing claim: a beat that never comes still fails, only later.
 */
const UNDER_LOAD = { timeout: 10_000 };

function submit(value: string) {
  fireEvent.change(screen.getByLabelText("Event password"), {
    target: { value },
  });
  fireEvent.submit(screen.getByLabelText("Event password").closest("form")!);
}

// Every wait below is on the unlock's answer, so every one gets the budget, and so does each test.
describe("PasswordGate", { timeout: 20_000 }, () => {
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
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1), UNDER_LOAD);
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
    await waitFor(
      () => expect(onUnlocked).toHaveBeenCalledTimes(1),
      UNDER_LOAD,
    );
    // Blurred so the iOS keyboard retracts during the success beat.
    expect(document.activeElement).not.toBe(input);
    // The form is now disabled: a second submit fires nothing more.
    fireEvent.submit(input.closest("form")!);
    expect(onUnlocked).toHaveBeenCalledTimes(1);
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1);
  });

  it("the in-place morph: the gate stays planted and the button turns into the beat", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);
    renderGate(vi.fn());
    submit("right-password");
    // The button itself morphs (data-unlock-success span: check + "You're in")
    // while the WHOLE gate stays mounted - no step swap.
    expect(
      await screen.findByText(/You(’|')re in/, undefined, UNDER_LOAD),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Event password")).toBeInTheDocument();
    expect(screen.getByLabelText("Event password")).toBeDisabled();
    expect(screen.getByText("Opening the album")).toBeInTheDocument();
    // ★ In the album's light (`identity-door` r3, Will's `beat=lit`), its check drawn: the green
    // it wore before is the product's one success colour, and the door's beats are the album's.
    const button = screen.getByText(/You(’|')re in/).closest("button");
    expect(button).toHaveAttribute("data-unlock-lit");
    expect(button?.querySelector('[data-door-check="stroke"]')).not.toBeNull();
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
    await screen.findByText(/You(’|')re in/, undefined, UNDER_LOAD);
    // ★ THE STALL IS RENDERED THROUGH AN AWAITED `act` (crumbs-48). The unlock runs in a transition, and its
    // own last render (the pending state, which waits on the action's promise) can still be due when the
    // stall arrives: React then ends a plain `act` with work left over ("A component suspended inside an
    // `act` scope, but the `act` call was not awaited") and the Retry is never drawn, not drawn late, so no
    // wait on it would help (measured: absent after ten seconds). Awaited, `act` drives that work to the end.
    await act(async () => {
      rerender(
        <PasswordGate
          token="testtoken1234"
          eventName="Test Wedding"
          onUnlocked={vi.fn()}
          stalled
          onRetry={onRetry}
        />,
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "Open the album" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Event password")).toBeDisabled();
  });

  it("does not fire onUnlocked on a wrong password", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response);
    const onUnlocked = vi.fn();
    renderGate(onUnlocked);
    submit("wrong");
    await screen.findByText(
      "That password didn't work. Give it another try.",
      undefined,
      UNDER_LOAD,
    );
    expect(onUnlocked).not.toHaveBeenCalled();
  });

  it("shows the error copy on a wrong password and clears it on typing", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response);
    renderGate();
    submit("wrong");
    expect(
      await screen.findByText(
        "That password didn't work. Give it another try.",
        undefined,
        UNDER_LOAD,
      ),
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

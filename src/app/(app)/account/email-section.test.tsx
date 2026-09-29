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
 *   - a refused request says why under the field; Not now parks the change one tap away;
 *   - the tapped link's `?email_change=` hint leaves the address once read, and Next's own copy of the
 *     address loses it too (crumbs-16), so the `router.refresh()` a finished change makes cannot put it
 *     back on the bar.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  installNextHistory,
  NextRouterStandIn,
  type NextHistory,
} from "@/lib/test-utils/next-history";

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

// ★ THE INPUT-OTP FLAKE, AT ITS SOURCE (gate 24 at door-r3-wiring's merge, twice in desk-trim's own
// runs): this file is the one place that moves REAL focus between two live OTP sides (`verify`'s
// `inputs.current[otherSide(side)]?.focus()`, proved by "sends each code..."'s own
// `document.activeElement` assertion), which arms input-otp's password-manager-badge effect on each
// side in turn - real 0ms/2000ms/5000ms/6000ms timeouts (`input-otp/dist/index.mjs`), not the
// fake-timer kind. Ordinary per-test cleanup cancels them the moment a side unmounts, but that is a
// React-level guarantee, not a scheduling one: nothing here forces the LAST side's timers to be
// canceled before this file's own jsdom is torn down, and a real timer that survives that fires into
// a `window` that no longer exists (`ReferenceError: window is not defined`, inside react-dom's
// `resolveUpdatePriority`) as an unhandled error with no failing assertion to point at - it flips
// `pnpm test`'s exit code well after every `it` above has reported green.
//
// Fake timers were tried and rejected: input-otp's own effects are exactly what needs faking, but
// Vitest's `vi.useFakeTimers()` cannot fake only those without also freezing whatever jsdom uses
// under the hood for React's scheduler, which hung every interactive test in this file. So this
// waits the real 6+ seconds out instead, ONCE for the whole file (not per test - the other six
// tests' own timers are already gone via normal cleanup by the time this runs), while the document
// still exists, so nothing is left pending when the environment closes it.
afterAll(async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 6100));
  });
}, 10_000);

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

/**
 * ★ THE HINT LEAVES THE ADDRESS, AND NEXT'S COPY OF IT LEAVES TOO (crumbs-16). The effect used to hand
 * `replaceState` the entry's own state, which carries Next's `__NA`: Next takes such a call for its own
 * and applies no URL, so its copy kept `?email_change=`, and the `router.refresh()` that follows a
 * finished change fetched that stale address and wrote the parameter back over the bar (measured on the
 * real component under `next dev`). The effect also runs on the page's FIRST commit, before Next has
 * patched `replaceState` (a child's effect runs before its parent's), where a fresh state replaces the
 * entry's `__NA` and tree and Next never hears the address: the stand-in's router installs its patch
 * after what it holds has run its mount effects, as Next's does, so this pins the write's order too.
 */
describe("the tapped link's hint", () => {
  let next: NextHistory;
  beforeEach(() => {
    next = installNextHistory();
    state.refresh.mockImplementation(() => next.refresh());
  });
  afterEach(() => {
    next.uninstall();
    window.history.replaceState(null, "", "/");
  });

  const landed = (hint: "half" | null) => {
    render(
      <NextRouterStandIn>
        <EmailSection email={OLD} pending={null} hint={hint} />
      </NextRouterStandIn>,
    );
  };

  it("★ leaves the bar and Next's copy alike, keeps the rest, and stays gone through a router refresh", async () => {
    next.land("/account?email_change=half&keep=1");
    landed("half");
    await act(async () => {});
    expect(window.location.search).toBe("?keep=1");
    expect(next.href).toBe("/account?keep=1");
    // The first commit's write did not empty the entry Next needs to go Back through.
    expect(window.history.state).toMatchObject({ __NA: true });
    act(() => next.refresh());
    expect(window.location.search).toBe("?keep=1");
  });

  it("writes nothing when the link brought no hint", async () => {
    next.land("/account?keep=1");
    const replace = vi.spyOn(window.history, "replaceState");
    landed(null);
    await act(async () => {});
    expect(replace).not.toHaveBeenCalled();
    expect(window.location.search).toBe("?keep=1");
  });
});

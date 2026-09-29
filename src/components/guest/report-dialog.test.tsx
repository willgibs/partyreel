/**
 * THE REPORT FORM, ROUND TWO (admin-triage r2: `harm=kinds`, `proof=confirm`, and a photo's own Report). Its
 * functions, none of them a look:
 *
 *  1. ★ THE KIND IS ASKED BEFORE SUBMIT CAN SEND: one tap sorts the night before anyone reads it.
 *  2. ★ THE WORST KIND SAYS WHAT SENDING WILL DO, true for who is reporting: a confirmed address hides a photo
 *     at once; an unconfirmed one is told how to; an album report is pointed at the photo's own Report.
 *  3. A PHOTO'S OWN REPORT OPENS THIS FORM WITH THAT PHOTO NAMED, and sends its id with the kind.
 *  4. ★ NOTHING ABOUT THE REPORTER RIDES THE BODY: the server reads the session.
 *  5. THE CONFIRM IS THE ACCOUNT DOOR'S OWN CODE, and it comes back to the report with the address it keeps.
 *  6. A HIDE SAYS SO, and the page catches up.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { maskEmail } from "@/lib/auth/remembered-email";
import { requestPhotoReport } from "@/lib/guest/report-door";
import { KIND_WORDS } from "@/lib/reports/kinds";

const state = vi.hoisted(() => ({
  user: null as null | { email: string; email_confirmed_at: string | null },
  refresh: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  doorProps: null as null | Record<string, unknown>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: state.refresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: state.success, error: state.error },
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
  }),
}));
// The door itself is its own component's to test; here it is the seam the form hands over to and back from.
vi.mock("@/components/auth/account-door", () => ({
  AccountDoor: (props: Record<string, unknown>) => {
    state.doorProps = props;
    return (
      <button
        type="button"
        onClick={() => {
          state.user = {
            email: "mia@example.com",
            email_confirmed_at: "2026-09-29T10:00:00Z",
          };
          void (props.onVerified as () => Promise<void>)();
        }}
      >
        Verify the code
      </button>
    );
  },
}));

const { ReportDialog, instantHideLine } = await import("./report-dialog");

function respond(status: number, body: unknown) {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

async function open() {
  render(<ReportDialog qrToken="tok-1" />);
  fireEvent.click(screen.getByRole("button", { name: /report/i }));
  return screen.findByRole("dialog");
}

const submit = () => screen.getByRole("button", { name: "Submit report" });
const sentBody = () =>
  JSON.parse(String(vi.mocked(global.fetch).mock.calls[0][1]?.body));

beforeEach(() => {
  vi.clearAllMocks();
  state.user = null;
  state.doorProps = null;
  global.fetch = vi.fn();
  respond(200, { ok: true, hid: false });
});

describe("the kinds (`harm=kinds`)", () => {
  it("★ asks one of five kinds or Something else before Submit can send", async () => {
    await open();
    expect(screen.getAllByRole("radio")).toHaveLength(6);
    expect(submit()).toBeDisabled();
    fireEvent.click(screen.getByLabelText(KIND_WORDS.other));
    expect(submit()).toBeEnabled();
  });

  it("★ says what sending will do only on the worst kind, true for who is reporting", async () => {
    await open();
    fireEvent.click(screen.getByLabelText(KIND_WORDS.private));
    expect(document.querySelector("[data-report-instant-hide]")).toBeNull();
    const [child] = screen
      .getAllByRole("radio")
      .filter((r) => (r as HTMLInputElement).value === "child");
    fireEvent.click(child);
    expect(
      document.querySelector("[data-report-instant-hide]")?.textContent,
    ).toBe(instantHideLine("album", false));
    // The three lines, each true of its case.
    expect(instantHideLine("album", true)).toMatch(/its own Report/);
    expect(instantHideLine("item", false)).toMatch(/^Confirm your email/);
    expect(instantHideLine("item", true)).toMatch(
      /hidden from everyone the moment/,
    );
  });
});

describe("a photo's own Report", () => {
  it("★ opens the form with that photo named, and sends its id, its kind and nothing of the reporter", async () => {
    state.user = {
      email: "mia@example.com",
      email_confirmed_at: "2026-09-29T10:00:00Z",
    };
    render(<ReportDialog qrToken="tok-1" />);
    act(() =>
      requestPhotoReport({
        mediaId: "0a8b3c2d-1e4f-4a6b-8c9d-0e1f2a3b4c5d",
        type: "photo",
        previewUrl: "https://r2.test/p1.jpg",
      }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Report this photo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This photo, and only this one"),
    ).toBeInTheDocument();
    const [child] = screen
      .getAllByRole("radio")
      .filter((r) => (r as HTMLInputElement).value === "child");
    fireEvent.click(child);
    await waitFor(() =>
      expect(
        document.querySelector("[data-report-instant-hide]")?.textContent,
      ).toBe(instantHideLine("item", true)),
    );
    fireEvent.change(screen.getByLabelText(/reason/i), {
      target: { value: "  not ok  " },
    });
    fireEvent.click(submit());
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(sentBody()).toEqual({
      qr_token: "tok-1",
      media_id: "0a8b3c2d-1e4f-4a6b-8c9d-0e1f2a3b4c5d",
      kind: "child",
      reason: "not ok",
    });
  });
});

describe("the confirm (`proof=confirm`)", () => {
  it("★ hands over to the door's own code, and comes back with the address it keeps, masked", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Confirm your email" }));
    expect(state.doorProps).toMatchObject({
      methods: { code: true },
      chrome: "none",
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify the code" }));
    expect(
      await screen.findByText(
        new RegExp(`We can write to ${maskEmail("mia@example.com")}`),
      ),
    ).toBeInTheDocument();
    expect(submit()).toBeInTheDocument();
  });
});

describe("what sending says", () => {
  it("says a hide in its toast, and the page catches up", async () => {
    respond(200, { ok: true, hid: true });
    await open();
    fireEvent.click(screen.getByLabelText(KIND_WORDS.other));
    fireEvent.click(submit());
    await waitFor(() =>
      expect(state.success).toHaveBeenCalledWith(
        "Thanks. It's hidden from everyone while we look.",
      ),
    );
    expect(state.refresh).toHaveBeenCalled();
  });

  it("says a refusal's own words", async () => {
    respond(429, {
      ok: false,
      message: "Too many reports from this network right now.",
    });
    await open();
    fireEvent.click(screen.getByLabelText(KIND_WORDS.other));
    fireEvent.click(submit());
    await waitFor(() =>
      expect(state.error).toHaveBeenCalledWith("Couldn't submit your report.", {
        description: "Too many reports from this network right now.",
      }),
    );
  });
});

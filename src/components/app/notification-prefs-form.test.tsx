/**
 * EMAIL PREFERENCES, AS HIS EMAILS ROUND LEFT IT: every switch governs a mail that sends. Event Pass
 * reminders is the renewal nudge's (its unsubscribe lands on this row by id), the three switches for
 * mail nothing sent are gone, and the marketing switch keeps its own action.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  update: vi.fn(async (..._: unknown[]) => ({ ok: true as const })),
  marketing: vi.fn(async (..._: unknown[]) => ({ ok: true as const })),
  toastError: vi.fn(),
}));

vi.mock("@/app/(app)/account/actions", () => ({
  updateNotificationPrefsAction: state.update,
  setMarketingEmailAction: state.marketing,
}));
vi.mock("sonner", () => ({ toast: { error: state.toastError } }));

const { NotificationPrefsForm } =
  await import("@/components/app/notification-prefs-form");
const { PASS_REMINDERS_ANCHOR } = await import("@/lib/email/links");

beforeEach(() => {
  state.update.mockClear();
  state.marketing.mockClear();
  state.toastError.mockClear();
});

function draw(notifyPassRenewal = true) {
  return render(
    <NotificationPrefsForm
      prefs={{ notifyPassRenewal, marketingOptIn: false }}
      onNewsletterList={false}
    />,
  );
}

describe("Email preferences", () => {
  it("draws only switches with a mail behind them", () => {
    draw();
    expect(screen.getAllByRole("switch")).toHaveLength(2);
    expect(
      screen.getByRole("switch", { name: /Event Pass reminders/ }),
    ).toBeChecked();
    expect(
      screen.getByRole("switch", { name: /Product news and occasional tips/ }),
    ).not.toBeChecked();
    for (const gone of [
      /An album you joined was shared/,
      /New uploads to your events/,
      /Someone followed you/,
    ]) {
      expect(screen.queryByText(gone)).toBeNull();
    }
  });

  it("the renewal nudge's unsubscribe lands on the reminders row", () => {
    const { container } = draw();
    const row = container.querySelector(`#${PASS_REMINDERS_ANCHOR}`);
    expect(row).not.toBeNull();
    expect(row).toHaveTextContent(/Event Pass reminders/);
    expect(row?.querySelector('[role="switch"]')).not.toBeNull();
  });

  it("turning reminders off saves exactly that switch", async () => {
    draw();
    await userEvent.click(
      screen.getByRole("switch", { name: /Event Pass reminders/ }),
    );
    await waitFor(() =>
      expect(state.update).toHaveBeenCalledWith({ notifyPassRenewal: false }),
    );
    // The saved value returns with the page's revalidation (the action's revalidatePath), which a
    // unit render has no server for; what reached the server is the whole claim here.
    expect(state.marketing).not.toHaveBeenCalled();
  });

  it("a failed save puts the switch back and says why", async () => {
    state.update.mockResolvedValueOnce({
      ok: false,
      message: "Couldn't save that. Please try again.",
    } as never);
    draw(false);
    const reminders = screen.getByRole("switch", {
      name: /Event Pass reminders/,
    });
    await userEvent.click(reminders);
    await waitFor(() =>
      expect(state.toastError).toHaveBeenCalledWith(
        "Couldn't save that. Please try again.",
      ),
    );
    expect(
      screen.getByRole("switch", { name: /Event Pass reminders/ }),
    ).not.toBeChecked();
  });
});

/**
 * THE WELCOME COMES FIRST (Will, 2026-09-24: "Doesn't everyone without a guest name (unverified
 * events) or confirmed email (verified events) get routed through the welcome flow? Then the
 * welcome flow approves the guest and drops them off on the event page").
 *
 * The door's half of it: EntryModal tells the page whether this visitor still owes it
 * (`onPendingChange`), and the page holds anything an address asks for until they are through
 * (the reel's half is pinned in reel/live-reel.test.tsx). A first-time guest owes it from the first
 * report on, never "clear" for a frame first; the owner never owes it; a guest who passes the last
 * step is through at once.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EntryModal } from "@/components/guest/entry-modal";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/components/auth/email-sign-in", () => ({
  EmailSignIn: () => <div data-testid="email-sign-in" />,
}));
vi.mock("@/lib/guest/claim-uploads", () => ({
  claimAnonymousUploads: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/app/(app)/account/actions", () => ({
  updateDisplayNameAction: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));
// The arrival beat only delays the auto-open (its own pins live beside it).
vi.mock("@/lib/guest/use-arrival-beat", async (orig) => ({
  ...(await orig<typeof import("@/lib/guest/use-arrival-beat")>()),
  useArrivalBeat: () => true,
}));

const QR = "pendingtoken1";

function renderDoor(
  props: Partial<React.ComponentProps<typeof EntryModal>> = {},
) {
  const onPendingChange = vi.fn();
  render(
    <EntryModal
      qrToken={QR}
      eventName="Test Wedding"
      access="full"
      gate={null}
      hasContributed={false}
      contributed={false}
      returning={false}
      uploadsOpen
      requireUpload={false}
      albumEmpty={false}
      isOwner={false}
      isDemo={false}
      isVerified={false}
      hasProfileName={false}
      queue={[]}
      onSend={vi.fn()}
      onRetry={vi.fn()}
      onDismissFailures={vi.fn()}
      onPendingChange={onPendingChange}
      {...props}
    />,
  );
  return onPendingChange;
}

beforeEach(() => {
  localStorage.clear();
});

describe("EntryModal tells the page whether the welcome is still owed", () => {
  it("a first-time guest owes it from the very first report (never 'clear' for a frame first)", () => {
    const onPendingChange = renderDoor();
    expect(onPendingChange).toHaveBeenCalled();
    expect(onPendingChange.mock.calls.every(([pending]) => pending === true)).toBe(
      true,
    );
  });

  it("the owner never owes it", () => {
    const onPendingChange = renderDoor({ isOwner: true });
    expect(onPendingChange).toHaveBeenCalled();
    expect(onPendingChange.mock.calls.every(([pending]) => pending === false)).toBe(
      true,
    );
  });

  it("a guest is through the moment the last step is behind them", async () => {
    // A named guest at an event taking no uploads: the welcome is the whole door.
    const onPendingChange = renderDoor({ storedName: "Theo", uploadsOpen: false });
    expect(onPendingChange).toHaveBeenLastCalledWith(true);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    });
    expect(onPendingChange).toHaveBeenLastCalledWith(false);
  });

  it("a returning guest with nothing owed is clear from the start", () => {
    localStorage.setItem(`pr_welcome_${QR}`, "1");
    const onPendingChange = renderDoor({ storedName: "Theo", uploadsOpen: false });
    expect(onPendingChange.mock.calls.every(([pending]) => pending === false)).toBe(
      true,
    );
  });
});

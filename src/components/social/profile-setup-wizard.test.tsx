import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { updateDisplayNameAction } from "@/app/(app)/account/actions";
import { finishProfileSetupAction } from "@/app/(app)/account/profile/actions";
import { checkProfileSlugAction } from "@/app/(app)/account/social-actions";
import type { AttendedEventPick } from "@/lib/db/queries/social";

import { ProfileSetupWizard } from "./profile-setup-wizard";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/app/(app)/account/actions", () => ({
  updateDisplayNameAction: vi.fn(),
}));
vi.mock("@/app/(app)/account/profile/actions", () => ({
  finishProfileSetupAction: vi.fn(),
}));
vi.mock("@/app/(app)/account/social-actions", () => ({
  checkProfileSlugAction: vi.fn(),
  showEventOnProfileAction: vi.fn(),
  hideEventFromProfileAction: vi.fn(),
}));
// The photo control is Account's own, tested where it lives; here it only has to be on screen two.
vi.mock("@/components/app/account-avatar-form", () => ({
  AccountAvatarForm: () => <div data-testid="avatar-form" />,
}));

/**
 * THE PAGE SETUP, SCREEN BY SCREEN (`identity-profile` r1, `setup=wizard` and `default=off`):
 *   ★ screen one only CHECKS the handle (Continue waits for "available"); nothing is claimed until
 *     Finish, so an abandoned setup leaves no page;
 *   ★ screen two saves a changed name as her account's, and an unchanged one costs nothing;
 *   ★ screen three opens every event private with Keep all private pressed, Show all one tap away,
 *     and a tap on a cover choosing one by one; Finish sends the choice as a MODE (or the ids);
 *   ★ a handle taken since screen one sends her back there, marked taken without asking again.
 */

const EVENTS: AttendedEventPick[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Maya & Jay",
    shownOnProfile: false,
    coverUrl: "https://r2.example/a.webp",
    locked: false,
    albumOpen: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Tara's 30th",
    shownOnProfile: false,
    coverUrl: null,
    locked: false,
    albumOpen: true,
  },
];

function renderWizard(
  overrides: Partial<Parameters<typeof ProfileSetupWizard>[0]> = {},
) {
  return render(
    <ProfileSetupWizard
      siteUrl="https://partyreel.com"
      suggestedHandle="priya"
      displayName="Priya"
      email="priya@example.com"
      avatarUrl={null}
      seed="seed"
      events={EVENTS}
      hostsEvents={false}
      {...overrides}
    />,
  );
}

async function passScreenOne() {
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /Continue/ })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
}

async function passScreenTwo() {
  fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
  await screen.findByText("Choose what shows");
}

beforeEach(() => {
  router.push.mockReset();
  router.refresh.mockReset();
  vi.mocked(checkProfileSlugAction).mockReset();
  vi.mocked(checkProfileSlugAction).mockResolvedValue({ available: true });
  vi.mocked(updateDisplayNameAction).mockReset();
  vi.mocked(updateDisplayNameAction).mockResolvedValue({ ok: true });
  vi.mocked(finishProfileSetupAction).mockReset();
  vi.mocked(finishProfileSetupAction).mockResolvedValue({
    ok: true,
    slug: "priya",
  });
});

describe("screen one: the handle is checked, never claimed", () => {
  it("opens on the suggested handle and waits for the check before Continue", async () => {
    renderWizard();
    expect(screen.getByLabelText("Profile handle")).toHaveValue("priya");
    expect(screen.getByRole("button", { name: /Continue/ })).toBeDisabled();
    await waitFor(() =>
      expect(
        screen.getByText("partyreel.com/u/priya is available."),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /Continue/ })).toBeEnabled();
    expect(checkProfileSlugAction).toHaveBeenCalledWith("priya");
    expect(finishProfileSetupAction).not.toHaveBeenCalled();
  });

  it("a taken handle keeps her here, and says so", async () => {
    vi.mocked(checkProfileSlugAction).mockResolvedValue({ available: false });
    renderWizard();
    await screen.findByText("That handle is taken. Try another.");
    expect(screen.getByRole("button", { name: /Continue/ })).toBeDisabled();
  });

  it("an empty suggestion opens on the rules, with Continue waiting", () => {
    renderWizard({ suggestedHandle: "" });
    expect(
      screen.getByText(/Lowercase letters, numbers, and hyphens/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue/ })).toBeDisabled();
  });
});

describe("screen two: the name and photo are her account's", () => {
  it("an unchanged name moves on without a save", async () => {
    renderWizard();
    await passScreenOne();
    expect(screen.getByTestId("avatar-form")).toBeInTheDocument();
    await passScreenTwo();
    expect(updateDisplayNameAction).not.toHaveBeenCalled();
  });

  it("a changed name saves before moving on", async () => {
    renderWizard();
    await passScreenOne();
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Priya P." },
    });
    await passScreenTwo();
    expect(updateDisplayNameAction).toHaveBeenCalledWith("Priya P.");
  });

  it("a refused name keeps her on the screen, told why", async () => {
    vi.mocked(updateDisplayNameAction).mockResolvedValue({
      ok: false,
      code: "validation",
      message: "Please choose a different name.",
    });
    renderWizard();
    await passScreenOne();
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "nope" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Please choose a different name.",
      ),
    );
    expect(screen.queryByText("Choose what shows")).not.toBeInTheDocument();
  });
});

describe("screen three: the one-time choice", () => {
  async function toScreenThree(
    overrides: Partial<Parameters<typeof ProfileSetupWizard>[0]> = {},
  ) {
    renderWizard(overrides);
    await passScreenOne();
    await passScreenTwo();
  }

  const tiles = () =>
    screen
      .getAllByRole("button", { name: /^Show .* on my page$/ })
      .map((t) => t.getAttribute("aria-pressed"));

  it("opens every event private, Keep all private pressed", async () => {
    await toScreenThree();
    expect(tiles()).toEqual(["false", "false"]);
    expect(
      screen.getByRole("radio", { name: "Keep all private" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("Show all lifts every cover, and Finish sends it as a mode", async () => {
    await toScreenThree();
    fireEvent.click(screen.getByRole("radio", { name: /Show all 2/ }));
    expect(tiles()).toEqual(["true", "true"]);
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    await waitFor(() =>
      expect(finishProfileSetupAction).toHaveBeenCalledWith({
        slug: "priya",
        events: { mode: "all" },
      }),
    );
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/u/priya"));
    expect(toast.success).toHaveBeenCalledWith("Your page is live.");
  });

  it("a tap on one cover chooses one by one: neither bulk choice stays pressed", async () => {
    await toScreenThree();
    fireEvent.click(
      screen.getByRole("button", { name: "Show Tara's 30th on my page" }),
    );
    expect(tiles()).toEqual(["false", "true"]);
    expect(
      screen.getByRole("radio", { name: "Keep all private" }),
    ).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: /Show all/ })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    await waitFor(() =>
      expect(finishProfileSetupAction).toHaveBeenCalledWith({
        slug: "priya",
        events: {
          mode: "chosen",
          eventIds: ["22222222-2222-4222-8222-222222222222"],
        },
      }),
    );
  });

  it("finishing with nothing chosen keeps everything private", async () => {
    await toScreenThree();
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    await waitFor(() =>
      expect(finishProfileSetupAction).toHaveBeenCalledWith({
        slug: "priya",
        events: { mode: "none" },
      }),
    );
  });

  it("with no events yet, says where they will come from", async () => {
    await toScreenThree({ events: [] });
    expect(
      screen.getByText(/Events you add photos to will be here/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("tells a host where her own events' switch lives", async () => {
    await toScreenThree({ hostsEvents: true });
    expect(screen.getByText(/Show on my profile/)).toBeInTheDocument();
  });
});

describe("Finish meets a handle taken since screen one", () => {
  it("goes back to screen one with the handle marked taken, asking nothing again", async () => {
    vi.mocked(finishProfileSetupAction).mockResolvedValue({
      ok: false,
      step: "handle",
      message: "That handle is already taken.",
      taken: true,
    });
    renderWizard();
    await passScreenOne();
    await passScreenTwo();
    const checks = vi.mocked(checkProfileSlugAction).mock.calls.length;

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    });

    await screen.findByText("Claim your page");
    expect(
      screen.getByText("That handle is taken. Try another."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue/ })).toBeDisabled();
    expect(vi.mocked(checkProfileSlugAction).mock.calls.length).toBe(checks);
    expect(router.push).not.toHaveBeenCalled();
  });

  it("a page finished in another tab sends her to its choices", async () => {
    vi.mocked(finishProfileSetupAction).mockResolvedValue({
      ok: false,
      step: "done",
      message: "Your page is already set up.",
    });
    renderWizard();
    await passScreenOne();
    await passScreenTwo();
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/account#public-profile"),
    );
  });
});

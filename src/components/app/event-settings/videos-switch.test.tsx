/**
 * THE VIDEOS SWITCH NAMES A GUEST'S VIDEO A VIDEO (crumbs-28, from the Orchestrator's relay). A video upload is
 * never a "clip" in product copy: "clip" is the reel's word, for the one anyone makes from the highlight reel
 * (reel.md, "The names are Will's"). The line said "Guests add clips as well as photos."
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/reel/defaults-action", () => ({ setReelDefaults: vi.fn() }));
vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: vi.fn(),
  updateEventSocialSettingsAction: vi.fn(),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  setEventDoorAction: vi.fn(),
}));
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: () => null,
}));

const { VideosSwitch } = await import("./videos-switch");
const { SettingsProvider } = await import("./settings-state");
const { hostEvent, NO_COUNTS } = await import("./testing/host-event");

function mount(tier: "pro" | "free") {
  return render(
    <SettingsProvider
      event={hostEvent()}
      tier={tier}
      counts={NO_COUNTS}
      pendingCount={0}
      social={null}
      reelSample={null}
      writes={
        {
          updateEvent: vi.fn(async () => ({ ok: true as const })),
          setDoor: vi.fn(),
          setReel: vi.fn(),
          setProfile: vi.fn(),
        } as never
      }
    >
      <VideosSwitch />
    </SettingsProvider>,
  );
}

describe("the Videos switch", () => {
  it("★ says what a guest adds is a video, never a clip (the reel's word)", () => {
    const { container } = mount("pro");
    expect(
      screen.getByText("Guests add videos as well as photos."),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\bclips?\b/i);
  });

  it("says no clip on Free either, where it is the lock", () => {
    const { container } = mount("free");
    expect(container.textContent).not.toMatch(/\bclips?\b/i);
  });
});

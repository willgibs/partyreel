/**
 * "STRAIGHT INTO THE ALBUM" NAMES THE WAIT IT WOULD PUBLISH, AS IT STANDS NOW (crumbs-93, red-team 58's LOW).
 *
 * Settings > Where what guests add goes > "Straight into the album" publishes every photograph waiting in Review the instant
 * it is picked. Its note ("The 3 photos under review appear at once") read the count the page loaded with, so photographs
 * that reached Review after the sheet opened were published with no word: the hub's Review door beside it said "1 waiting"
 * while the picker said "Everyone sees it the moment it lands". The sheet now reads the count the album's live store keeps
 * for that door (`useHubCounts`), and its prop only where no album store stands. The words are the row's; the count is
 * pinned here through a store stood in (`host-album` holds the store's own pins).
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { refresh, toast, album } = vi.hoisted(() => ({
  refresh: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  // The hub's album store as a recorder: no counts where no store stands, else the counts its door shows.
  album: {
    stands: true,
    counts: { album: 9, pending: 0 } as { album: number; pending: number },
  },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/reel/defaults-action", () => ({ setReelDefaults: vi.fn() }));
vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: vi.fn(),
  updateEventSocialSettingsAction: vi.fn(),
  deleteEventAction: vi.fn(),
  setEventPasswordAction: vi.fn(),
  clearEventPasswordAction: vi.fn(),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  setEventDoorAction: vi.fn(),
}));
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: () => null,
}));
// Only the counts are stood in: the rest of the sheet reads the real store hooks, which answer null with no provider.
vi.mock("@/components/app/event-feed/host-album", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/components/app/event-feed/host-album")
  >()),
  useHubCounts: () => (album.stands ? album.counts : null),
}));

const { EventSettingsSheet } = await import("./event-settings-sheet");
const { hostEvent, NO_COUNTS, readyFacts } =
  await import("./testing/host-event");

function sheet(pendingCount: number, event = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    page: null,
    onOpenPage: vi.fn(),
    onClosePage: vi.fn(),
    event: hostEvent({ moderation_mode: "hold_for_approval", ...event }),
    tier: "pro" as const,
    counts: NO_COUNTS,
    pendingCount,
    social: { displayInProfile: false, hostHasSlug: true },
    reelSample: null,
    ready: readyFacts(),
  };
  const view = render(<EventSettingsSheet {...props} />);
  return {
    ...view,
    again: () => view.rerender(<EventSettingsSheet {...props} />),
  };
}

/** The picker's "Straight into the album" line, as the menu says it before it is chosen. */
function straightInto() {
  // The live word in the "What guests can add" sentence: "... held until you approve them".
  fireEvent.click(
    screen.getByRole("button", { name: /held until you approve them/ }),
  );
  const menu = screen.getByRole("menu");
  return within(menu).getByRole("menuitem", {
    name: /Straight into the album/,
  });
}

describe("the picker's note on 'Straight into the album'", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    album.stands = true;
    album.counts = { album: 9, pending: 0 };
  });

  it("★ names the wait the album holds NOW, not the page load's: photographs that reached Review after the sheet opened", () => {
    // The page loaded with nothing waiting; two photographs have landed since.
    album.counts = { album: 11, pending: 2 };
    sheet(0);
    expect(straightInto()).toHaveTextContent(
      "The 2 photos under review appear at once.",
    );
  });

  it("follows the album while the sheet stays open: the count it reads when she looks is the count that is there", () => {
    const s = sheet(0);
    s.unmount();
    album.counts = { album: 10, pending: 1 };
    const again = sheet(0);
    expect(straightInto()).toHaveTextContent(
      "The 1 photo under review appears at once.",
    );
    again.unmount();
    album.counts = { album: 13, pending: 4 };
    sheet(0);
    expect(straightInto()).toHaveTextContent(
      "The 4 photos under review appear at once.",
    );
  });

  it("says the plain line only where nothing waits", () => {
    sheet(0);
    expect(straightInto()).toHaveTextContent(
      "Everyone sees it the moment it lands.",
    );
  });

  it("reads the page's own count where no album store stands (a sheet opened away from the hub)", () => {
    album.stands = false;
    sheet(3);
    expect(straightInto()).toHaveTextContent(
      "The 3 photos under review appear at once.",
    );
  });

  it("★ the live count wins over a stale prop that still says something waits", () => {
    // Every photograph was decided meanwhile: the album's count is the truth, the prop is the first paint's.
    album.counts = { album: 9, pending: 0 };
    sheet(5);
    expect(straightInto()).toHaveTextContent(
      "Everyone sees it the moment it lands.",
    );
  });
});

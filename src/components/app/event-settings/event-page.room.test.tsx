/**
 * THE ROOM THE EVENT PAGE OPENS IN NEVER POINTS A SCREEN READER AT A DESCRIPTION IT HAS NOT GOT (crumbs-59, red-team 47's
 * NIT: every hub room load logged Radix's "Missing `Description` or `aria-describedby={undefined}` for {DialogContent}",
 * partyreel.com's too).
 *
 * Settings' panel is one dialog whose head changes as a page opens: its rows' head says the event's name under "Settings"
 * (the dialog's description), and a page's head (This event, the door, what guests can add, the reel) says only its title
 * under a back arrow. Radix points the dialog at its description whether or not one is drawn, so a panel that MOUNTED at
 * a page (`?room=settings&setting=event`, a link, a reload) warned at once, and one that moved onto a page left its
 * `aria-describedby` on an element that had just gone. The page's head names no description, so it says so (an explicit
 * `aria-describedby={undefined}`, as every popup without one does) and the rows' head keeps the one it has.
 */
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { refresh, toast, updateEventAction, setEventDoorAction } = vi.hoisted(
  () => ({
    refresh: vi.fn(),
    toast: { success: vi.fn(), error: vi.fn() },
    updateEventAction: vi.fn(),
    setEventDoorAction: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/reel/defaults-action", () => ({ setReelDefaults: vi.fn() }));
vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: (...a: unknown[]) => updateEventAction(...a),
  updateEventSocialSettingsAction: vi.fn(),
  deleteEventAction: vi.fn(),
  setEventPasswordAction: vi.fn(),
  clearEventPasswordAction: vi.fn(),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  setEventDoorAction: (...a: unknown[]) => setEventDoorAction(...a),
}));
// The plans sheet reads the server; the lock only has to open it.
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: () => null,
}));

const { EventSettingsSheet } = await import("./event-settings-sheet");
const { hostEvent, NO_COUNTS, readyFacts } =
  await import("./testing/host-event");

type Page = "door" | "adds" | "reel" | "event" | null;

function sheet(page: Page) {
  return (
    <EventSettingsSheet
      open
      onOpenChange={() => {}}
      page={page}
      onOpenPage={() => {}}
      onClosePage={() => {}}
      event={hostEvent()}
      tier="pro"
      counts={NO_COUNTS}
      pendingCount={0}
      social={{ displayInProfile: false, hostHasSlug: true }}
      reelSample={null}
      ready={readyFacts()}
      onOpenCode={() => {}}
    />
  );
}

/** The warnings Radix gives a dialog it finds no description for. */
const missingDescription = (calls: unknown[][]) =>
  calls
    .map((c) => String(c[0]))
    .filter((m) => m.includes("Missing `Description`"));

/** What the dialog's `aria-describedby` points at: nothing, or an element that is on the page. */
function describedByResolves() {
  const dialog = document.querySelector('[role="dialog"]');
  expect(dialog, "the panel").not.toBeNull();
  const id = dialog!.getAttribute("aria-describedby");
  return id === null || document.getElementById(id) !== null;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Settings' panel, at the rows and at each page", () => {
  it("★ opens at the rows with its description, and at any page with none to point at, warning nothing", async () => {
    for (const page of [null, "door", "adds", "reel", "event"] as const) {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(sheet(page));
      await new Promise((r) => setTimeout(r, 30));
      expect(missingDescription(warn.mock.calls), String(page)).toEqual([]);
      expect(describedByResolves(), String(page)).toBe(true);
      warn.mockRestore();
      cleanup();
    }
  });

  it("★ leaves no dangling description when it moves onto a page, and has it back at the rows", async () => {
    const view = render(sheet(null));
    await new Promise((r) => setTimeout(r, 30));
    const dialog = document.querySelector('[role="dialog"]')!;
    // At the rows the event's name is the description.
    expect(dialog.getAttribute("aria-describedby")).not.toBeNull();
    expect(describedByResolves()).toBe(true);
    view.rerender(sheet("event"));
    expect(describedByResolves()).toBe(true);
    expect(dialog.getAttribute("aria-describedby")).toBeNull();
    view.rerender(sheet(null));
    expect(dialog.getAttribute("aria-describedby")).not.toBeNull();
    expect(describedByResolves()).toBe(true);
  });
});

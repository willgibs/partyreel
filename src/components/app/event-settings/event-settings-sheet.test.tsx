/**
 * SETTINGS, REBUILT (event-settings r1): four rows at rest, each a sentence with its live words; a page
 * per row under a back arrow; Delete a quiet row at the foot; every control saving itself.
 *
 * What is pinned is the frame and the rules that fail silently, never a word: the body is never a flex
 * column that shrinks a card (build 17's red-team: the cards past the first were crushed to their
 * padding and Delete could not be reached); a live word changes its setting in place, sending that one
 * field and nothing else (the retired form's scar: its one Save sent every field it held, a custom QR
 * style among them); a row opens its page and the back arrow comes up again; and nothing guards the
 * close, since nothing waits on a save. jsdom lays nothing out, so the picture is the Handoff's.
 */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  PricingSheet: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Plans" /> : null,
}));

const { EventSettingsSheet } = await import("./event-settings-sheet");
const { hostEvent, NO_COUNTS } = await import("./testing/host-event");

type Page = "door" | "adds" | "reel" | "event";

function sheet(
  opts: {
    page?: Page | null;
    tier?: "free" | "event_pass" | "pro";
    event?: Parameters<typeof hostEvent>[0];
  } = {},
) {
  const onOpenPage = vi.fn();
  const onClosePage = vi.fn();
  const onOpenChange = vi.fn();
  const view = render(
    <EventSettingsSheet
      open
      onOpenChange={onOpenChange}
      page={opts.page ?? null}
      onOpenPage={onOpenPage}
      onClosePage={onClosePage}
      event={hostEvent(opts.event)}
      tier={opts.tier ?? "pro"}
      counts={NO_COUNTS}
      pendingCount={0}
      social={{ displayInProfile: false, hostHasSlug: true }}
      reelSample={null}
    />,
  );
  const body = document.querySelector<HTMLElement>('[data-slot="popup-body"]');
  expect(body, "the sheet's body").not.toBeNull();
  return { body: body!, onOpenPage, onClosePage, onOpenChange, ...view };
}

/** Does this element lay its children out as a flex column that lets them shrink? */
function shrinksItsChildren(el: HTMLElement): boolean {
  const classes = el.className.split(/\s+/);
  const column =
    classes.includes("flex") &&
    (classes.includes("flex-col") || classes.includes("flex-col-reverse"));
  return column && !classes.includes("*:shrink-0");
}

beforeEach(() => {
  vi.clearAllMocks();
  updateEventAction.mockResolvedValue({ ok: true });
  setEventDoorAction.mockResolvedValue({
    ok: true,
    emailHeld: false,
    admitted: 0,
  });
});

describe("at rest: four rows and a quiet foot", () => {
  it("★ never lets its scroller shrink a card to fit, at rest or on a page", () => {
    expect(shrinksItsChildren(sheet().body)).toBe(false);
    for (const page of ["door", "adds", "reel", "event"] as const) {
      cleanup();
      expect(shrinksItsChildren(sheet({ page }).body)).toBe(false);
    }
  });

  it("stands the four rows in the order a guest meets them, Delete last", () => {
    const { body } = sheet();
    const rows = [
      ...body.querySelectorAll<HTMLElement>("[data-settings-row]"),
    ].map((r) => r.dataset.settingsRow);
    expect(rows).toEqual(["door", "adds", "reel", "event"]);
    const last = body.lastElementChild?.lastElementChild;
    expect(last?.hasAttribute("data-settings-delete")).toBe(true);
  });

  it("says where each group stands, in its own sentence", () => {
    sheet();
    const door = document.querySelector(
      "[data-settings-row='door'] [data-settings-sentence]",
    );
    expect(door?.textContent).toBe(
      "Anyone with the link, after confirming an email.",
    );
    const adds = document.querySelector(
      "[data-settings-row='adds'] [data-settings-sentence]",
    );
    expect(adds?.textContent).toBe(
      "Photos and videos, straight into the album.",
    );
  });

  it("a row opens its page; its live words do not", () => {
    const { onOpenPage } = sheet();
    fireEvent.click(screen.getByRole("button", { name: "Who can get in" }));
    expect(onOpenPage).toHaveBeenCalledWith("door");
    onOpenPage.mockClear();
    fireEvent.click(
      screen.getByRole("button", { name: "Anyone with the link" }),
    );
    expect(onOpenPage).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeTruthy();
  });
});

describe("a live word changes its setting in place", () => {
  it("★ sends the one field it names, and nothing else (a custom QR never rides a save)", async () => {
    sheet({ event: { qr_style: "dots" } });
    fireEvent.click(
      screen.getByRole("button", { name: "straight into the album" }),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("menuitem", { name: /To you first/ }));
    });
    expect(updateEventAction).toHaveBeenCalledTimes(1);
    expect(updateEventAction).toHaveBeenCalledWith(
      "11111111-2222-4333-8444-555555555555",
      { moderation_mode: "hold_for_approval" },
    );
    // The sentence says it at once, before the row it wrote comes back.
    expect(
      document.querySelector(
        "[data-settings-row='adds'] [data-settings-sentence]",
      )?.textContent,
    ).toBe("Photos and videos, held until you approve them.");
  });

  it("the door word sets the door through its own write", async () => {
    sheet();
    fireEvent.click(
      screen.getByRole("button", { name: "Anyone with the link" }),
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("menuitem", {
          name: /Private: only people already in/,
        }),
      );
    });
    expect(setEventDoorAction).toHaveBeenCalledWith(
      "11111111-2222-4333-8444-555555555555",
      "closed",
    );
    expect(updateEventAction).not.toHaveBeenCalled();
  });

  it("a password with none set opens the door's page to set one, and writes nothing", async () => {
    const { onOpenPage } = sheet();
    fireEvent.click(
      screen.getByRole("button", { name: "Anyone with the link" }),
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("menuitem", { name: /Private: a password/ }),
      );
    });
    expect(onOpenPage).toHaveBeenCalledWith("door");
    expect(setEventDoorAction).not.toHaveBeenCalled();
  });

  it("a refused save is put back, with a sentence", async () => {
    updateEventAction.mockResolvedValue({
      ok: false,
      code: "unknown",
      message: "That didn't save.",
    });
    sheet();
    fireEvent.click(screen.getByRole("button", { name: "Photos and videos" }));
    await act(async () => {
      fireEvent.click(
        screen.getByRole("menuitem", { name: /Nothing, for now/ }),
      );
    });
    expect(
      document.querySelector(
        "[data-settings-row='adds'] [data-settings-sentence]",
      )?.textContent,
    ).toBe("Photos and videos, straight into the album.");
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't save that setting.",
      expect.objectContaining({ description: "That didn't save." }),
    );
  });
});

describe("a page, one level in", () => {
  it("wears its group's title, and its back arrow goes up to the four rows", () => {
    const { onClosePage, onOpenChange } = sheet({ page: "adds" });
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "What guests can add" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(onClosePage).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("★ closes from any page at once: nothing waits on a save, so nothing asks", () => {
    const { onOpenChange } = sheet({ page: "event" });
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByText(/Discard changes/)).toBeNull();
  });
});

describe("videos, the one lock", () => {
  it("★ on Free, the switch is drawn off and opens the plans; it writes nothing", () => {
    sheet({ page: "adds", tier: "free" });
    const lock = screen.getByRole("button", {
      name: /Videos, on Pro\. See plans\./,
    });
    fireEvent.click(lock);
    expect(screen.getByRole("dialog", { name: "Plans" })).toBeTruthy();
    expect(updateEventAction).not.toHaveBeenCalled();
  });

  it("on a plan with video, it is a switch that keeps an album to photos", async () => {
    sheet({ page: "adds", tier: "pro" });
    await act(async () => {
      fireEvent.click(screen.getByRole("switch", { name: /Videos/ }));
    });
    expect(updateEventAction).toHaveBeenCalledWith(
      "11111111-2222-4333-8444-555555555555",
      { allow_videos: false },
    );
  });
});

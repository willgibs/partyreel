/**
 * SETTINGS, REBUILT (event-settings r1): four rows at rest, each a sentence with its live words; a page
 * per row under a back arrow; Delete a quiet row at the foot; every control saving itself. Since
 * event-ready r1 (`guide=steps`), the rows are steps, ticked once ready, the code the fifth, and every
 * page ends in Next.
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
  waitFor,
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
const { ROLL_REST_MS } = await import("./camera-settings");
const { hostEvent, NO_COUNTS, readyFacts } =
  await import("./testing/host-event");

type Page = "door" | "adds" | "reel" | "event";

function sheet(
  opts: {
    page?: Page | null;
    tier?: "free" | "event_pass" | "pro";
    event?: Parameters<typeof hostEvent>[0];
    ready?: Parameters<typeof readyFacts>[0];
  } = {},
) {
  const onOpenPage = vi.fn();
  const onClosePage = vi.fn();
  const onOpenChange = vi.fn();
  const onOpenCode = vi.fn();
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
      ready={readyFacts(opts.ready)}
      onOpenCode={onOpenCode}
    />,
  );
  const body = document.querySelector<HTMLElement>('[data-slot="popup-body"]');
  expect(body, "the sheet's body").not.toBeNull();
  return {
    body: body!,
    onOpenPage,
    onClosePage,
    onOpenChange,
    onOpenCode,
    ...view,
  };
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

describe("at rest: five steps and a quiet foot", () => {
  it("★ never lets its scroller shrink a card to fit, at rest or on a page", () => {
    expect(shrinksItsChildren(sheet().body)).toBe(false);
    for (const page of ["door", "adds", "reel", "event"] as const) {
      cleanup();
      expect(shrinksItsChildren(sheet({ page }).body)).toBe(false);
    }
  });

  // ★ RESHAPED ON PURPOSE (event-ready `guide=steps`): four rows in a guest's order became five steps,
  // the code the fifth; the order and Delete's place at the foot are what still hold.
  it("stands the steps in the order a guest meets them, the code fifth, Delete last", () => {
    const { body } = sheet();
    const rows = [
      ...body.querySelectorAll<HTMLElement>("[data-settings-row]"),
    ].map((r) => r.dataset.settingsRow);
    expect(rows).toEqual(["door", "adds", "reel", "event", "code"]);
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

  // ★ A WRITE THAT THROWS IS A REFUSAL TOO (crumbs-81). A dropped connection rejects the call instead of answering it,
  // and `run` had no catch: the row stayed busy for good and the value she never saved stayed on the page. Every write
  // here settles one way, so a throw is put back, freed and said exactly as a refusal is.
  it("★ a save that throws (a dropped connection) is put back, its row freed, and says it did not save", async () => {
    updateEventAction.mockRejectedValue(new TypeError("Failed to fetch"));
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
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't save that setting.",
      expect.objectContaining({
        description: "Check your connection and try again.",
      }),
    );
    // Free again: the word is not busy, and the next try goes out as any first one does.
    const word = screen.getByRole("button", { name: "Photos and videos" });
    expect(word).not.toHaveAttribute("aria-busy");
    updateEventAction.mockResolvedValue({ ok: true });
    fireEvent.click(word);
    await act(async () => {
      fireEvent.click(
        screen.getByRole("menuitem", { name: /Nothing, for now/ }),
      );
    });
    expect(updateEventAction).toHaveBeenCalledTimes(2);
    expect(toast.error).toHaveBeenCalledTimes(1);
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

  // ★ A PAGE'S HEAD IS DESCRIBED (crumbs-81, carrying crumbs-59's NIT on): the rows' head says the event's name under
  // "Settings", and a page's head said nothing of whose event it is, so a screen reader opened "What guests can add"
  // with no description at all (`aria-describedby` was set to undefined to quiet Radix's warning). The name rides as the
  // dialog's own description, out of sight, so a page reads as the rows do, and Radix's warning stays quiet because an
  // element it names exists.
  it("★ describes the dialog by the event's name on a page, out of sight, and warns of nothing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    sheet({ page: "adds" });
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleDescription("Maya's 30th");
    const describer = document.getElementById(
      dialog.getAttribute("aria-describedby") ?? "",
    );
    expect(describer, "the element the dialog names").not.toBeNull();
    expect(describer).toHaveClass("sr-only");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("describes the rows by the same name, drawn under Settings", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    sheet();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleDescription("Maya's 30th");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("★ is still described when a page is drawn at once, ahead of its address (a move held for a save)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    updateEventAction.mockImplementation(() => new Promise(() => {}));
    sheet({ tier: "pro" });
    fireEvent.click(screen.getByRole("button", { name: "Photos and videos" }));
    await act(async () => {
      fireEvent.click(
        screen.getByRole("menuitem", { name: /Nothing, for now/ }),
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "Who can get in" }));
    expect(
      document
        .querySelector("[data-settings-page]")
        ?.getAttribute("data-settings-page"),
    ).toBe("door");
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleDescription("Maya's 30th");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
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

/**
 * A SAVE AND THE PAGE MOVES AROUND IT (crumbs-42, from crumbs-24). Every save is a Server Action that
 * re-renders the hub in its answer, and a page move writes the address (`&setting=`): one written inside the
 * save's round trip made Next re-fetch the page once the save answered, and a second move inside that re-fetch
 * reloaded the page or dropped what the save brought (`lib/history-entry.ts`). So a move made while a save is
 * on its way is drawn at once and its address waits for the save to land, what it brought committed. jsdom has
 * no router, so what is pinned is WHEN the panel asks for the address, which is all the hazard turns on (the
 * commit is the save's transition's, measured against Next's router: `settings-state.tsx` says how).
 */
describe("a page move while a save is on its way", () => {
  /** A save that answers only when `land` is called. */
  function slowSave() {
    let land = () => {};
    updateEventAction.mockImplementation(
      () =>
        new Promise((resolve) => {
          land = () => resolve({ ok: true });
        }),
    );
    return { land: () => act(async () => land()) };
  }
  const shownPage = () =>
    document
      .querySelector("[data-settings-page]")
      ?.getAttribute("data-settings-page");
  /** A task later: the landed save's transition has committed, and its waiting moves are written. */
  const aTaskLater = () =>
    act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

  it("★ is drawn at once, and asks for its address only once the save has landed", async () => {
    const save = slowSave();
    const { onClosePage } = sheet({ page: "adds", tier: "pro" });
    await act(async () => {
      fireEvent.click(screen.getByRole("switch", { name: /Videos/ }));
    });
    expect(updateEventAction).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(shownPage()).toBe("rows");
    expect(onClosePage).not.toHaveBeenCalled();

    await save.land();
    await aTaskLater();
    expect(onClosePage).toHaveBeenCalledTimes(1);
  });

  it("writes one address for several moves inside one save: the newest", async () => {
    const save = slowSave();
    const { onOpenPage, onClosePage } = sheet({ page: "adds", tier: "pro" });
    await act(async () => {
      fireEvent.click(screen.getByRole("switch", { name: /Videos/ }));
    });
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Who can get in" }));
    expect(shownPage()).toBe("door");

    await save.land();
    await aTaskLater();
    expect(onOpenPage).toHaveBeenCalledTimes(1);
    expect(onOpenPage).toHaveBeenCalledWith("door");
    expect(onClosePage).not.toHaveBeenCalled();
  });

  it("asks for nothing when the moves come back to the page the address names", async () => {
    const save = slowSave();
    const { onOpenPage, onClosePage } = sheet({ page: "adds", tier: "pro" });
    await act(async () => {
      fireEvent.click(screen.getByRole("switch", { name: /Videos/ }));
    });
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(
      screen.getByRole("button", { name: "What guests can add" }),
    );
    expect(shownPage()).toBe("adds");

    await save.land();
    await aTaskLater();
    expect(onOpenPage).not.toHaveBeenCalled();
    expect(onClosePage).not.toHaveBeenCalled();
  });

  it("drops a move still waiting when the panel closes", async () => {
    const save = slowSave();
    const { onClosePage, onOpenChange } = sheet({ page: "adds", tier: "pro" });
    await act(async () => {
      fireEvent.click(screen.getByRole("switch", { name: /Videos/ }));
    });
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);

    await save.land();
    await aTaskLater();
    expect(onClosePage).not.toHaveBeenCalled();
  });

  it("with no save on its way, asks for its address at once, as ever", () => {
    const { onOpenPage } = sheet();
    fireEvent.click(screen.getByRole("button", { name: "Who can get in" }));
    expect(onOpenPage).toHaveBeenCalledWith("door");
  });
});

/**
 * SETTINGS AS STEPS (event-ready r1, `guide=steps`, Will 2026-10-02). What fails silently: a tick that
 * reads anything but the checklist's own function (Settings would call an event ready the hub does not), a
 * tick that waits for the row to come back after a choice, and a Next that leads nowhere. Not a word of
 * the steps is pinned but the code's door, whose words are the product's (every door onto the code card
 * reads Invite).
 */
describe("the steps", () => {
  const done = (group: string) =>
    document
      .querySelector(`[data-settings-row='${group}']`)
      ?.hasAttribute("data-done");
  const wants = (group: string) =>
    document.querySelector(
      `[data-settings-row='${group}'] [data-settings-wants]`,
    )?.textContent ?? null;

  it("★ ticks each step from the checklist's own facts, and says what an open one still wants", () => {
    sheet({
      event: { event_date: "2026-10-10", description: "Bring everything" },
      ready: { approved: 1, playable: 1 },
    });
    expect(done("door")).toBe(true);
    expect(done("adds")).toBe(true);
    // The reel's step is its first photos: one is in, and the reel starts at two.
    expect(done("reel")).toBe(false);
    expect(wants("reel")).toBeTruthy();
    expect(done("event")).toBe(true);
    expect(wants("event")).toBeNull();
    // Nobody has opened the code yet: its two doors stand under it.
    expect(done("code")).toBe(false);
    const code = document.querySelector<HTMLElement>(
      "[data-settings-row='code']",
    )!;
    expect(within(code).getByRole("button", { name: /invite/i })).toBeTruthy();
    expect(within(code).getByRole("link", { name: /print/i })).toHaveAttribute(
      "href",
      "/dashboard/11111111-2222-4333-8444-555555555555/print",
    );
    expect(
      document
        .querySelector("[data-settings-head]")
        ?.hasAttribute("data-ready"),
    ).toBe(false);
  });

  it("reads Settings' own values over the hub's, so a step ticks the moment its choice is made", async () => {
    sheet();
    expect(done("adds")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Photos and videos" }));
    await act(async () => {
      fireEvent.click(
        screen.getByRole("menuitem", { name: /Nothing, for now/ }),
      );
    });
    // Paused, before the row it wrote comes back: guests can no longer add.
    expect(done("adds")).toBe(false);
  });

  it("calls the event ready once the code has been opened, whatever is still worth doing", () => {
    sheet({ ready: { opened: 2 } });
    expect(done("code")).toBe(true);
    expect(
      document
        .querySelector("[data-settings-head]")
        ?.hasAttribute("data-ready"),
    ).toBe(true);
    // Still worth doing, never a gate: the reel's photos and the welcome stay unticked.
    expect(done("reel")).toBe(false);
    expect(done("event")).toBe(false);
  });

  it("leaves room to the hub: a full shelf never holds Settings' steps back", () => {
    sheet({ ready: { opened: 1, storagePct: 100 } });
    expect(document.querySelector("[data-settings-row='room']")).toBeNull();
    expect(
      document
        .querySelector("[data-settings-head]")
        ?.hasAttribute("data-ready"),
    ).toBe(true);
  });

  it("★ the code is the fifth step: its row and its Invite hand over to the code card", () => {
    const { onOpenCode, onOpenChange } = sheet();
    fireEvent.click(screen.getByRole("button", { name: "The code" }));
    expect(onOpenCode).toHaveBeenCalledTimes(1);
    const code = document.querySelector<HTMLElement>(
      "[data-settings-row='code']",
    )!;
    fireEvent.click(within(code).getByRole("button", { name: /invite/i }));
    expect(onOpenCode).toHaveBeenCalledTimes(2);
    // The sheet wires the close itself (the hub's sheets close Settings, then open the card).
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("every page ends in Next", () => {
  it("★ onto the next step's page, in the rail's order", () => {
    for (const [page, next] of [
      ["door", "adds"],
      ["adds", "reel"],
      ["reel", "event"],
    ] as const) {
      cleanup();
      const { onOpenPage, body } = sheet({ page });
      const button = body.querySelector<HTMLElement>("[data-settings-next]")!;
      expect(button.dataset.settingsNext).toBe(next);
      fireEvent.click(button);
      expect(onOpenPage).toHaveBeenCalledWith(next);
    }
  });

  it("and after the fourth onto the code, whose door is the code card", () => {
    const { onOpenCode, onOpenPage, body } = sheet({ page: "event" });
    const button = body.querySelector<HTMLElement>("[data-settings-next]")!;
    expect(button.dataset.settingsNext).toBe("code");
    fireEvent.click(button);
    expect(onOpenCode).toHaveBeenCalledTimes(1);
    expect(onOpenPage).not.toHaveBeenCalled();
  });

  it("is never drawn at rest: the steps are the way in", () => {
    const { body } = sheet();
    expect(body.querySelector("[data-settings-next]")).toBeNull();
  });
});

/**
 * ★ THE ROLL, A WORD ON THE FIRST SCREEN AND A WHOLE CONTROL ON ITS PAGE (customize r1: Will's `roll=both` and
 * `home=words`). The sentence's "24 shots" swaps film's three in place and sends the one field; Another number opens What
 * guests can add at the stepper, in focus; the page's boxes save at once and a run of steps once she rests; and her roll is
 * kept while the album takes free uploads, so the Disposable card still says it.
 */
describe("the roll: a live word, and its page's whole control", () => {
  const ID = "11111111-2222-4333-8444-555555555555";
  const ahead = () => new Date(Date.now() + 2 * 86_400_000).toISOString();
  const disposable = (roll: number | null = 24) =>
    ({
      capture: "camera",
      roll_size: roll,
      develops_at: ahead(),
    }) as Parameters<typeof hostEvent>[0];
  const sentence = () =>
    document.querySelector(
      "[data-settings-row='adds'] [data-settings-sentence]",
    )?.textContent;

  it("★ the camera's sentence says its roll as a word, and a film size picked there sends the roll alone", async () => {
    sheet({ event: disposable() });
    expect(sentence()).toBe(
      "Photos and videos on the album's camera, 24 shots each, hidden until the album develops.",
    );
    fireEvent.click(screen.getByRole("button", { name: "24 shots" }));
    const menu = screen.getByRole("menu");
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((m) => m.textContent),
    ).toEqual([
      "12 shotsFilm's short roll.",
      "24 shotsPartyreel's usual.",
      "36 shotsFilm's long roll.",
      "Another numberAny count from 1 to 99.",
    ]);
    await act(async () => {
      fireEvent.click(
        within(menu).getByRole("menuitem", { name: /^36 shots/ }),
      );
    });
    expect(updateEventAction).toHaveBeenCalledTimes(1);
    expect(updateEventAction).toHaveBeenCalledWith(ID, { roll_size: 36 });
    expect(sentence()).toContain("36 shots each");
  });

  it("a count that is none of film's three is offered as itself, chosen, beside them", () => {
    sheet({ event: disposable(50) });
    fireEvent.click(screen.getByRole("button", { name: "50 shots" }));
    const chosen = within(screen.getByRole("menu"))
      .getAllByRole("menuitem")
      .filter((m) => m.getAttribute("aria-current") === "true")
      .map((m) => m.textContent);
    expect(chosen).toEqual(["50 shots"]);
  });

  it("★ Another number opens What guests can add at the stepper, its count in focus, and writes nothing", async () => {
    const view = sheet({ event: disposable() });
    fireEvent.click(screen.getByRole("button", { name: "24 shots" }));
    await act(async () => {
      fireEvent.click(
        screen.getByRole("menuitem", { name: /^Another number/ }),
      );
    });
    expect(view.onOpenPage).toHaveBeenCalledWith("adds");
    expect(updateEventAction).not.toHaveBeenCalled();
    // The address answers with the page: it opens at the stepper.
    view.rerender(
      <EventSettingsSheet
        open
        onOpenChange={view.onOpenChange}
        page="adds"
        onOpenPage={view.onOpenPage}
        onClosePage={view.onClosePage}
        event={hostEvent(disposable())}
        tier="pro"
        counts={NO_COUNTS}
        pendingCount={0}
        social={{ displayInProfile: false, hostHasSlug: true }}
        reelSample={null}
        ready={readyFacts()}
        onOpenCode={view.onOpenCode}
      />,
    );
    expect(
      screen.getByRole("radio", { name: /another number of shots/i }),
    ).toHaveAttribute("aria-checked", "true");
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("spinbutton")),
    );
  });

  it("★ on its page a box saves at once; a run of steps is one save, sent once she rests", async () => {
    sheet({ page: "adds", event: disposable() });
    const group = screen.getByRole("radiogroup", { name: "Shots each" });
    await act(async () => {
      fireEvent.click(within(group).getByRole("radio", { name: "12 shots" }));
    });
    expect(updateEventAction).toHaveBeenLastCalledWith(ID, { roll_size: 12 });
    updateEventAction.mockClear();

    vi.useFakeTimers();
    try {
      fireEvent.click(
        within(group).getByRole("radio", { name: /another number/i }),
      );
      const more = screen.getByRole("button", { name: "More shots" });
      fireEvent.click(more);
      fireEvent.click(more);
      fireEvent.click(more);
      expect(screen.getByRole("spinbutton")).toHaveAttribute(
        "aria-valuenow",
        "15",
      );
      expect(updateEventAction).not.toHaveBeenCalled();
      await act(async () => {
        vi.advanceTimersByTime(ROLL_REST_MS);
      });
      expect(updateEventAction).toHaveBeenCalledTimes(1);
      expect(updateEventAction).toHaveBeenCalledWith(ID, { roll_size: 15 });
    } finally {
      vi.useRealTimers();
    }
  });

  it("★ a count still resting when the page goes is saved as it goes (the state outlives the panel)", async () => {
    const view = sheet({ page: "adds", event: disposable() });
    fireEvent.click(
      screen.getByRole("radio", { name: /another number of shots/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Fewer shots" }));
    expect(updateEventAction).not.toHaveBeenCalled();
    await act(async () => {
      view.unmount();
    });
    expect(updateEventAction).toHaveBeenCalledWith(ID, { roll_size: 23 });
  });

  it("★ her roll is kept while the album takes free uploads: no roll row, and the Disposable card says her count", () => {
    sheet({
      page: "adds",
      event: { capture: "upload", roll_size: 36 } as Parameters<
        typeof hostEvent
      >[0],
    });
    expect(screen.queryByRole("radiogroup", { name: "Shots each" })).toBeNull();
    expect(
      document.querySelector("[data-album-style='disposable']")?.textContent,
    ).toContain("The album's camera, 36 shots each.");
  });
});

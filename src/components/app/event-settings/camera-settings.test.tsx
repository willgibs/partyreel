/**
 * HOW GUESTS ADD, AND WHEN EVERYONE SEES WHAT'S ADDED (20261002200000): the mountable control's decisions. Each answer
 * is one save of both columns; a change that would show held or waiting photos asks first in its own line, and
 * nothing else asks; Develop now while a time waits; a develop time picked in her own zone, within reach.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { developTimeWords } from "@/lib/disposable/develop-words";
import { defaultDevelopAt } from "@/lib/disposable/reveal";

// The bound control's Settings state reaches the server's actions; the mountable one under test takes a save.
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

const { AlbumStyles, CaptureAndReveal } = await import("./camera-settings");

const NOW = new Date("2026-10-02T20:00:00Z");
const AHEAD = "2026-10-03T16:00:00.000Z";
const PAST = "2026-10-01T16:00:00.000Z";

type Value = Parameters<typeof CaptureAndReveal>[0]["value"];

function mount(value: Partial<Value> = {}, heldCount = 0) {
  const onSave = vi.fn();
  render(
    <CaptureAndReveal
      value={{ capture: "upload", review: false, developsAt: null, ...value }}
      rollSize={null}
      eventDate={null}
      heldCount={heldCount}
      savingCapture={false}
      savingReveal={false}
      onSave={onSave}
    />,
  );
  return onSave;
}

const radio = (name: string) => screen.getByRole("radio", { name });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("how guests add", () => {
  it("free uploads or the album's camera, the roll said; a choice saves the capture alone", () => {
    const onSave = mount();
    expect(radio("Free uploads")).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByText(
        "A roll of 24 shots each. Removing one frees its frame.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(radio("The album's camera"));
    expect(onSave).toHaveBeenCalledWith({ capture: "camera" });
    // Choosing what is already chosen saves nothing.
    fireEvent.click(radio("Free uploads"));
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

describe("when everyone sees what's added: one choice of three", () => {
  it("reads the two columns as one answer", () => {
    mount({ review: true });
    expect(radio("Once you approve each")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("★ each answer is one save of both columns; nothing held, nothing asks", () => {
    const onSave = mount();
    fireEvent.click(radio("Once you approve each"));
    expect(onSave).toHaveBeenLastCalledWith({ review: true, developsAt: null });
    fireEvent.click(radio("At a develop time"));
    expect(onSave).toHaveBeenLastCalledWith({
      review: false,
      developsAt: defaultDevelopAt({ eventDate: null }).toISOString(),
    });
  });

  it("★ leaving approval with photos held asks first, and says what happens to them", () => {
    const onSave = mount({ review: true }, 2);
    fireEvent.click(radio("Right away"));
    expect(onSave).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "2 photos under review are approved and show to everyone now.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keep it as it is" }));
    expect(onSave).not.toHaveBeenCalled();

    // RESHAPED (the-wait r1, settled with Will the night of build 45): into a develop time the held photos "join the
    // roll", approved and sealed, developing with everyone's; the line said "approved, and everyone sees them at the
    // develop" under "Approve them for the develop". The scar kept: it asks first, and says what happens to them.
    fireEvent.click(radio("At a develop time"));
    expect(
      screen.getByText(
        "2 photos under review join the roll: approved, they develop with everyone's.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Add them to the roll" }),
    );
    expect(onSave).toHaveBeenCalledWith({
      review: false,
      developsAt: defaultDevelopAt({ eventDate: null }).toISOString(),
    });
  });

  it("★ leaving a waiting develop asks first: every photo added so far shows at once", () => {
    const onSave = mount({ developsAt: AHEAD });
    expect(radio("At a develop time")).toHaveAttribute("aria-checked", "true");
    fireEvent.click(radio("Once you approve each"));
    expect(onSave).not.toHaveBeenCalled();
    expect(
      screen.getByText("Every photo added so far shows now, to every guest."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show them now" }));
    expect(onSave).toHaveBeenCalledWith({ review: true, developsAt: null });
  });

  it("Develop now, while a time waits, asks first and saves now", () => {
    const onSave = mount({ developsAt: AHEAD });
    fireEvent.click(screen.getByRole("button", { name: "Develop now" }));
    expect(onSave).not.toHaveBeenCalled();
    const confirm = screen
      .getAllByRole("button", { name: "Develop now" })
      .at(-1)!;
    fireEvent.click(confirm);
    expect(onSave).toHaveBeenCalledWith({ developsAt: NOW.toISOString() });
  });

  it("no Develop now once developed, and the time says so", () => {
    mount({ developsAt: PAST });
    expect(screen.queryByRole("button", { name: "Develop now" })).toBeNull();
    expect(
      screen.getByText(
        `Developed ${developTimeWords(PAST)}. New ones show straight away.`,
      ),
    ).toBeInTheDocument();
  });

  it("says the time as the guest's own tracker does: one formatter (`develop-words`) for both sides", () => {
    mount({ developsAt: AHEAD });
    expect(
      screen.getByText(`Develops ${developTimeWords(AHEAD)}.`),
    ).toBeInTheDocument();
  });

  it("a develop time picked in her own zone saves when she leaves the field; one out of reach saves nothing", () => {
    const onSave = mount({ developsAt: AHEAD });
    const field = screen.getByLabelText("Develop time");
    fireEvent.change(field, { target: { value: "2026-10-05T10:30" } });
    fireEvent.blur(field);
    expect(onSave).toHaveBeenCalledWith({
      developsAt: new Date("2026-10-05T10:30").toISOString(),
    });
    fireEvent.change(field, { target: { value: "2028-10-05T10:30" } });
    fireEvent.blur(field);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Pick a time within a year.")).toBeInTheDocument();
  });
});

/* ── THE ALBUM STYLES (the-wait r1, Will's pick of option 2's Settings) ───────────────────────────────────────────── */

function mountStyles(
  value: Partial<Value> = {},
  heldCount = 0,
  rollSize: number | null = null,
) {
  const onSave = vi.fn();
  render(
    <AlbumStyles
      value={{ capture: "upload", review: false, developsAt: null, ...value }}
      rollSize={rollSize}
      eventDate={null}
      heldCount={heldCount}
      savingCapture={false}
      savingReveal={false}
      onSave={onSave}
    >
      <p>the page switches</p>
    </AlbumStyles>,
  );
  return onSave;
}

const style = (name: RegExp) => screen.getByRole("radio", { name });

describe("album styles: one pick of a named album", () => {
  it("offers Live, Reviewed and Disposable, each its card and its line, the album's own checked", () => {
    mountStyles({ capture: "camera", developsAt: AHEAD }, 0, 12);
    expect(style(/^Live\./)).toHaveAttribute("aria-checked", "false");
    expect(style(/^Reviewed\./)).toHaveAttribute("aria-checked", "false");
    expect(style(/^Disposable\./)).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByText(
        "The album's camera, 12 shots each. Everyone's develop at once.",
      ),
    ).toBeInTheDocument();
    // The page's own switches stand in its card, under the develop time.
    expect(screen.getByText("the page switches")).toBeInTheDocument();
    expect(screen.getByLabelText("Develop time")).toBeInTheDocument();
  });

  it("★ a press is one save of all three columns", () => {
    const onSave = mountStyles();
    fireEvent.click(style(/^Disposable\./));
    expect(onSave).toHaveBeenLastCalledWith({
      capture: "camera",
      review: false,
      developsAt: defaultDevelopAt({ eventDate: null }).toISOString(),
    });
    fireEvent.click(style(/^Reviewed\./));
    expect(onSave).toHaveBeenLastCalledWith({
      capture: "upload",
      review: true,
      developsAt: null,
    });
  });

  it("★ never approval with a develop: Disposable writes no approval, and keeps only its develop time", () => {
    const onSave = mountStyles({ review: true });
    fireEvent.click(style(/^Disposable\./));
    const saved = onSave.mock.calls.at(-1)?.[0];
    expect(saved.review).toBe(false);
    expect(saved.developsAt).not.toBeNull();
  });

  it("★ from Reviewed with photos held, the switch to Disposable asks first: they join the roll", () => {
    const onSave = mountStyles({ review: true }, 3);
    fireEvent.click(style(/^Disposable\./));
    expect(onSave).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        /^3 photos under review join the roll: approved, they develop with everyone's/,
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Add them to the roll" }),
    );
    expect(onSave).toHaveBeenCalledWith({
      capture: "camera",
      review: false,
      developsAt: defaultDevelopAt({ eventDate: null }).toISOString(),
    });
  });

  it("leaving a develop still ahead asks first: every photo added so far shows at once", () => {
    const onSave = mountStyles({ capture: "camera", developsAt: AHEAD });
    fireEvent.click(style(/^Live\./));
    expect(onSave).not.toHaveBeenCalled();
    expect(
      screen.getByText("Every photo added so far shows now, to every guest."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show them now" }));
    expect(onSave).toHaveBeenCalledWith({
      capture: "upload",
      review: false,
      developsAt: null,
    });
  });

  it("a disposable that waits says how its host checks it: her cover, before it develops", () => {
    mountStyles({ capture: "camera", developsAt: AHEAD });
    expect(
      screen.getByText(
        /^Before it develops .+, look under the cover on your event page to take anything out\./,
      ),
    ).toBeInTheDocument();
  });

  it("no develop time, no develop row and no note", () => {
    mountStyles();
    expect(screen.queryByLabelText("Develop time")).toBeNull();
    expect(screen.queryByText(/look under the cover/)).toBeNull();
  });

  it("a mix outside the styles checks none, and stands Customize open with the two answers apart", () => {
    mountStyles({ capture: "camera", developsAt: null });
    for (const name of [/^Live\./, /^Reviewed\./, /^Disposable\./]) {
      expect(style(name)).toHaveAttribute("aria-checked", "false");
    }
    expect(
      screen.getByText("Your own mix: how guests add, and when everyone sees"),
    ).toBeInTheDocument();
    expect(radio("The album's camera")).toHaveAttribute("aria-checked", "true");
    expect(radio("Right away")).toHaveAttribute("aria-checked", "true");
  });

  it("Customize opens the two answers on a press, its develop time standing in the page's own row", () => {
    mountStyles({ capture: "camera", developsAt: AHEAD });
    expect(screen.queryByRole("radio", { name: "Free uploads" })).toBeNull();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Customize how guests add and when everyone sees",
      }),
    );
    expect(radio("At a develop time")).toHaveAttribute("aria-checked", "true");
    // One develop time on the page: the row's, never a second field inside Customize.
    expect(screen.getAllByLabelText("Develop time")).toHaveLength(1);
  });
});

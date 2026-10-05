/**
 * HOW GUESTS ADD, AND WHEN EVERYONE SEES WHAT'S ADDED (20261002200000): the mountable control's decisions. Each answer
 * is one save of both columns; a change that would show held or waiting photos asks first in its own line, and
 * nothing else asks; Develop now while a time waits; a develop time picked in her own zone, within reach, and saved only
 * when it is plainly meant (crumbs-60: the last describe).
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PICK_SETTLE_MS } from "@/components/app/event-settings/camera-settings-finish";
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
  it("offers Live, Review and Disposable, each its card and its line, the album's own checked", () => {
    mountStyles({ capture: "camera", developsAt: AHEAD }, 0, 12);
    expect(style(/^Live\./)).toHaveAttribute("aria-checked", "false");
    expect(style(/^Review\./)).toHaveAttribute("aria-checked", "false");
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
    fireEvent.click(style(/^Review\./));
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

  it("★ from Review with photos held, the switch to Disposable asks first: they join the roll", () => {
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
    for (const name of [/^Live\./, /^Review\./, /^Disposable\./]) {
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

/* ── THE DEVELOP TIME NEVER DEVELOPS AN ALBUM BY ACCIDENT (crumbs-60, the date field's twin) ───────────────────────── */

/**
 * A save of a develop time at or before the database's now IS Develop now: `events_reveal_stamp` stores it as its own
 * now and `events_develops_rewrite` opens every sealed row in the same save, and nothing can take it back. So a time
 * reaches the write only when it is plainly meant, once she has finished it (leaving the field, or Return): a year left
 * half typed is no time, a time already past asks Develop now's own question first, and a blank or half filled field
 * says what is missing.
 *
 * What is pinned is the writes, keystroke by keystroke in the order Chrome fires them on a `datetime-local` (measured on
 * Chrome 152 and 154, on the Library's Settings, with real key presses): `keydown`, then `input` and `change` with the
 * whole value in the same millisecond, then `keyup`; a year segment typed "0202" reads blank first (year 0 is no year),
 * then 0002, 0020 and 0202.
 */
type Press = [key: string, valueAfter: string];

/** Real key presses into the field: each is the keydown, the value it makes ("" while a segment is only 0s), the keyup. */
function typeInto(field: HTMLInputElement, presses: Press[]) {
  for (const [key, value] of presses) {
    fireEvent.keyDown(field, { key });
    fireEvent.change(field, { target: { value } });
    fireEvent.keyUp(field, { key });
  }
}

/** A moment as a `datetime-local` holds it: the browser's own zone, so no test reads the machine's. */
function local(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const DAY = 86_400_000;
const developField = () =>
  screen.getByLabelText("Develop time") as HTMLInputElement;
const leave = (field: HTMLInputElement) => fireEvent.blur(field);
const pressReturn = (field: HTMLInputElement) =>
  fireEvent.keyDown(field, { key: "Enter" });
const DEVELOP_NOW_LINE =
  /^Every photo added so far shows now, to every guest\. New ones show straight away\.$/;

/** Settings' own arrangement: a disposable whose develop time is a day ahead. */
function mountWaiting() {
  return mountStyles({ capture: "camera", developsAt: AHEAD });
}

describe("★ a year left half typed is no develop time", () => {
  it.each([
    ["she leaves the field", leave],
    ["she presses Return", pressReturn],
  ] as const)(
    "0202, typed a digit at a time, never saves when %s, and the field says why",
    (_how, finish) => {
      const onSave = mountWaiting();
      const field = developField();
      const tail = field.value.slice(4);
      typeInto(field, [
        ["0", ""],
        ["2", `0002${tail}`],
        ["0", `0020${tail}`],
        ["2", `0202${tail}`],
      ]);
      // Mid-typing nothing is on its way, a keystroke is never a save.
      expect(onSave).not.toHaveBeenCalled();
      finish(field);
      expect(onSave).not.toHaveBeenCalled();
      expect(
        screen.getByText("Pick a year from 1900 to 2100."),
      ).toBeInTheDocument();
      expect(field).toHaveAttribute("aria-invalid", "true");
      // The saved time still stands in its line, and nothing asked about developing.
      expect(
        screen.getByText(`Develops ${developTimeWords(AHEAD)}.`),
      ).toBeInTheDocument();
      expect(screen.queryByText(DEVELOP_NOW_LINE)).toBeNull();
    },
  );

  it("a fifth digit past the year is no time either", () => {
    const onSave = mountWaiting();
    const field = developField();
    const tail = field.value.slice(4);
    typeInto(field, [["7", `20267${tail}`]]);
    leave(field);
    expect(onSave).not.toHaveBeenCalled();
    expect(
      screen.getByText("Pick a year from 1900 to 2100."),
    ).toBeInTheDocument();
  });

  it("finishing the year clears the words, and the saved time typed again saves nothing", () => {
    const onSave = mountWaiting();
    const field = developField();
    const tail = field.value.slice(4);
    typeInto(field, [
      ["2", `0002${tail}`],
      ["0", `0020${tail}`],
      ["2", `0202${tail}`],
    ]);
    leave(field);
    expect(
      screen.getByText("Pick a year from 1900 to 2100."),
    ).toBeInTheDocument();
    typeInto(field, [["6", `2026${tail}`]]);
    expect(screen.queryByText("Pick a year from 1900 to 2100.")).toBeNull();
    // The time she finished is the one the field already had, so there is nothing to save and nothing to say.
    leave(field);
    expect(onSave).not.toHaveBeenCalled();
    expect(field).not.toHaveAttribute("aria-invalid");
  });

  it("a time typed through a blank stop saves once, when she leaves, and never on the way", () => {
    const onSave = mountWaiting();
    const field = developField();
    // The day typed as 05: the 0 reads blank, the 5 makes October 5.
    typeInto(field, [
      ["0", ""],
      ["5", "2026-10-05T16:00"],
    ]);
    expect(onSave).not.toHaveBeenCalled();
    leave(field);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      developsAt: new Date("2026-10-05T16:00").toISOString(),
    });
  });
});

describe("★ a time already past asks Develop now's own question, and writes nothing until she answers", () => {
  it.each([
    ["she leaves the field", leave],
    ["she presses Return", pressReturn],
  ] as const)("yesterday asks when %s", (_how, finish) => {
    const onSave = mountWaiting();
    const field = developField();
    fireEvent.change(field, { target: { value: local(NOW.getTime() - DAY) } });
    finish(field);
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(DEVELOP_NOW_LINE)).toBeInTheDocument();
    // It is the plain Develop now's own question, so its button is the one the question brings.
    expect(screen.getAllByRole("button", { name: "Develop now" })).toHaveLength(
      1,
    );
    expect(
      screen.getByRole("button", { name: "Keep it as it is" }),
    ).toBeInTheDocument();
  });

  it("Keep it as it is writes nothing and puts the field back to the saved time", () => {
    const onSave = mountWaiting();
    const field = developField();
    const saved = field.value;
    fireEvent.change(field, { target: { value: local(NOW.getTime() - DAY) } });
    leave(field);
    fireEvent.click(screen.getByRole("button", { name: "Keep it as it is" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(field.value).toBe(saved);
    expect(screen.queryByText(DEVELOP_NOW_LINE)).toBeNull();
    // The plain button is back, and its own question is still its own.
    fireEvent.click(screen.getByRole("button", { name: "Develop now" }));
    expect(screen.getByText(DEVELOP_NOW_LINE)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("Develop now writes now, the database's own word, never the past time she typed", () => {
    const onSave = mountWaiting();
    const field = developField();
    fireEvent.change(field, { target: { value: local(NOW.getTime() - DAY) } });
    leave(field);
    fireEvent.click(screen.getByRole("button", { name: "Develop now" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ developsAt: NOW.toISOString() });
  });

  it("asking is a pause, not a state: she can leave the field again while the question stands, and edit it away", () => {
    const onSave = mountWaiting();
    const field = developField();
    fireEvent.change(field, { target: { value: local(NOW.getTime() - DAY) } });
    leave(field);
    // Pressing a button in the question leaves the field first: that must not ask a second question or write.
    leave(field);
    expect(screen.getAllByText(DEVELOP_NOW_LINE)).toHaveLength(1);
    expect(onSave).not.toHaveBeenCalled();
    // A new time is a new question: the old one goes, and a time ahead saves on leaving.
    fireEvent.change(field, {
      target: { value: local(NOW.getTime() + 2 * DAY) },
    });
    expect(screen.queryByText(DEVELOP_NOW_LINE)).toBeNull();
    leave(field);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      developsAt: new Date(NOW.getTime() + 2 * DAY).toISOString(),
    });
  });

  it("the database's own minute: a time under a minute ahead is Develop now too, so it asks", () => {
    vi.setSystemTime(new Date("2026-10-02T20:00:30Z"));
    const onSave = mountWaiting();
    const field = developField();
    // 20:01 is thirty seconds away: `events_reveal_stamp` stores anything under a minute ahead as its own now.
    fireEvent.change(field, {
      target: { value: local(Date.parse("2026-10-02T20:01:00Z")) },
    });
    leave(field);
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(DEVELOP_NOW_LINE)).toBeInTheDocument();
    // A minute and a half ahead is a time ahead, and it saves.
    fireEvent.change(field, {
      target: { value: local(Date.parse("2026-10-02T20:02:00Z")) },
    });
    leave(field);
    expect(onSave).toHaveBeenCalledWith({
      developsAt: "2026-10-02T20:02:00.000Z",
    });
  });
});

describe("★ an album that has already developed is asked nothing: a past time is refused in words", () => {
  it("never saves, and never asks a question that would say something untrue", () => {
    const onSave = mountStyles({ capture: "camera", developsAt: PAST });
    const field = developField();
    fireEvent.change(field, {
      target: { value: local(NOW.getTime() - 2 * DAY) },
    });
    leave(field);
    expect(onSave).not.toHaveBeenCalled();
    expect(
      screen.getByText("That time has passed. Pick one ahead."),
    ).toBeInTheDocument();
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText(DEVELOP_NOW_LINE)).toBeNull();
  });

  it("a time ahead still saves: a developed album can wait again", () => {
    const onSave = mountStyles({ capture: "camera", developsAt: PAST });
    const field = developField();
    fireEvent.change(field, { target: { value: "2026-10-05T10:30" } });
    leave(field);
    expect(onSave).toHaveBeenCalledWith({
      developsAt: new Date("2026-10-05T10:30").toISOString(),
    });
  });
});

describe("a blank or half filled field is no time", () => {
  it("never saves, and says to finish it", () => {
    const onSave = mountWaiting();
    const field = developField();
    // A segment cleared and not typed again reads empty (Chrome's `badInput`), as does a field cleared whole.
    fireEvent.keyDown(field, { key: "Backspace" });
    fireEvent.change(field, { target: { value: "" } });
    fireEvent.keyUp(field, { key: "Backspace" });
    leave(field);
    expect(onSave).not.toHaveBeenCalled();
    expect(
      screen.getByText("Finish the time, or pick another."),
    ).toBeInTheDocument();
    expect(field).toHaveAttribute("aria-invalid", "true");
  });

  it("says nothing, and writes nothing, when a field is left as it was", () => {
    const onSave = mountWaiting();
    const field = developField();
    leave(field);
    pressReturn(field);
    expect(onSave).not.toHaveBeenCalled();
    expect(field).not.toHaveAttribute("aria-invalid");
  });
});

/**
 * ★ A CLOSE KEEPS A TIME PLAINLY MEANT, AND NOTHING ELSE (crumbs-72, reshaped from crumbs-60's "closing the panel mid-edit
 * writes nothing"). Escape or Back takes the page away with focus still in the field, and a field removed from the page
 * never blurs, so a typed time was lost with it: the date field has always saved a finished day as the panel closes.
 * What keeps crumbs-60's scar: a develop cannot be undone and a close cannot ask, so a close writes only what a blur
 * would write unasked (a time ahead, within reach); never a year left half typed, never a past time (which a blur
 * ASKS about), and never a time over what another control did (a style switch that cleared the time took the field with
 * it, and a late write would put the time back over her choice). What dropped the reason that expired: "a develop time
 * moves what guests see, a close could not ask" is now the rule of what a close writes, not a reason to write nothing.
 */
describe("closing the panel mid-edit keeps a time plainly meant, and nothing else", () => {
  it("★ a time typed and not left is saved as the page closes, once", () => {
    const onSave = mountWaiting();
    typeInto(developField(), [["5", "2026-10-05T16:00"]]);
    expect(onSave).not.toHaveBeenCalled();
    cleanup();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      developsAt: new Date("2026-10-05T16:00").toISOString(),
    });
  });

  it("the same where the control carries its own time (Customize's two answers, apart)", () => {
    const onSave = mount({ developsAt: AHEAD });
    typeInto(developField(), [["5", "2026-10-05T16:00"]]);
    cleanup();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      developsAt: new Date("2026-10-05T16:00").toISOString(),
    });
  });

  it("a time already left (or entered) is not saved twice by the close that follows", () => {
    for (const finish of [leave, pressReturn]) {
      const onSave = mountWaiting();
      const field = developField();
      typeInto(field, [["5", "2026-10-05T16:00"]]);
      finish(field);
      expect(onSave).toHaveBeenCalledTimes(1);
      cleanup();
      expect(onSave).toHaveBeenCalledTimes(1);
    }
  });

  it("★ a year left half typed is dropped with the page, as a blur would refuse it", () => {
    const onSave = mountWaiting();
    const field = developField();
    const tail = field.value.slice(4);
    typeInto(field, [
      ["2", `0002${tail}`],
      ["0", `0020${tail}`],
      ["2", `0202${tail}`],
    ]);
    cleanup();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("★ a past time is dropped with the page: a blur would ask Develop now's question, and a close cannot", () => {
    const onSave = mountWaiting();
    fireEvent.change(developField(), {
      target: { value: local(NOW.getTime() - DAY) },
    });
    cleanup();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("an album that has developed drops a past time too, and a field left as it was writes nothing", () => {
    const developed = mountStyles({ capture: "camera", developsAt: PAST });
    fireEvent.change(developField(), {
      target: { value: local(NOW.getTime() - 2 * DAY) },
    });
    cleanup();
    expect(developed).not.toHaveBeenCalled();
    const asItWas = mountWaiting();
    fireEvent.change(developField(), {
      target: { value: developField().value },
    });
    cleanup();
    expect(asItWas).not.toHaveBeenCalled();
  });

  /** Settings' own arrangement, mounted so its saved value can follow a save as the provider's overlay does. */
  function mountFollowing(value: Value) {
    const onSave = vi.fn();
    const props = {
      rollSize: null,
      eventDate: null,
      heldCount: 0,
      savingCapture: false,
      savingReveal: false,
      onSave,
    };
    const view = render(<AlbumStyles {...props} value={value} />);
    const follow = (next: Value) =>
      view.rerender(<AlbumStyles {...props} value={next} />);
    return { onSave, follow };
  }
  const WAITING: Value = {
    capture: "camera",
    review: false,
    developsAt: AHEAD,
  };
  const LIVE: Value = { capture: "upload", review: false, developsAt: null };

  it("★ a style switch that clears the time takes a typed time with it: the close never writes it back", () => {
    const { onSave, follow } = mountFollowing(WAITING);
    // Typed, not left: a press on a button never blurs the field on a phone, so the time is still a draft at the switch.
    typeInto(developField(), [["5", "2026-10-05T16:00"]]);
    // Leaving a develop still ahead asks first; the switch is written when she answers.
    fireEvent.click(style(/^Live/));
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Show them now" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenLastCalledWith(LIVE);
    // The save lays itself over the row, the time is gone and its field with it; then the page closes.
    follow(LIVE);
    expect(screen.queryByLabelText("Develop time")).toBeNull();
    cleanup();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("the same through Customize's own answers: Right away, once its question is answered", () => {
    const { onSave, follow } = mountFollowing(WAITING);
    typeInto(developField(), [["5", "2026-10-05T16:00"]]);
    fireEvent.click(
      screen.getByRole("button", { name: /Customize how guests add/ }),
    );
    fireEvent.click(radio("Right away"));
    fireEvent.click(screen.getByRole("button", { name: "Show them now" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenLastCalledWith({
      review: false,
      developsAt: null,
    });
    follow({ ...LIVE, capture: "camera" });
    cleanup();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("a switch back to Disposable starts the field clean: no old draft, words or question returns with it", () => {
    const { onSave, follow } = mountFollowing(WAITING);
    const field = developField();
    const saved = field.value;
    fireEvent.change(field, { target: { value: local(NOW.getTime() - DAY) } });
    leave(field);
    expect(screen.getByText(DEVELOP_NOW_LINE)).toBeInTheDocument();
    fireEvent.click(style(/^Live/));
    fireEvent.click(screen.getByRole("button", { name: "Show them now" }));
    follow(LIVE);
    fireEvent.click(style(/^Disposable/));
    expect(onSave).toHaveBeenCalledTimes(2);
    follow(WAITING);
    expect(screen.queryByText(DEVELOP_NOW_LINE)).toBeNull();
    expect(developField().value).toBe(saved);
    expect(developField()).not.toHaveAttribute("aria-invalid");
  });
});

/**
 * ★ A PICKER'S CHOICE SAVES A BEAT AFTER IT (crumbs-72, the date field's own beat): a phone's picker may never blur the
 * field, so a time picked there waited for a leaving that did not come. A change no key made is a picker's; it is
 * judged once it has rested, exactly as a leaving would judge it, and a wheel that reports every notch it turns commits
 * the one it rests on. A change a key made (typing, an arrow) always waits to be left.
 */
describe("a picker's choice saves a beat after it, with no leaving", () => {
  const rest = (ms: number) => new Promise((r) => setTimeout(r, ms));

  it("★ saves a time picked and never left, once it has rested", async () => {
    const onSave = mountWaiting();
    fireEvent.change(developField(), { target: { value: "2026-10-05T10:30" } });
    expect(onSave).not.toHaveBeenCalled();
    await rest(PICK_SETTLE_MS + 100);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      developsAt: new Date("2026-10-05T10:30").toISOString(),
    });
  });

  it("a wheel's every notch is one save, the time it rests on", async () => {
    const onSave = mountWaiting();
    const field = developField();
    for (const time of [
      "2026-10-05T09:00",
      "2026-10-05T10:00",
      "2026-10-05T11:00",
    ]) {
      fireEvent.change(field, { target: { value: time } });
    }
    await rest(PICK_SETTLE_MS - 100);
    expect(onSave).not.toHaveBeenCalled();
    await rest(200);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      developsAt: new Date("2026-10-05T11:00").toISOString(),
    });
  });

  it("a change a key made never saves on the beat, only when she leaves", async () => {
    const onSave = mountWaiting();
    const field = developField();
    typeInto(field, [["5", "2026-10-05T16:00"]]);
    await rest(PICK_SETTLE_MS + 100);
    expect(onSave).not.toHaveBeenCalled();
    leave(field);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("★ a picked past time asks Develop now's question when it has rested, and writes nothing", async () => {
    const onSave = mountWaiting();
    fireEvent.change(developField(), {
      target: { value: local(NOW.getTime() - DAY) },
    });
    await rest(PICK_SETTLE_MS + 100);
    expect(screen.getByText(DEVELOP_NOW_LINE)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("a picked time beyond a year says so in words, and writes nothing", async () => {
    const onSave = mountWaiting();
    fireEvent.change(developField(), { target: { value: "2028-10-05T10:30" } });
    await rest(PICK_SETTLE_MS + 100);
    expect(screen.getByText("Pick a time within a year.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("a cleared field is never saved by the beat, only by leaving: it says to finish it", async () => {
    const onSave = mountWaiting();
    const field = developField();
    fireEvent.change(field, { target: { value: "" } });
    await rest(PICK_SETTLE_MS + 100);
    expect(screen.queryByText("Finish the time, or pick another.")).toBeNull();
    leave(field);
    expect(
      screen.getByText("Finish the time, or pick another."),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("★ a save on its way never disables the field: a picker still open would close under her mid-pick", () => {
    render(
      <AlbumStyles
        value={{ capture: "camera", review: false, developsAt: AHEAD }}
        rollSize={null}
        eventDate={null}
        heldCount={0}
        savingCapture={false}
        savingReveal
        onSave={vi.fn()}
      />,
    );
    expect(developField()).not.toBeDisabled();
  });
});

describe("the same guard stands where the control carries its own time (Customize's two answers, apart)", () => {
  it("a year left half typed saves nothing there either", () => {
    const onSave = mount({ developsAt: AHEAD });
    const field = developField();
    const tail = field.value.slice(4);
    typeInto(field, [
      ["2", `0002${tail}`],
      ["0", `0020${tail}`],
      ["2", `0202${tail}`],
    ]);
    leave(field);
    expect(onSave).not.toHaveBeenCalled();
    expect(
      screen.getByText("Pick a year from 1900 to 2100."),
    ).toBeInTheDocument();
  });

  it("a past time asks there too", () => {
    const onSave = mount({ developsAt: AHEAD });
    const field = developField();
    fireEvent.change(field, { target: { value: local(NOW.getTime() - DAY) } });
    leave(field);
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(DEVELOP_NOW_LINE)).toBeInTheDocument();
  });
});

import { useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  pictureCells,
  STYLE_MOMENTS,
} from "@/components/app/event-settings/camera-settings-style-picture";
import {
  ALBUM_STYLES,
  createFieldsOf,
  patchForStyle,
  styleLine,
  STYLE_NAMES,
} from "@/lib/disposable/album-style";
import { ROLL_SHOTS } from "@/lib/disposable/roll";
import { browserZone, deviceZone } from "@/lib/event/zone";
import { developDefaultIn } from "@/lib/event/zone-morning";

import { setReducedMotion } from "../../../../vitest.setup";
import { type AddChoice, AddStep, useAddChoice } from "./add-step";
import { DevelopStep } from "./develop-step";

/**
 * THE ADD STEP: HOW THE ALBUM IS STYLED (create-wizard r3's `add=styles`, Will 2026-10-04). Three cards, Live, Review and
 * Disposable, each a small album moving through the night, nothing opening under them; the night under them all. And
 * the Disposable's own screen after it (r4's `styles=focused`, 2026-10-07): its develop time and its roll.
 *
 * What fails silently, and is pinned here:
 *  - the cards stop speaking Settings' words (a second name for a style is two products);
 *  - the develop time creeps back onto the cards' screen (his own worry: "not tucked underneath the timeline where it
 *    may not be noticed", answered by a screen of its own), or its screen stops offering and keeping her time and roll;
 *  - a keyboard cannot move between the cards or the night's moments (a radio group moves with the arrows);
 *  - the night plays every time the step opens, or plays over a hand already on the slider;
 *  - the pictures stop telling the three styles apart at the party (Live all lit, Review with the held ones, Disposable
 *    dark but for hers).
 * No class, size or duration is pinned; the words are, where a word is the fact.
 */

/** The wizard's own holding of the add step: its choice, and whether the night has played (state, as the wizard has it). */
function Harness({
  played: initiallyPlayed = true,
  onChoice,
  onNightPlayed,
}: {
  played?: boolean;
  onChoice?: (choice: AddChoice) => void;
  onNightPlayed?: () => void;
}) {
  const choice = useAddChoice();
  const [played, setPlayed] = useState(initiallyPlayed);
  onChoice?.(choice);
  return (
    <AddStep
      choice={choice}
      played={played}
      onPlayed={() => {
        setPlayed(true);
        onNightPlayed?.();
      }}
    />
  );
}

const style = (name: RegExp) => screen.getByRole("radio", { name });
const picture = (s: string) =>
  document.querySelector<HTMLElement>(`[data-style-picture="${s}"]`)!;
const cellsOf = (s: string) =>
  [...picture(s).querySelectorAll<HTMLElement>("[data-cell]")].map(
    (c) => c.dataset.cell,
  );

/**
 * An arrow held down, as a finger holds a key: the group moves focus a tick after the keydown, and a radio is chosen by a
 * focus that arrives while an arrow is down (the code's looks are tested the same way).
 */
async function arrow(
  key: "ArrowDown" | "ArrowUp" | "ArrowLeft" | "ArrowRight",
  checked: () => HTMLElement,
) {
  await userEvent.keyboard(`{${key}>}`);
  await waitFor(() =>
    expect(checked()).toHaveAttribute("aria-checked", "true"),
  );
  await userEvent.keyboard(`{/${key}}`);
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("the three cards: Settings' own words", () => {
  it("★ offers Live, Review and Disposable as one group of three, each named and lined as Settings names and lines it", () => {
    render(<Harness />);
    const group = screen.getByRole("radiogroup", { name: /album style/i });
    const radios = within(group).getAllByRole("radio");
    expect(radios).toHaveLength(ALBUM_STYLES.length);
    expect(radios.map((r) => r.getAttribute("aria-label"))).toEqual(
      ALBUM_STYLES.map(
        (s) => `${STYLE_NAMES[s]}. ${styleLine(s, { rollSize: null })}`,
      ),
    );
    // ★ The middle style is Review, the one word (Will: "should we go with a more simple 'Review'?"), never Reviewed.
    expect(screen.queryByText(/reviewed/i)).toBeNull();
    expect(radios[1]).toHaveAccessibleName(/^review\./i);
  });

  it("opens on Live, the album most hosts want, and exactly one is picked at a time", async () => {
    render(<Harness />);
    const checked = () =>
      screen
        .getAllByRole("radio", { name: /\./ })
        .filter((r) => r.getAttribute("aria-checked") === "true")
        .map((r) => r.getAttribute("data-album-style"));
    expect(checked()).toEqual(["live"]);
    await userEvent.click(style(/^review\./i));
    expect(checked()).toEqual(["approval"]);
    await userEvent.click(style(/^disposable\./i));
    expect(checked()).toEqual(["disposable"]);
  });

  it("★ moves between the cards with the arrows, choosing as it goes (a radio group's own keys)", async () => {
    render(<Harness />);
    act(() => style(/^live\./i).focus());
    await arrow("ArrowDown", () => style(/^review\./i));
    await arrow("ArrowDown", () => style(/^disposable\./i));
    // It wraps, as the code's looks do.
    await arrow("ArrowRight", () => style(/^live\./i));
    await arrow("ArrowUp", () => style(/^disposable\./i));
  });

  it("marks the picked card's picture to drop into the add step's hairline, and no other", async () => {
    render(<Harness />);
    const marked = () =>
      [...document.querySelectorAll<HTMLElement>("[data-carry-pick]")].map(
        (m) => ({
          step: m.dataset.carryPick,
          style: m
            .querySelector("[data-style-picture]")
            ?.getAttribute("data-style-picture"),
        }),
      );
    expect(marked()).toEqual([{ step: "2", style: "live" }]);
    await userEvent.click(style(/^disposable\./i));
    expect(marked()).toEqual([{ step: "2", style: "disposable" }]);
  });
});

/**
 * The wizard's two screens over one choice, as Back and Continue walk between them: the cards, and the Disposable's own
 * screen beside them (the wizard draws it after the cards while Disposable is picked).
 */
function Both({ onChoice }: { onChoice?: (choice: AddChoice) => void }) {
  const choice = useAddChoice();
  onChoice?.(choice);
  return (
    <>
      <AddStep choice={choice} played onPlayed={() => {}} />
      {choice.style === "disposable" ? <DevelopStep choice={choice} /> : null}
    </>
  );
}

/**
 * ★ RESHAPED ON PURPOSE (create-wizard r4's `styles=focused`; scar kept: the develop time is never where it may not be
 * noticed, and nothing of it is reachable while another style is picked). Its reason "directly under its card" expired:
 * the time is a screen of its own now, so the cards' screen holds none of it whatever is picked.
 */
describe("nothing opens under the cards (styles=focused)", () => {
  it("★ holds no develop time and no roll on the cards' screen, whatever is picked: they are the Disposable's own screen", async () => {
    render(<Harness />);
    for (const name of [/^disposable\./i, /^review\./i, /^disposable\./i]) {
      await userEvent.click(style(name));
      expect(screen.queryByLabelText("Develop time")).toBeNull();
      expect(
        screen.queryByRole("radiogroup", { name: "Shots each" }),
      ).toBeNull();
    }
    // The night still stands right under the three, nothing between.
    const group = screen.getByRole("radiogroup", { name: /album style/i });
    expect(group.nextElementSibling).toBe(
      document.querySelector("[data-night]"),
    );
  });
});

/**
 * THE DISPOSABLE'S OWN SCREEN (`develop-step.tsx`, r4's `styles=focused`): the album the morning it opens, the develop
 * row and the roll, over the same choice the cards hold.
 */
describe("the develop time on the Disposable's own screen", () => {
  it("★ shows the Disposable's album the morning it opens, then the time, then the roll", async () => {
    render(<Both />);
    await userEvent.click(style(/^disposable\./i));
    const step = document.querySelector<HTMLElement>("[data-develop-step]")!;
    const pic = step.querySelector<HTMLElement>("[data-style-picture]")!;
    expect(pic.dataset.stylePicture).toBe("disposable");
    expect(pic.dataset.moment).toBe("morning");
    const field = within(step).getByLabelText("Develop time");
    expect(field).toHaveAttribute("type", "datetime-local");
    const roll = within(step).getByRole("radiogroup", { name: "Shots each" });
    expect(
      field.compareDocumentPosition(roll) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("offers 9 am tomorrow, said in the camera's words, and keeps a time she moved across a switch of style", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 10, 20, 0, 0));
    render(<Both />);
    await userEvent.click(style(/^disposable\./i));
    expect(screen.getByLabelText("Develop time")).toHaveValue(
      "2026-10-11T09:00",
    );
    expect(document.querySelector("[data-develop-words]")).toHaveTextContent(
      "tomorrow at 9 am",
    );

    // She moves it (a phone's wheel, a desk's calendar), and the words follow.
    fireEvent.change(screen.getByLabelText("Develop time"), {
      target: { value: "2026-10-17T11:30" },
    });
    fireEvent.blur(screen.getByLabelText("Develop time"));
    expect(document.querySelector("[data-develop-words]")).toHaveTextContent(
      "Oct 17 at 11:30 am",
    );

    // Leaving the style and coming back keeps a time still ahead (Settings' own rule), never offers 9 am over it.
    await userEvent.click(style(/^live\./i));
    expect(screen.queryByLabelText("Develop time")).toBeNull();
    await userEvent.click(style(/^disposable\./i));
    expect(screen.getByLabelText("Develop time")).toHaveValue(
      "2026-10-17T11:30",
    );
  });
});

/**
 * ★ THE ROLL UNDER THE DEVELOP TIME (customize r1's `roll=both`): film's three and Other's stepper, Settings' own
 * control; the card's line and its picture say her count; her pick is kept across a style switch and rides the create
 * with the Disposable alone. ★ RESHAPED ON PURPOSE (r4's `styles=focused`; scar kept: Settings' own control, her count
 * said on the card, kept across a switch): it stands under the time on the Disposable's own screen, where it stood in
 * the slot under the card.
 */
describe("the roll stands under the develop time, on the Disposable's screen", () => {
  const rollGroup = () =>
    screen.getByRole("radiogroup", { name: "Shots each" });

  it("★ offers film's three and Other, 24 picked until she picks", async () => {
    render(<Both />);
    await userEvent.click(style(/^disposable\./i));
    expect(
      within(rollGroup())
        .getAllByRole("radio")
        .map((r) => r.getAttribute("aria-label")),
    ).toEqual([
      "12 shots",
      "24 shots",
      "36 shots",
      "Another number of shots, 1 to 99",
    ]);
    expect(
      within(rollGroup()).getByRole("radio", { name: "24 shots" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("★ a box is her roll: the Disposable card's line and its arriving camera say it, and the create carries it", async () => {
    let latest!: AddChoice;
    render(<Both onChoice={(c) => (latest = c)} />);
    await userEvent.click(style(/^disposable\./i));
    await userEvent.click(
      within(rollGroup()).getByRole("radio", { name: "36 shots" }),
    );
    expect(latest.roll).toBe(36);
    expect(style(/^disposable\./i)).toHaveAccessibleName(
      `${STYLE_NAMES.disposable}. ${styleLine("disposable", { rollSize: 36 })}`,
    );
    expect(latest.fields().roll_size).toBe(36);
    // Kept while she moves between the styles, and never sent with one that has no camera.
    await userEvent.click(style(/^live\./i));
    expect(latest.fields().roll_size).toBeNull();
    await userEvent.click(style(/^disposable\./i));
    expect(
      within(rollGroup()).getByRole("radio", { name: "36 shots" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(latest.fields().roll_size).toBe(36);
  });

  it("★ Other opens the stepper under the boxes, minus at one end and plus at the other, any count to 99", async () => {
    let latest!: AddChoice;
    render(<Both onChoice={(c) => (latest = c)} />);
    await userEvent.click(style(/^disposable\./i));
    const step = () =>
      document.querySelector<HTMLElement>("[data-develop-step]")!;
    expect(step().querySelector("[data-roll-stepper]")).toBeNull();
    await userEvent.click(
      within(rollGroup()).getByRole("radio", { name: /another number/i }),
    );
    const stepper = step().querySelector<HTMLElement>("[data-roll-stepper]")!;
    const [fewer, count, more] = [...stepper.children] as HTMLElement[];
    expect(fewer).toHaveAccessibleName("Fewer shots");
    expect(count).toHaveAttribute("role", "spinbutton");
    expect(more).toHaveAccessibleName("More shots");
    // A press steps once; the count's keys move by one, by ten and to either end.
    fireEvent.click(more!);
    expect(latest.roll).toBe(25);
    fireEvent.keyDown(count!, { key: "PageUp" });
    expect(latest.roll).toBe(35);
    fireEvent.keyDown(count!, { key: "End" });
    expect(latest.roll).toBe(99);
    expect(more).toBeDisabled();
    fireEvent.keyDown(count!, { key: "ArrowUp" });
    expect(latest.roll).toBe(99);
    fireEvent.keyDown(count!, { key: "Home" });
    expect(latest.roll).toBe(1);
    expect(fewer).toBeDisabled();
    expect(count).toHaveAttribute("aria-valuetext", "1 shot each");
    expect(latest.fields().roll_size).toBe(1);
    // ★ And the card says one shot as one (red-team 56b's NIT: "1 shots each"), in Settings' own line.
    const card = style(/^disposable\./i);
    expect(card).toHaveAccessibleName(
      `${STYLE_NAMES.disposable}. ${styleLine("disposable", { rollSize: 1 })}`,
    );
    expect(card).toHaveTextContent(/\b1 shot each\b/);
  });
});

describe("the pictures: the three styles told apart, moving through the night", () => {
  it("★ at the party Live is lit, Review holds some under a clock, and Disposable is dark but for hers", () => {
    render(<Harness />);
    expect(new Set(cellsOf("live"))).toEqual(new Set(["lit"]));
    expect(cellsOf("approval")).toEqual(pictureCells("approval", "party"));
    expect(cellsOf("approval").filter((c) => c === "held")).toHaveLength(2);
    expect(cellsOf("approval").filter((c) => c === "fading")).toHaveLength(2);
    expect(cellsOf("disposable").filter((c) => c === "hers")).toHaveLength(1);
    expect(cellsOf("disposable").filter((c) => c === "dark")).toHaveLength(5);
  });

  it("★ the night moves every picture: guests arriving (empty, the camera holds its roll), the party, the morning (whole)", async () => {
    render(<Harness />);
    const moments = () => ALBUM_STYLES.map((s) => picture(s).dataset.moment);
    expect(moments()).toEqual(["party", "party", "party"]);

    await userEvent.click(screen.getByRole("radio", { name: "Arriving" }));
    expect(moments()).toEqual(["arrive", "arrive", "arrive"]);
    expect(new Set(cellsOf("live"))).toEqual(new Set(["empty"]));
    expect(new Set(cellsOf("disposable"))).toEqual(new Set(["dark"]));
    // The disposable's camera, with its roll's size, over its still-dark frames.
    expect(picture("disposable")).toHaveTextContent("24");

    await userEvent.click(screen.getByRole("radio", { name: "Next morning" }));
    expect(moments()).toEqual(["morning", "morning", "morning"]);
    for (const s of ALBUM_STYLES)
      expect(new Set(cellsOf(s))).toEqual(new Set(["lit"]));
  });

  it("★ the night is a radio group of three words a keyboard moves through, and the track answers a press", async () => {
    render(<Harness />);
    const night = screen.getByRole("radiogroup", {
      name: /through the night/i,
    });
    expect(
      within(night)
        .getAllByRole("radio")
        .map((r) => r.textContent),
    ).toEqual(["Arriving", "The party", "Next morning"]);
    const word = (name: string) => screen.getByRole("radio", { name });
    act(() => word("The party").focus());
    await arrow("ArrowRight", () => word("Next morning"));
    await arrow("ArrowLeft", () => word("The party"));
    await arrow("ArrowLeft", () => word("Arriving"));

    // A press anywhere on the track lands on the nearest moment (its words stay the control for a reader).
    const track = document.querySelector<HTMLElement>("[data-night-track]")!;
    track.setPointerCapture = vi.fn();
    track.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 300,
        height: 28,
        right: 300,
        bottom: 28,
      }) as DOMRect;
    fireEvent.pointerDown(track, { clientX: 290, pointerId: 1 });
    expect(screen.getByRole("radio", { name: "Next morning" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    fireEvent.pointerDown(track, { clientX: 140, pointerId: 1 });
    expect(screen.getByRole("radio", { name: "The party" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("the track and the moments are the same three, in order", () => {
    expect(STYLE_MOMENTS).toEqual(["arrive", "party", "morning"]);
  });
});

describe("the night plays once, as the step first opens", () => {
  /** The wizard around the step: it holds whether the night has played, and mounts the step again on demand. */
  function Wizard() {
    const [played, setPlayed] = useState(false);
    const [open, setOpen] = useState(true);
    const choice = useAddChoice();
    return (
      <>
        <button type="button" onClick={() => setOpen((o) => !o)}>
          toggle
        </button>
        {open ? (
          <AddStep
            choice={choice}
            played={played}
            onPlayed={() => setPlayed(true)}
          />
        ) : null}
      </>
    );
  }

  it("★ opens on the guests arriving and rests on the party, once; a second open (a Back and a Continue) opens on the party", () => {
    vi.useFakeTimers();
    render(<Wizard />);
    expect(picture("live").dataset.moment).toBe("arrive");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(picture("live").dataset.moment).toBe("party");

    // She goes on and comes back: the step stands on the party, no second show.
    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    expect(document.querySelector("[data-add-step]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    expect(picture("live").dataset.moment).toBe("party");
  });

  it("★ reduced motion opens on the party at once, the page complete at rest", () => {
    setReducedMotion(true);
    render(<Harness played={false} />);
    expect(picture("live").dataset.moment).toBe("party");
  });

  it("★ a hand on the slider is the night's now: nothing plays over it", () => {
    vi.useFakeTimers();
    render(<Wizard />);
    expect(picture("live").dataset.moment).toBe("arrive");
    fireEvent.click(screen.getByRole("radio", { name: "Next morning" }));
    expect(picture("live").dataset.moment).toBe("morning");
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(picture("live").dataset.moment).toBe("morning");
  });
});

describe("useAddChoice: a style is one choice of three columns", () => {
  let latest: AddChoice;
  const mount = () => {
    render(<Harness onChoice={(c) => (latest = c)} />);
    return () => latest;
  };

  it("★ says the create's fields exactly as Settings' press of the same style writes them", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 10, 20, 0, 0));
    const choice = mount();
    for (const [name, to] of [
      [/^live\./i, "live"],
      [/^review\./i, "approval"],
      [/^disposable\./i, "disposable"],
    ] as const) {
      fireEvent.click(style(name));
      // Her roll untouched is the usual, riding with the Disposable alone (`createFieldsOf`); her own zone rides every
      // style (event-zone: the party's from birth), and the Disposable's 9 am is read in it, here the browser's own.
      const zone = deviceZone();
      expect(choice().fields()).toEqual({
        ...createFieldsOf(
          patchForStyle(
            to,
            { capture: "upload", review: false, developsAt: null },
            { eventDate: null },
          ),
          ROLL_SHOTS,
        ),
        ...(zone ? { captured_zone: zone } : {}),
      });
    }
  });

  it("★ carries her own zone, captured and never asked, and offers the Disposable's 9 am in that zone", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-05T22:00:00Z"));
    // Her browser names Auckland: already the 6th there, so 9 am tomorrow is the 7th's, in Auckland.
    vi.spyOn(browserZone, "zoneName").mockReturnValue("Pacific/Auckland");
    const choice = mount();
    for (const name of [/^live\./i, /^review\./i]) {
      fireEvent.click(style(name));
      expect(choice().fields().captured_zone).toBe("Pacific/Auckland");
    }
    fireEvent.click(style(/^disposable\./i));
    const fields = choice().fields();
    expect(fields.captured_zone).toBe("Pacific/Auckland");
    expect(fields.develops_at).toBe(
      developDefaultIn("Pacific/Auckland", { eventDate: null }).toISOString(),
    );
    expect(fields.develops_at).toBe("2026-10-06T20:00:00.000Z");
  });

  it("names no zone where her browser names none it can read (the party then turns in the one fallback)", () => {
    vi.spyOn(browserZone, "zoneName").mockReturnValue("Etc/Unknown");
    const choice = mount();
    fireEvent.click(style(/^disposable\./i));
    expect("captured_zone" in choice().fields()).toBe(false);
  });

  it("★ never lets approval stand with a develop time, whatever the order she moved in", () => {
    const choice = mount();
    for (const name of [
      /^disposable\./i,
      /^review\./i,
      /^disposable\./i,
      /^live\./i,
      /^review\./i,
    ]) {
      fireEvent.click(style(name));
      const f = choice().fields();
      expect(
        f.moderation_mode === "hold_for_approval" && f.develops_at,
      ).toBeFalsy();
    }
  });

  it("confirms a Disposable only while its time is plainly ahead", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 10, 20, 0, 0));
    const choice = mount();
    expect(choice().confirm()).toBe(true); // Live: nothing to judge
    fireEvent.click(style(/^disposable\./i));
    expect(choice().confirm()).toBe(true);
    // The tab stands open past it.
    vi.setSystemTime(new Date(2026, 9, 11, 9, 30, 0));
    let ok = true;
    act(() => {
      ok = choice().confirm();
    });
    expect(ok).toBe(false);
    expect(choice().refusal).toMatch(/has passed/i);
  });
});

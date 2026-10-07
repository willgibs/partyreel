/**
 * SETTINGS' RADIO CARDS, ONE CHOICE OF SEVERAL SAID AS ONE (crumbs-91, red-team 57b's NIT): the keyboard contract every
 * Settings group of cards shares, against a harness that holds what the real cards hold (a control on each card, a choice
 * that asks first, a card that waits). The pages' own tests pin it on the door's gates and the album's answers.
 *
 * What fails silently, and is pinned here:
 *  - every card a Tab stop again, or a group no keyboard can enter;
 *  - Radix's group stop handing focus forward from a control on a card, so Shift+Tab loops and Tab skips the controls
 *    before the chosen card (the door's (i)s);
 *  - the arrows moving without choosing, choosing a card that waits, or a choice that asks first saving on an arrow;
 *  - a control on a card losing its own keys to the group.
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { RadioCard, RadioCards } from "./radio-cards";

const CARDS = ["one", "two", "three", "four"] as const;
type Card = (typeof CARDS)[number];

/** A page's own holding of the choice: a press on the chosen card lets a pending line go, a card that asks only asks. */
function Harness({
  initial,
  asks = [],
  waits = [],
  controls = true,
  onChoose,
}: {
  initial: Card | null;
  /** Cards whose press asks first: their line opens, and nothing is chosen. */
  asks?: Card[];
  /** Cards that wait (as the cards not chosen do while a save is on its way). */
  waits?: Card[];
  /** Whether each card holds a control of its own beside its words (the door's (i)). */
  controls?: boolean;
  onChoose?: (card: Card) => void;
}) {
  const [value, setValue] = useState<Card | null>(initial);
  const [pending, setPending] = useState<Card | null>(null);
  const choose = (card: Card) => {
    onChoose?.(card);
    if (card === value) return setPending(null);
    if (asks.includes(card)) return setPending(card);
    setPending(null);
    setValue(card);
  };
  return (
    <>
      <button type="button">Before</button>
      <RadioCards value={value} aria-label="The choice">
        {CARDS.map((card) => (
          <RadioCard
            key={card}
            value={card}
            data-card={card}
            label={`Card ${card}`}
            line={`What ${card} does.`}
            aside={
              controls ? <button type="button">{`About ${card}`}</button> : null
            }
            disabled={waits.includes(card)}
            onChoose={() => choose(card)}
          >
            {pending === card ? <p>{`${card} asks first`}</p> : null}
            {value === card && card === "two" ? (
              <input aria-label="Its own field" />
            ) : null}
          </RadioCard>
        ))}
      </RadioCards>
      <button type="button">After</button>
    </>
  );
}

const radio = (card: Card) =>
  screen.getByRole("radio", { name: `Card ${card}` });
const button = (name: string) => screen.getByRole("button", { name });
const checked = () =>
  screen
    .getAllByRole("radio")
    .filter((r) => r.getAttribute("aria-checked") === "true")
    .map((r) => r.textContent);

/** What a stop is, as the walk records it: a card's radio, or a control by its words. */
const stopOf = (el: Element | null) =>
  el?.getAttribute("role") === "radio"
    ? `radio ${el.textContent}`
    : (el?.textContent ?? el?.getAttribute("aria-label") ?? "");

/** Every stop Tab (Shift+Tab, `back`) meets between two controls, in order: what a keyboard walks through. */
async function walk(
  user: UserEvent,
  from: HTMLElement,
  to: HTMLElement,
  back = false,
) {
  act(() => from.focus());
  const met: string[] = [];
  // Bounded: a loop (the stop that hands focus back) never reaches `to`.
  for (let i = 0; i < 20 && document.activeElement !== to; i++) {
    await user.tab({ shift: back });
    if (document.activeElement !== to) met.push(stopOf(document.activeElement));
  }
  expect(document.activeElement, `stuck after: ${met.join(" | ")}`).toBe(to);
  return met;
}

/**
 * An arrow held down, as a finger holds a key: the group moves focus a tick after the keydown, and a card is chosen by a
 * focus that arrives while an arrow is down (add-step's and the code's looks' own helper).
 */
async function arrow(user: UserEvent, key: string, lands: () => HTMLElement) {
  await user.keyboard(`{${key}>}`);
  await waitFor(() => expect(lands()).toHaveFocus());
  await user.keyboard(`{/${key}}`);
}

/** An arrow pressed where it must move nothing: held past the tick the group would move on, then let go. */
async function arrowStays(user: UserEvent, key: string) {
  await user.keyboard(`{${key}>}`);
  await new Promise((r) => setTimeout(r, 30));
  await user.keyboard(`{/${key}}`);
}

describe("one stop a group", () => {
  it("★ Tab reaches the chosen card, and every control a card holds keeps its own stop, met in the page's order both ways", async () => {
    const user = userEvent.setup();
    render(<Harness initial="three" />);
    const forward = await walk(user, button("Before"), button("After"));
    // The chosen card's radio is the group's one radio stop, and the controls before it are met, never skipped.
    expect(forward).toEqual([
      "About one",
      "About two",
      "radio Card three",
      "About three",
      "About four",
    ]);
    // ★ Back the same way, never handed forward again by the group: a loop here is the bug, `walk` names where.
    const back = await walk(user, button("After"), button("Before"), true);
    expect(back).toEqual([...forward].reverse());
  });

  it("with none chosen, Tab reaches the first card, and Shift+Tab leaves the group", async () => {
    const user = userEvent.setup();
    render(<Harness initial={null} controls={false} />);
    expect(checked()).toEqual([]);
    expect(await walk(user, button("Before"), button("After"))).toEqual([
      "radio Card one",
    ]);
    expect(await walk(user, button("After"), button("Before"), true)).toEqual([
      "radio Card one",
    ]);
    // Reached is not chosen: only a press, Space or an arrow chooses.
    expect(checked()).toEqual([]);
  });
});

describe("the arrows", () => {
  it("★ move between the cards and choose as they go, round from the last to the first", async () => {
    const user = userEvent.setup();
    render(<Harness initial="one" />);
    act(() => radio("one").focus());
    await arrow(user, "ArrowDown", () => radio("two"));
    expect(checked()).toEqual(["Card two"]);
    await arrow(user, "ArrowDown", () => radio("three"));
    await arrow(user, "ArrowRight", () => radio("four"));
    await arrow(user, "ArrowDown", () => radio("one"));
    expect(checked()).toEqual(["Card one"]);
    await arrow(user, "ArrowUp", () => radio("four"));
    await arrow(user, "ArrowLeft", () => radio("three"));
    expect(checked()).toEqual(["Card three"]);
    // The card drawn chosen is the radio checked: the look and the radio follow the one value.
    expect(
      [...document.querySelectorAll<HTMLElement>("[data-card]")].map(
        (c) => c.dataset.state,
      ),
    ).toEqual(["off", "off", "on", "off"]);
    // The stop moved with the choice: from card two's control, Tab meets card three's radio, the one chosen now.
    expect(
      await walk(user, button("About two"), button("About three")),
    ).toEqual(["radio Card three"]);
  });

  it("pass a card that waits, landing on the next that can be chosen", async () => {
    const user = userEvent.setup();
    const onChoose = vi.fn();
    render(<Harness initial="two" waits={["three"]} onChoose={onChoose} />);
    expect(radio("three")).toBeDisabled();
    act(() => radio("two").focus());
    await arrow(user, "ArrowDown", () => radio("four"));
    expect(onChoose).toHaveBeenCalledWith("four");
    expect(onChoose).not.toHaveBeenCalledWith("three");
  });

  it("★ a choice that asks first only asks: the arrow lands on it unchosen, and the chosen card picked back lets its line go", async () => {
    const user = userEvent.setup();
    render(<Harness initial="two" asks={["three"]} />);
    act(() => radio("two").focus());
    await arrow(user, "ArrowDown", () => radio("three"));
    expect(screen.getByText("three asks first")).toBeInTheDocument();
    expect(checked()).toEqual(["Card two"]);
    // A press on the card already chosen is a choice too: it lets the pending line go.
    await arrow(user, "ArrowUp", () => radio("two"));
    expect(screen.queryByText("three asks first")).toBeNull();
    expect(checked()).toEqual(["Card two"]);
  });
});

describe("a radio's own keys, and a control's", () => {
  it("Space chooses the card in focus, and Enter does not (WAI-ARIA's radio)", async () => {
    const user = userEvent.setup();
    const onChoose = vi.fn();
    render(<Harness initial="one" onChoose={onChoose} />);
    // Focus with no arrow down is only focus.
    act(() => radio("three").focus());
    await user.keyboard("{Enter}");
    expect(onChoose).not.toHaveBeenCalled();
    expect(checked()).toEqual(["Card one"]);
    await user.keyboard(" ");
    expect(onChoose).toHaveBeenCalledWith("three");
    expect(checked()).toEqual(["Card three"]);
  });

  it("★ a control on a card takes its own keys: its arrows never move the group", async () => {
    const user = userEvent.setup();
    const onChoose = vi.fn();
    render(<Harness initial="two" onChoose={onChoose} />);
    for (const control of [
      button("About two"),
      screen.getByLabelText("Its own field"),
    ]) {
      act(() => control.focus());
      for (const key of ["ArrowDown", "ArrowUp"]) {
        await arrowStays(user, key);
        expect(control).toHaveFocus();
      }
    }
    expect(onChoose).not.toHaveBeenCalled();
    expect(checked()).toEqual(["Card two"]);
  });
});

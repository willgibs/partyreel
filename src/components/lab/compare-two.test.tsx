// @contract-for: src/components/lab/compare-two.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type BoardSpec, defineBoard } from "./board-spec";
import { comparePair, CompareTwo, type Spot, SpotCompare } from "./compare-two";

/**
 * THE TWO-UP'S CONTRACT (the revamp, 2026-09-16).
 *
 * The comparison holds NO selection of its own: A and B are the board's two
 * declared compare controls, set from the catalog's cards, so a reviewer can
 * put any two side by side without scrolling back to a dock (Will, 2026-09-16).
 * What is pinned is that resolution, the refusal to draw a thing against
 * itself, and that `differs` is always said. The wipe, the labels and the
 * spacing belong to `Compare` and to precedent.
 */
const SPEC: BoardSpec = defineBoard({
  id: "fixture",
  title: "A fixture board",
  question: "Which of these?",
  round: { n: 1, date: "2026-09-16", changed: "the first round" },
  verdict: { recommendation: "The first.", because: "It is." },
  asks: [],
  candidates: [
    { id: "one", name: "The first", one: "Warm.", rationale: "x" },
    { id: "two", name: "The second", one: "Cold.", rationale: "y" },
  ],
  departures: [],
  assets: [],
  sections: [{ id: "catalog", title: "The catalog", lede: "The two." }],
  catalog: { section: "catalog", compare: ["compareA", "compareB"] },
  controls: [
    {
      id: "compareA",
      label: "A",
      options: [
        { id: "one", label: "The first" },
        { id: "two", label: "The second" },
      ],
      default: "one",
    },
    {
      id: "compareB",
      label: "B",
      options: [
        { id: "one", label: "The first" },
        { id: "two", label: "The second" },
      ],
      default: "two",
    },
  ],
  links: { bible: [] },
});

const SPOTS: readonly Spot[] = [
  {
    id: "hero",
    name: "The home page's first screen",
    note: "Read the promise.",
  },
  { id: "footer", name: "The footer" },
];

describe("any two, side by side", () => {
  it("resolves A and B from the board's declared controls", () => {
    render(
      <CompareTwo
        spec={SPEC}
        state={{ compareA: "two", compareB: "one" }}
        render={(c) => <p>drawn: {c.name}</p>}
      />,
    );
    expect(screen.getByText("drawn: The first")).toBeInTheDocument();
    expect(screen.getByText("drawn: The second")).toBeInTheDocument();
  });

  it("falls back to each control's declared default", () => {
    const pair = comparePair(SPEC, {});
    expect([pair?.a.id, pair?.b.id]).toEqual(["one", "two"]);
  });

  it("says what differs, from the cards' own lines when none is given", () => {
    render(
      <CompareTwo spec={SPEC} state={{}} render={(c) => <p>{c.name}</p>} />,
    );
    expect(
      screen.getByText(/The first: Warm\. The second: Cold\./),
    ).toBeInTheDocument();
  });

  it("draws a thing against itself ONCE, and says how to bring the seam back", () => {
    render(
      <CompareTwo
        spec={SPEC}
        state={{ compareA: "one", compareB: "one" }}
        render={(c) => <p>drawn: {c.name}</p>}
      />,
    );
    expect(screen.getAllByText("drawn: The first")).toHaveLength(1);
    expect(screen.getByText(/Press B on another card/)).toBeInTheDocument();
  });

  it("renders nothing for a board that declares no compare controls", () => {
    const { container } = render(
      <CompareTwo
        spec={{ ...SPEC, catalog: { section: "catalog" } }}
        state={{}}
        render={() => <p>never</p>}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("the same places, under two cards", () => {
  it("draws every spot twice, once under each side", () => {
    render(
      <SpotCompare
        spec={SPEC}
        state={{}}
        spots={SPOTS}
        render={(spot, c) => (
          <p>
            {spot.id}/{c.id}
          </p>
        )}
      />,
    );
    for (const spot of SPOTS) {
      expect(screen.getByText(`${spot.id}/one`)).toBeInTheDocument();
      expect(screen.getByText(`${spot.id}/two`)).toBeInTheDocument();
      expect(screen.getByText(spot.name)).toBeInTheDocument();
    }
  });

  it("names each place, so a spot is judged where it lives", () => {
    render(
      <SpotCompare
        spec={SPEC}
        state={{}}
        spots={SPOTS}
        render={(spot, c) => <p>{`${spot.id}/${c.id}`}</p>}
      />,
    );
    expect(screen.getByText(SPOTS[0].note!)).toBeInTheDocument();
  });

  it("draws one copy of a place when A and B name the same card", () => {
    render(
      <SpotCompare
        spec={SPEC}
        state={{ compareA: "two", compareB: "two" }}
        spots={[SPOTS[0]]}
        render={(spot, c) => <p>{`${spot.id}/${c.id}`}</p>}
      />,
    );
    expect(screen.getAllByText("hero/two")).toHaveLength(1);
    expect(screen.getByText(/Press B on another card/)).toBeInTheDocument();
  });
});

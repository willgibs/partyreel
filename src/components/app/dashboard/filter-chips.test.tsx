import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FilterChips } from "./filter-chips";

/**
 * THE TRASH BADGE, GROUPED (the 1,000-row round's follow-on). Retired from production and drawn
 * only by the Library's compositions page, but it is still the shipped bar's record, and a record
 * that prints "1249" teaches the wrong count. The badge goes through `formatCount`.
 */
describe("the Trash chip's badge", () => {
  it("groups a count past 999", () => {
    render(<FilterChips active="all" onChange={() => {}} trashCount={1249} />);
    expect(screen.getByText("1,249")).toBeInTheDocument();
  });

  it("shows no badge on an empty bin", () => {
    render(<FilterChips active="all" onChange={() => {}} trashCount={0} />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});

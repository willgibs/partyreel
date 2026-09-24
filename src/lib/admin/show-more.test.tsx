import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LIST_PAGE } from "@/lib/admin/list-depth";
import { ShowMoreLine } from "@/lib/admin/show-more";

/**
 * THE LINE UNDER A BOUNDED OPERATOR LIST (the 1,000-row round, 2026-09-23): it says how deep the list
 * reads and links one page deeper, and it is absent when the list is whole, so a short inbox reads as
 * the whole inbox. Behaviour only: the link, its target and its absence.
 */
describe("ShowMoreLine", () => {
  it("says the depth and links one page deeper", () => {
    render(
      <ShowMoreLine shown={1200} more href="/admin/support?status=new&show=1250" />,
    );
    expect(screen.getByText(/Showing the newest 1,200\./)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: `Show ${LIST_PAGE} more` });
    expect(link).toHaveAttribute("href", "/admin/support?status=new&show=1250");
  });

  it("draws nothing when the list is whole", () => {
    const { container } = render(
      <ShowMoreLine shown={12} more={false} href="/admin/support?show=100" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

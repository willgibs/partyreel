// @contract-for: src/components/admin/inbox-pane.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InboxPane, type InboxPaneItem } from "./inbox-pane";

/**
 * THE INBOX PANE (admin-wiring, 2026-09-20; `density=hybrid`: "a table for
 * data, a pane for prose").
 *
 * What is pinned is that the SELECTION IS A URL. Nine cards cost about 1,400
 * pixels; the same nine beside the one you are reading cost a screen, and the
 * thing that makes that possible with no client component at all is `?id=`. A
 * row is a link, the chosen row says so to a screen reader, and a pane with
 * nothing chosen says so in words rather than drawing an empty box.
 */

const items: InboxPaneItem[] = [
  {
    id: "a",
    href: "/admin/support?status=new&id=a",
    who: "Grace Whitlock",
    subject: "Downloads are failing",
    preview: "We tried three times and",
    waited: "5h",
  },
  {
    id: "b",
    href: "/admin/support?status=new&id=b",
    who: "Samir Haddad",
    subject: "Can I move a plan?",
    preview: "I bought the Event Pass but",
    waited: "2d",
  },
];

describe("the selection is a URL", () => {
  it("makes every row a link that carries its own id", () => {
    render(
      <InboxPane items={items} selectedId="a" emptyList="none" emptyDetail="pick one">
        <p>The message</p>
      </InboxPane>,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", items[0].href);
    // The filter rides along, so choosing a message never drops the tab you
    // were reading it under.
    expect(links[1].getAttribute("href")).toContain("status=new");
  });

  it("marks the chosen row, and only that one", () => {
    render(
      <InboxPane items={items} selectedId="b" emptyList="none" emptyDetail="pick one">
        <p>The message</p>
      </InboxPane>,
    );
    const links = screen.getAllByRole("link");
    expect(links[1]).toHaveAttribute("aria-current", "true");
    expect(links[0]).not.toHaveAttribute("aria-current");
    expect(links[1]).toHaveAttribute("data-selected", "true");
  });
});

describe("the two empty cases are different sentences", () => {
  it("says the list is empty when there is nothing at all", () => {
    render(
      <InboxPane
        items={[]}
        selectedId={null}
        emptyList="Nothing in this filter."
        emptyDetail="Choose a message to read it."
      />,
    );
    expect(screen.getByText("Nothing in this filter.")).toBeInTheDocument();
    expect(screen.getByText("Choose a message to read it.")).toBeInTheDocument();
  });

  it("draws the reading pane when a message is given, and the prompt otherwise", () => {
    const { rerender } = render(
      <InboxPane items={items} selectedId="a" emptyList="none" emptyDetail="Choose one.">
        <p>The whole message, unwrapped.</p>
      </InboxPane>,
    );
    expect(screen.getByText("The whole message, unwrapped.")).toBeInTheDocument();
    expect(screen.queryByText("Choose one.")).not.toBeInTheDocument();

    rerender(
      <InboxPane items={items} selectedId={null} emptyList="none" emptyDetail="Choose one." />,
    );
    expect(screen.getByText("Choose one.")).toBeInTheDocument();
  });
});

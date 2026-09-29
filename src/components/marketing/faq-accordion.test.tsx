import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import type { FaqItem } from "@/components/marketing/faq-data";
import { HomeFaqAccordion } from "@/components/marketing/sections/home/faq-accordion";

/**
 * THE ONE FAQ (`loose-ends` r1, `faq-look=heading`). What fails here fails
 * quietly on the site: a question a screen reader cannot list as a heading, a
 * closed answer read aloud beside a button that says collapsed, or the home's
 * FAQ and the /events one drifting into two looks again, which is what the
 * board was drawn to end.
 */

const ITEMS: FaqItem[] = [
  { q: "Do my guests need an app?", a: "No. Guests scan a code." },
  { q: "Can I control what shows up?", a: "Yes. Turn on review." },
  { q: "What does it cost?", a: "Start free, upgrade when you host again." },
];

const button = (q: string) => screen.getByRole("button", { name: q });
const panelOf = (q: string) =>
  document.getElementById(button(q).getAttribute("aria-controls")!)!;

describe("the FAQ accordion", () => {
  it("makes every question a real heading around the button that opens it", () => {
    render(<FaqAccordion items={ITEMS} />);
    // An <h3> around a <button aria-expanded>, never a heading inside a
    // <summary> (which some screen readers drop from the heading list).
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(ITEMS.map((i) => i.q));
    for (const h of headings) {
      expect(within(h).getByRole("button")).toBeInTheDocument();
    }
    expect(document.querySelector("details, summary")).toBeNull();
  });

  it("starts closed, opens one at a time and closes on a second press", () => {
    render(<FaqAccordion items={ITEMS} />);
    for (const { q } of ITEMS) {
      expect(button(q)).toHaveAttribute("aria-expanded", "false");
    }

    fireEvent.click(button(ITEMS[0].q));
    expect(button(ITEMS[0].q)).toHaveAttribute("aria-expanded", "true");

    // Opening another closes the first: the list stays one quiet block.
    fireEvent.click(button(ITEMS[1].q));
    expect(button(ITEMS[0].q)).toHaveAttribute("aria-expanded", "false");
    expect(button(ITEMS[1].q)).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(button(ITEMS[1].q));
    expect(button(ITEMS[1].q)).toHaveAttribute("aria-expanded", "false");
  });

  it("labels each answer by its question and holds every closed one out of the page's reach", () => {
    render(<FaqAccordion items={ITEMS} />);
    for (const { q } of ITEMS) {
      const panel = panelOf(q);
      expect(panel).toHaveAttribute("role", "region");
      expect(panel).toHaveAttribute("aria-labelledby", button(q).id);
      // The grid-rows 0fr track only collapses a panel visually: inert is what
      // keeps a screen reader (and Tab) out of it.
      expect(panel).toHaveAttribute("inert");
    }
    fireEvent.click(button(ITEMS[2].q));
    expect(panelOf(ITEMS[2].q)).not.toHaveAttribute("inert");
    expect(panelOf(ITEMS[0].q)).toHaveAttribute("inert");
  });

  it("carries the noscript rule that opens every answer for a reader with scripting off", () => {
    const { container } = render(<FaqAccordion items={ITEMS} />);
    const list = container.querySelector("[data-faq]");
    expect(list).not.toBeNull();
    // The rule's selector and the list's marker are one string in two files'
    // worth of intent: rename one and a no-script reader gets closed panels.
    const rule = container.querySelector("noscript")?.innerHTML ?? "";
    expect(rule).toContain("[data-faq]");
    expect(rule).toContain("grid-template-rows:1fr");
    // Outside the divided list, or the last row grows a second bottom border.
    expect(list?.contains(container.querySelector("noscript"))).toBe(false);
  });
});

describe("one look on every page", () => {
  /** The rendered structure with per-instance ids and the caller-owned top gap left out. */
  const shape = (root: Element): string =>
    [...root.querySelectorAll("*")]
      .map((el) => {
        const cls = (el.getAttribute("class") ?? "")
          .split(/\s+/)
          .filter((c) => c && !/^mt-\d+$/.test(c))
          .join(".");
        return `${el.tagName.toLowerCase()}.${cls}`;
      })
      .join(" ");

  it("draws the home and pricing list and the /events and /features list identically", () => {
    const home = render(<HomeFaqAccordion items={ITEMS} />).container;
    const shared = render(<FaqAccordion items={ITEMS} />).container;
    expect(shape(home)).toBe(shape(shared));
    expect(shape(home).length).toBeGreaterThan(200);
  });

  it("leaves the top gap to its caller on the home and pricing, and keeps it on a band", () => {
    const home = render(<HomeFaqAccordion items={ITEMS} />).container;
    const shared = render(<FaqAccordion items={ITEMS} />).container;
    const gap = (root: Element) =>
      root.querySelector("[data-faq]")?.className.match(/\bmt-\d+\b/g);
    // The pricing block's Reveal carries its own mt-10; a second one inside it
    // would stack into an 80px hole.
    expect(gap(home)).toEqual(["mt-0"]);
    expect(gap(shared)).toEqual(["mt-10"]);
    // The home says its own gap and it wins over the default.
    const spaced = render(
      <HomeFaqAccordion items={ITEMS} className="mt-10" />,
    ).container;
    expect(gap(spaced)).toEqual(["mt-10"]);
  });
});

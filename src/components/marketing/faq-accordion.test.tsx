import { readFileSync } from "node:fs";
import { join } from "node:path";

import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import type { FaqItem } from "@/components/marketing/faq-data";
import { filesUnder } from "@/testing/source-tree";

/**
 * THE ONE FAQ (`loose-ends` r1, `faq-look=heading`). What fails here fails
 * quietly on the site: a question a screen reader cannot list as a heading, a
 * closed answer read aloud beside a button that says collapsed, a closed answer
 * that find-in-page walks past (a native <details> never did), or the home's
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

  it("labels each answer by its question", () => {
    render(<FaqAccordion items={ITEMS} />);
    for (const { q } of ITEMS) {
      const panel = panelOf(q);
      expect(panel).toHaveAttribute("role", "region");
      expect(panel).toHaveAttribute("aria-labelledby", button(q).id);
    }
  });

  it("never holds an answer out of reach in the server's markup, so a reader with scripting off has them all", () => {
    const html = renderToString(<FaqAccordion items={ITEMS} />);
    expect(html).not.toMatch(/\sinert/);
    expect(html).not.toMatch(/\shidden/);
    expect(html).toContain("<noscript>");
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

/**
 * FIND-IN-PAGE READS A CLOSED ANSWER, AND OPENS IT. A closed answer was `inert` on every browser, so the
 * browser's find skipped it, where a native <details> never did. Where the browser can find into hidden
 * content (it has `onbeforematch`) the closed panel is `hidden="until-found"` instead, and the browser's
 * own `beforematch` event, fired at the panel before it reveals it, is the accordion's cue to open that
 * question. jsdom has the property the accordion detects by but never fires the event, so the tests fire
 * what a browser fires.
 */
describe("find-in-page, where the browser can find into hidden content", () => {
  it("is the case jsdom is: it has onbeforematch, as Chromium does", () => {
    expect("onbeforematch" in document.body).toBe(true);
  });

  /** What a browser's find does to a hidden=until-found panel it has a match in. */
  const found = (panel: Element, inside: Element = panel) =>
    act(() => {
      inside.dispatchEvent(new Event("beforematch", { bubbles: true }));
      // The reveal itself is the browser's: it takes the attribute off after the event.
      if (panel.getAttribute("hidden") === "until-found") {
        panel.removeAttribute("hidden");
      }
    });

  it("hides every closed answer until it is found, never with inert, and leaves the open one alone", () => {
    render(<FaqAccordion items={ITEMS} />);
    for (const { q } of ITEMS) {
      expect(panelOf(q)).toHaveAttribute("hidden", "until-found");
      expect(panelOf(q)).not.toHaveAttribute("inert");
    }
    fireEvent.click(button(ITEMS[1].q));
    expect(panelOf(ITEMS[1].q)).not.toHaveAttribute("hidden");
    expect(panelOf(ITEMS[0].q)).toHaveAttribute("hidden", "until-found");
    expect(panelOf(ITEMS[2].q)).toHaveAttribute("hidden", "until-found");
    // A press on the open one closes it and hides it again.
    fireEvent.click(button(ITEMS[1].q));
    expect(panelOf(ITEMS[1].q)).toHaveAttribute("hidden", "until-found");
  });

  it("opens the question whose answer the browser found in, and closes the one that was open", () => {
    render(<FaqAccordion items={ITEMS} />);
    fireEvent.click(button(ITEMS[0].q));
    expect(button(ITEMS[0].q)).toHaveAttribute("aria-expanded", "true");

    const target = panelOf(ITEMS[2].q);
    found(target, within(target).getByText(ITEMS[2].a));

    expect(button(ITEMS[2].q)).toHaveAttribute("aria-expanded", "true");
    expect(button(ITEMS[0].q)).toHaveAttribute("aria-expanded", "false");
    expect(button(ITEMS[1].q)).toHaveAttribute("aria-expanded", "false");
    expect(panelOf(ITEMS[2].q)).not.toHaveAttribute("hidden");
    // The answer that was open is closed and hidden again, found or not.
    expect(panelOf(ITEMS[0].q)).toHaveAttribute("hidden", "until-found");
  });

  it("keeps every question a heading around its button once an answer has been found", () => {
    render(<FaqAccordion items={ITEMS} />);
    found(panelOf(ITEMS[1].q));
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(ITEMS.map((i) => i.q));
    for (const h of headings) {
      expect(within(h).getByRole("button")).toBeInTheDocument();
    }
  });

  it("ignores a beforematch that is not inside an answer", () => {
    const { container } = render(<FaqAccordion items={ITEMS} />);
    act(() => {
      container
        .querySelector("[data-faq]")!
        .dispatchEvent(new Event("beforematch", { bubbles: true }));
    });
    for (const { q } of ITEMS) {
      expect(button(q)).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("gives the collapse a content-visibility clock, or a closing answer would vanish as it is hidden", () => {
    // `hidden=until-found` is `content-visibility: hidden` to the browser, which drops the contents at
    // once. Listed beside the height with allow-discrete, it holds them for the whole collapse.
    const css = readFileSync(
      join(process.cwd(), "src/app/(marketing)/marketing.css"),
      "utf8",
    ).replace(/\/\*[\s\S]*?\*\//g, "");
    const rule =
      /\[data-mkt\] \.mkt-acc-panel \{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(rule, "the panel's rule was not found").toContain(
      "grid-template-rows",
    );
    expect(rule).toMatch(
      /content-visibility\s+var\(--mkt-acc-collapse\)\s+allow-discrete/,
    );
  });
});

/**
 * WHERE THE BROWSER CANNOT FIND INTO HIDDEN CONTENT, the closed answer is `inert`, as it always was:
 * out of the accessibility tree and the tab order, and (a limit of the browser, not a choice) unfound.
 */
describe("a browser that cannot find into hidden content", () => {
  const own = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "onbeforematch",
  );
  beforeEach(() => {
    delete (HTMLElement.prototype as { onbeforematch?: unknown }).onbeforematch;
  });
  afterEach(() => {
    if (own) Object.defineProperty(HTMLElement.prototype, "onbeforematch", own);
  });

  it("holds every closed answer out of the page's reach with inert, and never hides it", () => {
    expect("onbeforematch" in document.body).toBe(false);
    render(<FaqAccordion items={ITEMS} />);
    for (const { q } of ITEMS) {
      const panel = panelOf(q);
      // The grid-rows 0fr track only collapses a panel visually: inert is what
      // keeps a screen reader (and Tab) out of it.
      expect(panel).toHaveAttribute("inert");
      expect(panel).not.toHaveAttribute("hidden");
    }
    fireEvent.click(button(ITEMS[2].q));
    expect(panelOf(ITEMS[2].q)).not.toHaveAttribute("inert");
    expect(panelOf(ITEMS[0].q)).toHaveAttribute("inert");
  });

  it("does not listen for beforematch", () => {
    render(<FaqAccordion items={ITEMS} />);
    act(() => {
      panelOf(ITEMS[1].q).dispatchEvent(
        new Event("beforematch", { bubbles: true }),
      );
    });
    expect(button(ITEMS[1].q)).toHaveAttribute("aria-expanded", "false");
  });
});

describe("one look on every page", () => {
  it("has one accordion component, not a wrapper per page", () => {
    // The home and pricing once went through `HomeFaqAccordion`, a wrapper that only took the top gap off
    // (kept for a test's sake). Every page renders `FaqAccordion` itself, so what one page draws is what
    // the others do.
    const found = filesUnder("src/components/marketing")
      .map((f) => f.slice("src/components/marketing/".length))
      .filter((f) => /faq-accordion\.tsx$/.test(f));
    expect(found).toEqual(["faq-accordion.tsx"]);
  });

  it("keeps its top gap on a band, and gives it up to a caller that carries one", () => {
    const gap = (root: Element) =>
      root.querySelector("[data-faq]")?.className.match(/\bmt-\d+\b/g);
    expect(gap(render(<FaqAccordion items={ITEMS} />).container)).toEqual([
      "mt-10",
    ]);
    // The pricing block's Reveal carries its own mt-10; a second one inside it would stack into an 80px hole.
    expect(
      gap(render(<FaqAccordion items={ITEMS} className="mt-0" />).container),
    ).toEqual(["mt-0"]);
  });
});

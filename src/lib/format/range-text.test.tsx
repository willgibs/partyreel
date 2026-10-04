import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RangeText } from "@/lib/format/range-text";
import { dashRange, formatEventDate, spokenRange } from "@/lib/utils";

/**
 * Q2: A RANGE IS SEEN WITH ITS DASH AND HEARD WITH ITS "TO". A reader's own text (the accessibility tree's name
 * for what is drawn) is computed here from the DOM the way a reader takes it: skip what `aria-hidden` hides, keep
 * what is visually hidden. The eye's text is what is not `sr-only`.
 */

/** What the eye reads: every text node outside a visually hidden span. */
function seen(root: HTMLElement): string {
  const clone = root.cloneNode(true) as HTMLElement;
  for (const hidden of clone.querySelectorAll(".sr-only")) hidden.remove();
  return clone.textContent ?? "";
}

/** What a reader reads: every text node outside an aria-hidden span, with the visually hidden ones kept. */
function heard(root: HTMLElement): string {
  const clone = root.cloneNode(true) as HTMLElement;
  for (const hidden of clone.querySelectorAll('[aria-hidden="true"]')) {
    hidden.remove();
  }
  return (clone.textContent ?? "").replace(/\s+/g, " ").trim();
}

const SAMPLES: [string, string, string][] = [
  // [what the formatter builds, what the eye reads, what a reader says]
  [
    formatEventDate("2026-10-03", "2026-10-05"),
    "October 3–5, 2026",
    "October 3 to 5, 2026",
  ],
  [
    formatEventDate("2026-10-30", "2026-11-02"),
    "October 30 – November 2, 2026",
    "October 30 to November 2, 2026",
  ],
  [
    formatEventDate("2026-12-30", "2027-01-02"),
    "December 30, 2026 – January 2, 2027",
    "December 30, 2026 to January 2, 2027",
  ],
  // The dashboard's own ranges (`lib/dashboard/when.ts`) are built from `dashRange` too.
  [dashRange("Fri", "Sun"), "Fri–Sun", "Fri to Sun"],
  [dashRange("Oct 3", "Oct 5"), "Oct 3 – Oct 5", "Oct 3 to Oct 5"],
];

describe("RangeText", () => {
  it.each(SAMPLES)(
    "%s: the eye keeps the en dash exactly, a reader hears 'to'",
    (built, drawn, said) => {
      const { container } = render(
        <p>
          <RangeText text={built} />
        </p>,
      );
      const p = container.firstElementChild as HTMLElement;
      expect(seen(p)).toBe(drawn);
      expect(heard(p)).toBe(said);
    },
  );

  it("hides every dash from a reader and says 'to' in a span that is hidden from the eye and from a copy", () => {
    const { container } = render(
      <RangeText text={formatEventDate("2026-10-03", "2026-10-05")} />,
    );
    const dash = container.querySelector('[aria-hidden="true"]');
    expect(dash?.textContent).toBe("–");
    const to = container.querySelector(".sr-only");
    expect(to?.textContent?.trim()).toBe("to");
    // Selecting the range on the screen never copies the hidden word.
    expect(to?.className).toContain("select-none");
  });

  it("a day with no dash is its own text, not a wrapper: nothing to read twice", () => {
    const { container } = render(
      <p>
        <RangeText text="October 3, 2026" />
      </p>,
    );
    const p = container.firstElementChild as HTMLElement;
    expect(p.innerHTML).toBe("October 3, 2026");
  });

  it("is one item to its parent, so a flex row with a gap never splits a range into pieces", () => {
    const { container } = render(
      <div className="flex gap-3">
        <RangeText text="October 3–5, 2026" />
      </div>,
    );
    expect(container.firstElementChild?.children).toHaveLength(1);
  });

  it("says every dash of a text that has more than one", () => {
    const { container } = render(
      <p>
        <RangeText text="Fri–Sun, then Oct 9 – Oct 11" />
      </p>,
    );
    const p = container.firstElementChild as HTMLElement;
    expect(heard(p)).toBe("Fri to Sun, then Oct 9 to Oct 11");
    expect(container.querySelectorAll(".sr-only")).toHaveLength(2);
  });
});

describe("spokenRange", () => {
  it.each(SAMPLES)("%s reads as it is said", (built, _drawn, said) => {
    expect(spokenRange(built)).toBe(said);
  });

  it("leaves a day, and a text with no dash, exactly as it came", () => {
    expect(spokenRange("June 1, 2026")).toBe("June 1, 2026");
    expect(spokenRange("No date set")).toBe("No date set");
    expect(spokenRange("")).toBe("");
  });

  it("agrees with the markup on what a reader is told", () => {
    for (const [built] of SAMPLES) {
      const { container, unmount } = render(
        <p>
          <RangeText text={built} />
        </p>,
      );
      expect(heard(container.firstElementChild as HTMLElement)).toBe(
        spokenRange(built),
      );
      unmount();
    }
  });
});

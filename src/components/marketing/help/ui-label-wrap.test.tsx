/**
 * A QUOTED APP STRING IS A CHIP THAT STAYS WHOLE UNLESS IT COULD NEVER FIT A LINE (red-team 54b's LOW). `<UiLabel>` was
 * `whitespace-nowrap`, so a quoted message longer than a phone's line ran past the edge of the screen and was cut
 * mid-word: `/help/notifications-and-emails` at 375 lost the end of "Your Partyreel event was removed (recoverable for
 * now)" (54 px off) and `/help/messages-guests-might-see` five of its messages (one 173 px off). Now a label longer than
 * a line wraps on a phone like the value plate, each line of it boxed in turn, and every shorter one is unchanged. jsdom has no
 * layout, so this pins the contract (which chips may wrap) over the real articles; the page at 375 and 1440 in a browser
 * is the other half.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UiLabel } from "@/components/marketing/mdx/spec-shared";

/** The chip as drawn, in a container of its own (many articles quote the same words). */
const chip = (text: string) => {
  const { container } = render(<UiLabel>{text}</UiLabel>);
  return container.firstElementChild as HTMLElement;
};

describe("the chip", () => {
  it("★ lets a label too long for a line wrap, each line of it boxed, and never cuts it", () => {
    const long = chip("Your Partyreel event was removed (recoverable for now)");
    expect(long).toHaveAttribute("data-ui-label", "wraps");
    expect(long.className).toContain("box-decoration-clone");
    // Wrapping on a phone (below sm), whole as it always was from sm up, where the column holds it.
    expect(long.className).toMatch(/(^| )whitespace-normal( |$)/);
    expect(long.className).toContain("sm:whitespace-nowrap");
    expect(long.className).not.toMatch(/(^| )whitespace-nowrap( |$)/);
  });

  it("keeps a label a line holds exactly as it was: whole, never split across two", () => {
    const short = chip("Items in Deleted are about to be cleared");
    expect(short).toHaveAttribute("data-ui-label", "whole");
    expect(short.className).toContain("whitespace-nowrap");
    expect(short.className).not.toContain("box-decoration-clone");
  });

  it("draws both with the one chip's own ground and border", () => {
    for (const text of ["Approve all", "x".repeat(60)]) {
      const el = chip(text);
      expect(el.className).toContain("rounded-md");
      expect(el.className).toContain("border");
      expect(el.className).toContain("bg-muted");
    }
  });
});

/**
 * Over the real articles: the chips the red-teams measured are the ones that wrap, and no article quotes a label that
 * could be cut. A label's length is the whole of the rule, so the two longest in each article are named as they
 * are said, and every label past the line is one the component lets wrap.
 */
describe("the articles", () => {
  const dir = path.join(process.cwd(), "content/help");
  const labels = readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .flatMap((f) =>
      [
        ...readFileSync(path.join(dir, f), "utf8").matchAll(
          /<UiLabel>([\s\S]*?)<\/UiLabel>/g,
        ),
      ].map((m) => ({ file: f, text: m[1]!.replace(/\s+/g, " ").trim() })),
    );

  it("★ quotes the two email subjects red-team 54b saw cut, and both may wrap", () => {
    const cut = [
      "We reduced your Partyreel storage to fit your plan",
      "Your Partyreel event was removed (recoverable for now)",
    ];
    for (const text of cut) {
      expect(
        labels.some(
          (l) => l.file === "notifications-and-emails.mdx" && l.text === text,
        ),
      ).toBe(true);
      expect(chip(text)).toHaveAttribute("data-ui-label", "wraps");
    }
  });

  it("every label in every article is whole or may wrap, never neither", () => {
    expect(labels.length).toBeGreaterThan(100);
    for (const { text } of labels) {
      const el = chip(text);
      const mode = el.getAttribute("data-ui-label");
      expect(["whole", "wraps"]).toContain(mode);
      // The rule is the label's own length, so a label that is whole can always be said on one line.
      expect(mode === "whole").toBe(text.length <= 44);
    }
  });
});

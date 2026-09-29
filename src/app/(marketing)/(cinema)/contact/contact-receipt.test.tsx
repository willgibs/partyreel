import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CONTACT_TOPICS } from "@/lib/constants/contact";

import {
  ContactReceipt,
  receiptFrom,
  type ContactReceiptData,
} from "./contact-receipt";

const NOW = new Date(2026, 8, 29, 14, 30);

function values(over: Partial<Parameters<typeof receiptFrom>[0]> = {}) {
  return {
    name: "Sam Okafor",
    email: "sam@example.com",
    topic: "billing" as const,
    subject: "Storage for a 300-guest wedding",
    message: "Working out which plan covers a full weekend of video.",
    ...over,
  };
}

describe("receiptFrom: what the card says back", () => {
  it("greets by first name when it is a clean word", () => {
    expect(receiptFrom(values(), NOW).greeting).toBe("Sam");
    expect(
      receiptFrom(values({ name: "  Mary-Ann   Lee " }), NOW).greeting,
    ).toBe("Mary-Ann");
    expect(receiptFrom(values({ name: "Shaun O’Brien" }), NOW).greeting).toBe(
      "Shaun",
    );
    expect(receiptFrom(values({ name: "李雷" }), NOW).greeting).toBe("李雷");
  });

  // "On its way, Dr." is worse than no name: a title, an initial, a digit or an
  // emoji as the first word all fall back to the plain line.
  it.each([
    ["a title with a stop", "Dr. Priya Nair"],
    ["a bare title", "Dr Priya Nair"],
    ["a bare title, any case", "MRS Okafor"],
    ["an initial", "J Smith"],
    ["a handle with a digit", "R2D2"],
    ["an emoji", "😀 Sam"],
    ["only spaces", "   "],
  ])("does not greet %s", (_why, name) => {
    expect(receiptFrom(values({ name }), NOW).greeting).toBeNull();
  });

  it("keeps the subject when one was typed, else the message's opening", () => {
    expect(receiptFrom(values(), NOW).excerpt).toBe(
      "Storage for a 300-guest wedding",
    );
    const noSubject = receiptFrom(values({ subject: "  " }), NOW);
    expect(noSubject.excerpt).toBe(
      "Working out which plan covers a full weekend of video.",
    );
    expect(receiptFrom(values({ subject: undefined }), NOW).excerpt).toContain(
      "Working out",
    );
  });

  it("collapses the message's whitespace and cuts it before the card grows an essay", () => {
    const long = receiptFrom(
      values({
        subject: "",
        message: `line one\n\n  line two ${"x".repeat(400)}`,
      }),
      NOW,
    );
    expect(long.excerpt.startsWith("line one line two ")).toBe(true);
    expect(long.excerpt.length).toBeLessThanOrEqual(140);
  });

  it("stamps the day it was sent, in ink capitals", () => {
    expect(receiptFrom(values(), NOW).postmark).toEqual({
      month: "SEP",
      day: "29",
    });
    expect(receiptFrom(values(), new Date(2026, 0, 3)).postmark).toEqual({
      month: "JAN",
      day: "3",
    });
  });

  it("carries the address the reply goes to, without stray spaces", () => {
    expect(receiptFrom(values({ email: " sam@example.com " }), NOW).email).toBe(
      "sam@example.com",
    );
  });
});

const RECEIPT: ContactReceiptData = {
  greeting: "Sam",
  email: "sam@example.com",
  topic: "billing",
  excerpt: "Storage for a 300-guest wedding",
  postmark: { month: "SEP", day: "29" },
};

describe("ContactReceipt", () => {
  it("names what happened, to a screen reader first, and takes the focus", () => {
    render(<ContactReceipt receipt={RECEIPT} onAnother={vi.fn()} />);
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveTextContent("Message sent. On its way, Sam.");
    // The form that held the focus is gone: the news must have it.
    expect(heading).toHaveFocus();
  });

  it("falls back to a plain line when there is no name to greet", () => {
    render(
      <ContactReceipt
        receipt={{ ...RECEIPT, greeting: null }}
        onAnother={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Message sent. On its way.",
    );
  });

  it("holds the sender's own words and where the reply goes", () => {
    render(<ContactReceipt receipt={RECEIPT} onAnother={vi.fn()} />);
    expect(screen.getByText("Plans & billing")).toBeInTheDocument();
    expect(
      screen.getByText("Storage for a 300-guest wedding"),
    ).toBeInTheDocument();
    expect(screen.getByText("sam@example.com")).toBeInTheDocument();
    // The one reply promise, verbatim, from its one home.
    expect(
      screen.getByText("Every note gets a reply, usually within a day."),
    ).toBeInTheDocument();
  });

  it("offers the topic's own first answer while they wait", () => {
    render(<ContactReceipt receipt={RECEIPT} onAnother={vi.fn()} />);
    const first = CONTACT_TOPICS.find((t) => t.value === "billing")!.hint!
      .links[0];
    const link = screen.getByRole("link", { name: new RegExp(first.label) });
    expect(link).toHaveAttribute("href", first.href);
    expect(link).toHaveTextContent(/While you wait/);
  });

  it("falls back to the help center for a topic with no answers of its own", () => {
    render(
      <ContactReceipt
        receipt={{ ...RECEIPT, topic: "other" }}
        onAnother={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("link", { name: /Browse the help center/ }),
    ).toHaveAttribute("href", "/help");
  });

  it("sends another on a press of the button", async () => {
    const onAnother = vi.fn();
    render(<ContactReceipt receipt={RECEIPT} onAnother={onAnother} />);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Send another" }));
    expect(onAnother).toHaveBeenCalledTimes(1);
  });

  it("draws its check as decoration only", () => {
    const { container } = render(
      <ContactReceipt receipt={RECEIPT} onAnother={vi.fn()} />,
    );
    const check = container.querySelector(".mkt-check")!;
    expect(check).toHaveAttribute("aria-hidden", "true");
    expect(within(check as HTMLElement).queryByRole("img")).toBeNull();
  });
});

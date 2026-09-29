import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CONTACT_TOPICS } from "@/lib/constants/contact";

import { ContactForm } from "./contact-form";

// The action is a Server Function (service-role insert + Resend); the form is
// judged on what it shows and sends, never on the write path, which
// actions.ts and the rate gate own.
vi.mock("./actions", () => ({ submitContactForm: vi.fn() }));
vi.mock("@/lib/analytics/web", () => ({ track: vi.fn() }));

const SUBJECTS = {
  "upgrade-downgrade-or-cancel": {
    title: "Upgrade, downgrade, or cancel",
    topic: "billing" as const,
  },
};

async function pickTopic(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
) {
  await user.click(screen.getByRole("combobox"));
  await user.click(await screen.findByRole("option", { name: label }));
}

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("the topic's own answers", () => {
  it("shows the picked topic's note and links, and swaps them on the next pick", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    // Nothing until a topic is picked: a hint is deflection, never a wall.
    expect(
      screen.queryByRole("link", { name: /Upgrade, downgrade/ }),
    ).toBeNull();

    await pickTopic(user, "Plans & billing");
    const billing = CONTACT_TOPICS.find((t) => t.value === "billing")!.hint!;
    for (const link of billing.links) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute(
        "href",
        link.href,
      );
    }

    await pickTopic(user, "Something broke");
    expect(
      screen.queryByRole("link", { name: /Upgrade, downgrade/ }),
    ).toBeNull();
    const bug = CONTACT_TOPICS.find((t) => t.value === "bug")!.hint!;
    for (const link of bug.links) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute(
        "href",
        link.href,
      );
    }

    // "Something else" names no fast path: the hint leaves rather than
    // repeating the last topic's.
    await pickTopic(user, "Something else");
    expect(screen.queryByRole("link", { name: bug.links[0].label })).toBeNull();
  });

  it("announces the note through one persistent status region", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("");
    await pickTopic(user, "Something broke");
    const bug = CONTACT_TOPICS.find((t) => t.value === "bug")!.hint!;
    expect(status).toHaveTextContent(bug.text);
    expect(status).toHaveTextContent(bug.links[0].label);
  });
});

describe("the help handoff (?about=<slug>)", () => {
  it("prefills the subject and picks the topic for a known slug", async () => {
    window.history.replaceState(
      {},
      "",
      "/contact?about=upgrade-downgrade-or-cancel",
    );
    render(<ContactForm helpSubjects={SUBJECTS} />);
    expect(
      await screen.findByDisplayValue("Help: Upgrade, downgrade, or cancel"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("combobox")).getByText("Plans & billing"),
    ).toBeInTheDocument();
    // The picked topic's own answers arrive with it.
    expect(
      screen.getByRole("link", { name: "Receipts and invoices" }),
    ).toBeInTheDocument();
  });

  it.each(["constructor", "__proto__", "toString", "hasOwnProperty", "nope"])(
    "leaves the form alone for %s (an inherited name is no slug)",
    async (slug) => {
      window.history.replaceState({}, "", `/contact?about=${slug}`);
      render(<ContactForm helpSubjects={SUBJECTS} />);
      // Let the mount effect run; nothing may reach a field.
      await Promise.resolve();
      expect(screen.getByPlaceholderText("One line, if it helps")).toHaveValue(
        "",
      );
      expect(
        within(screen.getByRole("combobox")).getByText("Pick a topic"),
      ).toBeInTheDocument();
    },
  );
});

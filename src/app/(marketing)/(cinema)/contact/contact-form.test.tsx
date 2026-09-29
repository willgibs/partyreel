import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CONTACT_TOPICS } from "@/lib/constants/contact";

import { track } from "@/lib/analytics/web";

import { setReducedMotion } from "../../../../../vitest.setup";
import { submitContactForm } from "./actions";
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

beforeEach(() => {
  // sonner and the analytics stub are module-level spies: each test starts clean.
  vi.clearAllMocks();
  vi.mocked(submitContactForm).mockReset();
});

afterEach(() => {
  window.history.replaceState({}, "", "/");
  vi.useRealTimers();
});

/** A whole valid note, the way a person fills it: topic first, then the fields. */
async function writeNote(
  user: ReturnType<typeof userEvent.setup>,
  topic = "Plans & billing",
) {
  await pickTopic(user, topic);
  await user.type(screen.getByPlaceholderText("Your name"), "Sam Okafor");
  await user.type(
    screen.getByPlaceholderText("you@example.com"),
    "sam@example.com",
  );
  await user.type(
    screen.getByPlaceholderText("What's going on?"),
    "Working out which plan covers a full weekend of video.",
  );
}

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

describe("before the form is hydrated", () => {
  // The server's markup is what a browser holds until React attaches the submit
  // handler: a press or an Enter then is the browser's own GET, which would put
  // the name, the address and the message in the URL. So the button waits.
  it("renders the send button disabled, so no early press or Enter can submit", () => {
    const html = renderToString(<ContactForm />);
    const button = /<button[^>]*type="submit"[^>]*>/.exec(html)?.[0] ?? "";
    expect(button, "no submit button in the server markup").not.toBe("");
    // The attribute, not the Button's own `disabled:` variant classes.
    expect(button).toMatch(/\sdisabled(=""|\s|>)/);
  });

  it("enables it once the form is live", () => {
    render(<ContactForm />);
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });
});

describe("sending a note", () => {
  it("asks for a topic before anything leaves the page", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(
      await screen.findByText(
        "Pick a topic so your note lands in the right place.",
      ),
    ).toBeInTheDocument();
    expect(submitContactForm).not.toHaveBeenCalled();
  });

  it("swaps the form for the receipt and thanks once, on the card", async () => {
    setReducedMotion(true);
    vi.mocked(submitContactForm).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ContactForm />);
    await writeNote(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    const heading = await screen.findByRole("heading", {
      level: 3,
      name: /On its way, Sam/,
    });
    expect(heading).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Send message" })).toBeNull();
    expect(submitContactForm).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: "billing",
        name: "Sam Okafor",
        email: "sam@example.com",
      }),
    );
    expect(track).toHaveBeenCalledWith("contact_submit");
    // The card is the receipt: a toast saying the same thanks is gone
    // (ROADMAP: "a sent note gets the card and a toast saying the same thanks").
    expect(toast.success).not.toHaveBeenCalled();
    // The sender's own words come back on the card.
    expect(screen.getByText("Plans & billing")).toBeInTheDocument();
    expect(screen.getByText("sam@example.com")).toBeInTheDocument();
  });

  it("lets the form leave, inert, before the receipt arrives (motion allowed)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(submitContactForm).mockResolvedValue({ ok: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<ContactForm />);
    await writeNote(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    // The action has answered: the form is on its way out, and nothing in it
    // takes another press; the receipt waits for the exit to finish.
    await waitFor(() =>
      expect(container.querySelector("form")).toHaveAttribute("inert"),
    );
    expect(screen.queryByRole("heading", { name: /On its way/ })).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(
      await screen.findByRole("heading", { name: /On its way, Sam/ }),
    ).toBeInTheDocument();
    expect(container.querySelector("form")).toBeNull();
  });

  it("returns an empty form, with the keyboard on its first field, for Send another", async () => {
    setReducedMotion(true);
    vi.mocked(submitContactForm).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ContactForm />);
    await writeNote(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));
    await screen.findByRole("heading", { name: /On its way/ });

    await user.click(screen.getByRole("button", { name: "Send another" }));
    expect(screen.getByRole("combobox")).toHaveFocus();
    expect(screen.getByPlaceholderText("Your name")).toHaveValue("");
    expect(screen.getByPlaceholderText("What's going on?")).toHaveValue("");
    expect(
      within(screen.getByRole("combobox")).getByText("Pick a topic"),
    ).toBeInTheDocument();
  });

  it("keeps the help article's context across Send another", async () => {
    setReducedMotion(true);
    vi.mocked(submitContactForm).mockResolvedValue({ ok: true });
    window.history.replaceState(
      {},
      "",
      "/contact?about=upgrade-downgrade-or-cancel",
    );
    const user = userEvent.setup();
    render(<ContactForm helpSubjects={SUBJECTS} />);
    await screen.findByDisplayValue("Help: Upgrade, downgrade, or cancel");
    await user.type(screen.getByPlaceholderText("Your name"), "Sam Okafor");
    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "sam@example.com",
    );
    await user.type(
      screen.getByPlaceholderText("What's going on?"),
      "How do I move from a pass to Pro?",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));
    await screen.findByRole("heading", { name: /On its way/ });

    await user.click(screen.getByRole("button", { name: "Send another" }));
    expect(
      screen.getByDisplayValue("Help: Upgrade, downgrade, or cancel"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("combobox")).getByText("Plans & billing"),
    ).toBeInTheDocument();
  });

  it("treats a send that never answers as a failed send, words kept", async () => {
    vi.mocked(submitContactForm).mockRejectedValue(
      new TypeError("Failed to fetch"),
    );
    const user = userEvent.setup();
    render(<ContactForm />);
    await writeNote(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByPlaceholderText("Your name")).toHaveValue("Sam Okafor");
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });

  it("keeps the form and every word typed when the send fails", async () => {
    vi.mocked(submitContactForm).mockResolvedValue({
      ok: false,
      code: "send_failed",
    });
    const user = userEvent.setup();
    render(<ContactForm />);
    await writeNote(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.queryByRole("heading", { name: /On its way/ })).toBeNull();
    expect(screen.getByPlaceholderText("Your name")).toHaveValue("Sam Okafor");
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
    expect(track).not.toHaveBeenCalled();
  });
});

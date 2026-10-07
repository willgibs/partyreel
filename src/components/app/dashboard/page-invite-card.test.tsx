import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { dismissPageInviteAction } from "@/app/(app)/account/profile/actions";
import { PROFILE_SETUP_PATH } from "@/app/(app)/account/profile/invite";

import type { Lit } from "./page-invite-light";
import { PageInviteCard } from "./page-invite-card";

vi.mock("@/app/(app)/account/profile/actions", () => ({
  dismissPageInviteAction: vi.fn(),
}));
const readInviteLight = vi.fn();
vi.mock("./page-invite-read", () => ({
  readInviteLight: () => readInviteLight(),
}));
const captureWarning = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...args: unknown[]) => captureWarning(...args),
}));

/**
 * THE INVITATION (`identity-profile` r1, `prompt=claim`) AS ONE LIT PLATE (`account-moments` r2, `invite=plate`): one door
 * into the setup, a Not now that answers at once and is remembered (the dashboard decides whether it renders at all), the
 * promise that nothing is public until she finishes, and a light that arrives once her photographs are read. Pinned: the
 * door, the words, the dismissal, the plate standing complete before its light, the light arriving in her photographs'
 * hues, and a read that finds nothing leaving it lit rather than dark.
 */

/** A light as the ladder would hand one back, so the plate is pinned to what it draws and never to the maths. */
const amber: Lit = {
  edge: { hues: [58, 58, 58, 58, 263, 263], c: 0.12 },
  fall: [40, 40, 40, 40, 263, 263],
  fill: 0.7,
  from: "photographs",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(dismissPageInviteAction).mockReset();
  readInviteLight.mockResolvedValue({ lit: amber, asked: 6, read: 6 });
});

describe("the page setup's invitation", () => {
  it("opens the setup", () => {
    render(<PageInviteCard />);
    expect(
      screen.getByRole("link", { name: "Choose what shows" }),
    ).toHaveAttribute("href", PROFILE_SETUP_PATH);
  });

  // crumbs-44 (from `profile-setup`): the button repeated the card's title, so it said what twice and why never. It carries
  // the reason, and the title stays the plate's alone. RESHAPED by account-moments r2: the title's words changed ("Set up
  // your page" is now "Your page, when you're ready"); the scar is the same, the key never says the title again.
  it("says the setup once: the key carries its reason, never the title again", () => {
    render(<PageInviteCard />);
    const title = screen.getByRole("heading", {
      name: "Your page, when you’re ready",
    });
    expect(title).toBeInTheDocument();
    expect(screen.getAllByText(title.textContent!)).toHaveLength(1);
    expect(
      screen.queryByRole("link", { name: title.textContent! }),
    ).not.toBeInTheDocument();
  });

  it("★ is a region named by its title, holding the heading, the promise and the key together", () => {
    render(<PageInviteCard />);
    const plate = screen.getByRole("region", {
      name: "Your page, when you’re ready",
    });
    expect(plate).toHaveTextContent("Nothing is public until you finish.");
    expect(plate).toContainElement(
      screen.getByRole("link", { name: "Choose what shows" }),
    );
  });

  // ★ THE CONSENT MODEL IS NEVER DRAWN AWAY (profiles-social.md): a page is public only by her choice, and claiming a handle
  // is the consent act, so no word on the plate says her page is live, and the one way on is the setup that claims it last.
  it("★ promises, never claims: nothing on it says she is public, and its one way on is the setup", () => {
    render(<PageInviteCard />);
    const plate = screen.getByRole("region");
    expect(plate.textContent).not.toMatch(
      /\bis live\b|\bis public\b(?! until)|\bpublished\b/i,
    );
    expect(plate.querySelectorAll("a")).toHaveLength(1);
    expect(plate.querySelector("a")).toHaveAttribute(
      "href",
      PROFILE_SETUP_PATH,
    );
  });

  it("wears the slab's ground, which carries every token a dark piece on paper reads", () => {
    render(<PageInviteCard />);
    const plate = screen.getByRole("region");
    expect(plate.classList.contains("surface-ink")).toBe(true);
    expect(plate.classList.contains("dark")).toBe(false);
  });

  // crumbs-46: /me wears the invitation as its head (an account with no handle keeps her uploads, likes and connections
  // there), and the user menu's Your profile has no other door to the setup, so there it stands: a Not now would take the
  // only way on from the page she chose to open, and it would hide the dashboard's too.
  it("stands without a Not now where the page asks it not to be dismissible", () => {
    render(<PageInviteCard dismissible={false} />);
    expect(
      screen.getByRole("link", { name: "Choose what shows" }),
    ).toHaveAttribute("href", PROFILE_SETUP_PATH);
    expect(
      screen.queryByRole("button", { name: "Not now" }),
    ).not.toBeInTheDocument();
  });

  it("is dismissible wherever the page says nothing, as the dashboard's is", () => {
    render(<PageInviteCard />);
    expect(screen.getByRole("button", { name: "Not now" })).toBeInTheDocument();
  });

  it("Not now leaves at once and is remembered", async () => {
    vi.mocked(dismissPageInviteAction).mockResolvedValue({ ok: true });
    const { container } = render(<PageInviteCard />);
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(container).toBeEmptyDOMElement();
    await waitFor(() => expect(dismissPageInviteAction).toHaveBeenCalled());
  });

  it("comes back, with a word, when Not now could not be remembered", async () => {
    vi.mocked(dismissPageInviteAction).mockResolvedValue({ ok: false });
    render(<PageInviteCard />);
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    await screen.findByRole("link", { name: "Choose what shows" });
    expect(toast.error).toHaveBeenCalled();
  });
});

describe("its light", () => {
  const light = (container: HTMLElement) =>
    container.querySelector("[data-plate-light]");

  it("★ stands complete before it is lit: the words and the key are there while her photographs are read", () => {
    readInviteLight.mockReturnValue(new Promise(() => {}));
    const { container } = render(<PageInviteCard />);
    expect(light(container)).toHaveAttribute("data-plate-light", "reading");
    expect(container.querySelector(".pic-lit")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Choose what shows" }),
    ).toBeInTheDocument();
  });

  it("★ arrives in her photographs' hues once they are read, and is decoration only", async () => {
    const { container } = render(<PageInviteCard />);
    await waitFor(() =>
      expect(light(container)).toHaveAttribute(
        "data-plate-light",
        "photographs",
      ),
    );
    expect(light(container)).toHaveAttribute(
      "data-hues",
      "58 58 58 58 263 263",
    );
    expect(light(container)).toHaveAttribute("aria-hidden", "true");
    // Its three layers (the body, the glow at the edge, the edge itself), drawn from the light and nothing else.
    for (const layer of [".pic-body", ".pic-glow", ".pic-line"]) {
      expect(container.querySelector(layer)).not.toBeNull();
    }
    expect(readInviteLight).toHaveBeenCalledTimes(1);
  });

  it("★ is lit in the house's ember when the read finds nothing, never dark", async () => {
    readInviteLight.mockResolvedValue({
      lit: { ...amber, from: "house" },
      asked: 0,
      read: 0,
    });
    const { container } = render(<PageInviteCard />);
    await waitFor(() =>
      expect(light(container)).toHaveAttribute("data-plate-light", "house"),
    );
    expect(captureWarning).not.toHaveBeenCalled();
  });

  it("★ says once a page that photographs were asked for and none could be read, since a refused origin dims every plate silently", async () => {
    readInviteLight.mockResolvedValue({
      lit: { ...amber, from: "seed" },
      asked: 6,
      read: 0,
    });
    const first = render(<PageInviteCard />);
    await waitFor(() => expect(captureWarning).toHaveBeenCalledTimes(1));
    expect(captureWarning).toHaveBeenCalledWith(
      "media",
      "invite_light_unread",
      { photographs: 6 },
    );
    first.unmount();

    // A second plate on the same page (a second visit) does not say it again.
    const { container } = render(<PageInviteCard />);
    await waitFor(() =>
      expect(light(container)).toHaveAttribute("data-plate-light", "seed"),
    );
    expect(captureWarning).toHaveBeenCalledTimes(1);
  });

  it("asks nothing of a plate she dismissed before the page was idle, and nothing more once it is dismissed", () => {
    vi.useFakeTimers();
    try {
      vi.mocked(dismissPageInviteAction).mockResolvedValue({ ok: true });
      render(<PageInviteCard />);
      fireEvent.click(screen.getByRole("button", { name: "Not now" }));
      vi.advanceTimersByTime(3000);
      expect(readInviteLight).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("asks nothing of a plate that is gone before the page is idle: a left invitation reads no photograph", () => {
    vi.useFakeTimers();
    try {
      const { unmount } = render(<PageInviteCard />);
      unmount();
      vi.advanceTimersByTime(3000);
      expect(readInviteLight).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

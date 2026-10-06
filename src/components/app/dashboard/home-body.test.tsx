import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DISPLAY_DEFAULT } from "@/lib/dashboard/display";
import type { GuestEventCardData } from "@/lib/dashboard/guest-events";
import {
  buildHomeView,
  type HomeInput,
  type HostedEvent,
} from "@/lib/dashboard/home-view";
import type { RuleId } from "@/lib/dashboard/lead";
import { drawnOf, leadingOf } from "@/lib/dashboard/leading";
import { homeContext, hostedEvent } from "@/lib/dashboard/testing/home";

import { HomeBody } from "./home-body";

/**
 * THE PAGE UNDER ITS HEAD, AROUND WHATEVER LEADS (host-dashboard r4, `chooser=words`), pinned as function. A rule's press
 * moves the stage, the week and her events in the same frame from what the page holds; the rule is kept for her account
 * beside it and never before it, a failure says so and leaves what she chose on screen, and a number the page did not
 * read for an event is read once, when the stage needs it. Where she has no choice it is the page it was.
 */

const actions = vi.hoisted(() => ({
  setLeadRuleAction: vi.fn(
    async (_rule: unknown): Promise<{ ok: boolean; message?: string }> => ({
      ok: true,
    }),
  ),
  readStageGuestsAction: vi.fn(
    async (_id: unknown): Promise<number | null> => null,
  ),
  setEventsDisplayAction: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/app/(app)/dashboard/actions", () => actions);
vi.mock("@/lib/guest/use-gallery-doorbell", () => ({
  useGalleryDoorbell: () => ({ live: false }),
}));
vi.mock("@/lib/dashboard/stage-action", () => ({
  readStageLiveAction: vi.fn(async () => null),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/app/styled-qr", () => ({
  StyledQr: () => <span data-testid="qr" />,
}));
vi.mock("@/components/app/share/code-card", () => ({
  CodeCard: ({ trigger }: { trigger: React.ReactNode }) => trigger,
  readableLink: (url: string) => url,
}));
vi.mock("@/components/app/restore-event-button", () => ({
  RestoreEventButton: () => <button type="button">Restore</button>,
}));

const TODAY = "2026-11-10";
const ctx = homeContext(TODAY);

/**
 * Lena's quiet Tuesday: a team lunch in two days and her 40th three days ago (both in the week), pancakes nobody dated,
 * a holiday party, and an old wedding she opened this morning. Newest leads with the lunch; Photos with the 40th, an event
 * after its day, whose guests the page did not read.
 */
const LENA: HostedEvent[] = [
  hostedEvent({
    id: "pancakes",
    name: "Sunday pancakes",
    createdAt: "2026-11-04T09:00:00Z",
    lastArrival: { at: "2026-11-05T09:30:00Z", day: "2026-11-05" },
    approved: 40,
    stills: ["https://r2.test/pancakes.webp"],
  }),
  hostedEvent({
    id: "lunch",
    name: "Team lunch",
    createdAt: "2026-10-20T12:00:00Z",
    date: "2026-11-12",
  }),
  hostedEvent({
    id: "fortieth",
    name: "Lena's 40th",
    createdAt: "2026-09-01T12:00:00Z",
    date: "2026-11-07",
    lastArrival: { at: "2026-11-07T22:00:00Z", day: "2026-11-07" },
    approved: 128,
    stills: ["https://r2.test/40th.webp"],
  }),
  hostedEvent({
    id: "holiday",
    name: "Holiday party",
    createdAt: "2026-08-01T12:00:00Z",
    date: "2026-12-12",
  }),
  hostedEvent({
    id: "wedding",
    name: "The Okafor wedding",
    createdAt: "2026-04-01T12:00:00Z",
    date: "2026-04-18",
    openedAt: "2026-11-10T08:00:00Z",
    approved: 300,
    stills: ["https://r2.test/okafor.webp"],
  }),
];

const inputOf = (rule: RuleId, hosted = LENA): HomeInput => ({
  ctx,
  hosted,
  guests: [],
  deleted: [],
  siteUrl: "https://partyreel.com",
  stageReads: null,
  rule,
});

/**
 * Every test is its own account: the page remembers the rule she chose for the tab, by account (as it must, for Back), so
 * a test that chose one would hand it to the next test that shared its owner.
 */
let accounts = 0;

type Page = {
  rule?: RuleId;
  hosted?: HostedEvent[];
  guests?: GuestEventCardData[];
  owner?: string;
};

/** The page as the server draws it for the rule her account keeps, as the props `DashboardHome` hands its body. */
function body(over: Page & { owner: string }) {
  const input = {
    ...inputOf(over.rule ?? "newest", over.hosted),
    guests: over.guests ?? [],
  };
  const view = buildHomeView(input);
  return (
    <HomeBody
      drawn={drawnOf(view)}
      hasAny={view.hasAny}
      ctx={ctx}
      owner={over.owner}
      display={DISPLAY_DEFAULT}
      leading={leadingOf(input, view)}
      notes={<p data-testid="notes">notes</p>}
    />
  );
}

function page(over: Page = {}) {
  const owner = over.owner ?? `host-${++accounts}`;
  const view = render(body({ ...over, owner }));
  /** A new server render of the same page (a refresh, another event made) for the rule her account now keeps. */
  const redraw = (next: Page = {}) =>
    view.rerender(body({ ...over, ...next, owner }));
  return { ...view, redraw };
}

const stage = () =>
  (document.querySelector("[data-stage]") as HTMLElement).getAttribute(
    "aria-label",
  );
const phrase = () => screen.getByRole("button", { name: /choose what leads/ });

async function chooseRule(
  user: ReturnType<typeof userEvent.setup>,
  rule: string,
) {
  await user.click(phrase());
  const row = screen
    .getAllByRole("menuitemradio")
    .find((el) => el.getAttribute("data-stage-rule-item") === rule)!;
  await user.click(row);
}

beforeEach(() => {
  vi.clearAllMocks();
  actions.setLeadRuleAction.mockResolvedValue({ ok: true });
  actions.readStageGuestsAction.mockResolvedValue(null);
});

describe("where she has no choice", () => {
  it("★ is the page it was: the stage the server drew, no control, her events and the week as drawn", () => {
    const one = [LENA[1]!];
    page({ hosted: one });
    expect(stage()).toBe("Team lunch");
    expect(
      screen.queryByRole("button", { name: /choose what leads/ }),
    ).toBeNull();
    expect(document.querySelector("[data-stage-lead]")).toBeNull();
    // The stage's phase word says its day as it always did: production's own words, the weekday inside a week.
    expect(document.querySelector("[data-stage-phase]")?.textContent).toBe(
      "Thursday",
    );
    expect(screen.getByTestId("notes")).toBeInTheDocument();
  });

  it("★ still shows her events where she hosts none: the albums she added to stand with no stage above them", () => {
    page({
      hosted: [],
      guests: [
        {
          eventId: "g1",
          lastUploadAt: "2026-08-15T12:00:00Z",
          href: "/e/qr-g1",
          name: "Priya & Sam's Wedding",
          dateLabel: "August 15, 2026",
          byline: "Hosted by Priya",
          coverUrl: null,
          accessible: true,
          passwordProtected: false,
        },
      ],
    });
    expect(document.querySelector("[data-stage]")).toBeNull();
    expect(screen.getByText("Priya & Sam's Wedding")).toBeInTheDocument();
    expect(document.querySelector("[data-events]")).not.toBeNull();
  });

  it("is the empty page's teaser where she has no event at all", () => {
    page({ hosted: [] });
    expect(document.querySelector("[data-stage]")).toBeNull();
    expect(screen.getByTestId("notes")).toBeInTheDocument();
  });
});

describe("where she has a choice", () => {
  it("draws the stage the server drew, its reason the control, and the week and her events around it", () => {
    page();
    expect(stage()).toBe("Team lunch");
    expect(phrase()).toHaveTextContent("In 2 days: choose what leads");
    expect(document.querySelector("[data-week]")).not.toBeNull();
    expect(screen.getByTestId("notes")).toBeInTheDocument();
  });

  it("★ moves the stage, the week and her events together when she chooses, from what the page holds", async () => {
    const user = userEvent.setup();
    page();
    const events = () =>
      within(
        document.querySelector("[data-events]") as HTMLElement,
      ).queryAllByRole("link");
    expect(events().map((a) => a.getAttribute("href"))).not.toContain(
      "/dashboard/lunch",
    );
    await chooseRule(user, "photos");
    expect(stage()).toBe("Lena's 40th");
    // The lunch the server drew goes back into the week, the 40th leaves it; her events do the same.
    expect(
      [...document.querySelectorAll("[data-week-card]")].map((c) =>
        c.textContent?.includes("Team lunch"),
      ),
    ).toEqual([true]);
    const hrefs = events().map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/dashboard/lunch");
    expect(hrefs).not.toContain("/dashboard/fortieth");
    expect(phrase()).toHaveTextContent("Latest photos: choose what leads");
  });

  it("is the same page when she presses the rule she keeps", async () => {
    const user = userEvent.setup();
    page();
    await chooseRule(user, "newest");
    expect(stage()).toBe("Team lunch");
    expect(actions.setLeadRuleAction).not.toHaveBeenCalled();
  });

  it("follows a rule that leads with the event already on the stage, changing nothing but the checked row", async () => {
    // Newest and Upcoming both lead with the lunch on this Tuesday.
    const user = userEvent.setup();
    page();
    await chooseRule(user, "upcoming");
    expect(stage()).toBe("Team lunch");
    expect(actions.setLeadRuleAction).toHaveBeenCalledWith("upcoming");
    expect(phrase()).toHaveTextContent("Your next party: choose what leads");
  });
});

describe("the rule the page follows", () => {
  it("★ follows the server's rule until she presses one: a new render of the page is never held to the rule it first met", () => {
    const view = page({ rule: "newest" });
    expect(stage()).toBe("Team lunch");
    // Her account kept another rule (another device, another tab), and the page drew again.
    view.redraw({ rule: "photos" });
    expect(stage()).toBe("Lena's 40th");
    expect(phrase()).toHaveTextContent("Latest photos");
  });

  it("★ holds what she pressed in this tab over a later render, as her events' layout is held", async () => {
    const user = userEvent.setup();
    const view = page({ rule: "newest" });
    await chooseRule(user, "opened");
    expect(stage()).toBe("The Okafor wedding");
    // A render drawn before her write landed (or from another device) still says Newest: this tab keeps her press.
    view.redraw({ rule: "newest" });
    expect(stage()).toBe("The Okafor wedding");
    view.redraw({ rule: "photos" });
    expect(stage()).toBe("The Okafor wedding");
  });

  it("starts following the server the moment she has a choice, where she had none", () => {
    const view = page({ rule: "photos", hosted: [LENA[1]!] });
    expect(document.querySelector("[data-stage-lead]")).toBeNull();
    expect(stage()).toBe("Team lunch");
    // Another event was made: the page draws again with a choice, and her kept rule leads.
    view.redraw({ rule: "photos", hosted: LENA });
    expect(stage()).toBe("Lena's 40th");
    expect(phrase()).toHaveTextContent("Latest photos");
  });
});

describe("keeping the rule for her account", () => {
  it("★ keeps it once, after the stage has moved, never refreshing the page", async () => {
    const user = userEvent.setup();
    page();
    await chooseRule(user, "opened");
    expect(stage()).toBe("The Okafor wedding");
    await waitFor(() =>
      expect(actions.setLeadRuleAction).toHaveBeenCalledTimes(1),
    );
    expect(actions.setLeadRuleAction).toHaveBeenCalledWith("opened");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("★ says a refusal once and leaves what she chose on screen", async () => {
    const user = userEvent.setup();
    actions.setLeadRuleAction.mockResolvedValue({
      ok: false,
      message: "Couldn't keep that for your account. Please try again.",
    });
    page();
    await chooseRule(user, "opened");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't keep that for your account. Please try again.",
        { id: "lead-rule" },
      ),
    );
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(stage()).toBe("The Okafor wedding");
  });

  it("★ lets her try again: pressing the rule that was refused writes again, and a kept one writes nothing", async () => {
    const user = userEvent.setup();
    actions.setLeadRuleAction.mockResolvedValueOnce({
      ok: false,
      message: "Couldn't keep that for your account. Please try again.",
    });
    page();
    await chooseRule(user, "opened");
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(actions.setLeadRuleAction).toHaveBeenCalledTimes(1);
    expect(stage()).toBe("The Okafor wedding");
    // The toast said to try again: the same row pressed again is that, though it is the rule on screen.
    await chooseRule(user, "opened");
    await waitFor(() =>
      expect(actions.setLeadRuleAction).toHaveBeenCalledTimes(2),
    );
    expect(actions.setLeadRuleAction).toHaveBeenLastCalledWith("opened");
    // It landed: the rule is kept, so pressing it once more owes nothing.
    await chooseRule(user, "opened");
    expect(actions.setLeadRuleAction).toHaveBeenCalledTimes(2);
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("owes the account the last press only: a refused rule she then replaced is not retried", async () => {
    const user = userEvent.setup();
    actions.setLeadRuleAction.mockResolvedValueOnce({
      ok: false,
      message: "no",
    });
    page();
    await chooseRule(user, "opened");
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    await chooseRule(user, "photos");
    await waitFor(() =>
      expect(actions.setLeadRuleAction).toHaveBeenCalledTimes(2),
    );
    expect(actions.setLeadRuleAction).toHaveBeenLastCalledWith("photos");
    // Photos landed, so it is kept and nothing is owed any more.
    await chooseRule(user, "photos");
    expect(actions.setLeadRuleAction).toHaveBeenCalledTimes(2);
  });

  it("says a dropped line in the same words", async () => {
    const user = userEvent.setup();
    actions.setLeadRuleAction.mockRejectedValue(new Error("network"));
    page();
    await chooseRule(user, "opened");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't keep that for your account. Please try again.",
        { id: "lead-rule" },
      ),
    );
  });

  it("★ remembers it for the tab, by account, for a page Back brings back drawn from before her choice", async () => {
    const user = userEvent.setup();
    const first = page({ owner: "host-a" });
    await chooseRule(user, "opened");
    first.unmount();
    // The page as the server first drew it (the router cache's copy): her rule in this tab still stands.
    page({ owner: "host-a" });
    expect(stage()).toBe("The Okafor wedding");
    expect(phrase()).toHaveTextContent("Where you left off");
    // Another account signing in on the same tab never meets hers.
    document.body.innerHTML = "";
    page({ owner: "host-b" });
    expect(stage()).toBe("Team lunch");
  });
});

describe("a number the page did not read", () => {
  it("★ is read once for an event a press led with that has had its day, and said when it lands", async () => {
    const user = userEvent.setup();
    actions.readStageGuestsAction.mockResolvedValue(41);
    page();
    await chooseRule(user, "photos");
    expect(stage()).toBe("Lena's 40th");
    await waitFor(() =>
      expect(actions.readStageGuestsAction).toHaveBeenCalledTimes(1),
    );
    expect(actions.readStageGuestsAction).toHaveBeenCalledWith("fortieth");
    const numbers = await waitFor(() => {
      const dl = document.querySelector("[data-stage-numbers]") as HTMLElement;
      expect(dl.textContent).toContain("41");
      return dl;
    });
    expect(numbers.textContent).toContain("guests");
    expect(numbers.textContent).toContain("in the album");
  });

  it("is never asked for the stage the server drew, or an event before its day", async () => {
    const user = userEvent.setup();
    page({ rule: "photos" });
    // The 40th is the drawn stage: the page read its guests (or chose not to) and that stands.
    expect(actions.readStageGuestsAction).not.toHaveBeenCalled();
    await chooseRule(user, "upcoming");
    expect(stage()).toBe("Team lunch");
    // The lunch has not happened: nobody has come, so nobody is asked.
    expect(actions.readStageGuestsAction).not.toHaveBeenCalled();
  });

  it("leaves the number unsaid when it cannot be read, and does not ask again", async () => {
    const user = userEvent.setup();
    actions.readStageGuestsAction.mockResolvedValue(null);
    page();
    await chooseRule(user, "photos");
    await waitFor(() =>
      expect(actions.readStageGuestsAction).toHaveBeenCalledTimes(1),
    );
    await act(async () => {
      await Promise.resolve();
    });
    const numbers = document.querySelector(
      "[data-stage-numbers]",
    ) as HTMLElement;
    expect(numbers.textContent).not.toContain("guests");
    expect(actions.readStageGuestsAction).toHaveBeenCalledTimes(1);
  });
});

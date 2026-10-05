import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { stageViewOf } from "@/lib/dashboard/home-view";
import type { RuleId } from "@/lib/dashboard/lead";
import type { LeadChoice } from "@/lib/dashboard/leading";
import { homeContext, hostedEvent } from "@/lib/dashboard/testing/home";

import { StageLead } from "./stage-lead";

/**
 * THE STAGE'S OWN WORDS (host-dashboard r4, `chooser=words`), pinned as function: the stage's first words say why its
 * event leads and are the control; pressing them turns the stage into the four rules, each with its event and the fact
 * that picked it, the picture showing the one under the pointer or the focus; a row is the act; everything else turns
 * back with nothing changed; and the band is inert beneath. Never a look.
 */

vi.mock("@/lib/guest/use-gallery-doorbell", () => ({
  useGalleryDoorbell: () => ({ live: false }),
}));
vi.mock("@/lib/dashboard/stage-action", () => ({
  readStageLiveAction: vi.fn(async () => null),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
// The code draws through a canvas library and the card through a dialog: neither is this file's subject.
vi.mock("@/components/app/styled-qr", () => ({
  StyledQr: () => <span data-testid="qr" />,
}));
vi.mock("@/components/app/share/code-card", () => ({
  CodeCard: ({ trigger }: { trigger: React.ReactNode }) => trigger,
  readableLink: (url: string) => url,
}));

const TUESDAY = "2026-11-10";
const ctx = homeContext(TUESDAY);
const SITE = "https://partyreel.com";

/** Three events: the wedding that leads (empty, lit by its lamp), an engagement party with photographs, and a lunch. */
const WEDDING = hostedEvent({
  id: "wedding",
  name: "Nia & Alex's Wedding",
  createdAt: "2026-11-09T21:00:00Z",
});
const ENGAGEMENT = hostedEvent({
  id: "engagement",
  name: "Our Engagement Party",
  createdAt: "2026-08-01T12:00:00Z",
  stills: ["https://r2.test/engagement.webp"],
  approved: 41,
  lastArrival: { at: "2026-09-26T20:00:00Z", day: "2026-09-26" },
});
const LUNCH = hostedEvent({
  id: "lunch",
  name: "Team lunch",
  createdAt: "2026-10-20T12:00:00Z",
  date: "2026-11-12",
  ready: { opened: 4, guestsIn: 0 },
});
const STAGES = Object.fromEntries(
  [WEDDING, ENGAGEMENT, LUNCH].map((e) => [e.id, stageViewOf(e, SITE)]),
);

const choice = (
  event: typeof WEDDING,
  reason: string,
  line: string,
): LeadChoice => ({
  eventId: event.id,
  reason,
  line: `${event.name} · ${line}`,
});
const CHOICES: Record<RuleId, LeadChoice> = {
  newest: choice(WEDDING, "Your newest", "made yesterday"),
  upcoming: choice(LUNCH, "Your next party", "Thursday"),
  opened: choice(WEDDING, "Where you left off", "opened last"),
  photos: choice(ENGAGEMENT, "Latest photos", "photos Sep 26"),
};

const stageOf = (id: string) => STAGES[id]!;

function lead(over: { rule?: RuleId; onRule?: (r: RuleId) => void } = {}) {
  const onRule = over.onRule ?? vi.fn();
  const view = render(
    <StageLead
      stage={stageOf(CHOICES[over.rule ?? "newest"].eventId)}
      ctx={ctx}
      rule={over.rule ?? "newest"}
      choices={CHOICES}
      stageOf={stageOf}
      onRule={onRule}
    />,
  );
  return { ...view, onRule: onRule as ReturnType<typeof vi.fn> };
}

const phrase = () => screen.getByRole("button", { name: /choose what leads/ });
const rows = () => screen.getAllByRole("menuitemradio");
const band = () => document.querySelector("[data-stage]") as HTMLElement;
const named = (name: string) =>
  rows().find((row) => row.textContent?.includes(name))!;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("the stage's first words", () => {
  it("★ say why the event leads, and are the control that chooses what leads", () => {
    lead();
    const control = phrase();
    expect(control).toHaveTextContent("Your newest: choose what leads");
    expect(control).toHaveAttribute("aria-haspopup", "menu");
    expect(control).toHaveAttribute("aria-expanded", "false");
    // Nothing else is drawn of the four until she presses.
    expect(screen.queryByRole("menu")).toBeNull();
    // The reason stands alone in the line: the phase word gives way to it.
    expect(band().classList.contains("sl-reason")).toBe(true);
    expect(band().querySelector("[data-stage-phase]")).not.toBeNull();
  });

  it("say the reason of the rule she keeps, whichever event it led with", () => {
    lead({ rule: "photos" });
    expect(phrase()).toHaveTextContent("Latest photos");
  });
});

describe("pressing them turns the stage to choose", () => {
  it("★ shows the four rules, each with its event and the fact that picked it, her rule checked and holding the focus", async () => {
    const user = userEvent.setup();
    lead();
    await user.click(phrase());
    const menu = screen.getByRole("menu", { name: "Lead with" });
    expect(phrase()).toHaveAttribute("aria-expanded", "true");
    expect(phrase()).toHaveAttribute("aria-controls", menu.id);
    expect(
      rows().map((row) => row.getAttribute("data-stage-rule-item")),
    ).toEqual(["newest", "upcoming", "opened", "photos"]);
    expect(rows().map((row) => row.textContent?.replace(/ /g, " "))).toEqual([
      "Your newestNia & Alex's Wedding · made yesterday",
      "Your next partyTeam lunch · Thursday",
      "Where you left offNia & Alex's Wedding · opened last",
      "Latest photosOur Engagement Party · photos Sep 26",
    ]);
    expect(rows().map((row) => row.getAttribute("aria-checked"))).toEqual([
      "true",
      "false",
      "false",
      "false",
    ]);
    expect(document.activeElement).toBe(named("Your newest"));
    expect(
      screen.getByText("A party on its own day always leads."),
    ).toBeTruthy();
  });

  it("★ leaves the band inert beneath, so a press on its picture can only turn back", async () => {
    const user = userEvent.setup();
    lead();
    await user.click(phrase());
    expect(band().closest("[inert]")).not.toBeNull();
  });

  it("draws a face only for an event that would replace the one on the stage", async () => {
    const user = userEvent.setup();
    lead();
    await user.click(phrase());
    const faces = (name: string) =>
      named(name).querySelectorAll(":scope > span[aria-hidden]").length;
    // Rows 1 and 3 lead with the wedding that is already there (a radio dot is the only mark); 2 and 4 show their event.
    expect(faces("Your newest")).toBe(1);
    expect(faces("Where you left off")).toBe(1);
    expect(faces("Your next party")).toBe(2);
    expect(faces("Latest photos")).toBe(2);
  });

  it("shows the event under the pointer on the picture side, naming whose code it is", async () => {
    const user = userEvent.setup();
    lead();
    await user.click(phrase());
    expect(band().getAttribute("aria-label")).toBe("Nia & Alex's Wedding");
    await user.hover(named("Your next party"));
    expect(band().getAttribute("aria-label")).toBe("Team lunch");
    // An event with no photograph shows its code on the plate, and the words under it say whose.
    expect(
      within(band()).getByText(/Team lunch · Thursday/),
    ).toBeInTheDocument();
    await user.hover(named("Latest photos"));
    expect(band().getAttribute("aria-label")).toBe("Our Engagement Party");
    // Moving off the rows goes back to the row the keyboard stands on.
    fireEvent.pointerLeave(screen.getByRole("menu"));
    expect(band().getAttribute("aria-label")).toBe("Nia & Alex's Wedding");
  });

  it("shows the focused row's event too, for a keyboard", async () => {
    const user = userEvent.setup();
    lead();
    await user.click(phrase());
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(named("Your next party"));
    expect(band().getAttribute("aria-label")).toBe("Team lunch");
  });
});

describe("choosing", () => {
  it("★ keeps the rule pressed, turns the stage back and hands the focus to the new reason", async () => {
    const user = userEvent.setup();
    const { onRule } = lead();
    await user.click(phrase());
    await user.click(named("Latest photos"));
    expect(onRule).toHaveBeenCalledTimes(1);
    expect(onRule).toHaveBeenCalledWith("photos");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(phrase()).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(phrase());
    expect(band().closest("[inert]")).toBeNull();
  });

  it("turns back with nothing changed when the rule she presses is the one she keeps", async () => {
    const user = userEvent.setup();
    const { onRule } = lead();
    await user.click(phrase());
    await user.click(named("Your newest"));
    expect(onRule).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("keeps the rule for Enter and Space on a row, as a press does", async () => {
    const user = userEvent.setup();
    const { onRule } = lead();
    await user.click(phrase());
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onRule).toHaveBeenLastCalledWith("upcoming");
    await user.click(phrase());
    await user.keyboard("{ArrowDown}{ArrowDown} ");
    expect(onRule).toHaveBeenLastCalledWith("opened");
  });
});

describe("turning back with nothing changed", () => {
  it("is Escape, and the focus goes back to the phrase from inside the rules", async () => {
    const user = userEvent.setup();
    const { onRule } = lead();
    await user.click(phrase());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(onRule).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(phrase());
  });

  it("is the close, and the focus goes back to the phrase", async () => {
    const user = userEvent.setup();
    const { onRule } = lead();
    await user.click(phrase());
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(onRule).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(phrase());
  });

  it("is a press anywhere else, which is only that press and never a pick", async () => {
    const user = userEvent.setup();
    const { onRule } = lead();
    render(<button type="button">elsewhere</button>);
    await user.click(phrase());
    await user.click(screen.getByRole("button", { name: "elsewhere" }));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(onRule).not.toHaveBeenCalled();
  });

  it("is a Tab out of the four", async () => {
    const user = userEvent.setup();
    lead();
    render(<button type="button">after</button>);
    await user.click(phrase());
    // The close sits before the rows and the rows are one tab stop: the next Tab from the last leaves the chooser.
    named("Your newest").focus();
    await user.tab();
    await user.tab();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("keeps the chooser open for a press inside it that is not a row", async () => {
    const user = userEvent.setup();
    lead();
    await user.click(phrase());
    await user.click(screen.getByText("Lead with"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});

describe("the four's keys", () => {
  it("move the focus down and up, wrapping at either end, and to the first and last on Home and End", async () => {
    const user = userEvent.setup();
    lead();
    await user.click(phrase());
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(named("Latest photos"));
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(named("Your newest"));
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(named("Latest photos"));
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(named("Your newest"));
  });

  it("stand as one tab stop, on the row the keyboard is on", async () => {
    const user = userEvent.setup();
    lead();
    await user.click(phrase());
    await user.keyboard("{ArrowDown}");
    expect(rows().map((row) => row.tabIndex)).toEqual([-1, 0, -1, -1]);
  });
});

describe("the stage under her rule", () => {
  it("draws the event the page leads with, and says how it was chosen in the reason alone", () => {
    lead({ rule: "upcoming" });
    expect(band().getAttribute("aria-label")).toBe("Team lunch");
    const line = document.querySelector("[data-stage-word]") as HTMLElement;
    // The reason is the control, and the phase word sits beside it, hidden, never said twice.
    expect(within(line).getByRole("button")).toHaveTextContent(
      "Your next party",
    );
  });
});

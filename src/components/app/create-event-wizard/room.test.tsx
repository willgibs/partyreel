import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreateEventWizard } from "@/components/app/create-event-wizard";
import { RouteSkeleton } from "@/components/shared/route-skeleton";

import { setReducedMotion } from "../../../../vitest.setup";
import { DEVELOP_QUESTION } from "./develop-step";
import { HELD_QUESTION } from "./held";

/**
 * CREATE AS THE ROOM, IN HIS LAYOUT (create-wizard r1 `shape=screen`, r2 `flow=carry`, Will 2026-10-02/03):
 * "Always keep the question up top so users aren't searching for the spot of the new one in a centered
 * group each time", the answer in the centre, one button at the foot, the subtle steppers on top; and,
 * with `carry`, each answer rising into the head, which is the way back.
 *
 * What fails silently, and is pinned here:
 *  - the room stops being a screen of its own (the app's bar back over it, a light session painting it
 *    paper): it still works, it just is not the room he picked;
 *  - a screen's question moves (into the centre, under its answer) or a second button joins the foot;
 *  - Back appears where there is nothing to go back to, or after Create, where the event already exists
 *    and going back would offer to make it twice;
 *  - the carry stops carrying: the head forgets her name, or the name flies from a guessed place.
 *  - the add step (create-wizard r3's `add=styles`) stands between the name and the look as a screen of the room like
 *    the rest: its question first, one button at the foot, a hairline of its own, Back and the head the way to the name;
 *  - the Disposable's own screen (r4's `styles=focused`) stands after it only while Disposable is picked, the
 *    steppers growing by one with it and shrinking without it;
 *  - a failed Create (r4's `failed=held`) holds the beat in the same layout, Back there for a change.
 * No class, size, word count or duration is pinned; the words are, where a word is the fact.
 */

const ROOT = process.cwd();
const code = (rel: string) =>
  readFileSync(join(ROOT, rel), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

const createEventInWizard = vi.hoisted(() => vi.fn());
vi.mock("@/app/(app)/dashboard/actions", () => ({ createEventInWizard }));

// The codes are pictures here: what the room is about is where things stand and what presses do.
vi.mock("@/components/app/styled-qr", () => ({
  StyledQr: ({ value }: { value: string }) => (
    <div data-testid="styled-qr" data-value={value} />
  ),
}));
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: () => null,
}));
// The light is the Aurora's engine (an observer and a filter host jsdom has neither of).
vi.mock("@/components/shared/glow", () => ({ Glow: () => null }));

const EVENT = {
  id: "evt_1",
  name: "Maya & Jay's Wedding",
  qr_token: "7f3a9c2e5b8d4f1a9e6c3b7d2a5f8e1c",
  qr_style: "classic",
};

function renderWizard() {
  return render(
    <CreateEventWizard
      siteUrl="https://partyreel.com"
      planName="Free"
      tier="free"
      atCap={false}
      maxEvents={1}
      cappedEvents={[]}
      storagePct={10}
    />,
  );
}

const room = () => document.querySelector<HTMLElement>("[data-app-room]")!;
const head = () => document.querySelector<HTMLElement>("[data-room-head]")!;
const page = () => document.querySelector<HTMLElement>("[data-room-page]")!;
const question = () =>
  within(page()).getByRole("heading", { level: 1 }) as HTMLElement;

/** Her name given and Continue pressed: the add step stands. */
async function nameIt(name = EVENT.name) {
  await userEvent.type(screen.getByRole("textbox"), name);
  await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
  await screen.findByRole("radiogroup", { name: /album style/i });
}

/** The add step's Continue pressed: the code's look stands. */
async function styleIt() {
  await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
  await screen.findByRole("button", { name: /^create event$/i });
}

/** The name, the style and the look as they are: the look stands. */
async function toTheLook() {
  await nameIt();
  await styleIt();
}

async function createIt() {
  await toTheLook();
  await userEvent.click(
    screen.getByRole("button", { name: /^create event$/i }),
  );
  await screen.findByRole("button", { name: /^get it ready$/i });
}

/** A question's own words as a pattern that matches them whole, whatever they hold. */
const exactly = (words: string) =>
  new RegExp(`^${words.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);

/** The screen as he laid it out: its one question first, its answer under it, one button at the foot. */
function expectLaidOut(asks: RegExp, go: RegExp) {
  const p = page();
  const headings = within(p).getAllByRole("heading", { level: 1 });
  expect(headings).toHaveLength(1);
  expect(headings[0]).toHaveTextContent(asks);
  const top = p.firstElementChild as HTMLElement;
  expect(top.hasAttribute("data-room-question")).toBe(true);
  expect(top.contains(headings[0])).toBe(true);
  const centre = p.querySelector("[data-room-centre]");
  expect(centre).toBeTruthy();
  expect(
    top.compareDocumentPosition(centre!) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  const foot = room().querySelector<HTMLElement>("[data-room-foot]")!;
  const acts = [
    ...within(foot).queryAllByRole("button"),
    ...within(foot).queryAllByRole("link"),
  ];
  expect(acts).toHaveLength(1);
  expect(acts[0]).toHaveAccessibleName(go);
}

beforeEach(() => {
  push.mockClear();
  createEventInWizard.mockReset();
  createEventInWizard.mockResolvedValue({ ok: true, event: EVENT });
});

describe("the room (shape=screen)", () => {
  it("is a screen of its own, dark whatever the session's theme", () => {
    renderWizard();
    expect(room()).toBeTruthy();
    // Round one's carried `room`: the pictures and the light carry it in both themes.
    expect(room().classList.contains("dark")).toBe(true);
  });

  it("★ asks the app's bar to step aside, in the shell's own way a page asks (`:has()`, never a prop)", () => {
    // The shell is the layout's and the page its grandchild, so the room asks in CSS, as a wide page
    // does: nothing of the app stands around Create, and nothing of it stays in the tab order behind.
    expect(code("src/components/shared/app-shell.tsx")).toMatch(
      /<header[^>]*group-has-\[\[data-app-room\]\]\/shell:hidden/,
    );
  });
});

describe("the room's own wait", () => {
  it("★ lands in the room at once, busy, never the dashboard's paper skeleton first", () => {
    // The nearest wait above /dashboard/new is the dashboard's: a press of New event would cut from a
    // paper skeleton to the dark room a beat later. The route waits in its own room instead.
    render(<RouteSkeleton variant="room" />);
    expect(room()).toHaveAttribute("aria-busy", "true");
    expect(room().classList.contains("dark")).toBe(true);
    expect(screen.getByRole("link", { name: /^close$/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(code("src/app/(app)/dashboard/new/loading.tsx")).toMatch(
      /<RouteSkeleton variant="room" \/>/,
    );
  });
});

describe("each screen's question, in one place", () => {
  it("stands the question first on every screen, the answer under it, one button at the foot", async () => {
    renderWizard();
    expectLaidOut(/^name your event$/i, /^continue$/i);
    await nameIt();
    expectLaidOut(/^pick your album.s style$/i, /^continue$/i);
    await styleIt();
    expectLaidOut(/^pick the code.s look$/i, /^create event$/i);
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    await screen.findByRole("button", { name: /^get it ready$/i });
    expectLaidOut(new RegExp(`^${EVENT.name} is live$`), /^get it ready$/i);
  });

  it("★ stands the Disposable's own screen in the same layout, and a failed Create's hold too", async () => {
    createEventInWizard.mockRejectedValue(new TypeError("Failed to fetch"));
    renderWizard();
    await nameIt();
    await userEvent.click(
      screen.getByRole("radio", { name: /^disposable\./i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expectLaidOut(exactly(DEVELOP_QUESTION), /^continue$/i);
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    await userEvent.click(
      await screen.findByRole("button", { name: /^create event$/i }),
    );
    await screen.findByRole("button", { name: /^try again$/i });
    expectLaidOut(exactly(HELD_QUESTION), /^try again$/i);
  });

  it("labels the name's field with its question, so the question is the field's own", () => {
    renderWizard();
    expect(screen.getByRole("textbox")).toHaveAccessibleName(
      /name your event/i,
    );
  });

  it("says where she is on the steppers, the screens done and the one she is on filled", async () => {
    renderWizard();
    const marks = () => [
      ...head().querySelectorAll<HTMLElement>("[data-room-step]"),
    ];
    expect(marks().map((m) => m.dataset.state)).toEqual([
      "current",
      "todo",
      "todo",
      "todo",
    ]);
    expect(head()).toHaveTextContent(/step 1 of 4/i);
    await nameIt();
    expect(marks().map((m) => m.dataset.state)).toEqual([
      "done",
      "current",
      "todo",
      "todo",
    ]);
    expect(head()).toHaveTextContent(/step 2 of 4/i);
    await styleIt();
    expect(marks().map((m) => m.dataset.state)).toEqual([
      "done",
      "done",
      "current",
      "todo",
    ]);
    expect(head()).toHaveTextContent(/step 3 of 4/i);
  });

  it("★ grows the steppers by one while Disposable is picked, its own screen the third, and shrinks them without it", async () => {
    renderWizard();
    const marks = () =>
      [...head().querySelectorAll<HTMLElement>("[data-room-step]")].map(
        (m) => m.dataset.state,
      );
    await nameIt();
    await userEvent.click(
      screen.getByRole("radio", { name: /^disposable\./i }),
    );
    expect(marks()).toEqual(["done", "current", "todo", "todo", "todo"]);
    expect(head()).toHaveTextContent(/step 2 of 5/i);
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(question()).toHaveTextContent(DEVELOP_QUESTION);
    expect(marks()).toEqual(["done", "done", "current", "todo", "todo"]);
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    await screen.findByRole("button", { name: /^create event$/i });
    expect(head()).toHaveTextContent(/step 4 of 5/i);
    // Back walks it one screen at a time, and another style takes its screen away.
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(question()).toHaveTextContent(DEVELOP_QUESTION);
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    await userEvent.click(screen.getByRole("radio", { name: /^live\./i }));
    expect(marks()).toEqual(["done", "current", "todo", "todo"]);
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(question()).toHaveTextContent(/^pick the code.s look$/i);
    expect(head()).toHaveTextContent(/step 3 of 4/i);
  });
});

describe("Back (flow=carry: the head is the way back)", () => {
  it("is never offered on the name: there is nowhere to go back to", () => {
    renderWizard();
    expect(screen.queryByRole("button", { name: /^back$/i })).toBeNull();
    expect(head().querySelector("[data-room-step] button")).toBeNull();
  });

  it("returns from the add step to the name with her name kept, from the head's Back", async () => {
    renderWizard();
    await nameIt();
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(question()).toHaveTextContent(/^name your event$/i);
    expect(screen.getByRole("textbox")).toHaveValue(EVENT.name);
  });

  it("returns from the look to the add step, one screen at a time, her style kept", async () => {
    renderWizard();
    await nameIt();
    await userEvent.click(screen.getByRole("radio", { name: /^review\./i }));
    await styleIt();
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(question()).toHaveTextContent(/^pick your album.s style$/i);
    expect(screen.getByRole("radio", { name: /^review\./i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(question()).toHaveTextContent(/^name your event$/i);
  });

  it("returns from the name in the head, the carry's own way back, from the add step and the look", async () => {
    renderWizard();
    await nameIt();
    await userEvent.click(
      within(head()).getByRole("button", { name: /back to the name/i }),
    );
    expect(question()).toHaveTextContent(/^name your event$/i);
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    await styleIt();
    await userEvent.click(
      within(head()).getByRole("button", { name: /back to the name/i }),
    );
    expect(question()).toHaveTextContent(/^name your event$/i);
  });

  it("returns from a done step's hairline, a press for a pointer: the add step's hairline too", async () => {
    renderWizard();
    await toTheLook();
    const done = (n: number) =>
      head().querySelector<HTMLElement>(
        `[data-room-step="${n}"][data-state="done"] button`,
      );
    expect(done(1)).toBeTruthy();
    expect(done(2)).toBeTruthy();
    await userEvent.click(done(2)!);
    expect(question()).toHaveTextContent(/^pick your album.s style$/i);
    await userEvent.click(done(1)!);
    expect(question()).toHaveTextContent(/^name your event$/i);
  });

  it("keeps the look she picked across a Back and a Continue", async () => {
    renderWizard();
    await toTheLook();
    await userEvent.click(screen.getByRole("radio", { name: /dots/i }));
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(screen.getByRole("radio", { name: /dots/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("★ is offered on a held failure, to the look: nothing exists to make twice, and the head names her event", async () => {
    createEventInWizard.mockRejectedValue(new TypeError("Failed to fetch"));
    renderWizard();
    await toTheLook();
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    await screen.findByRole("button", { name: /^try again$/i });
    // The question is the failure's, so her name titles the room; the hairlines press nothing while it is held.
    expect(head().querySelector("[data-room-name]")).toHaveTextContent(
      EVENT.name,
    );
    expect(head().querySelector("[data-room-step] button")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(question()).toHaveTextContent(/^pick the code.s look$/i);
    expect(document.querySelector("[data-beat]")).toBeNull();
  });

  it("★ is never offered on the beat: the event exists, and Back would offer to make it twice", async () => {
    renderWizard();
    await createIt();
    expect(screen.queryByRole("button", { name: /^back$/i })).toBeNull();
    expect(
      within(head()).queryByRole("button", { name: /back to the name/i }),
    ).toBeNull();
    expect(head().querySelector("[data-room-step] button")).toBeNull();
  });
});

describe("the close", () => {
  it("leaves Create for the events while nothing has been made", async () => {
    renderWizard();
    expect(screen.getByRole("link", { name: /^close$/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    await toTheLook();
    expect(screen.getByRole("link", { name: /^close$/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("★ leaves the beat for the event's own page (the carried `close`): the foot keeps Get it ready alone", async () => {
    renderWizard();
    await createIt();
    expect(
      screen.getByRole("link", { name: /go to your event/i }),
    ).toHaveAttribute("href", `/dashboard/${EVENT.id}`);
    expect(screen.queryByRole("link", { name: /^close$/i })).toBeNull();
  });
});

/* ── the carry ─────────────────────────────────────────────────────────── */

type Flown = { el: Element; frames: Keyframe[] };
let flown: Flown[] = [];

/** jsdom has no layout: each marked box answers where it would stand on a phone. */
const BOXES: Record<string, DOMRect> = {
  "[data-room-name-text]": rect(28, 300, 319, 36),
  "[data-room-name]": rect(108, 14, 159, 20),
  // The add step's chosen picture, and the hairline it drops into.
  "[data-carry-pick]": rect(32, 392, 110, 88),
  '[data-room-step="2"]': rect(165, 52, 33, 3),
};
function rect(x: number, y: number, w: number, h: number): DOMRect {
  return {
    x,
    y,
    left: x,
    top: y,
    width: w,
    height: h,
    right: x + w,
    bottom: y + h,
    toJSON: () => ({}),
  } as DOMRect;
}

describe("the carry (flow=carry): her answer rises into the head", () => {
  const realRect = Element.prototype.getBoundingClientRect;
  beforeEach(() => {
    flown = [];
    Element.prototype.getBoundingClientRect = function (this: Element) {
      for (const [sel, r] of Object.entries(BOXES))
        if (this.matches(sel)) return r;
      return rect(0, 0, 375, 812);
    };
    // Each `animate` is recorded, and answers as one that ran to its end.
    HTMLElement.prototype.animate = function (
      this: HTMLElement,
      frames: Keyframe[] | PropertyIndexedKeyframes | null,
    ) {
      flown.push({ el: this, frames: frames as Keyframe[] });
      return {
        finished: Promise.resolve(),
        finish: vi.fn(),
        cancel: vi.fn(),
        onfinish: null,
      } as unknown as Animation;
    } as HTMLElement["animate"];
  });
  afterEach(() => {
    Element.prototype.getBoundingClientRect = realRect;
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
  });

  it("titles the room with her name from the second screen, and never before", async () => {
    renderWizard();
    expect(head().querySelector("[data-room-name]")?.textContent ?? "").toBe(
      "",
    );
    await nameIt();
    expect(
      within(head()).getByRole("button", { name: /back to the name/i }),
    ).toHaveTextContent(EVENT.name);
  });

  it("leaves her name to the question on the beat", async () => {
    renderWizard();
    await createIt();
    expect(head().querySelector("[data-room-name]")?.textContent ?? "").toBe(
      "",
    );
    expect(question()).toHaveTextContent(`${EVENT.name} is live`);
  });

  it("★ flies her own words from where she typed them to the head, measured, never guessed", async () => {
    renderWizard();
    await nameIt();
    const flight = flown.find((f) => f.el.matches("[data-room-flight]"));
    expect(flight, "nothing flew").toBeTruthy();
    expect(flight!.el.textContent).toBe(EVENT.name);
    // It starts on the field's own words and ends on the head's line: the centres, and the head's height.
    const from = BOXES["[data-room-name-text]"];
    const to = BOXES["[data-room-name]"];
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const last = String(flight!.frames.at(-1)?.transform);
    expect(last).toContain(`translate(${dx}px, ${dy}px)`);
    expect(last).toContain(`scale(${to.height / from.height})`);
    expect(String(flight!.frames[0].transform)).toContain(
      "translate(0px, 0px)",
    );
  });

  it("★ drops the add step's pick into its hairline as the look arrives, measured from where its picture stood", async () => {
    renderWizard();
    await nameIt();
    flown = [];
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    const drop = flown.find((f) => f.el.matches("[data-room-flight-pick]"));
    expect(drop, "the pick did not drop").toBeTruthy();
    // It is the picture, never a copy a reader can reach, and it leaves no id behind.
    expect(drop!.el.getAttribute("aria-hidden")).toBe("true");
    expect(drop!.el.querySelector("[id]")).toBeNull();
    // It starts where the picture stood and ends on the hairline: the centres, and the line's width.
    const from = BOXES["[data-carry-pick]"];
    const to = BOXES['[data-room-step="2"]'];
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const last = String(drop!.frames.at(-1)?.transform);
    expect(last).toContain(`translate(${dx}px, ${dy}px)`);
    expect(last).toContain(`scale(${to.width / from.width})`);
    expect(String(drop!.frames[0].transform)).toContain("translate(0px, 0px)");
  });

  it("drops no pick off the name (it has none), and none on the way back", async () => {
    renderWizard();
    expect(document.querySelector("[data-carry-pick]")).toBeNull();
    await nameIt();
    expect(
      flown.filter((f) => f.el.matches("[data-room-flight-pick]")),
    ).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    flown = [];
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(
      flown.filter((f) => f.el.matches("[data-room-flight-pick]")),
    ).toEqual([]);
  });

  it("flies it back down into the field on the way back", async () => {
    renderWizard();
    await nameIt();
    flown = [];
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    const flight = flown.find((f) => f.el.matches("[data-room-flight]"));
    expect(flight, "nothing flew back").toBeTruthy();
    expect(flight!.el.textContent).toBe(EVENT.name);
  });

  it("lands: once the flight is over nothing of it is left in the room", async () => {
    renderWizard();
    await nameIt();
    await waitFor(() =>
      expect(document.querySelector("[data-room-flight]")).toBeNull(),
    );
    expect(head().querySelector("[data-room-name]")).not.toHaveStyle({
      visibility: "hidden",
    });
  });

  it("cuts straight to the next screen under reduced motion: nothing flies, the head reads at once", async () => {
    setReducedMotion(true);
    renderWizard();
    await nameIt();
    expect(flown.filter((f) => f.el.matches("[data-room-flight]"))).toEqual([]);
    expect(document.querySelector("[data-room-flight]")).toBeNull();
    // And the add step's pick drops nowhere: the look simply stands.
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(document.querySelector("[data-room-flight-pick]")).toBeNull();
    expect(flown).toEqual([]);
    expect(head().querySelector("[data-room-name]")).not.toHaveStyle({
      visibility: "hidden",
    });
  });
});

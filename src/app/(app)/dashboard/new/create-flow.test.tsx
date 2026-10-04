import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QR_STYLE_KEYS } from "@/lib/constants/qr-presets";
import { CreateEventWizard } from "@/components/app/create-event-wizard";

/**
 * A HOST'S FIRST EVENT, FROM "CREATE" TO A CODE ON THE TABLE (the `first-event`
 * board, ruled whole by Will 2026-09-21; drawn as the room by create-wizard r2,
 * 2026-10-03).
 *
 * Four functions, and every one of them fails SILENTLY if it breaks:
 *
 *  1. ONE FIELD GATES STEP 1 (`asks=one`). The note and the date left the
 *     wizard; if either came back as a required field, the flow would simply be
 *     longer, which looks like a design choice rather than a regression.
 *  2. THE DOOR RENDERS AT THE CAP AND NEVER AFTER A CREATION IN THE SESSION
 *     (`limit=door`). This is the sharpest one: creating an event puts a Free
 *     host AT their cap, and the post-create RSC refresh re-renders this route
 *     with `atCap` true. A wizard reading the live prop would replace the beat
 *     with a refusal a half-second after a successful create — no error, no
 *     crash, just the host being told off for succeeding.
 *  3. CREATE ENDS ON THE BEAT, ONCE (`landing=beat`). By construction: only
 *     Create reaches the beat.
 *  4. THE PAPER IS REACHABLE AND IS OUTSIDE THE APP SHELL (`venue=sheet`), and
 *     the two sharing surfaces stayed one (`hand=same`).
 *
 * And the look step (`look=places`, Will 2026-10-03): her code where guests
 * meet it, on her phone and on the room's screen, four looks re-dressing both;
 * and the add step before it (`add=styles`, Will 2026-10-04), which opens
 * answered, so a name is still all Create asks for.
 *
 * No class, size, word or duration is pinned, but for the one fact a word
 * carries: the look step's codes are SAMPLES (below).
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

const createEventInWizard = vi.hoisted(() => vi.fn());
vi.mock("@/app/(app)/dashboard/actions", () => ({ createEventInWizard }));

// `qr-code-styling` touches window/document on construction and is loaded
// inside an effect by StyledQr; the pictures and the beat's plate are pictures
// of a code, and this contract is about the STEPS: which link each one
// encodes, and which look it wears.
vi.mock("@/components/app/styled-qr", () => ({
  StyledQr: ({
    value,
    style,
  }: {
    value: string;
    style: { dotsOptions: { type: string } };
  }) => (
    <div
      data-testid="styled-qr"
      data-value={value}
      data-dots={style.dotsOptions.type}
    />
  ),
}));

// The pricing sheet POSTs to Checkout and reads the root tooltip provider; the
// door's job here is to OFFER it, not to be it.
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: () => null,
}));
vi.mock("@/components/shared/glow", () => ({ Glow: () => null }));

const EVENT = {
  id: "evt_1",
  name: "Maya & Sam's Wedding",
  qr_token: "tok_abc",
  qr_style: "classic",
};

function renderWizard(
  props: Partial<Parameters<typeof CreateEventWizard>[0]> = {},
) {
  return render(
    <CreateEventWizard
      siteUrl="https://partyreel.com"
      planName="Free"
      tier="free"
      atCap={false}
      maxEvents={1}
      cappedEvents={[]}
      {...props}
    />,
  );
}

async function toTheLook() {
  renderWizard();
  await userEvent.type(screen.getByRole("textbox"), EVENT.name);
  await userEvent.click(screen.getByRole("button", { name: /continue/i }));
  // The add step (create-wizard r3's add=styles) stands between the name and the look; it opens on Live, so Continue
  // alone keeps the album as every host who never touched a setting has it.
  await screen.findByRole("radiogroup", { name: /album style/i });
  await userEvent.click(screen.getByRole("button", { name: /continue/i }));
  await screen.findByRole("button", { name: /create event/i });
}

beforeEach(() => {
  push.mockClear();
  createEventInWizard.mockReset();
  createEventInWizard.mockResolvedValue({ ok: true, event: EVENT });
});

describe("what creating asks for", () => {
  it("asks for a name and nothing else", () => {
    renderWizard();
    // Exactly one text field on the opening step. A note or a date coming back
    // is the regression, and it would look like a longer form, not a bug.
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
  });

  it("refuses to advance on an empty name, and says why", async () => {
    renderWizard();
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /create event/i }),
      ).not.toBeInTheDocument(),
    );
    // The schema's own sentence, under the field it is about.
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      /give your event a name/i,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("advances on a name alone, Enter as well as Continue", async () => {
    renderWizard();
    await userEvent.type(screen.getByRole("textbox"), `${EVENT.name}{Enter}`);
    // ★ RESHAPED ON PURPOSE (create-wizard r3's add=styles; scar kept: a name alone is enough to go on): the screen
    // after the name is the album's style now, which opens on its answer (Live), so nothing more is required of her.
    expect(
      await screen.findByRole("radiogroup", { name: /album style/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^live\./i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("asks nothing more than a name: the album's style opens answered, and a Create from it needs no pick", async () => {
    await toTheLook();
    await userEvent.click(
      await screen.findByRole("button", { name: /create event/i }),
    );
    await screen.findByRole("button", { name: /get it ready/i });
    expect(createEventInWizard).toHaveBeenCalledWith(
      expect.objectContaining({
        name: EVENT.name,
        capture: "upload",
        moderation_mode: "live",
        develops_at: null,
      }),
    );
  });
});

describe("the look step (look=places)", () => {
  it("offers every look as one choice, round-tripping the pick", async () => {
    await toTheLook();
    // ★ RESHAPED ON PURPOSE (create-wizard r2's `look=places`; scar kept: one per preset, exactly one
    // chosen at a time): the four looks are a radio group of corners under the two places now, where
    // they were four aria-pressed cards; a group says "one of four" for itself.
    const group = screen.getByRole("radiogroup", { name: /look/i });
    const looks = within(group).getAllByRole("radio");
    expect(looks).toHaveLength(QR_STYLE_KEYS.length);
    const checked = () =>
      looks.filter((b) => b.getAttribute("aria-checked") === "true");
    expect(checked()).toHaveLength(1);

    const last = looks[looks.length - 1];
    await userEvent.click(last);
    await waitFor(() => expect(last).toHaveAttribute("aria-checked", "true"));
    expect(checked()).toHaveLength(1);
  });

  it("★ re-dresses both places she will meet her code in, her phone and the room's screen", async () => {
    await toTheLook();
    const places = (pic: string) =>
      document
        .querySelector(`[data-look-picture="${pic}"]`)
        ?.querySelector<HTMLElement>("[data-testid='styled-qr']")?.dataset.dots;
    expect(places("code-card")).toBe("square");
    expect(places("room-screen")).toBe("square");
    await userEvent.click(screen.getByRole("radio", { name: /dots/i }));
    expect(places("code-card")).toBe("dots");
    expect(places("room-screen")).toBe("dots");
  });

  it("previews against a stand-in the same length as a real token", async () => {
    // The real qr_token does not exist before the insert, and a short
    // placeholder would draw a code at a DIFFERENT module count from the one the
    // host ends up with — the picker would be previewing a different object.
    await toTheLook();
    const values = screen
      .getAllByTestId("styled-qr")
      .map((n) => n.getAttribute("data-value") ?? "");
    expect(values.length).toBeGreaterThan(0);
    for (const v of values) {
      expect(v).toMatch(/\/e\/[A-Za-z0-9]{32}$/);
    }
  });

  it("★ says its codes are samples, never what the guests will scan (crumbs-42)", async () => {
    // Every code on the step encodes the stand-in link, which opens no event: a
    // host who test-scanned one met a 404 and nothing on the step had said why.
    // The event, and so its real link, exists only once Create is pressed (an
    // abandoned wizard leaves no row), so the step says what she is looking at.
    // ★ RESHAPED ON PURPOSE (create-wizard r1's carried `sample`, kept by r2; scar kept): one word,
    // Sample, on the pictured code, where a sentence ("These are samples...") stood over the cards.
    await toTheLook();
    expect(screen.getByText(/^sample$/i)).toBeInTheDocument();
    expect(screen.queryByText(/what your guests scan/i)).toBeNull();
  });
});

describe("where Create lands", () => {
  it("ends on the beat, carrying the real code and both ways out", async () => {
    await toTheLook();
    await userEvent.click(
      await screen.findByRole("button", { name: /create event/i }),
    );

    // The beat, and the REAL token rather than the preview stand-in.
    expect(
      await screen.findByRole("button", { name: /get it ready/i }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByTestId("styled-qr")
        .map((n) => n.getAttribute("data-value")),
    ).toContain(`https://partyreel.com/e/${EVENT.qr_token}`);
    expect(screen.getByRole("link", { name: /print/i })).toHaveAttribute(
      "href",
      `/dashboard/${EVENT.id}/print`,
    );
    expect(
      screen.getByRole("button", { name: /^(share|copy link)$/i }),
    ).toBeInTheDocument();
    // The event is created ONCE, at commit. A second insert here would mean an
    // abandoned row for every host who pressed twice.
    expect(createEventInWizard).toHaveBeenCalledTimes(1);
  });

  it("never navigates by itself: the beat has an end the host chooses", async () => {
    await toTheLook();
    await userEvent.click(
      await screen.findByRole("button", { name: /create event/i }),
    );
    await screen.findByRole("button", { name: /get it ready/i });
    expect(push).not.toHaveBeenCalled();
    // ★ RESHAPED ON PURPOSE (create-wizard r2's carried `close`; scar kept: the event itself stays one
    // press away): Go to your event moved from a ghost beside Get it ready into the room's close.
    expect(
      screen.getByRole("link", { name: /go to your event/i }),
    ).toHaveAttribute("href", `/dashboard/${EVENT.id}`);
  });
});

describe("the door at the cap", () => {
  it("refuses before the form opens, naming the plan's number and the event", () => {
    renderWizard({
      atCap: true,
      maxEvents: 1,
      cappedEvents: [{ id: "evt_0", name: "Theo's 30th" }],
    });
    // No field at all: the whole verdict is that the work is not done first.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Theo's 30th/).length).toBeGreaterThan(0);
    // Both ways forward, and the delete door lands where delete actually lives.
    expect(screen.getByRole("link", { name: /delete it/i })).toHaveAttribute(
      "href",
      "/dashboard/evt_0?room=settings",
    );
    expect(screen.getByRole("button", { name: /pro/i })).toBeInTheDocument();
  });

  it("stands in the room, in his layout: the question up top, See Pro alone at the foot", () => {
    renderWizard({
      atCap: true,
      maxEvents: 1,
      cappedEvents: [{ id: "evt_0", name: "Theo's 30th" }],
    });
    const room = document.querySelector<HTMLElement>("[data-app-room]")!;
    expect(room.classList.contains("dark")).toBe(true);
    const page = room.querySelector<HTMLElement>("[data-room-page]")!;
    expect(
      (page.firstElementChild as HTMLElement).hasAttribute(
        "data-room-question",
      ),
    ).toBe(true);
    expect(within(page).getByRole("heading", { level: 1 })).toHaveTextContent(
      /free holds one event/i,
    );
    const foot = room.querySelector<HTMLElement>("[data-room-foot]")!;
    expect(within(foot).getAllByRole("button")).toHaveLength(1);
    expect(within(foot).getByRole("button")).toHaveAccessibleName(/pro/i);
    // A door is not a step: no steppers, and the close goes back to the events.
    expect(room.querySelector("[data-room-step]")).toBeNull();
    expect(screen.getByRole("link", { name: /^close$/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("says the NUMBER, so a stacked pass never reads 'one event'", () => {
    // profiles.event_slots overrides the static tier limit (billing-caps.md), so
    // a sentence with "one" written into it lies the first time somebody stacks.
    renderWizard({
      atCap: true,
      maxEvents: 3,
      cappedEvents: [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
        { id: "c", name: "C" },
      ],
    });
    expect(screen.getByText(/holds 3 events/i)).toBeInTheDocument();
  });

  it("★ never replaces the beat with the door after a creation in this session", async () => {
    // THE BUG THIS EXISTS FOR. The Server Action refreshes the route it was
    // called from, so the successful create hands this island `atCap: true`
    // milliseconds later. The beat must survive it.
    const { rerender } = renderWizard({ atCap: false, cappedEvents: [] });
    await userEvent.type(screen.getByRole("textbox"), EVENT.name);
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await screen.findByRole("radiogroup", { name: /album style/i });
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(
      await screen.findByRole("button", { name: /create event/i }),
    );
    await screen.findByRole("button", { name: /get it ready/i });

    rerender(
      <CreateEventWizard
        siteUrl="https://partyreel.com"
        planName="Free"
        tier="free"
        atCap
        maxEvents={1}
        cappedEvents={[{ id: EVENT.id, name: EVENT.name }]}
      />,
    );
    expect(
      screen.getByRole("button", { name: /get it ready/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /delete it/i }),
    ).not.toBeInTheDocument();
  });
});

/* ── The paper, and the one sharing surface ───────────────────────────────── */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const code = (rel: string) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("the print route", () => {
  const PAGE = "src/app/(print)/dashboard/[eventId]/print/page.tsx";
  const LAYOUT = "src/app/(print)/layout.tsx";

  it("lives OUTSIDE the app shell's route group", () => {
    // The shell's header is sticky, and a sticky header prints on every sheet:
    // a page of nine cards would come out stamped and one card short. The group
    // is the structural answer, so there is nothing to hide with a print rule.
    expect(() => read(PAGE)).not.toThrow();
    expect(code(LAYOUT)).not.toMatch(/AppShell/);
  });

  it("re-declares the auth gate it does not inherit", () => {
    // The (app) gate does not reach this group. A page that looks protected
    // because its sibling is, is the exact trap a new route group sets.
    const layout = code(LAYOUT);
    expect(/getRequestAuth\(\)|auth\.getUser\(\)/.test(layout)).toBe(true);
    expect(/getSession\(/.test(layout)).toBe(false);
    // And the event itself comes back through the RLS-scoped read, 404 on null. ★ RESHAPED ON PURPOSE
    // (crumbs-30; scar kept: 404 on null): the 404 is drawn, never thrown, as the hub's is (a thrown one was
    // the root's error shell here), so the pin reads the drawing (`page.test.tsx` pins what it draws).
    const page = code(PAGE);
    expect(/getEvent\(/.test(page)).toBe(true);
    expect(/if \(!event\) return <PrintNotFound \/>;/.test(page)).toBe(true);
    expect(/notFound\(\)/.test(page)).toBe(false);
  });

  it("renders the code with the ZERO-JS server renderer, never the client one", () => {
    // Nine codes on one page as nine client islands can lose the race with a
    // print dialog the host has already opened; a code that has not painted
    // prints as a blank square, on paper nobody checks until the party.
    const stock = code("src/components/app/print/print-stock.tsx");
    expect(/FooterQr/.test(stock)).toBe(true);
    expect(/StyledQr/.test(stock)).toBe(false);
    expect(
      /"use client"/.test(read("src/components/app/print/print-stock.tsx")),
    ).toBe(false);
  });

  it("encodes the PERMANENT link, never the slug", () => {
    // A slug can be released; a card already on a table cannot be reprinted.
    const page = code(PAGE);
    expect(/joinUrl=\{joinUrl\}/.test(page)).toBe(true);
    expect(
      /const joinUrl = `\$\{siteUrl\}\/e\/\$\{event\.qr_token\}`/.test(page),
    ).toBe(true);
  });

  it("sets no @page rule (the house doctrine: it cannot be scoped)", () => {
    const globals = read("src/app/globals.css");
    const marker = globals.indexOf("/* PRINT: the event's printable stock");
    expect(marker, "the stock print block is gone").toBeGreaterThan(-1);
    // Comments are stripped first: the block's own prose NAMES @page in order to
    // explain why it is banned, and a scan that reads the explanation as the
    // offence is a test that can only be passed by deleting its reason.
    const block = globals.slice(marker).replace(/\/\*[\s\S]*?\*\//g, "");
    expect(block).not.toContain("@page");
    // And every selector in it is scoped to the one opt-in hook.
    const selectors = block
      .split("\n")
      .filter((l) => l.trim().endsWith("{") && !l.includes("@media"))
      .map((l) => l.trim());
    expect(selectors.filter((s) => !s.includes("data-print-stock"))).toEqual(
      [],
    );
  });
});

describe("the one sharing surface", () => {
  it("retired the second one, and the card chip goes to the sheet", () => {
    // Two surfaces drawing the same code, the same copy row and two versions of
    // the same designer meant a fix to either only half-landed.
    expect(() => read("src/components/app/event-share-dialog.tsx")).toThrow();
    const chip = code("src/components/app/event-card-qr.tsx");
    expect(/\?room=share/.test(chip)).toBe(true);
  });

  it("gives the share sheet a door onto paper", () => {
    // The beat happens once in an event's life; the sheet is where a host comes
    // back the night before, which is when paper is actually wanted.
    const sheet = code("src/components/app/share/event-share-sheet.tsx");
    expect(/\/print`/.test(sheet)).toBe(true);
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QR_STYLE_KEYS } from "@/lib/constants/qr-presets";
import { CreateEventWizard } from "@/components/app/create-event-wizard";

/**
 * A HOST'S FIRST EVENT, FROM "CREATE" TO A CODE ON THE TABLE (the `first-event`
 * board, ruled whole by Will 2026-09-21).
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
 *     Create reaches step 3.
 *  4. THE PAPER IS REACHABLE AND IS OUTSIDE THE APP SHELL (`venue=sheet`), and
 *     the two sharing surfaces stayed one (`hand=same`).
 *
 * No class, size, word or duration is pinned.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

const createEventInWizard = vi.hoisted(() => vi.fn());
vi.mock("@/app/(app)/dashboard/actions", () => ({ createEventInWizard }));

// `qr-code-styling` touches window/document on construction and is loaded
// inside an effect by StyledQr; the swatches and the beat's plate are pictures
// of a code, and this contract is about the STEPS.
vi.mock("@/components/app/styled-qr", () => ({
  StyledQr: ({ value }: { value: string }) => (
    <div data-testid="styled-qr" data-value={value} />
  ),
}));

// The pricing sheet POSTs to Checkout and reads the root tooltip provider; the
// door's job here is to OFFER it, not to be it.
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: () => null,
}));

const EVENT = {
  id: "evt_1",
  name: "Maya & Sam's Wedding",
  qr_token: "tok_abc",
  qr_style: "classic",
};

function renderWizard(props: Partial<Parameters<typeof CreateEventWizard>[0]> = {}) {
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

  it("refuses to advance on an empty name", async () => {
    renderWizard();
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /create event/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it("advances on a name alone", async () => {
    renderWizard();
    await userEvent.type(screen.getByRole("textbox"), EVENT.name);
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      await screen.findByRole("button", { name: /create event/i }),
    ).toBeInTheDocument();
  });
});

describe("the style step", () => {
  it("offers every preset and round-trips the choice", async () => {
    renderWizard();
    await userEvent.type(screen.getByRole("textbox"), EVENT.name);
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await screen.findByRole("button", { name: /create event/i });

    // One swatch per preset key, each an aria-pressed toggle, exactly one of
    // which is pressed at a time.
    const swatches = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-pressed") !== null);
    expect(swatches).toHaveLength(QR_STYLE_KEYS.length);
    expect(swatches.filter((b) => b.getAttribute("aria-pressed") === "true"))
      .toHaveLength(1);

    const last = swatches[swatches.length - 1];
    await userEvent.click(last);
    await waitFor(() => expect(last).toHaveAttribute("aria-pressed", "true"));
    expect(
      swatches.filter((b) => b.getAttribute("aria-pressed") === "true"),
    ).toHaveLength(1);
  });

  it("previews against a stand-in the same length as a real token", async () => {
    // The real qr_token does not exist before the insert, and a short
    // placeholder would draw a code at a DIFFERENT module count from the one the
    // host ends up with — the picker would be previewing a different object.
    renderWizard();
    await userEvent.type(screen.getByRole("textbox"), EVENT.name);
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await screen.findByRole("button", { name: /create event/i });
    const values = screen
      .getAllByTestId("styled-qr")
      .map((n) => n.getAttribute("data-value") ?? "");
    expect(values.length).toBeGreaterThan(0);
    for (const v of values) {
      expect(v).toMatch(/\/e\/[A-Za-z0-9]{32}$/);
    }
  });
});

describe("where Create lands", () => {
  it("ends on the beat, carrying the real code and both doors", async () => {
    renderWizard();
    await userEvent.type(screen.getByRole("textbox"), EVENT.name);
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(
      await screen.findByRole("button", { name: /create event/i }),
    );

    // The beat, and the REAL token rather than the preview stand-in.
    expect(
      await screen.findByRole("button", { name: /go to your event/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("styled-qr")).toHaveAttribute(
      "data-value",
      `https://partyreel.com/e/${EVENT.qr_token}`,
    );
    expect(
      screen.getByRole("link", { name: /print/i }),
    ).toHaveAttribute("href", `/dashboard/${EVENT.id}/print`);
    expect(screen.getByRole("button", { name: /share the link/i })).toBeInTheDocument();
    // The event is created ONCE, at commit. A second insert here would mean an
    // abandoned row for every host who pressed twice.
    expect(createEventInWizard).toHaveBeenCalledTimes(1);
  });

  it("never navigates by itself: the beat has an end the host chooses", async () => {
    renderWizard();
    await userEvent.type(screen.getByRole("textbox"), EVENT.name);
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(
      await screen.findByRole("button", { name: /create event/i }),
    );
    expect(push).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: /go to your event/i }),
    );
    expect(push).toHaveBeenCalledWith(`/dashboard/${EVENT.id}`);
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
    expect(
      screen.getByRole("link", { name: /delete it/i }),
    ).toHaveAttribute("href", "/dashboard/evt_0?room=settings");
    expect(screen.getByRole("button", { name: /pro/i })).toBeInTheDocument();
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
    await userEvent.click(
      await screen.findByRole("button", { name: /create event/i }),
    );
    await screen.findByRole("button", { name: /go to your event/i });

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
      screen.getByRole("button", { name: /go to your event/i }),
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
    // And the event itself comes back through the RLS-scoped read, 404 on null.
    const page = code(PAGE);
    expect(/getEvent\(/.test(page)).toBe(true);
    expect(/notFound\(\)/.test(page)).toBe(true);
  });

  it("renders the code with the ZERO-JS server renderer, never the client one", () => {
    // Nine codes on one page as nine client islands can lose the race with a
    // print dialog the host has already opened; a code that has not painted
    // prints as a blank square, on paper nobody checks until the party.
    const stock = code("src/components/app/print/print-stock.tsx");
    expect(/FooterQr/.test(stock)).toBe(true);
    expect(/StyledQr/.test(stock)).toBe(false);
    expect(/"use client"/.test(read("src/components/app/print/print-stock.tsx"))).toBe(
      false,
    );
  });

  it("encodes the PERMANENT link, never the slug", () => {
    // A slug can be released; a card already on a table cannot be reprinted.
    const page = code(PAGE);
    expect(/joinUrl=\{joinUrl\}/.test(page)).toBe(true);
    expect(/const joinUrl = `\$\{siteUrl\}\/e\/\$\{event\.qr_token\}`/.test(page)).toBe(
      true,
    );
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
    expect(selectors.filter((s) => !s.includes("data-print-stock"))).toEqual([]);
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

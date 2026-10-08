import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BEAT_SUB,
  CreateEventWizard,
} from "@/components/app/create-event-wizard";
import { DEVELOP_QUESTION } from "@/components/app/create-event-wizard/develop-step";
import {
  HELD_DROPPED,
  HELD_QUESTION,
  heldFailure,
} from "@/components/app/create-event-wizard/held";

/**
 * THE BEAT, DEVELOPED (create-wizard r2 `beat=develop`, Will 2026-10-03), CREATE'S PAYOFF (r5's `close=enter`, Will
 * 2026-10-07): the code first and whole, the line under the question saying share it, her link as guests receive it
 * and Print and Share under the code, then Go to your event, the room opening into it; and a failed Create held right
 * there (r4's `failed=held`). The room around it (the question in one place, Back, the carry, the close) is
 * `room.test.tsx`'s; one field, the looks and the door at the cap are `create-flow.test.tsx`'s.
 *
 * What fails silently: a beat that shows the real code before the event exists (or the sample after), a share that
 * promises guests videos a Free album refuses, a link card that copies anything but the permanent link, a foot that
 * leads anywhere but her event, and a failed Create that strands her on a screen that says her event is live, loses
 * what she chose, or says so only in a toast. No word or class is pinned but where the word is the fact.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

const createEventInWizard = vi.hoisted(() => vi.fn());
vi.mock("@/app/(app)/dashboard/actions", () => ({ createEventInWizard }));

// The code is a picture here: which link it encodes and which look it wears are the facts.
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
const pricing = vi.hoisted(() => vi.fn());
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: (props: { open: boolean; trigger: { kind: string } }) => {
    pricing(props);
    return null;
  },
}));
vi.mock("@/components/shared/glow", () => ({ Glow: () => null }));

const EVENT = {
  id: "evt_1",
  name: "Maya's 30th",
  qr_token: "7f3a9c2e5b8d4f1a9e6c3b7d2a5f8e1c",
  qr_style: "rounded",
};
const REAL = `https://partyreel.com/e/${EVENT.qr_token}`;
const SAMPLE = /\/e\/0{32}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function renderWizard(storagePct = 10, tier: "free" | "pro" = "free") {
  return render(
    <CreateEventWizard
      siteUrl="https://partyreel.com"
      planName={tier === "free" ? "Free" : "Pro"}
      tier={tier}
      atCap={false}
      maxEvents={tier === "free" ? 1 : null}
      cappedEvents={[]}
      storagePct={storagePct}
    />,
  );
}

/** The foot once the event exists: Go to your event, a link into it. */
const goIn = () => screen.findByRole("link", { name: /^go to your event$/i });

/** The name given and the album's style left as it opens (Live): the look stands, and she picks Rounded. */
async function toTheLook() {
  await toTheAdd();
  await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
  await userEvent.click(await screen.findByRole("radio", { name: /rounded/i }));
}

/** The name given: the add step stands. */
async function toTheAdd() {
  await userEvent.type(screen.getByRole("textbox"), EVENT.name);
  await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
  await screen.findByRole("radiogroup", { name: /album style/i });
}

async function createIt(storagePct?: number, tier?: "free" | "pro") {
  renderWizard(storagePct, tier);
  await toTheLook();
  await userEvent.click(
    screen.getByRole("button", { name: /^create event$/i }),
  );
  await goIn();
}

const beat = () => document.querySelector<HTMLElement>("[data-beat]")!;
const codes = () =>
  within(beat())
    .getAllByTestId("styled-qr")
    .map((n) => ({ value: n.dataset.value!, dots: n.dataset.dots }));

beforeEach(() => {
  push.mockClear();
  pricing.mockClear();
  vi.mocked(toast.error).mockClear();
  createEventInWizard.mockReset();
  createEventInWizard.mockResolvedValue({ ok: true, event: EVENT });
});

describe("the code develops (beat=develop)", () => {
  it("★ stands the sample she styled while Create runs, saying it is a sample and nothing else yet", async () => {
    let answer!: (v: unknown) => void;
    createEventInWizard.mockReturnValue(
      new Promise((resolve) => (answer = resolve)),
    );
    renderWizard();
    await toTheLook();
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );

    // The sample, in the look she picked, and only it: the event and its link do not exist yet.
    expect(beat().dataset.beat).toBe("developing");
    expect(codes()).toEqual([
      { value: expect.stringMatching(SAMPLE), dots: "rounded" },
    ]);
    expect(within(beat()).getByText(/^sample$/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/creating/i);
    // Nothing that needs the event yet: no doors out, no way on.
    expect(screen.queryByRole("link", { name: /print/i })).toBeNull();
    expect(
      screen.queryByRole("link", { name: /^go to your event$/i }),
    ).toBeNull();

    await act(async () => answer({ ok: true, event: EVENT }));

    // Her own code, where the sample stood, in the same look.
    expect(beat().dataset.beat).toBe("arrived");
    expect(codes()).toContainEqual({ value: REAL, dots: "rounded" });
    expect(screen.getByRole("status")).toHaveTextContent(
      `${EVENT.name} is live`,
    );
    expect(createEventInWizard).toHaveBeenCalledTimes(1);
    expect(createEventInWizard).toHaveBeenCalledWith(
      expect.objectContaining({ name: EVENT.name, qr_style: "rounded" }),
      expect.stringMatching(UUID),
    );
  });

  it("puts the word Sample away once the code is hers", async () => {
    await createIt();
    expect(
      beat()
        .querySelector("[data-beat-sample-word]")
        ?.getAttribute("data-state"),
    ).toBe("gone");
  });
});

describe("Print and Share stand as rounds, her link above them", () => {
  const realClipboard = navigator.clipboard;
  const realShare = (navigator as { share?: unknown }).share;
  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: realClipboard,
      configurable: true,
    });
    if (realShare === undefined)
      delete (navigator as { share?: unknown }).share;
    else
      Object.defineProperty(navigator, "share", {
        value: realShare,
        configurable: true,
      });
  });

  it("opens the table cards in a tab of their own", async () => {
    await createIt();
    const print = within(beat()).getByRole("link", { name: /^print$/i });
    expect(print).toHaveAttribute("href", `/dashboard/${EVENT.id}/print`);
    expect(print).toHaveAttribute("target", "_blank");
  });

  it("★ copies the permanent link from her link's card, in one press, confirmed in place", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    await createIt();
    const link = within(beat()).getByRole("button", {
      name: /^copy the link/i,
    });
    // The album's own share card, its title as a chat unfurls it, and the link.
    expect(link.querySelector("img")?.getAttribute("src")).toBe(
      `/e/${EVENT.qr_token}/card?add`,
    );
    expect(link).toHaveTextContent(`Add photos to ${EVENT.name}`);
    expect(link).toHaveTextContent(`partyreel.com/e/${EVENT.qr_token}`);
    await userEvent.click(link);
    expect(writeText).toHaveBeenCalledWith(REAL);
    expect(link).toHaveTextContent("Copied");
  });

  it("draws Share only where the device has its own sheet: where it has none, the link above is the copy", async () => {
    delete (navigator as { share?: unknown }).share;
    await createIt();
    expect(
      within(beat()).queryByRole("button", { name: /^(share|copy link)$/i }),
    ).toBeNull();
  });

  it.each([
    ["free", "Add your photos to Maya's 30th"],
    ["pro", "Add your photos and videos to Maya's 30th"],
  ] as const)(
    "★ hands a %s album's message to the phone's sheet, saying only what the plan's album takes",
    async (tier, text) => {
      const share = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "share", {
        value: share,
        configurable: true,
      });
      await createIt(10, tier);
      await userEvent.click(
        within(beat()).getByRole("button", { name: /^share$/i }),
      );
      expect(share).toHaveBeenCalledWith({
        title: EVENT.name,
        text,
        url: REAL,
      });
    },
  );
});

/**
 * ★ RESHAPED ON PURPOSE (create-wizard r5's `close=enter`, Will 2026-10-07: "Nailing this seamless creation and entry
 * would be a huge win"; scar kept: the beat's words are true of the event she made, and room, where the account runs
 * short, is the plan's, said under the doors and never as the event's debt). r4's one line, what guests still need,
 * expired with `arrival=done`: a made event is ready, so the line under the question says share it.
 */
describe("the payoff (close=enter)", () => {
  it("★ says share it under the question, once the event is true, and nothing it still lacks", async () => {
    await createIt();
    expect(
      screen.getByRole("heading", { level: 1, name: `${EVENT.name} is live` }),
    ).toBeInTheDocument();
    const sub = document.querySelector<HTMLElement>("[data-room-sub]")!;
    expect(sub).toHaveTextContent(BEAT_SUB);
    expect(sub).not.toHaveAttribute("data-held");
    expect(beat().querySelector("[data-beat-needs]")).toBeNull();
    expect(within(beat()).queryAllByRole("listitem")).toEqual([]);
  });

  it("holds the line with the question while the code develops", async () => {
    createEventInWizard.mockReturnValue(new Promise(() => {}));
    renderWizard();
    await toTheLook();
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    const sub = document.querySelector<HTMLElement>("[data-room-sub]")!;
    expect(sub).toHaveAttribute("data-held");
    expect(sub).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the code first: her link under it, then Print and Share", async () => {
    await createIt();
    const code = within(beat()).getAllByTestId("styled-qr")[0]!;
    const link = beat().querySelector<HTMLElement>("[data-beat-link]")!;
    const print = within(beat()).getByRole("link", { name: /^print$/i });
    const after = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(after(code, link)).toBe(true);
    expect(after(link, print)).toBe(true);
  });

  it("★ lights the code once, in the event's own seed", async () => {
    await createIt();
    const light = beat().querySelector<HTMLElement>("[data-beat-light]")!;
    expect(light.style.getPropertyValue("--cr-seed")).toMatch(
      /^oklch\(0\.8 0\.085 \d+\)$/,
    );
  });

  it("★ says room under the doors once the account runs short (the carried `room`), its way on the plans", async () => {
    await createIt(92);
    const room = beat().querySelector<HTMLElement>("[data-beat-room]");
    expect(room).toHaveTextContent(/92% of your storage is used/i);
    await userEvent.click(
      within(room!).getByRole("button", { name: /plans/i }),
    );
    expect(pricing).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true, trigger: { kind: "room" } }),
    );
  });

  it("says nothing of room while the account has plenty", async () => {
    await createIt(40);
    expect(beat().querySelector("[data-beat-room]")).toBeNull();
  });
});

describe("the way on", () => {
  // ★ RESHAPED ON PURPOSE (create-wizard r5's `close=enter`): Get it ready opened Settings on its first step, a made event
  // met as "only halfway done". Its scar kept: the foot leads somewhere real and only once she presses. Go to your event
  // opens her event itself (a real link, so a new tab is the browser's own), the room opening into it.
  it("★ Go to your event opens her event, and only on her press", async () => {
    await createIt();
    expect(push).not.toHaveBeenCalled();
    const go = await goIn();
    expect(go).toHaveAttribute("href", `/dashboard/${EVENT.id}`);
    await userEvent.click(go);
    // No view transition in this browser: the plain change of page, never a broken one.
    expect(push).toHaveBeenCalledWith(`/dashboard/${EVENT.id}`);
  });

  it("★ leaves the head no second way out once the event exists (the carried `close-x`)", async () => {
    await createIt();
    const close = document.querySelector<HTMLElement>("[data-room-close]")!;
    expect(close).toHaveAttribute("data-gone");
    expect(close).toHaveAttribute("inert");
    expect(close).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("link", { name: /^close$/i })).toBeNull();
  });

  /**
   * ★ RESHAPED ON PURPOSE (create-wizard r4's `failed=held`, Will 2026-10-07: "if something goes wrong, it doesn't feel
   * frustrating or scary. Only easily correctable"; scar kept: a refused Create never says her event is live, keeps
   * everything she chose, says why, and lets her press again). Its reason "back to the look, a toast" expired: the
   * beat she is watching holds the failure, and a toast never carries one here.
   */
  it("★ a refused Create holds the beat she is watching: nothing live, nothing lost, why, and Try again; never a toast", async () => {
    const refused = {
      ok: false,
      code: "unknown",
      message: "You've created a lot of events today. Try again tomorrow.",
    } as const;
    createEventInWizard.mockResolvedValue(refused);
    renderWizard();
    await toTheLook();
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    const again = await screen.findByRole("button", { name: /^try again$/i });

    expect(beat().dataset.beat).toBe("failed");
    expect(
      screen.getByRole("heading", { level: 1, name: HELD_QUESTION }),
    ).toBeInTheDocument();
    // Still the sample she styled, saying so, and nothing that needs an event: no doors out, no way on.
    expect(codes()).toEqual([
      { value: expect.stringMatching(SAMPLE), dots: "rounded" },
    ]);
    expect(within(beat()).getByText(/^sample$/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /print/i })).toBeNull();
    expect(
      screen.queryByRole("link", { name: /^go to your event$/i }),
    ).toBeNull();
    // What is kept and why, in the words under her code, and for a reader in the room's status.
    const { line } = heldFailure(refused, { planName: "Free", maxEvents: 1 });
    expect(line).toContain(refused.message);
    expect(beat().querySelector("[data-beat-held]")).toHaveTextContent(line);
    expect(screen.getByRole("status")).toHaveTextContent(
      `${HELD_QUESTION}. ${line}`,
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();

    // Try again is the same Create, and this time the line answers.
    createEventInWizard.mockResolvedValue({ ok: true, event: EVENT });
    await userEvent.click(again);
    expect(await goIn()).toBeInTheDocument();
    expect(beat().dataset.beat).toBe("arrived");
    expect(codes()).toContainEqual({ value: REAL, dots: "rounded" });
    expect(createEventInWizard).toHaveBeenCalledTimes(2);
  });

  it("★ never develops for ever over a dropped connection: a rejected Create is held as the failure it is", async () => {
    createEventInWizard.mockRejectedValue(new TypeError("Failed to fetch"));
    renderWizard();
    await toTheLook();
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    await screen.findByRole("button", { name: /^try again$/i });
    expect(beat().dataset.beat).toBe("failed");
    expect(beat().querySelector("[data-beat-held]")).toHaveTextContent(
      HELD_DROPPED,
    );
    expect(document.querySelector("[data-app-room]")).not.toHaveAttribute(
      "aria-busy",
    );
    // And she can press it again: the one-create guard let go with the failure.
    createEventInWizard.mockResolvedValue({ ok: true, event: EVENT });
    await userEvent.click(screen.getByRole("button", { name: /^try again$/i }));
    expect(await goIn()).toBeInTheDocument();
  });

  /**
   * ★ RESHAPED ON PURPOSE (r4's `failed=held`; scar kept: the server's guard behind the door is met with the plan's
   * sentence and its Upgrade). Its reason "sends her to her events with a toast" expired: the beat holds it, the
   * plans' sheet opens from its foot, and nothing she chose is thrown away by a navigation.
   */
  it("★ holds a slot spent elsewhere with its Upgrade (the guard behind the door): the plans open, nothing leaves the room", async () => {
    const refused = {
      ok: false,
      code: "limit_reached",
      message: "You've reached the event limit for your plan.",
    } as const;
    createEventInWizard.mockResolvedValue(refused);
    renderWizard();
    await toTheLook();
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    const upgrade = await screen.findByRole("button", { name: /^upgrade$/i });
    expect(beat().querySelector("[data-beat-held]")).toHaveTextContent(
      heldFailure(refused, { planName: "Free", maxEvents: 1 }).line,
    );
    expect(screen.queryByRole("button", { name: /^try again$/i })).toBeNull();
    await userEvent.click(upgrade);
    expect(pricing).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true, trigger: { kind: "room" } }),
    );
    expect(push).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("★ Back from a held failure is there for a change: the look, her look kept, and Create event makes it", async () => {
    createEventInWizard.mockRejectedValue(new TypeError("Failed to fetch"));
    renderWizard();
    await toTheLook();
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    await screen.findByRole("button", { name: /^try again$/i });
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(screen.getByRole("radio", { name: /rounded/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.click(screen.getByRole("radio", { name: /dots/i }));
    createEventInWizard.mockResolvedValue({ ok: true, event: EVENT });
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    await goIn();
    expect(createEventInWizard).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: EVENT.name, qr_style: "dots" }),
      expect.stringMatching(UUID),
    );
  });
});

/**
 * ★ A CREATE WHOSE ANSWER IS LOST IS RETRIED UNDER THE SAME KEY (20261007120000, `events.create_key`). The server may have
 * made the event before the line dropped, and a Try again that was a fresh Create made a second one: a Free host's one event
 * spent on a duplicate. The key is the wizard's, one for the whole room: what the server does with it (hands the first
 * event back, refuses the duplicate) is `lib/db/mutations/events.test.ts`'s and the migration's own check.
 */
describe("the key of one Create (a retry returns the event the first try made)", () => {
  const keysSent = () => createEventInWizard.mock.calls.map((c) => c[1]);

  it("★ sends the same key with Try again as with the press that lost its answer", async () => {
    createEventInWizard.mockRejectedValue(new TypeError("Failed to fetch"));
    renderWizard();
    await toTheLook();
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: /^try again$/i }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: /^try again$/i }),
    );
    await waitFor(() => expect(createEventInWizard).toHaveBeenCalledTimes(3));
    const [first, ...rest] = keysSent();
    expect(first).toMatch(UUID);
    expect(rest).toEqual([first, first]);
  });

  it("★ keeps it across a Back and a changed answer: the retry is still that Create, whatever she changed", async () => {
    createEventInWizard.mockRejectedValue(new TypeError("Failed to fetch"));
    renderWizard();
    await toTheLook();
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    await screen.findByRole("button", { name: /^try again$/i });
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    await userEvent.click(screen.getByRole("radio", { name: /dots/i }));
    createEventInWizard.mockResolvedValue({ ok: true, event: EVENT });
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    await goIn();
    const [first, second] = keysSent();
    expect(first).toMatch(UUID);
    expect(second).toBe(first);
  });

  it("makes the key at the press, never at mount: a room she leaves unpressed made none", async () => {
    renderWizard();
    await toTheLook();
    expect(createEventInWizard).not.toHaveBeenCalled();
  });

  it("★ a new Create is a new room with a new key", async () => {
    createEventInWizard.mockResolvedValue({ ok: true, event: EVENT });
    await createIt();
    cleanup();
    await createIt();
    const [a, b] = keysSent();
    expect(a).toMatch(UUID);
    expect(b).toMatch(UUID);
    expect(b).not.toBe(a);
  });
});

/* ── the album's style at birth (create-wizard r3's add=styles, r4's styles=focused) ─────────────────────── */

/**
 * ★ A NEW EVENT IS BORN WITH ITS STYLE'S THREE COLUMNS IN ONE INSERT (`createFieldsOf`): what a host picked on the add
 * step (and a Disposable's own screen after it) is what the event is made with, and what Settings then shows (`styleOf`
 * of the row reads her pick back). What fails silently: a pick that never reaches the create (the event lands Live
 * whatever she chose), approval standing with a develop time, a Disposable made with no time or a time that has already
 * passed, and a pick lost across a Back.
 */
describe("the album's style at birth (add=styles)", () => {
  const style = (name: RegExp) => screen.getByRole("radio", { name });
  const onDevelopScreen = () =>
    screen.queryByRole("heading", { level: 1, name: DEVELOP_QUESTION }) !==
    null;

  /** Continue from the add step (through a Disposable's own screen), then Create event: what the create was sent. */
  async function created() {
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    if (onDevelopScreen())
      await userEvent.click(
        screen.getByRole("button", { name: /^continue$/i }),
      );
    await userEvent.click(
      await screen.findByRole("button", { name: /^create event$/i }),
    );
    await goIn();
    return createEventInWizard.mock.calls[0]![0] as {
      capture: string;
      moderation_mode: string;
      develops_at: string | null;
      roll_size: number | null;
    };
  }

  it("opens on Live, the album most hosts want and the columns' own default: Continue alone keeps it", async () => {
    renderWizard();
    await toTheAdd();
    expect(style(/^live\./i)).toHaveAttribute("aria-checked", "true");
    expect(await created()).toMatchObject({
      capture: "upload",
      moderation_mode: "live",
      develops_at: null,
    });
  });

  it("★ Review is born holding each upload for her: free uploads, approval, no develop time", async () => {
    renderWizard();
    await toTheAdd();
    await userEvent.click(style(/^review\./i));
    expect(await created()).toMatchObject({
      capture: "upload",
      moderation_mode: "hold_for_approval",
      develops_at: null,
    });
  });

  it("★ Disposable is born the album's camera with a develop time ahead, and never with approval", async () => {
    renderWizard();
    await toTheAdd();
    await userEvent.click(style(/^disposable\./i));
    const sent = await created();
    expect(sent).toMatchObject({ capture: "camera", moderation_mode: "live" });
    // Create knows no date: 9 am tomorrow, in her own clock, the camera settings' own default.
    const at = new Date(sent.develops_at!);
    expect(at.getTime()).toBeGreaterThan(Date.now());
    expect(at.getHours()).toBe(9);
  });

  it("★ the last pick is the style, however she moved between them: no half-state rides along", async () => {
    renderWizard();
    await toTheAdd();
    await userEvent.click(style(/^disposable\./i));
    await userEvent.click(style(/^review\./i));
    await userEvent.click(style(/^live\./i));
    await userEvent.click(style(/^disposable\./i));
    await userEvent.click(style(/^review\./i));
    // A Disposable's time left with its card, and approval never meets a develop time.
    expect(await created()).toEqual(
      expect.objectContaining({
        capture: "upload",
        moderation_mode: "hold_for_approval",
        develops_at: null,
      }),
    );
  });

  /**
   * ★ RESHAPED ON PURPOSE (r4's `styles=focused`; scar kept: her style, her time and her roll survive every Back and
   * Continue and ride the create). The time and the roll are set on the Disposable's own screen now, where they stood
   * under its card.
   */
  it("keeps her style, a develop time she moved and her roll across Back and Continue, through the Disposable's own screen", async () => {
    renderWizard();
    await toTheAdd();
    await userEvent.click(style(/^disposable\./i));
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(onDevelopScreen()).toBe(true);
    fireEvent.change(screen.getByLabelText("Develop time"), {
      target: { value: "2027-03-05T14:30" },
    });
    await userEvent.click(screen.getByRole("radio", { name: "36 shots" }));
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    await screen.findByRole("button", { name: /^create event$/i });
    // Back to the Disposable's screen, its time and roll as she left them, then back to the cards.
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(screen.getByLabelText("Develop time")).toHaveValue(
      "2027-03-05T14:30",
    );
    expect(screen.getByRole("radio", { name: "36 shots" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(style(/^disposable\./i)).toHaveAttribute("aria-checked", "true");
    const sent = await created();
    expect(new Date(sent.develops_at!).getTime()).toBe(
      new Date(2027, 2, 5, 14, 30).getTime(),
    );
    expect(sent.roll_size).toBe(36);
  });

  /**
   * ★ RESHAPED ON PURPOSE (r4's `styles=focused`; scar kept: a time that is no time stops her where its row is, in words
   * under it, and nothing is sent). Its row is on the Disposable's own screen now, so that is where she stops.
   */
  it("★ a develop time that is no time stops her on its own screen, in words under its row, and sends nothing", async () => {
    renderWizard();
    await toTheAdd();
    await userEvent.click(style(/^disposable\./i));
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    const field = screen.getByLabelText("Develop time");
    for (const [typed, words] of [
      ["", /finish the time/i],
      ["2020-01-01T09:00", /that time has passed/i],
      ["2099-01-01T09:00", /within a year/i],
      // A year left half typed (Chrome types 2027 as 0002, 0020, 0202 on its way): never a time anybody meant.
      ["0202-10-05T09:00", /pick a year/i],
    ] as const) {
      fireEvent.change(field, { target: { value: typed } });
      await userEvent.click(
        screen.getByRole("button", { name: /^continue$/i }),
      );
      expect(onDevelopScreen()).toBe(true);
      expect(field).toHaveAttribute("aria-invalid", "true");
      expect(field).toHaveAccessibleDescription(words);
    }
    expect(createEventInWizard).not.toHaveBeenCalled();
    // And a whole time ahead lets her on.
    fireEvent.change(field, { target: { value: "2027-03-05T14:30" } });
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(
      await screen.findByRole("button", { name: /^create event$/i }),
    ).toBeInTheDocument();
  });

  /** ★ RESHAPED ON PURPOSE (r4's `styles=focused`; scar kept: a passed time is never made, and she lands on its row). */
  it("★ a time that passed while she stood on the look is not made: back to its own screen, the words under its row", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date(2026, 9, 10, 20, 0, 0));
      renderWizard();
      await toTheAdd();
      await userEvent.click(style(/^disposable\./i));
      await userEvent.click(
        screen.getByRole("button", { name: /^continue$/i }),
      );
      await userEvent.click(
        screen.getByRole("button", { name: /^continue$/i }),
      );
      await screen.findByRole("button", { name: /^create event$/i });
      // She left the tab open past 9 am tomorrow.
      vi.setSystemTime(new Date(2026, 9, 11, 10, 0, 0));
      await userEvent.click(
        screen.getByRole("button", { name: /^create event$/i }),
      );
      expect(
        await screen.findByRole("heading", {
          level: 1,
          name: DEVELOP_QUESTION,
        }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Develop time")).toHaveAccessibleDescription(
        /that time has passed/i,
      );
      expect(createEventInWizard).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  /** ★ RESHAPED ON PURPOSE (r4's `failed=held`; scar kept: a refused Create keeps her style). Back walks from the hold. */
  it("a refused Create keeps her style, as it keeps her name and her look", async () => {
    createEventInWizard.mockResolvedValue({
      ok: false,
      code: "unknown",
      message: "The network dropped.",
    });
    renderWizard();
    await toTheAdd();
    await userEvent.click(style(/^review\./i));
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    await userEvent.click(
      await screen.findByRole("button", { name: /^create event$/i }),
    );
    await screen.findByRole("button", { name: /^try again$/i });
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(style(/^review\./i)).toHaveAttribute("aria-checked", "true");
  });
});

/* ── Make one like this (after-party r1's `bridge=end`) ─────────────────────────────────────────────────────── */

/**
 * ★ CREATE, OPENED IN AN ALBUM'S STYLE, ASKS ONLY HER NAME (`like.ts`): the album's style and its code's look answer
 * Create's two style screens, a chip says what was carried with Change beside it, and the foot under her name is Create
 * event. What fails silently: a carried style that never reaches the create, a Change that loses the album's answers,
 * and a Disposable made with the album's develop time (a time that is not hers) or with no screen to set her own.
 */
describe("Make one like this: Create in an album's style (bridge=end)", () => {
  function renderLike(like: {
    style: "live" | "approval" | "disposable";
    look: "classic" | "bold" | "rounded" | "dots";
    roll: number | null;
  }) {
    return render(
      <CreateEventWizard
        siteUrl="https://partyreel.com"
        planName="Free"
        tier="free"
        atCap={false}
        maxEvents={1}
        cappedEvents={[]}
        like={like}
      />,
    );
  }
  const stepSaid = () =>
    document.querySelector("[data-room-head] .sr-only")?.textContent;
  const sent = () => createEventInWizard.mock.calls.at(-1)?.[0];

  it("★ asks only her name, says what it carried, and makes the event from the name's own foot", async () => {
    renderLike({ style: "approval", look: "dots", roll: null });
    expect(stepSaid()).toBe("Step 1 of 2");
    expect(
      document.querySelector("[data-room-carried-words]")?.textContent,
    ).toBe("Review · Dots code");
    await userEvent.type(screen.getByRole("textbox"), EVENT.name);
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    await goIn();
    expect(sent()).toMatchObject({
      name: EVENT.name,
      qr_style: "dots",
      capture: "upload",
      moderation_mode: "hold_for_approval",
      develops_at: null,
    });
  });

  it("★ Change puts the two style screens back, the album's answers picked on them", async () => {
    renderLike({ style: "approval", look: "dots", roll: null });
    await userEvent.click(screen.getByRole("button", { name: /^change$/i }));
    expect(stepSaid()).toBe("Step 1 of 4");
    expect(document.querySelector("[data-room-carried]")).toBeNull();
    await userEvent.type(screen.getByRole("textbox"), EVENT.name);
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(screen.getByRole("radio", { name: /^review\./i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(screen.getByRole("radio", { name: /dots/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("★ keeps a Disposable's own screen, its time hers and never the album's, its roll the album's", async () => {
    renderLike({ style: "disposable", look: "classic", roll: 36 });
    expect(stepSaid()).toBe("Step 1 of 3");
    await userEvent.type(screen.getByRole("textbox"), EVENT.name);
    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(
      screen.getByRole("heading", { level: 1, name: DEVELOP_QUESTION }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "36 shots" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    await goIn();
    const made = sent()!;
    expect(made).toMatchObject({
      capture: "camera",
      moderation_mode: "live",
      roll_size: 36,
    });
    // Her own 9 am tomorrow, offered by Create, never a time the album carried.
    const at = new Date(made.develops_at);
    expect(at.getTime()).toBeGreaterThan(Date.now());
    expect(at.getHours()).toBe(9);
  });
});

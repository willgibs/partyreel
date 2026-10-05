import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CheckoutButton } from "@/components/app/checkout-button";
import type { ManageBillingButton } from "@/components/app/manage-billing-button";
import type { PlanFacts } from "@/lib/billing/plan-facts";
import { GIGABYTE, planById, plansForTier } from "@/lib/constants/tiers";

import { PricingDoorsProvider, type PricingDoors } from "./pricing-doors";
import { PricingSheet } from "./pricing-sheet";
import { WelcomeToPro } from "./welcome-to-pro";

/**
 * THE SURFACE'S DOORS CHANGE NOTHING UNTIL A SPECIMEN HANDS IN ITS OWN (`pricing-doors.tsx`).
 *
 * Two halves, and each fails the way it should. With no provider, which is every page of the app, the sheet reads the
 * server's route exactly as it did and every press reaches the route it reached: Checkout, the billing portal, the
 * change-plan route. With a provider, the Library's, none of it does: nothing is fetched at all, the sheet opens on what
 * the doors answer, the stand-in buttons stand where the real ones did, and the receipt's router verbs go to the router
 * the specimen named. A door a stand-in forgot would not compile (`PricingDoors` is named in full), so the one thing a
 * test must hold is the behaviour on each side. And the provider is the lab's: nothing in the product imports it.
 */

const router = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const FACTS_URL = "/api/stripe/plan-facts";

/** What each route answers, by path: the sheet's read, and the refusals the presses meet. */
let served: PlanFacts | null = null;
const fetchMock = vi.fn();

function facts(over: Partial<PlanFacts>): PlanFacts {
  return {
    tier: "free",
    hasBilling: false,
    passExpiry: null,
    storedBytes: 0,
    deletedBytes: 0,
    capBytes: planById("free").storageBytes,
    monthUploadedBytes: 0,
    currentPlanId: null,
    changeBlocked: null,
    ...over,
  };
}

/** The size the sheet opens a free host on: the smallest Pro, at the cadence it shows first. */
const OPENING = plansForTier("pro")[0].id;

const PRO_FACTS = facts({
  tier: "pro",
  hasBilling: true,
  capBytes: planById("pro_200").storageBytes,
  storedBytes: 20 * GIGABYTE,
  currentPlanId: "pro_200",
});

beforeEach(() => {
  served = null;
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string) => {
    if (url === FACTS_URL && served)
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, facts: served }),
      };
    // Every other route refuses, so no press leaves the test and each answers as a lapsed session would not.
    return { ok: false, status: 500, json: async () => ({ message: "no" }) };
  });
  vi.stubGlobal("fetch", fetchMock);
  Object.values(router).forEach((fn) => fn.mockClear());
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const calls = (path: string) =>
  fetchMock.mock.calls.filter(([url]) => url === path);

describe("with no provider, the surface reaches what it always reached", () => {
  it("★ reads the server's facts route each time the sheet opens, no-store and abortable", async () => {
    served = PRO_FACTS;
    render(
      <PricingSheet
        open
        onOpenChange={() => {}}
        trigger={{ kind: "plan" }}
        plan={{ tier: "free", hasBilling: false }}
      />,
    );
    await waitFor(() => expect(calls(FACTS_URL)).toHaveLength(1));
    const [, init] = calls(FACTS_URL)[0];
    expect(init.cache).toBe("no-store");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    // And it believes the read: the plan she is on, from the route's answer.
    expect(
      await screen.findByRole("heading", { name: /pro 200 gb/i }),
    ).toBeInTheDocument();
  });

  it("★ a free host's Get Pro posts to the Checkout route with its plan", async () => {
    render(
      <PricingSheet
        open
        onOpenChange={() => {}}
        trigger={{ kind: "plan" }}
        plan={{ tier: "free", hasBilling: false }}
        returnTo="/dashboard"
      />,
    );
    const dialog = screen.getByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /^get pro/i }),
    );
    await waitFor(() => expect(calls("/api/stripe/checkout")).toHaveLength(1));
    const [, init] = calls("/api/stripe/checkout")[0];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({
      planId: OPENING,
      next: "/dashboard",
    });
  });

  it("★ a Pro host's Manage billing posts to the portal route, and a Switch to the change-plan route", async () => {
    served = PRO_FACTS;
    render(
      <PricingSheet
        open
        onOpenChange={() => {}}
        trigger={{ kind: "plan" }}
        plan={{ tier: "pro", hasBilling: true }}
      />,
    );
    const dialog = screen.getByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /manage billing/i }),
    );
    await waitFor(() => expect(calls("/api/stripe/portal")).toHaveLength(1));
    expect(calls("/api/stripe/portal")[0][1].method).toBe("POST");

    // Her plan is read before a size offers a move.
    const row = await waitFor(() => {
      const el = dialog.querySelector('[data-price-row="pro_1tb"]');
      expect(el).toBeTruthy();
      return el as HTMLElement;
    });
    await userEvent.click(within(row).getByRole("button", { name: /switch/i }));
    await waitFor(() =>
      expect(calls("/api/stripe/change-plan")).toHaveLength(1),
    );
    expect(
      JSON.parse(calls("/api/stripe/change-plan")[0][1].body),
    ).toMatchObject({ planId: "pro_1tb" });
  });

  it("★ the receipt strips its marker through the app's own router", async () => {
    render(
      <WelcomeToPro
        applied
        planName="Pro"
        capBytes={200 * GIGABYTE}
        nextUrl="/dashboard"
        door={{ label: "Go to your dashboard" }}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /go to your dashboard/i }),
    );
    expect(router.replace).toHaveBeenCalledWith("/dashboard", {
      scroll: false,
    });
  });
});

/** The stand-ins a Library specimen would hand in: the buttons keep their contract (their types are the real ones'). */
const StandInCheckout: typeof CheckoutButton = ({ planId, children }) => (
  <button type="button" data-stand-in-checkout={planId}>
    {children}
  </button>
);
const StandInPortal: typeof ManageBillingButton = () => (
  <button type="button" data-stand-in-portal="">
    Manage billing
  </button>
);

function doors(over: Partial<PricingDoors> = {}): PricingDoors {
  return {
    readFacts: vi.fn(async () => ({ ok: true, facts: PRO_FACTS })),
    changePlan: vi.fn(async () => ({
      kind: "error" as const,
      message: "The Library stops here.",
      code: "already_on_plan",
    })),
    CheckoutButton: StandInCheckout,
    ManageBillingButton: StandInPortal,
    router: {
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
    },
    ...over,
  };
}

/** Her 1 TB size's Switch, once her plan has been read and the list offers a move. */
async function pressSwitch() {
  const dialog = screen.getByRole("dialog");
  const row = await waitFor(() => {
    const el = dialog.querySelector('[data-price-row="pro_1tb"]');
    expect(el).toBeTruthy();
    expect(within(el as HTMLElement).queryByRole("button")).toBeTruthy();
    return el as HTMLElement;
  });
  await userEvent.click(within(row).getByRole("button", { name: /switch/i }));
}

describe("with a provider, nothing reaches the network or the app's router", () => {
  it("★ opens on what the doors answer, draws the stand-in buttons and fetches nothing", async () => {
    const own = doors();
    render(
      <PricingDoorsProvider doors={own}>
        <PricingSheet
          open
          onOpenChange={() => {}}
          trigger={{ kind: "plan" }}
          plan={{ tier: "pro", hasBilling: true }}
        />
      </PricingDoorsProvider>,
    );
    const dialog = screen.getByRole("dialog");
    expect(
      await screen.findByRole("heading", { name: /pro 200 gb/i }),
    ).toBeInTheDocument();
    expect(own.readFacts).toHaveBeenCalledTimes(1);
    expect(vi.mocked(own.readFacts).mock.calls[0][0]).toBeInstanceOf(
      AbortSignal,
    );
    expect(dialog.querySelector("[data-stand-in-portal]")).toBeTruthy();
    // Not one request, the facts' own included.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("★ a free host's Get Pro is the stand-in, never the Checkout route", async () => {
    render(
      <PricingDoorsProvider doors={doors({ readFacts: async () => null })}>
        <PricingSheet
          open
          onOpenChange={() => {}}
          trigger={{ kind: "plan" }}
          plan={{ tier: "free", hasBilling: false }}
        />
      </PricingDoorsProvider>,
    );
    const dialog = screen.getByRole("dialog");
    // Both the Pro card's buy and the pass line's are the surface's Checkout door.
    const stand = dialog.querySelectorAll("[data-stand-in-checkout]");
    expect(
      [...stand].map((el) => el.getAttribute("data-stand-in-checkout")),
    ).toEqual([OPENING, "event_pass"]);
    await userEvent.click(stand[0]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("★ a Switch asks the doors' change-plan, with the plan and where to come back to", async () => {
    const own = doors();
    render(
      <PricingDoorsProvider doors={own}>
        <PricingSheet
          open
          onOpenChange={() => {}}
          trigger={{ kind: "plan" }}
          plan={{ tier: "pro", hasBilling: true }}
          returnTo="/account"
        />
      </PricingDoorsProvider>,
    );
    await pressSwitch();
    await waitFor(() =>
      expect(own.changePlan).toHaveBeenCalledWith("pro_1tb", "/account"),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("★ a lapsed session's sign-in goes to the doors' router, never the app's", async () => {
    const signedOut = doors({
      changePlan: vi.fn(async () => ({ kind: "signin" as const })),
    });
    render(
      <PricingDoorsProvider doors={signedOut}>
        <PricingSheet
          open
          onOpenChange={() => {}}
          trigger={{ kind: "plan" }}
          plan={{ tier: "pro", hasBilling: true }}
        />
      </PricingDoorsProvider>,
    );
    await pressSwitch();
    await waitFor(() => expect(signedOut.router!.push).toHaveBeenCalled());
    expect(router.push).not.toHaveBeenCalled();
  });

  it("★ the receipt's router verbs go to the router the specimen named", async () => {
    const own = doors();
    render(
      <PricingDoorsProvider doors={own}>
        <WelcomeToPro
          applied
          planName="Pro"
          capBytes={200 * GIGABYTE}
          nextUrl="/dashboard"
          door={{ label: "Go to your dashboard" }}
        />
      </PricingDoorsProvider>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /go to your dashboard/i }),
    );
    expect(own.router!.replace).toHaveBeenCalledWith("/dashboard", {
      scroll: false,
    });
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe("a door's read is as forgiving as the route's was", () => {
  const sheet = (
    plan: { tier: "free" | "pro"; hasBilling: boolean },
    open = true,
  ) => (
    <PricingSheet
      open={open}
      onOpenChange={() => {}}
      trigger={{ kind: "plan" }}
      plan={plan}
    />
  );

  it("★ a read that cannot be made keeps the plan the door passed, and says nothing", async () => {
    const own = doors({
      readFacts: vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    });
    render(
      <PricingDoorsProvider doors={own}>
        {sheet({ tier: "pro", hasBilling: true })}
      </PricingDoorsProvider>,
    );
    const dialog = screen.getByRole("dialog");
    await waitFor(() => expect(own.readFacts).toHaveBeenCalled());
    // The first paint stands: a Pro host's sheet, her sizes listed (the list is quiet only until the read settles).
    await waitFor(() =>
      expect(dialog.querySelectorAll("[data-price-row]")).toHaveLength(3),
    );
    expect(
      within(dialog).getByRole("button", { name: /manage billing/i }),
    ).toBeInTheDocument();
  });

  it("★ an answer the reader refuses is ignored, never drawn", async () => {
    const own = doors({
      readFacts: vi.fn(async () => ({ ok: true, facts: { tier: "gold" } })),
    });
    render(
      <PricingDoorsProvider doors={own}>
        {sheet({ tier: "free", hasBilling: false })}
      </PricingDoorsProvider>,
    );
    const dialog = screen.getByRole("dialog");
    await waitFor(() => expect(own.readFacts).toHaveBeenCalled());
    // Still a Free host's sheet: the Pro card, and no list of sizes.
    expect(dialog.querySelector("[data-plan]")).toBeTruthy();
    expect(dialog.querySelector("[data-price-row]")).toBeNull();
  });

  it("★ closing the sheet aborts its read, and an answer that lands later changes nothing", async () => {
    let answer: (value: unknown) => void = () => {};
    let seen: AbortSignal | undefined;
    const own = doors({
      readFacts: vi.fn(
        (signal: AbortSignal) =>
          new Promise<unknown>((resolve) => {
            seen = signal;
            answer = resolve;
          }),
      ),
    });
    const { rerender } = render(
      <PricingDoorsProvider doors={own}>
        {sheet({ tier: "free", hasBilling: false })}
      </PricingDoorsProvider>,
    );
    await waitFor(() => expect(seen).toBeDefined());
    expect(seen!.aborted).toBe(false);
    rerender(
      <PricingDoorsProvider doors={own}>
        {sheet({ tier: "free", hasBilling: false }, false)}
      </PricingDoorsProvider>,
    );
    expect(seen!.aborted).toBe(true);
    // The Pro answer arrives after the sheet has gone: it is dropped, and nothing throws.
    await act(async () => {
      answer({ ok: true, facts: PRO_FACTS });
      await Promise.resolve();
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

/** Every source file under src, relative, minus tests: what ships or builds. */
function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe("the provider is the lab's", () => {
  it("★ no product file hands the surface its own doors", () => {
    const root = process.cwd();
    const strays = sources(join(root, "src"))
      .map((p) => relative(root, p))
      // Where it is defined, and the lab, whose specimens are what it is for.
      .filter((f) => f !== "src/components/app/pricing/pricing-doors.tsx")
      .filter((f) => !f.startsWith("src/app/(dev)/design/"))
      // An IMPORT of it, not a mention: the sheet's own header names the provider it reads from.
      .filter((f) =>
        /import\s*(?:type\s*)?\{[^}]*\bPricingDoorsProvider\b[^}]*\}\s*from/.test(
          readFileSync(join(root, f), "utf8"),
        ),
      );
    expect(
      strays,
      "a product file swaps the pricing surface's doors: it would sell nothing and read nothing, and no gate would see it",
    ).toEqual([]);
  });
});

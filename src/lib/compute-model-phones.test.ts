import { describe, expect, it, vi } from "vitest";

import {
  deviceRegistry,
  doorButton,
  doorScreen,
  nameContinue,
  nameScreen,
  nextDoorPress,
  ownRecords,
  submitName,
  walkToName,
} from "../../scripts/compute-model/phones.mjs";

/**
 * THE COMPUTE HARNESS'S PHONES (`scripts/compute-model/phones.mjs`, red-team 53b's deferred line, crumbs-66): what
 * `pnpm compute:model` guarantees about the devices it drives, held here because `run.mjs` measures the moment it is
 * loaded and so cannot be imported.
 *
 *   1. A SCENARIO'S PHONES ARE CLOSED WHATEVER BECOMES OF IT: an errored scenario's devices were left open, polling under
 *      the next scenarios' labels.
 *   2. THE DOOR'S WALK PRESSES WHAT IS ON SCREEN: a press that did nothing (measured under a CPU throttle: the name's
 *      Continue, with no mint sent and the sheet still up) is made again, where the old walk pressed once and waited out
 *      twenty seconds, which is how the first scenario of a full run timed out at the door's name step. A repeat never
 *      mints a second guest, and the walk presses the door's three buttons and no other: it never signs anyone in.
 */

describe("a scenario's phones", () => {
  const phone = (close = vi.fn(async () => {})) => ({ close });

  it("★ are all closed when the scenario ends, though it threw with them open", async () => {
    const opened = [phone(), phone()];
    const queue = [...opened];
    const phones = deviceRegistry(async () => queue.shift());
    const scenario = async () => {
      await phones.device({}, { name: "listener" });
      await phones.device({}, { name: "uploader" });
      throw new Error("timed out at the door's name step");
    };
    await expect(scenario()).rejects.toThrow("name step");
    expect(phones.open()).toBe(2);

    await phones.closeAll();

    expect(opened[0]!.close).toHaveBeenCalledTimes(1);
    expect(opened[1]!.close).toHaveBeenCalledTimes(1);
    expect(phones.open()).toBe(0);
  });

  it("★ never leaves the rest polling because one will not close", async () => {
    const stuck = phone(
      vi.fn(async () => {
        throw new Error("Target closed");
      }),
    );
    const fine = phone();
    const queue = [stuck, fine];
    const phones = deviceRegistry(async () => queue.shift());
    await phones.device({}, {});
    await phones.device({}, {});

    await expect(phones.closeAll()).resolves.toBeUndefined();

    expect(stuck.close).toHaveBeenCalledTimes(1);
    expect(fine.close).toHaveBeenCalledTimes(1);
  });

  it("hands the next scenario an empty registry, and closes a phone once however often it is asked", async () => {
    const one = phone();
    const phones = deviceRegistry(async () => one);
    await phones.device({}, {});
    await phones.closeAll();
    await phones.closeAll();
    expect(one.close).toHaveBeenCalledTimes(1);
    expect(phones.open()).toBe(0);
  });

  it("opens each phone with the browser and options the scenario gave", async () => {
    const open = vi.fn(async () => phone());
    const phones = deviceRegistry(open);
    const browser = { id: "chrome" };
    await phones.device(browser, {
      name: "uploader",
      base: "http://localhost:3132",
    });
    expect(open).toHaveBeenCalledWith(browser, {
      name: "uploader",
      base: "http://localhost:3132",
    });
  });
});

/** What the door really shows, by its labels as the walk reads them (the chooser's button carries its hint). */
const WELCOME = ["Start for free", "Continue"];
const CHOOSER = [
  "Continue as guestJust your name",
  "Create accountEvery photo you add stays with you",
  "Log inThe photos you add join your account",
];

describe("what the door's walk presses", () => {
  const screen = (buttons: string[], name = false) => ({ name, buttons });

  it("presses the welcome's Continue, then the chooser's Continue as guest, whose hint is part of its label", () => {
    expect(nextDoorPress(screen(WELCOME))).toEqual({
      label: "Continue",
      index: 1,
    });
    expect(nextDoorPress(screen(CHOOSER))).toEqual({
      label: "Continue as guestJust your name",
      index: 0,
    });
  });

  it("leads with Continue as guest while the welcome's own Continue is still on its way out", () => {
    expect(nextDoorPress(screen(["Continue", ...CHOOSER]))?.label).toBe(
      "Continue as guestJust your name",
    );
  });

  it("★ never presses a button that only starts like a way on: it signs nobody in", () => {
    expect(
      nextDoorPress(
        screen(["Continue with Google", "Create account", "Log in"]),
      ),
    ).toBeNull();
    expect(nextDoorPress(screen(["Continue to the album"]))).toBeNull();
  });

  it("presses nothing once the name field is up, nor while nothing offers a way", () => {
    expect(nextDoorPress(screen(["Continue"], true))).toBeNull();
    expect(nextDoorPress(screen([]))).toBeNull();
    expect(nextDoorPress(screen(["Start for free"]))).toBeNull();
  });
});

/**
 * The two expressions that run in the page, run here against a stand-in document: the walk's whole contact with the real
 * door is in them (what counts as a button a press could land on, and what it is called).
 */
describe("what the walk reads of the page, and the button it presses", () => {
  type Stand = {
    textContent: string;
    disabled: boolean;
    visibility: string;
    aria: string | null;
    w: number;
    h: number;
  };
  const button = (text: string, over: Partial<Stand> = {}): Stand => ({
    textContent: text,
    disabled: false,
    visibility: "visible",
    aria: null,
    w: 330,
    h: 48,
    ...over,
  });
  const inPage = (
    expression: string,
    buttons: Stand[],
    names: { h: number }[] = [],
  ) =>
    new Function(
      "document",
      "innerWidth",
      "getComputedStyle",
      `return (${expression});`,
    )(
      {
        querySelectorAll: (selector: string) =>
          selector === "button"
            ? buttons.map((b) => ({
                textContent: b.textContent,
                disabled: b.disabled,
                __b: b,
                getAttribute: (name: string) =>
                  name === "aria-label" ? b.aria : null,
                getBoundingClientRect: () => ({ width: b.w, height: b.h }),
              }))
            : names.map((n) => ({
                getBoundingClientRect: () => ({ height: n.h }),
              })),
      },
      390,
      (e: { __b: Stand }) => ({ visibility: e.__b.visibility }),
    );
  const read = (buttons: Stand[], names: { h: number }[] = []) =>
    JSON.parse(
      inPage(doorScreen('input[placeholder="Your name"]'), buttons, names),
    );

  it("lists the buttons a press could land on, by what they say, and whether the name field shows", () => {
    expect(
      read([
        button("Start for free"),
        button("Continue"),
        button("", { aria: "Close the sheet" }),
      ]),
    ).toEqual({
      name: false,
      buttons: ["Start for free", "Continue", "Close the sheet"],
    });
    // The name field is up when one is drawn (a height), never one that is in the page and hidden.
    expect(read([button("Continue")], [{ h: 52 }]).name).toBe(true);
    expect(read([button("Continue")], [{ h: 0 }]).name).toBe(false);
  });

  it("★ leaves out what a press could not land on: hidden, disabled, a sheet's scaled copy wider than the screen, none drawn", () => {
    expect(
      read([
        button("Continue", { visibility: "hidden" }),
        button("Continue", { disabled: true }),
        button("Continue", { w: 460 }),
        button("Continue", { w: 0, h: 0 }),
        button("Continue as guestJust your name"),
      ]).buttons,
    ).toEqual(["Continue as guestJust your name"]);
  });

  it("★ names the very button it read, and nothing once the screen has moved under it", () => {
    const buttons = [button("Continue with Google"), button("Continue")];
    expect(
      inPage(doorButton({ label: "Continue", index: 1 }), buttons),
    ).toMatchObject({ textContent: "Continue" });
    // The screen changed between the read and the press: the same place now holds another button, so nothing is pressed.
    expect(
      inPage(doorButton({ label: "Continue", index: 0 }), buttons),
    ).toBeNull();
    expect(
      inPage(doorButton({ label: "Continue", index: 5 }), buttons),
    ).toBeNull();
  });
});

describe("the walk to the door's name field", () => {
  // The door as the walk sees it: a welcome, a chooser, then the name. A press moves it on unless it is lost (a press the
  // page did not answer); the walk reads it through the same `eval` and presses through the `press` it is given.
  function door(lost = 0) {
    const screens = [
      { name: false, buttons: WELCOME },
      { name: false, buttons: CHOOSER },
      { name: true, buttons: ["Continue"] },
    ];
    let at = 0;
    let loses = lost;
    const presses: string[] = [];
    const times: number[] = [];
    return {
      presses,
      times,
      page: { eval: vi.fn(async () => JSON.stringify(screens[at])) },
      press: vi.fn(async (target: { label: string }) => {
        presses.push(target.label);
        times.push(Date.now());
        if (loses > 0) {
          loses -= 1;
          return;
        }
        at += 1;
      }),
    };
  }
  const walk = (
    page: unknown,
    press: (target: { label: string; index: number }) => Promise<void>,
    over: Record<string, number> = {},
  ) =>
    walkToName(page, {
      nameSelector: 'input[placeholder="Your name"]',
      every: 2,
      settle: 40,
      timeout: 3_000,
      press,
      ...over,
    });

  it("walks a door that answers every press, pressing each screen once", async () => {
    const { page, press, presses } = door();
    await walk(page, press);
    expect(presses).toEqual(["Continue", "Continue as guestJust your name"]);
  });

  it("★ presses again a press the screen did not answer, where the old walk waited out its twenty seconds", async () => {
    const { page, press, presses } = door(1);
    await walk(page, press);
    // The welcome's first press was lost (it came before the page hydrated); the second landed.
    expect(presses).toEqual([
      "Continue",
      "Continue",
      "Continue as guestJust your name",
    ]);
  });

  it("★ gives a press the time to be answered, never pressing on top of it", async () => {
    const { page, press, presses, times } = door(1);
    await walk(page, press, { settle: 200 });
    expect(presses).toHaveLength(3);
    // Polled every 2 ms, the screen stayed the same for 200 ms before the walk pressed it again.
    expect(times[1]! - times[0]!).toBeGreaterThanOrEqual(190);
  });

  it("reads the screen again when the page is navigating, and goes on from there", async () => {
    const { page, press, presses } = door();
    page.eval.mockRejectedValueOnce(
      new Error("Execution context was destroyed"),
    );
    await walk(page, press);
    expect(presses).toEqual(["Continue", "Continue as guestJust your name"]);
  });

  it("goes on when a press finds its button gone between the read and the press", async () => {
    const { page, press, presses } = door();
    press.mockRejectedValueOnce(new Error("timed out waiting for: button"));
    await walk(page, press);
    // The press that found nothing is no press: it is read again at once, and the walk goes on.
    expect(press).toHaveBeenCalledTimes(3);
    expect(presses).toEqual(["Continue", "Continue as guestJust your name"]);
  });

  it("★ says what was on screen when the way never opens, never a bare selector, and presses nothing it was not meant to", async () => {
    const page = {
      eval: vi.fn(async () =>
        JSON.stringify({
          name: false,
          buttons: ["Continue with Google", "Create account", "Log in"],
        }),
      ),
    };
    const press = vi.fn(async () => {});
    await expect(walk(page, press, { timeout: 80 })).rejects.toThrow(
      /never showed its name field.*Continue with Google/,
    );
    expect(press).not.toHaveBeenCalled();
  });
});

describe("the name sheet's Continue", () => {
  // The sheet as the submit reads it: up with an enabled Continue. A press that lands starts the mint, and while it is on
  // its way the button is disabled ("Just a second…"), then the sheet goes; a press that is lost changes nothing at all.
  function sheet({ lost = 0, mintMs = 0, refused = false } = {}) {
    let loses = lost;
    let landedAt: number | null = null;
    const presses: number[] = [];
    const read = () => {
      if (landedAt === null || refused)
        return { name: true, ready: landedAt === null || refused };
      const spent = Date.now() - landedAt;
      return spent < mintMs
        ? { name: true, ready: false }
        : { name: false, ready: false };
    };
    return {
      presses,
      page: {
        eval: vi.fn(async (_expression?: string) => JSON.stringify(read())),
      },
      press: vi.fn(async () => {
        presses.push(Date.now());
        if (loses > 0) {
          loses -= 1;
          return;
        }
        landedAt = Date.now();
      }),
    };
  }
  const submit = (
    page: unknown,
    press: () => Promise<void>,
    over: Record<string, number> = {},
  ) =>
    submitName(page, {
      nameSelector: 'input[placeholder="Your name"]',
      every: 2,
      settle: 40,
      blurWait: 0,
      timeout: 3_000,
      press,
      ...over,
    });

  it("presses once and returns once the sheet has gone", async () => {
    const { page, press, presses } = sheet();
    await submit(page, press);
    expect(presses).toHaveLength(1);
  });

  it("★ lets the name field go before it presses: the field's blur moves the sheet's foot, and a press made first releases over the spot the button left", async () => {
    const { page, press } = sheet();
    const order: string[] = [];
    const read = page.eval.getMockImplementation()!;
    page.eval.mockImplementation(async (expression?: string) => {
      if (expression?.includes(".blur()")) order.push("blur");
      return read(expression);
    });
    press.mockImplementation(async () => {
      order.push("press");
    });
    await expect(submit(page, press, { timeout: 60 })).rejects.toThrow();
    expect(order.slice(0, 2)).toEqual(["blur", "press"]);
  });

  it("★ presses again a Continue that did nothing, where the old join waited out its twenty seconds on a sheet that stayed", async () => {
    const { page, press, presses } = sheet({ lost: 1 });
    await submit(page, press);
    expect(presses).toHaveLength(2);
  });

  it("★ never presses while the mint is on its way, however long the server takes: a repeat would mint a second guest", async () => {
    const { page, press, presses } = sheet({ mintMs: 300 });
    await submit(page, press, { settle: 20 });
    // The button is disabled for 300 ms, fifteen times the repeat's wait: one press, never a second.
    expect(presses).toHaveLength(1);
  });

  it("★ never hammers a refusal: it stops pressing at the cap, and says the sheet never closed", async () => {
    const { page, press, presses } = sheet({ refused: true });
    await expect(submit(page, press, { timeout: 400 })).rejects.toThrow(
      /name sheet never closed after Continue.*"ready":true/,
    );
    expect(presses).toHaveLength(3);
  });

  it("★ presses the enabled Continue in the sheet that holds the name field, never the welcome's under it, nor a button mid-mint", () => {
    const button = (text: string, disabled = false) => ({
      textContent: text,
      disabled,
    });
    const inPage = (expression: string, scope: unknown, anywhere: unknown[]) =>
      new Function("document", `return (${expression});`)({
        querySelector: () => ({ closest: () => scope }),
        querySelectorAll: () => anywhere,
      });
    const welcomes = button("Continue");
    const mine = button("Continue");
    // The sheet's own buttons first: its Continue, enabled, is the one.
    const sheetScope = {
      querySelectorAll: () => [button("Back"), mine],
    };
    expect(inPage(nameContinue("input"), sheetScope, [welcomes, mine])).toBe(
      mine,
    );
    // While the mint is on its way the button is disabled and says so: nothing to press.
    const pending = {
      querySelectorAll: () => [button("Just a second…", true)],
    };
    expect(inPage(nameContinue("input"), pending, [welcomes])).toBeNull();
    // And the screen says so too.
    const read = (scope: unknown) =>
      JSON.parse(
        new Function("document", `return (${nameScreen("input")});`)({
          querySelector: () => ({
            closest: () => scope,
            getBoundingClientRect: () => ({ height: 52 }),
          }),
          querySelectorAll: () => [
            { getBoundingClientRect: () => ({ height: 52 }) },
          ],
        }),
      );
    expect(read(sheetScope)).toEqual({ name: true, ready: true });
    expect(read(pending)).toEqual({ name: true, ready: false });
  });
});

describe("what a scenario counts (crumbs-94)", () => {
  /** A ledger row, as the measuring server writes it (the fields a scenario's own count reads). */
  const row = (device: string | null, path: string) => ({ device, path });
  const VERSION = "/api/album/guest/sync/version";

  it("★ counts its own phones' requests and the cookie-less version ask, and leaves out whatever else is on the port", () => {
    // A signed-in dashboard tab left open on the port posts an action a minute, and the ledger labels it with the scenario
    // running: it moved a guest's hour from 23 calls to 29 on the run that found it.
    const mine = [
      row("hour", "/e/abcd…"),
      row("hour", "/api/album/guest/sync"),
      row(null, VERSION),
    ];
    const strangers = [row(null, "/dashboard"), row("someone-elses", "/")];
    const { own, foreign } = ownRecords(
      [...mine, ...strangers],
      ["hour"],
      [VERSION],
    );
    expect(own).toEqual(mine);
    expect(foreign).toBe(2);
  });

  it("the version ask is the phone's only where the scenario says its path is cookie-less", () => {
    const { own, foreign } = ownRecords([row(null, VERSION)], ["hour"]);
    expect(own).toEqual([]);
    expect(foreign).toBe(1);
  });

  it("a scenario that names no phones (a crawler's plain fetches) is counted whole", () => {
    const all = [row(null, "/"), row(null, "/pricing")];
    expect(ownRecords(all, undefined, [VERSION])).toEqual({
      own: all,
      foreign: 0,
    });
  });
});

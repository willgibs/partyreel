import { describe, expect, it, vi } from "vitest";

import {
  deviceRegistry,
  nextDoorPress,
  walkToName,
} from "../../scripts/compute-model/phones.mjs";

/**
 * THE COMPUTE HARNESS'S PHONES (`scripts/compute-model/phones.mjs`, red-team 53b's deferred line, crumbs-66): what
 * `pnpm compute:model` guarantees about the devices it drives, held here because `run.mjs` measures the moment it is
 * loaded and so cannot be imported.
 *
 *   1. A SCENARIO'S PHONES ARE CLOSED WHATEVER BECOMES OF IT: an errored scenario's devices were left open, polling under
 *      the next scenarios' labels.
 *   2. THE DOOR'S WALK PRESSES WHAT IS ON SCREEN: a press that did not land (it came before the page hydrated, or while
 *      the sheet was on its way in) is made again, where the old walk pressed once and waited out twenty seconds, which
 *      is how the first scenario of a full run timed out at the door's name step.
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

describe("what the door's walk presses", () => {
  const screen = (buttons: string[], name = false) => ({ name, buttons });

  it("presses the welcome's Continue, then the chooser's Continue as guest", () => {
    expect(nextDoorPress(screen(["Start for free", "Continue"]))).toBe(
      "Continue",
    );
    expect(
      nextDoorPress(screen(["Continue as guest", "Continue with Google"])),
    ).toBe("Continue as guest");
  });

  it("leads with Continue as guest while the welcome's own Continue is still on its way out", () => {
    expect(nextDoorPress(screen(["Continue", "Continue as guest"]))).toBe(
      "Continue as guest",
    );
  });

  it("presses nothing once the name field is up, nor while nothing offers a way", () => {
    expect(nextDoorPress(screen(["Continue"], true))).toBeNull();
    expect(nextDoorPress(screen([]))).toBeNull();
    expect(nextDoorPress(screen(["Start for free"]))).toBeNull();
  });
});

describe("the walk to the door's name field", () => {
  // The door as the walk sees it: a welcome, a chooser, then the name. A press moves it on unless it is lost (a press the
  // page did not answer), and the walk reads it through the same `eval` and presses it through the same `click`.
  function door(lost = 0) {
    const screens = [
      { name: false, buttons: ["Continue"] },
      { name: false, buttons: ["Continue as guest", "Continue with Google"] },
      { name: true, buttons: ["Continue"] },
    ];
    let at = 0;
    let loses = lost;
    const presses: string[] = [];
    const times: number[] = [];
    return {
      presses,
      times,
      page: {
        eval: vi.fn(async () => JSON.stringify(screens[at])),
        click: vi.fn(async (_selector: string, o: { text: string }) => {
          presses.push(o.text);
          times.push(Date.now());
          if (loses > 0) {
            loses -= 1;
            return;
          }
          at += 1;
        }),
      },
    };
  }
  const walk = (page: unknown, over: Record<string, number> = {}) =>
    walkToName(page, {
      nameSelector: 'input[placeholder="Your name"]',
      every: 2,
      settle: 40,
      timeout: 3_000,
      ...over,
    });

  it("walks a door that answers every press, pressing each screen once", async () => {
    const { page, presses } = door();
    await walk(page);
    expect(presses).toEqual(["Continue", "Continue as guest"]);
  });

  it("★ presses again a press the screen did not answer, where the old walk waited out its twenty seconds", async () => {
    const { page, presses } = door(1);
    await walk(page);
    // The welcome's first press was lost (it came before the page hydrated); the second landed.
    expect(presses).toEqual(["Continue", "Continue", "Continue as guest"]);
  });

  it("★ gives a press the time to be answered, never pressing on top of it", async () => {
    const { page, presses, times } = door(1);
    await walk(page, { settle: 200 });
    expect(presses).toEqual(["Continue", "Continue", "Continue as guest"]);
    // Polled every 2 ms, the screen stayed the same for 200 ms before the walk pressed it again.
    expect(times[1]! - times[0]!).toBeGreaterThanOrEqual(190);
  });

  it("reads the screen again when the page is navigating, and goes on from there", async () => {
    const { page, presses } = door();
    page.eval.mockRejectedValueOnce(
      new Error("Execution context was destroyed"),
    );
    await walk(page);
    expect(presses).toEqual(["Continue", "Continue as guest"]);
  });

  it("goes on when a press finds its button gone between the read and the press", async () => {
    const { page, presses } = door();
    page.click.mockRejectedValueOnce(
      new Error("timed out waiting for: button"),
    );
    await walk(page);
    // The press that found nothing is read again at once (it is no press: nothing was made), and the walk goes on.
    expect(page.click).toHaveBeenCalledTimes(3);
    expect(presses).toEqual(["Continue", "Continue as guest"]);
  });

  it("★ says what was on screen when the way never opens, never a bare selector", async () => {
    const page = {
      eval: vi.fn(async () =>
        JSON.stringify({ name: false, buttons: ["Start for free"] }),
      ),
      click: vi.fn(async () => {}),
    };
    await expect(walk(page, { timeout: 80 })).rejects.toThrow(
      /never showed its name field.*Start for free/,
    );
    expect(page.click).not.toHaveBeenCalled();
  });
});

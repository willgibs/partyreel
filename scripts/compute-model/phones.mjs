/**
 * THE HARNESS'S PHONES, KEPT APART FROM `run.mjs` SO A TEST CAN HOLD THEM (run.mjs measures the moment it is loaded):
 * the registry that closes every phone a scenario opened, and the walk through the door that presses what is on screen.
 *
 * ★ A SCENARIO'S PHONES ARE CLOSED WHATEVER BECOMES OF IT (red-team 53b's deferred line). A scenario closed its own
 * devices on its last line, so one that threw (a timeout at the door) left them open: still polling, their requests
 * recorded under the label of every scenario after it, which then measured another run's phones. The registry
 * remembers each device a scenario opens, and the runner closes them all when the scenario ends, errored or not.
 *
 * ★ THE DOOR'S WALK PRESSES WHAT IS ON SCREEN, NEVER WHAT IT ASSUMES LANDED. It pressed Continue and then waited for
 * Continue as guest, then for the name field, twenty seconds each, so a press that came before the page had hydrated
 * (it lands on markup with no handler: lost) or while the sheet was still on its way in left the next wait to time out:
 * only under load, and the first scenario of a full run is where the machine is busiest (the build has just finished).
 * The walk reads the screen, presses what the screen offers and presses it again when the screen has not moved in
 * `settle` ms, so a lost press costs a few seconds and never the run. Only presses with no side effect are repeated:
 * the name's own Continue mints the guest, so `run.mjs` presses that one once.
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The devices a scenario opens, by the function that opens them. `device` is that function, remembered; `closeAll`
 * closes every one still open (a scenario that closed its own leaves a close that finds it gone, which is harmless) and
 * never throws: one phone that will not close must not keep the rest polling.
 */
export function deviceRegistry(open) {
  const live = new Set();
  return {
    async device(browser, options) {
      const page = await open(browser, options);
      live.add(page);
      return page;
    },
    open: () => live.size,
    async closeAll() {
      const pages = [...live];
      live.clear();
      await Promise.allSettled(pages.map((page) => page.close()));
    },
  };
}

/**
 * The screen as the walk reads it, as an expression for the page: whether the name field shows, and the labels of the
 * buttons a press could land on (visible, enabled, no wider than the screen, as `page.click` finds them).
 */
export const doorScreen = (nameSelector) => `(() => JSON.stringify({
  name: [...document.querySelectorAll(${JSON.stringify(nameSelector)})].some((e) => e.getBoundingClientRect().height > 0),
  buttons: [...document.querySelectorAll("button")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.width <= innerWidth && !e.disabled && getComputedStyle(e).visibility !== "hidden"; }).map((e) => ((e.getAttribute("aria-label") || "") + " " + e.textContent).trim()),
}))()`;

/**
 * What the walk presses next: the way on from the welcome (Continue) or from the chooser (Continue as guest, which
 * leads, since the welcome's own Continue may still be on screen as it leaves). Null when the name field is up (the
 * walk has arrived) or when nothing offers a way yet.
 */
export function nextDoorPress(seen) {
  if (seen.name) return null;
  const offers = (text) => seen.buttons.some((label) => label.includes(text));
  if (offers("Continue as guest")) return "Continue as guest";
  if (offers("Continue")) return "Continue";
  return null;
}

/**
 * Walks a page to the door's name field and returns once it shows, or throws saying what was on screen. The screen is
 * read every `every` ms; what it offers is pressed; a press the screen has not answered in `settle` ms is made again
 * (one the screen answered, by changing, is never repeated).
 */
export async function walkToName(
  page,
  { nameSelector, timeout = 90_000, settle = 6_000, every = 250 },
) {
  const probe = doorScreen(nameSelector);
  const until = Date.now() + timeout;
  /** The press made and the screen it was made on. */
  let pressed = null;
  let seen = null;
  for (;;) {
    try {
      seen = JSON.parse(await page.eval(probe));
    } catch {
      // The page is navigating: read it again.
      seen = null;
    }
    if (seen?.name) return;
    if (seen) {
      const screen = JSON.stringify(seen);
      // The screen moved on, so whatever was pressed landed.
      if (pressed && pressed.screen !== screen) pressed = null;
      if (!pressed || Date.now() - pressed.at >= settle) {
        const press = nextDoorPress(seen);
        if (press) {
          try {
            await page.click("button", { text: press, timeout: 3_000 });
            pressed = { screen, at: Date.now() };
          } catch {
            // It left the screen between the read and the press: read it again.
          }
        }
      }
    }
    if (Date.now() > until) {
      throw new Error(
        `the door never showed its name field in ${Math.round(timeout / 1000)}s (on screen: ${JSON.stringify(seen)})`,
      );
    }
    await sleep(every);
  }
}

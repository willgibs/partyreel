/**
 * THE HARNESS'S PHONES, KEPT APART FROM `run.mjs` SO A TEST CAN HOLD THEM (run.mjs measures the moment it is loaded):
 * the registry that closes every phone a scenario opened, and the guest's way through the door, which presses what is on
 * screen.
 *
 * ★ A SCENARIO'S PHONES ARE CLOSED WHATEVER BECOMES OF IT (red-team 53b's deferred line). A scenario closed its own
 * devices on its last line, so one that threw (a timeout at the door) left them open: still polling, their requests
 * recorded under the label of every scenario after it, which then measured another run's phones. The registry
 * remembers each device a scenario opens, and the runner closes them all when the scenario ends, errored or not.
 *
 * ★ THE DOOR'S WALK PRESSES WHAT IS ON SCREEN, NEVER WHAT IT ASSUMES LANDED. The join pressed Continue, Continue as guest
 * and the name's Continue once each and waited twenty seconds for each answer. A press can be LOST: nothing is sent and
 * nothing changes, and the wait that follows times out at the name step. Measured on the production build under a 6x and
 * a 10x CPU throttle (`CM_THROTTLE` on a scratch copy of chrome.mjs, `Emulation.setCPUThrottlingRate`), four of eight
 * joins timed out there, three of the old walk's four, and in every one the measuring server's ledger held no
 * `POST /api/guests`, the screenshot showed the name sheet up with its Continue enabled: the press did nothing. The walk
 * reads the screen, presses what the screen offers and presses it again when the screen has not moved in `settle` ms, so
 * a lost press costs a few seconds and never the run.
 *
 * ★ A REPEAT NEVER MINTS A GUEST TWICE. The name's Continue is disabled and reads "Just a second…" while its mint is on
 * its way (`guest-name-step.tsx`), and the walk presses only an enabled Continue, so a repeat can land only on a press that
 * was lost, or on a mint the server refused (which is capped at `maxPresses`, so a refusal is never hammered).
 *
 * ★ IT PRESSES THREE BUTTONS AND NO OTHER: the welcome's Continue (by its whole label), the chooser's Continue as guest
 * (by its start, since its hint, "Just your name", is part of the button) and the name sheet's own Continue. Create
 * account, Log in and anything the door grows beside them are never pressed, so a walk that no longer finds its way says
 * so (below) instead of signing in.
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
 * ★ A SCENARIO COUNTS ITS OWN PHONES, NOTHING ELSE THAT HAPPENS TO BE ON THE PORT (crumbs-94). The ledger labels every
 * request with the scenario that is running, and a phone's own carry its `cm_device` cookie; anything else (a signed-in
 * dashboard tab left open on this port posts an action a minute, a tool of a lane's) is labelled with the scenario too and
 * moved a guest's hour from 23 calls to 29 on the run that found it. A scenario that names its phones (`devices`) is cut to
 * their requests, and says how many it left out; one that names none (a crawler's plain fetches) is counted whole.
 * ★ THE CHEAP VERSION ASK IS THE PHONE'S TOO, THOUGH IT CARRIES NO COOKIE (`credentials: "omit"`, so nothing of the viewer
 * can reach the route): `cookieless` names the paths whose requests are counted whatever their device.
 */
export function ownRecords(records, devices, cookieless = []) {
  if (!devices) return { own: records, foreign: 0 };
  const own = records.filter(
    (r) => devices.includes(r.device) || cookieless.includes(r.path),
  );
  return { own, foreign: records.length - own.length };
}

/**
 * Reads a page until it has arrived, pressing what it offers: the screen is read every `every` ms (`probe`, an
 * expression for the page that answers JSON); `arrived` says whether it is where the walk is going; `next` names what to
 * press from what is on screen (or nothing); `press` presses it. A press the screen has not answered in `settle` ms is
 * made again (one the screen answered, by changing, is never repeated), at most `maxPresses` times in all. Throws saying
 * what was on screen when `timeout` runs out.
 */
export async function pressUntil(
  page,
  {
    probe,
    arrived,
    next,
    press,
    failure,
    timeout = 90_000,
    settle = 6_000,
    every = 250,
    maxPresses = Infinity,
  },
) {
  const until = Date.now() + timeout;
  /** The press made and the screen it was made on. */
  let pressed = null;
  let presses = 0;
  let seen = null;
  for (;;) {
    try {
      seen = JSON.parse(await page.eval(probe));
    } catch {
      // The page is navigating: read it again.
      seen = null;
    }
    if (seen && arrived(seen)) return;
    if (seen) {
      const screen = JSON.stringify(seen);
      // The screen moved on, so whatever was pressed landed.
      if (pressed && pressed.screen !== screen) pressed = null;
      if (
        presses < maxPresses &&
        (!pressed || Date.now() - pressed.at >= settle)
      ) {
        const target = next(seen);
        if (target) {
          try {
            await press(target);
            presses += 1;
            pressed = { screen, at: Date.now() };
          } catch {
            // It left the screen between the read and the press: read it again.
          }
        }
      }
    }
    if (Date.now() > until) {
      throw new Error(
        `${failure} in ${Math.round(timeout / 1000)}s (on screen: ${JSON.stringify(seen)})`,
      );
    }
    await sleep(every);
  }
}

/** A button a press could land on: visible, enabled, no wider than the screen (a sheet mid-animation draws a scaled copy). */
const PRESSABLE = `(e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.width <= innerWidth && !e.disabled && getComputedStyle(e).visibility !== "hidden"; }`;
/** A button's label: what it says, or what it is called where it says nothing. */
const LABEL = `(e) => (e.textContent || "").trim() || e.getAttribute("aria-label") || ""`;

/** Whether the name field shows: one is drawn (a height), never one that is in the page and hidden. */
const nameShown = (nameSelector) =>
  `[...document.querySelectorAll(${JSON.stringify(nameSelector)})].some((e) => e.getBoundingClientRect().height > 0)`;

/**
 * The screen as the walk to the name reads it, as an expression for the page: whether the name field shows, and the labels
 * of the buttons a press could land on, in the order they stand.
 */
export const doorScreen = (nameSelector) => `(() => {
  const pressable = ${PRESSABLE};
  const label = ${LABEL};
  return JSON.stringify({
    name: ${nameShown(nameSelector)},
    buttons: [...document.querySelectorAll("button")].filter(pressable).map(label),
  });
})()`;

/** The button a press names, as an expression for `page.clickEl`: the same place in the same order, still wearing its label. */
export const doorButton = ({ label, index }) => `(() => {
  const pressable = ${PRESSABLE};
  const label = ${LABEL};
  const button = [...document.querySelectorAll("button")].filter(pressable)[${index}];
  return button && label(button) === ${JSON.stringify(label)} ? button : null;
})()`;

/** The door's two ways on, in the order they lead: each says which labels it is. */
const WAYS_ON = [
  (label) => label.startsWith("Continue as guest"),
  (label) => label === "Continue",
];

/**
 * What the walk presses next, as the button's label and its place among the pressable ones: the chooser's Continue as
 * guest leads, since the welcome's own Continue may still be on screen as it leaves. Null when the name field is up (the
 * walk has arrived) or when nothing offers a way yet.
 */
export function nextDoorPress(seen) {
  if (seen.name) return null;
  for (const isWay of WAYS_ON) {
    const index = seen.buttons.findIndex(isWay);
    if (index >= 0) return { label: seen.buttons[index], index };
  }
  return null;
}

/**
 * Walks a page to the door's name field and returns once it shows, or throws saying what was on screen. What it offers
 * is pressed (`press`, by default a real click on that very button) and pressed again when the screen did not answer.
 */
export function walkToName(
  page,
  {
    nameSelector,
    press = (target) => page.clickEl(doorButton(target), { timeout: 3_000 }),
    ...rest
  },
) {
  return pressUntil(page, {
    probe: doorScreen(nameSelector),
    arrived: (seen) => seen.name,
    next: nextDoorPress,
    press,
    failure: "the door never showed its name field",
    ...rest,
  });
}

/**
 * The name sheet's own Continue, as an expression for `page.clickEl`: the ENABLED Continue inside the sheet that holds the
 * name field (the welcome's stays mounted under it, and its mint's button is disabled and reads "Just a second…" until
 * the answer comes), or null.
 */
export const nameContinue = (nameSelector) => `(() => {
  const field = document.querySelector(${JSON.stringify(nameSelector)});
  const scope = (field && field.closest("form, [role=dialog]")) ?? document;
  return [...scope.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith("Continue") && !b.disabled) ?? null;
})()`;

/**
 * The screen as the name's submit reads it: whether the name field still shows, and whether the sheet offers an enabled
 * Continue (it does not while a mint is on its way).
 */
export const nameScreen = (nameSelector) => `(() => JSON.stringify({
  name: ${nameShown(nameSelector)},
  ready: ${nameContinue(nameSelector)} !== null,
}))()`;

/**
 * Presses the name sheet's Continue and returns once the sheet has gone (the guest is minted and the door hands on), or
 * throws saying what was on screen. A press that did nothing (the sheet still up with an enabled Continue, `settle` ms
 * later) is made again, at most `maxPresses` times, and never while a mint is on its way.
 *
 * ★ THE FIELD LETS GO FIRST. Why a press does nothing, measured with pointer events recorded under the throttle: the press
 * moves focus from the name field to the button, the field's blur drops the keyboard's lift (`use-keyboard-inset.ts`) and
 * the sheet's foot moves 65 px up between the press and the release, so the release lands on the sheet and the click
 * goes to the body. The walk blurs the field and waits `blurWait` ms for the foot to settle, then presses a button that
 * has nothing left to move: the first press landed in 2 of 8 joins without it, in 8 of 8 with it (6x throttle).
 */
export async function submitName(
  page,
  {
    nameSelector,
    press = () => page.clickEl(nameContinue(nameSelector), { timeout: 3_000 }),
    settle = 4_000,
    maxPresses = 3,
    blurWait = 600,
    ...rest
  },
) {
  await page.eval(
    `(() => { const active = document.activeElement; if (active && active.blur) active.blur(); return true; })()`,
  );
  await sleep(blurWait);
  return pressUntil(page, {
    probe: nameScreen(nameSelector),
    arrived: (seen) => !seen.name,
    next: (seen) => (seen.ready ? { label: "Continue" } : null),
    press,
    settle,
    maxPresses,
    failure: "the name sheet never closed after Continue",
    ...rest,
  });
}

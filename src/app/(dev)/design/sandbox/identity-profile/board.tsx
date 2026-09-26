"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  AttendedGuestMenu,
  AttendedPicker,
  AttendedSwitches,
  DefaultAsked,
  DefaultOff,
  DefaultOn,
  PageCount,
  PageNothing,
  PageNotFound,
  PromptAccountOnly,
  PromptClaim,
  PromptFollow,
  PromptFollowDoor,
  SetupCards,
  SetupSheet,
  SetupWizard,
} from "./parts";
import {
  AppHeader,
  GuestHeader,
  Scene,
  screenOf,
  type ScreenId,
} from "./scene";
import { IDENTITY_PROFILE } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE (`guest-capture`'s own discipline, carried
 * here). Every option holds the rest of the picture steady and moves only the
 * one thing its ask is about: `setup`'s three options vary how the handle,
 * name and events get set, never the world they're set in; `attended` varies
 * only how the choice is made; `default` varies only what an event's switch
 * reads BEFORE Priya ever touches it; `prompt` varies only whether and where
 * an invitation appears; `page` varies only what a visitor reads.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: a field count, a row
 * count, an invitation's own words. When the words above a frame and the
 * number under it disagree, the number is the truth.
 */

type Reader = (root: HTMLElement, win: Window) => string | null;
const screen = (s: BoardState): ScreenId => screenOf(s.screen as string);

/* ── setup: how many fields, how many other cards, how many screens ─────────── */

const measureSetup: Reader = (root) => {
  const relevant = root.querySelectorAll(
    "[data-ip-relevant] input, [data-ip-relevant] textarea",
  ).length;
  const unrelated = root.querySelectorAll("[data-ip-unrelated-card]").length;
  const steps = root.querySelectorAll("[data-ip-step]").length || 1;
  return `Measured: ${relevant} field${relevant === 1 ? "" : "s"} to fill, ${unrelated} other card${unrelated === 1 ? "" : "s"} sharing the screen, ${steps} screen${steps === 1 ? "" : "s"} total.`;
};

function setupScreen(id: "cards" | "wizard" | "sheet", s: BoardState) {
  const sc = screen(s);
  const label =
    id === "cards"
      ? "Account"
      : id === "wizard"
        ? "Set up your page"
        : "Dashboard";
  const body =
    id === "cards" ? (
      <SetupCards />
    ) : id === "wizard" ? (
      <SetupWizard />
    ) : (
      <SetupSheet />
    );
  return (
    <Scene
      id={`setup-${id}`}
      screen={sc}
      title="How it's set up"
      measure={measureSetup}
    >
      <div className="min-h-full bg-background text-foreground">
        <AppHeader label={label} />
        {body}
      </div>
    </Scene>
  );
}

/* ── attended: how many of the three events show their toggle here at all ───── */

const measureAttended: Reader = (root) => {
  const rows = root.querySelectorAll("[data-ip-attended-row]").length;
  const images = root.querySelectorAll("[data-ip-attended-row] img").length;
  return `Measured: ${rows} of 3 events showing their toggle here, ${images} with a cover photograph.`;
};

function attendedScreen(
  id: "switches" | "picker" | "guest-menu",
  s: BoardState,
) {
  const sc = screen(s);
  if (id === "guest-menu") {
    return (
      <Scene
        id="attended-guest-menu"
        screen={sc}
        title="What shows"
        measure={measureAttended}
      >
        <div className="min-h-full bg-background text-foreground">
          <GuestHeader as="priya" />
          <AttendedGuestMenu />
        </div>
      </Scene>
    );
  }
  return (
    <Scene
      id={`attended-${id}`}
      screen={sc}
      title="What shows"
      measure={measureAttended}
    >
      <div className="min-h-full bg-background text-foreground">
        <AppHeader label="Account" />
        {id === "switches" ? (
          <div className="mx-auto max-w-md p-4">
            <AttendedSwitches />
          </div>
        ) : (
          <AttendedPicker />
        )}
      </div>
    </Scene>
  );
}

/* ── default: whether an event's switch opens off, on, or asked once first ──── */

const measureDefault: Reader = (root) => {
  const prompt = root.querySelector<HTMLElement>("[data-ip-relevant]");
  if (prompt?.innerText?.includes("Show your events")) {
    return "Measured: a single yes-or-no stands before any switch is drawn.";
  }
  const rows = root.querySelectorAll("[data-ip-attended-row]");
  const on = [...rows].filter((r) =>
    r.querySelector('[data-state="checked"]'),
  ).length;
  return `Measured: ${on} of ${rows.length} events start switched on.`;
};

function defaultScreen(id: "off" | "asked" | "on", s: BoardState) {
  const sc = screen(s);
  const body =
    id === "off" ? (
      <DefaultOff />
    ) : id === "on" ? (
      <DefaultOn />
    ) : (
      <DefaultAsked />
    );
  return (
    <Scene
      id={`default-${id}`}
      screen={sc}
      title="The starting default"
      measure={measureDefault}
    >
      <div className="min-h-full bg-background text-foreground">
        <AppHeader label="Account" />
        {body}
      </div>
    </Scene>
  );
}

/* ── prompt: whether an invitation is drawn at all, and what it says ────────── */

const measurePrompt: Reader = (root) => {
  const prompt = root.querySelector<HTMLElement>("[data-ip-prompt]");
  if (!prompt) {
    return "Measured: no invitation drawn anywhere on this screen; the Public profile card waits to be found.";
  }
  const where = prompt.dataset.ipPrompt ?? "";
  const words = (prompt.innerText || "").trim().replace(/\s+/g, " ");
  return `Measured: an invitation reading "${words}" appears ${where}.`;
};

function promptScreen(id: "claim" | "follow" | "account", s: BoardState) {
  const sc = screen(s);
  if (id === "follow") {
    // ★ BOTH PLACES HER EMAIL CAN CONFIRM (the door's round two): the album's
    // follow moment, and the door's own "You're in". Stacked, so the option
    // stays one phone wide on the step beside the other two.
    return (
      <div className="flex flex-col gap-6">
        <Scene
          id="prompt-follow"
          screen={sc}
          title="When it's offered"
          measure={measurePrompt}
        >
          <div className="min-h-full bg-background text-foreground">
            <GuestHeader as="priya" />
            <PromptFollow />
          </div>
        </Scene>
        <Scene
          id="prompt-follow-door"
          screen={sc}
          title="When it's offered, at the door"
          measure={measurePrompt}
        >
          <div className="min-h-full bg-background text-foreground">
            <GuestHeader as="visitor" />
            <PromptFollowDoor desk={sc === "1440"} />
          </div>
        </Scene>
      </div>
    );
  }
  return (
    <Scene
      id={`prompt-${id}`}
      screen={sc}
      title="When it's offered"
      measure={measurePrompt}
    >
      <div className="min-h-full bg-background text-foreground">
        <AppHeader label="Dashboard" />
        {id === "claim" ? <PromptClaim /> : <PromptAccountOnly />}
      </div>
    </Scene>
  );
}

/* ── page: what a visitor actually reads, or whether they read a 404 ────────── */

const measurePage: Reader = (root) => {
  const notFound = root.querySelector<HTMLElement>("[data-ip-404]");
  if (notFound) {
    const words = (notFound.innerText || "").trim().replace(/\s+/g, " ");
    const cut = words.length > 70 ? `${words.slice(0, 70)}...` : words;
    return `Measured: the page answers not found, reading "${cut}"`;
  }
  const line = root.querySelector<HTMLElement>("[data-ip-empty-line]");
  const words = (line?.innerText || "").trim().replace(/\s+/g, " ");
  if (!words) return null;
  return `Measured: the page renders and reads "${words}"`;
};

function pageScreen(id: "nothing" | "count" | "not-found", s: BoardState) {
  const sc = screen(s);
  const body =
    id === "nothing" ? (
      <PageNothing />
    ) : id === "count" ? (
      <PageCount />
    ) : (
      <PageNotFound />
    );
  return (
    <Scene
      id={`page-${id}`}
      screen={sc}
      title="The empty page"
      measure={measurePage}
    >
      <div className="flex min-h-full flex-col bg-background text-foreground">
        <GuestHeader as="visitor" />
        {body}
      </div>
    </Scene>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof IDENTITY_PROFILE> = {
  "setup.cards": (s) => setupScreen("cards", s),
  "setup.wizard": (s) => setupScreen("wizard", s),
  "setup.sheet": (s) => setupScreen("sheet", s),

  "attended.switches": (s) => attendedScreen("switches", s),
  "attended.picker": (s) => attendedScreen("picker", s),
  "attended.guest-menu": (s) => attendedScreen("guest-menu", s),

  "default.off": (s) => defaultScreen("off", s),
  "default.asked": (s) => defaultScreen("asked", s),
  "default.on": (s) => defaultScreen("on", s),

  "prompt.claim": (s) => promptScreen("claim", s),
  "prompt.follow": (s) => promptScreen("follow", s),
  "prompt.account": (s) => promptScreen("account", s),

  "page.nothing": (s) => pageScreen("nothing", s),
  "page.count": (s) => pageScreen("count", s),
  "page.not-found": (s) => pageScreen("not-found", s),
};

export function IdentityProfileBoard() {
  return <ExplorationBoard spec={IDENTITY_PROFILE} previews={PREVIEWS} />;
}

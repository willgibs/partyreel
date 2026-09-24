"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  CenteredOverlay,
  FieldGhost,
  FieldShown,
  FieldStep,
  GateBody,
  NudgeNone,
  NudgeUnderField,
  NudgeWelcome,
  QuotedConfirmDialog,
  QuotedNameMenu,
  WalkCombined,
  WalkSeparate,
} from "./parts";
import { AlbumGround, DoorFrame, screenOf, type ScreenId, Scene } from "./scene";
import { IDENTITY_DOOR } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE (`guest-capture/board.tsx`'s own discipline,
 * carried here). Every option is Priya's own screen, held at today's shape
 * everywhere but the one thing its decision asks: `walk`'s three vary only
 * whether the welcome stands on its own screen or folds into the name step;
 * `field`'s three vary only how the email sits against the name; `nudge`'s
 * vary only where a sign-in path appears (the name step is held at ITS OWN
 * today, both fields open, for every `nudge` option, since `field`'s round is
 * a different question); `gate`'s vary only the eyebrow and whether a benefit
 * list follows the one shipped sentence; `menu`'s vary only the dropdown's
 * own shape; `remove`'s vary only where a control to undo an email lives, on
 * the SAME menu shape (`rows`, both shipped and this board's own
 * recommendation for `menu`).
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED (the same discipline
 * `guest-capture` and `media-viewer` hold every number to): a field count,
 * a literal count of a sentence's own appearance, a row count, an eyebrow's
 * own text. If the words above a frame and the number under it disagree,
 * the number is the truth.
 */

type Reader = (root: HTMLElement, win: Window) => string | null;
const screen = (s: BoardState): ScreenId => screenOf(s.screen as string);

/* ── walk: whether the welcome's own words share this screen with the name ─── */

const measureWalk: Reader = (root) => {
  const sheet = root.querySelector("[data-door-sheet]");
  if (!sheet) return null;
  const hasWelcome = Boolean(sheet.querySelector("[data-id-welcome-lines]"));
  const hasName = Boolean(sheet.querySelector("#id-door-name"));
  if (hasWelcome && hasName) {
    return "Measured: the welcome's own words and the name field share one screen.";
  }
  if (hasWelcome) {
    return "Measured: the welcome's own words alone fill this screen; the name field is a tap away.";
  }
  return "Measured: no welcome copy on this screen, only the name field, exactly a returning device's own screen today.";
};

function walkScreen(id: "separate" | "combined" | "gone", s: BoardState) {
  const sc = screen(s);
  const content =
    id === "separate" ? (
      <WalkSeparate />
    ) : id === "combined" ? (
      <WalkCombined />
    ) : (
      <div data-id-walk="gone">
        <FieldShown />
      </div>
    );
  return (
    <Scene
      id={`walk-${id}`}
      screen={sc}
      title="The welcome step"
      measure={measureWalk}
    >
      <DoorFrame screen={sc}>{content}</DoorFrame>
    </Scene>
  );
}

/* ── field: how many inputs stand before Continue, and whether one is closed ─ */

const measureField: Reader = (root) => {
  const sheet = root.querySelector("[data-door-sheet]");
  if (!sheet) return null;
  const inputs = sheet.querySelectorAll("input").length;
  const variant = sheet
    .querySelector("[data-id-field]")
    ?.getAttribute("data-id-field");
  if (variant === "ghost") {
    const open = Boolean(sheet.querySelector("#id-door-email"));
    return `Measured: ${inputs} field${inputs === 1 ? "" : "s"} visible; the email field is ${
      open ? "open" : "a closed line until she taps it"
    }.`;
  }
  return `Measured: ${inputs} field${inputs === 1 ? "" : "s"} visible before Continue.`;
};

function fieldScreen(id: "shown" | "ghost" | "step", s: BoardState) {
  const sc = screen(s);
  const content =
    id === "shown" ? (
      <FieldShown />
    ) : id === "ghost" ? (
      <FieldGhost />
    ) : (
      <FieldStep />
    );
  return (
    <Scene
      id={`field-${id}`}
      screen={sc}
      title="The field"
      measure={measureField}
    >
      <DoorFrame screen={sc}>{content}</DoorFrame>
    </Scene>
  );
}

/* ── nudge: where, if anywhere, the sentence naming Sign in appears ───────── */

const measureNudge: Reader = (root) => {
  const sheet = root.querySelector("[data-door-sheet]");
  if (!sheet) return null;
  if (sheet.querySelector("[data-id-nudge-note]")) {
    return "Measured: no control on the door itself; a reminder chip points at the guest menu instead.";
  }
  const mentions = (sheet.textContent?.match(/Sign in/g) ?? []).length;
  return `Measured: the sentence naming Sign in appears ${mentions} time${
    mentions === 1 ? "" : "s"
  } on this screen.`;
};

function nudgeScreen(id: "underfield" | "welcome" | "none", s: BoardState) {
  const sc = screen(s);
  const content =
    id === "underfield" ? (
      <NudgeUnderField />
    ) : id === "welcome" ? (
      <NudgeWelcome />
    ) : (
      <NudgeNone />
    );
  return (
    <Scene
      id={`nudge-${id}`}
      screen={sc}
      title="The sign-in nudge"
      measure={measureNudge}
    >
      <DoorFrame screen={sc}>{content}</DoorFrame>
    </Scene>
  );
}

/* ── gate: the eyebrow's own text, and how many benefits follow the reason ─── */

const measureGate: Reader = (root) => {
  const gate = root.querySelector("[data-id-gate]");
  if (!gate) return null;
  const eyebrow = gate.querySelector("p")?.textContent?.trim() ?? "";
  const benefits = gate.querySelectorAll("li").length;
  return `Measured: the eyebrow reads "${eyebrow}"; ${benefits} guest benefit${
    benefits === 1 ? "" : "s"
  } listed beneath the reason.`;
};

function gateScreen(id: "line" | "list" | "eyebrow", s: BoardState) {
  const sc = screen(s);
  return (
    <Scene
      id={`gate-${id}`}
      screen={sc}
      title="The gate's framing"
      measure={measureGate}
    >
      <DoorFrame screen={sc}>
        <GateBody variant={id} />
      </DoorFrame>
    </Scene>
  );
}

/* ── menu: how many rows are drawn, and whether the one action is a button ─── */

const measureMenu: Reader = (root) => {
  const menu = root.querySelector("[data-id-menu]");
  if (!menu) return null;
  const rows = menu.querySelectorAll("[data-id-menu-row]").length;
  const actionIsButton = Boolean(
    menu.querySelector("button[data-id-menu-action]"),
  );
  return `Measured: ${rows} row${rows === 1 ? "" : "s"} drawn, the one action a ${
    actionIsButton ? "button inside a card" : "plain row"
  }.`;
};

function menuScreen(id: "rows" | "card" | "sheet", s: BoardState) {
  const sc = screen(s);
  return (
    <Scene id={`menu-${id}`} screen={sc} title="The guest menu" measure={measureMenu}>
      <AlbumGround
        menu={<QuotedNameMenu variant={id} emailAttached={false} />}
      />
    </Scene>
  );
}

/* ── remove: whether a control exists, and where ─────────────────────────── */

const measureRemove: Reader = (root) => {
  if (root.querySelector("[data-id-remove]")) {
    return "Measured: the confirm door's own quiet link, not a menu row.";
  }
  const menu = root.querySelector("[data-id-menu]");
  if (!menu) return null;
  const hasRow = (menu.textContent ?? "").includes("Remove your email");
  return hasRow
    ? 'Measured: a persistent "Remove your email" row in the menu.'
    : "Measured: no remove control drawn in the menu.";
};

function removeScreen(
  id: "menu-row" | "quiet-link" | "nowhere",
  s: BoardState,
) {
  const sc = screen(s);
  const menu =
    id === "quiet-link" ? (
      <CenteredOverlay>
        <QuotedConfirmDialog removeLink />
      </CenteredOverlay>
    ) : (
      <QuotedNameMenu
        variant="rows"
        emailAttached
        remove={id === "menu-row" ? "menu-row" : "nowhere"}
      />
    );
  return (
    <Scene
      id={`remove-${id}`}
      screen={sc}
      title="Removing the email"
      measure={measureRemove}
    >
      <AlbumGround menu={menu} />
    </Scene>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof IDENTITY_DOOR> = {
  "walk.separate": (s) => walkScreen("separate", s),
  "walk.combined": (s) => walkScreen("combined", s),
  "walk.gone": (s) => walkScreen("gone", s),

  "field.shown": (s) => fieldScreen("shown", s),
  "field.ghost": (s) => fieldScreen("ghost", s),
  "field.step": (s) => fieldScreen("step", s),

  "nudge.underfield": (s) => nudgeScreen("underfield", s),
  "nudge.welcome": (s) => nudgeScreen("welcome", s),
  "nudge.none": (s) => nudgeScreen("none", s),

  "gate.line": (s) => gateScreen("line", s),
  "gate.list": (s) => gateScreen("list", s),
  "gate.eyebrow": (s) => gateScreen("eyebrow", s),

  "menu.rows": (s) => menuScreen("rows", s),
  "menu.card": (s) => menuScreen("card", s),
  "menu.sheet": (s) => menuScreen("sheet", s),

  "remove.menu-row": (s) => removeScreen("menu-row", s),
  "remove.quiet-link": (s) => removeScreen("quiet-link", s),
  "remove.nowhere": (s) => removeScreen("nowhere", s),
};

export function IdentityDoorBoard() {
  return <ExplorationBoard spec={IDENTITY_DOOR} previews={PREVIEWS} />;
}

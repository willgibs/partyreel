"use client";

import "./identity-door.css";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { DeskPanel, PhoneSheet, Scrim, TODAY_SCRIM } from "./door";
import { CODE } from "./fixtures";
import { AlbumGround } from "./ground";
import { Keyboard } from "./keyboard";
import { LitProvider, type Look, LOOKS, type Where } from "./looks";
import { type PhoneScene, type Reader, Scenes } from "./scene";
import {
  BackChevron,
  CloseMark,
  type DoorStep,
  GhostTap,
  keyboardFor,
  NameMenu,
  stepParts,
} from "./steps";
import { IDENTITY_DOOR } from "./spec";

/**
 * THE PREVIEWS: one ask, four directions, each walked through the whole door
 * on the `stage` knob, one 1440 frame above three 375 frames per stage.
 *
 * ★ EVERY CAPTION IS READ OFF ITS OWN FRAME, NEVER ASSERTED (the discipline
 * every board over this wedding holds): whether the primary action and the
 * focused field clear the keyboard, how much album shows above the sheet, the
 * scrim's blur and opacity as the frame computes them, how many times
 * "Unverified" is on screen, and what the direction itself put there (the
 * fan's rise, the lamp's sampled hues, the ticket's height, the host's face).
 * If the words above a frame and the number under it disagree, the number is
 * the truth.
 *
 * ★ EVERY OPTION IS A COMPONENT, NEVER A CALL: `lit` samples the album through
 * a hook, and a preview invoked as a plain function inside the step's render
 * would hang that hook off whatever component happened to be rendering.
 */

type Stage = "arriving" | "typing" | "accounts" | "inside";
type Screen = DoorStep | "menu" | "menu-email";
type World = { scrim: "own" | "today"; greeting: boolean };

const STAGES: Record<
  Stage,
  {
    title: string;
    desk: Screen;
    phones: readonly [Screen, Screen, Screen];
    titles: readonly [string, string, string];
  }
> = {
  arriving: {
    title: "arriving",
    desk: "welcome",
    phones: ["welcome", "chooser", "name"],
    titles: ["the welcome", "his chooser", "her name, its field focused"],
  },
  typing: {
    title: "typing",
    desk: "name-email",
    phones: ["name-email", "gate", "code"],
    titles: [
      "the email, opened from its tap",
      "a verification event, name and email",
      "the code",
    ],
  },
  accounts: {
    title: "with an account",
    desk: "login",
    phones: ["login", "create", "in"],
    titles: ["Log in", "Create account", "the “You’re in” beat"],
  },
  inside: {
    title: "inside",
    desk: "menu",
    phones: ["menu", "menu-email", "change"],
    titles: [
      "her menu, name only",
      "her menu, an email added",
      "changing or removing it",
    ],
  },
};

const TITLE: Record<Look, string> = {
  lit: "Lit by the album",
  peek: "The newest photos peek out",
  ticket: "A ticket she keeps",
  host: "The host leads",
};

const stageOf = (v: string | undefined): Stage =>
  v === "typing" || v === "accounts" || v === "inside" ? v : "arriving";

const worldOf = (s: BoardState): World => ({
  scrim: s.scrim === "today" ? "today" : "own",
  greeting: s.greeting !== "none",
});

/* ── the screens ─────────────────────────────────────────────────────────── */

function DoorScreen({
  look,
  step,
  size,
  world,
}: {
  look: Look;
  step: DoorStep;
  size: "phone" | "desk";
  world: World;
}) {
  const def = LOOKS[look];
  const kb = size === "phone" ? keyboardFor(step) : null;
  const where: Where = {
    step,
    size,
    keyboard: Boolean(kb),
    greeting: world.greeting,
  };
  const parts = stepParts(step, def.slots(where));
  const lookHead = def.head?.(where);
  const head =
    parts.back || parts.close || lookHead ? (
      <div className="flex min-h-9 items-center gap-2">
        {parts.back && <BackChevron />}
        <div className="min-w-0 flex-1">{lookHead}</div>
        {parts.close && <CloseMark />}
        {/* The chevron's width again on the right, so a centred head (the
            compact fan) sits on the sheet's centre line, not beside it. */}
        {parts.back && look === "peek" && lookHead && (
          <span aria-hidden className="w-7 shrink-0" />
        )}
      </div>
    ) : null;
  const sheet = {
    behind: def.behind?.(where),
    glow: def.glow?.(where),
    head,
    body: parts.body,
    foot: parts.foot,
  };
  const inside = step === "change";
  return (
    <div className="relative min-h-screen">
      <AlbumGround
        who={inside ? "emailed" : "stranger"}
        description={world.greeting}
      />
      <Scrim spec={world.scrim === "today" ? TODAY_SCRIM : def.scrim} />
      {size === "desk" ? (
        <DeskPanel {...sheet} />
      ) : (
        <PhoneSheet keyboard={Boolean(kb)} {...sheet} />
      )}
      {kb && <Keyboard kind={kb.kind} enter={kb.enter} code={CODE.sent} />}
      {step === "name" && size === "phone" && (
        // THE 320 PROBE: the same ghost tap in the content box a 320 phone
        // gives it (320 minus the sheet's 24 px each side), drawn off screen
        // so the caption can say what the line does there, read, not computed.
        <div
          aria-hidden
          data-door-probe-320
          className="pointer-events-none fixed top-0 -left-[2000px] w-[272px]"
        >
          <GhostTap />
        </div>
      )}
    </div>
  );
}

function MenuScreen({
  look,
  emailed,
  size,
  world,
}: {
  look: Look;
  emailed: boolean;
  size: "phone" | "desk";
  world: World;
}) {
  const where: Where = {
    step: emailed ? "menu-email" : "menu",
    size,
    keyboard: false,
    greeting: world.greeting,
  };
  return (
    <div className="relative min-h-screen">
      <AlbumGround
        who={emailed ? "emailed" : "named"}
        description={world.greeting}
      />
      <NameMenu
        emailed={emailed}
        slots={LOOKS[look].slots(where)}
        wide={size === "desk"}
      />
    </div>
  );
}

function ScreenNode({
  look,
  screen,
  size,
  world,
}: {
  look: Look;
  screen: Screen;
  size: "phone" | "desk";
  world: World;
}) {
  if (screen === "menu" || screen === "menu-email")
    return (
      <MenuScreen
        look={look}
        emailed={screen === "menu-email"}
        size={size}
        world={world}
      />
    );
  return <DoorScreen look={look} step={screen} size={size} world={world} />;
}

/* ── the readers ─────────────────────────────────────────────────────────── */

const px = (n: number) => `${Math.round(n)}px`;

/** The scrim as the frame computes it: its blur and its black. */
function scrimSaid(root: HTMLElement, win: Window): string | null {
  const scrim = root.querySelector("[data-door-scrim]");
  if (!scrim) return null;
  const cs = win.getComputedStyle(scrim);
  const filter =
    cs.backdropFilter ||
    (cs as CSSStyleDeclaration & { webkitBackdropFilter?: string })
      .webkitBackdropFilter ||
    "";
  const blur = /blur\(([\d.]+)px\)/.exec(filter)?.[1] ?? "0";
  const alpha = /rgba?\([^)]*?,\s*([\d.]+)\)|\/\s*([\d.]+)\)/.exec(
    cs.backgroundColor,
  );
  const a = alpha ? Number(alpha[1] ?? alpha[2]) : 1;
  const dim = /brightness\(([\d.]+)\)/.exec(filter)?.[1];
  return `scrim ${blur}px blur, ${Math.round(a * 100)}% black${
    dim ? ` at ${Math.round(Number(dim) * 100)}% brightness` : ""
  }`;
}

/** What the direction itself put on this frame, read off it. */
function lookSaid(look: Look, root: HTMLElement): string {
  const paper = root.querySelector("[data-door-paper]");
  const top = paper?.getBoundingClientRect().top ?? 0;
  if (look === "peek") {
    const fan = root.querySelector<HTMLElement>("[data-door-fan]");
    if (!fan) return "";
    const tiles = [...fan.querySelectorAll("[data-door-fan-tile]")];
    const credit = fan
      .querySelector("[data-door-credit-name]")
      ?.textContent?.trim();
    const where = fan.dataset.doorFan;
    const mode = fan.dataset.doorFanMode;
    const said =
      where === "edge"
        ? `${tiles.length} stills rise ${px(top - Math.min(...tiles.map((t) => t.getBoundingClientRect().top)))} above the sheet's edge`
        : where === "desk"
          ? `${tiles.length} stills reach ${px((paper?.getBoundingClientRect().left ?? 0) - Math.min(...tiles.map((t) => t.getBoundingClientRect().left)))} out of the panel's left edge`
          : `the fan rides inside the sheet, ${px(fan.getBoundingClientRect().height)} tall`;
    const state =
      mode === "held"
        ? ", the album's two held back"
        : mode === "bright"
          ? ", brightened"
          : mode === "landed"
            ? ", opened wide"
            : "";
    return ` ${said}${state}${credit ? `, her name "${credit}" on the front tile` : ""}.`;
  }
  if (look === "lit") {
    const lamp = root.querySelector<HTMLElement>("[data-door-lamp]");
    if (!lamp) return "";
    const from =
      lamp.dataset.doorSampled !== undefined
        ? "sampled from the album"
        : "the house five, until the sample lands";
    const ticker = root.querySelector("[data-door-tick-settled]")?.textContent;
    return ` The light holds hues ${lamp.dataset.doorHues}, ${from}${ticker ? `; the count settles on ${ticker}` : ""}.`;
  }
  if (look === "ticket") {
    const card = root.querySelector('[data-door-ticket="card"]');
    const stub = root.querySelector('[data-door-ticket="stub"]');
    if (card)
      return ` The ticket is ${px(card.getBoundingClientRect().height)} tall.`;
    if (stub)
      return ` The stub rides at ${px(stub.getBoundingClientRect().height)}${
        root.querySelector("[data-door-stamp]") ? ", stamped" : ""
      }.`;
    return "";
  }
  const host = root.querySelector("[data-door-host]");
  if (host) {
    const face = host.querySelector('[data-slot="avatar"]');
    const said = root.querySelector("[data-door-greeting]")
      ? "her own words greet"
      : "she wrote none, so no greeting";
    return ` Her face at ${px(face?.getBoundingClientRect().width ?? 0)}; ${said}.`;
  }
  return root.querySelector("[data-door-host-chip]")
    ? " Her face rides the sheet's head."
    : "";
}

/** The ghost tap, at 375 and in the 320 probe. */
function ghostSaid(root: HTMLElement): string {
  const ghost = root.querySelector<HTMLElement>("[data-door-ghost]");
  const line = ghost?.querySelector<HTMLElement>("[data-door-ghost-line]");
  if (!ghost || !line) return "";
  const room = (g: HTMLElement, l: HTMLElement) =>
    Math.round(
      g.getBoundingClientRect().right - 12 - l.getBoundingClientRect().right,
    );
  const probe = root.querySelector<HTMLElement>(
    "[data-door-probe-320] [data-door-ghost]",
  );
  const probeLine = probe?.querySelector<HTMLElement>("[data-door-ghost-line]");
  const at320 =
    probe && probeLine
      ? ` At 320 it reads "${probeLine.innerText.trim()}", ${room(probe, probeLine) >= 0 ? "still one line" : "past its row"}.`
      : "";
  return ` The email is a ${px(ghost.getBoundingClientRect().height)} ghost tap, "${line.innerText.trim()}" on one line with ${px(room(ghost, line))} to spare.${at320}`;
}

const readDoor =
  (look: Look, screen: Screen, size: "phone" | "desk"): Reader =>
  (root, win) => {
    if (screen === "menu" || screen === "menu-email") {
      const menu = root.querySelector("[data-door-menu]");
      if (!menu) return null;
      const n = (root.innerText.match(/\bUnverified\b/g) ?? []).length;
      const status = menu.querySelector("[data-door-status]")?.textContent;
      const action = menu.querySelector("[data-door-card-action]")?.textContent;
      const rows = menu.querySelectorAll("[data-door-menu-row]").length;
      return `Measured: "Unverified" appears ${n} time${n === 1 ? "" : "s"} on screen; under her name, "${status}"; the card, "Save this event for later" with ${action}; ${rows} rows under it.${lookSaid(look, root)}`;
    }
    const paper = root.querySelector("[data-door-paper]");
    const scrim = scrimSaid(root, win);
    if (!paper || !scrim || !root.querySelector("img")) return null;
    const box = paper.getBoundingClientRect();
    const extra =
      lookSaid(look, root) + (screen === "name" ? ghostSaid(root) : "");
    if (size === "desk") {
      return `Measured at 1440: the panel is ${px(box.width)} wide beside ${px(box.left)} of album; ${scrim}.${extra}`;
    }
    const kb = root.querySelector("[data-door-kb]");
    if (kb) {
      const kbTop = kb.getBoundingClientRect().top;
      const body = root
        .querySelector("[data-door-body]")
        ?.getBoundingClientRect();
      const primary = root.querySelector("[data-door-primary]");
      const focus = root.querySelector("[data-door-focus]");
      if (!focus || !body) return null;
      const f = focus.getBoundingClientRect();
      const shown = f.bottom <= body.bottom + 1;
      const fieldSaid = shown
        ? `the focused field by ${px(kbTop - f.bottom)}`
        : `the focused field is under the foot by ${px(f.bottom - body.bottom)}`;
      const primarySaid = primary
        ? `the primary action clears the keyboard by ${px(kbTop - primary.getBoundingClientRect().bottom)}`
        : "no button (the sixth digit submits)";
      return `Measured: ${primarySaid}, ${fieldSaid}; ${px(box.top)} of album above the sheet; ${scrim}.${extra}`;
    }
    return `Measured: the sheet is ${px(box.height)} tall with ${px(box.top)} of album above it; ${scrim}.${extra}`;
  };

/* ── one preview per direction ───────────────────────────────────────────── */

function DoorPreview({ look, s }: { look: Look; s: BoardState }) {
  const stage = stageOf(s.stage);
  const world = worldOf(s);
  const def = STAGES[stage];
  const id = `look-${look}-${stage}-${world.scrim}-${world.greeting ? "g" : "n"}`;
  const phones: PhoneScene[] = def.phones.map((screen, i) => ({
    title: def.titles[i],
    measure: readDoor(look, screen, "phone"),
    node: <ScreenNode look={look} screen={screen} size="phone" world={world} />,
  }));
  const scenes = (
    <Scenes
      id={id}
      title={`${TITLE[look]}, ${def.title}`}
      laptop={
        <ScreenNode look={look} screen={def.desk} size="desk" world={world} />
      }
      measure={readDoor(look, def.desk, "desk")}
      phones={phones}
    />
  );
  return look === "lit" ? <LitProvider>{scenes}</LitProvider> : scenes;
}

const PREVIEWS: PreviewsFor<typeof IDENTITY_DOOR> = {
  "look.lit": (s) => <DoorPreview look="lit" s={s} />,
  "look.peek": (s) => <DoorPreview look="peek" s={s} />,
  "look.ticket": (s) => <DoorPreview look="ticket" s={s} />,
  "look.host": (s) => <DoorPreview look="host" s={s} />,
};

export function IdentityDoorBoard() {
  return <ExplorationBoard spec={IDENTITY_DOOR} previews={PREVIEWS} />;
}

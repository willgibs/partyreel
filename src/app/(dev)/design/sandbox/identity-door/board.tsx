"use client";

import "./identity-door.css";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { DeskPanel, PhoneSheet, Scrim } from "./door";
import { CODE } from "./fixtures";
import { AlbumGround } from "./ground";
import { Keyboard } from "./keyboard";
import { Lamp, LIT_SCRIM, LitProvider, useHueVars } from "./lit";
import { NameMenu } from "./menu";
import { type PhoneScene, type Reader, Scenes } from "./scene";
import { type DoorStep, stepSpec } from "./steps";
import { IDENTITY_DOOR } from "./spec";
import { type World, worldKey, worldOf } from "./world";

/**
 * THE PREVIEWS: five asks, each drawn as whole moments of the door in lit (his
 * round-two pick), a 1440 frame above its phones.
 *
 * ★ EVERY CAPTION IS READ OFF ITS OWN FRAME, NEVER ASSERTED: what heads the
 * screen, how many words it asks her to read, what each icon is and what
 * colours it, whether the primary and the focused field clear the keyboard,
 * how much album shows above the sheet. If the words above a frame and the
 * number under it disagree, the number is the truth.
 *
 * ★ EVERY OPTION IS DRAWN IN THE WORLD HIS OTHER ANSWERS MADE. A step hands
 * its preview the board's state with every answer he has already given worn,
 * and `worldOf` reads all five axes from it, so the code screen is judged
 * with the icons he picked, not today's.
 */

type Screen = DoorStep | "menu" | "menu-email";
type Size = "phone" | "desk" | "small";

/* ── the screens ─────────────────────────────────────────────────────────── */

/** Whose header the album behind shows: a stranger at the door, Priya inside. */
const WHO: Partial<Record<Screen, "named" | "emailed">> = {
  edit: "named",
  change: "emailed",
  menu: "named",
  "menu-email": "emailed",
};

function DoorScreen({
  step,
  size,
  world,
}: {
  step: DoorStep;
  size: Size;
  world: World;
}) {
  const desk = size === "desk";
  // The album's three hues on the screen's root, so every lit thing in the
  // sheet (a pool, a glyph, the beat's bloom) reads the lamp's own.
  const vars = useHueVars();
  const spec = stepSpec(step, world, desk ? "desk" : "phone");
  // Only the 375 phone carries a keyboard: the sheet's rule reads its height.
  const kb = size === "phone" ? spec.kb : null;
  const glow = <Lamp edge={desk ? "left" : "top"} strength={spec.lamp} />;
  const parts = {
    glow,
    back: spec.back,
    close: spec.close,
    pad: spec.pad,
    children: spec.node,
  };
  return (
    <div className="relative min-h-screen" style={vars}>
      <AlbumGround who={WHO[step] ?? "stranger"} description />
      <Scrim spec={LIT_SCRIM} />
      {desk ? (
        <DeskPanel {...parts} />
      ) : (
        <PhoneSheet keyboard={Boolean(kb)} {...parts} />
      )}
      {kb && <Keyboard kind={kb.kind} enter={kb.enter} code={CODE.sent} />}
    </div>
  );
}

function MenuScreen({ emailed, size }: { emailed: boolean; size: Size }) {
  return (
    <div className="relative min-h-screen">
      <AlbumGround who={emailed ? "emailed" : "named"} description />
      <NameMenu emailed={emailed} wide={size === "desk"} />
    </div>
  );
}

function ScreenNode({
  screen,
  size,
  world,
}: {
  screen: Screen;
  size: Size;
  world: World;
}) {
  if (screen === "menu" || screen === "menu-email")
    return <MenuScreen emailed={screen === "menu-email"} size={size} />;
  return <DoorScreen step={screen} size={size} world={world} />;
}

/* ── the readers ─────────────────────────────────────────────────────────── */

const px = (n: number) => `${Math.round(n)}px`;

/**
 * An element's words as a still frame shows them: the count's two ticks that
 * fade out (48, 49) are dropped, so a heading reads "50 photos", not "484950".
 */
function said(el: Element | null | undefined): string {
  if (!el) return "";
  const copy = el.cloneNode(true) as Element;
  copy
    .querySelectorAll(".door-tick-0, .door-tick-1")
    .forEach((t) => t.remove());
  return (copy.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** A colour as a person reads it: its hue in degrees, from lab() or oklch(). */
function hueSaid(color: string): string {
  const lab = /lab\(\s*([\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/.exec(color);
  if (lab) {
    const h = (Math.atan2(Number(lab[3]), Number(lab[2])) * 180) / Math.PI;
    return `hue ${Math.round((h + 360) % 360)}`;
  }
  const lch = /oklch\(\s*[\d.]+\s+[\d.]+\s+([\d.]+)/.exec(color);
  return lch ? `hue ${Math.round(Number(lch[1]))}` : color;
}

const words = (el: Element | null) =>
  el
    ? ((el as HTMLElement).innerText.match(/[A-Za-z0-9’'&@.-]+/g) ?? [])
        .length
    : 0;

/** What the sheet asks her to read, counted off the paper. */
function wordsSaid(root: HTMLElement): string {
  const n = words(root.querySelector("[data-door-paper]"));
  return `${n} words on the sheet`;
}

/**
 * The keyboard's facts: whether the primary and the focused field (or the
 * code's slot) clear it, and how much album stays above the sheet.
 */
function keyboardSaid(root: HTMLElement): string {
  const paper = root.querySelector<HTMLElement>("[data-door-paper]");
  const kb = root.querySelector("[data-door-kb]");
  if (!paper) return "";
  const box = paper.getBoundingClientRect();
  if (paper.dataset.doorSheet === "desk")
    return `the panel is ${px(box.width)} wide beside ${px(box.left)} of album`;
  const top = box.top;
  if (!kb) return `${px(top)} of album above the sheet`;
  const kbTop = kb.getBoundingClientRect().top;
  const scroll = root.querySelector("[data-door-scroll]");
  const fold = scroll?.getBoundingClientRect().bottom ?? kbTop;
  const focus = root.querySelector("[data-door-focus]");
  const primary = root.querySelector("[data-door-primary]");
  const parts: string[] = [];
  if (primary) {
    const b = primary.getBoundingClientRect();
    parts.push(
      b.bottom <= fold + 1
        ? `the primary clears the keyboard by ${px(kbTop - b.bottom)}`
        : `the primary is under the fold by ${px(b.bottom - fold)}`,
    );
  } else parts.push("no button (the sixth digit sends the code)");
  if (focus) {
    const f = focus.getBoundingClientRect();
    const what = focus.hasAttribute("data-door-slot")
      ? "the code's next slot"
      : "the focused field";
    // A sticky primary covers the scroll's last stretch, so a focused thing
    // is only in view above whatever the primary's wrapper covers.
    const sticky = root
      .querySelector("[data-sheet-primary]")
      ?.getBoundingClientRect();
    const visibleTo =
      sticky && primary && sticky.top < fold ? sticky.top : fold;
    parts.push(
      f.bottom <= visibleTo + 1
        ? `${what} is in view`
        : `${what} is hidden under the ${visibleTo < fold ? "primary" : "fold"} by ${px(f.bottom - visibleTo)}`,
    );
  }
  parts.push(`${px(top)} of album above the sheet`);
  return parts.join(", ");
}

/** The icons, read: every decorative glyph and pool, its size and its colour. */
function iconsSaid(root: HTMLElement, win: Window): string {
  const pools = [...root.querySelectorAll<HTMLElement>("[data-door-pool]")];
  const promise = [
    ...root.querySelectorAll<SVGElement>("[data-door-icon='promise']"),
  ].filter((g) => !g.closest("[data-door-pool]"));
  const inline = [
    ...root.querySelectorAll<SVGElement>("[data-door-icon='inline']"),
  ].filter((g) => g.getBoundingClientRect().width > 0);
  const controls = [
    ...root.querySelectorAll<HTMLElement>("[data-door-control]"),
  ].map((c) => c.dataset.doorControl);
  const bits: string[] = [];
  if (pools.length) {
    const hues = pools.map((p) =>
      Math.round(Number(win.getComputedStyle(p).getPropertyValue("--pool-h"))),
    );
    bits.push(
      `${pools.length} in pools ${px(pools[0].getBoundingClientRect().width)} wide, lit by hues ${hues.join(" and ")}`,
    );
  }
  if (promise.length)
    bits.push(
      `${promise.length} grey glyph${promise.length === 1 ? "" : "s"} at ${px(promise[0].getBoundingClientRect().width)} leading the rows`,
    );
  for (const g of inline) {
    const lit = g.classList.contains("door-glyph-lit");
    bits.push(
      `a ${px(g.getBoundingClientRect().width)} ${lit ? `glyph in the album's ${hueSaid(win.getComputedStyle(g).color)}` : "grey glyph"} inside a line`,
    );
  }
  const said = bits.length ? bits.join("; ") : "none but the controls";
  return `Icons: ${said}. Controls: ${controls.length ? controls.join(", ") : "none"}.`;
}

/** The chooser's three ways in, read. */
function chooserSaid(root: HTMLElement, win: Window): string {
  const step = root.querySelector("[data-door-step='chooser']");
  if (!step) return "";
  const title = said(step.querySelector("[data-door-heading] p"));
  const buttons = [...step.querySelectorAll("button")];
  if (!buttons.length) return "";
  const first = buttons[0].getBoundingClientRect();
  const last = buttons[buttons.length - 1].getBoundingClientRect();
  const lines = [
    ...step.querySelectorAll<HTMLElement>("[data-door-way-line]"),
  ];
  const wrapped = lines.filter(
    (l) =>
      l.getBoundingClientRect().height >
      parseFloat(win.getComputedStyle(l).lineHeight) * 1.5,
  ).length;
  const link = step.querySelector("[data-door-login-link]");
  const extra = lines.length
    ? `; each way's small line ${wrapped ? `wraps on ${wrapped}` : "holds one line"}`
    : link
      ? `; Log in is a line of text under them`
      : "";
  return `Headed "${title}"; ${buttons.length} buttons stand ${px(last.bottom - first.top)} tall together${extra}; ${wordsSaid(root)}.`;
}

/** The line under her name, read. */
function hintSaid(root: HTMLElement): string {
  const hint = said(root.querySelector("[data-door-hint]"));
  return `${hint ? `Under her name: "${hint}"` : "Nothing under her name"}; ${wordsSaid(root)}.`;
}

/** What heads the code screen, and the code's own sentence, read. */
function codeSaid(root: HTMLElement): string {
  const head = root.querySelector("[data-door-heading] .font-heading");
  const slots = [...root.querySelectorAll("[data-door-slot]")];
  if (!head || slots.length !== 6) return "";
  const a = slots[0].getBoundingClientRect();
  const b = slots[5].getBoundingClientRect();
  const signIn = /to sign in/.test(root.innerText);
  return `Headed "${said(head)}"; six slots span ${px(b.right - a.left)}, each ${px(a.width)}${signIn ? '; its last line still says "to sign in"' : ""}; ${wordsSaid(root)}.`;
}

/** The beat's mark and words, read. */
function beatSaid(root: HTMLElement, win: Window): string {
  const mark = root.querySelector<HTMLElement>("[data-door-mark]");
  const lamp = root.querySelector<HTMLElement>("[data-door-lamp]");
  const spoken = said(root.querySelector("[data-door-beat-words]"));
  const light = lamp ? `; the lamp at ${lamp.dataset.doorLamp}` : "";
  if (!mark) {
    const sent = root.querySelector("[data-door-sent]");
    return sent ? `"Sent" with no mark beside it${light}.` : "";
  }
  const box = mark.getBoundingClientRect();
  const kind = mark.dataset.doorMark;
  const what =
    kind === "hers"
      ? mark.querySelector("img")
        ? "the photo she sent, a check on its corner"
        : "her own initial in her colour, a check on its corner"
      : kind === "lit"
        ? `a check in the album's light (hues ${lamp?.dataset.doorHues ?? ""})`
        : `a check on the success green (${hueSaid(win.getComputedStyle(mark).backgroundColor)})`;
  const size = mark.tagName === "BUTTON" ? "the button itself" : px(box.width);
  return `The mark: ${what}, ${size}${spoken ? `; it says "${spoken}"` : ""}${light}.`;
}

type Ask = "icons" | "chooser" | "hint" | "code" | "beat";

const read =
  (ask: Ask, screen: Screen): Reader =>
  (root, win) => {
    if (screen === "menu" || screen === "menu-email") {
      const menu = root.querySelector("[data-door-menu]");
      if (!menu) return null;
      const n = (root.innerText.match(/\bUnverified\b/g) ?? []).length;
      return `Measured: her menu, the same under every ask; "Unverified" ${n} time${n === 1 ? "" : "s"} on screen, ${menu.querySelectorAll("[data-door-menu-row]").length} rows under the card.`;
    }
    const paper = root.querySelector("[data-door-paper]");
    if (!paper || !root.querySelector("img")) return null;
    const own =
      ask === "icons"
        ? iconsSaid(root, win)
        : ask === "chooser"
          ? chooserSaid(root, win)
          : ask === "hint"
            ? hintSaid(root)
            : ask === "code"
              ? codeSaid(root)
              : beatSaid(root, win);
    if (!own) return null;
    return `Measured: ${own} ${keyboardSaid(root)}.`;
  };

/* ── the moments each ask is drawn across ────────────────────────────────── */

type Moment = {
  title: string;
  desk: Screen;
  phones: readonly { screen: Screen; title: string; small?: boolean }[];
};

/** `icons` walks the whole door on its stage knob. */
const STAGES: Record<string, Moment> = {
  arriving: {
    title: "arriving",
    desk: "welcome",
    phones: [
      { screen: "welcome", title: "the welcome" },
      { screen: "chooser", title: "his chooser" },
      { screen: "name", title: "her name, the keyboard up" },
    ],
  },
  proving: {
    title: "proving who she is",
    desk: "gate",
    phones: [
      { screen: "password", title: "a password event" },
      { screen: "gate", title: "a verification event" },
      { screen: "code-gate", title: "its code" },
    ],
  },
  accounts: {
    title: "with an account",
    desk: "login",
    phones: [
      { screen: "login", title: "Log in" },
      { screen: "create", title: "Create account" },
      { screen: "code-create", title: "its code" },
    ],
  },
  landing: {
    title: "landing",
    desk: "upload",
    phones: [
      { screen: "upload", title: "the upload step" },
      { screen: "keep", title: "the keep screen, after her first photo" },
      { screen: "in", title: "the “You’re in” beat" },
    ],
  },
  inside: {
    title: "inside",
    desk: "menu",
    phones: [
      { screen: "menu", title: "her menu, name only" },
      { screen: "menu-email", title: "her menu, an email added" },
      { screen: "change", title: "changing that email" },
    ],
  },
  edges: {
    title: "at the edges",
    desk: "demo",
    phones: [
      { screen: "demo", title: "the demo's welcome" },
      { screen: "demo-upload", title: "the demo's upload" },
      { screen: "stalled", title: "a stalled opening" },
    ],
  },
};

const MOMENTS: Record<Exclude<Ask, "icons">, Moment> = {
  chooser: {
    title: "his chooser",
    desk: "chooser",
    phones: [
      { screen: "chooser", title: "his chooser" },
      { screen: "chooser", title: "his chooser", small: true },
    ],
  },
  hint: {
    title: "her name",
    desk: "name",
    phones: [
      { screen: "name", title: "her name, the keyboard up" },
      { screen: "name-email", title: "the email opened" },
      { screen: "edit", title: "Change name, from her menu" },
    ],
  },
  code: {
    title: "the code",
    desk: "code-gate",
    phones: [
      { screen: "code-gate", title: "a verification event's code" },
      { screen: "code-create", title: "Create account's code" },
      { screen: "code-login", title: "Log in's code" },
    ],
  },
  beat: {
    title: "the beats",
    desk: "in",
    phones: [
      { screen: "unlock", title: "a password opening the album" },
      { screen: "in", title: "a code confirmed" },
      { screen: "keep", title: "her first photo sent" },
    ],
  },
};

const LABEL: Record<Ask, string> = {
  icons: "The door's icons",
  chooser: "The chooser",
  hint: "Under her name",
  code: "The code screen",
  beat: "The beats",
};

function Preview({ ask, s }: { ask: Ask; s: BoardState }) {
  const world = worldOf(s);
  const stage = s.stage && STAGES[s.stage] ? s.stage : "arriving";
  const moment = ask === "icons" ? STAGES[stage] : MOMENTS[ask];
  const id = `${ask}-${ask === "icons" ? stage : "m"}-${worldKey(world)}`;
  const phones: PhoneScene[] = moment.phones.map((p) => ({
    title: p.title,
    small: p.small,
    measure: read(ask, p.screen),
    node: (
      <ScreenNode
        screen={p.screen}
        size={p.small ? "small" : "phone"}
        world={world}
      />
    ),
  }));
  return (
    <LitProvider>
      <Scenes
        id={id}
        title={ask === "icons" ? `${LABEL[ask]}, ${moment.title}` : LABEL[ask]}
        laptop={<ScreenNode screen={moment.desk} size="desk" world={world} />}
        measure={read(ask, moment.desk)}
        phones={phones}
      />
    </LitProvider>
  );
}

const PREVIEWS: PreviewsFor<typeof IDENTITY_DOOR> = {
  "icons.today": (s) => <Preview ask="icons" s={s} />,
  "icons.lit": (s) => <Preview ask="icons" s={s} />,
  "icons.bare": (s) => <Preview ask="icons" s={s} />,
  "chooser.today": (s) => <Preview ask="chooser" s={s} />,
  "chooser.told": (s) => <Preview ask="chooser" s={s} />,
  "chooser.link": (s) => <Preview ask="chooser" s={s} />,
  "chooser.bare": (s) => <Preview ask="chooser" s={s} />,
  "hint.today": (s) => <Preview ask="hint" s={s} />,
  "hint.change": (s) => <Preview ask="hint" s={s} />,
  "hint.none": (s) => <Preview ask="hint" s={s} />,
  "code.today": (s) => <Preview ask="code" s={s} />,
  "code.mail": (s) => <Preview ask="code" s={s} />,
  "code.inplace": (s) => <Preview ask="code" s={s} />,
  "beat.today": (s) => <Preview ask="beat" s={s} />,
  "beat.lit": (s) => <Preview ask="beat" s={s} />,
  "beat.hers": (s) => <Preview ask="beat" s={s} />,
};

export function IdentityDoorBoard() {
  return <ExplorationBoard spec={IDENTITY_DOOR} previews={PREVIEWS} />;
}

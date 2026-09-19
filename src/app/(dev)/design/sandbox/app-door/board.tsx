"use client";

import "./app-door.css";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  type ExistingShape,
  ExistingMoment,
  FailureBanner,
  type FailureShape,
  FailureStep,
  RecoveryButtons,
  type ReturnShape,
  ReturningDoor,
} from "./edges";
import { BACK } from "./fixtures";
import { LeadDoor, type Lead, leadOf, PasswordOnly } from "./methods";
import {
  DoorCard,
  DoorPage,
  DoorSheetBody,
  type PageShape,
  pageOf,
  SCREENS,
  type ScreenId,
  screenOf,
  Still,
} from "./shells";
import { APP_DOOR } from "./spec";
import {
  AccountPlace,
  type Place,
  placeOf,
  type SurfaceShape,
} from "./surfaces";
import {
  WELCOME_SCREENS,
  WelcomeFlowStack,
  type WelcomeShape,
} from "./welcome";

/**
 * ★ THE GROUND IS TODAY'S PRODUCT, NOT THE BOARD'S OWN RECOMMENDATIONS. Every
 * picture is the shipped door with ONE thing changed, so a decision never
 * arrives quietly wearing the answer to a question he has not been asked: the
 * page stays the bare card, the surfaces stay four, the door stays
 * password-led. The exceptions are the staged decisions, where wearing the
 * earlier answer is the whole point of the staging: the page, the collision
 * and the failure are judged on the lead he picked, and the returning host on
 * the page he picked.
 */
const TODAY = { lead: "password", page: "card" } as const;

/**
 * ★ THE NUMBERS UNDER EVERY FRAME ARE MEASURED, NEVER COMPUTED. A board once
 * drew an option with its formula's sign backwards and the tile Will judged
 * showed the opposite of its words (docs/PROGRAM.md). So each caption reads
 * the laid-out DOM inside the frame's own document once it settles: how many
 * fields a door really asks for, how much of the screen a surface really
 * takes, whether a Terms line is really on it, how many screens a flow really
 * is. If the words above a frame and the caption under it disagree, the
 * caption is the truth.
 */

/* ── the measurement ─────────────────────────────────────────────────────── */

type Reader = (root: HTMLElement, win: Window) => string | null;

/**
 * Reads one fact out of the frame's own document.
 *
 * ★ THE OBSERVER IS THE FRAME'S, NOT THE LAB PAGE'S (the mechanism guest-shape
 * arrived at, and the reason is the same here): the subtree lives in the
 * iframe's document, so it is observed with THAT window's `ResizeObserver`. It
 * fires when the copied stylesheets land, because the first layout is
 * unstyled, and again whenever a new option re-flows. A hidden option on the
 * stage is `visibility: hidden`, which keeps its layout, so it measures true
 * as well. The late pass covers what an observer cannot see: photographs
 * decoding at their natural heights inside columns that never changed width,
 * and the QR, which arrives from a dynamic import after everything else.
 */
function Probe({
  read,
  onRead,
  children,
}: {
  read: Reader;
  onRead: (s: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // The latest reader and reporter, refreshed AFTER each commit: writing a ref
  // in the render body is what the compiler's rule refuses, and the observer
  // below must not be torn down and rebuilt on every render.
  const latest = useRef({ read, onRead });
  useEffect(() => {
    latest.current = { read, onRead };
  });

  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView as
      | (Window & typeof globalThis)
      | null
      | undefined;
    if (!el || !win) return;
    const run = () => {
      const said = latest.current.read(el, win);
      if (said) latest.current.onRead(said);
    };
    run();
    const ro = new win.ResizeObserver(run);
    ro.observe(el);
    const late = win.setTimeout(run, 1400);
    return () => {
      ro.disconnect();
      win.clearTimeout(late);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

const pct = (part: number, whole: number) => Math.round((part / whole) * 100);

/**
 * Every field a person has to fill.
 *
 * ★ BY EXCLUSION, NOT BY ALLOW-LIST. The shipped name input sets no `type` at
 * all, so an allow-list of types measured the welcome flow at "0 fields asked
 * for" while drawing a required name field. Found by reading a capture against
 * its own caption, which is what the capture pass is for.
 */
const fieldsIn = (root: HTMLElement) =>
  root.querySelectorAll<HTMLElement>(
    "input:not([type='hidden']):not([type='checkbox']):not([type='radio']):not([type='button']):not([type='submit'])",
  ).length;

/** Whether the consent line is on this surface at all. */
const hasTerms = (root: HTMLElement) => !!root.querySelector("a[href='/terms']");

/** Which credentials a surface actually offers, read off the rendered DOM. */
function methodsIn(root: HTMLElement): string[] {
  const out: string[] = [];
  const buttons = [...root.querySelectorAll("button")].map(
    (b) => b.textContent ?? "",
  );
  // An email door counts whether the field is on this screen or one press
  // behind a button, which is exactly what the Google-first option changes.
  if (
    root.querySelector("input[type='email']") ||
    buttons.some((t) => /email/i.test(t))
  )
    out.push("an email");
  if (
    root.querySelector("input[type='password']") ||
    buttons.some((t) => /password/i.test(t))
  )
    out.push("a password");
  if (buttons.some((t) => t.includes("Google"))) out.push("Google");
  return out;
}

/**
 * What a door LEADS with: its first control, in document order.
 *
 * ★ THE COUNT OF METHODS IS NOT THE ANSWER. All three leads reach the same
 * three credentials, so counting them measured "3 ways in" on every option and
 * told a reviewer nothing. What moves between the options is which one is
 * first and how many fields stand open, so that is what the caption says.
 */
function leadsWith(root: HTMLElement): string {
  const first = root.querySelector<HTMLElement>(
    "input:not([type='hidden']), button",
  );
  if (!first) return "nothing";
  // ★ tagName, NEVER `instanceof`. The element lives in the FRAME's realm, so
  // `first instanceof HTMLInputElement` compares against the BOARD window's
  // constructor and is false for every input in the picture: the caption read
  // "leads with a button" on two doors that lead with a field.
  if (first.tagName === "INPUT") {
    const type = (first as HTMLInputElement).type;
    if (type !== "email") return `a ${type} field`;
    return root.querySelector("input[type='password']")
      ? "an email and a password"
      : "an email";
  }
  const text = first.textContent ?? "";
  if (text.includes("Google")) return "Google";
  if (/email/i.test(text)) return "an email";
  return "a button";
}

/** The door itself: what it asks for, and how much room it takes. */
const doorRead: Reader = (root) => {
  const el = root.querySelector<HTMLElement>("[data-ad-door]");
  if (!el) return null;
  const h = Math.round(el.getBoundingClientRect().height);
  if (h < 8) return null;
  const n = fieldsIn(el);
  const ways = methodsIn(el);
  return `Measured: leads with ${leadsWith(el)}, ${n} field${n === 1 ? "" : "s"} open, all ${ways.length} ways in reachable (${ways.join(", ")}), ${h} px of door.`;
};

/** An account surface: its size on the screen, its methods, its Terms line. */
const surfaceRead: Reader = (root, win) => {
  const el = root.querySelector<HTMLElement>(
    "[data-ad-surface], .ad-sheet, .ad-dialog, [data-ad-door]",
  );
  if (!el) return null;
  const box = el.getBoundingClientRect();
  const h = Math.round(box.height);
  if (h < 8) return null;
  const ways = methodsIn(el);
  return `Measured: ${h} px of surface, ${pct(h, win.innerHeight)} percent of the screen, ${ways.length} way${ways.length === 1 ? "" : "s"} in (${ways.join(", ")}), and ${hasTerms(el) ? "the Terms line is on it" : "NO Terms line on it"}.`;
};

/** A whole flow: how many screens, and how far it runs. */
const flowRead: Reader = (root) => {
  const screens = root.querySelectorAll<HTMLElement>("[data-ad-screen]");
  if (screens.length === 0) return null;
  const first = screens[0].getBoundingClientRect().top;
  const last = screens[screens.length - 1].getBoundingClientRect().bottom;
  const run = Math.round(last - first);
  if (run < 8) return null;
  const fields = fieldsIn(root);
  return `Measured: ${screens.length} screen${screens.length === 1 ? "" : "s"}, ${run} px of flow, ${fields} field${fields === 1 ? "" : "s"} asked for in all.`;
};

/** The page around the door: how much of it is door, how much is product. */
const pageRead: Reader = (root, win) => {
  const door = root.querySelector<HTMLElement>(
    "[data-ad-door], .ad-sheet, .ad-dialog",
  );
  if (!door) return null;
  const d = door.getBoundingClientRect();
  if (d.height < 8) return null;
  const screen = win.innerWidth * win.innerHeight;
  const wall = root.querySelector<HTMLElement>("[data-ad-wall]");
  const w = wall?.getBoundingClientRect();
  const photos = w ? pct(w.width * w.height, screen) : 0;
  return `Measured: the door is ${Math.round(d.width)} by ${Math.round(d.height)}, ${pct(d.width * d.height, screen)} percent of the screen; photographs carry ${photos} percent.`;
};

/** The collision: whether anything on the screen names the account. */
const namedRead: Reader = (root) => {
  const text = root.textContent ?? "";
  const named = text.includes(BACK.email) || text.includes(BACK.masked);
  const step = root.querySelector<HTMLElement>("[data-ad-step]");
  if (step)
    return `Measured: one more step, ${Math.round(step.getBoundingClientRect().height)} px, and the account is not open yet; the address is ${named ? "named on it" : "not named"}.`;
  return `Measured: the account is open, and the address that opened it is ${named ? "named once on the screen" : "NOT named anywhere on the screen"}.`;
};

/** The failure: how much of it is a sentence, and how much is a control. */
const failureRead: Reader = (root) => {
  const step = root.querySelector<HTMLElement>("[data-ad-step]");
  const recovery = root.querySelector<HTMLElement>("[data-ad-recovery]");
  const buttons = recovery
    ? recovery.querySelectorAll("button").length
    : (step?.querySelectorAll("button").length ?? 0);
  const banner = root.querySelector<HTMLElement>(".text-destructive");
  const said = banner
    ? (banner.textContent ?? "")
    : [...(step?.querySelectorAll("p") ?? [])].map((e) => e.textContent).join(" ");
  const words = said.trim().split(/\s+/).filter(Boolean).length;
  if (!banner && !step) return null;
  return `Measured: ${words} words of message, and ${buttons} way${buttons === 1 ? "" : "s"} out as a control rather than as prose.`;
};

/** The returning host: what is left to do. */
const returnRead: Reader = (root) => {
  const door = root.querySelector<HTMLElement>(
    "[data-ad-door], .ad-sheet, .ad-dialog",
  );
  if (!door) return null;
  const h = Math.round(door.getBoundingClientRect().height);
  if (h < 8) return null;
  const n = fieldsIn(door);
  const knows = (door.textContent ?? "").includes(BACK.name);
  return `Measured: ${n} field${n === 1 ? "" : "s"} left to fill, ${h} px of door, and the page ${knows ? "names the host" : "does not know who this is"}.`;
};

/* ── the frame ───────────────────────────────────────────────────────────── */

function Screen({
  id,
  screen,
  caption,
  read,
  children,
}: {
  id: string;
  screen: ScreenId;
  caption: string;
  read: Reader;
  children: ReactNode;
}) {
  const { w, h, name } = SCREENS[screen];
  // ★ A MEASUREMENT GOES STALE WHEN A KNOB CHANGES, AND THAT IS HOW A CAPTION
  // LIES. `Screen` sits in the same slot whatever the option or the knob, so
  // React keeps its state and the Probe's mount effect never runs again: the
  // first capture of the guest gate carried the login card's numbers and its
  // "the Terms line is on it", under a picture with neither. The sentence is
  // therefore STAMPED with the picture it was read from and ignored the moment
  // they disagree, and the key remounts the Probe so a new one arrives.
  const tag = `${id}-${screen}`;
  const [said, setSaid] = useState<{ tag: string; text: string }| null>(null);
  const text = said?.tag === tag ? said.text : null;
  return (
    <Frame
      id={`ad-${id}-${screen}`}
      w={w}
      h={h}
      title={`${w} x ${h}, ${name}`}
      caption={text ? `${caption} ${text}` : caption}
    >
      <Probe key={tag} read={read} onRead={(s) => setSaid({ tag, text: s })}>
        <Still>{children}</Still>
      </Probe>
    </Frame>
  );
}

const screenFor = (s: BoardState): ScreenId => screenOf(s.screen);

/* ── 1. what the door asks for ───────────────────────────────────────────── */

const LEAD_CAPTION: Record<Lead, string> = {
  password:
    "Today. Two fields lead, and the three other ways in are links arranged around them.",
  code: "One field leads, the one the other three surfaces already lead with; the password drops to a link.",
  google:
    "One press first; the email door is the button under it and the password is the link at the foot.",
};

function leadScreen(lead: Lead, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`lead-${lead}`}
      screen={screen}
      read={doorRead}
      caption={LEAD_CAPTION[lead]}
    >
      {/* The page is the next question, so every lead wears today's answer to
          it and the axis on this step stays one. */}
      <DoorPage shape={TODAY.page} screen={screen}>
        <DoorCard>
          <LeadDoor lead={lead} />
        </DoorCard>
      </DoorPage>
    </Screen>
  );
}

/* ── 2. how many doors ───────────────────────────────────────────────────── */

const SURFACE_CAPTION: Record<SurfaceShape, string> = {
  four: "Today. Four surfaces, four feature sets, three tones, two Terms lines.",
  one: "One object: the same frame and the same first field, and only the reason line moves.",
  door: "One door for everything: the reason rides above the form and the way back sits under it.",
};

function surfaceScreen(shape: SurfaceShape, s: BoardState) {
  const screen = screenFor(s);
  const place: Place = placeOf(s.place);
  return (
    <Screen
      id={`surfaces-${shape}-${place}`}
      screen={screen}
      read={surfaceRead}
      caption={SURFACE_CAPTION[shape]}
    >
      <AccountPlace shape={shape} place={place} screen={screen} />
    </Screen>
  );
}

/* ── 3. the first screen ─────────────────────────────────────────────────── */

const WELCOME_CAPTION: Record<WelcomeShape, string> = {
  tour: "Today. The name, then the marketing site's own three steps, then a goodbye screen.",
  name: "The name, and the app. How it works moves to the empty dashboard underneath.",
  first:
    "The name, the event, and a code on the screen before the host has seen the app at all.",
};

function welcomeScreen(shape: WelcomeShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`welcome-${shape}`}
      screen={screen}
      read={flowRead}
      caption={`${WELCOME_CAPTION[shape]} ${WELCOME_SCREENS[shape]} screen${WELCOME_SCREENS[shape] === 1 ? "" : "s"} between the code and the dashboard.`}
    >
      <WelcomeFlowStack shape={shape} screen={screen} />
    </Screen>
  );
}

/* ── 4. the page ─────────────────────────────────────────────────────────── */

const PAGE_CAPTION: Record<PageShape, string> = {
  card: "Today. A 384px column on paper, and the rest of the screen says nothing.",
  beside:
    "The product takes the half the card was not using; in a hand it is a band over the door.",
  sheet:
    "The album is the page, and the door is the sheet a guest already learned on the way in.",
};

function pageScreen(shape: PageShape, s: BoardState) {
  const screen = screenFor(s);
  const lead = leadOf(s.lead);
  return (
    <Screen
      id={`page-${shape}`}
      screen={screen}
      read={pageRead}
      caption={PAGE_CAPTION[shape]}
    >
      {/* The one place the lead is worn: what the page has room for is a
          different question once the form changed size. */}
      <DoorPage shape={shape} screen={screen}>
        {shape === "sheet" ? (
          <DoorSheetBody>
            <LeadDoor lead={lead} />
          </DoorSheetBody>
        ) : (
          <DoorCard>
            <LeadDoor lead={lead} />
          </DoorCard>
        )}
      </DoorPage>
    </Screen>
  );
}

/* ── 5. an email that already has an account ─────────────────────────────── */

const EXISTING_CAPTION: Record<ExistingShape, string> = {
  silent:
    "Today. You asked to make an account and you are looking at somebody's three events.",
  tell: "The same one step, and one line saying which account this is and why.",
  ask: "The code has proved the address; the account is named before anything opens.",
};

function existingScreen(shape: ExistingShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`existing-${shape}`}
      screen={screen}
      read={namedRead}
      caption={EXISTING_CAPTION[shape]}
    >
      {shape === "ask" ? (
        <DoorPage shape={TODAY.page} screen={screen}>
          <DoorCard
            title="Create your account"
            line="We emailed you a code to confirm it's you."
          >
            <ExistingMoment shape={shape} />
          </DoorCard>
        </DoorPage>
      ) : (
        <ExistingMoment shape={shape} />
      )}
    </Screen>
  );
}

/* ── 6. how the door fails ───────────────────────────────────────────────── */

const FAILURE_CAPTION: Record<FailureShape, string> = {
  one: "Today. Two sentences carry three recoveries, each one a link somewhere else on the card.",
  paths: "The same refusal, and the three ways out are controls where the eye already is.",
  step: "The form steps aside; what is left is the ways in, and a way back to the password.",
};

function failureScreen(shape: FailureShape, s: BoardState) {
  const screen = screenFor(s);
  // ★ THE PASSWORD DOOR, WHATEVER THE LEAD. The generic refusal belongs to
  // `signInWithPassword` and to nothing else, so this decision does not wait
  // on the lead and is not drawn wearing it: a code that fails says "that code
  // didn't work", which is a different sentence and a different question.
  const lead: Lead = TODAY.lead;
  return (
    <Screen
      id={`failure-${shape}`}
      screen={screen}
      read={failureRead}
      caption={FAILURE_CAPTION[shape]}
    >
      <DoorPage shape={TODAY.page} screen={screen}>
        <DoorCard
          banner={shape === "step" ? undefined : <FailureBanner short={shape === "paths"} />}
        >
          {shape === "step" ? (
            <FailureStep />
          ) : shape === "paths" ? (
            <div className="space-y-4">
              <RecoveryButtons />
              <PasswordOnly />
            </div>
          ) : (
            <LeadDoor lead={lead} />
          )}
        </DoorCard>
      </DoorPage>
    </Screen>
  );
}

/* ── 7. the returning host ───────────────────────────────────────────────── */

const RETURN_CAPTION: Record<ReturnShape, string> = {
  same: "Today. A host on their ninth visit reads the same introduction as a stranger.",
  back: "The name, the address and the event this device remembers; one thing left to do.",
  tap: "One press, and the credential never leaves the device. Neither passkeys nor One Tap ship today.",
};

function returnScreen(shape: ReturnShape, s: BoardState) {
  const screen = screenFor(s);
  const lead = leadOf(s.lead);
  const page: PageShape = pageOf(s.page);
  const body =
    shape === "same" ? (
      <LeadDoor lead={lead} />
    ) : (
      <ReturningDoor shape={shape} lead={lead} />
    );
  return (
    <Screen
      id={`return-${shape}`}
      screen={screen}
      read={returnRead}
      caption={RETURN_CAPTION[shape]}
    >
      <DoorPage shape={page} screen={screen}>
        {page === "sheet" ? (
          <DoorSheetBody
            title={shape === "same" ? undefined : `Welcome back, ${BACK.name}`}
            line={
              shape === "same"
                ? undefined
                : "Pick up where you left off. This device remembers you."
            }
          >
            {body}
          </DoorSheetBody>
        ) : (
          <DoorCard
            title={shape === "same" ? undefined : `Welcome back, ${BACK.name}`}
            line={
              shape === "same"
                ? undefined
                : "Pick up where you left off. This device remembers you."
            }
          >
            {body}
          </DoorCard>
        )}
      </DoorPage>
    </Screen>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof APP_DOOR> = {
  "lead.password": (s) => leadScreen("password", s),
  "lead.code": (s) => leadScreen("code", s),
  "lead.google": (s) => leadScreen("google", s),

  "surfaces.four": (s) => surfaceScreen("four", s),
  "surfaces.one": (s) => surfaceScreen("one", s),
  "surfaces.door": (s) => surfaceScreen("door", s),

  "welcome.tour": (s) => welcomeScreen("tour", s),
  "welcome.name": (s) => welcomeScreen("name", s),
  "welcome.first": (s) => welcomeScreen("first", s),

  "page.card": (s) => pageScreen("card", s),
  "page.beside": (s) => pageScreen("beside", s),
  "page.sheet": (s) => pageScreen("sheet", s),

  "existing.silent": (s) => existingScreen("silent", s),
  "existing.tell": (s) => existingScreen("tell", s),
  "existing.ask": (s) => existingScreen("ask", s),

  "failure.one": (s) => failureScreen("one", s),
  "failure.paths": (s) => failureScreen("paths", s),
  "failure.step": (s) => failureScreen("step", s),

  "return.same": (s) => returnScreen("same", s),
  "return.back": (s) => returnScreen("back", s),
  "return.tap": (s) => returnScreen("tap", s),
};

export function AppDoorBoard() {
  return <ExplorationBoard spec={APP_DOOR} previews={PREVIEWS} />;
}

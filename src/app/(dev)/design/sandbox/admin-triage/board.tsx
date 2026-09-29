"use client";

import "./admin-triage.css";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  DAUGHTER,
  type HarmShape,
  lanesOf,
  LICENCE,
  type ProofShape,
  REPORTS_SURFACE,
  reportsIn,
} from "./fixtures";
import { ReportForm } from "./form";
import { ProofInbox, ProofThread } from "./proof";
import {
  Filters,
  type LookShape,
  lookOf,
  type PhoneShape,
  Queue,
  type QueueWorld,
  type Size,
} from "./queue";
import { PhonePortal, Portal, SurfaceHead } from "./shell";
import { ADMIN_TRIAGE } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the operator's portal on one
 * Saturday night, with exactly one axis moved.
 *
 * ★ ONE ROOT, THREE ON IT. `look` is the queue; `harm`, `proof` and `phone`
 * are each drawn ON the queue he picks, so a staged step reads `look` from the
 * board's state (his answer once he gives it, its recommendation before) and
 * moves only its own axis. `look` itself reads the other three from the
 * state too, which before they are answered is TODAY for each (`harm=eye`,
 * `proof=none`): the queue is judged in the world as it is, never quietly
 * wearing an answer to a question he has not reached.
 *
 * ★ EVERY FRAME IS A REAL VIEWPORT AND THE FOLD IS REAL. 1440 by 900 is a
 * laptop, where an operator is; a guest's Report and her inbox are a 375
 * phone, which is where a guest is. A frame never grows to fit its content:
 * how much of a night fits on one screen is half of what `look` decides.
 *
 * ★ AND THE NUMBERS UNDER EVERY FRAME ARE MEASURED, NEVER COMPUTED. Each
 * caption reads the laid-out document inside its own frame once it settles:
 * how many reports are on screen, how big the report in focus really draws,
 * how many of its facts can be read without a tap, how many acts a phone
 * really offers. If the words above a frame and the caption under it
 * disagree, the caption is the truth.
 */

/* ── The measurement ─────────────────────────────────────────────────────── */

type Reader = (root: HTMLElement, win: Window) => string | null;

/**
 * Reads one fact out of the frame's own document, with THAT window's
 * `ResizeObserver` (the subtree lives in the iframe), once the copied
 * stylesheets land and again as photographs decode.
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
    const late = [700, 1500].map((ms) => win.setTimeout(run, ms));
    return () => {
      ro.disconnect();
      late.forEach((t) => win.clearTimeout(t));
    };
  }, []);
  return <div ref={ref}>{children}</div>;
}

const onScreen = (el: Element, win: Window) => {
  const b = el.getBoundingClientRect();
  return b.bottom > 0 && b.top < win.innerHeight && b.width > 0;
};

/**
 * A queue as the browser laid it out: how many reports are on screen, how
 * many facts each report in the sweep shows without a tap, and how wide the
 * report in focus really draws with how many of its facts.
 *
 * ★ TWO FACT COUNTS, BECAUSE THE SHAPES TRADE ONE FOR THE OTHER. A sheet
 * shows every fact on every row and a small frame; a pane shows one line a
 * row and the report in focus whole; a grid shows the picture and two facts.
 * One number alone would crown whichever shape it happened to measure.
 */
const factsIn = (el: Element | null | undefined, win: Window) =>
  new Set(
    [...(el?.querySelectorAll<HTMLElement>("[data-tri-fact]") ?? [])]
      .filter((f) => onScreen(f, win))
      .map((f) => f.dataset.triFact),
  ).size;

const queueRead: Reader = (root, win) => {
  const entries = [...root.querySelectorAll<HTMLElement>("[data-tri-entry]")];
  if (entries.length === 0) return null;
  const peek = root.querySelector<HTMLElement>("[data-tri-peek]");
  const focus =
    peek ??
    root.querySelector<HTMLElement>("[data-tri-whole]") ??
    root.querySelector<HTMLElement>("[data-tri-cursor]") ??
    entries[0];
  const frames = [...focus.querySelectorAll<HTMLElement>("[data-tri-frame]")];
  const edge = Math.max(
    0,
    ...frames.map((f) => Math.round(f.getBoundingClientRect().width)),
  );
  if (edge < 8 && frames.length > 0) return null;
  const inFocus = factsIn(focus, win);
  const ticked = root.querySelectorAll("[aria-pressed='true']").length;
  if (peek)
    return `Measured: the peek draws the report ${edge} px wide, with ${inFocus} of its facts readable beside it.`;
  const seen = new Set(
    entries.filter((e) => onScreen(e, win)).map((e) => e.dataset.triEntry),
  ).size;
  // A report in the sweep that is not the cursor: what a glance down it reads.
  const swept = root.querySelector<HTMLElement>(
    "[data-tri-lane='items'] [data-tri-entry]:not([data-tri-cursor]), [data-tri-lane='rest'] [data-tri-entry]:not([data-tri-cursor])",
  );
  return `Measured: ${seen} reports on this screen, each in the sweep showing ${factsIn(swept, win)} facts without a tap; the one in focus draws ${edge} px wide with ${inFocus}${ticked ? `; ${ticked} ticked` : ""}.`;
};

/** What stands in front of the sweep, and how much the sweep still holds. */
const frontRead: Reader = (root, win) => {
  const lanes = [...root.querySelectorAll<HTMLElement>("[data-tri-lane]")];
  if (lanes.length === 0) return null;
  const count = (id: string) =>
    root.querySelectorAll(`[data-tri-lane='${id}'] [data-tri-entry]`).length;
  const front = count("harm");
  const sweep = count("items") + count("rest");
  const people = count("people");
  const first = root.querySelector<HTMLElement>(
    "[data-tri-lane='harm'] [data-tri-entry] [data-tri-fact='words']",
  );
  const words = first?.innerText.replace(/\s+/g, " ").trim() ?? "";
  if (front > 0 && !words) return null;
  const cut = words.length > 44 ? `${words.slice(0, 42).trim()}…` : words;
  const swept = sweep
    ? `${sweep} wait in the sweep`
    : "there is no sweep at all";
  void win;
  return `Measured: ${front} in front${front ? ` ("${cut}" first)` : ""}${people ? `, ${people} under People` : ""}, and ${swept}.`;
};

/** The guest's form: how tall the dialog stands and what it asks for. */
const formRead: Reader = (root) => {
  const form = root.querySelector<HTMLElement>("[data-tri-form]");
  if (!form) return null;
  const tall = Math.round(form.getBoundingClientRect().height);
  if (tall < 40) return null;
  const kinds = form.querySelectorAll("[data-tri-kind]").length;
  const fields = form.querySelectorAll("textarea, input").length;
  const steered = form.querySelector("[data-tri-steer]");
  const parts = [
    kinds ? `${kinds} kinds to pick from` : "no kind to pick",
    `${fields} field${fields === 1 ? "" : "s"}`,
  ];
  return `Measured: the dialog stands ${tall} px, ${parts.join(" and ")}${steered ? ", and it files nothing: it points to the host" : ""}.`;
};

/** What reached her inbox. */
const inboxRead: Reader = (root) => {
  const mail = root.querySelector<HTMLElement>("[data-tri-mail]");
  if (mail) {
    const words = mail.innerText.trim().split(/\s+/).length;
    if (words < 5) return null;
    return `Measured: one mail of ${words} words, with one button.`;
  }
  return root.querySelector("[data-tri-inbox='empty']")
    ? "Measured: her inbox holds nothing from Partyreel."
    : null;
};

/** Whether the mother's report can be asked, and what it holds after. */
const threadRead: Reader = (root) => {
  const focus =
    root.querySelector<HTMLElement>("[data-tri-peek]") ??
    root.querySelector<HTMLElement>("[data-tri-whole]");
  if (!focus) return null;
  const ask = focus.querySelector("[data-tri-ask]");
  const thread = focus.querySelector<HTMLElement>("[data-tri-thread='asked']");
  if (thread) {
    const words = thread.innerText.trim().split(/\s+/).length;
    return `Measured: her report carries Ask for proof, and its thread stands on it, ${words} words and her photo.`;
  }
  return `Measured: ${ask ? "Ask for proof is on her report" : "no Ask for proof on her report"}, and its slot says why.`;
};

/** A phone's reach: the acts on the report in front, and the ticks below. */
const phoneRead: Reader = (root) => {
  const front = root.querySelector<HTMLElement>("[data-tri-front]");
  if (!front) return null;
  const acts = front.querySelectorAll("[data-tri-verbs] button").length;
  const first = front
    .querySelector<HTMLElement>("[data-tri-verbs] button")
    ?.getBoundingClientRect();
  const ticks = root.querySelectorAll("[aria-pressed]").length;
  if (!first || first.height < 8) return null;
  return `Measured: ${acts} act${acts === 1 ? "" : "s"} on the report in front, the first ${Math.round(first.top)} px down; ${ticks ? `${ticks} reports below can be ticked` : "nothing below can be ticked"}.`;
};

/* ── The stage ───────────────────────────────────────────────────────────── */

const BOX: Record<Size, { w: number; h: number }> = {
  "1440": { w: 1440, h: 900 },
  "375": { w: 375, h: 812 },
};

/** One picture: a real viewport, the settled portal, one axis moved. */
function Screen({
  id,
  size,
  caption,
  read,
  label,
  children,
}: {
  id: string;
  size: Size;
  caption: string;
  read?: Reader;
  /** Which of an option's frames this is, after its size. */
  label?: string;
  children: ReactNode;
}) {
  const [said, setSaid] = useState<string | null>(null);
  const { w, h } = BOX[size];
  return (
    <Frame
      id={`triage-${id}`}
      w={w}
      h={h}
      title={label ? `${w} x ${h}, ${label}` : `${w} x ${h}`}
      caption={said ? `${caption} ${said}` : caption}
    >
      {read ? (
        <Probe read={read} onRead={setSaid}>
          {children}
        </Probe>
      ) : (
        children
      )}
    </Frame>
  );
}

/** Frames of one option, read top to bottom as the night runs. */
function Frames({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-6">{children}</div>;
}

/** Phones of one option, side by side. */
function Phones({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-6">{children}</div>;
}

/* ── The world every preview reads ───────────────────────────────────────── */

const harmOf = (v: string | undefined): HarmShape =>
  v === "kinds" || v === "steer" ? v : "eye";
const proofOf = (v: string | undefined): ProofShape =>
  v === "account" || v === "confirm" ? v : "none";

const worldOf = (
  s: BoardState,
  over: Partial<QueueWorld> = {},
): QueueWorld => ({
  look: lookOf(s.look),
  harm: harmOf(s.harm),
  proof: proofOf(s.proof),
  ...over,
});

/** The page's own heading, shortened to the one line a busy night needs. */
const LEDE =
  "Guest reports, the front first. Dismiss keeps what a report names; Remove takes it out of the album.";

/** The reports page at a laptop, holding one queue. */
function Desk({ world, children }: { world: QueueWorld; children: ReactNode }) {
  return (
    <Portal
      active={REPORTS_SURFACE}
      counts={{ reports: reportsIn(lanesOf(world.harm)) }}
    >
      <SurfaceHead title="Reports" lede={LEDE} aside={<Filters />} />
      {children}
    </Portal>
  );
}

/* ── 1. The queue ────────────────────────────────────────────────────────── */

const LOOK_CAPTION: Record<LookShape, string> = {
  rows: "A sheet: every fact in its own column beside a small 4:5 frame, the cursor's verbs under its row, ticks down the sweep.",
  pane: "The list beside the report: a thumbnail and a line a row, and the report in focus whole on the right, every fact labelled.",
  grid: "The review grid: the front as split cards, then 4:5 tiles on the host queue's floor, each reason in two lines under its tile, select circles on the sweep.",
  albums:
    "By album: the front as split cards, then each album's facts once, its reports as tiles with their words, and Dismiss all on its head.",
};

const PEEK_CAPTION =
  "Space on the licence: the report whole beside its photo, every fact and verb on the panel. Live in the frame: Escape closes, the arrows step.";

function lookScreen(v: LookShape, s: BoardState) {
  const world = worldOf(s, { look: v });
  const lanes = lanesOf(world.harm);
  const screen = (peekOn: string | null, caption: string, label?: string) => (
    <Screen
      id={peekOn ? `look-${v}-peek` : `look-${v}`}
      size="1440"
      caption={caption}
      read={queueRead}
      label={label}
    >
      <Desk world={world}>
        <Queue lanes={lanes} world={world} size="1440" peekOn={peekOn} />
      </Desk>
    </Screen>
  );
  // The pane's report in focus is already whole, so it is one frame; the
  // shapes that open a report on a peek draw the peek as their second.
  if (v === "pane") return screen(null, LOOK_CAPTION.pane);
  return (
    <Frames>
      {screen(null, LOOK_CAPTION[v], "the queue")}
      {screen(LICENCE.id, PEEK_CAPTION, "Space on one")}
    </Frames>
  );
}

/* ── 2. What puts harm in front ──────────────────────────────────────────── */

const HARM_CAPTION: Record<HarmShape, string> = {
  eye: "Today: one queue by time, and the one you moved there with H in front. The licence and the student are still in the sweep.",
  kinds:
    "The four reports whose reporters named harm, in front and worst first, the student's photo covered; everything else in the sweep.",
  steer:
    "Only what named harm was ever filed, so the four stand alone; the sweep's reports went to their hosts from the form.",
};

const FORM_CAPTION: Record<HarmShape, [string, string]> = {
  eye: [
    "The mother's Report, as today: one optional box.",
    "A guest who looks awful in a photo: the same box, and it lands in the sweep.",
  ],
  kinds: [
    "The mother picks Me or my child: it arrives in front.",
    "A guest who looks awful in a photo picks Something else: it joins the sweep.",
  ],
  steer: [
    "The mother picks Me or my child: it is filed, and arrives in front.",
    "The guest who picks Something else is sent to the host, and nothing is filed.",
  ],
};

function harmScreen(v: HarmShape, s: BoardState) {
  const world = worldOf(s, { harm: v });
  return (
    <Frames>
      <Screen
        id={`harm-${v}`}
        size="1440"
        caption={HARM_CAPTION[v]}
        read={frontRead}
        label="the queue"
      >
        <Desk world={world}>
          <Queue lanes={lanesOf(v)} world={world} size="1440" />
        </Desk>
      </Screen>
      <Phones>
        <Screen
          id={`harm-${v}-mother`}
          size="375"
          caption={FORM_CAPTION[v][0]}
          read={formRead}
          label="the mother's Report"
        >
          <ReportForm harm={v} proof={world.proof} />
        </Screen>
        <Screen
          id={`harm-${v}-other`}
          size="375"
          caption={FORM_CAPTION[v][1]}
          read={formRead}
          label="another guest's"
        >
          <ReportForm harm={v} proof={world.proof} who="other" />
        </Screen>
      </Phones>
    </Frames>
  );
}

/* ── 3. Asking for proof ─────────────────────────────────────────────────── */

const PROOF_CAPTION: Record<ProofShape, [string, string, string]> = {
  none: [
    "Her Report, as today: nothing to leave.",
    "Nothing can reach her.",
    "Her report in focus, with no one to ask.",
  ],
  account: [
    "Her Report, signed out: it says she can't be asked.",
    "Nothing can reach her: she reported signed out.",
    "Her report in focus, with no one to ask.",
  ],
  confirm: [
    "Her Report, her email confirmed on it with the door's own code.",
    "The one mail you send by hand: your question, and one button.",
    "Her report in focus once she has answered: the question and the answer on it.",
  ],
};

function proofScreen(v: ProofShape, s: BoardState) {
  const world = worldOf(s, { proof: v });
  const lanes = lanesOf(world.harm);
  const [form, mail, report] = PROOF_CAPTION[v];
  return (
    <Frames>
      <Phones>
        <Screen
          id={`proof-${v}-form`}
          size="375"
          caption={form}
          read={formRead}
          label="her Report"
        >
          <ReportForm harm={world.harm} proof={v} />
        </Screen>
        <Screen
          id={`proof-${v}-mail`}
          size="375"
          caption={mail}
          read={inboxRead}
          label="her inbox"
        >
          <ProofInbox proof={v} />
        </Screen>
      </Phones>
      <Screen
        id={`proof-${v}-report`}
        size="1440"
        caption={report}
        read={threadRead}
        label="her report"
      >
        <Desk world={world}>
          <Queue
            lanes={lanes}
            world={world}
            size="1440"
            // The pane opens her report in focus; the shapes with a peek open
            // it there.
            cursor={DAUGHTER.id}
            peekOn={world.look === "pane" ? null : DAUGHTER.id}
            detail={(e) => <ProofThread entry={e} proof={v} />}
          />
        </Desk>
      </Screen>
    </Frames>
  );
}

/* ── 4. What a phone may do ──────────────────────────────────────────────── */

const PHONE_CAPTION: Record<PhoneShape, string> = {
  stop: "One act on the report in front; nothing below can be ticked.",
  sweep:
    "One act on the report in front, and the sweep below ticked and dismissed from here.",
  hold: "The act and a hold opened without its reason; nothing below can be ticked.",
  all: "Today: everything a desk does, in a phone column.",
};

function phoneScreen(v: PhoneShape, s: BoardState) {
  const world = worldOf(s, { phone: v });
  return (
    <Screen
      id={`phone-${v}`}
      size="375"
      caption={PHONE_CAPTION[v]}
      read={phoneRead}
    >
      <PhonePortal active={REPORTS_SURFACE}>
        <Queue lanes={lanesOf(world.harm)} world={world} size="375" />
      </PhonePortal>
    </Screen>
  );
}

/* ── The map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof ADMIN_TRIAGE> = {
  "look.rows": (s) => lookScreen("rows", s),
  "look.pane": (s) => lookScreen("pane", s),
  "look.grid": (s) => lookScreen("grid", s),
  "look.albums": (s) => lookScreen("albums", s),

  "harm.eye": (s) => harmScreen("eye", s),
  "harm.kinds": (s) => harmScreen("kinds", s),
  "harm.steer": (s) => harmScreen("steer", s),

  "proof.none": (s) => proofScreen("none", s),
  "proof.account": (s) => proofScreen("account", s),
  "proof.confirm": (s) => proofScreen("confirm", s),

  "phone.stop": (s) => phoneScreen("stop", s),
  "phone.sweep": (s) => phoneScreen("sweep", s),
  "phone.hold": (s) => phoneScreen("hold", s),
  "phone.all": (s) => phoneScreen("all", s),
};

export function AdminTriageBoard() {
  return <ExplorationBoard spec={ADMIN_TRIAGE} previews={PREVIEWS} />;
}

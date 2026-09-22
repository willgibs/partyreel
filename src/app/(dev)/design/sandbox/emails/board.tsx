"use client";

import { type ReactNode, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { CodeMock, type CodeShape } from "./code";
import { splitLayout } from "./extract";
import {
  HOST_MAILS,
  HOSTS,
  OPERATOR_MAILS,
  PERSON_SENDER,
  SYSTEM_SENDER,
} from "./fixtures";
import {
  DesktopChrome,
  type ListRow,
  InboxList,
  InboxMessage,
  PhoneChrome,
  Probe,
  type Reader,
  SCREENS,
  type ScreenId,
  screenOf,
  sizeOf,
  toHex,
} from "./mock";
import {
  DORMANT_ROSTER,
  GUEST_ROSTER,
  IDENTITY_ROSTER,
  MomentsRoster,
  RetiredSwitchesStub,
  TODAY_ROSTER,
} from "./moments";
import {
  type BrandId,
  DarkComparison,
  type DarkId,
  HostCard,
  OperatorHandRolled,
  OperatorPlainText,
  ShellStage,
  UnifiedOperatorCard,
} from "./shells";
import { EMAILS } from "./spec";

/**
 * THE PREVIEWS, drawn on the real fixtures: every option is the guest's^H^H^H
 * a real inbox at one of two real widths, holding either the shipped
 * `{ subject, html }` unmodified or (three decisions only) the same real
 * heading/body/button/footer re-wrapped by `shells.tsx`.
 *
 * ★ EVERY PREVIEW READS THE SHARED `screen` KNOB. One inbox width is on the
 * stage at a time; the reviewer flips it from the dock, same as any other
 * config.
 *
 * ★ THE NUMBERS UNDER EVERY FRAME ARE MEASURED, NEVER COMPUTED (the
 * guest-upload precedent): each caption reads the laid-out DOM inside the
 * frame's own document once it settles, never a literal this file typed.
 */

/* ── the two real specimens `shell`/`brand`/`dark` re-wrap ───────────────── */

const HOST_PARTS = splitLayout(HOST_MAILS.graceStart.html);
const OPERATOR_PARTS = splitLayout(OPERATOR_MAILS.contact.html);

/* ── the frame ────────────────────────────────────────────────────────────  */

function Stage({
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
  const [said, setSaid] = useState<string | null>(null);
  const { w, h, name } = SCREENS[screen];
  return (
    <Frame
      id={`em-${id}-${screen}`}
      w={w}
      h={h}
      title={`${w} x ${h}, ${name}`}
      caption={said ? `${caption} ${said}` : caption}
    >
      <Probe read={read} onRead={setSaid}>
        {children}
      </Probe>
    </Frame>
  );
}

const screenFor = (s: BoardState): ScreenId => screenOf(s.screen);

/* ── 1. one shell ─────────────────────────────────────────────────────────  */

type ShellShape = "today" | "unified" | "plain";

const SHELL_CAPTION: Record<ShellShape, string> = {
  today:
    "Today. A 480px card with a CTA, above a 560px div with no card of its own.",
  unified: "One 520px card, for both: only the foot's last line differs.",
  plain: "The 480px host card, unchanged, above the same real copy as bare text.",
};

/** The operator specimen's own envelope, per shape: today leaves it unstyled
 * (its real hand-rolled shape), unified gives it the host's own card, plain
 * drops it to bare monospace. Distinct enough that no two shapes measure as
 * the same picture (the pixel-diff gate caught the two-state version). */
const OPERATOR_STYLE: Record<ShellShape, "none" | "card" | "plain"> = {
  today: "none",
  unified: "card",
  plain: "plain",
};

const shellRead: Reader = (root, win) => {
  const host = root.querySelector<HTMLElement>('[data-inbox-card="host"]');
  const op =
    root.querySelector<HTMLElement>('[data-inbox-card="operator"]') ??
    root.querySelector<HTMLElement>('[data-inbox-card="operator-plain"]') ??
    root.querySelector<HTMLElement>('[data-inbox-card="operator-flush"]');
  if (!host || !op) return null;
  const hw = Math.round(host.getBoundingClientRect().width);
  const ow = Math.round(op.getBoundingClientRect().width);
  const kind = op.dataset.inboxCard;
  const family = win.getComputedStyle(op).fontFamily.toLowerCase();
  const opDesc =
    kind === "operator"
      ? `the operator card ${ow} px, the same envelope`
      : `the operator copy runs ${family.includes("mono") ? "monospace" : "sans"} at ${ow} px, ${kind === "operator-plain" ? "no envelope at all" : "no envelope of its own"}`;
  return `Measured: the host card is ${hw} px wide; ${opDesc}.`;
};

function shellScreen(shape: ShellShape, s: BoardState) {
  const screen = screenFor(s);
  const hostWidth = shape === "unified" ? 520 : 480;
  const host = <HostCard parts={HOST_PARTS} brand="bare" width={hostWidth} />;
  const operator =
    shape === "today" ? (
      <OperatorHandRolled parts={OPERATOR_PARTS} />
    ) : shape === "unified" ? (
      <UnifiedOperatorCard parts={OPERATOR_PARTS} width={520} />
    ) : (
      <OperatorPlainText parts={OPERATOR_PARTS} />
    );
  return (
    <Stage
      id={`shell-${shape}`}
      screen={screen}
      read={shellRead}
      caption={SHELL_CAPTION[shape]}
    >
      <ShellStage
        screen={screen}
        host={host}
        operator={operator}
        operatorStyle={OPERATOR_STYLE[shape]}
      />
    </Stage>
  );
}

/* ── 2. the brand (after shell) ───────────────────────────────────────────  */

const BRAND_CAPTION: Record<BrandId, string> = {
  bare: "Today. No logo anywhere; the button is a rose the product uses nowhere else.",
  ink: "The same card; the button takes the brand's own ink.",
  wordmark: "The inline wordmark sits above the heading; the button is ink.",
  aurora: "The wordmark, lit from behind by the marketing site's own aurora.",
};

const brandRead: Reader = (root, win) => {
  const cta = root.querySelector<HTMLElement>("[data-inbox-cta]");
  const logo = root.querySelector("[data-inbox-logo]");
  const aurora = root.querySelector("[data-inbox-aurora]");
  if (!cta) return null;
  const color = toHex(win.getComputedStyle(cta).backgroundColor);
  return `Measured: the button is ${color}${logo ? ", a wordmark above the heading" : ", no logo"}${aurora ? ", an aurora band behind it" : ""}.`;
};

function brandScreen(brand: BrandId, s: BoardState) {
  const screen = screenFor(s);
  const width = s.shell === "unified" ? 520 : 480;
  return (
    <Stage
      id={`brand-${brand}`}
      screen={screen}
      read={brandRead}
      caption={BRAND_CAPTION[brand]}
    >
      <InboxMessage
        screen={screen}
        fromName={SYSTEM_SENDER.name}
        fromEmail={SYSTEM_SENDER.email}
        to={HOSTS.maya.email}
        subject={HOST_MAILS.graceStart.subject}
        when="9:14 AM"
      >
        <HostCard parts={HOST_PARTS} brand={brand} width={width} />
      </InboxMessage>
    </Stage>
  );
}

/* ── 3. the sender ────────────────────────────────────────────────────────  */

type SenderShape = "system" | "person" | "tagged";

const SENDER_CAPTION: Record<SenderShape, string> = {
  system: "Today. Every mail, host and operator, from the same noreply address.",
  person: "Host mail now from a person; the operator roster is unchanged.",
  tagged: "The sender stays noreply; every operator subject now carries the same tag.",
};

const OPERATOR_ROSTER: { subject: string; taggedToday: boolean }[] = [
  { subject: OPERATOR_MAILS.contact.subject, taggedToday: false },
  { subject: OPERATOR_MAILS.careers.subject, taggedToday: false },
  { subject: OPERATOR_MAILS.orphan.subject, taggedToday: true },
  { subject: OPERATOR_MAILS.prune.subject, taggedToday: true },
];

function operatorRows(tagAll: boolean): ListRow[] {
  const whens = ["9:02 AM", "Yesterday", "Mon", "Sep 12"];
  return OPERATOR_ROSTER.map((o, i) => ({
    from: "Partyreel ops",
    subject:
      tagAll && !o.taggedToday ? `[Partyreel] ${o.subject}` : o.subject,
    preview: o.taggedToday || tagAll ? "Tagged in the subject" : "Not tagged",
    when: whens[i],
  }));
}

const senderRead: Reader = (root) => {
  const from = root.querySelector("[data-inbox-from]")?.textContent ?? "";
  const subjects = [...root.querySelectorAll("[data-inbox-list-subject]")];
  const tagged = subjects.filter((el) =>
    (el.textContent ?? "").startsWith("[Partyreel]"),
  ).length;
  return `Measured: host mail from "${from}"; ${tagged} of ${subjects.length} operator subjects tagged.`;
};

function senderScreen(shape: SenderShape, s: BoardState) {
  const screen = screenFor(s);
  const from = shape === "person" ? PERSON_SENDER : SYSTEM_SENDER;
  const rows = operatorRows(shape === "tagged");
  return (
    <Stage
      id={`sender-${shape}`}
      screen={screen}
      read={senderRead}
      caption={SENDER_CAPTION[shape]}
    >
      <div data-inbox-screen={screen} className="flex h-full flex-col bg-neutral-100">
        {screen === "1440" ? <DesktopChrome /> : <PhoneChrome />}
        <div className="flex flex-1 flex-col items-center gap-5 overflow-auto px-4 py-4">
          <div
            style={{
              width: "100%",
              maxWidth: screen === "1440" ? 640 : SCREENS[screen].w - 32,
            }}
          >
            <p className="mb-1.5 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
              Host mail
            </p>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-neutral-200 p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700">
                  {from.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    data-inbox-from
                    className="truncate text-sm font-semibold text-neutral-900"
                  >
                    {from.name}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {from.email}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <HostCard parts={HOST_PARTS} brand="bare" />
              </div>
            </div>
          </div>
          <div
            style={{
              width: "100%",
              maxWidth: screen === "1440" ? 640 : SCREENS[screen].w - 32,
            }}
          >
            <p className="mb-1.5 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
              Operator inbox
            </p>
            <InboxList screen={screen} rows={rows} />
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ── 4. the foot ──────────────────────────────────────────────────────────  */

type FootShape = "line" | "commercial" | "every";

const FOOT_CAPTION: Record<FootShape, string> = {
  line: "Today. One line, on every mail; no unsubscribe or address anywhere.",
  commercial:
    "The renewal nudge gains the line; the inactivity warning, a pure account notice, does not.",
  every:
    "Both gain it: an unsubscribe under a warning nobody can opt out of.",
};

function extraFootShown(shape: FootShape, commercial: boolean): boolean {
  if (shape === "line") return false;
  if (shape === "every") return true;
  return commercial;
}

function ExtraFoot() {
  return (
    <div
      data-inbox-extra-foot
      style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #ddd" }}
    >
      <p style={{ fontSize: 11, color: "#999", margin: 0 }}>
        Partyreel, 123 Market St, San Francisco, CA.{" "}
        <a href="#" style={{ color: "#999" }}>
          Unsubscribe
        </a>
      </p>
    </div>
  );
}

function FootSpecimen({
  label,
  screen,
  html,
  extra,
}: {
  label: string;
  screen: ScreenId;
  html: string;
  extra: boolean;
}) {
  const parts = splitLayout(html);
  return (
    <div
      style={{
        width: "100%",
        maxWidth: screen === "1440" ? 640 : SCREENS[screen].w - 32,
      }}
    >
      <p className="mb-1.5 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
        {label}
      </p>
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <HostCard parts={parts} brand="bare" />
        {extra ? <ExtraFoot /> : null}
      </div>
    </div>
  );
}

const footRead: Reader = (root) => {
  const extras = root.querySelectorAll("[data-inbox-extra-foot]").length;
  return `Measured: the extra footer block appears on ${extras} of 2 specimens shown.`;
};

function footScreen(shape: FootShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Stage
      id={`foot-${shape}`}
      screen={screen}
      read={footRead}
      caption={FOOT_CAPTION[shape]}
    >
      <div data-inbox-screen={screen} className="flex h-full flex-col bg-neutral-100">
        {screen === "1440" ? <DesktopChrome /> : <PhoneChrome />}
        <div className="flex flex-1 flex-col items-center gap-5 overflow-auto px-4 py-4">
          <FootSpecimen
            label="Renewal nudge (commercial-leaning)"
            screen={screen}
            html={HOST_MAILS.renewal.html}
            extra={extraFootShown(shape, true)}
          />
          <FootSpecimen
            label="Inactivity warning (account notice)"
            screen={screen}
            html={HOST_MAILS.inactivityWarning.html}
            extra={extraFootShown(shape, false)}
          />
        </div>
      </div>
    </Stage>
  );
}

/* ── 5. the code ──────────────────────────────────────────────────────────  */

const CODE_CAPTION: Record<CodeShape, string> = {
  continue: "The digits lead; a plain Continue carries the link path beneath them.",
  promise: "The digits lead; the button echoes the gate's own line instead.",
};

const codeRead: Reader = (root, win) => {
  const digits = root.querySelector<HTMLElement>("[data-inbox-digits]");
  const button = root.querySelector<HTMLElement>("[data-inbox-cta]");
  const size = digits ? sizeOf(digits, win) : null;
  return `Measured: ${digits ? `the digits at ${size} px` : "no digits shown"}${button ? ", a button beneath" : ", no button"}.`;
};

function codeScreen(shape: CodeShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Stage
      id={`code-${shape}`}
      screen={screen}
      read={codeRead}
      caption={CODE_CAPTION[shape]}
    >
      <InboxMessage
        screen={screen}
        fromName={SYSTEM_SENDER.name}
        fromEmail={SYSTEM_SENDER.email}
        to={HOSTS.maya.email}
        subject="Your Partyreel sign-in code"
        when="Just now"
      >
        <CodeMock shape={shape} />
      </InboxMessage>
    </Stage>
  );
}

/* ── 6. the moments ───────────────────────────────────────────────────────  */

type MomentsShape = "shipped" | "retired" | "identity";

const MOMENTS_CAPTION: Record<MomentsShape, string> = {
  shipped: "Thirteen rows: the three dormant switches now have a real subject each.",
  retired:
    "Ten rows stand; Account settings drops to the one switch that is real.",
  identity:
    "Ten rows, plus one new: an account confirmed, the moment the three dormant switches never anticipated.",
};

const momentsRead: Reader = (root) => {
  const rows = root.querySelectorAll('[data-inbox-row] > div').length;
  const dormant = root.querySelectorAll("[data-inbox-dormant-switch]").length;
  return `Measured: ${rows} rows on the roster${dormant ? `, ${dormant} live switch${dormant === 1 ? "" : "es"} with nothing behind ${dormant === 1 ? "it" : "them"}` : ", no dormant switches left standing"}.`;
};

function momentsScreen(shape: MomentsShape, s: BoardState) {
  const screen = screenFor(s);
  const rows =
    shape === "shipped"
      ? [...TODAY_ROSTER, ...DORMANT_ROSTER]
      : shape === "identity"
        ? [...TODAY_ROSTER, ...IDENTITY_ROSTER]
        : TODAY_ROSTER;
  return (
    <Stage
      id={`moments-${shape}`}
      screen={screen}
      read={momentsRead}
      caption={MOMENTS_CAPTION[shape]}
    >
      <div data-inbox-screen={screen} className="flex h-full flex-col bg-neutral-100">
        {screen === "1440" ? <DesktopChrome /> : <PhoneChrome />}
        <div className="flex-1 overflow-auto px-4 py-4">
          <div
            className="mx-auto flex flex-col gap-4"
            style={{
              maxWidth: screen === "1440" ? 640 : SCREENS[screen].w - 32,
            }}
          >
            <MomentsRoster rows={rows} />
            {/* Both `retired` and `identity` drop the four dead switches: the
                only difference between them is which rows the roster above
                already carries. */}
            {shape === "retired" || shape === "identity" ? (
              <RetiredSwitchesStub />
            ) : null}
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ── 7. the guest's (after moments) ───────────────────────────────────────  */

type GuestShape = "none" | "link" | "both";

const GUEST_CAPTION: Record<GuestShape, string> = {
  none: "Empty. The address is stored; nothing ever arrives.",
  link: "One mail: the album's link, sent once.",
  both: "Two: the link, and a later one once the party is behind them.",
};

const guestRead: Reader = (root) => {
  const empty = root.querySelector("[data-inbox-empty]");
  const rows = root.querySelectorAll("[data-inbox-list-subject]").length;
  return `Measured: ${empty ? "an empty inbox" : `${rows} mail${rows === 1 ? "" : "s"} from Partyreel`}.`;
};

function guestScreen(shape: GuestShape, s: BoardState) {
  const screen = screenFor(s);
  const source =
    shape === "none"
      ? []
      : shape === "link"
        ? GUEST_ROSTER.slice(0, 1)
        : GUEST_ROSTER;
  const rows: ListRow[] = source.map((r, i) => ({
    from: SYSTEM_SENDER.name,
    subject: r.subject,
    preview: r.trigger,
    when: i === 0 ? "Sat" : "3 weeks later",
  }));
  return (
    <Stage
      id={`guest-${shape}`}
      screen={screen}
      read={guestRead}
      caption={GUEST_CAPTION[shape]}
    >
      <InboxList screen={screen} rows={rows} />
    </Stage>
  );
}

/* ── 8. the dark inbox (after brand) ──────────────────────────────────────  */

const DARK_CAPTION: Record<DarkId, string> = {
  today:
    "No colour-scheme declared; the dark pane shows exactly what that leaves behind.",
  light: "An explicit white island, forced, on either ground.",
  both: "A considered dark surface of its own, alongside the light one.",
};

const darkRead: Reader = (root, win) => {
  const card = root.querySelector<HTMLElement>("[data-inbox-dark-card]");
  if (!card) return null;
  const raw = win.getComputedStyle(card).backgroundColor;
  const transparent = /rgba?\([^)]*,\s*0\)$/.test(raw) || raw === "transparent";
  const color = toHex(win.getComputedStyle(card).color);
  return `Measured: on the dark pane the text is ${color}, over ${transparent ? "no declared background (the page's own ground shows through)" : toHex(raw)}.`;
};

function darkScreen(mode: DarkId, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Stage
      id={`dark-${mode}`}
      screen={screen}
      read={darkRead}
      caption={DARK_CAPTION[mode]}
    >
      <div data-inbox-screen={screen} className="flex h-full flex-col bg-neutral-100">
        {screen === "1440" ? <DesktopChrome /> : <PhoneChrome />}
        <div className="flex-1 overflow-auto p-4">
          <DarkComparison parts={HOST_PARTS} mode={mode} />
        </div>
      </div>
    </Stage>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────  */

const PREVIEWS: PreviewsFor<typeof EMAILS> = {
  "shell.today": (s) => shellScreen("today", s),
  "shell.unified": (s) => shellScreen("unified", s),
  "shell.plain": (s) => shellScreen("plain", s),

  "brand.bare": (s) => brandScreen("bare", s),
  "brand.ink": (s) => brandScreen("ink", s),
  "brand.wordmark": (s) => brandScreen("wordmark", s),
  "brand.aurora": (s) => brandScreen("aurora", s),

  "sender.system": (s) => senderScreen("system", s),
  "sender.person": (s) => senderScreen("person", s),
  "sender.tagged": (s) => senderScreen("tagged", s),

  "foot.line": (s) => footScreen("line", s),
  "foot.commercial": (s) => footScreen("commercial", s),
  "foot.every": (s) => footScreen("every", s),

  "code.continue": (s) => codeScreen("continue", s),
  "code.promise": (s) => codeScreen("promise", s),

  "moments.shipped": (s) => momentsScreen("shipped", s),
  "moments.retired": (s) => momentsScreen("retired", s),
  "moments.identity": (s) => momentsScreen("identity", s),

  "guest.none": (s) => guestScreen("none", s),
  "guest.link": (s) => guestScreen("link", s),
  "guest.both": (s) => guestScreen("both", s),

  "dark.today": (s) => darkScreen("today", s),
  "dark.light": (s) => darkScreen("light", s),
  "dark.both": (s) => darkScreen("both", s),
};

export function EmailsBoard() {
  return <ExplorationBoard spec={EMAILS} previews={PREVIEWS} />;
}

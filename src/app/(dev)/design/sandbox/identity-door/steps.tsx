"use client";

import type { ReactNode } from "react";
import {
  Camera,
  Check,
  Eye,
  ImageUp,
  Images,
  QrCode,
} from "lucide-react";

import { DOOR_WEAR } from "@/components/auth/account-door";
import { GoogleIcon } from "@/components/auth/google-icon";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { KbFoot } from "./door";
import { CODE, EVENT, HOST, PRIYA } from "./fixtures";
import {
  GhostGlyph,
  InMark,
  LockGlyph,
  PromiseGlyph,
  SentMark,
} from "./glyphs";
import { LitHero, type Strength, Ticker } from "./lit";
import type { World } from "./world";

/**
 * THE DOOR'S STEPS, EACH A FUNCTION OF THE WORLD.
 *
 * ★ DRAWN FROM PRODUCTION, NOT FROM ROUND TWO'S BOARD (the manifest: the board
 * had drifted). Every word and icon an ask does not move is production's own
 * as it stands: `entry-modal.tsx` (the welcome, the demo's, the beat and the
 * stall), `door/chooser.tsx`, `guest-name-step.tsx`, `identify-step.tsx`,
 * `door/signin-step.tsx` through `account-door.tsx` and `email-sign-in.tsx`,
 * `password-gate.tsx`, `upload-step.tsx` over `upload/intent-sheet.tsx`,
 * `add-email-dialog.tsx`, and guest-capture's `OfferSheet` for the keep
 * screen `guest-door` is building. Their classes are quoted too, so a
 * spacing on this board is production's spacing.
 *
 * ★ WORDS THAT ARE NOT THIS BOARD'S, HELD AT TODAY'S IN EVERY ANSWER:
 * `voice-guest` asks the welcome's two rows (`welcome`), the password step's
 * words (`ask`) and the keep screen's (`keep`); the gate's line is his,
 * ruled verbatim (`DOOR_WEAR.gate`); the chooser's three buttons, the name
 * step's line and "Save this event for later" are his own words.
 *
 * ★ QUOTED, NEVER MOUNTED. `AccountDoor`, `EmailSignIn`, `GuestNameStep` and
 * the Sheet all reach a session, a server action or a portal, so their markup
 * is copied onto inert elements: every control is `tabIndex={-1}` with no
 * handler, and a focused field is DRAWN focused (its ring and a caret),
 * because a lab frame holds one real focus and every keyboard frame needs
 * its own visible.
 */

export type Kb = { kind: "text" | "email" | "digits"; enter: string };

export type StepSpec = {
  node: ReactNode;
  back?: boolean;
  close?: boolean;
  pad?: "door" | "sheet";
  /** How strongly the lamp burns on this step (the code brightens it, a beat blooms it). */
  lamp: Strength;
  /** The keyboard a phone raises here, or none. */
  kb: Kb | null;
};

export type DoorStep =
  | "welcome"
  | "demo"
  | "chooser"
  | "name"
  | "name-email"
  | "edit"
  | "password"
  | "unlock"
  | "gate"
  | "create"
  | "login"
  | "code-gate"
  | "code-create"
  | "code-login"
  | "upload"
  | "demo-upload"
  | "keep"
  | "in"
  | "stalled"
  | "change";

/* ── the furniture, quoted ─────────────────────────────────────────────── */

/**
 * `ui/input.tsx` as the door sizes it (`h-11 text-base`), its `md:text-sm`
 * kept, so a desk panel's field reads at 14 px as production's does.
 */
const FIELD =
  "flex h-11 w-full min-w-0 items-center rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm dark:bg-input/30";
const FOCUSED = "border-ring ring-3 ring-ring/50";

/** A field, drawn: the Input's own classes, its ring when focused, a caret. */
function Field({
  id,
  value,
  placeholder,
  focused = false,
  mask = false,
  trailing,
}: {
  id: string;
  value?: string;
  placeholder?: string;
  focused?: boolean;
  /** A password: its characters drawn as dots. */
  mask?: boolean;
  trailing?: ReactNode;
}) {
  const shown = value && mask ? "•".repeat(value.length) : value;
  return (
    <div
      data-door-field={id}
      data-door-focus={focused ? "" : undefined}
      className={cn(FIELD, focused && FOCUSED, "relative")}
    >
      {shown ? (
        <span
          className={cn(
            "truncate text-foreground",
            mask && "tracking-[0.2em]",
          )}
        >
          {shown}
        </span>
      ) : (
        !focused && (
          <span className="truncate text-muted-foreground">{placeholder}</span>
        )
      )}
      {focused && <span aria-hidden className="door-caret" />}
      {focused && !shown && (
        <span className="truncate text-muted-foreground">{placeholder}</span>
      )}
      {trailing}
    </div>
  );
}

/** `ui/label.tsx`'s classes. */
function FieldLabel({
  children,
  hidden = false,
}: {
  children: ReactNode;
  hidden?: boolean;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none",
        hidden && "sr-only",
      )}
    >
      {children}
    </p>
  );
}

/** A step's two sentences, the way every step renders them for the eye. */
function Heading({ title, reason }: { title: ReactNode; reason?: ReactNode }) {
  return (
    <div data-door-heading>
      <p className="font-heading text-page text-balance">{title}</p>
      {reason && (
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          {reason}
        </p>
      )}
    </div>
  );
}

function Primary({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Button
      type="button"
      size="cta"
      className={cn("w-full", className)}
      tabIndex={-1}
      data-door-primary
    >
      {children}
    </Button>
  );
}

function Outline({ children }: { children: ReactNode }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="cta"
      className="w-full"
      tabIndex={-1}
    >
      {children}
    </Button>
  );
}

function Or() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/* ── the welcome, and the demo's ──────────────────────────────────────── */

/** A promise row: its glyph (on `icons`), then the line. */
function PromiseRow({
  icon,
  hue,
  w,
  children,
}: {
  icon: typeof Camera;
  hue: 1 | 2;
  w: World;
  children: ReactNode;
}) {
  return (
    <p
      data-door-promise
      className={cn(
        "flex text-base leading-relaxed",
        w.icons === "lit" ? "items-center gap-3.5" : "items-start gap-3",
      )}
    >
      <PromiseGlyph icon={icon} icons={w.icons} hue={hue} />
      <span>{children}</span>
    </p>
  );
}

function welcome(w: World, desk: boolean): StepSpec {
  return {
    lamp: "base",
    kb: null,
    node: (
      <div data-door-step="welcome" data-welcome-step className="flex flex-col gap-5">
        <LitHero desk={desk} />
        <div className={cn("flex flex-col", w.icons === "lit" ? "gap-4" : "gap-3.5")}>
          <PromiseRow icon={Camera} hue={1} w={w}>
            Add your photos and videos in seconds. No app required.
          </PromiseRow>
          <PromiseRow icon={Images} hue={2} w={w}>
            {"Everyone’s shots land in one album. "}
            <Ticker />
            {" are already inside."}
          </PromiseRow>
        </div>
        <div className="mt-auto flex flex-col gap-1">
          <Primary>Continue</Primary>
          <LegalConsentLine newTab className="mt-2 text-center" />
        </div>
      </div>
    ),
  };
}

/**
 * THE DEMO'S WELCOME, never drawn before: `RoleStep`'s own words in lit's
 * hierarchy (its design is the welcome's, so a redesign redraws both), the
 * event's name taking the hero size inside the same sentence.
 */
function demo(w: World, desk: boolean): StepSpec {
  return {
    lamp: "base",
    kb: null,
    node: (
      <div data-door-step="demo" data-welcome-step className="flex flex-col gap-5">
        <div className="flex flex-col">
          <p className="text-label font-medium text-muted-foreground uppercase">
            A live demo
          </p>
          <p className="mt-1.5 font-heading text-balance">
            <span className="block text-page">You&rsquo;re a guest at</span>
            <span
              data-door-lit-name
              className={cn("block", desk ? "text-section" : "text-hero")}
            >
              {EVENT.name}
            </span>
          </p>
          <p className="mt-2 text-working text-muted-foreground">
            {`This is a real album, exactly as ${HOST.name}’s guests see it.`}
          </p>
        </div>
        <div className={cn("flex flex-col", w.icons === "lit" ? "gap-4" : "gap-3.5")}>
          <PromiseRow icon={ImageUp} hue={1} w={w}>
            Add a photo the way a guest would. Nothing you add is saved.
          </PromiseRow>
          <PromiseRow icon={QrCode} hue={2} w={w}>
            One code did all of this. Yours takes about a minute.
          </PromiseRow>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <Primary>Continue</Primary>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            tabIndex={-1}
          >
            Start your own
          </Button>
        </div>
      </div>
    ),
  };
}

/* ── his chooser (`chooser`) ───────────────────────────────────────────── */

const CHOOSER = {
  title: "How do you want to join?",
  reason:
    "A name is all it takes. With an account, every photo you add stays with you.",
} as const;

/**
 * `told`'s three small lines, each taken from a promise production already
 * makes (the chooser's own sentence and Log in's), so no way in is sold with
 * a word the door does not already say.
 */
const TOLD = {
  guest: "Just your name",
  create: "Every photo you add stays with you",
  login: "The photos you add join your account",
} as const;

function ToldButton({
  primary = false,
  label,
  line,
}: {
  primary?: boolean;
  label: string;
  line: string;
}) {
  return (
    <Button
      type="button"
      variant={primary ? "default" : "outline"}
      size="cta"
      tabIndex={-1}
      data-door-primary={primary ? "" : undefined}
      data-door-way
      className="h-auto w-full flex-col gap-0.5 py-2.5"
    >
      <span className="leading-tight">{label}</span>
      <span
        data-door-way-line
        className={cn(
          "text-xs leading-tight font-normal",
          primary ? "text-primary-foreground/70" : "text-muted-foreground",
        )}
      >
        {line}
      </span>
    </Button>
  );
}

function chooser(w: World): StepSpec {
  const heading =
    w.chooser === "bare" ? (
      <Heading title={EVENT.name} />
    ) : (
      <Heading
        title={CHOOSER.title}
        reason={
          w.chooser === "told" ? undefined : CHOOSER.reason
        }
      />
    );
  const buttons =
    w.chooser === "told" ? (
      <div className="flex flex-col gap-2">
        <ToldButton primary label="Continue as guest" line={TOLD.guest} />
        <ToldButton label="Create account" line={TOLD.create} />
        <ToldButton label="Log in" line={TOLD.login} />
      </div>
    ) : w.chooser === "link" ? (
      <div className="flex flex-col gap-2">
        <Primary>Continue as guest</Primary>
        <Outline>Create account</Outline>
        <p
          data-door-login-link
          className="pt-2 text-center text-reading text-muted-foreground"
        >
          Already on Partyreel?{" "}
          <span className="font-medium text-foreground underline underline-offset-4">
            Log in
          </span>
        </p>
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        <Primary>Continue as guest</Primary>
        <Outline>Create account</Outline>
        <Outline>Log in</Outline>
      </div>
    );
  return {
    back: true,
    lamp: "base",
    kb: null,
    node: (
      <div data-door-step="chooser" className="flex flex-col gap-5">
        {heading}
        {buttons}
      </div>
    ),
  };
}

/* ── the name (`hint`), its email opened, and the edit door ────────────── */

/**
 * The line under her name, the one thing `hint` moves. `change` says nothing
 * on Change name itself, where she is already changing it.
 */
function NameHint({ w, editing = false }: { w: World; editing?: boolean }) {
  if (w.hint === "none" || (w.hint === "change" && editing)) return null;
  return (
    <p data-door-hint className="text-reading text-muted-foreground">
      {w.hint === "change"
        ? "You can change it anytime."
        : "Just a name. Nobody has to prove a name."}
    </p>
  );
}

/** The ghost row, as `guest-name-step.tsx` draws it (dashed, the envelope). */
function GhostRow({ w }: { w: World }) {
  return (
    <span
      data-door-ghost
      className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 text-left text-working text-muted-foreground"
    >
      <GhostGlyph icons={w.icons} />
      <span data-door-ghost-line className="min-w-0 whitespace-nowrap">
        Add an email to come back anytime
      </span>
    </span>
  );
}

function nameStep(w: World, open: boolean): StepSpec {
  return {
    back: true,
    lamp: "base",
    kb: open ? { kind: "email", enter: "go" } : { kind: "text", enter: "go" },
    node: (
      <div
        data-door-step={open ? "name-email" : "name"}
        className="flex flex-col gap-4"
      >
        <Heading
          title="What should we call you?"
          reason="Your name goes on the photos you add, so the host knows who to thank."
        />
        <div className="space-y-1.5">
          <FieldLabel hidden>Your name</FieldLabel>
          <Field id="name" value={PRIYA.name} focused={!open} />
          <NameHint w={w} />
        </div>
        {open ? (
          <div className="space-y-1.5">
            <FieldLabel>Email (optional)</FieldLabel>
            <Field
              id="email"
              value="priya.shah@gm"
              placeholder="you@email.com"
              focused
            />
            <p className="text-reading text-muted-foreground">
              Come back to this album anytime, with every photo you add.
            </p>
          </div>
        ) : (
          <GhostRow w={w} />
        )}
        <KbFoot>
          <Primary>Continue</Primary>
        </KbFoot>
      </div>
    ),
  };
}

/** The album menu's Change name: the one free door, its own X, no email. */
function edit(w: World): StepSpec {
  return {
    close: true,
    lamp: "base",
    kb: { kind: "text", enter: "go" },
    node: (
      <div data-door-step="edit" className="flex flex-col gap-4">
        <Heading
          title="Change your name"
          reason="Your new name shows on everything you have already added."
        />
        <div className="space-y-1.5">
          <FieldLabel hidden>Your name</FieldLabel>
          <Field id="name" value={PRIYA.name} focused />
          <NameHint w={w} editing />
        </div>
        <KbFoot>
          <Primary>Save name</Primary>
        </KbFoot>
      </div>
    ),
  };
}

/* ── the password, and its unlock ──────────────────────────────────────── */

/**
 * THE PASSWORD STEP, never drawn before, its words today's (`voice-guest.ask`
 * asks them). ★ LEFT, NOT CENTRED: production centres this one step's head,
 * and every other step of the door reads from the left, so here it reads the
 * way the rest do (a call carried for him to overrule).
 */
function passwordHead(w: World) {
  return (
    <div data-door-heading className="flex flex-col">
      <p className="flex items-center gap-1.5 text-label font-medium text-muted-foreground uppercase">
        <LockGlyph icons={w.icons} />
        Almost in
      </p>
      <p className="mt-1.5 font-heading text-page text-balance">
        {`${EVENT.name} is private`}
      </p>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
        The host keeps this album private for guests. Enter the password from
        your invite to come in.
      </p>
    </div>
  );
}

function PasswordField({ focused, value }: { focused: boolean; value: string }) {
  return (
    <Field
      id="password"
      value={value}
      mask
      focused={focused}
      placeholder="Password"
      trailing={
        <span
          data-door-control="eye"
          aria-hidden
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
        >
          <Eye className="size-4" />
        </span>
      }
    />
  );
}

function password(w: World): StepSpec {
  return {
    back: true,
    lamp: "base",
    kb: { kind: "text", enter: "go" },
    node: (
      <div data-door-step="password" className="flex w-full flex-col gap-4">
        {passwordHead(w)}
        <div className="w-full space-y-3">
          <PasswordField focused value="sparkle" />
          <KbFoot>
            <Primary>Unlock</Primary>
          </KbFoot>
        </div>
      </div>
    ),
  };
}

/**
 * THE UNLOCK: the gate stays planted and its button becomes the beat
 * (`password-gate.tsx`'s morph). No name exists yet on this step, so `hers`
 * has no one to name and keeps today's morph.
 */
function unlock(w: World): StepSpec {
  const lit = w.beat === "lit";
  return {
    back: false,
    lamp: "bloom",
    kb: null,
    node: (
      <div data-door-step="unlock" className="flex w-full flex-col gap-4">
        {passwordHead(w)}
        <div className="w-full space-y-3">
          <PasswordField focused={false} value="sparkle" />
          <Button
            type="button"
            size="cta"
            tabIndex={-1}
            data-door-primary
            data-door-mark={lit ? "lit" : "today"}
            className={cn(
              "w-full disabled:opacity-100",
              lit
                ? "door-bloom-button"
                : "bg-success text-success-foreground hover:bg-success",
            )}
          >
            <span data-unlock-success className="relative flex items-center gap-2">
              <Check className="size-4.5" />
              You&rsquo;re in
            </span>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Opening the album
          </p>
        </div>
      </div>
    ),
  };
}

/* ── a verification event, Create account and Log in ──────────────────── */

/** The gate's head: the Lock, "Almost in", the ticking count, his line. */
function gateHead(w: World) {
  return (
    <div data-door-heading>
      <p className="mb-1.5 flex items-center gap-1.5 text-label font-medium text-muted-foreground uppercase">
        <LockGlyph icons={w.icons} />
        {DOOR_WEAR.gate.heading}
      </p>
      {/* One string after the number (round one's measured finding: a space
          beside an expression across a line break was eaten). */}
      <p className="font-heading text-page text-balance">
        <Ticker />
        {" photos & videos are waiting"}
      </p>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
        {DOOR_WEAR.gate.reason}
      </p>
    </div>
  );
}

const CREATE = {
  title: "Create your account",
  reason:
    "Confirm your email and every photo you add here stays in your account.",
} as const;

const LOGIN = {
  title: "Log in",
  reason:
    "Use your Partyreel email, and every photo you add here joins your account.",
} as const;

/** `identify-step.tsx`'s name, riding the code request (visible label, its hint). */
function IdentifyName({ focused = false }: { focused?: boolean }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>Your name</FieldLabel>
      <Field id="name" value={PRIYA.name} focused={focused} />
      <p className="text-reading text-muted-foreground">
        If you already have a Partyreel account, its name is the one that
        shows.
      </p>
    </div>
  );
}

/** `email-sign-in.tsx`'s email item (`FormItem`: a grid, 8 px). */
function EmailItem() {
  return (
    <div className="grid gap-2">
      <FieldLabel>Email</FieldLabel>
      <Field
        id="email"
        value="priya.shah@gm"
        placeholder="you@email.com"
        focused
      />
    </div>
  );
}

function identify(w: World, verification: boolean): StepSpec {
  return {
    back: true,
    lamp: "base",
    kb: { kind: "email", enter: "send" },
    node: (
      <div
        data-door-step={verification ? "gate" : "create"}
        className="flex flex-col gap-4"
      >
        {verification ? (
          gateHead(w)
        ) : (
          <Heading title={CREATE.title} reason={CREATE.reason} />
        )}
        <div className="space-y-3">
          <IdentifyName />
          <EmailItem />
          <KbFoot>
            <Primary>Email me a code</Primary>
          </KbFoot>
        </div>
      </div>
    ),
  };
}

/**
 * LOG IN, in production's order: the email and its code first, then Google
 * and the quiet password link under the divider, which with the keyboard up
 * wait under the fold behind the sticky primary.
 */
function login(): StepSpec {
  return {
    back: true,
    lamp: "base",
    kb: { kind: "email", enter: "send" },
    node: (
      <div data-door-step="login" className="flex flex-col gap-4">
        <Heading title={LOGIN.title} reason={LOGIN.reason} />
        <div className="space-y-4">
          <div className="space-y-3">
            <EmailItem />
            <KbFoot>
              <Primary className="h-11">Email me a code</Primary>
            </KbFoot>
          </div>
          <Or />
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            tabIndex={-1}
          >
            <GoogleIcon /> Continue with Google
          </Button>
          <p className="block w-full text-center text-xs text-muted-foreground">
            Have a password? Use it instead
          </p>
        </div>
      </div>
    ),
  };
}

/* ── the code (`code`) ─────────────────────────────────────────────────── */

type Via = "gate" | "create" | "login";

/** One slot of `ui/input-otp.tsx`, drawn; the active one holds the caret. */
function Slot({
  char,
  active,
  wide,
}: {
  char?: string;
  active?: boolean;
  wide?: boolean;
}) {
  return (
    <span
      data-door-slot
      data-door-focus={active ? "" : undefined}
      className={cn(
        "relative flex items-center justify-center rounded-lg border border-input bg-transparent text-lg font-medium dark:bg-input/30",
        wide ? "h-12 min-w-0 flex-1" : "size-11",
        active && "z-10 border-ring ring-3 ring-ring/50",
      )}
    >
      {char}
      {active && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="door-caret h-5" />
        </span>
      )}
    </span>
  );
}

function Slots({ wide = false }: { wide?: boolean }) {
  const typed = CODE.typed.split("");
  return (
    <div
      data-door-otp
      className={cn("flex items-center", wide ? "w-full gap-2" : "gap-1.5")}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <Slot key={i} char={typed[i]} active={i === typed.length} wide={wide} />
      ))}
    </div>
  );
}

/**
 * The two ways out of the code screen. "Resend in 38s": the 60 s cooldown
 * `email-sign-in.tsx` starts on send, read at the moment she has typed three
 * digits, which is what production would show.
 */
function CodeLinks({ align }: { align: "center" | "left" }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 text-xs",
        align === "center" ? "justify-center" : "justify-start",
      )}
    >
      <span className="text-muted-foreground opacity-50">Resend in 38s</span>
      <span className="text-faint">&middot;</span>
      <span className="text-muted-foreground">Use a different email</span>
    </div>
  );
}

function viaHead(w: World, via: Via) {
  if (via === "gate") return gateHead(w);
  if (via === "create")
    return <Heading title={CREATE.title} reason={CREATE.reason} />;
  return <Heading title={LOGIN.title} reason={LOGIN.reason} />;
}

function code(w: World, via: Via): StepSpec {
  const sent = (
    <>
      We sent a 6-digit code to{" "}
      <span className="font-medium text-foreground">{PRIYA.email}</span>.
    </>
  );
  let node: ReactNode;
  if (w.code === "mail") {
    // The code screen takes the heading, as every other step's own: the gate
    // keeps its ruled eyebrow, since this is still the gate.
    node = (
      <div className="flex flex-col gap-4">
        <div data-door-heading>
          {via === "gate" && (
            <p className="mb-1.5 flex items-center gap-1.5 text-label font-medium text-muted-foreground uppercase">
              <LockGlyph icons={w.icons} />
              {DOOR_WEAR.gate.heading}
            </p>
          )}
          <p className="font-heading text-page text-balance">
            Check your email
          </p>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            {sent}
          </p>
        </div>
        <Slots wide />
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Or tap the link in the same email.
          </p>
          <CodeLinks align="left" />
        </div>
      </div>
    );
  } else if (w.code === "inplace") {
    // The step's own head stays (the gate's count still ticking), the fields
    // she filled stay filled, and the code arrives under the address she
    // typed, which carries its own Change in place of "Use a different email".
    node = (
      <div className="flex flex-col gap-4">
        {viaHead(w, via)}
        <div className="space-y-3">
          {via !== "login" && (
            <div className="space-y-1.5">
              <FieldLabel>Your name</FieldLabel>
              <Field id="name" value={PRIYA.name} />
            </div>
          )}
          <div className="grid gap-2">
            <FieldLabel>Email</FieldLabel>
            <Field
              id="email-sent"
              value={PRIYA.email}
              trailing={
                <span className="ml-auto shrink-0 pl-2 text-sm font-medium text-foreground">
                  Change
                </span>
              }
            />
          </div>
          <div className="grid gap-2 pt-1">
            <FieldLabel>The 6-digit code we sent to it</FieldLabel>
            <Slots wide />
          </div>
          <p className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Or tap the link in the same email.</span>
            <span className="text-faint">&middot;</span>
            <span className="opacity-50">Resend in 38s</span>
          </p>
        </div>
      </div>
    );
  } else {
    // Today: the step's head stays, and `EmailSignIn`'s code view replaces the
    // form under it, small and centred, its last line still saying "sign in".
    node = (
      <div className="flex flex-col gap-4">
        {viaHead(w, via)}
        <div data-door-otp-entry className="space-y-4 text-center">
          <div className="space-y-1">
            <p className="text-sm font-medium">Enter your code</p>
            <p className="text-sm text-muted-foreground">{sent}</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Slots />
          </div>
          <p className="text-xs text-muted-foreground">
            Or tap the link in the same email to sign in.
          </p>
          <CodeLinks align="center" />
        </div>
      </div>
    );
  }
  return {
    back: true,
    lamp: "bright",
    kb: { kind: "digits", enter: "" },
    node: <div data-door-step={`code-${via}`}>{node}</div>,
  };
}

/* ── the upload step, and the demo's ──────────────────────────────────── */

function upload(demoRun: boolean): StepSpec {
  return {
    back: true,
    lamp: "base",
    kb: null,
    node: (
      <div data-door-step={demoRun ? "demo-upload" : "upload"} className="flex flex-col gap-4 pt-1">
        <Heading
          title="Add your photos"
          reason={
            demoRun
              ? "Add a photo the way a guest would. Nothing you add is saved."
              : "Add one now, or look around first."
          }
        />
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="cta"
            tabIndex={-1}
            data-door-primary
            className="w-full justify-start"
          >
            <Camera /> Take a photo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="cta"
            tabIndex={-1}
            className="w-full justify-start"
          >
            <Images /> Choose from your album
          </Button>
          <p className="pt-1 text-center text-reading text-muted-foreground">
            Photos and videos, up to 10 GB each.
          </p>
          <Button
            type="button"
            variant="ghost"
            tabIndex={-1}
            className="w-full text-muted-foreground"
          >
            {demoRun ? "Look around" : "Skip for now"}
          </Button>
        </div>
      </div>
    ),
  };
}

/* ── the keep screen, the door's new last (`guest-door` is building it) ── */

/**
 * THE KEEP SCREEN: guest-capture's `OfferSheet`, the pick `guest-door` is
 * building as the door's last screen, drawn in lit. Its head is a beat
 * (`beat` moves its mark); the ask under it is `voice-guest.keep`'s, so its
 * words are today's.
 */
function keep(w: World): StepSpec {
  return {
    lamp: "bloom",
    kb: null,
    node: (
      <div data-door-step="keep" className="flex flex-col gap-5">
        <div data-door-sent className="flex items-center gap-3">
          <SentMark beat={w.beat} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="font-heading text-card-title font-medium text-foreground">
              Sent
            </p>
            <p className="text-sm text-muted-foreground">
              {`Your photo joined ${EVENT.host}’s album.`}
            </p>
          </div>
        </div>
        <div className="pb-2 text-center">
          <p className="font-heading text-subsection">Keep this photo</p>
          <p className="mx-auto mt-1 max-w-xs text-reading text-muted-foreground">
            Confirm your email and it stays with you: this event in your
            account, and everything you added to it.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Primary>Confirm your email</Primary>
          <p className="text-center text-xs text-muted-foreground">
            Maybe later
          </p>
        </div>
      </div>
    ),
  };
}

/* ── the beat, and the stall ──────────────────────────────────────────── */

function inBeat(w: World): StepSpec {
  return {
    lamp: "bloom",
    kb: null,
    node: (
      <div
        data-door-step="in"
        className="flex flex-col items-center gap-4 py-8 text-center"
      >
        <InMark beat={w.beat} />
        <div>
          <p data-door-beat-words className="font-heading text-page">
            {w.beat === "hers"
              ? `You’re in, ${PRIYA.name}`
              : "You’re in"}
          </p>
          <p className="mt-1 text-base text-muted-foreground">
            Welcome to the party
          </p>
        </div>
      </div>
    ),
  };
}

/** The stall, never drawn before: `SuccessStep`'s own words when the refresh hangs. */
function stalled(): StepSpec {
  return {
    lamp: "base",
    kb: null,
    node: (
      <div
        data-door-step="stalled"
        className="flex flex-col items-center gap-4 py-6 text-center"
      >
        <p className="font-heading text-page text-balance">
          That took longer than it should
        </p>
        <p className="max-w-xs text-base leading-relaxed text-muted-foreground">
          You&rsquo;re unlocked, the album just didn&rsquo;t open. Give it one
          more tap.
        </p>
        <Primary>Open the album</Primary>
      </div>
    ),
  };
}

/* ── the change sheet (`add-email-dialog.tsx`, change mode) ───────────── */

function change(): StepSpec {
  return {
    close: true,
    pad: "sheet",
    lamp: "base",
    kb: { kind: "email", enter: "done" },
    node: (
      <div data-door-step="change">
        <div className="flex flex-col gap-0.5 p-4">
          <p className="font-heading text-card-title font-medium text-foreground">
            Change your email
          </p>
          <p className="text-sm text-muted-foreground">
            The new address replaces the one you added. Nothing is sent to it
            until you confirm it.
          </p>
        </div>
        <div className="flex flex-col gap-4 px-4">
          <div className="space-y-1.5">
            <FieldLabel hidden>Email</FieldLabel>
            <Field
              id="email"
              value="priya@shah.stu"
              placeholder="Your new email"
              focused
            />
          </div>
          <KbFoot>
            <Primary>Save</Primary>
          </KbFoot>
        </div>
        <div className="flex flex-col items-center gap-1.5 px-4 pb-6 text-center">
          <p className="text-reading text-destructive">Remove this email</p>
          <p className="text-xs text-muted-foreground">
            Your photos stay. Only the email you added is removed.
          </p>
        </div>
      </div>
    ),
  };
}

/* ── the table ─────────────────────────────────────────────────────────── */

export function stepSpec(
  step: DoorStep,
  w: World,
  size: "phone" | "desk",
): StepSpec {
  const desk = size === "desk";
  switch (step) {
    case "welcome":
      return welcome(w, desk);
    case "demo":
      return demo(w, desk);
    case "chooser":
      return chooser(w);
    case "name":
      return nameStep(w, false);
    case "name-email":
      return nameStep(w, true);
    case "edit":
      return edit(w);
    case "password":
      return password(w);
    case "unlock":
      return unlock(w);
    case "gate":
      return identify(w, true);
    case "create":
      return identify(w, false);
    case "login":
      return login();
    case "code-gate":
      return code(w, "gate");
    case "code-create":
      return code(w, "create");
    case "code-login":
      return code(w, "login");
    case "upload":
      return upload(false);
    case "demo-upload":
      return upload(true);
    case "keep":
      return keep(w);
    case "in":
      return inBeat(w);
    case "stalled":
      return stalled();
    case "change":
      return change();
  }
}

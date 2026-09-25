"use client";

import type { ReactNode } from "react";
import {
  Camera,
  Check,
  ChevronLeft,
  Images,
  Lock,
  LogIn,
  Mail,
  MailCheck,
  Pencil,
  X,
} from "lucide-react";

import { DOOR_WEAR } from "@/components/auth/account-door";
import { GoogleIcon } from "@/components/auth/google-icon";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { UNVERIFIED_LABEL } from "@/components/shared/unverified-mark";
import { Button } from "@/components/ui/button";
import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

import { CODE, EVENT, HOST, PRIYA } from "./fixtures";
import { HostAvatar } from "./ground";

/**
 * THE DOOR'S STEPS, DRAWN AS GROUND: the same in every direction.
 *
 * His flow is settled (round one, his notes, the Orchestrator's three): the
 * welcome alone, then on a name-only event the chooser, the name with the email
 * as a one-line ghost tap, or on a verification event one screen of name and
 * email under the gate's one line, then the code; Create account reuses that
 * screen and Log in asks only the email; the "You're in" beat; and her menu,
 * her name over "Unverified" above the card he wrote. So nothing in this file
 * is a question: the words are production's (the welcome's at today's text,
 * `voice-guest.welcome` owns them; the gate's line verbatim from `DOOR_WEAR`),
 * and every direction on `look` dresses these same bodies through the slots.
 *
 * ★ QUOTED, NEVER MOUNTED. `AccountDoor`, `EmailSignIn`, `GuestNameStep` and the
 * name menu's `DropdownMenu` all reach a session, a server action or a portal,
 * so their markup is copied here onto inert elements: every control is
 * `tabIndex={-1}` with no handler, and a focused field is DRAWN focused (the
 * input's own focus ring and a caret), because a lab frame can hold only one
 * real focus and the keyboard frames need theirs visible.
 */

export type StepParts = {
  body: ReactNode;
  /** The primary action: pinned at the sheet's foot when the keyboard is up. */
  foot?: ReactNode;
  /** The back chevron (every step but the welcome and the beat). */
  back?: boolean;
  /** The sheet is a free one with its own close (the change sheet). */
  close?: boolean;
};

/** What a direction may dress (see `looks.tsx`). */
export type Slots = {
  welcomeHero?: ReactNode;
  /** The album's live count, wherever a step says it. */
  count?: ReactNode;
  inBeat?: ReactNode;
  cardHeader?: ReactNode;
  cardDecor?: ReactNode;
  cardClassName?: string;
};

/* ── the furniture ─────────────────────────────────────────────────────── */

const FIELD =
  "flex h-11 w-full min-w-0 items-center rounded-lg border border-input bg-transparent px-2.5 text-base dark:bg-input/30";
const FOCUSED = "border-ring ring-3 ring-ring/50";

/**
 * A field, drawn: the Input's own classes (`ui/input.tsx`), its focus ring when
 * `focused`, and a caret that blinks in CSS (steady under reduced motion).
 */
export function Field({
  id,
  value,
  placeholder,
  focused = false,
  label,
  labelHidden = false,
  hint,
}: {
  id: string;
  value?: string;
  placeholder?: string;
  focused?: boolean;
  label: string;
  labelHidden?: boolean;
  hint?: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p
        className={cn(
          "text-sm leading-none font-medium select-none",
          labelHidden && "sr-only",
        )}
      >
        {label}
      </p>
      <div
        data-door-field={id}
        data-door-focus={focused ? "" : undefined}
        className={cn(FIELD, focused && FOCUSED)}
      >
        {value ? (
          <span className="truncate text-foreground">{value}</span>
        ) : (
          !focused && (
            <span className="truncate text-muted-foreground">
              {placeholder}
            </span>
          )
        )}
        {focused && <span aria-hidden data-door-caret className="door-caret" />}
        {focused && !value && (
          <span className="truncate text-muted-foreground">{placeholder}</span>
        )}
      </div>
      {hint}
    </div>
  );
}

function Heading({ title, reason }: { title: string; reason?: ReactNode }) {
  return (
    <div>
      <p className="font-heading text-page text-balance">{title}</p>
      {reason && (
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          {reason}
        </p>
      )}
    </div>
  );
}

function Primary({ children }: { children: ReactNode }) {
  return (
    <Button
      type="button"
      size="cta"
      className="w-full"
      tabIndex={-1}
      data-door-primary
    >
      {children}
    </Button>
  );
}

/** The chevron, quoted from `entry-modal.tsx` (its own size-9 hit area). */
export function BackChevron() {
  return (
    <span
      aria-hidden
      className="-ml-2 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground"
    >
      <ChevronLeft className="size-5" />
    </span>
  );
}

/** A free sheet's own close, quoted from `ui/sheet.tsx`. */
export function CloseMark() {
  return (
    <span
      aria-hidden
      className="-mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground"
    >
      <X className="size-4" />
    </span>
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

/* ── the welcome ───────────────────────────────────────────────────────── */

/** Today's eyebrow, name and byline (`entry-modal.tsx`'s `WelcomeStep`). */
export function WelcomeHero() {
  return (
    <div className="flex flex-col">
      <p className="text-label font-medium text-muted-foreground uppercase">
        You&rsquo;re invited to
      </p>
      <p className="mt-1.5 font-heading text-page text-balance">{EVENT.name}</p>
      <Byline />
    </div>
  );
}

export function Byline({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "mt-2 flex items-center gap-1.5 text-working text-muted-foreground",
        className,
      )}
    >
      <HostAvatar />
      <span>
        Hosted by{" "}
        <span className="font-medium text-foreground">{HOST.name}</span>
      </span>
      <span aria-hidden className="text-faint">
        ·
      </span>
      <span>{EVENT.date}</span>
    </p>
  );
}

/** The welcome's two rows, at today's words; `count` is the one live number. */
export function WelcomeRows({ count }: { count?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5">
      <p className="flex items-start gap-3 text-base leading-relaxed">
        <Camera
          className="mt-0.5 size-4.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        Add your photos and videos in seconds. No app required.
      </p>
      <p className="flex items-start gap-3 text-base leading-relaxed">
        <Images
          className="mt-0.5 size-4.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span>
          {"Everyone\u2019s shots land in one album. "}
          {count ?? EVENT.approvedTotal}
          {" are already inside."}
        </span>
      </p>
    </div>
  );
}

function welcome(slots: Slots): StepParts {
  return {
    body: (
      <div data-door-step="welcome" className="flex flex-col gap-5">
        {slots.welcomeHero ?? <WelcomeHero />}
        <WelcomeRows count={slots.count} />
      </div>
    ),
    foot: (
      <div className="flex flex-col">
        <Primary>Continue</Primary>
        <LegalConsentLine newTab className="mt-3 text-center" />
      </div>
    ),
  };
}

/* ── his chooser, on a name-only event ─────────────────────────────────── */

function chooser(): StepParts {
  return {
    back: true,
    body: (
      <div data-door-step="chooser">
        <Heading title="How would you like to join?" />
      </div>
    ),
    foot: (
      <div className="flex flex-col gap-2.5">
        <Primary>Continue as guest</Primary>
        <Button
          type="button"
          size="cta"
          variant="outline"
          className="w-full"
          tabIndex={-1}
        >
          Create account
        </Button>
        <Button
          type="button"
          size="cta"
          variant="ghost"
          className="w-full"
          tabIndex={-1}
        >
          Log in
        </Button>
      </div>
    ),
  };
}

/* ── the name, with the email as a ghost tap ───────────────────────────── */

/**
 * THE GHOST TAP (his `field=ghost`, and his note: the line broke to two, it
 * should hold one, smaller for subtlety, and "could use more polish anyway").
 * A full-width row, 44 px tall, at `text-working`, that says the same thing it
 * always did and never wraps: "anytime" rides a container query and steps
 * aside when the row is too narrow for it (a 320 phone), so the line is one
 * line at every width. The 320 probe in the name frame proves it on screen.
 *
 * ★ THE QUERY IS IN `identity-door.css`, NOT A TAILWIND VARIANT. A board's own
 * utilities compile into the lab's sublayer, and a sublayer loses to its parent
 * layer, so `hidden` from production's utilities beat `@min-[16rem]:inline`
 * here whatever the row's width (measured in the frame: the rule was present
 * and never won). Unlayered CSS has no such race.
 */
export function GhostTap() {
  return (
    <span
      data-door-ghost
      className="door-ghost flex min-h-11 w-full items-center gap-2.5 rounded-lg bg-muted/60 px-3 text-working text-muted-foreground ring-1 ring-foreground/5 ring-inset"
    >
      <Mail className="size-4 shrink-0" aria-hidden />
      <span data-door-ghost-line className="min-w-0 whitespace-nowrap">
        Add an email to come back
        <span className="door-ghost-more"> anytime</span>
      </span>
    </span>
  );
}

function nameStep(open: boolean): StepParts {
  return {
    back: true,
    body: (
      <div
        data-door-step={open ? "name-email" : "name"}
        className="flex flex-col gap-4"
      >
        <Heading
          title="What should we call you?"
          reason="Your name goes on the photos you add, so the host knows who to thank."
        />
        <Field
          id="name"
          label="Your name"
          labelHidden
          value={PRIYA.name}
          focused={!open}
          hint={
            <p className="text-reading text-muted-foreground">
              Just a name. Nobody has to prove a name.
            </p>
          }
        />
        {open ? (
          <Field
            id="email"
            label="Email (optional)"
            value="priya.shah@gm"
            focused
            hint={
              <p className="text-reading text-muted-foreground">
                Come back to this album anytime, with every photo you add.
              </p>
            }
          />
        ) : (
          <GhostTap />
        )}
      </div>
    ),
    foot: <Primary>Continue</Primary>,
  };
}

/* ── a verification event: name and email under the gate's one line ──── */

function gate(slots: Slots): StepParts {
  return {
    back: true,
    body: (
      <div data-door-step="gate" className="flex flex-col gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-label font-medium text-muted-foreground uppercase">
            <Lock className="size-3" aria-hidden />
            {DOOR_WEAR.gate.heading}
          </p>
          {/* One string after the number, never text split across a line
              break beside an expression (round one's measured finding: the
              space between them was eaten). */}
          <p className="mt-1.5 font-heading text-page text-balance">
            {slots.count ?? EVENT.approvedTotal}
            {" photos & videos are waiting"}
          </p>
          <p
            data-door-gate-line
            className="mt-2 text-base leading-relaxed text-muted-foreground"
          >
            {DOOR_WEAR.gate.reason}
          </p>
        </div>
        <Field id="name" label="Your name" labelHidden value={PRIYA.name} />
        <Field id="email" label="Email" value={PRIYA.email} focused />
      </div>
    ),
    foot: <Primary>Email me a code</Primary>,
  };
}

/* ── the code ──────────────────────────────────────────────────────────── */

function Slot({ char, active }: { char?: string; active?: boolean }) {
  return (
    <span
      data-door-focus={active ? "" : undefined}
      className={cn(
        "relative flex size-11 items-center justify-center rounded-lg border border-input text-lg font-medium dark:bg-input/30",
        active && FOCUSED,
      )}
    >
      {char}
      {active && <span aria-hidden className="door-caret" />}
    </span>
  );
}

function code(): StepParts {
  const typed = CODE.typed.split("");
  return {
    back: true,
    body: (
      <div data-door-step="code" className="flex flex-col gap-4">
        <Heading
          title="Enter your code"
          reason={
            <>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{PRIYA.email}</span>
              .
            </>
          }
        />
        <div data-door-otp className="flex items-center gap-1.5">
          {Array.from({ length: 6 }, (_, i) => (
            <Slot key={i} char={typed[i]} active={i === typed.length} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Or tap the link in the same email to sign in.
        </p>
      </div>
    ),
    // No button: the sixth digit submits the code (`EmailSignIn`), so the
    // foot holds the two ways out the code screen has always offered.
    foot: (
      <p className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
        <span>Resend code</span>
        <span className="text-faint">·</span>
        <span>Use a different email</span>
      </p>
    ),
  };
}

/* ── Log in and Create account (his chooser's other two doors) ─────────── */

function login(): StepParts {
  return {
    back: true,
    body: (
      <div data-door-step="login" className="flex flex-col gap-4">
        <Heading
          title="Log in"
          reason="Already on Partyreel? Log in and the photos you add here join everything else you have added."
        />
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          tabIndex={-1}
        >
          <GoogleIcon /> Continue with Google
        </Button>
        <Or />
        <Field id="email" label="Email" value="priya.shah@gm" focused />
        <p className="text-center text-xs text-muted-foreground">
          Have a password? Use it instead
        </p>
      </div>
    ),
    foot: <Primary>Email me a code</Primary>,
  };
}

function create(): StepParts {
  return {
    back: true,
    body: (
      <div data-door-step="create" className="flex flex-col gap-4">
        <Heading title="Create account" reason={DOOR_WEAR.keep.reason} />
        <Field id="name" label="Your name" labelHidden value={PRIYA.name} />
        <Field id="email" label="Email" value="priya.shah@gm" focused />
      </div>
    ),
    foot: <Primary>Email me a code</Primary>,
  };
}

/* ── the beat ──────────────────────────────────────────────────────────── */

export function InBeat({ mark }: { mark?: ReactNode }) {
  return (
    <div
      data-door-step="in"
      className="flex flex-col items-center gap-4 py-8 text-center"
    >
      {mark ?? (
        <div className="flex size-14 items-center justify-center rounded-full bg-success text-success-foreground">
          <Check className="size-7" />
        </div>
      )}
      <div>
        <p className="font-heading text-page">You&rsquo;re in</p>
        <p className="mt-1 text-base text-muted-foreground">
          Welcome to the party
        </p>
      </div>
    </div>
  );
}

/* ── the change-or-remove sheet ────────────────────────────────────────── */

function change(): StepParts {
  return {
    close: true,
    body: (
      <div data-door-step="change" className="flex flex-col gap-4">
        <Heading
          title="Change your email"
          reason="It isn't confirmed yet, so nothing has been sent to it."
        />
        <Field
          id="email"
          label="New email"
          placeholder="you@email.com"
          focused
        />
        <p className="text-sm text-destructive">Remove it instead</p>
      </div>
    ),
    foot: <Primary>Change email</Primary>,
  };
}

export type DoorStep =
  | "welcome"
  | "chooser"
  | "name"
  | "name-email"
  | "gate"
  | "code"
  | "login"
  | "create"
  | "in"
  | "change";

export function stepParts(step: DoorStep, slots: Slots): StepParts {
  switch (step) {
    case "welcome":
      return welcome(slots);
    case "chooser":
      return chooser();
    case "name":
      return nameStep(false);
    case "name-email":
      return nameStep(true);
    case "gate":
      return gate(slots);
    case "code":
      return code();
    case "login":
      return login();
    case "create":
      return create();
    case "in":
      return { body: slots.inBeat ?? <InBeat /> };
    case "change":
      return change();
  }
}

/** Which keyboard a step raises, if any (the name field says "go"). */
export function keyboardFor(
  step: DoorStep,
): { kind: "text" | "email" | "digits"; enter: string } | null {
  switch (step) {
    case "name":
      return { kind: "text", enter: "go" };
    case "name-email":
    case "gate":
    case "login":
    case "create":
    case "change":
      return { kind: "email", enter: "go" };
    case "code":
      return { kind: "digits", enter: "" };
    default:
      return null;
  }
}

/* ── her menu, with the card he wrote ──────────────────────────────────── */

function MenuRow({
  icon: Icon,
  children,
}: {
  icon: typeof Pencil;
  children: ReactNode;
}) {
  return (
    <div
      data-door-menu-row
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 text-sm text-foreground",
        floatingRow,
      )}
    >
      <Icon className="size-4 text-muted-foreground" aria-hidden />
      {children}
    </div>
  );
}

/**
 * THE MENU, OPEN, as `guest-name-menu.tsx` would draw it amended by his
 * `menu=card` note: her name over one "Unverified" (or "Email not confirmed"
 * once this device put an address on her row), then a card reading "Save this
 * event for later" with its one action, then Change name and Log in (the Sign
 * in row renamed, a call he may overrule). Anchored under the header's trigger.
 */
export function NameMenu({
  emailed,
  slots,
  wide = false,
}: {
  emailed: boolean;
  slots: Slots;
  wide?: boolean;
}) {
  return (
    <div
      data-door-menu
      className={cn(
        "absolute top-14 right-3 z-50 p-1",
        wide ? "w-72" : "w-64",
        floatingPanel,
      )}
    >
      <div className="flex flex-col gap-0.5 px-2 pt-1 pb-1.5">
        <span className="truncate text-sm leading-tight font-medium">
          {PRIYA.name}
        </span>
        <span
          data-door-status
          className="truncate text-xs leading-tight text-muted-foreground"
        >
          {emailed ? "Email not confirmed" : UNVERIFIED_LABEL}
        </span>
      </div>
      <div
        data-door-card
        className={cn(
          "relative isolate m-1 overflow-hidden rounded-lg bg-muted/60 p-3",
          slots.cardClassName,
        )}
      >
        {slots.cardHeader}
        <div className="relative z-10 flex items-center gap-3">
          {slots.cardDecor}
          <p className="min-w-0 text-sm leading-snug font-medium text-pretty text-foreground">
            Save this event for later
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="relative z-10 mt-2.5 w-full"
          tabIndex={-1}
          data-door-card-action
        >
          {emailed ? <MailCheck /> : <Mail />}
          {emailed ? "Confirm your email" : "Add your email"}
        </Button>
        {emailed && (
          <p className="relative z-10 mt-2 text-center text-xs text-muted-foreground underline-offset-4">
            Change or remove it
          </p>
        )}
      </div>
      <MenuRow icon={Pencil}>Change name</MenuRow>
      <div className="-mx-1 my-1 h-px bg-border" />
      <MenuRow icon={LogIn}>Log in</MenuRow>
    </div>
  );
}

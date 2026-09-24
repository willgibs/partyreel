"use client";

import { type ReactNode, useState } from "react";
import {
  ArrowDown,
  Camera,
  Check,
  ChevronLeft,
  Images,
  type LucideIcon,
  Lock,
  LogIn,
  Mail,
  MailCheck,
  MailX,
  Pencil,
} from "lucide-react";

import { GoogleIcon } from "@/components/auth/google-icon";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/profile";
import { MAX_GUEST_EMAIL_LENGTH } from "@/lib/validation/upload";
import { cn } from "@/lib/utils";

import { EVENT, HOST, PRIYA } from "./fixtures";

/**
 * THE PIECES EACH DECISION DRAWS, IN PARTS, SO ONLY ONE OF THEM MOVES.
 *
 * ★ NOTHING HERE CALLS A SERVER FUNCTION, READS A SESSION OR MOUNTS A RADIX
 * PORTAL (`scene.tsx`'s own note; `guest-capture/parts.tsx`'s precedent).
 * `AccountDoor`, `EmailSignIn`, the guest menu's `DropdownMenu` and its
 * confirm `Dialog` are QUOTED here: the real classes and the real shipped
 * copy, held on plain local state, never the mounted primitive. Every
 * control that looks pressable but leads nowhere real (a submit, a Google
 * button, a menu row this board is not about) carries `tabIndex={-1}` and no
 * handler, so a stray tap in review does nothing rather than nothing
 * visible.
 */

const QUIET_LINK =
  "text-reading text-muted-foreground underline-offset-4 hover:underline";

/* ── the name step's own furniture, quoted from guest-name-step.tsx ──────── */

/** The step's two-sentence heading: visible for the eye, exactly as the real
 *  step renders it (there it is also the sheet's sr-only name; a lab frame
 *  has no sheet chrome of its own to name, so it is just the visible pair). */
function StepHeading({ title, reason }: { title: string; reason: string }) {
  return (
    <div aria-hidden>
      <p className="font-heading text-page text-balance">{title}</p>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
        {reason}
      </p>
    </div>
  );
}

const NAME_HEADING = {
  title: "What should we call you?",
  reason: "Your name goes on the photos you add, so the host knows who to thank.",
};

function NameField() {
  const [value, setValue] = useState<string>(PRIYA.name);
  return (
    <div className="space-y-1.5">
      <Label htmlFor="id-door-name" className="sr-only">
        Your name
      </Label>
      <Input
        id="id-door-name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Your name"
        maxLength={DISPLAY_NAME_MAX_LENGTH}
        className="h-11 text-base"
      />
      <p className="text-reading text-muted-foreground">
        Just a name. Nobody has to prove a name.
      </p>
    </div>
  );
}

function EmailField({ autoFocus = false }: { autoFocus?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <div className="space-y-1.5">
      <Label htmlFor="id-door-email">Email (optional)</Label>
      <Input
        id="id-door-email"
        type="email"
        inputMode="email"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="you@email.com"
        maxLength={MAX_GUEST_EMAIL_LENGTH}
        autoFocus={autoFocus}
        className="h-11 text-base"
      />
      <p className="text-reading text-muted-foreground">
        Come back to this album anytime, with every photo you add.
      </p>
    </div>
  );
}

/* ── `walk`: whether the welcome deserves its own screen at all ──────────── */

/** The welcome's own two lines, exactly as `entry-modal.tsx`'s `WelcomeStep`
 *  reads them (no sign-in row: `nudge`'s own question, held at nowhere for
 *  this ask). Shared by `walk`'s `separate` and `combined`: the words never
 *  change, only what stands beside them. */
function WelcomeLines() {
  return (
    <div data-id-welcome-lines className="flex flex-col">
      <p className="text-label font-medium text-muted-foreground uppercase">
        You&rsquo;re invited to
      </p>
      <p className="mt-1.5 font-heading text-page text-balance">
        {EVENT.name}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-working text-muted-foreground">
        <Avatar seed={HOST.seed} size="sm">
          <AvatarFallback className="text-[10px]">
            {HOST.displayName.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <span>
          Hosted by{" "}
          <span className="font-medium text-foreground">
            {HOST.displayName}
          </span>
        </span>
        <span aria-hidden className="text-faint">
          ·
        </span>
        <span>{EVENT.date}</span>
      </p>
    </div>
  );
}

function WelcomeBenefits() {
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
        {`Everyone's shots land in one album. ${EVENT.approvedTotal} are already inside.`}
      </p>
    </div>
  );
}

/** As shipped: the welcome stands alone, once; Continue reveals the name step
 *  (held behind this frame, `field`'s and `nudge`'s own territory). */
export function WalkSeparate() {
  return (
    <div data-id-walk="separate" className="flex flex-col gap-5">
      <WelcomeLines />
      <WelcomeBenefits />
      <div className="mt-auto flex flex-col gap-1">
        <Button type="button" size="cta" className="w-full" tabIndex={-1}>
          Continue
        </Button>
        <LegalConsentLine newTab className="mt-2 text-center" />
      </div>
    </div>
  );
}

/** The same two lines, now sitting above the name field itself: one screen,
 *  one Continue, on a first visit alone (a returning device already skips to
 *  the plain name step today, unchanged either way). */
export function WalkCombined() {
  return (
    <div data-id-walk="combined" className="flex flex-col gap-5">
      <WelcomeLines />
      <WelcomeBenefits />
      <div className="flex flex-col gap-4 border-t border-border/60 pt-4">
        <NameField />
        <EmailField />
        <Button type="button" size="cta" className="w-full" tabIndex={-1}>
          Continue
        </Button>
      </div>
    </div>
  );
}

/* ── `field`: how the optional email sits against the name ───────────────── */

/** As shipped: both fields open together, one Continue for both. */
export function FieldShown() {
  return (
    <div data-id-field="shown" className="flex flex-col gap-4">
      <StepHeading {...NAME_HEADING} />
      <NameField />
      <EmailField />
      <Button type="button" size="cta" className="w-full" tabIndex={-1}>
        Continue
      </Button>
    </div>
  );
}

/** A quiet line stands where the field would be; a tap swaps it for the real
 *  input (real local state: reviewed live, though the automated capture
 *  always meets the closed state, which is the one the decision is about). */
export function FieldGhost() {
  const [open, setOpen] = useState(false);
  return (
    <div data-id-field="ghost" className="flex flex-col gap-4">
      <StepHeading {...NAME_HEADING} />
      <NameField />
      {open ? (
        <EmailField autoFocus />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 text-left text-reading text-muted-foreground transition-colors duration-150 ease-emphasis hover:border-foreground/30 hover:text-foreground"
        >
          <Mail className="size-4 shrink-0" aria-hidden />
          Add an email to come back anytime
        </button>
      )}
      <Button type="button" size="cta" className="w-full" tabIndex={-1}>
        Continue
      </Button>
    </div>
  );
}

/** The email becomes the sheet's OWN next screen: the name step's Continue
 *  lands here instead of the album, with a chevron back and a Skip beside
 *  the primary (the upload step's own "Skip for now" vocabulary, reused). */
export function FieldStep() {
  return (
    <div data-id-field="step" className="flex flex-col gap-4">
      <button
        type="button"
        tabIndex={-1}
        className="-ml-1 flex items-center gap-1 self-start text-reading text-muted-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden /> Back to your name
      </button>
      <StepHeading
        title="One more thing"
        reason="Totally optional, and it only takes a second."
      />
      <EmailField autoFocus />
      <div className="flex flex-col items-center gap-2">
        <Button type="button" size="cta" className="w-full" tabIndex={-1}>
          Continue
        </Button>
        <button type="button" className={QUIET_LINK} tabIndex={-1}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

/* ── `nudge`: the sign-in path for a member at a names-mode door ─────────── */

/** The exact sentence, wherever it stands: only its PLACE is the decision. */
function SignInSentence() {
  return (
    <>
      Already on Partyreel?{" "}
      <span className="font-medium text-foreground underline underline-offset-4">
        Sign in
      </span>{" "}
      and your photos go with it
    </>
  );
}

/** A quiet link under the field, field held at today's shape (both shown). */
export function NudgeUnderField() {
  return (
    <div data-id-nudge="underfield" className="flex flex-col gap-4">
      <StepHeading {...NAME_HEADING} />
      <NameField />
      <EmailField />
      <button type="button" className={cn(QUIET_LINK, "text-center")} tabIndex={-1}>
        <SignInSentence />
      </button>
      <Button type="button" size="cta" className="w-full" tabIndex={-1}>
        Continue
      </Button>
    </div>
  );
}

/** The welcome step, quoted from entry-modal.tsx's WelcomeStep, with the same
 *  sentence added as a third row beside the two benefit lines. */
export function NudgeWelcome() {
  return (
    <div data-id-nudge="welcome" className="flex flex-col gap-5">
      <div className="flex flex-col">
        <p className="text-label font-medium text-muted-foreground uppercase">
          You&rsquo;re invited to
        </p>
        <p className="mt-1.5 font-heading text-page text-balance">
          {EVENT.name}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-working text-muted-foreground">
          <Avatar seed={HOST.seed} size="sm">
            <AvatarFallback className="text-[10px]">
              {HOST.displayName.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <span>
            Hosted by{" "}
            <span className="font-medium text-foreground">
              {HOST.displayName}
            </span>
          </span>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <span>{EVENT.date}</span>
        </p>
      </div>
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
          {`Everyone's shots land in one album. ${EVENT.approvedTotal} are already inside.`}
        </p>
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <LogIn
            className="mt-0.5 size-4.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span>
            <SignInSentence />
          </span>
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-1">
        <Button type="button" size="cta" className="w-full" tabIndex={-1}>
          Continue
        </Button>
        <LegalConsentLine newTab className="mt-2 text-center" />
      </div>
    </div>
  );
}

/** Nothing new on the door; a quiet reminder of where Sign in already lives,
 *  so the option is drawn honestly rather than left blank. */
export function NudgeNone() {
  return (
    <div data-id-nudge="none" className="flex flex-col gap-4">
      <StepHeading {...NAME_HEADING} />
      <NameField />
      <EmailField />
      <Button type="button" size="cta" className="w-full" tabIndex={-1}>
        Continue
      </Button>
      <div
        data-id-nudge-note
        className="flex items-center gap-2 self-center rounded-full border border-border bg-muted/60 px-3 py-1.5 text-[11px] text-muted-foreground"
      >
        <LogIn className="size-3" aria-hidden />
        Sign in already lives in the guest menu, once she is inside
      </div>
    </div>
  );
}

/* ── `gate`: the verified-required screen's benefit framing ──────────────── */

/** Quoted, inert: the same email-lead layout `AccountDoor` draws, on no
 *  network and no session (`account-door.tsx`'s real copy, none of its
 *  wiring). Every control is `tabIndex={-1}` with no handler. */
function QuotedGateDoor() {
  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-3 text-left">
      <div className="space-y-1.5">
        <Label htmlFor="id-gate-email" className="sr-only">
          Email
        </Label>
        <Input
          id="id-gate-email"
          type="email"
          placeholder="you@email.com"
          readOnly
          className="h-11 text-base"
        />
      </div>
      <Button type="button" size="cta" className="w-full" tabIndex={-1}>
        Continue
      </Button>
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>
      <Button type="button" variant="outline" className="w-full" tabIndex={-1}>
        <GoogleIcon /> Continue with Google
      </Button>
      <LegalConsentLine newTab className="pt-1 text-center" />
    </div>
  );
}

/** The verified-required gate, imagining Maya's own wedding with Require
 *  verified emails on: the shipped reason line never moves, only the
 *  eyebrow's identity and whether two guest benefits follow it. */
export function GateBody({
  variant,
}: {
  variant: "line" | "list" | "eyebrow";
}) {
  return (
    <div data-id-gate={variant} className="text-center">
      <p className="flex items-center justify-center gap-1.5 text-label font-medium text-muted-foreground uppercase">
        {variant === "eyebrow" ? (
          <>
            <Avatar seed={HOST.seed} size="sm">
              <AvatarFallback className="text-[10px]">
                {HOST.displayName.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            {HOST.displayName}&rsquo;s event
          </>
        ) : (
          <>
            <Lock className="size-3" aria-hidden /> Almost in
          </>
        )}
      </p>
      {/* ★ ONE STRING, NOT AN EXPRESSION BESIDE TEXT (the real gate's own
          precedent, enter-event-prompt.tsx): a `{number} word` split across
          two JSX children can lose the space between them when the text
          child spans a line break before its closing tag, confirmed here by
          reading the rendered DOM (measured, never assumed). A template
          literal is one child, so there is nothing for a line break to eat. */}
      <p className="mt-1.5 font-heading text-page text-balance">
        {`${EVENT.approvedTotal} photos & videos are waiting`}
      </p>
      <p className="mx-auto mt-2 max-w-xs text-base leading-relaxed text-muted-foreground">
        The host has asked guests to confirm an email for safety. One tap and
        you&rsquo;re in.
      </p>
      {variant === "list" && (
        <ul className="mx-auto mt-3 max-w-xs space-y-1.5 text-left text-reading text-muted-foreground">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Every
            photo you add from here stays in your account
          </li>
        </ul>
      )}
      <div className="mt-5 mb-5">
        <QuotedGateDoor />
      </div>
    </div>
  );
}

/* ── `menu` and `remove`: the guest menu, quoted from guest-name-menu.tsx ─── */

function MenuRow({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div
      data-id-menu-row
      className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-reading text-foreground"
    >
      <Icon className="size-4 text-muted-foreground" aria-hidden />
      {children}
    </div>
  );
}

/**
 * THE DROPDOWN, QUOTED, positioned as it would open under the header's
 * trigger. `remove` is undefined for the `menu` ask's own three shapes;
 * `"menu-row"` is the `remove` ask's first option, drawn on the SAME shape
 * (`rows`, `menu`'s own shipped and recommended shape held steady).
 */
export function QuotedNameMenu({
  variant,
  emailAttached,
  remove,
}: {
  variant: "rows" | "card" | "sheet";
  emailAttached: boolean;
  remove?: "menu-row" | "nowhere";
}) {
  const statusLabel = emailAttached ? "Email not confirmed" : "Unverified";
  const actionLabel = emailAttached ? "Confirm your email" : "Add your email";
  const ActionIcon = emailAttached ? MailCheck : Mail;
  const removeRow = remove === "menu-row" && (
    <MenuRow icon={MailX}>Remove your email</MenuRow>
  );

  if (variant === "sheet") {
    return (
      <div
        data-id-menu="sheet"
        className="absolute top-14 right-4 flex flex-col items-end gap-2"
      >
        <div className="w-48 rounded-lg border border-border bg-popover p-1 shadow-layer">
          <MenuRow icon={Images}>Your photos</MenuRow>
        </div>
        <div className="flex items-center gap-1 pr-2 text-[11px] text-muted-foreground">
          <ArrowDown className="size-3" aria-hidden /> opens
        </div>
        <div className="w-64 rounded-xl border border-border bg-popover p-4 shadow-layer">
          <div className="mb-3">
            <span className="block font-medium text-foreground">
              {PRIYA.name}
            </span>
            <span className="block text-xs text-muted-foreground">
              {statusLabel}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              size="sm"
              className="mb-1 w-full justify-start"
              tabIndex={-1}
              data-id-menu-action
            >
              <ActionIcon className="size-4" aria-hidden /> {actionLabel}
            </Button>
            {removeRow}
            <MenuRow icon={Pencil}>Change name</MenuRow>
            <div className="my-1 h-px bg-border" />
            <MenuRow icon={LogIn}>Sign in</MenuRow>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-id-menu={variant}
      className="absolute top-14 right-4 w-60 rounded-lg border border-border bg-popover p-1 shadow-layer"
    >
      {variant === "card" ? (
        <div className="m-1 rounded-md bg-muted/60 p-3">
          <p className="text-reading text-pretty text-foreground">
            {emailAttached
              ? "Email not confirmed yet."
              : "You're Unverified: anyone can type a name."}
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-2 w-full"
            tabIndex={-1}
            data-id-menu-action
          >
            {actionLabel}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-0.5 px-2 py-1.5">
            <span className="truncate text-reading leading-tight font-medium">
              {PRIYA.name}
            </span>
            <span className="truncate text-xs leading-tight text-muted-foreground">
              {statusLabel}
            </span>
          </div>
          <div className="my-1 h-px bg-border" />
          <div data-id-menu-action>
            <MenuRow icon={ActionIcon}>{actionLabel}</MenuRow>
          </div>
        </>
      )}
      {removeRow}
      <MenuRow icon={Pencil}>Change name</MenuRow>
      <div className="my-1 h-px bg-border" />
      <MenuRow icon={LogIn}>Sign in</MenuRow>
    </div>
  );
}

/** The confirm door, quoted from `guest-name-menu.tsx`'s own override: the
 *  code door opens EMPTY on an attached-but-unconfirmed address, and says so.
 *  `remove`'s `quiet-link` option adds one more line under it. */
export function QuotedConfirmDialog({
  removeLink = false,
}: {
  removeLink?: boolean;
}) {
  return (
    <div
      data-id-remove={removeLink ? "quiet-link" : undefined}
      className="w-72 rounded-xl border border-border bg-popover p-5 shadow-layer"
    >
      <p className="font-heading text-card-title font-medium text-foreground">
        Keep your photos
      </p>
      <p className="mt-1 text-reading text-muted-foreground">
        Enter the email you added and we will send a code.
      </p>
      <div className="mt-4">
        <QuotedGateDoor />
      </div>
      {removeLink && (
        <button
          type="button"
          className={cn(QUIET_LINK, "mx-auto mt-3 block")}
          tabIndex={-1}
        >
          Remove this email instead
        </button>
      )}
    </div>
  );
}

/** The overlay wrapper a centred surface (the confirm dialog) needs over the
 *  album, in place of the corner-anchored dropdown the other options use. */
export function CenteredOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/10 p-4">
      {children}
    </div>
  );
}

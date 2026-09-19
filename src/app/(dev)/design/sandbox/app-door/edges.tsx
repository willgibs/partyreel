"use client";

import { Fingerprint, Mail, RotateCcw } from "lucide-react";

import { GoogleIcon } from "@/components/auth/google-icon";
import { AppShell } from "@/components/shared/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEventDate } from "@/lib/utils";

import { BACK, WALL } from "./fixtures";
import { GoogleButton, type Lead, Or, QuietLink } from "./methods";

/**
 * THE THREE EDGES OF THE DOOR: the address that already has an account, the
 * sign-in that fails, and the host the browser has seen before.
 *
 * ★ THE GENERIC FAILURE IS A SECURITY DECISION BEFORE IT IS A DESIGN ONE.
 * `signInWithPassword` answers a wrong password, an account with no password
 * (a Google-only host) and an unknown address with ONE error, because telling
 * them apart lets anyone test whether an address has an account here
 * (auth-accounts.md). Every option below keeps that sentence vague; what they
 * differ on is what stands under it. An option that made the line specific
 * would be asking Will to trade enumeration safety for clarity, and none does.
 *
 * ★ AND NOTHING HERE CAN BE REACHED BY REFUSING BEFORE THE CODE. "This address
 * already has an account" is only sayable AFTER an OTP proves the address,
 * because saying it before would be the same enumeration leak. That is why the
 * third option below asks after the code rather than in front of it.
 */

/* ── the address that already has an account ─────────────────────────────── */

export type ExistingShape = "silent" | "tell" | "ask";

/**
 * The app a host lands in, held constant under all three options: what the
 * dashboard IS belongs to `app-shape`'s round, so this is the plainest honest
 * picture of "you are inside an account", three events and nothing else.
 */
function LandedInTheApp({ notice }: { notice?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppShell>
        {notice}
        <PageHeading className="mb-4">Your events</PageHeading>
        <ul className="flex flex-col gap-2">
          {[0, 4, 6].map((i, n) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={WALL[i].src}
                alt=""
                className="size-12 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {n === 0 ? BACK.event.name : ["Sunday lunch", "Leaving do"][n - 1]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatEventDate(
                    [BACK.event.date, "2026-03-08", "2026-01-24"][n],
                  )}{" "}
                  · {[BACK.event.photos, 64, 31][n]} photos
                </p>
              </div>
            </li>
          ))}
        </ul>
      </AppShell>
    </div>
  );
}

/** The one sentence the `tell` option adds, and nothing else changes. */
function AlreadyYours() {
  return (
    <div className="mb-4 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
      <p className="text-sm">
        <span className="font-medium">{BACK.email}</span> already had an
        account, so we signed you into it.
      </p>
    </div>
  );
}

/** The step the `ask` option puts after the code, before anything opens. */
export function WhichAccount() {
  return (
    <div data-ad-step className="flex flex-col gap-4 text-center">
      <div className="flex flex-col gap-1.5">
        <p className="font-heading text-subsection">
          You already have an account
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{BACK.email}</span> is
          already a Partyreel account with {BACK.event.photos + 95} photos in
          it.
        </p>
      </div>
      <Button className="w-full">Open my account</Button>
      <QuietLink>Use a different email</QuietLink>
    </div>
  );
}

/** What the `existing` option puts on the screen, given its shape. */
export function ExistingMoment({ shape }: { shape: ExistingShape }) {
  if (shape === "silent") return <LandedInTheApp />;
  if (shape === "tell") return <LandedInTheApp notice={<AlreadyYours />} />;
  return <WhichAccount />;
}

/* ── the failure ─────────────────────────────────────────────────────────── */

export type FailureShape = "one" | "paths" | "step";

/** The shipped sentence, word for word (password-sign-in.tsx). */
const GENERIC =
  "That email and password didn't match. If you usually sign in with Google or an email code, use one of those below, or reset your password.";

/** The shorter half of it, for the options that put the ways out in buttons. */
const GENERIC_SHORT = "That email and password didn't match.";

/** The banner the shipped page draws, quoted from `(auth)/login/page.tsx`. */
export function FailureBanner({ short = false }: { short?: boolean }) {
  return (
    <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {short ? GENERIC_SHORT : GENERIC}
    </p>
  );
}

/**
 * The three recoveries the sentence names, as controls instead of prose.
 *
 * ★ ALWAYS THREE, WHATEVER THE LEAD. The generic refusal is the PASSWORD
 * path's (`signInWithPassword` cannot say which of three things went wrong),
 * and every lead keeps a password door somewhere, so the recoveries do not
 * move with the lead. An earlier draft hid the code button under the code
 * lead, and the caption then measured two ways out while the option's words
 * promised three.
 */
export function RecoveryButtons() {
  return (
    <div data-ad-recovery className="flex flex-col gap-2">
      <Button type="button" variant="outline" className="w-full">
        <Mail /> Email me a code instead
      </Button>
      <Button type="button" variant="outline" className="w-full">
        <GoogleIcon /> Continue with Google
      </Button>
      <Button type="button" variant="outline" className="w-full">
        <RotateCcw /> Set a new password
      </Button>
    </div>
  );
}

/** The failure as a screen of its own: the form is gone until one is chosen. */
export function FailureStep() {
  return (
    <div data-ad-step className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 text-center">
        <p className="font-heading text-subsection">That didn&rsquo;t work</p>
        <p className="text-sm text-muted-foreground">
          We can&rsquo;t tell you which part was wrong, on purpose. Here is
          every way into this account.
        </p>
      </div>
      <RecoveryButtons />
      <QuietLink>Try the password again</QuietLink>
    </div>
  );
}

/* ── the returning host ──────────────────────────────────────────────────── */

export type ReturnShape = "same" | "back" | "tap";

/** The event this device last signed into, remembered on the device alone. */
function RememberedEvent() {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-2.5 text-left">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BACK.event.cover}
        alt=""
        className="size-10 rounded-md object-cover"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{BACK.event.name}</p>
        <p className="text-xs text-muted-foreground">
          {BACK.event.photos} photos · {BACK.event.guests} guests
        </p>
      </div>
    </div>
  );
}

/**
 * THE DOOR A HOST THIS DEVICE KNOWS MEETS.
 *
 * `back` — the name and the masked address this device last used, the event it
 *          last opened, and one thing left to fill.
 * `tap`  — one press: a passkey saved on this device, or the Google account
 *          already chosen. ★ A PASSKEY IS A PRODUCT-DEFINING CALL FOR WILL and
 *          is drawn as an option here, never assumed: the manifest's Questions
 *          carry it.
 */
export function ReturningDoor({
  shape,
  lead,
}: {
  shape: ReturnShape;
  lead: Lead;
}) {
  if (shape === "tap")
    return (
      <div className="flex flex-col gap-4">
        <RememberedEvent />
        <Button className="w-full" size="lg">
          <Fingerprint /> Continue as {BACK.name}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {BACK.masked} · saved on this device
        </p>
        <Or />
        <QuietLink>Use a different account</QuietLink>
      </div>
    );

  if (shape === "back")
    return (
      <div className="flex flex-col gap-4">
        <RememberedEvent />
        {lead === "google" ? (
          <GoogleButton lead label={`Continue as ${BACK.masked}`} />
        ) : lead === "code" ? (
          // ★ THE CODE IS NOT SENT ON LOAD. A signed-out page that emails on
          // arrival is a free send endpoint fired by a page view, and the
          // limiter would be the only thing between it and a mailbox. The
          // remembered door PREFILLS the address and still waits to be asked.
          <div className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ad-back-email">Email</Label>
              <Input
                id="ad-back-email"
                type="email"
                autoComplete="email"
                defaultValue={BACK.email}
              />
            </div>
            <Button className="w-full">Email me a code</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="ad-back-password">Password</Label>
                <span className="text-xs text-muted-foreground">
                  Forgot password?
                </span>
              </div>
              <Input
                id="ad-back-password"
                type="password"
                autoComplete="current-password"
                defaultValue="••••••••••"
              />
            </div>
            <Button className="w-full">Sign in</Button>
          </div>
        )}
        <QuietLink>Not {BACK.name}? Use a different account</QuietLink>
      </div>
    );

  return null;
}

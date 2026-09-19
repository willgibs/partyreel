"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Bookmark, Lock } from "lucide-react";

import { EmailSignIn } from "@/components/auth/email-sign-in";
import { LoginForm } from "@/components/auth/login-form";
import { EnterEventPrompt } from "@/components/guest/enter-event-prompt";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatEventDate } from "@/lib/utils";

import { GUEST_EVENT } from "./fixtures";
import { GoogleButton, Or, QuietLink } from "./methods";
import {
  DoorCard,
  type ScreenId,
  Scrim,
  Sheet,
  PhotoWall,
} from "./shells";

/**
 * THE FOUR PLACES THIS PRODUCT ASKS FOR AN ACCOUNT.
 *
 * `/login`, the guest gate on an account-required event, the Save dialog in an
 * album, and the near-copy behind Likes. Four feature sets, three tones, and
 * only two of the four carry the Terms line (seams 1, 3 and 5 in the
 * Orchestrator's map). Likes is drawn by its twin, Save: it is the same
 * component with a different sentence, so drawing it twice would be drawing
 * the seam rather than the question.
 *
 * ★ TODAY IS DRAWN TRUTHFULLY, INCLUDING WHAT IS MISSING. The Save surface
 * below carries no consent line, because the shipped one does not. That
 * absence is the measurement under the tile, not an omission in the drawing.
 */

export type SurfaceShape = "four" | "one" | "door";
export type Place = "login" | "gate" | "save";

export const placeOf = (v: string | undefined): Place =>
  v === "gate" ? "gate" : v === "save" ? "save" : "login";

/** Why each place is asking, in the place's own words. */
const REASON: Record<Place, string> = {
  login: "to create events and collect photos from your guests",
  gate: `to see all ${GUEST_EVENT.photos} photos from ${GUEST_EVENT.name}`,
  save: "to keep this album and come back to it any time",
};

/* ── the grounds ─────────────────────────────────────────────────────────── */

/**
 * The guest page the two guest surfaces stand on, held constant under every
 * option so no decision here is secretly a decision about the album. Quoted
 * rather than imported: `guest-header.tsx` resolves the visitor's Supabase
 * session on mount and would draw whoever the author is signed in as.
 */
function GuestGround({ screen }: { screen: ScreenId }) {
  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <Logo />
        <Button variant="ghost" size="sm">
          Start for free
        </Button>
      </header>
      <div className="px-5 pt-5 pb-4">
        <h1 className="font-heading text-page text-balance">
          {GUEST_EVENT.name}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Hosted by {GUEST_EVENT.host} · {formatEventDate(GUEST_EVENT.date)} ·{" "}
          {GUEST_EVENT.photos} photos
        </p>
      </div>
      <div className="relative min-h-0 flex-1">
        <PhotoWall columns={screen === "375" ? 2 : 5} className="px-2 pb-2" />
      </div>
    </div>
  );
}

/** The empty page `/login` stands on, so the three places share a frame. */
function LoginGround({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      {children}
    </div>
  );
}

/* ── shape one: four surfaces, as shipped ────────────────────────────────── */

/**
 * The Save dialog, quoted from `save-event-button.tsx`'s own `DialogContent`:
 * the title, the sentence, the shared `EmailSignIn`, the newsletter switch,
 * the divider and Google. Quoted because `SaveEventButton` reads a session and
 * then queries `saved_events` on mount, which is a network call from a
 * preview, and because its dialog portals to the board's body.
 */
function SaveDialogBody() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-lg leading-none font-semibold">Save this event</p>
        <p className="text-sm text-muted-foreground">
          Create a free account to keep this event on your dashboard and come
          back to it anytime. No app, just your email.
        </p>
      </div>
      <EmailSignIn emailRedirectTo="lab" onVerified={() => {}} />
      <div className="flex items-center gap-2">
        <Switch id="ad-save-newsletter" size="sm" />
        <Label
          htmlFor="ad-save-newsletter"
          className="text-xs font-normal text-muted-foreground"
        >
          Send me occasional Partyreel updates
        </Label>
      </div>
      <Or />
      <GoogleButton />
    </div>
  );
}

/* ── shape two: one object, worn four ways ───────────────────────────────── */

/**
 * ONE ACCOUNT SURFACE, with the methods as props and the reason as the only
 * thing that moves between places.
 *
 * Everything under the reason is identical in all four: one eyebrow, one
 * title, the shipped first field, Google, the password as a quiet second door,
 * and the consent line. That last one is the point of the option as much as
 * the shape is — a shared object cannot forget the Terms line on two of four
 * surfaces, which is how the product got here.
 */
function OneSurface({ place }: { place: Place }) {
  return (
    <div data-ad-surface className="flex flex-col gap-4 text-center">
      <div className="flex flex-col gap-1.5">
        <p className="flex items-center justify-center gap-1.5 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {place === "gate" ? (
            <Lock className="size-3" aria-hidden />
          ) : place === "save" ? (
            <Bookmark className="size-3" aria-hidden />
          ) : null}
          Your free account
        </p>
        <p className="font-heading text-subsection text-balance">
          One email, and you&rsquo;re in
        </p>
        {/* The one line that differs between the four places. */}
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          {`You need an account ${REASON[place]}.`}
        </p>
      </div>
      <div className="text-left">
        <EmailSignIn emailRedirectTo="lab" onVerified={() => {}} />
      </div>
      <Or />
      <GoogleButton />
      <QuietLink>Have a password? Use it instead</QuietLink>
      <LegalConsentLine newTab className="text-center" />
    </div>
  );
}

/* ── shape three: one full door, reached from everywhere ─────────────────── */

/** The reason a place sends you to the door, and the way back to it. */
function DoorReason({ place }: { place: Place }) {
  if (place === "login") return null;
  return (
    <div className="mb-4 flex flex-col gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-left">
      <p className="text-sm text-muted-foreground">
        {`You need an account ${REASON[place]}.`}
      </p>
      <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to {GUEST_EVENT.name}
      </span>
    </div>
  );
}

/* ── the composition ─────────────────────────────────────────────────────── */

/**
 * ONE PLACE, IN ONE SHAPE. The ground is the place's own page and the surface
 * is whatever the shape puts on it, so what moves between tiles is the number
 * of account surfaces the product has and nothing else.
 */
export function AccountPlace({
  shape,
  place,
  screen,
}: {
  shape: SurfaceShape;
  place: Place;
  screen: ScreenId;
}) {
  // THE ONE FULL DOOR swallows the place entirely: whatever asked, you are on
  // `/login` with its reason above the form and a way back under it. That IS
  // the option, so a guest surface has no sheet to draw at all.
  if (shape === "door")
    return (
      <LoginGround>
        <DoorCard banner={<DoorReason place={place} />}>
          <div className="space-y-4">
            <EmailSignIn emailRedirectTo="lab" onVerified={() => {}} />
            <Or />
            <GoogleButton />
            <QuietLink>Have a password? Use it instead</QuietLink>
          </div>
        </DoorCard>
      </LoginGround>
    );

  // `/login` is a page in both remaining shapes; only its body moves. Today
  // that body is the shipped `LoginForm` and nothing else, password-led, with
  // the consent line under the card where it has always been.
  if (place === "login")
    return (
      <LoginGround>
        <DoorCard consent={shape === "four"}>
          {shape === "four" ? <LoginForm /> : <OneSurface place="login" />}
        </DoorCard>
      </LoginGround>
    );

  // The two guest surfaces, on the album they interrupt.
  return (
    <div className="relative min-h-screen">
      <GuestGround screen={screen} />
      <Scrim />
      <Sheet screen={screen}>
        {shape === "one" ? (
          <OneSurface place={place} />
        ) : place === "gate" ? (
          <EnterEventPrompt qrToken="lab" mediaTotal={GUEST_EVENT.photos} />
        ) : (
          <SaveDialogBody />
        )}
      </Sheet>
    </div>
  );
}

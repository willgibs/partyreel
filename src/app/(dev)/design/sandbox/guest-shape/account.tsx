"use client";

import type { ReactNode } from "react";
import { Bookmark, Check, Lock } from "lucide-react";

import { EmailSignIn } from "@/components/auth/email-sign-in";
import { GoogleIcon } from "@/components/auth/google-icon";
import { EnterEventPrompt } from "@/components/guest/enter-event-prompt";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import { EVENT, FIXTURES } from "./fixtures";
import type { ScreenId } from "./page-parts";

/**
 * THE TWO MOMENTS THAT ASK A GUEST FOR AN ACCOUNT.
 *
 * A guest can meet both in one visit and they read as two products. The GATE
 * (`enter-event-prompt.tsx`) is an invitation: an "Almost in" eyebrow, the real
 * count as the promise, one warm sentence, then email-first with a quiet
 * password fallback. SAVE (`save-event-button.tsx`) is a sign-up form: a title,
 * a dashboard sentence, the same email field, a newsletter switch, a rule, and
 * Google. Same account, same first field, two voices and two shapes.
 *
 * ★ THE FIELD IS ALWAYS THE SHIPPED ONE. Every option below puts the real
 * `EmailSignIn` in front of the guest, so the one-tap code, the resend
 * cooldown and the verify path are the real ones; what varies is the framing
 * around it, which is exactly what is being decided. The gate option draws the
 * whole shipped `EnterEventPrompt`.
 */

export type AccountShape = "two" | "one" | "after";
export type MomentId = "gate" | "save";

export const accountOf = (v: string | undefined): AccountShape =>
  v === "two" ? "two" : v === "after" ? "after" : "one";

export const momentOf = (v: string | undefined): MomentId =>
  v === "save" ? "save" : "gate";

/** The sheet both moments are read on once `dialogs` promotes it. */
function Surface({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  if (screen === "1440")
    return (
      <div className="gs-dialog" style={{ maxWidth: "24rem" }}>
        {children}
      </div>
    );
  return (
    <div className="gs-sheet">
      <div className="gs-handle" aria-hidden />
      <div className="flex flex-col gap-4 pt-1">{children}</div>
    </div>
  );
}

/** Today's Save dialog, quoted: a title, a sentence, the field, a switch, a
 *  rule and Google. */
function SaveForm() {
  return (
    <>
      <div>
        <p className="text-base font-semibold">Save this album</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a free account to keep this album on your dashboard and come
          back to it anytime. No app, just your email.
        </p>
      </div>
      <EmailSignIn emailRedirectTo="/auth/callback" onVerified={() => {}} />
      <div className="flex items-center gap-2">
        <Switch id="gs-news" size="sm" />
        <Label
          htmlFor="gs-news"
          className="text-xs font-normal text-muted-foreground"
        >
          Send me occasional Partyreel updates
        </Label>
      </div>
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>
      <Button type="button" variant="outline" className="w-full">
        <GoogleIcon /> Continue with Google
      </Button>
    </>
  );
}

/**
 * ONE VOICE: the gate's own framing, with the reason as the only thing that
 * moves. The eyebrow, the serif line and the shipped field are identical at
 * both moments; a guest who met one has already learned the other.
 */
function OneVoice({ moment }: { moment: MomentId }) {
  const gate = moment === "gate";
  return (
    <div className="text-center">
      <p className="flex items-center justify-center gap-1.5 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {gate ? (
          <Lock className="size-3" aria-hidden />
        ) : (
          <Bookmark className="size-3" aria-hidden />
        )}
        {gate ? "Almost in" : "Keep it"}
      </p>
      <p className="mt-1.5 font-heading text-page text-balance">
        {gate
          ? `${FIXTURES.account.count} photos are waiting`
          : `${EVENT.name}, kept`}
      </p>
      <p className="mx-auto mt-2 mb-4 max-w-xs text-base leading-relaxed text-muted-foreground">
        {gate
          ? "To keep this album just for guests, the host asks for a quick email check. One tap, no password needed, and you're in."
          : "One tap and this album waits for you, on any phone you pick up. No password needed."}
      </p>
      <div className="mx-auto max-w-xs text-left">
        <EmailSignIn
          emailRedirectTo="/auth/callback"
          onVerified={() => {}}
          inputClassName="h-11 text-base"
          buttonClassName="h-11 text-[15px]"
        />
        <button
          type="button"
          className="mt-3 w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Have a password? Log in
        </button>
      </div>
    </div>
  );
}

/**
 * SAVE, MOVED: the account is asked once, at the door, so saving is not a
 * second form. It is the offer that follows a guest's first photograph.
 */
function SavedOffer() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-success text-success-foreground">
        <Check className="size-6" />
      </div>
      <p className="font-heading text-page">Your photo is in</p>
      <p className="max-w-xs text-base leading-relaxed text-muted-foreground">
        Keep {EVENT.name} on your phone and everything else that lands tonight
        comes with it.
      </p>
      <Button size="lg" className="w-full text-[15px]">
        <Bookmark /> Keep this album
      </Button>
      <button
        type="button"
        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Not now
      </button>
    </div>
  );
}

export function AccountMoment({
  shape,
  moment,
  screen,
}: {
  shape: AccountShape;
  moment: MomentId;
  screen: ScreenId;
}) {
  if (shape === "two")
    return (
      <Surface screen={screen}>
        {moment === "gate" ? (
          <div className="pt-1">
            <EnterEventPrompt
              qrToken="lab"
              mediaTotal={FIXTURES.account.count}
            />
          </div>
        ) : (
          <SaveForm />
        )}
      </Surface>
    );

  if (shape === "one")
    return (
      <Surface screen={screen}>
        <OneVoice moment={moment} />
      </Surface>
    );

  return (
    <Surface screen={screen}>
      {moment === "gate" ? <OneVoice moment="gate" /> : <SavedOffer />}
    </Surface>
  );
}

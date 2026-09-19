"use client";

import type { ReactNode } from "react";
import { Camera, Images } from "lucide-react";

import { EnterEventPrompt } from "@/components/guest/enter-event-prompt";
import { PasswordGate } from "@/components/guest/password-gate";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Button } from "@/components/ui/button";
import { cn, formatEventDate } from "@/lib/utils";

import { EVENT, FIXTURES, type FixtureId } from "./fixtures";
import type { ScreenId } from "./page-parts";

/**
 * THE DOOR: WHAT A GUEST MEETS IN THE FIRST TWO SECONDS AFTER THE SCAN.
 *
 * The gated arrival is the PRIMARY first experience (most events gate, and a
 * guest arrives from a code with no context at all), so the board's default
 * fixture here is the password event and the knob carries the other two.
 *
 * ★ THE GATE BODIES ARE THE SHIPPED COMPONENTS. `PasswordGate` and
 * `EnterEventPrompt` are imported whole and wrapped: their words, their
 * fields, their five-strikes cooldown, their email-first ladder and their
 * success morph are all the real ones, because the question is what SURFACE
 * they are read on, not what they say. The behaviour pins in
 * `password-gate.test.tsx` and `entry-modal.test.tsx` govern that and survive
 * every shape below.
 *
 * ★ THE SHELL IS QUOTED, AND THAT IS THE LANE'S ONE DEPARTURE.
 * `entry-shell.tsx` is a real Vaul drawer, and a drawer portals to
 * `document.body`, which inside a lab frame is the BOARD's body: the sheet
 * would leave the picture entirely, exactly as admin/destructive.tsx and
 * glass/surfaces.tsx found. Its material, corner, padding and overlay are
 * reproduced in guest-shape.css from the shipped classNames, and nothing that
 * carries a rule is re-decided here. `useMediaQuery` has the same problem for
 * the same reason (it reads the lab page's width, not the frame's), so which
 * shell a width gets is set by the frame's own screen.
 *
 * ★ THE WELCOME'S WORDS ARE QUOTED TOO, because `WelcomeStep` is module-local
 * to entry-modal.tsx and is not exported. Every string below is its own.
 */

export type DoorShape = "today" | "one" | "page";

export const doorOf = (v: string | undefined): DoorShape =>
  v === "one" ? "one" : v === "page" ? "page" : "today";

export const fixtureOf = (v: string | undefined): FixtureId =>
  v === "open" ? "open" : v === "account" ? "account" : "password";

/* ── the pieces ──────────────────────────────────────────────────────────── */

/** The invitation's identity block: the eyebrow, the name, the byline. */
function Invitation({ fixture }: { fixture: FixtureId }) {
  const redacted = FIXTURES[fixture].redacted;
  return (
    <div className="flex flex-col">
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        You&rsquo;re invited to
      </p>
      <p className="mt-1.5 font-heading text-page text-balance">{EVENT.name}</p>
      {/* A locked page has no host name and no date to draw: the server blanks
          both before the payload is built, so the byline hides itself. */}
      {!redacted && (
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span>
            Hosted by{" "}
            <span className="font-medium text-foreground">{EVENT.host}</span>
          </span>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <span>{formatEventDate(EVENT.date)}</span>
        </p>
      )}
    </div>
  );
}

/** The invitation's two promises, in the host's voice. */
function Promises({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-3.5">
      <p className="flex items-start gap-3 text-base leading-relaxed">
        <Camera className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
        Add your photos and videos in seconds. No app, no account.
      </p>
      <p className="flex items-start gap-3 text-base leading-relaxed">
        <Images className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
        {count > 0
          ? `Everyone's shots land in one album. ${count} are already inside.`
          : "Everyone's shots land in one album, yours included."}
      </p>
    </div>
  );
}

/** The gate itself, whichever one this event carries. */
function Gate({ fixture }: { fixture: FixtureId }) {
  const gate = FIXTURES[fixture].gate;
  if (gate === "password")
    return <PasswordGate token="lab" eventName={EVENT.name} />;
  if (gate === "account")
    return (
      <EnterEventPrompt qrToken="lab" mediaTotal={FIXTURES[fixture].count} />
    );
  return null;
}

/* ── the three shells ────────────────────────────────────────────────────── */

/**
 * The sheet, quoted: a drawer at the foot on a phone, the centred dialog from
 * 640 up. `tall` is the ratified 55svh presence the welcome step alone wears
 * inside the drawer ([data-entry-drawer] [data-welcome-step], globals.css).
 */
function Sheet({
  screen,
  tall,
  handle,
  children,
}: {
  screen: ScreenId;
  tall?: boolean;
  /** The drag handle renders only where dragging actually dismisses. */
  handle?: boolean;
  children: ReactNode;
}) {
  if (screen === "1440")
    return <div className="gs-dialog">{children}</div>;
  return (
    <div className="gs-sheet" style={tall ? { minHeight: "55%" } : undefined}>
      {handle && <div className="gs-handle" aria-hidden />}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/**
 * THE DOOR, IN ONE OF THREE SHAPES.
 *
 * `today`  — the welcome, then the gate. Two screens on a gated event, and the
 *            shell changes type at 640: a drawer below, a centred dialog above.
 * `one`    — one screen. On a gated event the gate carries the invitation's two
 *            promises; on an open one the sheet drops the 55svh floor and sits
 *            at its content's height with the album alive behind it.
 * `page`   — no sheet at any width: the arrival is the screen, and the album
 *            begins underneath it.
 */
export function Door({
  shape,
  screen,
  fixture,
}: {
  shape: DoorShape;
  screen: ScreenId;
  fixture: FixtureId;
}) {
  const f = FIXTURES[fixture];
  const gated = f.gate !== null;

  if (shape === "page")
    return (
      <div
        data-gs-door
        className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background"
      >
        {/* ★ ONE NAME PER SCREEN. The gate already carries the event name (and
            on a locked page it is the only thing the server hands the page), so
            the invitation's identity block appears only where there is no gate
            to carry it. The first capture had "Maya & Jay's Wedding" twice on
            one screen, forty pixels apart. */}
        <div
          className={cn(
            "mx-auto flex w-full flex-1 flex-col justify-center gap-6 px-5 py-10",
            screen === "1440" ? "max-w-md" : "max-w-sm",
          )}
        >
          {gated ? (
            <>
              <Gate fixture={fixture} />
              <div className="border-t border-border/60 pt-5">
                <Promises count={f.count} />
              </div>
            </>
          ) : (
            <>
              <Invitation fixture={fixture} />
              <Promises count={f.count} />
              <Button size="lg" className="w-full text-[15px]">
                View the album
              </Button>
            </>
          )}
          <LegalConsentLine newTab className="text-center" />
        </div>
      </div>
    );

  if (shape === "one")
    return (
      <Sheet screen={screen} handle={!gated}>
        {gated ? (
          <div className="flex flex-col gap-5 pt-1">
            <Gate fixture={fixture} />
            <div className="border-t border-border/60 pt-4">
              <Promises count={f.count} />
            </div>
            <LegalConsentLine newTab className="text-center" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 pt-1">
            <Invitation fixture={fixture} />
            <Promises count={f.count} />
            <Button size="lg" className="w-full text-[15px]">
              View the album
            </Button>
            <LegalConsentLine newTab className="text-center" />
          </div>
        )}
      </Sheet>
    );

  // `today`: the welcome, which is the first of the two screens a gated event
  // asks for. Held (no handle, no close) when a password gate follows, because
  // there is nothing behind it to dismiss to.
  return (
    <Sheet screen={screen} tall handle={!gated}>
      <div className="flex min-h-0 flex-1 flex-col gap-5 pt-1">
        <Invitation fixture={fixture} />
        <Promises count={f.count} />
        <div className="mt-auto flex flex-col gap-1">
          <Button size="lg" className="w-full text-[15px]">
            {gated ? "Continue" : "View the album"}
          </Button>
          {f.gate === "account" && (
            <Button variant="ghost" className="w-full text-muted-foreground">
              Just browsing
            </Button>
          )}
          <LegalConsentLine newTab className="mt-2 text-center" />
        </div>
      </div>
    </Sheet>
  );
}

/** How many screens a shape puts between the scan and the album. */
export function doorScreens(shape: DoorShape, fixture: FixtureId): number {
  const gated = FIXTURES[fixture].gate !== null;
  if (shape === "today") return gated ? 2 : 1;
  return 1;
}

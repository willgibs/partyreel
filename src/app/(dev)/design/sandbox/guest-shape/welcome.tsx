"use client";

import { type ReactNode } from "react";
import { Camera, ImageUp, Images, Lock, QrCode } from "lucide-react";

import { EnterEventPrompt } from "@/components/guest/enter-event-prompt";
import { GUEST_GHOST_FRAMES } from "@/components/guest/gallery-empty-state";
import { GuestMasonry } from "@/components/guest/guest-masonry";
import { PasswordGate } from "@/components/guest/password-gate";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { River } from "@/components/shared/river/river";
import { Button } from "@/components/ui/button";
import { cn, formatEventDate } from "@/lib/utils";

import { DEMO, type Party } from "../demo-event/fixtures";
import { EVENT, FIXTURES, type FixtureId } from "./fixtures";
import type { ScreenId } from "./page-parts";

/**
 * THE WELCOME, ROUND TWO: THE DOOR'S SHELL AND THE WELCOME SCREEN'S DESIGN.
 *
 * Round one's `door` ruled the SEQUENCE (`door=today`, 2026-09-20, verbatim:
 * "this is directly approving the welcome then gate, not this sheet design"):
 * two screens on a gated event stay, the welcome first. What was never ruled
 * is the SHELL those two screens wear, and the demo's own arrival named by
 * hand the same night (`arrival=role`, on `demo-event`: "this welcome screen
 * could be redesigned"). So this board keeps the ruled sequence exactly —
 * `step` still walks welcome then gate, never collapsed to one screen, which
 * is what round one's rejected `one`/`page` options did and this round's
 * `page` shape does NOT repeat — and draws four shells around it, on a real
 * gated event AND on the demo's own words.
 *
 * ★ THE CONTENT IS SPLIT FROM THE SHELL ON PURPOSE. `Content` below is every
 * word a guest or a demo visitor reads; the four shells (`TodayShell`,
 * `PageShell`, `CardShell`, `SheetShell`) are four different furniture for
 * the same words, so a reviewer is judging one axis at a time.
 *
 * ★ THE EVENT'S CONTENT IS REAL, THE DEMO'S IS QUOTED. `PasswordGate` and
 * `EnterEventPrompt` are the shipped components, imported whole: their words,
 * fields, five-strikes cooldown and success morph are the real ones. The
 * demo's `Role` is module-private to `demo-event/arrival.tsx` (only `Arrival`
 * is exported, always wearing THAT board's own shell) and this board's whole
 * question is a DIFFERENT shell around the same words, so it is reproduced
 * here byte for byte rather than imported — the one departure, same shape as
 * `WelcomeStep` being quoted in round one for the identical reason.
 *
 * ★ EVERY SHELL KEEPS VAUL'S INPUT HANDLING ON A PHONE. The password and
 * account gates are the shipped `PasswordGate`/`EnterEventPrompt` in every
 * shape below, so `repositionInputs`' keyboard lift is real wherever a shell
 * puts them; a static lab frame cannot show a focused keyboard, so this is
 * true of every option below and said once here rather than four times.
 */

export type WelcomeShape = "today" | "page" | "card" | "sheet";

export const welcomeOf = (v: string | undefined): WelcomeShape =>
  v === "page" ? "page" : v === "card" ? "card" : v === "sheet" ? "sheet" : "today";

export type ContentId = "event" | "demo";

/** Which of the ruled sequence's two screens is on stage. Moot for the demo,
 *  which has one arrival and no gate behind it. */
export type StepId = "welcome" | "gate";
export const stepOf = (v: string | undefined): StepId =>
  v === "gate" ? "gate" : "welcome";

/**
 * ONE DOCK CONTROL FOR CONTENT AND FIXTURE TOGETHER, because `demo` makes a
 * separate fixture knob a no-op: a reviewer flipping "which door" between a
 * password event, an account event, an open event and the demo's own arrival
 * is one decision, not two controls where a second sits inert half the time.
 */
export type WhichId = "password" | "account" | "open" | "demo";
export const whichOf = (v: string | undefined): WhichId =>
  v === "account"
    ? "account"
    : v === "open"
      ? "open"
      : v === "demo"
        ? "demo"
        : "password";

export function contentFixtureOf(
  which: WhichId,
): { content: ContentId; fixture: FixtureId } {
  if (which === "demo") return { content: "demo", fixture: "open" };
  return { content: "event", fixture: which };
}

/* ── the event's own words, real gates included ──────────────────────────── */

function Invitation({ fixture }: { fixture: FixtureId }) {
  const redacted = FIXTURES[fixture].redacted;
  return (
    <div className="flex flex-col">
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        You&rsquo;re invited to
      </p>
      <p className="mt-1.5 font-heading text-page text-balance">{EVENT.name}</p>
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

/** The gate itself: the real component, whichever this event carries. */
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

/**
 * THE DEMO'S ROLE, QUOTED (see the file note). Ruled `arrival=role`,
 * 2026-09-20: "this welcome screen could be redesigned" is what this board
 * answers, on the words as they stand — the mirrored two-promise shape, the
 * same icons, said to a host instead of a guest.
 */
function Role({ party }: { party: Party }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 pt-1">
      <div className="flex flex-col">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          A live demo
        </p>
        <p className="mt-1.5 font-heading text-page text-balance">
          You&rsquo;re a guest at {party.name}
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          This is a real album, exactly as {party.host}&rsquo;s guests see it.
        </p>
      </div>
      <div className="flex flex-col gap-3.5">
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <ImageUp className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          Add a photo the way a guest would. Nothing you add is saved.
        </p>
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <QrCode className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          One code did all of this. Yours takes about a minute.
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <Button size="lg" className="w-full text-[15px]">
          Look around
        </Button>
        <Button variant="ghost" className="w-full text-muted-foreground">
          Start your own
        </Button>
      </div>
    </div>
  );
}

/** Dispatches to the right words for the (content, step, fixture) on the dock. */
function Content({
  content,
  step,
  fixture,
}: {
  content: ContentId;
  step: StepId;
  fixture: FixtureId;
}) {
  if (content === "demo") return <Role party={DEMO} />;

  const f = FIXTURES[fixture];
  const gated = f.gate !== null;

  if (step === "gate" && gated)
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-5 pt-1">
        <Gate fixture={fixture} />
        <div className="border-t border-border/60 pt-4">
          <Promises count={f.count} />
        </div>
        <LegalConsentLine newTab className="text-center" />
      </div>
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 pt-1">
      <Invitation fixture={fixture} />
      <Promises count={f.count} />
      <div className="mt-auto flex flex-col gap-1">
        <Button size="lg" className="w-full text-[15px]">
          {gated ? "Continue" : "View the album"}
        </Button>
        <LegalConsentLine newTab className="mt-2 text-center" />
      </div>
    </div>
  );
}

/* ── what stands behind an open shell ────────────────────────────────────── */

/**
 * The page a shell floats over (`today`/`sheet`) or that a compact `card`
 * shares the screen with. A password event's backdrop is the shipped locked
 * reading exactly (name + count + the ghosted river, `nothing=river`); an
 * account or open event shows the real album's own opening tiles, because
 * that is genuinely what stands behind an account gate today
 * (`resolveGalleryAccess`'s teaser) and what `card` is asking to extend to
 * every gate.
 */
function Backdrop({ fixture }: { fixture: FixtureId }) {
  const f = FIXTURES[fixture];
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8">
      <p className="font-heading text-page text-balance">{EVENT.name}</p>
      {f.access === "none" ? (
        <>
          <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
            <Lock className="size-4" aria-hidden />
            <p className="text-[15px]">{f.count} photos &amp; videos inside</p>
          </div>
          <div className="mt-4 opacity-40 grayscale-[85%]">
            <River frames={GUEST_GHOST_FRAMES} />
          </div>
        </>
      ) : (
        <div className="mt-6">
          <GuestMasonry items={f.items} />
        </div>
      )}
    </div>
  );
}

/* ── the four shells ─────────────────────────────────────────────────────── */

/** `today`, quoted from round one unchanged: a drawer below 640, the centred
 *  dialog above it. The baseline he named directly ("not this sheet design"). */
function TodayShell({
  screen,
  handle,
  children,
}: {
  screen: ScreenId;
  handle: boolean;
  children: ReactNode;
}) {
  if (screen === "1440")
    return (
      <div className="gs-dialog" style={{ maxWidth: "24rem" }}>
        {children}
      </div>
    );
  return (
    <div className="gs-sheet" style={{ minHeight: "55%" }}>
      {handle && <div className="gs-handle" aria-hidden />}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/** `page`: no floating chrome at any width. The welcome IS the screen, and
 *  the gate replaces it in place — the same container, the ruled second step,
 *  never a new modal on top of the first. */
function PageShell({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  return (
    <div
      data-gs-door
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background"
    >
      <div
        className={cn(
          "mx-auto flex w-full flex-1 flex-col justify-center gap-6 px-5 py-10",
          screen === "1440" ? "max-w-md" : "max-w-sm",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** `card`: a compact float over the album's own top, the album visible in the
 *  room it leaves rather than dimmed behind a scrim. */
function CardShell({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  return (
    <div
      data-gs-door
      className={cn(
        "absolute inset-x-4 top-6 z-50 mx-auto flex flex-col gap-4 rounded-float bg-popover p-6 text-popover-foreground shadow-layer ring-1 ring-foreground/10",
        screen === "1440" && "inset-x-auto left-1/2 w-full max-w-md -translate-x-1/2",
      )}
    >
      {children}
    </div>
  );
}

/**
 * `sheet`: the responsive Sheet's own posture (`ui/sheet.tsx`,
 * `floatingEdgeEntranceResponsive`), reproduced statically open — a bottom
 * sheet under 640, a right-edge panel the full height of the screen from 640
 * up (not a centred float), because that is genuinely what the primitive
 * `dialogs=stands` promoted to every other guest surface draws at a desk
 * today. No corner on the desk panel (its own edge is the viewport's), the
 * ruled `--radius-float` top corner on the phone sheet.
 */
function SheetShell({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  if (screen === "1440")
    return (
      <div
        data-gs-door
        className="fixed inset-y-0 right-0 z-50 flex h-full w-3/4 max-w-md flex-col gap-4 border-l border-border/60 bg-popover p-6 text-popover-foreground shadow-layer"
      >
        {children}
      </div>
    );
  return (
    <div
      data-gs-door
      className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85svh] w-full flex-col gap-4 rounded-t-float border-t border-border/60 bg-popover p-6 pb-8 text-popover-foreground shadow-layer"
    >
      {children}
    </div>
  );
}

/* ── the whole picture ───────────────────────────────────────────────────── */

export function Welcome({
  shape,
  screen,
  content,
  step,
  fixture,
}: {
  shape: WelcomeShape;
  screen: ScreenId;
  content: ContentId;
  step: StepId;
  fixture: FixtureId;
}) {
  // The demo always drops a visitor into the FULL album behind its arrival
  // (`isDemo` forces `access: "full"`), never a gate's teaser.
  const backdropFixture: FixtureId = content === "demo" ? "open" : fixture;
  const inner = <Content content={content} step={step} fixture={fixture} />;
  // The honest-affordance table (round one): welcome-before-password and the
  // password gate itself are both HELD (there is nothing to dismiss to until
  // it opens); an account gate and the demo are free to browse past.
  const passwordHeld = content === "event" && FIXTURES[fixture].gate === "password";

  if (shape === "page")
    return (
      <div className="relative h-full w-full overflow-hidden bg-background">
        <PageShell screen={screen}>{inner}</PageShell>
      </div>
    );

  if (shape === "card")
    return (
      <div className="relative h-full w-full overflow-y-auto bg-background">
        <Backdrop fixture={backdropFixture} />
        <CardShell screen={screen}>{inner}</CardShell>
      </div>
    );

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <Backdrop fixture={backdropFixture} />
      <div className="gs-scrim" />
      {shape === "today" ? (
        <TodayShell screen={screen} handle={!passwordHeld}>
          {inner}
        </TodayShell>
      ) : (
        <SheetShell screen={screen}>{inner}</SheetShell>
      )}
    </div>
  );
}

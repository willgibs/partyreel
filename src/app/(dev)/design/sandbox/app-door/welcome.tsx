"use client";

import { ArrowRight, CalendarPlus } from "lucide-react";

import { AppShell } from "@/components/shared/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { SetNameStep } from "@/components/shared/set-name-step";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { HOW_IT_WORKS } from "@/lib/constants/how-it-works";
import { cn } from "@/lib/utils";

import { FilmSteps } from "./film";
import { FlowCard, Screen, type ScreenId } from "./shells";
import { StageSteps } from "./stage";

/**
 * WHAT STANDS BETWEEN A NEW ACCOUNT AND THE APP, ROUND TWO: NOT WHETHER
 * THERE IS A TOUR (round one's `first` overruled that already, `welcome=
 * tour`), BUT WHAT THE TOUR IS.
 *
 * His own words, verbatim: "This is more introductory than immediately
 * creating an event. That way, event creation can feel more focused within
 * its own wizard and prompted as the primary CTA at the end of the tour (but
 * skippable, as in preview). However, this welcome tour could use a huge
 * redesign to feel more alive."
 *
 * Two things hold across all four shapes below, because his ruling fixed
 * them and this round is about everything else: the FIRST screen is always
 * `NameScreen`, unchanged from what ships (the one write path for a display
 * name is not a design variable); and the LAST thing a host meets is always
 * `ClosingDoors`, the same primary-and-skippable pair in the same order,
 * whatever led up to it. What moves is everything in between: three real
 * shapes (`cards`, `stage`, `film`) and one shape with nothing in between at
 * all (`one`).
 *
 * ★ THE WHOLE FLOW IS DRAWN, NOT ONE SCREEN OF IT, because the question IS how
 * many screens there are and how heavy each one feels. Each shape stacks its
 * own screens down the app's own chrome at their true width, numbered, so
 * "four screens" and "one screen" are things Will sees rather than things a
 * caption claims. A stack is still 1:1 — every card is the shipped card at
 * the width the route gives it — and the frame scrolls exactly as the flow
 * would if it were one page.
 *
 * ★ ONE FILE PER SHAPE ONCE A SHAPE IS MORE THAN A CARD. `cards` and `one`
 * stay here because both are `FlowCard` and a few lines; `stage` (real
 * product screens, its own responsive "beside" layout) and `film` (the
 * twelve bespoke pictures, in motion) each earned their own file. `board.tsx`
 * still asks this one module for every option, so the ask's preview map
 * stays in one place.
 */

export type WelcomeShape = "cards" | "stage" | "film" | "one";

/** How many screens each shape puts between the code and the dashboard. */
export const WELCOME_SCREENS: Record<WelcomeShape, number> = {
  cards: 4,
  stage: 5,
  film: 5,
  one: 1,
};

/* ── the pieces every shape shares ───────────────────────────────────────── */

/** The dots the `cards` tutorial draws over its three screens. */
function Dots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            "size-1.5 rounded-full",
            i === step ? "bg-brand" : i < step ? "bg-foreground" : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}

/** Screen one of every shape: the required display name, untouched. */
function NameScreen({ submitLabel }: { submitLabel: string }) {
  return (
    <FlowCard>
      <CardHeader className="space-y-1">
        <PageHeading>Welcome to Partyreel</PageHeading>
        <p className="text-muted-foreground">
          First, the name your guests will see on the photos you add.
        </p>
      </CardHeader>
      <CardContent>
        <SetNameStep
          title="Add your name"
          prefill=""
          submitLabel={submitLabel}
          onSaved={() => {}}
        />
      </CardContent>
    </FlowCard>
  );
}

/**
 * THE LAST SCREEN OF EVERY SHAPE: primary and skippable, his ruling word for
 * word. A Fragment, not a div, because every call site already owns the flex
 * column its two buttons stack in (a `CardFooter`, or `stage`/`film`'s own
 * closing wrapper) and a second one here would only be a nested column
 * around the same two buttons.
 */
export function ClosingDoors() {
  return (
    <>
      <Button className="w-full">
        <CalendarPlus /> Create my first event
      </Button>
      <Button variant="ghost" className="w-full">
        I&rsquo;ll look around first
      </Button>
    </>
  );
}

/* ── `cards`: the three cards with dots, as today ────────────────────────── */

/**
 * Quoted from `welcome-flow.tsx`'s tutorial phase, drawn as three stacked
 * screens instead of one card cycling its own state (the stack is what lets
 * every shape be compared at once; `WelcomeFlowStack`'s own header explains
 * why). ONE CORRECTION FROM WHAT ROUND ONE DREW: its first screen still said
 * "No app, no accounts", the line bible 20 retired on 2026-09-19 for "No app
 * required." — drawn honestly means drawn as it reads today, not as it read
 * when this board was born.
 */
function CardsSteps({ of }: { of: number }) {
  return (
    <>
      <Screen n={2} of={of} label="The tour">
        <FlowCard>
          <CardHeader>
            <Dots step={1} />
          </CardHeader>
          <CardContent className="min-h-44 space-y-2 text-center">
            <PageHeading>Welcome to Partyreel</PageHeading>
            <p className="text-muted-foreground">
              Collect every photo and video from your event. Your guests just
              scan a QR code. No app required.
            </p>
          </CardContent>
          <CardFooter className="justify-end">
            <Button>
              Continue <ArrowRight />
            </Button>
          </CardFooter>
        </FlowCard>
      </Screen>
      <Screen n={3} of={of} label="The tour, again">
        <FlowCard>
          <CardHeader>
            <Dots step={2} />
          </CardHeader>
          <CardContent className="min-h-44 space-y-4">
            <h2 className="text-center font-heading text-page">
              How it works
            </h2>
            <ul className="space-y-4">
              {HOW_IT_WORKS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Icon className="size-5" />
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </FlowCard>
      </Screen>
      <Screen n={4} of={of} label="The tour's end">
        <FlowCard>
          <CardHeader>
            <Dots step={3} />
          </CardHeader>
          <CardContent className="min-h-44 space-y-2 text-center">
            <h2 className="font-heading text-page">You&rsquo;re all set</h2>
            <p className="text-muted-foreground">
              Create your first event and share the QR with your guests.
              They&rsquo;ll start adding photos in seconds.
            </p>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <ClosingDoors />
          </CardFooter>
        </FlowCard>
      </Screen>
    </>
  );
}

/* ── `one`: the name, one line of promise, the two doors, no tour at all ─── */

/**
 * The name step is not skipped here, it is SHARED: `SetNameStep` sits inside
 * the same screen as the promise and the doors rather than opening its own.
 * The reason-for-a-name line `NameScreen` carries elsewhere is dropped, its
 * job done instead by the one line of product promise this shape's whole
 * argument rests on.
 */
function OneScreen() {
  return (
    <FlowCard>
      <CardHeader className="space-y-1">
        <PageHeading>Welcome to Partyreel</PageHeading>
        <p className="text-muted-foreground">
          Collect every photo and video from your event. Your guests just
          scan a QR code, no app required.
        </p>
      </CardHeader>
      <CardContent>
        <SetNameStep
          title="Add your name"
          prefill=""
          submitLabel="Continue"
          onSaved={() => {}}
        />
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <ClosingDoors />
      </CardFooter>
    </FlowCard>
  );
}

/* ── the stack ────────────────────────────────────────────────────────────── */

export function WelcomeFlowStack({
  shape,
  screen,
}: {
  shape: WelcomeShape;
  screen: ScreenId;
}) {
  const of = WELCOME_SCREENS[shape];
  return (
    <div className={cn("min-h-screen bg-background", screen === "375" && "px-1")}>
      <AppShell>
        <div className="flex flex-col gap-8">
          {shape === "one" ? (
            <Screen n={1} of={of} label="The name, the promise, the doors">
              <OneScreen />
            </Screen>
          ) : (
            <Screen n={1} of={of} label="The name">
              <NameScreen submitLabel="Continue" />
            </Screen>
          )}

          {shape === "cards" && <CardsSteps of={of} />}
          {shape === "stage" && <StageSteps screen={screen} of={of} />}
          {shape === "film" && <FilmSteps of={of} />}
        </div>
      </AppShell>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { ArrowRight, CalendarPlus, Share2 } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { AppShell } from "@/components/shared/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { SetNameStep } from "@/components/shared/set-name-step";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HOW_IT_WORKS } from "@/lib/constants/how-it-works";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

import { BACK } from "./fixtures";
import type { ScreenId } from "./shells";

/**
 * WHAT STANDS BETWEEN A NEW ACCOUNT AND THE APP.
 *
 * ★ THE WHOLE FLOW IS DRAWN, NOT ONE SCREEN OF IT, because the question IS how
 * many screens there are. Each option stacks its own screens down the app's
 * own chrome at their true width, numbered, so "four screens, three of them
 * the marketing site" and "one screen" are things Will sees rather than things
 * a caption claims. A stack is still 1:1 — every card is the shipped card at
 * the width the route gives it — and the frame scrolls exactly as the flow
 * would if it were one page.
 *
 * ★ THE PIECES ARE SHIPPED. `AppShell` (the header the flow runs inside),
 * `SetNameStep` (the one required name step, and the one write path for a
 * display name), `PageHeading`, `Card`, `Button`, `Input`, the `HOW_IT_WORKS`
 * constant the marketing site and the tutorial already share, and `StyledQr`
 * on the product's own default preset. `welcome-flow.tsx`'s three tutorial
 * bodies are quoted because they are module-local to it and take no props:
 * every string below is its own.
 *
 * ★ THE QR ENCODES A LAB STRING. Never a real `/e/<token>`: a board's picture
 * of a code is not a door into anybody's album.
 */

export type WelcomeShape = "tour" | "name" | "first";

/** How many screens each shape puts between the code and the dashboard. */
export const WELCOME_SCREENS: Record<WelcomeShape, number> = {
  tour: 4,
  name: 1,
  first: 3,
};

/* ── the stack ───────────────────────────────────────────────────────────── */

/** One screen of a flow, numbered, so the count is read rather than claimed. */
function Screen({
  n,
  of,
  label,
  children,
}: {
  n: number;
  of: number;
  label: string;
  children: ReactNode;
}) {
  return (
    <div data-ad-screen className="flex flex-col gap-2">
      <p className="mx-auto w-full max-w-lg text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {n} of {of} · {label}
      </p>
      {children}
    </div>
  );
}

/** The card every screen of the flow is drawn in, as the shipped flow draws it. */
function FlowCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("mx-auto w-full max-w-lg", className)}>{children}</Card>
  );
}

/* ── the screens themselves ──────────────────────────────────────────────── */

/** The one screen all three shapes share: the required display name. */
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

/** The dots the tutorial draws over every one of its three screens. */
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

/** The event the new host makes on their way in, and the code it ends on. */
function FirstEventScreen() {
  return (
    <FlowCard>
      <CardHeader className="space-y-1">
        <PageHeading>Your first event</PageHeading>
        <p className="text-muted-foreground">
          Name it and pick the day. You can change both later.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="ad-event-name">Event name</Label>
          <Input id="ad-event-name" defaultValue={BACK.event.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ad-event-date">Date</Label>
          <Input id="ad-event-date" type="date" defaultValue={BACK.event.date} />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          Make the code <ArrowRight />
        </Button>
      </CardFooter>
    </FlowCard>
  );
}

function QrScreen() {
  return (
    <FlowCard>
      <CardHeader className="space-y-1 text-center">
        <PageHeading>{BACK.event.name} is live</PageHeading>
        <p className="text-muted-foreground">
          Scan it yourself to see what your guests see. No app, no account.
        </p>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="rounded-xl border border-border bg-card p-3">
          <StyledQr
            value="https://partyreel.com/e/lab-preview"
            size={176}
            style={resolveQrPreset(null)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button className="w-full">
          <Share2 /> Share the code
        </Button>
        <Button variant="ghost" className="w-full">
          Go to my dashboard
        </Button>
      </CardFooter>
    </FlowCard>
  );
}

/* ── the three flows ─────────────────────────────────────────────────────── */

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
          {shape === "name" ? (
            <Screen n={1} of={of} label="The name, and in">
              <NameScreen submitLabel="Go to my dashboard" />
            </Screen>
          ) : (
            <Screen n={1} of={of} label="The name">
              <NameScreen submitLabel="Continue" />
            </Screen>
          )}

          {shape === "tour" && (
            <>
              <Screen n={2} of={of} label="The tour">
                <FlowCard>
                  <CardHeader>
                    <Dots step={1} />
                  </CardHeader>
                  <CardContent className="min-h-44 space-y-2 text-center">
                    <PageHeading>Welcome to Partyreel</PageHeading>
                    <p className="text-muted-foreground">
                      Collect every photo and video from your event. Your guests
                      just scan a QR code. No app, no accounts.
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
                            <p className="text-sm text-muted-foreground">
                              {body}
                            </p>
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
                    <h2 className="font-heading text-page">
                      You&rsquo;re all set
                    </h2>
                    <p className="text-muted-foreground">
                      Create your first event and share the QR with your guests.
                      They&rsquo;ll start adding photos in seconds.
                    </p>
                  </CardContent>
                  <CardFooter className="flex-col gap-3">
                    <Button className="w-full">
                      <CalendarPlus /> Create my first event
                    </Button>
                    <Button variant="ghost" className="w-full">
                      I&rsquo;ll look around first
                    </Button>
                  </CardFooter>
                </FlowCard>
              </Screen>
            </>
          )}

          {shape === "first" && (
            <>
              <Screen n={2} of={of} label="The event">
                <FirstEventScreen />
              </Screen>
              <Screen n={3} of={of} label="The code, live">
                <QrScreen />
              </Screen>
            </>
          )}
        </div>
      </AppShell>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarPlus } from "lucide-react";

import { markWelcomedAction } from "@/app/(app)/actions";
import { ReelPicture } from "@/components/marketing/sections/how-it-works/host-pictures";
import { StepPicture } from "@/components/marketing/sections/how-it-works/step-picture";
import { HOW_IT_WORKS } from "@/lib/constants/how-it-works";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SetNameStep } from "@/components/shared/set-name-step";
import { PageHeading } from "@/components/shared/page-heading";

import "./welcome-flow.css";

// First-time onboarding (app-door round two, `tour=film`, 2026-09-20). Two phases, both reached
// via the /dashboard + /dashboard/new gates:
//   1. "name" — a REQUIRED display name (Phase 1 identity foundation), shown when the account has
//      none. UNTOUCHED by this round: no skip, the public name on every upload, prefilled
//      from an OAuth name if present.
//   2. "tour" — four screens where the original shipped three dot-tracked cards: three of the
//      marketing site's own bespoke how-it-works pictures (StepPicture, QUOTED from
//      sections/how-it-works/ rather than redrawn, so a host's first minute looks like the site
//      that just sold them on the product) breathing under a copy plate, then a closing beat on
//      ReelPicture into the same primary-and-skippable pair as always. Both ends stayed fixed
//      (the name step and the closing pair); the drift (welcome-flow.css) is the one thing this
//      round adds to a picture the marketing site already drew.
// A brand-new account does name -> tour; an already-welcomed but nameless account does name only
// (then straight to /dashboard); a named-but-unwelcomed account does the tour only. A nameless
// GUEST-MADE account (hosting nothing, holding a Guest card) does name only as well: /welcome
// passes it needsWelcome={false}, and its dashboard's first visit marks it welcomed
// (`MarkWelcomedOnMount`, app/(app)/welcome/mark-welcomed.tsx), because the tour is a host's and
// it came for its Guest card. Each tour exit persists welcomed_at via markWelcomedAction BEFORE
// navigating so the gate doesn't bounce back (skipped when the tour wasn't owed, since the
// marker is then either set already or the dashboard's to set).

const TOUR_STEP_COUNT = 4;

/** The welcome tutorial quotes the host's first three steps (how-it-works.ts); the closing beat
 *  (screen 4) is drawn fresh below, since nothing in the loop's six steps is "you're all set". */
const [CREATE, SHARE, FILL] = HOW_IT_WORKS;

/** The dots the tour draws over its four screens, unchanged from the shipped tutorial's own. */
function TourDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: TOUR_STEP_COUNT }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "size-1.5 rounded-full transition-colors",
            i + 1 === step
              ? "bg-brand"
              : i + 1 < step
                ? "bg-foreground"
                : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}

/**
 * One live beat of the tour: a bespoke how-it-works picture breathing under a
 * copy plate that overlaps its bottom edge — the exact composition app-door
 * round two drew and Will confirmed (`tour=film`, recommended).
 *
 * ★ THE FRAME THAT CLIPS IS A SEPARATE ELEMENT FROM THE ONE THAT SCALES, so
 * the picture pans inside a fixed window instead of growing past its own
 * rounded corner (welcome-flow.css's `.welcome-film-live`).
 *
 * ★ aria-hidden ON THE PICTURE, never the plate: the copy carries the
 * meaning, the same rule the marketing spine draws these pictures under
 * (sections/how-it-works/spine.tsx).
 */
function FilmBeat({
  title,
  body,
  centered = false,
  children,
}: {
  title: string;
  body: string;
  centered?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative pb-10">
      <div aria-hidden className="relative overflow-hidden rounded-2xl">
        <div className="welcome-film-live">{children}</div>
      </div>
      <div
        className={cn(
          "absolute inset-x-4 -bottom-2 rounded-xl border bg-card p-4 shadow-lift ring-1 ring-foreground/5",
          centered && "text-center",
        )}
      >
        <h2 className="font-heading text-subsection">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

export function WelcomeFlow({
  needsName,
  needsWelcome,
  namePrefill,
}: {
  needsName: boolean;
  needsWelcome: boolean;
  namePrefill: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"name" | "tour">(
    needsName ? "name" : "tour",
  );
  const [step, setStep] = useState(1);
  const [isLeaving, startLeaving] = useTransition();

  function leave(to: string) {
    startLeaving(async () => {
      if (needsWelcome) await markWelcomedAction();
      router.push(to);
    });
  }

  if (phase === "name") {
    return (
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader className="space-y-1">
          <PageHeading>Welcome to Partyreel</PageHeading>
          <p className="text-muted-foreground">
            First, the name your guests will see on the photos you add.
          </p>
        </CardHeader>
        <CardContent>
          <SetNameStep
            title="Add your name"
            prefill={namePrefill}
            submitLabel={needsWelcome ? "Continue" : "Save and continue"}
            onSaved={() => {
              if (needsWelcome) setPhase("tour");
              else router.push("/dashboard");
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <TourDots step={step} />
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => leave("/dashboard")}
          disabled={isLeaving}
        >
          Skip
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {step === 1 && (
          <FilmBeat title={CREATE.title} body={CREATE.body}>
            <StepPicture id="create" />
          </FilmBeat>
        )}
        {step === 2 && (
          <FilmBeat title={SHARE.title} body={SHARE.body}>
            <StepPicture id="share" />
          </FilmBeat>
        )}
        {step === 3 && (
          <FilmBeat title={FILL.title} body={FILL.body}>
            <StepPicture id="fill" />
          </FilmBeat>
        )}
        {step === 4 && (
          <FilmBeat
            centered
            title="You're all set"
            body="Create your first event and share the code."
          >
            <ReelPicture />
          </FilmBeat>
        )}

        {step < TOUR_STEP_COUNT ? (
          <div
            className={cn(
              "flex items-center",
              step > 1 ? "justify-between" : "justify-end",
            )}
          >
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft /> Back
              </Button>
            )}
            <Button onClick={() => setStep(step + 1)}>
              Continue <ArrowRight />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Button
              className="w-full"
              onClick={() => leave("/dashboard/new")}
              disabled={isLeaving}
            >
              <CalendarPlus /> Create my first event
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => leave("/dashboard")}
              disabled={isLeaving}
            >
              I&rsquo;ll look around first
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

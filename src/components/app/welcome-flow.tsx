"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarPlus } from "lucide-react";

import { markWelcomedAction } from "@/app/(app)/actions";
import { HOW_IT_WORKS } from "@/lib/constants/how-it-works";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { SetNameStep } from "@/components/shared/set-name-step";

const STEP_COUNT = 3;

// First-time onboarding. Two phases, both reached via the /dashboard + /dashboard/new gates:
//   1. "name" — a REQUIRED display name (Phase 1 identity foundation), shown when the account has
//      none. No skip; it's the public name on every upload. Prefilled from an OAuth name if present.
//   2. "tutorial" — the original 3-step intro, shown when welcomed_at is null.
// A brand-new account does name -> tutorial; an already-welcomed but nameless account does name
// only (then straight to /dashboard); a named-but-unwelcomed account does the tutorial only. Each
// exit persists welcomed_at via markWelcomedAction BEFORE navigating so the gate doesn't bounce back
// (skipped when the tutorial wasn't shown, since welcomed_at is already set).
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
  const [phase, setPhase] = useState<"name" | "tutorial">(
    needsName ? "name" : "tutorial",
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
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to Partyreel
          </h1>
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
              if (needsWelcome) setPhase("tutorial");
              else router.push("/dashboard");
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-4 text-muted-foreground"
          onClick={() => leave("/dashboard")}
          disabled={isLeaving}
        >
          Skip
        </Button>
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
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
      </CardHeader>

      <CardContent className="min-h-44">
        {step === 1 && (
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome to Partyreel
            </h1>
            <p className="text-muted-foreground">
              Collect every photo and video from your event. Your guests just
              scan a QR code. No app, no accounts.
            </p>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-center text-lg font-semibold tracking-tight">
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
          </div>
        )}
        {step === 3 && (
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              You&rsquo;re all set
            </h2>
            <p className="text-muted-foreground">
              Create your first event and share the QR with your guests.
              They&rsquo;ll start adding photos in seconds.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-3">
        {step < STEP_COUNT ? (
          <div
            className={cn(
              "flex w-full items-center",
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
          <>
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
          </>
        )}
      </CardFooter>
    </Card>
  );
}

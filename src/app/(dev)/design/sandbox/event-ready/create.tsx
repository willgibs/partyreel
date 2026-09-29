"use client";

import type { ReactNode } from "react";
import { ArrowRight, Check, Copy, Printer } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

import { HostPage } from "./app";
import { headOf } from "./checklist";
import { THIRTIETH_URL } from "./fixtures";
import type { Readiness } from "./readiness";

/**
 * CREATE, QUOTED: `create-event-wizard.tsx`'s card (its title and line, its
 * numbered steps, the beat's code in its mat, Print and Share, and the way
 * on), redrawn in its own classes and words. The wizard is one island over a
 * form and a Server Action that creates a real event, and the beat is not
 * exported, so it cannot be mounted here; every primitive it draws with is
 * production's own (the card, the button, the code).
 *
 * ★ `hand` KEEPS THE BEAT'S ORDER: the code is still the subject, first and
 * whole, and what is left sits under it as a short list with one way on,
 * Get it ready. `share` grows Create's own steps instead (the door and the
 * welcome before the beat), which is the one option that reopens your
 * first-event pick, `asks=one`, and says so.
 */

const TODAY_STEPS = ["Name", "Style", "Ready"] as const;
export const SHARED_STEPS = [
  "Name",
  "Style",
  "Door",
  "Welcome",
  "Ready",
] as const;

/** The card's numbered steps, the wizard's own `ol`. */
function Steps({
  steps,
  at,
}: {
  steps: readonly string[];
  /** The step on screen, 1-based. */
  at: number;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-xs">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === at;
        const done = n < at;
        return (
          <li
            key={label}
            data-er-create-step
            className="flex items-center gap-2"
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-micro font-medium",
                active
                  ? "bg-brand text-brand-foreground"
                  : done
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3" /> : n}
            </span>
            <span
              className={cn(
                active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {n < steps.length && (
              <ArrowRight className="size-3 text-muted-foreground" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** The card around a step, as the wizard lays it on its page. */
export function CreateCard({
  title,
  line,
  steps,
  at,
  children,
  foot,
}: {
  title: string;
  line: string;
  steps: readonly string[];
  at: number;
  children: ReactNode;
  foot: ReactNode;
}) {
  return (
    <HostPage wide={false}>
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <CardTitle data-er-create-title>{title}</CardTitle>
          <CardDescription>{line}</CardDescription>
          <Steps steps={steps} at={at} />
        </CardHeader>
        {children}
        {foot}
      </Card>
    </HostPage>
  );
}

/** The beat's subject: the code in its mat, and the event's name under it. */
function CodeInMat() {
  return (
    <div className="flex justify-center">
      <span className="inline-flex flex-col items-center gap-3 rounded-[var(--radius-tile)] border bg-card p-3 shadow-layer">
        <span className="rounded-md bg-white p-3 shadow-lift ring-1 ring-border">
          <StyledQr
            value={THIRTIETH_URL}
            size={240}
            style={resolveQrPreset("classic")}
            className="[&>svg]:block"
          />
        </span>
        <span className="max-w-[240px] truncate text-center text-sm font-medium">
          {"Maya's 30th"}
        </span>
      </span>
    </div>
  );
}

/** Print and Share, the beat's two doors out. */
function TwoDoors() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Button variant="outline" tabIndex={-1} data-er-door-out>
        <Printer /> Print the table cards
      </Button>
      <Button variant="outline" tabIndex={-1} data-er-door-out>
        <Copy /> Share the link
      </Button>
    </div>
  );
}

/** Today's beat, as it ships. */
export function TodayBeat({
  steps = TODAY_STEPS,
}: {
  steps?: readonly string[];
}) {
  return (
    <CreateCard
      title="Maya's 30th is live"
      line="One thing left: get the code where your guests will be."
      steps={steps}
      at={steps.length}
      foot={
        <CardFooter className="justify-end">
          <Button tabIndex={-1} data-er-door-out>
            Go to your event <ArrowRight />
          </Button>
        </CardFooter>
      }
    >
      <CardContent className="space-y-5">
        <CodeInMat />
        <TwoDoors />
      </CardContent>
    </CreateCard>
  );
}

/**
 * THE BEAT, HANDING OVER: the same code and doors, then what is left in one
 * short list (the checklist's rows still open, titles only), and Get it ready
 * as the way on, the event itself one quieter tap beside it.
 */
export function HandingBeat({ r, into }: { r: Readiness; into: string }) {
  const head = headOf(r);
  return (
    <CreateCard
      title="Maya's 30th is live"
      line="Get the code out, then finish what is left before guests arrive."
      steps={TODAY_STEPS}
      at={3}
      foot={
        <CardFooter className="flex-col-reverse items-stretch gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" tabIndex={-1} data-er-door-out>
            Go to your event
          </Button>
          <Button tabIndex={-1} data-er-door-out>
            {into} <ArrowRight />
          </Button>
        </CardFooter>
      }
    >
      <CardContent className="space-y-5">
        <CodeInMat />
        <TwoDoors />
        <div
          data-er-list=""
          data-er-home="on Create's last screen"
          className="rounded-lg bg-muted/40 px-3 py-2.5"
        >
          <p data-er-list-head className="text-sm font-medium">
            {head.title}
          </p>
          <p className="text-caption text-muted-foreground">{head.line}</p>
          <ul className="mt-2 space-y-1">
            {r.left.map((item) => (
              <li
                key={item.id}
                data-er-item={item.id}
                className={cn(
                  "flex items-center gap-2 text-caption",
                  item.essential ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  aria-hidden
                  className="size-3.5 shrink-0 rounded-full ring-[1.5px] ring-foreground/25 ring-inset"
                />
                <span>
                  {item.essential ? item.title : `${item.title}, worth doing`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </CreateCard>
  );
}

/**
 * CREATE WALKING THE FIRST STEPS: a step of the grown wizard, its body the
 * real settings page (the event exists from Style's Create on, so the page
 * saves as it goes, exactly as in Settings), Skip beside Continue.
 */
export function SharedStep({
  at,
  title,
  line,
  children,
}: {
  at: number;
  title: string;
  line: string;
  children: ReactNode;
}) {
  return (
    <CreateCard
      title={title}
      line={line}
      steps={SHARED_STEPS}
      at={at}
      foot={
        <CardFooter className="justify-between">
          <Button variant="ghost" tabIndex={-1} data-er-door-out>
            Skip
          </Button>
          <Button tabIndex={-1} data-er-door-out>
            Continue <ArrowRight />
          </Button>
        </CardFooter>
      }
    >
      <CardContent>{children}</CardContent>
    </CreateCard>
  );
}

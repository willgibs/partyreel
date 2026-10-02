"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Bell, Check, X } from "lucide-react";

import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { EVENT } from "./fixtures";

/**
 * THE THREE SHAPES CREATE CAN TAKE, as shells a step's content drops into:
 *
 *  - `card`: today's place inside the app (its bar, Back to events, a card of
 *    `max-w-xl`), every step cut to its question, its picture and one action;
 *  - `screen`: Create takes the whole screen as a room of its own, dark in
 *    both themes (the carried call `room`), a hairline of four at its head;
 *  - `preview`: a studio: the steps stack on the left and fold to their
 *    answers, and the right is a stage where what guests will get changes as
 *    she picks.
 *
 * Every control is production's (`Button`, `Logo`, `Avatar`, `Container`),
 * drawn at rest and inert (`tabIndex={-1}`). A layout switches on the frame's
 * width by a prop, never a breakpoint class: a lab utility's `sm:` loses to
 * production's own layer (design.css), and the frame's width is known.
 */

export type StepN = 1 | 2 | 3 | 4;

/** The four steps, by the names the studio's list wears. */
export const STEP_TITLES: Record<StepN, string> = {
  1: "Name",
  2: "How guests add",
  3: "The code's look",
  4: "Live",
};

/* ── the pieces every shape shares ──────────────────────────────────────── */

/** Four hairlines, the steps done and the one she is on filled. */
export function Progress({
  at,
  className,
}: {
  at: StepN;
  className?: string;
}) {
  return (
    <span
      data-cw-progress={at}
      className={cn("flex items-center gap-1.5", className)}
      aria-hidden
    >
      {([1, 2, 3, 4] as const).map((n) => (
        <span
          key={n}
          className={cn(
            "h-[3px] flex-1 rounded-full",
            n <= at ? "bg-foreground" : "bg-foreground/15",
          )}
        />
      ))}
    </span>
  );
}

/** The app's bar, as `AppShell` draws it: the wordmark, the bell, her avatar. */
function AppBar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-14 items-center gap-4">
        <span className="shrink-0">
          <Logo />
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            tabIndex={-1}
            aria-label="Notifications"
          >
            <Bell />
          </Button>
          <Avatar size="sm" seed={EVENT.seed}>
            <AvatarFallback className="text-[10px]">
              {EVENT.host.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        </span>
      </Container>
    </header>
  );
}

/** One step's way on: Back where there is one, and the one action. */
export type Actions = {
  back?: boolean;
  /** The quieter way out the beat keeps beside its action. */
  aside?: string;
  go: string;
  arrow?: boolean;
};

/* ── card: a quiet card in the app ──────────────────────────────────────── */

export function CardPage({
  wide,
  at,
  title,
  sub,
  actions,
  children,
}: {
  wide: boolean;
  at: StepN;
  title: ReactNode;
  /** One quiet line under the question, where the step needs one. */
  sub?: string;
  actions: Actions;
  children: ReactNode;
}) {
  return (
    <div data-cw-screen className="min-h-screen bg-background text-foreground">
      <AppBar />
      <main className={wide ? "py-8" : "py-5"}>
        <Container>
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="size-4" /> Back to events
          </span>
          <div
            className={cn(
              "mx-auto mt-5 w-full max-w-xl rounded-xl border bg-card text-card-foreground",
              wide ? "p-7" : "p-5",
            )}
          >
            <Progress at={at} />
            <h1 className="mt-6 font-heading text-subsection">{title}</h1>
            {sub && (
              <p className="mt-1 text-caption text-muted-foreground">{sub}</p>
            )}
            <div className="mt-5">{children}</div>
            <div className="mt-7 flex items-center gap-2">
              {actions.back && (
                <Button variant="ghost" tabIndex={-1}>
                  <ArrowLeft /> Back
                </Button>
              )}
              {actions.aside && (
                <Button variant="ghost" tabIndex={-1}>
                  {actions.aside}
                </Button>
              )}
              <Button data-cw-go size="lg" className="ml-auto" tabIndex={-1}>
                {actions.go}
              </Button>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}

/* ── screen: a room of its own ──────────────────────────────────────────── */

export function Room({
  wide,
  at,
  actions,
  children,
}: {
  wide: boolean;
  at: StepN;
  actions: Actions;
  children: ReactNode;
}) {
  return (
    <div
      data-cw-screen
      className="dark relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground"
    >
      <span className="cw-room-light" aria-hidden />
      <header
        className={cn(
          "relative flex h-16 shrink-0 items-center",
          wide ? "px-8" : "px-3",
        )}
      >
        <Button variant="ghost" size="icon-lg" tabIndex={-1} aria-label="Close">
          <X />
        </Button>
        <Progress
          at={at}
          className={cn(
            "absolute left-1/2 -translate-x-1/2",
            wide ? "w-56" : "w-40",
          )}
        />
      </header>
      <main
        className={cn(
          "relative flex min-h-0 flex-1 flex-col items-center justify-center",
          wide ? "px-12" : "px-5",
        )}
      >
        {children}
      </main>
      <footer
        className={cn(
          "relative flex shrink-0 items-center gap-3",
          wide ? "px-8 pt-4 pb-8" : "px-4 pt-3 pb-5",
        )}
      >
        {actions.back && (
          <Button
            variant="ghost"
            size={wide ? "lg" : "icon-lg"}
            tabIndex={-1}
            aria-label="Back"
          >
            <ArrowLeft />
            {wide && "Back"}
          </Button>
        )}
        {actions.aside && (
          <Button variant="ghost" size="lg" tabIndex={-1}>
            {actions.aside}
          </Button>
        )}
        <Button
          data-cw-go
          size="cta"
          tabIndex={-1}
          className={wide ? "ml-auto min-w-44" : "flex-1"}
        >
          {actions.go}
        </Button>
      </footer>
    </div>
  );
}

/* ── preview: a studio, the steps beside what guests get ───────────────── */

/** One step in the studio's list: done (folded to its answer), now (open), or next. */
export function Item({
  n,
  state,
  answer,
  children,
}: {
  n: StepN;
  state: "done" | "now" | "next";
  answer?: string;
  children?: ReactNode;
}) {
  const mark =
    state === "done" ? (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    ) : (
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
          state === "now"
            ? "bg-foreground text-background"
            : "bg-muted text-muted-foreground",
        )}
      >
        {n}
      </span>
    );
  return (
    <div
      data-cw-item={state}
      className={cn("border-b border-border", state === "now" ? "py-5" : "py-3.5")}
    >
      <div className="flex items-center gap-3">
        {mark}
        {state === "now" ? (
          <h2 className="font-heading text-card-title">{STEP_TITLES[n]}</h2>
        ) : (
          <span
            className={cn(
              "text-sm",
              state === "done"
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {STEP_TITLES[n]}
          </span>
        )}
        {state === "done" && answer && (
          <span className="ml-auto min-w-0 truncate text-sm text-muted-foreground">
            {answer}
          </span>
        )}
      </div>
      {state === "now" && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function Studio({
  wide,
  list,
  stage,
}: {
  wide: boolean;
  /** The four steps, folded and open. */
  list: ReactNode;
  /** What guests will get, drawn live. */
  stage: ReactNode;
}) {
  const bar = (
    <header
      className={cn(
        "flex shrink-0 items-center gap-3 border-b",
        wide ? "h-14 px-6" : "h-12 px-4",
      )}
    >
      <Logo className="h-5" />
      <span className="text-sm text-muted-foreground">New event</span>
      <Button
        variant="ghost"
        size={wide ? "default" : "icon"}
        tabIndex={-1}
        className="ml-auto"
        aria-label="Close"
      >
        <X />
        {wide && "Close"}
      </Button>
    </header>
  );
  if (!wide)
    return (
      <div
        data-cw-screen
        className="flex min-h-screen flex-col bg-background text-foreground"
      >
        {bar}
        <section className="cw-stage relative flex h-[236px] shrink-0 items-center justify-center overflow-hidden">
          {stage}
        </section>
        <div className="px-5 pb-6">{list}</div>
      </div>
    );
  return (
    <div
      data-cw-screen
      className="flex h-screen flex-col bg-background text-foreground"
    >
      {bar}
      <div className="flex min-h-0 flex-1">
        <aside className="w-[500px] shrink-0 overflow-hidden border-r px-9 pt-4">
          {list}
        </aside>
        <section className="cw-stage relative flex min-w-0 flex-1 items-center justify-center overflow-hidden">
          {stage}
        </section>
      </div>
    </div>
  );
}

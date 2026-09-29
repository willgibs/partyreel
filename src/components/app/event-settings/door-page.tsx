"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Globe, Info, Lock, UserRound, UsersRound } from "lucide-react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { toast } from "sonner";

import { EventPasswordControl } from "@/components/app/event-password-control";
import { LockChip } from "@/components/app/pricing/lock-chip";
import { SettingsCard } from "@/components/app/event-settings/settings-furniture";
import { useSettings } from "@/components/app/event-settings/settings-state";
import { ConfirmSwitch } from "@/components/ui/confirm-switch";
import { ConsequenceLine } from "@/components/ui/consequence-line";
import { Dormant } from "@/components/ui/dormant";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { isSettingLocked } from "@/lib/constants/tiers";
import {
  doorForStep,
  gateOf,
  PRIVATE_GATES,
  stepOf,
  type Door,
  type DoorStep,
  type PrivateGate,
} from "@/lib/event/door/door";
import { cameInLine } from "@/lib/event/door/words";
import {
  DOOR_STEP_LABELS,
  DOOR_STEP_LINES,
  GATE_HELP,
  GATE_LABELS,
  GATE_LINES,
} from "@/lib/events/visibility-labels";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

/**
 * WHO CAN GET IN, THE DOOR IN STEPS (event-settings r1, Will `join=steps`: "I love stepping this, so
 * they can visualize the guest path and more easily understand how each setting applies"), numbered in
 * the order a guest meets them:
 *   1. what the link opens: Public, Private (a gate), or Only me;
 *   2. under Private, the gate: a password, you let each person in, your invite list, or only people
 *      already in, each with one line on what a guest meets and its purpose one tap away behind (i);
 *   3. an email first, held on by the two gates that match an address;
 *   4. a photo first.
 *
 * ★ ONE RULE FOR EVERYONE ALREADY IN: a gate stops newcomers, and only Only me and a block shut out
 * someone already in. So under a gate the page says how many are in ("31 guests are already in"), and a
 * change that reaches people says what it does before it happens, in its own place (the consequence
 * line): Only me closes them out; Public lets everyone waiting straight in.
 *
 * ★ WHAT DOES NOTHING RIGHT NOW STAYS IN VIEW, DORMANT: under Only me the steps after the first (nobody
 * reaches them), under Public the gates (a hint at what Private keeps), and A photo first while uploads
 * are paused.
 */

const STEP_ICON: Record<DoorStep, typeof Globe> = {
  public: Globe,
  private: Lock,
  only_me: UserRound,
};

const STEPS: readonly DoorStep[] = ["public", "private", "only_me"];

const people = (n: number, one: string, many: string) =>
  `${formatCount(n)} ${n === 1 ? one : many}`;

/** A consequential door: what the line says, and what its button does. */
function consequenceOf(
  next: Door,
  counts: { in: number; waiting: number },
): { line: string; confirm: string } | null {
  if (next === "private" && counts.in > 0) {
    return {
      line: `${people(counts.in, "guest is", "guests are")} already in. Only me closes them out completely, until you open it again.`,
      confirm: "Close it to everyone",
    };
  }
  if (next === "open" && counts.waiting > 0) {
    return {
      line: `${people(counts.waiting, "person is", "people are")} waiting at the door. Public lets them straight in.`,
      confirm: "Let them in, and open it",
    };
  }
  if (next === "closed" && counts.waiting > 0) {
    return {
      line: `${people(counts.waiting, "person is", "people are")} waiting at the door. Closing it to newcomers keeps them out.`,
      confirm: "Close it to newcomers",
    };
  }
  return null;
}

/** One step of the door: its number on the rail running down to the next, its setting beside it. */
function Step({
  n,
  title,
  last = false,
  children,
}: {
  n: number;
  /** The step's name over its setting; left out where the setting's own label is the name (a switch). */
  title?: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <li data-door-step={n} className="flex gap-3">
      <span className="relative flex w-5 shrink-0 justify-center self-stretch">
        {!last && (
          <span
            aria-hidden
            className="absolute top-6 -bottom-5 w-px bg-border"
          />
        )}
        <span
          aria-hidden
          className="relative flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground tabular-nums"
        >
          {n}
        </span>
      </span>
      <div className="min-w-0 flex-1 space-y-2.5">
        {title ? (
          <p className="text-sm font-medium">
            <span className="sr-only">{`Step ${n}: `}</span>
            {title}
          </p>
        ) : null}
        {children}
      </div>
    </li>
  );
}

/** The (i) beside a gate: what it is for, one tap away (never an article link per row). */
function GateHelp({ gate }: { gate: PrivateGate }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`What ${GATE_LABELS[gate].toLowerCase()} is for`}
          className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none"
        >
          <Info className="size-4" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 text-sm text-pretty">
        <p className="font-medium">{GATE_LABELS[gate]}</p>
        <p className="mt-1 text-muted-foreground">{GATE_HELP[gate]}</p>
      </PopoverContent>
    </Popover>
  );
}

export function DoorPage({ guestsHref }: { guestsHref: string }) {
  const s = useSettings();
  const v = s.values;
  const counts = s.counts;
  const step = stepOf(v.door);
  const gate = gateOf(v.door);
  // A door waiting on its consequence line, and whether a password is being set for the first time.
  const [pending, setPending] = useState<Door | null>(null);
  const [settingPassword, setSettingPassword] = useState(false);
  const passwordLocked = isSettingLocked("password", s.tier);

  async function apply(next: Door) {
    setPending(null);
    const answer = await s.saveDoor(next);
    if (answer && answer.admitted > 0) {
      toast.success(cameInLine(answer.admitted));
    }
  }

  function choose(next: Door) {
    if (next === v.door) {
      setPending(null);
      return;
    }
    // A password needs one set first: the control asks for it, and setting it opens that door.
    if (next === "password" && !v.hasPassword) {
      setPending(null);
      setSettingPassword(true);
      return;
    }
    setSettingPassword(false);
    if (consequenceOf(next, counts)) {
      setPending(next);
      return;
    }
    void apply(next);
  }

  const consequence = pending ? consequenceOf(pending, counts) : null;
  const heldEmail =
    v.door === "approve"
      ? "On while you let each person in: it matches a confirmed address."
      : v.door === "invite"
        ? "On while your invite list is the way in: it matches a confirmed address."
        : null;
  // What the gate list shows as chosen: the door's own gate, or the password being set.
  const shownGate: PrivateGate | null = settingPassword ? "password" : gate;
  const shownStep: DoorStep =
    pending && stepOf(pending) !== "private"
      ? stepOf(pending)
      : settingPassword
        ? "private"
        : step;

  return (
    <div className="space-y-3">
      <SettingsCard label="Who can get in">
        {/* The steps as one numbered list in two parts: the first always live, the rest dormant under
            Only me, each part a list of its own so the dormant wrapper never stands inside an <ol>. */}
        <div className="space-y-5 px-4 py-4">
          <ol>
            <Step n={1} title="What the link opens">
              <ToggleGroupPrimitive.Root
                type="single"
                value={shownStep}
                onValueChange={(next) => {
                  if (!next) return;
                  choose(doorForStep(next as DoorStep, v.door, v.hasPassword));
                }}
                aria-label="What the link opens"
                className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
              >
                {STEPS.map((st) => {
                  const Icon = STEP_ICON[st];
                  return (
                    <ToggleGroupPrimitive.Item
                      key={st}
                      value={st}
                      data-door-choice={st}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none motion-reduce:transition-none",
                        "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
                        "data-[state=on]:bg-background data-[state=on]:text-foreground",
                        "active:scale-[0.98] motion-reduce:active:scale-100",
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                      {DOOR_STEP_LABELS[st]}
                    </ToggleGroupPrimitive.Item>
                  );
                })}
              </ToggleGroupPrimitive.Root>
              <p className="text-caption text-pretty text-muted-foreground">
                {DOOR_STEP_LINES[shownStep]}
              </p>
              {consequence && pending && stepOf(pending) !== "private" ? (
                <ConsequenceLine
                  confirmLabel={consequence.confirm}
                  onConfirm={() => void apply(pending)}
                  onCancel={() => setPending(null)}
                  busy={s.saving("door")}
                >
                  {consequence.line}
                </ConsequenceLine>
              ) : null}
            </Step>
          </ol>

          <Dormant
            awake={shownStep !== "only_me"}
            summary="Who may join, an email first and a photo first. Nobody reaches them while only you can get in."
          >
            <ol start={2} className="space-y-5">
              <Step n={2} title="Who may join">
                <Dormant
                  awake={shownStep === "private"}
                  summary="Anyone with the link. Private keeps a gate: a password, letting each person in, your invite list, or only people already in."
                >
                  <div
                    role="radiogroup"
                    aria-label="Who may join"
                    className="space-y-1.5"
                  >
                    {PRIVATE_GATES.map((g) => {
                      const on = shownGate === g;
                      const candidate: Door = g;
                      return (
                        <div
                          key={g}
                          data-door-gate={g}
                          data-state={on ? "on" : "off"}
                          className={cn(
                            "relative rounded-lg border px-3 py-2.5 transition-colors duration-150 motion-reduce:transition-none",
                            on
                              ? "border-foreground/30 bg-muted/40"
                              : "border-border hover:border-foreground/20",
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <button
                              type="button"
                              role="radio"
                              aria-checked={on}
                              onClick={() => choose(candidate)}
                              className="absolute inset-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                            >
                              <span className="sr-only">{GATE_LABELS[g]}</span>
                            </button>
                            <span
                              aria-hidden
                              className={cn(
                                "pointer-events-none relative mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                                on
                                  ? "border-foreground"
                                  : "border-muted-foreground/50",
                              )}
                            >
                              {on ? (
                                <span className="size-2 rounded-full bg-foreground" />
                              ) : null}
                            </span>
                            <span className="pointer-events-none relative min-w-0 flex-1">
                              <span className="block text-sm font-medium">
                                {GATE_LABELS[g]}
                              </span>
                              <span className="block text-caption text-pretty text-muted-foreground">
                                {GATE_LINES[g]}
                              </span>
                            </span>
                            <GateHelp gate={g} />
                          </div>
                          {pending === g && consequence ? (
                            <ConsequenceLine
                              className="relative z-10 mt-2.5"
                              confirmLabel={consequence.confirm}
                              onConfirm={() => void apply(g)}
                              onCancel={() => setPending(null)}
                              busy={s.saving("door")}
                            >
                              {consequence.line}
                            </ConsequenceLine>
                          ) : null}
                          {on && g === "password" ? (
                            <div className="relative z-10 mt-2.5 rounded-lg border border-border/60 bg-background p-3">
                              {passwordLocked && !v.hasPassword ? (
                                <LockChip
                                  feature="password"
                                  returnTo={`/dashboard/${s.eventId}?room=settings&setting=door`}
                                />
                              ) : (
                                <EventPasswordControl
                                  eventId={s.eventId}
                                  hasPassword={v.hasPassword}
                                  locked={passwordLocked}
                                  onPasswordSet={() =>
                                    setSettingPassword(false)
                                  }
                                  onPasswordCleared={() =>
                                    setSettingPassword(false)
                                  }
                                />
                              )}
                            </div>
                          ) : null}
                          {on && g === "invite" ? (
                            <p className="relative z-10 mt-2 text-caption text-pretty text-muted-foreground">
                              {`Only people you invite · ${formatCount(counts.invited)} invited · `}
                              <Link
                                href={`${guestsHref}#invited`}
                                className="font-medium text-foreground underline underline-offset-4"
                              >
                                Manage in Guests
                              </Link>
                            </p>
                          ) : null}
                          {on && g === "approve" && counts.waiting > 0 ? (
                            <p className="relative z-10 mt-2 text-caption text-pretty text-muted-foreground">
                              {`${people(counts.waiting, "person is", "people are")} waiting at the door · `}
                              <Link
                                href={`${guestsHref}#at-the-door`}
                                className="font-medium text-foreground underline underline-offset-4"
                              >
                                Let them in from Guests
                              </Link>
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  {gate && counts.in > 0 ? (
                    <p
                      data-door-inside=""
                      className="mt-2.5 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm"
                    >
                      <UsersRound
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span>
                        <span className="font-medium tabular-nums">
                          {`${people(counts.in, "guest is", "guests are")} already in.`}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {"A gate stops newcomers; everyone in keeps adding."}
                        </span>
                      </span>
                    </p>
                  ) : null}
                </Dormant>
              </Step>

              <Step n={3}>
                <ConfirmSwitch
                  label="An email first"
                  description={
                    heldEmail ??
                    "Every photo then has a confirmed address behind it."
                  }
                  checked={v.requireVerifiedEmail || Boolean(heldEmail)}
                  disabled={Boolean(heldEmail)}
                  onCheckedChange={(next) =>
                    void s.saveEvent({ requireVerifiedEmail: next })
                  }
                  confirmWhen={(next) => !next}
                  dialogTitle="Stop asking for an email first?"
                  dialogDescription="Guests will add photos under a name they type, with no email behind it. Names stay on every photo, but nothing proves who typed them, so abuse is harder to trace. You can turn this back on anytime."
                  confirmLabel="Use names only"
                  cancelLabel="Keep asking for an email"
                />
              </Step>

              <Step n={4} last>
                <Dormant
                  awake={v.acceptingUploads}
                  summary="A photo first: uploads are paused, so nobody can add one. It applies again when they reopen."
                >
                  <ConfirmSwitch
                    label="A photo first"
                    description="Guests add one photo or video of their own before they see everything."
                    checked={v.requireUploadToView}
                    onCheckedChange={(next) =>
                      void s.saveEvent({ requireUploadToView: next })
                    }
                    confirmWhen={(next) => next}
                    dialogTitle="Ask for a photo before the album?"
                    dialogDescription="Guests will see a few preview photos and add one of their own before the album opens. If uploads are closed or the album is full, the album opens anyway. You can turn this off anytime."
                    confirmLabel="Ask for a photo"
                    cancelLabel="Leave it open"
                  />
                </Dormant>
              </Step>
            </ol>
          </Dormant>
        </div>
      </SettingsCard>
    </div>
  );
}

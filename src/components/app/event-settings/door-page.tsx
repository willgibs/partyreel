"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Globe,
  Info,
  KeyRound,
  Lock,
  UserRound,
  UsersRound,
} from "lucide-react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { toast } from "sonner";

import { EventPasswordControl } from "@/components/app/event-password-control";
import { LockChip } from "@/components/app/pricing/lock-chip";
import {
  RadioCard,
  RadioCards,
} from "@/components/app/event-settings/radio-cards";
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
import { cameInLine, listedWouldComeInLine } from "@/lib/event/door/words";
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
 * line): Only me closes them out; Public lets everyone waiting straight in; a password ends every ask at
 * the door (migration 20260929230000: nobody waits on the host there), so the people waiting need it too.
 *
 * ★ A FIRST PASSWORD SAYS BOTH GROUPS WHERE SHE TYPES IT (host-moments r1, `password=both`): a gate going on
 * mid-party is the moment a host fears she is locking her own guests out, so before she types it the field
 * says, a line a group, that the guests in stay in on every phone and that the people at the door stop waiting
 * on her and get in with it. The two lines take the place of the field's waiting line and the gates' inside
 * note, so neither group is said twice; with nobody in and nobody waiting, nothing more is said.
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

/** What a password does to the people waiting at the door: their asks end, and it asks them for it. */
const passwordLine = (waiting: number) =>
  `${people(waiting, "person is", "people are")} waiting at the door. A password asks them for it too.`;

/**
 * WHAT A FIRST PASSWORD DOES TO EACH GROUP (`password=both`): its count and its fact first, what it means after,
 * a line only for a group someone is in.
 */
export function passwordGroups(counts: { in: number; waiting: number }): {
  group: "in" | "waiting";
  lead: string;
  rest: string;
}[] {
  const lines: { group: "in" | "waiting"; lead: string; rest: string }[] = [];
  // Each verb agrees with its count ("1 guest is in, and stays in"), as the door's other lines do.
  if (counts.in > 0) {
    lines.push({
      group: "in",
      lead: `${people(counts.in, "guest is in, and stays in", "guests are in, and stay in")}`,
      rest: "on every phone they used. Nobody inside is asked for it.",
    });
  }
  if (counts.waiting > 0) {
    lines.push({
      group: "waiting",
      lead: `${people(counts.waiting, "person waits", "people wait")} at the door`,
      rest: `and ${counts.waiting === 1 ? "stops" : "stop"} waiting on you: they get in with the password, like anyone new.`,
    });
  }
  return lines;
}

const GROUP_ICON = { in: UsersRound, waiting: KeyRound } as const;

/**
 * What a gate does to everyone already in, said under the gates (`data-door-inside`). ★ TRUE OF THE GUESTS IN BY NAME
 * TOO (crumbs-89): while An email first is on, a guest in on a name alone confirms an email before she adds again, so
 * "everyone in keeps adding" says when for them, where any are in.
 */
export function insideNote(inByName: number, emailOn: boolean): string {
  if (!emailOn || inByName <= 0) {
    return "A gate stops newcomers; everyone in keeps adding.";
  }
  return `A gate stops newcomers; everyone in keeps adding, the ${formatCount(inByName)} in by name once they confirm an email.`;
}

/**
 * The two groups, said above the field before she types (the board's drawn lines, in the inside note's own flat
 * note: the track's tone, never a field or a card). ★ ANNOUNCED AS THEY OPEN, as the consequence line is: a host
 * on a screen reader picks A password and hears what it does to her guests before she reaches the field.
 */
function PasswordGroups({
  counts,
}: {
  counts: { in: number; waiting: number };
}) {
  const lines = passwordGroups(counts);
  if (lines.length === 0) return null;
  return (
    <div
      data-door-password-groups=""
      aria-live="polite"
      className="mb-2.5 space-y-1.5"
    >
      {lines.map((line) => {
        const Icon = GROUP_ICON[line.group];
        return (
          <p
            key={line.group}
            data-door-password-group={line.group}
            className="flex items-start gap-2 rounded-lg bg-(--track) px-3 py-2 text-sm text-pretty"
          >
            <Icon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span>
              <span className="font-medium tabular-nums">{line.lead}</span>{" "}
              <span className="text-muted-foreground">{line.rest}</span>
            </span>
          </p>
        );
      })}
    </div>
  );
}

/**
 * A consequential door: what the line says, and what its button does. `emailOn` is whether An email first is on now.
 */
export function consequenceOf(
  next: Door,
  counts: { in: number; inByName: number; waiting: number },
  emailOn: boolean,
): { line: string; confirm: string } | null {
  // ★ AN ADDRESS GATE TURNS AN EMAIL FIRST ON FOR EVERYONE ALREADY IN TOO (crumbs-89; crumbs-87's walk: a guest on a
  // phone). Letting each person in and the invite list match a confirmed address, so choosing either from names only
  // asks every guest in on a name alone to confirm an email before they see everything or add again ("Confirm your
  // email to see everything"), the people a gate otherwise leaves alone. So the move says so first, with their count,
  // as a first password says what it does to each group; only where the step is off now (her own step on already asked
  // them) and someone is in by name. Her names-only door comes back when the gate goes (the event remembers it).
  if (
    (next === "approve" || next === "invite") &&
    !emailOn &&
    counts.inByName > 0
  ) {
    return {
      line: `${people(counts.inByName, "guest is", "guests are")} in on a name alone. ${next === "approve" ? "Letting each person in" : "Your invite list"} asks them to confirm an email too, before they see everything or add more.`,
      confirm: "Ask for an email",
    };
  }
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
  if (next === "password" && counts.waiting > 0) {
    return {
      line: passwordLine(counts.waiting),
      confirm: "Ask for the password",
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
          className="relative z-10 flex size-6 shrink-0 focus-halo items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 outline-none hover:text-foreground motion-reduce:transition-none"
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
  // A first password is being typed: its field says both groups, so the gates' inside note stands down.
  const typingFirst = settingPassword && !(passwordLocked && !v.hasPassword);

  async function apply(next: Door) {
    setPending(null);
    const answer = await s.saveDoor(next);
    if (answer && answer.admitted > 0) {
      toast.success(cameInLine(answer.admitted));
    }
  }

  function choose(next: Door) {
    // The saved door, picked back: whatever was picked meanwhile and never saved lets go, a password
    // being set included, so the page shows the door the album has (build 27's NIT).
    if (next === v.door) {
      setPending(null);
      setSettingPassword(false);
      return;
    }
    // A password needs one set first: the control asks for it, and setting it opens that door.
    if (next === "password" && !v.hasPassword) {
      setPending(null);
      setSettingPassword(true);
      return;
    }
    setSettingPassword(false);
    if (consequenceOf(next, counts, v.requireVerifiedEmail)) {
      setPending(next);
      return;
    }
    void apply(next);
  }

  const consequence = pending
    ? consequenceOf(pending, counts, v.requireVerifiedEmail)
    : null;
  // ★ WHAT THE LIST WOULD DO, said on its row before it is chosen (crumbs-23, build 26's NIT-C): the
  // people waiting whom it names come straight in, in the words the door menu says it in.
  const listedLine = listedWouldComeInLine(counts.waitingListed);
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
                // ★ THE CONTROL MEASURES ITSELF (`@container`): what a choice can hold depends on the width the control
                // is given (a phone's card is 220 to 280 px of it), so its icons answer to that width, below.
                // ★ A SEGMENTED CONTROL IN THE HOUSE SET (identity r5): a flat track, its chosen third afloat.
                className="@container grid grid-cols-3 gap-0.5 rounded-[11px] bg-(--track) p-[3px]"
              >
                {STEPS.map((st) => {
                  const Icon = STEP_ICON[st];
                  return (
                    <ToggleGroupPrimitive.Item
                      key={st}
                      value={st}
                      data-door-choice={st}
                      className={cn(
                        // ★ A CHOICE SITS ON ONE LINE (red-team 46's NIT: "Only me" wrapped beside "Public" and "Private"
                        // at 375): its words never wrap, and its small padding leaves them the whole third.
                        "flex items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-[color,background-color,scale] duration-150 ease-emphasis outline-none",
                        "press-shrink focus-halo [--press-scale:0.95] hover:text-foreground",
                        "data-[state=on]:afloat",
                      )}
                    >
                      {/* The icon is for the room that has it: a third of a narrow control (a 320 phone's is 69 px) holds
                          "Only me" and nothing beside it, so the words stand alone there, and the icon comes where the
                          control is wide enough to hold both (264 px and up, a 375 phone's included). */}
                      <Icon
                        className="hidden size-3.5 shrink-0 @min-[16.5rem]:block"
                        aria-hidden
                      />
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
                  {/* One choice of four, one stop and the arrows between them (`radio-cards.tsx`): an arrow chooses as a
                      press does, so a gate that asks first only asks, and its (i) keeps a stop of its own. */}
                  <RadioCards
                    value={shownGate}
                    aria-label="Who may join"
                    className="space-y-1.5"
                  >
                    {PRIVATE_GATES.map((g) => {
                      const on = shownGate === g;
                      return (
                        <RadioCard
                          key={g}
                          value={g}
                          data-door-gate={g}
                          label={GATE_LABELS[g]}
                          line={GATE_LINES[g]}
                          note={
                            g === "invite" && !on && listedLine ? (
                              <span
                                data-door-listed=""
                                className="mt-0.5 block text-caption text-pretty text-muted-foreground"
                              >
                                {listedLine}
                              </span>
                            ) : null
                          }
                          aside={<GateHelp gate={g} />}
                          onChoose={() => choose(g)}
                        >
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
                            // The password's panel stands on the chosen card: clear, inside a hairline, as a
                            // clear key is (identity r5), so its well and keys read on the card's face.
                            <div className="relative z-10 mt-2.5 rounded-lg p-3 inset-ring inset-ring-(--key-line)">
                              {passwordLocked && !v.hasPassword ? (
                                <LockChip
                                  feature="password"
                                  returnTo={`/dashboard/${s.eventId}?room=settings&setting=door`}
                                />
                              ) : (
                                <>
                                  {/* The first password opens the door as it is set, so what it does to
                                      each group stands beside the field it is set in, read before she types. */}
                                  {typingFirst ? (
                                    <PasswordGroups counts={counts} />
                                  ) : null}
                                  <EventPasswordControl
                                    eventId={s.eventId}
                                    hasPassword={v.hasPassword}
                                    locked={passwordLocked}
                                    // Its success is the door's answer (it writes the door itself): the provider lays
                                    // what it did, a held step given back included, never left to the hub's next read.
                                    onPasswordSet={() => {
                                      setSettingPassword(false);
                                      s.passwordSet();
                                    }}
                                    onPasswordCleared={() => {
                                      setSettingPassword(false);
                                      s.passwordCleared();
                                    }}
                                  />
                                </>
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
                        </RadioCard>
                      );
                    })}
                  </RadioCards>
                  {/* The field's in-line says it while a first password is being typed: never twice. */}
                  {gate && counts.in > 0 && !typingFirst ? (
                    <p
                      data-door-inside=""
                      // A note, flat (identity r5): the track's tone with no line, never a field or a card.
                      className="mt-2.5 flex items-center gap-2 rounded-lg bg-(--track) px-3 py-2 text-sm"
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
                          {insideNote(
                            counts.inByName,
                            v.requireVerifiedEmail || Boolean(heldEmail),
                          )}
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

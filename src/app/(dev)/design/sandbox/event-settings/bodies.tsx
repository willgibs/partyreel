"use client";

import { type ReactNode } from "react";
import {
  DoorClosed,
  Globe,
  KeyRound,
  Lock,
  type LucideIcon,
  MailCheck,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";

import { VisibilitySelector } from "@/components/app/visibility-selector";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  VISIBILITY_HINTS,
  type Visibility,
} from "@/lib/events/visibility-labels";
import { cn } from "@/lib/utils";

import {
  EVENT,
  INSIDE_TOTAL,
  INVITED,
  INVITED_TOTAL,
  PASTED,
  PASTED_BAD,
  PASTED_FOUND,
} from "./fixtures";
import {
  doorOpen,
  type EditorForm,
  emailHeld,
  type Model,
  photoFirstLive,
  type Rung,
  RUNGS,
  rungOf,
} from "./model";
import {
  Choice,
  Field,
  GroupCard,
  HoldSteps,
  type IdleDraw,
  LockChipQuote,
  Looks,
  SelectQuote,
  StackRow,
  SwitchRow,
} from "./parts";

/**
 * THE FOUR GROUPS' OWN SETTINGS, drawn once and arranged by every new
 * structure: in view (`groups`), behind a sentence (`summary`), under Adjust
 * (`presets`). Each takes the one model (`model.ts`) and returns its rows in a
 * card, or bare (`as="rows"`) for a structure that already stands them on a
 * card of its own (the summary opened in place).
 *
 * ★ A SETTING THAT DOES NOTHING RIGHT NOW follows the model's `idle` answer:
 * gone (`hidden`), dimmed with what brings it back (`greyed`), or live with
 * when it applies (`live`, today's way for Require an upload to view). The
 * cases are the reel's look and hold with the reel off, A photo first while
 * uploads are paused, and the door's two steps under Only you.
 */

type As = "card" | "rows";

function Rows({
  as,
  group,
  children,
}: {
  as: As;
  group: string;
  children: ReactNode;
}) {
  if (as === "rows")
    return (
      <div data-set-group={group} className="divide-y divide-border">
        {children}
      </div>
    );
  return <GroupCard group={group}>{children}</GroupCard>;
}

/** What an idle setting is drawn as, or null when it is not drawn at all. */
const idleDraw = (m: Model, idle: boolean): IdleDraw | undefined | null =>
  !idle ? undefined : m.idle === "hidden" ? null : m.idle;

/* ── who can get in ───────────────────────────────────────────────────────── */

const RUNG_ICON: Record<Rung, LucideIcon> = {
  anyone: Globe,
  password: KeyRound,
  list: MailCheck,
  approve: UserCheck,
  closed: DoorClosed,
  private: Lock,
};

/** The two doors of today's model a rung maps onto (the `two` and `steps` forms). */
const seeOf = (r: Rung): Visibility =>
  r === "password" ? "password" : r === "private" ? "private" : "open";
const joinOf = (r: Rung) =>
  r === "list" || r === "approve" || r === "closed" ? r : "anyone";

const JOIN = [
  {
    id: "anyone",
    label: "Anyone with the link",
    Icon: Globe,
    hint: "Anyone with the link or the code can join.",
  },
  {
    id: "approve",
    label: "Approve newcomers",
    Icon: UserCheck,
    hint: "Newcomers confirm an email, then wait for you to let them in.",
  },
  {
    id: "closed",
    label: "Closed to newcomers",
    Icon: DoorClosed,
    hint: "Everyone already in keeps going. Nobody new can join.",
  },
  {
    id: "list",
    label: "An invite list",
    Icon: MailCheck,
    hint: "Listed addresses come straight in. Anyone else can ask you.",
  },
] as const;

/**
 * ONE STEP OF THE DOOR (the `steps` form): its number on the rail, the rail
 * running down to the next, and the step's own setting beside it, the number
 * standing on the setting's first line.
 */
function Step({
  n,
  last = false,
  children,
}: {
  n: number;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="relative flex w-5 shrink-0 justify-center self-stretch">
        {!last && (
          <span
            aria-hidden
            className="absolute top-6 -bottom-4 w-px bg-border"
          />
        )}
        <span className="relative flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground tabular-nums">
          {n}
        </span>
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Whether the chosen rung adds anything under its line. */
const hasExtra = (m: Model) =>
  m.rung === "password" ||
  m.rung === "list" ||
  (m.rung === "closed" && m.inside === "count");

/** What the chosen rung adds under its line: the password, the list, a count. */
function RungExtra({ m }: { m: Model }) {
  if (m.rung === "password")
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Password is set
        </span>
        <Button variant="ghost" size="sm" tabIndex={-1}>
          Change
        </Button>
      </div>
    );
  if (m.rung === "list")
    return (
      <div data-set-reach={m.mark === "extra" ? "" : undefined}>
        <EditorBody form={m.editor} />
      </div>
    );
  if (m.rung === "closed" && m.inside === "count")
    return (
      <p
        data-set-reach={m.mark === "extra" ? "" : undefined}
        className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm"
      >
        <UsersRound
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span>
          <span className="font-medium tabular-nums">
            {`${INSIDE_TOTAL} people are in.`}
          </span>{" "}
          <span className="text-muted-foreground">
            {`${EVENT.guests} have added photos.`}
          </span>
        </span>
      </p>
    );
  return null;
}

/** The door's two steps, as switches, idle where nothing reaches them. */
function doorSwitchRows(m: Model, numbered = false): ReactNode[] {
  const closedDoor = !doorOpen(m);
  const emailIdle = idleDraw(m, closedDoor);
  const photoIdle = idleDraw(m, !photoFirstLive(m));
  // In a step the row sits beside its number, so it carries no padding of its own.
  const bare = numbered ? "px-0 py-0" : undefined;
  const rows: ReactNode[] = [];
  if (emailIdle !== null)
    rows.push(
      <SwitchRow
        key="email"
        label={numbered ? "An email first" : "Confirm an email first"}
        line="Every photo then has a confirmed address behind it."
        checked={m.email || Boolean(emailHeld(m))}
        guarded
        held={emailHeld(m)}
        idle={emailIdle}
        idleWhy={
          emailIdle === "greyed"
            ? "Nobody reaches it while only you can get in."
            : "Applies once guests can get in again."
        }
        className={bare}
      />,
    );
  if (photoIdle !== null)
    rows.push(
      <SwitchRow
        key="photo"
        label="A photo first"
        line="Guests add one before the album opens."
        checked={m.photoFirst}
        guarded
        idle={photoIdle}
        idleWhy={
          closedDoor
            ? photoIdle === "greyed"
              ? "Nobody reaches it while only you can get in."
              : "Applies once guests can get in again."
            : photoIdle === "greyed"
              ? "Uploads are paused, so nobody can add one."
              : "Takes effect when uploads reopen."
        }
        className={bare}
      />,
    );
  return rows;
}

/** The door's two steps, as switch rows, idle where nothing reaches them. */
function DoorSwitches({ m }: { m: Model }) {
  return <>{doorSwitchRows(m)}</>;
}

/**
 * A CHOICE AS A ROW: its question, the control, and under it the line that
 * speaks for the chosen option (where `VISIBILITY_HINTS` stands under the
 * selector in the form), then whatever the choice adds (the password, the
 * list, a count).
 */
function ChoiceRow({
  label,
  hint,
  reach = false,
  extra,
  bare = false,
  children,
}: {
  label?: string;
  hint?: string;
  reach?: boolean;
  extra?: ReactNode;
  /** In a step, beside its number: no padding of its own. */
  bare?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      data-set-setting=""
      className={cn("space-y-2.5", !bare && "px-4 py-3")}
    >
      {label ? <p className="text-sm font-medium">{label}</p> : null}
      <div data-set-reach={reach ? "" : undefined}>{children}</div>
      {hint ? (
        <p className="text-caption text-pretty text-muted-foreground">{hint}</p>
      ) : null}
      {extra}
    </div>
  );
}

/**
 * WHO CAN GET IN, in the three forms the `join` ask offers: the ladder of six
 * (one choice, open to closed), today's two choices (who can see, then who can
 * join), or the door in the order a guest meets it, numbered.
 */
export function AccessBody({
  m,
  as = "card",
  switches = true,
}: {
  m: Model;
  as?: As;
  /** False leaves the door's two switches where today's form keeps them (Guest uploads). */
  switches?: boolean;
}) {
  const see = seeOf(m.rung);
  const seeRow = (label: string, bare = false) => (
    <ChoiceRow
      label={label}
      hint={VISIBILITY_HINTS[see]}
      extra={m.rung === "password" ? <RungExtra m={m} /> : null}
      bare={bare}
    >
      <VisibilitySelector value={see} onValueChange={() => {}} />
    </ChoiceRow>
  );
  const join = JOIN.find((j) => j.id === joinOf(m.rung))!;
  const joinRow = (label: string, bare = false) => (
    <ChoiceRow
      label={label}
      hint={join.hint}
      reach={m.mark === "choice"}
      extra={hasExtra(m) && m.rung !== "password" ? <RungExtra m={m} /> : null}
      bare={bare}
    >
      <Choice options={JOIN} value={join.id} />
    </ChoiceRow>
  );

  if (m.join === "none")
    return (
      <Rows as={as} group="access">
        {seeRow("Who can see this album?")}
        {switches ? <DoorSwitches m={m} /> : null}
      </Rows>
    );
  if (m.join === "two")
    return (
      <Rows as={as} group="access">
        {seeRow("Who can see this album?")}
        {joinRow("Who can join?")}
        {switches ? <DoorSwitches m={m} /> : null}
      </Rows>
    );
  if (m.join === "steps") {
    // One child on the card, so no divider cuts across the rail between steps.
    const switchRows = doorSwitchRows(m, true);
    const steps = [
      seeRow("What the link opens", true),
      joinRow("Who may join", true),
      ...switchRows,
    ];
    return (
      <Rows as={as} group="access">
        <div className="space-y-5 px-4 py-4">
          {steps.map((node, i) => (
            <Step key={i} n={i + 1} last={i === steps.length - 1}>
              {node}
            </Step>
          ))}
        </div>
      </Rows>
    );
  }
  // The ladder. The group is titled Who can get in wherever a new structure
  // stands it, so only today's card (titled Visibility & access) asks the
  // question again.
  return (
    <Rows as={as} group="access">
      <ChoiceRow
        label={m.structure === "today" ? "Who can get in?" : undefined}
        hint={rungOf(m.rung).line}
        reach={m.mark === "choice"}
        extra={hasExtra(m) ? <RungExtra m={m} /> : null}
      >
        <Choice
          options={RUNGS.map((r) => ({ ...r, Icon: RUNG_ICON[r.id] }))}
          value={m.rung}
        />
      </ChoiceRow>
      {switches ? <DoorSwitches m={m} /> : null}
    </Rows>
  );
}

/* ── the invite list's editor (the `editor` ask, ported) ──────────────────── */

/** An address on the list, as a removable chip. */
function AddressChip({
  address,
  bad = false,
}: {
  address: string;
  bad?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex h-7 max-w-full items-center gap-1 rounded-full border py-0.5 pr-1 pl-2.5 text-xs",
        bad
          ? "border-destructive/50 bg-destructive/5 text-destructive"
          : "border-border bg-background",
      )}
    >
      <span className="truncate">{address}</span>
      <X className="size-3.5 shrink-0 opacity-60" aria-hidden />
    </span>
  );
}

export function EditorBody({ form }: { form: EditorForm }) {
  if (form === "one") {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <span className="flex h-9 min-w-0 flex-1 items-center rounded-lg border border-input px-3 text-sm text-muted-foreground">
            name@example.com
          </span>
          <Button size="sm" className="h-9" tabIndex={-1}>
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {`${INVITED_TOTAL} addresses`}
        </p>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {INVITED.slice(0, 5).map((a) => (
            <li
              key={a}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <span className="truncate">{a}</span>
              <X
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </li>
          ))}
          <li className="px-3 py-2 text-xs text-muted-foreground">
            {`${INVITED_TOTAL - 5} more`}
          </li>
        </ul>
      </div>
    );
  }
  if (form === "paste") {
    return (
      <div className="space-y-3">
        <Textarea
          readOnly
          tabIndex={-1}
          rows={5}
          value={PASTED.join("\n")}
          className="text-sm"
        />
        <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <p>
            <span className="font-medium tabular-nums">{`Found ${PASTED_FOUND} addresses.`}</span>{" "}
            <span className="text-muted-foreground">{`${PASTED_BAD.length} couldn't be read:`}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PASTED_BAD.map((b) => (
              <AddressChip key={b} address={b} bad />
            ))}
          </div>
        </div>
        <Button size="sm" className="w-full" tabIndex={-1}>
          {`Add ${PASTED_FOUND} to the list`}
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-input p-2">
        {INVITED.slice(0, 4).map((a) => (
          <AddressChip key={a} address={a} />
        ))}
        {PASTED_BAD.map((b) => (
          <AddressChip key={b} address={b} bad />
        ))}
        <span className="flex h-7 min-w-32 flex-1 items-center px-1 text-xs text-muted-foreground">
          Add or paste addresses
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground tabular-nums">
          {`${PASTED_FOUND} added from your paste.`}
        </span>{" "}
        {`${PASTED_BAD.length} need a look. ${INVITED_TOTAL} on the list.`}
      </p>
    </div>
  );
}

/* ── what guests can add ──────────────────────────────────────────────────── */

/** The size cap per upload, on Pro only (the board's `size-cap` call), as a still select. */
function SizeCapRow() {
  return (
    <StackRow
      label="Largest upload"
      line="Caps any one guest file, so one video can't fill your storage."
    >
      <SelectQuote value="No limit" />
    </StackRow>
  );
}

/**
 * WHAT GUESTS CAN ADD: the pause, Review, and videos in the three forms the
 * `lock` ask offers, on Free (locked) or Pro (the Plan knob).
 */
export function AddsBody({
  m,
  as = "card",
  pause = true,
}: {
  m: Model;
  as?: As;
  /** False leaves the pause out (the presets stand it on its own, under the kinds). */
  pause?: boolean;
}) {
  const pro = m.plan === "pro";
  const reachLock = m.mark === "lock";
  const videos: ReactNode[] = [];
  if (m.lock === "chip") {
    videos.push(
      <div
        key="video"
        data-set-setting=""
        className="flex items-center justify-between gap-4 px-4 py-3"
      >
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium">Video uploads</p>
          <p className="text-caption text-muted-foreground">
            {pro
              ? "Guests and you can add photos and video."
              : "This event takes photos only."}
          </p>
        </div>
        {pro ? (
          <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
            Photos &amp; video
          </span>
        ) : (
          <LockChipQuote name="Video uploads" reach={reachLock} />
        )}
      </div>,
    );
    if (pro) videos.push(<SizeCapRow key="cap" />);
  } else if (m.lock === "switch") {
    videos.push(
      <div
        key="video"
        data-set-setting=""
        className="flex items-center justify-between gap-4 px-4 py-3"
      >
        <div className="min-w-0 space-y-0.5">
          <p className="flex items-center gap-2 text-sm font-medium">
            Videos
            {!pro && (
              <span className="rounded-full border border-border px-1.5 py-px text-[10px] font-semibold text-muted-foreground">
                Pro
              </span>
            )}
          </p>
          <p className="text-caption text-muted-foreground">
            {pro
              ? "Guests add clips as well as photos."
              : "Guests add clips as well as photos. Opens the plans."}
          </p>
        </div>
        {/* A plain switch at rest: on Free a press opens the plans (not drawn), so
            it is never the disabled grey of a setting that cannot move. */}
        <span
          data-set-reach={reachLock ? "" : undefined}
          className="flex shrink-0"
        >
          <Switch checked={pro} tabIndex={-1} />
        </span>
      </div>,
    );
    if (pro) videos.push(<SizeCapRow key="cap" />);
  } else if (pro) {
    videos.push(<SizeCapRow key="cap" />);
  }
  const line =
    m.lock === "line" && !pro ? (
      <p
        data-set-reach={reachLock ? "" : undefined}
        className="px-1 text-caption text-muted-foreground"
      >
        Videos come with Pro.{" "}
        <span className="font-medium text-foreground underline underline-offset-4">
          See what Pro adds
        </span>
      </p>
    ) : null;
  const rows = (
    <Rows as={as} group="adds">
      {pause ? (
        <SwitchRow
          label="Uploads open"
          line="Turn off to pause. Guests can still look."
          checked={m.uploads}
          reach={m.mark === "uploads"}
        />
      ) : null}
      <SwitchRow
        label="Review first"
        line="Hold new photos until you approve them."
        checked={m.review}
        guarded
      />
      {videos}
    </Rows>
  );
  if (!line) return rows;
  return (
    <div className="space-y-2">
      {rows}
      {line}
    </div>
  );
}

/* ── the highlight reel ───────────────────────────────────────────────────── */

export function ReelBody({ m, as = "card" }: { m: Model; as?: As }) {
  const idle = idleDraw(m, !m.reel);
  return (
    <Rows as={as} group="reel">
      <SwitchRow
        label="Show the reel"
        line="It plays on the album from the second photo."
        checked={m.reel}
      />
      {idle === null ? null : (
        <StackRow
          label="Look"
          line="Where every guest starts; anyone can pick their own."
          idle={idle}
          idleWhy={
            idle === "greyed"
              ? "Turn the reel on to choose."
              : idle === "live"
                ? "Guests start here once the reel is on."
                : undefined
          }
        >
          <Looks value={m.look} />
        </StackRow>
      )}
      {idle === null ? null : (
        <StackRow
          label="Hold"
          line="Seconds each photo stays on screen."
          idle={idle}
          idleWhy={
            idle === "greyed"
              ? "Turn the reel on to choose."
              : idle === "live"
                ? "Guests start here once the reel is on."
                : undefined
          }
        >
          <HoldSteps value={m.hold} />
        </StackRow>
      )}
    </Rows>
  );
}

/* ── this event ───────────────────────────────────────────────────────────── */

export function EventBody({ m, as = "card" }: { m: Model; as?: As }) {
  return (
    <Rows as={as} group="event">
      <StackRow label="Name">
        <Field value={EVENT.name} />
      </StackRow>
      <StackRow
        label="A note for guests"
        line="Under the name, on the page they open."
      >
        <Field value={EVENT.note} tall />
      </StackRow>
      <StackRow label="Date" line="For you alone; an event never expires.">
        <Field type="date" value={EVENT.isoDate} />
      </StackRow>
      <SwitchRow
        label="Show on my profile"
        line="Lists it, with its link, on your public page."
        checked={m.profile}
      />
    </Rows>
  );
}

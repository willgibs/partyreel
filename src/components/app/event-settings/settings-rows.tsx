"use client";

import { useId, type ReactNode } from "react";
import { Check, ChevronRight, QrCode } from "lucide-react";
import { toast } from "sonner";

import { useLiveReadyFacts } from "@/components/app/event-feed/checklist";

import { DeleteEventRow } from "@/components/app/event-settings/delete-event-row";
import {
  SAVES_NOTE,
  SettingsNote,
} from "@/components/app/event-settings/settings-furniture";
import type { SettingsPage } from "@/components/app/event-settings/settings-pages";
import {
  moodLabel,
  useSettings,
} from "@/components/app/event-settings/settings-state";
import {
  SettingWord,
  type WordChoice,
} from "@/components/app/event-settings/setting-word";
import { Button } from "@/components/ui/button";
import {
  FILM_ROLLS,
  ROLL_MAX,
  ROLL_MIN,
  ROLL_SHOTS,
  rollShots,
} from "@/lib/disposable/roll";
import { formatCount } from "@/lib/format/count";
import { RangeText } from "@/lib/format/range-text";
import { DOORS, stepOf, type Door } from "@/lib/event/door/door";
import { cameInLine, listedWouldComeInLine } from "@/lib/event/door/words";
import {
  secondsLabel,
  sentenceText,
  settingsSentence,
  SETTINGS_GROUP_TITLES,
  type SentenceWord,
  type SettingsGroup,
} from "@/lib/events/guest-experience-summary";
import {
  DOOR_STEP_LABELS,
  DOOR_STEP_LINES,
  GATE_LABELS,
  GATE_LINES,
} from "@/lib/events/visibility-labels";
import {
  type Readiness,
  type ReadyFacts,
  type ReadyItemId,
  readyHead,
  settingsReadiness,
  stepWants,
} from "@/lib/events/readiness";
import { HOLD_STEPS_SEC, REEL_MOOD_IDS } from "@/lib/reel/defaults";
import { cn } from "@/lib/utils";

/**
 * SETTINGS AT REST: FIVE STEPS, FOUR OF THEM A SENTENCE (event-settings r1, `structure=summary` and
 * `opens=page`; event-ready r1, `guide=steps`). Each group says where it stands in one sentence whose key
 * words are live controls ("Anyone with the link" changes who gets in, right there), and pressing the row
 * anywhere else opens its group as a page of its own. The rows are numbered down one rail, ticked once
 * ready, with the code as the fifth. The whole of it fits a phone's screen, and Delete is a quiet row at
 * the foot, never the thing between a host and a setting.
 */

/** The four groups, in the order a guest meets them: the rail's first four steps. */
const GROUPS: readonly SettingsGroup[] = ["door", "adds", "reel", "event"];

/** The code's place on the rail: after the four groups. */
const CODE_STEP = GROUPS.length + 1;

/** Each group's step is the checklist item it finishes. */
const STEP_ITEM: Record<
  SettingsGroup,
  Exclude<ReadyItemId, "code" | "room">
> = {
  door: "door",
  adds: "adds",
  reel: "photos",
  event: "welcome",
};

/** The page each row opens: the group and its page share a name, the door's page its own. */
export const PAGE_OF: Record<SettingsGroup, SettingsPage> = {
  door: "door",
  adds: "adds",
  reel: "reel",
  event: "event",
};

const people = (n: number, one: string, many: string) =>
  `${formatCount(n)} ${n === 1 ? one : many}`;

/** A door, as its answer in the quick choice: step one, then the gate it keeps. */
function doorChoiceLabel(door: Door): string {
  const step = stepOf(door);
  if (step !== "private" || door === "private") return DOOR_STEP_LABELS[step];
  return `${DOOR_STEP_LABELS.private}: ${GATE_LABELS[door as Exclude<Door, "open" | "private">].toLowerCase()}`;
}

/**
 * WHAT A DOOR DOES TO PEOPLE, said before it is chosen (the consequence line's rule inside the quick
 * choice). Null where it reaches nobody, and the guest's own line then speaks for it.
 */
export function doorConsequence(
  next: Door,
  facts: {
    in: number;
    waiting: number;
    /** Of those waiting, the ones the invite list names (`DoorCounts.waitingListed`). */
    waitingListed?: number;
    hasPassword: boolean;
    requireVerifiedEmail: boolean;
  },
): string | null {
  if (next === "private" && facts.in > 0) {
    return `Closes out the ${people(facts.in, "guest", "guests")} already in.`;
  }
  if (next === "open" && facts.waiting > 0) {
    return `Lets in the ${people(facts.waiting, "person", "people")} waiting at the door.`;
  }
  if (next === "closed" && facts.waiting > 0) {
    // The verb agrees with its count ("The 1 person ... stays out", build 23's NIT-5).
    return `The ${people(facts.waiting, "person waiting at the door stays", "people waiting at the door stay")} out.`;
  }
  if (next === "password" && !facts.hasPassword) {
    return "Set a password first, on the next screen.";
  }
  const email =
    (next === "approve" || next === "invite") && !facts.requireVerifiedEmail
      ? "Turns An email first on: this gate matches a confirmed address."
      : null;
  if (next === "invite") {
    // ★ THE LIST'S EFFECT IS SAID WHEN IT WOULD HAPPEN (crumbs-23, build 26's NIT-C): choosing it lets in
    // each person waiting whom it names (crumbs-17's admit), as Public lets in everyone waiting.
    return (
      [listedWouldComeInLine(facts.waitingListed ?? 0), email]
        .filter(Boolean)
        .join(" ") || null
    );
  }
  return email;
}

/** What each of film's three says under its count in the roll's quick choice. */
const FILM_NOTES: Record<(typeof FILM_ROLLS)[number], string> = {
  12: "Film's short roll.",
  24: "Partyreel's usual.",
  36: "Film's long roll.",
};

/**
 * THE ROLL'S QUICK CHOICE (customize r1's `home=words`): film's three, her own count where it is none of them, and
 * Another number, which opens What guests can add at the stepper, in focus (the sentence is the overview, the page the
 * whole control).
 */
export function rollChoices(current: number): WordChoice[] {
  const film = (FILM_ROLLS as readonly number[]).includes(current);
  return [
    ...FILM_ROLLS.map((n) => ({
      id: String(n),
      label: rollShots(n),
      note: FILM_NOTES[n],
      selected: n === current,
    })),
    ...(film
      ? []
      : [{ id: String(current), label: rollShots(current), selected: true }]),
    {
      id: "other",
      label: "Another number",
      note: `Any count from ${ROLL_MIN} to ${ROLL_MAX}.`,
    },
  ];
}

/** The guest's own line for a door, when nothing more pressing is said. */
function doorLine(door: Door): string {
  const step = stepOf(door);
  if (step !== "private" || door === "private") return DOOR_STEP_LINES[step];
  return GATE_LINES[door as Exclude<Door, "open" | "private">];
}

/** Each live word's quick choice: its question, its answers, and what choosing one writes. */
function useWordChoices(openPage: (page: SettingsPage) => void): Record<
  SentenceWord,
  {
    title: string;
    choices: WordChoice[];
    onChoose: (id: string) => void;
    busy: boolean;
  }
> {
  const s = useSettings();
  const v = s.values;
  const facts = {
    in: s.counts.in,
    waiting: s.counts.waiting,
    waitingListed: s.counts.waitingListed,
    hasPassword: v.hasPassword,
    requireVerifiedEmail: v.requireVerifiedEmail,
  };
  return {
    door: {
      title: "Who can get in?",
      busy: s.saving("door"),
      choices: DOORS.map((door) => ({
        id: door,
        label: doorChoiceLabel(door),
        // The door it is already at reaches nobody: its own line speaks for it.
        note:
          door === v.door
            ? doorLine(door)
            : (doorConsequence(door, facts) ?? doorLine(door)),
        selected: door === v.door,
      })),
      onChoose: (id) => {
        const door = id as Door;
        // A password needs one set first: its page asks for it, and the door follows.
        if (door === "password" && !v.hasPassword) {
          openPage("door");
          return;
        }
        void s.saveDoor(door).then((answer) => {
          if (answer && answer.admitted > 0) {
            toast.success(cameInLine(answer.admitted));
          }
        });
      },
    },
    email: {
      title: "What guests do first",
      busy: s.saving("requireVerifiedEmail"),
      choices: [
        {
          id: "on",
          label: "Confirm an email",
          note: "Every photo then has a confirmed address behind it.",
          selected: v.requireVerifiedEmail,
        },
        {
          id: "off",
          label: "Type a name",
          note: "Quicker at the door, and nothing proves who typed it.",
          selected: !v.requireVerifiedEmail,
        },
      ],
      onChoose: (id) => void s.saveEvent({ requireVerifiedEmail: id === "on" }),
    },
    photo: {
      title: "Before the album opens",
      busy: s.saving("requireUploadToView"),
      choices: [
        {
          id: "on",
          label: "Add a photo first",
          note: "Guests add one of their own before they see everything.",
          selected: v.requireUploadToView,
        },
        {
          id: "off",
          label: "Nothing first",
          note: "The album opens after the email or the name.",
          selected: !v.requireUploadToView,
        },
      ],
      onChoose: (id) => void s.saveEvent({ requireUploadToView: id === "on" }),
    },
    uploads: {
      title: "What guests can add",
      busy: s.saving("acceptingUploads"),
      choices: [
        {
          id: "open",
          label: s.facts.videos ? "Photos and videos" : "Photos",
          note: "Uploads are open.",
          selected: v.acceptingUploads,
        },
        {
          id: "paused",
          label: "Nothing, for now",
          note: "Pauses uploads. Guests can still look.",
          selected: !v.acceptingUploads,
        },
      ],
      onChoose: (id) => void s.saveEvent({ acceptingUploads: id === "open" }),
    },
    roll: {
      title: "Shots on each guest's roll",
      busy: s.saving("rollSize"),
      choices: rollChoices(v.rollSize ?? ROLL_SHOTS),
      onChoose: (id) => {
        if (id === "other") {
          s.openAt("roll");
          openPage("adds");
          return;
        }
        void s.saveEvent({ rollSize: Number(id) });
      },
    },
    review: {
      title: "Where what guests add goes",
      busy: s.saving("review"),
      choices: [
        {
          id: "live",
          label: "Straight into the album",
          note:
            v.review && s.pendingCount > 0
              ? `The ${people(s.pendingCount, "photo", "photos")} under review appear at once.`
              : "Everyone sees it the moment it lands.",
          selected: !v.review,
        },
        {
          id: "review",
          label: "To you first",
          note: "Held until you approve it, in Review.",
          selected: v.review,
        },
      ],
      onChoose: (id) => void s.saveEvent({ review: id === "review" }),
    },
    reel: {
      title: "The highlight reel",
      busy: s.saving("showReel"),
      choices: [
        {
          id: "on",
          label: "On",
          note: "It plays on the album from the second photo.",
          selected: v.showReel,
        },
        {
          id: "off",
          label: "Off",
          note: "Guests see only the album.",
          selected: !v.showReel,
        },
      ],
      onChoose: (id) => void s.saveReel({ showReel: id === "on" }),
    },
    look: {
      title: "The look every guest starts on",
      busy: s.saving("reelStyleId"),
      choices: REEL_MOOD_IDS.map((id) => ({
        id,
        label: moodLabel(id),
        selected: id === v.reelStyleId,
      })),
      onChoose: (id) => void s.saveReel({ reelStyleId: id }),
    },
    hold: {
      title: "How long each photo stays",
      busy: s.saving("reelHoldSec"),
      choices: HOLD_STEPS_SEC.map((step) => ({
        id: String(step),
        label: secondsLabel(step),
        selected: step === v.reelHoldSec,
      })),
      onChoose: (id) => void s.saveReel({ reelHoldSec: Number(id) }),
    },
    profile: {
      title: "Your public profile",
      busy: s.saving("displayInProfile"),
      choices: [
        {
          id: "on",
          label: "On your profile",
          note: "Listed, with its link, on your public page.",
          selected: v.displayInProfile === true,
        },
        {
          id: "off",
          label: "Not on your profile",
          selected: v.displayInProfile === false,
        },
      ],
      onChoose: (id) => void s.saveProfile(id === "on"),
    },
  };
}

/** One step on the rail: its number (a tick once ready), joined to the next by the door page's own line. */
function RailMark({
  n,
  done,
  last,
}: {
  n: number;
  done: boolean;
  last?: boolean;
}) {
  return (
    <span
      aria-hidden
      className="pointer-events-none relative flex w-5 shrink-0 justify-center self-stretch"
    >
      {!last && (
        <span
          className={cn(
            "absolute top-7 -bottom-4 w-px",
            done ? "bg-success/50" : "bg-border",
          )}
        />
      )}
      {done ? (
        <span className="relative mt-0.5 flex size-5 items-center justify-center rounded-full bg-success text-success-foreground">
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : (
        <span className="relative mt-0.5 flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground tabular-nums">
          {n}
        </span>
      )}
    </span>
  );
}

/**
 * One step: its number or tick, its title, its sentence with the live words and, while it is not ticked,
 * what it still wants; the page behind it.
 */
function SettingsStep({
  group,
  n,
  done,
  wants,
  onOpen,
  words,
}: {
  group: SettingsGroup;
  n: number;
  done: boolean;
  wants: string | null;
  onOpen: () => void;
  words: ReturnType<typeof useWordChoices>;
}) {
  const s = useSettings();
  const stateId = useId();
  const sentenceId = useId();
  const wantsId = useId();
  const parts = settingsSentence(group, s.facts);
  const title = SETTINGS_GROUP_TITLES[group];
  return (
    <div
      data-settings-row={group}
      data-done={done ? "" : undefined}
      className="relative flex gap-3 px-4 py-3 transition-colors duration-150 hover:bg-muted/40 motion-reduce:transition-none"
    >
      {/* The row's own button, stretched behind the sentence: pressing anywhere but a live word opens
          the page. Named by the title (the list says its place), described by its tick, the sentence it
          opens and what it still wants. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={title}
        aria-describedby={[stateId, sentenceId, wants ? wantsId : null]
          .filter(Boolean)
          .join(" ")}
        data-settings-open={group}
        className="absolute inset-0 rounded-none outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
      />
      <span id={stateId} className="sr-only">
        {done ? `Step ${n}, done.` : `Step ${n}, to do.`}
      </span>
      <RailMark n={n} done={done} />
      <span className="pointer-events-none relative min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        {/* ★ A LINE TALL ENOUGH FOR ITS UNDERLINES: a live word's dotted rule sits below its baseline,
            and at the caption's own line height a wrapped first line's rule ran into the glyphs of the
            line under it and read as no rule at all. */}
        <span className="block text-caption leading-5 text-pretty text-muted-foreground">
          <span id={sentenceId} data-settings-sentence="">
            {parts.map((part, i): ReactNode => {
              if (!part.word)
                return (
                  <span key={i}>
                    {part.range ? <RangeText text={part.text} /> : part.text}
                  </span>
                );
              const w = words[part.word];
              return (
                <SettingWord
                  key={i}
                  title={w.title}
                  choices={w.choices}
                  onChoose={w.onChoose}
                  busy={w.busy}
                >
                  {part.text}
                </SettingWord>
              );
            })}
          </span>
          {wants ? (
            <>
              {" "}
              <span
                id={wantsId}
                data-settings-wants=""
                className="text-foreground"
              >
                {wants}
              </span>
            </>
          ) : null}
        </span>
      </span>
      <ChevronRight
        aria-hidden
        className="pointer-events-none relative mt-0.5 size-4 shrink-0 self-center text-muted-foreground"
      />
    </div>
  );
}

/**
 * THE FIFTH STEP, THE CODE: Settings ends where guests begin. It has no page of its own; its door is the
 * code card, the hub's (the sheet closes Settings to open it), and while nobody has opened the code it
 * carries the checklist's own two doors, Invite and Print.
 */
function CodeStep({
  done,
  line,
  onOpenCode,
}: {
  done: boolean;
  line: string;
  onOpenCode?: () => void;
}) {
  const s = useSettings();
  const stateId = useId();
  const lineId = useId();
  return (
    <div
      data-settings-row="code"
      data-done={done ? "" : undefined}
      className={cn(
        "relative flex gap-3 px-4 py-3",
        onOpenCode &&
          "transition-colors duration-150 hover:bg-muted/40 motion-reduce:transition-none",
      )}
    >
      {onOpenCode ? (
        <button
          type="button"
          onClick={onOpenCode}
          aria-label="The code"
          aria-describedby={`${stateId} ${lineId}`}
          data-settings-open="code"
          className="absolute inset-0 rounded-none outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
        />
      ) : null}
      <span id={stateId} className="sr-only">
        {done ? `Step ${CODE_STEP}, done.` : `Step ${CODE_STEP}, to do.`}
      </span>
      <RailMark n={CODE_STEP} done={done} last />
      <span className="pointer-events-none relative min-w-0 flex-1">
        <span className="block text-sm font-medium">The code</span>
        <span
          id={lineId}
          className="block text-caption leading-5 text-pretty text-muted-foreground"
        >
          {line}
        </span>
        {done ? null : (
          <span className="pointer-events-auto relative z-10 flex flex-wrap gap-1.5 pt-2">
            <Button size="sm" onClick={onOpenCode} disabled={!onOpenCode}>
              <QrCode /> Invite
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a
                href={`/dashboard/${s.eventId}/print`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Print
              </a>
            </Button>
          </span>
        )}
      </span>
      {onOpenCode ? (
        <ChevronRight
          aria-hidden
          className="pointer-events-none relative mt-0.5 size-4 shrink-0 self-center text-muted-foreground"
        />
      ) : null}
    </div>
  );
}

/**
 * THE EVENT'S READINESS AS SETTINGS SEES IT: the server's facts with the album's live counts over them
 * (the checklist's own reading), and over both, Settings' own values, so a step ticks the moment a choice
 * is made, before the row it wrote comes back.
 */
export function useSettingsReadiness(ready: ReadyFacts): {
  facts: ReadyFacts;
  r: Readiness;
} {
  const s = useSettings();
  const live = useLiveReadyFacts(ready);
  const v = s.values;
  const facts: ReadyFacts = {
    ...live,
    door: v.door,
    hasPassword: v.hasPassword,
    guestsIn: s.counts.in,
    invited: s.counts.invited,
    acceptingUploads: v.acceptingUploads,
    showReel: v.showReel,
    eventDate: v.eventDate || null,
    description: v.description || null,
  };
  return { facts, r: settingsReadiness(facts) };
}

/**
 * SETTINGS AS STEPS (event-ready `guide=steps`, Will 2026-10-02, from his note on the door's steps:
 * "Almost feels like a mini wizard within settings to always ensure it's ready to go"). The four rows
 * are numbered down one rail like the door's, each ticked once ready, and the code is the fifth; every
 * page ends in Next (`event-settings-sheet.tsx`). A row is still one sentence whose key words are live
 * controls and whose press opens its page, so nothing a host knew moved; the rail adds the order and the
 * ticks, and the head says whether guests can arrive. Delete stays a quiet row at the foot.
 *
 * ★ THE TICKS ARE THE CHECKLIST'S (`lib/events/readiness.ts`), in Settings' order: who can get in, what
 * guests can add, the reel's first photos, the welcome, the code. Room is the plan's and stays on the
 * hub (`settingsReadiness`).
 */
export function SettingsRows({
  onOpenPage,
  ready,
  onOpenCode,
}: {
  onOpenPage: (page: SettingsPage) => void;
  /** The event's readiness facts, as the hub read them. */
  ready: ReadyFacts;
  /** The fifth step's door, the code card; absent where there is none to open (the Library). */
  onOpenCode?: () => void;
}) {
  const words = useWordChoices(onOpenPage);
  const s = useSettings();
  const { facts, r } = useSettingsReadiness(ready);
  const head = readyHead(r);
  const itemOf = (id: ReadyItemId) => r.items.find((i) => i.id === id)!;
  const code = itemOf("code");
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div
          data-settings-head=""
          data-ready={r.ready ? "" : undefined}
          className="space-y-0.5 px-1 pb-1"
        >
          <p className="flex items-center gap-1.5 text-sm font-medium">
            {r.ready ? (
              <Check
                className="size-4 shrink-0 text-success"
                strokeWidth={3}
                aria-hidden
              />
            ) : null}
            {head.title}
          </p>
          <p className="text-caption text-pretty text-muted-foreground">
            {head.line}
          </p>
        </div>
        <div
          data-settings-rows=""
          role="list"
          aria-label="Steps"
          className="divide-y divide-border overflow-hidden rounded-lg bg-card text-card-foreground ring-1 ring-foreground/10"
        >
          {GROUPS.map((group, i) => {
            const item = STEP_ITEM[group];
            return (
              <div key={group} role="listitem">
                <SettingsStep
                  group={group}
                  n={i + 1}
                  done={itemOf(item).done}
                  wants={stepWants(item, facts)}
                  onOpen={() => onOpenPage(PAGE_OF[group])}
                  words={words}
                />
              </div>
            );
          })}
          <div role="listitem">
            <CodeStep
              done={code.done}
              line={code.line}
              onOpenCode={onOpenCode}
            />
          </div>
        </div>
        <SettingsNote>{SAVES_NOTE}</SettingsNote>
      </div>
      <DeleteEventRow eventId={s.eventId} eventName={s.eventName} />
    </div>
  );
}

/** The four sentences as plain words, for a label or a test. */
export function settingsSummaryText(
  facts: Parameters<typeof settingsSentence>[1],
): Record<SettingsGroup, string> {
  return {
    door: sentenceText(settingsSentence("door", facts)),
    adds: sentenceText(settingsSentence("adds", facts)),
    reel: sentenceText(settingsSentence("reel", facts)),
    event: sentenceText(settingsSentence("event", facts)),
  };
}

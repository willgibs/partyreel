"use client";

import { useId, type ReactNode } from "react";
import {
  CalendarDays,
  ChevronRight,
  Clapperboard,
  DoorOpen,
  ImagePlus,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

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
import { formatCount } from "@/lib/format/count";
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
import { HOLD_STEPS_SEC, REEL_MOOD_IDS } from "@/lib/reel/defaults";

/**
 * SETTINGS AT REST: FOUR ROWS, EACH A SENTENCE (event-settings r1, `structure=summary` with his note
 * folded in, and `opens=page`). Each row says where its group stands in one sentence whose key words
 * are live controls ("Anyone with the link" changes who gets in, right there), and pressing the row
 * anywhere else opens its group as a page of its own. The whole of it fits a phone's screen, and
 * Delete is a quiet row at the foot, never the thing between a host and a setting.
 */

const GROUPS: readonly SettingsGroup[] = ["door", "adds", "reel", "event"];

const ICON: Record<SettingsGroup, LucideIcon> = {
  door: DoorOpen,
  adds: ImagePlus,
  reel: Clapperboard,
  event: CalendarDays,
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

/** One row: its glyph, its title, its sentence with the live words, and the page behind it. */
function SettingsRow({
  group,
  onOpen,
  words,
}: {
  group: SettingsGroup;
  onOpen: () => void;
  words: ReturnType<typeof useWordChoices>;
}) {
  const s = useSettings();
  const sentenceId = useId();
  const parts = settingsSentence(group, s.facts);
  const Icon = ICON[group];
  const title = SETTINGS_GROUP_TITLES[group];
  return (
    <div
      data-settings-row={group}
      className="relative flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-muted/40 motion-reduce:transition-none"
    >
      {/* The row's own button, stretched behind the sentence: pressing anywhere but a live word opens
          the page. Named by the title, described by the sentence it opens. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={title}
        aria-describedby={sentenceId}
        data-settings-open={group}
        className="absolute inset-0 rounded-none outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
      />
      <span
        aria-hidden
        className="pointer-events-none relative flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
      >
        <Icon className="size-4" />
      </span>
      <span className="pointer-events-none relative min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span
          id={sentenceId}
          data-settings-sentence=""
          // ★ A LINE TALL ENOUGH FOR ITS UNDERLINES: a live word's dotted rule sits below its
          // baseline, and at the caption's own line height a wrapped first line's rule ran into the
          // glyphs of the line under it and read as no rule at all.
          className="block text-caption leading-5 text-pretty text-muted-foreground"
        >
          {parts.map((part, i): ReactNode => {
            if (!part.word) return <span key={i}>{part.text}</span>;
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
      </span>
      <ChevronRight
        aria-hidden
        className="pointer-events-none relative size-4 shrink-0 text-muted-foreground"
      />
    </div>
  );
}

export function SettingsRows({
  onOpenPage,
}: {
  onOpenPage: (page: SettingsPage) => void;
}) {
  const words = useWordChoices(onOpenPage);
  const s = useSettings();
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div
          data-settings-rows=""
          className="divide-y divide-border overflow-hidden rounded-lg bg-card text-card-foreground ring-1 ring-foreground/10"
        >
          {GROUPS.map((group) => (
            <SettingsRow
              key={group}
              group={group}
              onOpen={() => onOpenPage(PAGE_OF[group])}
              words={words}
            />
          ))}
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

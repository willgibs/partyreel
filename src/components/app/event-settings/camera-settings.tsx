"use client";

import { useState, type ReactNode } from "react";

import { useSettings } from "@/components/app/event-settings/settings-state";
import { Button } from "@/components/ui/button";
import { ConsequenceLine } from "@/components/ui/consequence-line";
import { Input } from "@/components/ui/input";
import { developTimeWords } from "@/lib/disposable/develop-words";
import type { Capture } from "@/lib/disposable/facts";
import {
  defaultDevelopAt,
  developState,
  developTimeWithinReach,
  revealOf,
  type Reveal,
} from "@/lib/disposable/reveal";
import { ROLL_SHOTS } from "@/lib/disposable/roll";
import { useHydrated } from "@/lib/shared/use-hydrated";
import { cn } from "@/lib/utils";

/**
 * HOW GUESTS ADD, AND WHEN EVERYONE SEES WHAT'S ADDED (the develop and the camera, 20261002200000; the program's
 * synthesis of 2026-10-02): two questions, each independent of the other.
 *  - HOW GUESTS ADD: free uploads, or the album's camera with a roll of 24 each, counted by the server (a shot she
 *    removes gives its frame back).
 *  - WHEN EVERYONE SEES WHAT'S ADDED: ONE three-way choice, right away, once you approve each (today's Review switch,
 *    moved here so a host meets it in one place), or at a develop time (its time, 9 am the day after the party by
 *    default in her own time zone, and Develop now while it waits). Will, r1: "a host config so they can either choose
 *    immediate uploads/visibility or set a 'develop' time guests can see"; and "very streamlined for hosts to switch
 *    between": every answer switches to every other at any time.
 *  - ★ A CHANGE THAT SHOWS PEOPLE SOMETHING SAYS SO FIRST (the door's `ConsequenceLine`): leaving a waiting develop, or
 *    Develop now, puts every photo taken so far in front of every guest at once; leaving "approve each" approves what
 *    is held (now, or for the develop). Nothing else asks.
 *
 * ★ MOUNTABLE: `CaptureAndReveal` takes the values and a save, so the create wizard's later wiring mounts the same
 * control; `CameraSettings` binds it to Settings' one state, which saves each change as it is made. The waiting
 * experience's words and drawings, whether approve plus develop is ever offered, and the preset's name are a design
 * board's after this lane: this is the plain control, in the page's own idiom.
 *
 * Times are the host's own: the develop time is shown and picked in her browser's time zone (`datetime-local`), and
 * stays blank until hydration, since the server cannot know what "9 am" means to her.
 */

export type CaptureAndRevealValue = {
  capture: Capture;
  /** Uploads wait for the host (`moderation_mode = hold_for_approval`). */
  review: boolean;
  developsAt: string | null;
};

export function CameraSettings() {
  const s = useSettings();
  return (
    <CaptureAndReveal
      value={{
        capture: s.values.capture,
        review: s.values.review,
        developsAt: s.values.developsAt,
      }}
      rollSize={s.values.rollSize}
      eventDate={s.values.eventDate || null}
      heldCount={s.pendingCount}
      savingCapture={s.saving("capture")}
      savingReveal={s.saving("review") || s.saving("developsAt")}
      onSave={(patch) => void s.saveEvent(patch)}
    />
  );
}

/** The one consequence a pending change opens, keyed by what it would do. */
type Pending =
  | { kind: "show-waiting"; to: Exclude<Reveal, "develop"> }
  | { kind: "approve-held"; to: Exclude<Reveal, "approve"> }
  | { kind: "develop-now" }
  | null;

const people = (n: number) => (n === 1 ? "1 photo" : `${n} photos`);

export function CaptureAndReveal({
  value,
  rollSize,
  eventDate,
  heldCount,
  savingCapture,
  savingReveal,
  onSave,
}: {
  value: CaptureAndRevealValue;
  /** The camera's roll as the row has it (the database fills in 24), or null before it lands. */
  rollSize: number | null;
  /** The party's date (`YYYY-MM-DD`), which the default develop time follows. */
  eventDate: string | null;
  /** Uploads held for the host's approval now: leaving "approve each" approves them, so it asks first. */
  heldCount: number;
  savingCapture: boolean;
  savingReveal: boolean;
  onSave: (patch: Partial<CaptureAndRevealValue>) => void;
}) {
  const hydrated = useHydrated();
  const [pending, setPending] = useState<Pending>(null);
  const reveal = revealOf(value);
  const develop = developState(value.developsAt);
  const waiting = develop.kind === "waiting";

  /** The patch each answer writes: both columns together, one save, so no half-state is ever stored. */
  const patchFor = (to: Reveal): Partial<CaptureAndRevealValue> => {
    if (to === "right-away") return { review: false, developsAt: null };
    if (to === "approve") return { review: true, developsAt: null };
    // A develop keeps a time still ahead, or offers 9 am the day after the party.
    return {
      review: false,
      developsAt: waiting
        ? value.developsAt
        : defaultDevelopAt({ eventDate }).toISOString(),
    };
  };

  const chooseReveal = (to: Reveal) => {
    setPending(null);
    if (to === reveal) return;
    if (waiting && to !== "develop") {
      setPending({ kind: "show-waiting", to });
      return;
    }
    if (value.review && heldCount > 0 && to !== "approve") {
      setPending({ kind: "approve-held", to });
      return;
    }
    onSave(patchFor(to));
  };

  const confirm = (patch: Partial<CaptureAndRevealValue>) => {
    setPending(null);
    onSave(patch);
  };

  const roll = rollSize ?? ROLL_SHOTS;

  return (
    <div data-capture-and-reveal="" className="space-y-4 px-4 py-3">
      <section className="space-y-2" aria-labelledby="adds-how-label">
        <p id="adds-how-label" className="text-sm font-medium">
          How guests add
        </p>
        <div role="radiogroup" aria-labelledby="adds-how-label" className="space-y-1.5">
          <Choice
            on={value.capture === "upload"}
            label="Free uploads"
            line="Guests add as many photos as they like."
            onChoose={() =>
              value.capture !== "upload" && onSave({ capture: "upload" })
            }
            disabled={savingCapture}
            data="upload"
          />
          <Choice
            on={value.capture === "camera"}
            label="The album's camera"
            line={`A roll of ${roll} shots each. Removing one frees its frame.`}
            onChoose={() =>
              value.capture !== "camera" && onSave({ capture: "camera" })
            }
            disabled={savingCapture}
            data="camera"
          />
        </div>
      </section>

      <section
        className="space-y-2 border-t border-border pt-3"
        aria-labelledby="adds-when-label"
      >
        <p id="adds-when-label" className="text-sm font-medium">
          {"When everyone sees what's added"}
        </p>
        <div role="radiogroup" aria-labelledby="adds-when-label" className="space-y-1.5">
          <Choice
            on={reveal === "right-away"}
            label="Right away"
            line="Each photo shows the moment it's added."
            onChoose={() => chooseReveal("right-away")}
            disabled={savingReveal}
            data="right-away"
          />
          <Choice
            on={reveal === "approve"}
            label="Once you approve each"
            line="Hold new photos until you approve or reject them, instead of showing them live."
            onChoose={() => chooseReveal("approve")}
            disabled={savingReveal}
            data="approve"
          />
          <Choice
            on={reveal === "develop"}
            label="At a develop time"
            line="Hidden until then, and everyone sees them at once."
            onChoose={() => chooseReveal("develop")}
            disabled={savingReveal}
            data="develop"
          >
            {reveal === "develop" ? (
              <DevelopTime
                developsAt={value.developsAt}
                review={value.review}
                hydrated={hydrated}
                saving={savingReveal}
                onSave={(developsAt) => onSave({ developsAt })}
              />
            ) : null}
          </Choice>
        </div>

        {pending?.kind === "show-waiting" ? (
          <ConsequenceLine
            confirmLabel="Show them now"
            onConfirm={() => confirm(patchFor(pending.to))}
            onCancel={() => setPending(null)}
            busy={savingReveal}
          >
            Every photo added so far shows now, to every guest.
          </ConsequenceLine>
        ) : null}
        {pending?.kind === "approve-held" ? (
          <ConsequenceLine
            confirmLabel={
              pending.to === "develop"
                ? "Approve them for the develop"
                : "Approve and show them"
            }
            onConfirm={() => confirm(patchFor(pending.to))}
            onCancel={() => setPending(null)}
            busy={savingReveal}
          >
            {pending.to === "develop"
              ? `${people(heldCount)} under review ${heldCount === 1 ? "is" : "are"} approved, and everyone sees ${heldCount === 1 ? "it" : "them"} at the develop.`
              : `${people(heldCount)} under review ${heldCount === 1 ? "is" : "are"} approved and ${heldCount === 1 ? "shows" : "show"} to everyone now.`}
          </ConsequenceLine>
        ) : null}

        {waiting ? (
          pending?.kind === "develop-now" ? (
            <ConsequenceLine
              confirmLabel="Develop now"
              onConfirm={() =>
                // The database stores a develop time this close to its own clock as its own now.
                confirm({ developsAt: new Date().toISOString() })
              }
              onCancel={() => setPending(null)}
              busy={savingReveal}
            >
              Every photo added so far shows now, to every guest. New ones show
              straight away.
            </ConsequenceLine>
          ) : pending ? null : (
            // One question open at a time: another consequence on screen hides Develop now until it is answered.
            <Button
              size="sm"
              variant="outline"
              disabled={savingReveal}
              data-develop-now=""
              onClick={() => setPending({ kind: "develop-now" })}
            >
              Develop now
            </Button>
          )
        ) : null}
      </section>
    </div>
  );
}

/** One radio card, the door page's own idiom: the whole card is the choice, its name and one line inside. */
function Choice({
  on,
  label,
  line,
  onChoose,
  disabled,
  data,
  children,
}: {
  on: boolean;
  label: string;
  line: string;
  onChoose: () => void;
  disabled?: boolean;
  data: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-choice={data}
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
          disabled={disabled && !on}
          onClick={onChoose}
          className="absolute inset-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-wait"
        >
          <span className="sr-only">{label}</span>
        </button>
        <span
          aria-hidden
          className={cn(
            "pointer-events-none relative mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
            on ? "border-foreground" : "border-muted-foreground/50",
          )}
        >
          {on ? <span className="size-2 rounded-full bg-foreground" /> : null}
        </span>
        <span className="pointer-events-none relative min-w-0 flex-1">
          <span className="block text-sm font-medium">{label}</span>
          <span className="block text-caption text-pretty text-muted-foreground">
            {line}
          </span>
        </span>
      </div>
      {children ? (
        <div className="relative z-10 mt-2.5 pl-6.5">{children}</div>
      ) : null}
    </div>
  );
}

/** `YYYY-MM-DDTHH:mm` in the browser's own time zone, the value a `datetime-local` field holds. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The develop time, picked in her own time zone and saved when she leaves the field. */
function DevelopTime({
  developsAt,
  review,
  hydrated,
  saving,
  onSave,
}: {
  developsAt: string | null;
  review: boolean;
  hydrated: boolean;
  saving: boolean;
  onSave: (developsAt: string) => void;
}) {
  const shown = hydrated && developsAt ? toLocalInput(developsAt) : "";
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const value = draft ?? shown;
  const state = hydrated ? developState(developsAt).kind : "none";
  // Said in her own zone, so only after hydration: the server cannot know what "9 am" means to her.
  const when = hydrated ? developTimeWords(developsAt) : null;

  const commit = () => {
    if (draft === null || draft === shown) {
      setDraft(null);
      return;
    }
    const at = new Date(draft);
    const iso = Number.isFinite(at.getTime()) ? at.toISOString() : null;
    if (!iso || !developTimeWithinReach(iso)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setDraft(null);
    onSave(iso);
  };

  return (
    <div className="space-y-1">
      <label className="sr-only" htmlFor="develops-at">
        Develop time
      </label>
      <Input
        id="develops-at"
        type="datetime-local"
        value={value}
        disabled={!hydrated || saving}
        aria-invalid={invalid || undefined}
        onChange={(e) => {
          setInvalid(false);
          setDraft(e.target.value);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
        className="max-w-60"
      />
      <p className="text-caption text-muted-foreground">
        {!when
          ? " "
          : invalid
            ? "Pick a time within a year."
            : state === "developed"
              ? `Developed ${when}. ${review ? "New ones wait for your approval." : "New ones show straight away."}`
              : `Develops ${when}.`}
      </p>
    </div>
  );
}

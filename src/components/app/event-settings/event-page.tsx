"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import {
  SettingsCard,
  SwitchSetting,
} from "@/components/app/event-settings/settings-furniture";
import { PROFILE_SETUP_PATH } from "@/app/(app)/account/profile/invite";
import {
  type SettingsValues,
  useSettings,
} from "@/components/app/event-settings/settings-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { endForNewStart } from "@/lib/events/dates";
import { LAST_DAY_BEFORE_FIRST } from "@/lib/validation/event";

/** The update schema's own bounds (validation/event.ts), checked here so the field can say so in place. */
const NAME_MAX = 80;
const NOTE_MAX = 2000;

/**
 * A TYPED FIELD THAT SAVES WHEN IT IS LEFT (the board's carried `saves`: "a typed field when you leave
 * it"). What was typed is the field's own until it is left; then it is trimmed, checked, and written if
 * it changed. A refusal is said under the field, where the eye already is, and announced
 * (`aria-live`), with the field marked invalid and described by the sentence (`aria-describedby`).
 *
 * ★ CLOSING THE PANEL LEAVES THE FIELD TOO. Escape, or Back, takes the page away with focus still in
 * it, and a field removed from the page never blurs (React hears no event from a node it no longer
 * holds), so what was typed and not yet left is committed as the field unmounts: every control saves
 * itself, and a closed panel never swallows a name.
 */
function SavingField({
  label,
  optional = false,
  value,
  multiline = false,
  line,
  check,
  onSave,
}: {
  label: string;
  optional?: boolean;
  value: string;
  multiline?: boolean;
  line?: string;
  /** The field's own refusal of what was typed, or null to save it. */
  check: (typed: string) => string | null;
  onSave: (typed: string) => Promise<boolean>;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const lineId = `${id}-line`;
  const [typed, setTyped] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shown = typed ?? value;
  // What was typed and not yet committed, and the latest commit, for the unmount below.
  const pending = useRef<string | null>(null);
  const commitLatest = useRef<(raw: string) => Promise<void>>(async () => {});

  async function commit(raw: string) {
    pending.current = null;
    const next = raw.trim();
    if (next === value) {
      setTyped(null);
      setError(null);
      return;
    }
    const refusal = check(next);
    if (refusal) {
      setError(refusal);
      return;
    }
    setError(null);
    const ok = await onSave(next);
    // Saved: the settings' state now holds it. Refused: the state put it back (and said why), and so
    // does the field.
    setTyped(null);
    if (!ok) setError(null);
  }

  async function leave() {
    if (typed === null) return;
    await commit(typed);
  }

  useEffect(() => {
    commitLatest.current = commit;
  });
  useEffect(
    () => () => {
      const left = pending.current;
      if (left !== null) void commitLatest.current(left);
    },
    [],
  );

  function onTyped(next: string) {
    pending.current = next;
    setTyped(next);
  }

  const describedBy =
    [line ? lineId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;
  const common = {
    id,
    value: shown,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    onBlur: () => void leave(),
  } as const;

  return (
    <div className="space-y-1.5 px-4 py-3">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional ? (
          <span className="font-normal text-muted-foreground"> (optional)</span>
        ) : null}
      </label>
      {multiline ? (
        <Textarea
          {...common}
          rows={3}
          onChange={(e) => onTyped(e.target.value)}
        />
      ) : (
        <Input
          {...common}
          // A typed name saves when it is left, or when Return is pressed (the date's own field is
          // `EventDatesField`, whose picker saves as it changes).
          onChange={(e) => onTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
      )}
      {line ? (
        <p
          id={lineId}
          className="text-caption text-pretty text-muted-foreground"
        >
          {line}
        </p>
      ) : null}
      <p
        id={errorId}
        aria-live="polite"
        className="text-caption text-pretty text-destructive empty:hidden"
      >
        {error ?? ""}
      </p>
    </div>
  );
}

type Dates = Pick<SettingsValues, "eventDate" | "eventEndDate">;

/**
 * THE EVENT'S DATES (lane `event-dates`, Will 2026-10-03: a range of days, no times): the date as it always was, and
 * for a weekend, a conference or a trip, its end beside it. The end is offered, never asked: "Add an end date" opens
 * it, × takes it away. The two are written together in one save whenever a range is in play, so the row never holds
 * half of one (the database's CHECK refuses an end before its date, or without one).
 *
 * ★ A PICKED DAY SAVES AT ONCE, A CLEARED FIELD WHEN IT IS LEFT. A picker commits a whole value and a phone's may never
 * blur, so a day saves as it is picked; but a keyboard clears a field on its way to the next date, and a cleared date
 * takes its end with it, so a clear waits until the field is left (or the panel closes, which leaves it too). An end
 * before the date is refused under the field, where the eye already is (the picker's own minimum stops a picked one);
 * an end on the date itself is the one day it is.
 */
function EventDatesField() {
  const s = useSettings();
  const v = s.values;
  const id = useId();
  const lineId = `${id}-line`;
  const errorId = `${id}-error`;
  const endRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);
  const [typedStart, setTypedStart] = useState<string | null>(null);
  const [typedEnd, setTypedEnd] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shownStart = typedStart ?? v.eventDate;
  const shownEnd = typedEnd ?? v.eventEndDate;
  const open = adding || Boolean(v.eventEndDate);

  // A clear not yet committed, and the latest commits, for the close below.
  const pending = useRef<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });
  const latest = useRef<{
    start: (next: string) => void;
    end: (next: string) => void;
  }>({ start: () => {}, end: () => {} });

  function save(next: Dates) {
    if (
      next.eventDate === v.eventDate &&
      next.eventEndDate === v.eventEndDate
    )
      return;
    // The date alone where no range was or is (one column, as it always saved); both together otherwise.
    void s.saveEvent(
      !next.eventEndDate && !v.eventEndDate
        ? { eventDate: next.eventDate }
        : next,
    );
  }

  function commitStart(next: string) {
    pending.current.start = null;
    setTypedStart(null);
    setError(null);
    const dates: Dates = {
      eventDate: next,
      eventEndDate: endForNewStart(next, v.eventDate, v.eventEndDate),
    };
    if (!dates.eventEndDate) setAdding(false);
    save(dates);
  }

  function commitEnd(next: string) {
    pending.current.end = null;
    if (next && v.eventDate && next < v.eventDate) {
      setTypedEnd(next);
      setError(LAST_DAY_BEFORE_FIRST);
      return;
    }
    setTypedEnd(null);
    setError(null);
    // An end on the date itself is the one day it is.
    const end = next === v.eventDate ? "" : next;
    if (!end) setAdding(false);
    save({ eventDate: v.eventDate, eventEndDate: end });
  }

  useEffect(() => {
    latest.current = { start: commitStart, end: commitEnd };
  });
  useEffect(
    () => () => {
      const { start, end } = pending.current;
      if (start !== null) latest.current.start(start);
      else if (end !== null) latest.current.end(end);
    },
    [],
  );

  // Add an end date opens the field and its picker at once (where the browser lets a page open it).
  useEffect(() => {
    if (!adding) return;
    const field = endRef.current;
    field?.focus();
    try {
      field?.showPicker?.();
    } catch {
      // Some browsers open a date picker only from a press on the field itself: focus is the way in then.
    }
  }, [adding]);

  const describedBy = (withError: boolean) =>
    [lineId, withError && error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className="space-y-1.5 px-4 py-3">
      <label htmlFor={id} className="text-sm font-medium">
        Event date
        <span className="font-normal text-muted-foreground"> (optional)</span>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={id}
          type="date"
          value={shownStart}
          aria-describedby={describedBy(false)}
          className="w-auto min-w-36 flex-1"
          onChange={(e) => {
            const next = e.target.value;
            setTypedStart(next);
            if (next) commitStart(next);
            else pending.current.start = "";
          }}
          onBlur={() => {
            if (pending.current.start !== null) commitStart("");
          }}
        />
        {open ? (
          <div className="flex min-w-48 flex-1 items-center gap-2">
            <span aria-hidden className="text-sm text-muted-foreground">
              to
            </span>
            <Input
              ref={endRef}
              type="date"
              aria-label="End date"
              min={v.eventDate || undefined}
              value={shownEnd}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy(true)}
              className="w-auto min-w-0 flex-1"
              onChange={(e) => {
                const next = e.target.value;
                setTypedEnd(next);
                if (next) commitEnd(next);
                else pending.current.end = "";
              }}
              onBlur={() => {
                if (pending.current.end !== null) commitEnd("");
                else if (adding && !v.eventEndDate && !typedEnd)
                  setAdding(false);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove the end date"
              onClick={() => {
                setAdding(false);
                commitEnd("");
              }}
            >
              <X aria-hidden />
            </Button>
          </div>
        ) : v.eventDate ? (
          <button
            type="button"
            className="text-sm text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 outline-none hover:text-foreground focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => setAdding(true)}
          >
            Add an end date
          </button>
        ) : null}
      </div>
      <p id={lineId} className="text-caption text-pretty text-muted-foreground">
        For your reference only: events never expire.
      </p>
      <p
        id={errorId}
        aria-live="polite"
        className="text-caption text-pretty text-destructive empty:hidden"
      >
        {error ?? ""}
      </p>
    </div>
  );
}

/**
 * THIS EVENT, AS ITS OWN PAGE (event-settings r1): its name, the note guests read under it, the date,
 * and whether it is listed on the host's public profile. Each saves itself: a field when it is left, the
 * switch as it moves.
 *
 * ★ SHOW ON MY PROFILE PERSISTS AT ONCE, as it always has (a deliberate one-key act: a Save buffer
 * would blur what the host just consented to), and says where the profile lives when the host has not
 * claimed a handle yet: a door rather than directions.
 */
export function EventPage() {
  const s = useSettings();
  const v = s.values;
  return (
    <SettingsCard label="This event">
      <SavingField
        label="Event name"
        value={v.name}
        check={(typed) =>
          typed.length === 0
            ? "Give your event a name."
            : typed.length > NAME_MAX
              ? `Event names are capped at ${NAME_MAX} characters.`
              : null
        }
        onSave={(typed) => s.saveEvent({ name: typed })}
      />
      <SavingField
        label="A note for guests"
        optional
        multiline
        value={v.description}
        line="Under the name, on the page they open."
        check={(typed) =>
          typed.length > NOTE_MAX
            ? `Keep the note under ${NOTE_MAX} characters.`
            : null
        }
        onSave={(typed) => s.saveEvent({ description: typed })}
      />
      <EventDatesField />
      {v.displayInProfile !== null ? (
        <SwitchSetting
          label="Show on my profile"
          line={
            <>
              {
                "Lists this event, with its album link, on your public profile page. "
              }
              {/* The page's own setup, straight (crumbs-44): it opened Account's
                  Public profile card, whose one button was this same door. */}
              {s.hostHasSlug ? null : (
                <Link
                  href={PROFILE_SETUP_PATH}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Claim your handle to publish the page
                </Link>
              )}
            </>
          }
          checked={v.displayInProfile}
          onCheckedChange={(next) => void s.saveProfile(next)}
        />
      ) : null}
    </SettingsCard>
  );
}

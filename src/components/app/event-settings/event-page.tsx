"use client";

import { useId, useState } from "react";
import Link from "next/link";

import {
  SettingsCard,
  SwitchSetting,
} from "@/components/app/event-settings/settings-furniture";
import { useSettings } from "@/components/app/event-settings/settings-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/** The update schema's own bounds (validation/event.ts), checked here so the field can say so in place. */
const NAME_MAX = 80;
const NOTE_MAX = 2000;

/**
 * A TYPED FIELD THAT SAVES WHEN IT IS LEFT (the board's carried `saves`: "a typed field when you leave
 * it"). What was typed is the field's own until it is left; then it is trimmed, checked, and written if
 * it changed. A refusal is said under the field, where the eye already is, and announced
 * (`aria-live`), with the field marked invalid and described by the sentence (`aria-describedby`).
 */
function SavingField({
  label,
  optional = false,
  value,
  multiline = false,
  type,
  line,
  check,
  onSave,
}: {
  label: string;
  optional?: boolean;
  value: string;
  multiline?: boolean;
  type?: "date";
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

  async function commit(raw: string) {
    const next = type === "date" ? raw : raw.trim();
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
          onChange={(e) => setTyped(e.target.value)}
        />
      ) : (
        <Input
          {...common}
          type={type}
          onChange={(e) => {
            setTyped(e.target.value);
            // A date picker commits a whole value at once, and a phone's may never blur: it saves as
            // it changes. A typed name saves when it is left, or when Return is pressed.
            if (type === "date") void commit(e.target.value);
          }}
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
      <SavingField
        label="Event date"
        optional
        type="date"
        value={v.eventDate}
        line="For your reference only: events never expire."
        check={() => null}
        onSave={(typed) => s.saveEvent({ eventDate: typed })}
      />
      {v.displayInProfile !== null ? (
        <SwitchSetting
          label="Show on my profile"
          line={
            <>
              {
                "Lists this event, with its album link, on your public profile page. "
              }
              {s.hostHasSlug ? null : (
                <Link
                  href="/account#public-profile"
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

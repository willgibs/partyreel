"use client";

import { Input } from "@/components/ui/input";
import { ClientForm } from "@/components/ui/client-form";
import { cn } from "@/lib/utils";

/**
 * THE NAME, AT THE SIZE IT WILL BE (first-event's `asks=one`, his "bigger name edit field"; create-wizard
 * r2's carried `name`, taken: "the name alone at its size. At a phone the keyboard holds the lower part of
 * the screen and Continue rides on it"). One field on a rule, never in a box: a box would make it one
 * field of a form, and the whole verdict is that it is not.
 *
 * ★ THE FIELD'S OWN WORDS ARE MEASURED, NOT ITS BOX (`data-room-name-text`): an invisible mirror of what
 * she typed stands exactly over the field's text, so the carry flies her words from where they really
 * are (`carry.ts`), whatever their length.
 *
 * The question that labels it is the room's (`RoomPage`); Continue at the room's foot submits this form
 * from outside it (`form`), and Enter does the same from inside.
 */
export function NameStep({
  formId,
  questionId,
  errorId,
  name,
  error,
  onName,
  onSubmit,
}: {
  formId: string;
  /** The room's question, which is this field's label. */
  questionId: string;
  errorId: string;
  name: string;
  error: string | null;
  onName: (name: string) => void;
  onSubmit: () => void;
}) {
  const type = "font-heading text-chapter md:text-title";
  return (
    <ClientForm
      id={formId}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="w-full max-w-[760px]"
    >
      <div className="cr-name relative" data-invalid={error ? "" : undefined}>
        <Input
          autoFocus
          data-room-name-input=""
          value={name}
          onChange={(e) => onName(e.target.value)}
          aria-labelledby={questionId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          maxLength={80}
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="next"
          placeholder="Maya & Jay's Wedding"
          className={cn(
            "cr-name-field h-auto rounded-none border-0 bg-transparent px-0 py-0 text-center shadow-none",
            "focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent",
            type,
          )}
        />
        <span
          aria-hidden
          data-room-name-text=""
          className={cn(
            "pointer-events-none invisible absolute inset-x-0 top-0 mx-auto block w-fit max-w-full overflow-hidden whitespace-pre",
            type,
          )}
        >
          {name}
        </span>
      </div>
      <span
        aria-hidden
        className="cr-name-rule mt-4 block h-0.5 w-full rounded-full md:mt-5"
      />
      {/* Its line is always kept, so the name never moves when a refusal arrives under it. */}
      <p
        id={errorId}
        aria-live="polite"
        className="mt-3 min-h-5 text-center text-working text-destructive"
      >
        {error}
      </p>
    </ClientForm>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { checkProfileSlugAction } from "@/app/(app)/account/social-actions";
import { Input } from "@/components/ui/input";
import { profileSlugSchema } from "@/lib/validation/profile";
import { cn } from "@/lib/utils";

/**
 * THE HANDLE FIELD, ONE PIECE FOR BOTH PLACES A HANDLE IS CHOSEN: the setup wizard's first screen
 * (`identity-profile` r1, `setup=wizard`) and the Account card's Change (`ProfileSlugControl`).
 * Lifted out of the control whole, so the two can never disagree about what is valid, what is taken
 * or what the line under the field says.
 *
 * The live status of what's in the input is the EventSlugControl state machine, re-derived for the
 * PROFILE handle: validity from `profileSlugSchema`, availability from a signed-in server action
 * (`checkProfileSlugAction`; there is no anon RPC for profile slugs, which keeps availability off
 * the enumeration surface).
 */
export type HandleStatus =
  | { kind: "idle" }
  | { kind: "invalid"; message: string }
  | { kind: "current" }
  | { kind: "checking"; slug: string }
  | { kind: "available"; slug: string }
  | { kind: "taken"; slug: string };

const DEBOUNCE_MS = 400;

/**
 * The status of `value` against the persisted handle `current` (null before one exists). Pure,
 * synchronous classification first; only a valid, non-current candidate needs the network check,
 * debounced and race-guarded (a newer keystroke supersedes an in-flight answer). `markTaken` records
 * a refusal the save itself met (taken between the check and the write), so the field says so
 * without asking again.
 */
export function useHandleStatus(
  value: string,
  current: string | null,
): { status: HandleStatus; markTaken: (slug: string) => void } {
  // The async availability verdict for ONE candidate; set only inside the debounced callback (never
  // synchronously in the effect body) or by `markTaken`.
  const [availability, setAvailability] = useState<{
    slug: string;
    available: boolean;
  } | null>(null);
  const reqId = useRef(0);

  const trimmed = value.trim().toLowerCase();
  // ★ The held handle is read BEFORE the rules: one claimed before a rule grew (the brand's family,
  // reserved-slugs.ts) is still her page, so Change opens on it as current, never as a refusal.
  const isCurrent = trimmed !== "" && trimmed === current;
  const parsed =
    trimmed && !isCurrent ? profileSlugSchema.safeParse(trimmed) : null;
  const evaluated:
    | { kind: "idle" }
    | { kind: "invalid"; message: string }
    | { kind: "current" }
    | { kind: "check"; normalized: string } = !trimmed
    ? { kind: "idle" }
    : isCurrent
      ? { kind: "current" }
      : !parsed || !parsed.success
        ? {
            kind: "invalid",
            message:
              parsed?.error.issues[0]?.message ??
              "That handle isn't available.",
          }
        : { kind: "check", normalized: parsed.data };
  const checkTarget = evaluated.kind === "check" ? evaluated.normalized : null;

  useEffect(() => {
    if (!checkTarget) {
      reqId.current += 1; // invalidate any in-flight check
      return;
    }
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      const { available } = await checkProfileSlugAction(checkTarget);
      if (id !== reqId.current) return; // superseded by a newer keystroke
      setAvailability({ slug: checkTarget, available });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [checkTarget]);

  const markTaken = useCallback((slug: string) => {
    reqId.current += 1;
    setAvailability({ slug, available: false });
  }, []);

  const status: HandleStatus =
    evaluated.kind === "idle"
      ? { kind: "idle" }
      : evaluated.kind === "invalid"
        ? { kind: "invalid", message: evaluated.message }
        : evaluated.kind === "current"
          ? { kind: "current" }
          : availability && availability.slug === evaluated.normalized
            ? availability.available
              ? { kind: "available", slug: evaluated.normalized }
              : { kind: "taken", slug: evaluated.normalized }
            : { kind: "checking", slug: evaluated.normalized };

  return { status, markTaken };
}

/** The input: `/u/` before it, the status's own mark after it. */
export function HandleField({
  id,
  value,
  onChange,
  status,
  autoFocus,
  className,
}: {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  status: HandleStatus;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
        /u/
      </span>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="your-name"
        aria-label={id ? undefined : "Profile handle"}
        aria-invalid={status.kind === "taken" || status.kind === "invalid"}
        aria-describedby={id ? `${id}-status` : undefined}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        className="pr-9 pl-9"
      />
      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        {status.kind === "checking" && (
          <span aria-hidden className="working-arc text-muted-foreground" />
        )}
        {status.kind === "available" && (
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
        )}
        {(status.kind === "taken" || status.kind === "invalid") && (
          <AlertCircle className="size-4 text-destructive" />
        )}
      </span>
    </div>
  );
}

/**
 * The line under the field. `idle` says `idleHint` when there is one (the first claim's rules), and
 * nothing otherwise. `host` is the site's own host, so an available handle reads as the address it
 * will be.
 */
export function HandleStatusLine({
  id,
  status,
  host,
  idleHint,
}: {
  id?: string;
  status: HandleStatus;
  host: string;
  idleHint?: string;
}) {
  if (status.kind === "idle") {
    return idleHint ? (
      <p id={id} className="text-xs text-muted-foreground">
        {idleHint}
      </p>
    ) : null;
  }
  return (
    <p
      id={id}
      key={status.kind}
      data-slug-status
      aria-live="polite"
      className={cn(
        "text-xs",
        status.kind === "available"
          ? "text-emerald-600 dark:text-emerald-400"
          : status.kind === "taken" || status.kind === "invalid"
            ? "text-destructive"
            : "text-muted-foreground",
      )}
    >
      {status.kind === "checking" && "Checking availability…"}
      {status.kind === "available" && `${host}/u/${status.slug} is available.`}
      {status.kind === "taken" && "That handle is taken. Try another."}
      {status.kind === "invalid" && status.message}
      {status.kind === "current" && "This is your current handle."}
    </p>
  );
}

"use client";

import { useState, useTransition } from "react";
import { User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  checkDisplayName,
  joinEvent,
  renameGuest,
  type JoinRefusal,
} from "@/lib/guest/join";
import { readLastName, setStoredName } from "@/lib/guest/use-stored-name";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/profile";

/**
 * THE DOOR, ON A NAME-ONLY EVENT (the identity reshape, 2026-09-21; Will's
 * `address=none`: "the door asks a name, and the only place an address is ever
 * typed is inside the sign-in door, where the code proves it by construction").
 *
 * ★ IT IS ASKED AT THE FIRST ADD, NOT AT ARRIVAL, and that is a call rather than
 * a ruling (listed in the Handoff as his to overrule). Looking at somebody's
 * wedding album costs nothing and asks nothing; the moment a name becomes a FACT
 * about the album is the moment a guest puts something in it. Asking at arrival
 * would put a form between a scanned code and a photograph, which is the whole
 * thing the product does not do.
 *
 * ★ THE PREFILL IS THE LAST NAME THIS DEVICE TYPED, at any event
 * (`pr_guest_name_last`). The second party a phone scans should not ask a
 * stranger's question twice, and a prefilled field a guest can overwrite costs
 * nothing if they are a different person holding the same phone.
 *
 * ★ REFUSED IN PLACE, NEVER BY A TOAST. A reserved name and an empty field are
 * both answered under the input by `checkDisplayName` (the shared
 * `displayNameSchema`, so one policy) before anything is sent; the route's own
 * 422s (profanity, its own re-parse) land in the same slot. The one refusal that
 * is NOT this step's business is `verification_required`: the host flipped the
 * switch while the guest stood here, so the caller re-gates rather than this form
 * arguing with it.
 */
export function GuestNameStep({
  qrToken,
  mode,
  hostName,
  storedName,
  sessionToken,
  onNamed,
  onVerificationRequired,
}: {
  qrToken: string;
  /** `join` mints the session; `edit` renames the row this device already holds. */
  mode: "join" | "edit";
  /** The host's name, so the reason line says whose album this joins. */
  hostName?: string | null;
  /** The name this device already typed at THIS event, if any. */
  storedName?: string | null;
  /** Required in `edit` mode: the capability whose row is renamed. */
  sessionToken?: string | null;
  /** Fired with the live session token once the row carries the name. */
  onNamed: (result: { sessionToken: string | null; displayName: string }) => void;
  /** The host turned Require verified emails ON mid-visit; the gate is the way in now. */
  onVerificationRequired?: (message: string) => void;
}) {
  const [value, setValue] = useState(
    () => storedName ?? readLastName() ?? "",
  );
  const [refusal, setRefusal] = useState<JoinRefusal | null>(null);
  const [saving, startSave] = useTransition();
  const editing = mode === "edit";
  const copy = guestNameCopy(mode, hostName);

  function submit() {
    const checked = checkDisplayName(value);
    if (!checked.ok) {
      setRefusal(checked.refusal);
      return;
    }
    const name = checked.name;
    startSave(async () => {
      setRefusal(null);
      /* ────────────────────────────────────────────────────────────────────
         A HELD SESSION NAMES ITS ROW (DEFECT 2, the alias red-team,
         2026-09-21). This used to gate on `editing && sessionToken`, so a
         "join"-mode open on a device that already holds a session but no
         LOCAL name (a row minted before the reshape, or by the queue's own
         silent join) fell into the join branch below and minted a SECOND
         row for the same person, stranding the first one's photographs under
         "A guest". A session token means a row already exists to answer for,
         whichever door raised this step, so it is `renameGuest`'s to try
         first now, regardless of mode.

         Only two of its refusals fall through to a fresh join: `invalid_session`
         (a genuinely DEAD token — the route's own "not found") and
         `unauthorized` (a VERIFIED row, which cannot happen for a nameless
         session in practice — this door never opens for one — but the route,
         not this component's assumption, is the truth, so it falls through
         too rather than dead-ending). Every other refusal (a bad name, the
         limiter) is this step's to show, exactly as before.
         ──────────────────────────────────────────────────────────────────── */
      if (sessionToken) {
        const renamed = await renameGuest({
          qrToken,
          sessionToken,
          displayName: name,
        });
        if (renamed.ok) {
          setStoredName(qrToken, renamed.displayName);
          onNamed({ sessionToken, displayName: renamed.displayName });
          return;
        }
        if (
          renamed.refusal.kind !== "invalid_session" &&
          renamed.refusal.kind !== "unauthorized"
        ) {
          setRefusal(renamed.refusal);
          return;
        }
        // A dead token or a (defensive) verified row: nothing left to rename,
        // so fall through to the same fresh join a session-less device takes.
      }
      const joined = await joinEvent({ qrToken, displayName: name });
      if (!joined.ok) {
        if (joined.refusal.kind === "verification_required") {
          onVerificationRequired?.(joined.refusal.message);
          return;
        }
        setRefusal(joined.refusal);
        return;
      }
      // The row's own name, never the typed string: the RPC trims it, and on a
      // verified session it nulls it outright (one identity per row).
      const landed = joined.guest.displayName ?? name;
      setStoredName(qrToken, landed);
      onNamed({ sessionToken: joined.guest.sessionToken, displayName: landed });
    });
  }

  return (
    <form
      data-guest-name-step={mode}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-4"
    >
      {/* The shell already carries these two strings as the sheet's sr-only
          accessible name and description (`entry-shell.tsx`'s own division:
          "steps render visible headings"). They are rendered here for the EYE
          and hidden from the a11y tree, because unlike the welcome's eyebrow
          they are word-for-word the same sentences: a screen reader that read
          both would say each of them twice. */}
      <div aria-hidden>
        <p className="font-heading text-page text-balance">{copy.title}</p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          {copy.reason}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label
          htmlFor="pr-guest-name"
          className="flex items-center gap-1.5 text-base font-medium"
        >
          <User className="size-4 text-muted-foreground" aria-hidden />
          What should we call you?
        </Label>
        <Input
          id="pr-guest-name"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (refusal) setRefusal(null);
          }}
          placeholder="Your name"
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          autoComplete="name"
          autoFocus
          enterKeyHint="go"
          aria-invalid={refusal ? true : undefined}
          aria-describedby="pr-guest-name-hint"
          className="h-11 text-base"
        />
        {refusal ? (
          <p id="pr-guest-name-hint" className="text-reading text-destructive">
            {refusal.message}
          </p>
        ) : (
          // Will's own drawn line on the board he ruled (`guest-verify` round
          // two, the `none` door): the reassurance is that nothing is being
          // proved, because every other door this guest has met asked them to
          // prove something.
          <p
            id="pr-guest-name-hint"
            className="text-reading text-muted-foreground"
          >
            Just a name. Nobody has to prove a name.
          </p>
        )}
      </div>
      <Button
        type="submit"
        size="cta"
        className="w-full"
        disabled={saving || !value.trim()}
      >
        {saving
          ? "Just a second…"
          : editing
            ? "Save name"
            : "Add photos"}
      </Button>
    </form>
  );
}

/**
 * The step's two sentences, in one place: the entry shell needs them as its
 * sr-only accessible name and description, and the step renders them visibly
 * (the shell's own rule, `entry-shell.tsx`). One source, so the sheet a screen
 * reader announces and the sheet a guest reads cannot drift apart.
 */
export function guestNameCopy(
  mode: "join" | "edit",
  hostName?: string | null,
): { title: string; reason: string } {
  if (mode === "edit") {
    return {
      title: "Change your name",
      reason: "Your new name shows on everything you have already added.",
    };
  }
  return {
    title: "Add your photos",
    reason: `Your name goes on what you add, so ${hostName?.trim() || "the host"} knows who to thank.`,
  };
}

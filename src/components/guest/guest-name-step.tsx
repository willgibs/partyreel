"use client";

import { useState, useTransition } from "react";

import { updateDisplayNameAction } from "@/app/(app)/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  attachGuestEmail,
  checkDisplayName,
  checkGuestEmail,
  joinEvent,
  renameGuest,
  type JoinRefusal,
} from "@/lib/guest/join";
import {
  readLastName,
  setLastName,
  setStoredName,
} from "@/lib/guest/use-stored-name";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/profile";
// The route's own cap, so the field cannot accept what the parse behind it
// refuses (the column's CHECK is the same number).
import { MAX_GUEST_EMAIL_LENGTH } from "@/lib/validation/upload";

/**
 * THE DOOR, ON A NAME-ONLY EVENT (the identity reshape, 2026-09-21; the optional
 * address added by Will's ruling of 2026-09-22, "guest identity: name only,
 * unconfirmed email, verified account").
 *
 * ★ AND IT ASKS FOR AN ADDRESS AGAIN, OPTIONALLY (Will, 2026-09-22, which
 * SUPERSEDES `address=none`): "Agree with you that an optional email field under
 * name for unverified events is more streamlined than its own screen." One
 * compact field under the name, a benefit as its helper line, and nothing said
 * about proving anything: what is typed is stored UNCONFIRMED, shown to nobody,
 * mailed nothing, and exists so this guest can claim these photographs from any
 * device the day they confirm it. Skipping it costs the guest nothing at all,
 * which is why the field is last, unfocused and never prefilled.
 *
 * ★ IT IS ASKED BEFORE THE ALBUM NOW, NOT AT THE FIRST ADD (Will, 2026-09-21, "the door as three
 * steps", overruling the call this file used to carry): "if they can reach the album media without
 * entering their name, they're able to reap all the rewards of the album anonymously, then friction
 * occurs when they go to actually contribute. We should handle the friction as a quick gate to the
 * reward, so that uploading feels seamless once you're in the album." So the step is one of the
 * door's ordered steps with the album a step behind it, and the reward is what pays for the field.
 *
 * ★ FOUR MODES, BECAUSE FOUR DOORS ASK THE SAME QUESTION, AND ONLY ONE OF THEM
 *   CARRIES THE ADDRESS FIELD:
 *   `join`    names mode, and the ONLY mode with the optional email field. A held session renames
 *             its row (then attaches the address on a second call); otherwise the join mints one
 *             under the typed name and the address in ONE post. The machine advances to whatever
 *             is next.
 *   `edit`    the album menu's "Change name", unchanged, and the one dismissible door left.
 *   `hold`    VERIFIED mode, before the confirmation. The join would answer 422 (nothing is
 *             proved yet), so nothing is sent: the name is validated locally, kept in the modal's
 *             own state as `typedName`, written to `pr_guest_name_last` ONLY (never the per-event
 *             key, which would claim a row that does not exist), and the email step follows. NO
 *             field here: the very next step asks for an address and PROVES it, so offering an
 *             unproven one a moment earlier would be asking the same question twice and meaning
 *             less by it.
 *   `profile` a CONFIRMED account with no profile name. `updateDisplayNameAction`, which is what
 *             the inline `SetNameStep` panel used to do further down the page. No field: a
 *             confirmed account already has the only address that counts.
 *
 * ★ THE PREFILL IS THE LAST NAME THIS DEVICE TYPED, at any event
 * (`pr_guest_name_last`). The second party a phone scans should not ask a
 * stranger's question twice, and a prefilled field a guest can overwrite costs
 * nothing if they are a different person holding the same phone.
 *
 * ★ REFUSED IN PLACE, NEVER BY A TOAST. A reserved name and an empty field are
 * both answered under the input by `checkDisplayName` (the shared
 * `displayNameSchema`, so one policy) before anything is sent; the route's own
 * 422s (profanity, its own re-parse) land in the same slot. A mistyped address
 * works the same way through `checkGuestEmail`, in its OWN slot under its own
 * field, because a refusal under the name field would be pointing at the wrong
 * question. The one refusal that is NOT this step's business is
 * `verification_required`: the host flipped the switch while the guest stood
 * here, so the caller re-gates rather than this form arguing with it.
 */
/** The four doors that ask one question; see the head comment. */
export type GuestNameMode = "join" | "edit" | "hold" | "profile";

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
  /** See the four modes in this file's head comment. */
  mode: GuestNameMode;
  /**
   * Kept for the callers and the lab's fixtures, and no longer read: the lede
   * says "the host" whoever they are (Will, 2026-09-22). See `guestNameCopy`.
   */
  hostName?: string | null;
  /** The name this device already typed at THIS event, if any. */
  storedName?: string | null;
  /** Required in `edit` mode: the capability whose row is renamed. */
  sessionToken?: string | null;
  /**
   * Fired with the live session token once the row carries the name.
   * `emailAttached` says whether the row now holds an unconfirmed address (the
   * device flag the guest's own menu reads); `email` is the address itself,
   * handed up IN MEMORY for this visit alone so the offer card's door can
   * prefill it. Nothing persists it, which is the whole shared-phone rule.
   */
  onNamed: (result: {
    sessionToken: string | null;
    displayName: string;
    emailAttached: boolean;
    email: string | null;
  }) => void;
  /** The host turned Require verified emails ON mid-visit; the gate is the way in now. */
  onVerificationRequired?: (message: string) => void;
}) {
  const [value, setValue] = useState(
    () => storedName ?? readLastName() ?? "",
  );
  /* ★ NEVER PREFILLED, unlike the name beside it. The name's prefill is a
     kindness at the second party a phone scans; an ADDRESS carried across
     parties is the last guest's address shown to the next one, which is the
     rule `lib/auth/remembered-email.ts` exists to keep. */
  const [email, setEmail] = useState("");
  const [refusal, setRefusal] = useState<JoinRefusal | null>(null);
  /* The address's refusal lives apart from the name's so each sits under the
     field it is about; one slot would point a guest at the wrong question. */
  const [emailRefusal, setEmailRefusal] = useState<JoinRefusal | null>(null);
  const [saving, startSave] = useTransition();
  const editing = mode === "edit";
  const copy = guestNameCopy(mode, hostName);
  // The one mode that asks. See the head comment for why the other three do not.
  const asksEmail = mode === "join";

  function submit() {
    const checked = checkDisplayName(value);
    if (!checked.ok) {
      setRefusal(checked.refusal);
      return;
    }
    const name = checked.name;

    /* The optional address, parsed before anything is sent. A blank field is an
       ANSWER (`email: null`), not a refusal: the question is optional and the
       guest has already moved past it. */
    const checkedEmail = asksEmail
      ? checkGuestEmail(email)
      : ({ ok: true, email: null } as const);
    if (!checkedEmail.ok) {
      setEmailRefusal(checkedEmail.refusal);
      return;
    }
    const typedEmail = checkedEmail.email;

    /* ★ THE HELD NAME SENDS NOTHING (verified mode, before the confirmation). `create_guest`
       refuses an unverified join on this event with a 422, so asking it would be asking for a
       refusal. The name is validated by the SAME `checkDisplayName` every other mode uses, kept
       by the modal as `typedName`, and written to the LAST-NAME key alone: the per-event key
       means "this device is named at this event", which is not true until a row exists. */
    if (mode === "hold") {
      setLastName(name);
      onNamed({
        sessionToken: null,
        displayName: name,
        emailAttached: false,
        email: null,
      });
      return;
    }

    /* ★ AND A CONFIRMED ACCOUNT WITH NO PROFILE NAME WRITES THE PROFILE. Their identity is the
       account's, so there is no guest row to name: `create_guest` nulls a typed name beside a
       confirmed session anyway. This replaces the inline SetNameStep panel that used to sit above
       the upload area, so the question is asked once, at the door, like every other. */
    if (mode === "profile") {
      startSave(async () => {
        setRefusal(null);
        const result = await updateDisplayNameAction(name);
        if (!result.ok) {
          setRefusal({
            kind: "name_invalid",
            message: result.message ?? "That name isn't available.",
          });
          return;
        }
        setLastName(name);
        onNamed({
          sessionToken: sessionToken ?? null,
          displayName: name,
          emailAttached: false,
          email: null,
        });
      });
      return;
    }

    startSave(async () => {
      setRefusal(null);
      setEmailRefusal(null);
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
          /* ★ THE HELD-SESSION PATH IS TWO CALLS, AND ONLY WHEN AN ADDRESS WAS
             TYPED. A rename cannot carry one (its route names a row and nothing
             else), so the address follows on `/api/guests/email`. A refusal
             there costs the address and never the entry: the guest is named and
             through the door either way, and the menu's "Add your email" is the
             same act one tap away. */
          let attached = false;
          if (typedEmail) {
            const put = await attachGuestEmail({
              qrToken,
              sessionToken,
              email: typedEmail,
            });
            if (!put.ok && put.refusal.kind === "email_invalid") {
              // The route disagreed with the local parse: say so under the
              // field rather than swallowing it, since it is still fixable.
              setEmailRefusal(put.refusal);
              return;
            }
            attached = put.ok && put.emailAttached;
          }
          onNamed({
            sessionToken,
            displayName: renamed.displayName,
            emailAttached: attached,
            email: attached ? typedEmail : null,
          });
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
      /* ★ A FRESH JOIN IS ONE POST, name and address together. The key is absent
         when nothing was typed, so a guest who declined the field sends exactly
         the body this door sent before the field existed. */
      const joined = await joinEvent({
        qrToken,
        displayName: name,
        ...(typedEmail ? { email: typedEmail } : {}),
      });
      if (!joined.ok) {
        if (joined.refusal.kind === "verification_required") {
          onVerificationRequired?.(joined.refusal.message);
          return;
        }
        // The address is the one refusal that belongs under the other field.
        if (joined.refusal.kind === "email_invalid") {
          setEmailRefusal(joined.refusal);
          return;
        }
        setRefusal(joined.refusal);
        return;
      }
      // The row's own name, never the typed string: the RPC trims it, and on a
      // verified session it nulls it outright (one identity per row). The same
      // rule holds for the address: `email_attached` is what the ROW carries,
      // so a verified-required event or a confirmed session reads false here
      // even though something was typed.
      const landed = joined.guest.displayName ?? name;
      setStoredName(qrToken, landed);
      onNamed({
        sessionToken: joined.guest.sessionToken,
        displayName: landed,
        emailAttached: joined.guest.emailAttached,
        email: joined.guest.emailAttached ? typedEmail : null,
      });
    });
  }

  return (
    <form
      data-guest-name-step={mode}
      /* ★ THE BROWSER NEVER GETS TO REFUSE THIS FORM. A native `type="email"`
         field inside a form makes the browser run its own constraint check on
         submit: it BLOCKS the submission and pops its own bubble ("Please enter
         an email address"), so `onSubmit` never runs and the refusal slot under
         the field never fills. That is a chrome-coloured, untranslated, unstyled
         sentence about an OPTIONAL question, in place of ours — and it would
         have stopped the name from being sent at all. `noValidate` hands the
         whole job back to `checkGuestEmail`, which is where the door's one
         refusal grammar lives. */
      noValidate
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
        {/* ★ THE QUESTION IS THE HEADING NOW (the door as three steps, 2026-09-21). The step's
            title used to be "Add your photos" and the field's label carried the question; the
            title IS the question at the door, so a visible label would be the same eight words
            twice in one sheet. The label stays for the a11y tree, naming the FIELD. */}
        <Label htmlFor="pr-guest-name" className="sr-only">
          Your name
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
      {/* ★ THE OPTIONAL ADDRESS (Will, 2026-09-22). Under the name and its hint,
          one compact field with a VISIBLE label, because unlike the name this
          question is not the heading and "(optional)" is the most important
          word on the step: a guest must be able to see that skipping it is a
          real choice before they decide. No autofocus (the name keeps it, and
          the keyboard is already up), a `type="email"` so the phone brings the
          right keys, and a helper line that is a benefit to THEM rather than a
          reason of ours. */}
      {asksEmail && (
        <div className="space-y-1.5">
          <Label htmlFor="pr-guest-email">Email (optional)</Label>
          <Input
            id="pr-guest-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailRefusal) setEmailRefusal(null);
            }}
            placeholder="you@email.com"
            maxLength={MAX_GUEST_EMAIL_LENGTH}
            enterKeyHint="go"
            aria-invalid={emailRefusal ? true : undefined}
            aria-describedby="pr-guest-email-hint"
            className="h-11 text-base"
          />
          {emailRefusal ? (
            <p id="pr-guest-email-hint" className="text-reading text-destructive">
              {emailRefusal.message}
            </p>
          ) : (
            // What the address BUYS them, and nothing about what it is for us.
            // Nothing is sent to it, now or later, until they confirm it.
            <p
              id="pr-guest-email-hint"
              className="text-reading text-muted-foreground"
            >
              Come back to this album anytime, with every photo you add.
            </p>
          )}
        </div>
      )}
      <Button
        type="submit"
        size="cta"
        className="w-full"
        disabled={saving || !value.trim()}
      >
        {saving ? "Just a second…" : editing ? "Save name" : "Continue"}
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
  mode: GuestNameMode,
  /** Ignored since 2026-09-22 (see the `join` branch); kept so callers compile. */
  _hostName?: string | null,
): { title: string; reason: string } {
  if (mode === "edit") {
    return {
      title: "Change your name",
      reason: "Your new name shows on everything you have already added.",
    };
  }
  if (mode === "profile") {
    // A confirmed account: the name is not just this album's, so the second sentence says so.
    return {
      title: "What should we call you?",
      reason:
        "Your name goes on the photos you add. It becomes your Partyreel name too.",
    };
  }
  /* ★ THE HOST GOES UNNAMED HERE NOW (Will, 2026-09-22, verbatim: "Let's lose
     the lead on 'so Will Gibson knows who to thank' too. 'so the host knows who
     to thank'."), which overrules the earlier call that named them with "the
     host" only as a fallback. `hostName` stays in the signature, ignored, so
     every caller and the lab's fixtures compile untouched. */
  return {
    title: "What should we call you?",
    reason: "Your name goes on the photos you add, so the host knows who to thank.",
  };
}

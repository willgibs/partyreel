"use client";

import { useRef, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { Mail } from "lucide-react";

import { updateDisplayNameAction } from "@/app/(app)/account/actions";
import { Button } from "@/components/ui/button";
import { floatingKeyboardFoot } from "@/components/ui/floating-layer";
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
import { SESSION_OTHER_ACCOUNT } from "@/lib/guest/session-owner";
import {
  readLastName,
  setLastName,
  setStoredName,
} from "@/lib/guest/use-stored-name";
import { dropGuestTicket } from "@/lib/guest/use-stored-session";
import { cn } from "@/lib/utils";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/profile";
// The route's own cap, so the field cannot accept what the parse behind it
// refuses (the column's CHECK is the same number).
import { MAX_GUEST_EMAIL_LENGTH } from "@/lib/validation/upload";

/**
 * THE NAME, AT THE DOOR: "Continue as guest" on a name-only event, a confirmed account's missing
 * name, and the album menu's "Change name".
 *
 * ★ THE ADDRESS IS OFFERED, OPTIONALLY, AS A GHOST LINE (Will, `identity-door` r1 `field=ghost`:
 * "making email more subtle and easily skippable will likely be appreciated by guests. We're more
 * likely to win them over and get their email once they start seeing the value"). Only the name
 * shows; one quiet full-width row under it says what an address buys, and a tap turns it into the
 * labelled field with focus inside it. What is typed is stored UNCONFIRMED, shown to nobody, mailed
 * nothing, and exists so this guest can claim these photographs from any device the day they
 * confirm it, so skipping it costs nothing, and the line stays one line at 375: it reads at the
 * working size, and under 360px its icon steps aside so the words still fit on one line at 320.
 *
 * ★ IT IS ASKED BEFORE THE ALBUM, NOT AT THE FIRST ADD. A guest who can reach the album's
 * media without entering a name reaps all of its rewards anonymously, and the friction then lands
 * at the moment they go to contribute. As a quick gate in front of the reward it is paid once, and
 * uploading feels seamless from inside the album.
 *
 * ★ THREE MODES, BECAUSE THREE DOORS ASK THE SAME QUESTION, AND ONLY ONE OF THEM
 *   CARRIES THE ADDRESS:
 *   `join`    Continue as guest, and the ONLY mode with the optional email. A held session renames
 *             its row (then attaches the address on a second call); otherwise the join mints one
 *             under the typed name and the address in ONE post. The machine advances to whatever
 *             is next.
 *   `edit`    the album menu's "Change name", and the one dismissible door.
 *   `profile` a CONFIRMED account with no profile name: `updateDisplayNameAction`. No address: a
 *             confirmed account already has the only one that counts.
 * (A verification event asks the name and the address together, on `identify-step.tsx`, so the
 * name is never held here waiting for a code.)
 *
 * ★ THE KEYBOARD MOVES ONLY WHEN THE GUEST DOES. Nothing here autofocuses: the iOS keyboard rising
 * into a sheet that is still arriving is what made the door feel broken. The ghost line's tap
 * moves focus into the field it opens (inside the tap, so iOS raises the keyboard for it), Return
 * on the name moves to the address when it is open, and a step change never unmounts a focused
 * field: the field lets go first.
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
/** The three doors that ask one question; see the head comment. */
export type GuestNameMode = "join" | "edit" | "profile";

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
  /** See the three modes in this file's head comment. */
  mode: GuestNameMode;
  /**
   * Kept for the callers and the lab's fixtures, and not read: the lede
   * says "the host" whoever they are. See `guestNameCopy`.
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
  const [value, setValue] = useState(() => storedName ?? readLastName() ?? "");
  /* ★ NEVER PREFILLED, unlike the name beside it. The name's prefill is a
     kindness at the second party a phone scans; an ADDRESS carried across
     parties is the last guest's address shown to the next one, which is the
     rule `lib/auth/remembered-email.ts` exists to keep. */
  const [email, setEmail] = useState("");
  // The ghost line, closed until the guest opens it. Never reopened by anything but their tap.
  const [emailOpen, setEmailOpen] = useState(false);
  const [refusal, setRefusal] = useState<JoinRefusal | null>(null);
  /* The address's refusal lives apart from the name's so each sits under the
     field it is about; one slot would point a guest at the wrong question. */
  const [emailRefusal, setEmailRefusal] = useState<JoinRefusal | null>(null);
  const [saving, startSave] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const editing = mode === "edit";
  const copy = guestNameCopy(mode, hostName);
  // The one mode that asks. See the head comment for why the other two do not.
  const asksEmail = mode === "join";

  /** The step is about to hand forward to one with no field: the keyboard goes down first. */
  function letGo() {
    const active = document.activeElement;
    if (active instanceof HTMLElement && formRef.current?.contains(active)) {
      active.blur();
    }
  }

  function named(result: Parameters<typeof onNamed>[0]) {
    letGo();
    onNamed(result);
  }

  /** The ghost line's tap: the field opens and takes focus INSIDE the tap, so iOS raises the keyboard. */
  function openEmail() {
    flushSync(() => setEmailOpen(true));
    emailRef.current?.focus();
  }

  function submit() {
    const checked = checkDisplayName(value);
    if (!checked.ok) {
      setRefusal(checked.refusal);
      return;
    }
    const name = checked.name;

    /* The optional address, parsed before anything is sent. A blank or unopened
       field is an ANSWER (`email: null`), not a refusal: the question is
       optional and the guest has already moved past it. */
    const checkedEmail =
      asksEmail && emailOpen
        ? checkGuestEmail(email)
        : ({ ok: true, email: null } as const);
    if (!checkedEmail.ok) {
      setEmailRefusal(checkedEmail.refusal);
      return;
    }
    const typedEmail = checkedEmail.email;

    /* ★ A CONFIRMED ACCOUNT WITH NO PROFILE NAME WRITES THE PROFILE. Their identity is the
       account's, so there is no guest row to name: `create_guest` nulls a typed name beside a
       confirmed session anyway. So the question is asked once, at the door, like every other. */
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
        named({
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
         A HELD SESSION NAMES ITS ROW. A device can hold a session but no
         LOCAL name (an older nameless row, or one the queue's own silent join
         minted). Were the rename gated on `editing`, a "join"-mode open on
         that device would fall into the join branch below and mint a SECOND
         row for the same person, stranding the first one's photographs with
         no name. A session token means a row already exists to answer for,
         whichever door raised this step, so it is `renameGuest`'s to try
         first, regardless of mode.

         Only three of its refusals fall through to a fresh join: `invalid_session`
         (a genuinely DEAD token — the route's own "not found"),
         `unauthorized` (a VERIFIED row, which cannot happen for a nameless
         session in practice — this door never opens for one — but the route,
         not this component's assumption, is the truth, so it falls through
         too rather than dead-ending), and `session_other_account` (a live
         ticket whose row is an account's the viewer is not, which is put down
         first so nothing of its owner's, the name or the address flag,
         outlives it on this device). Every other refusal (a bad name, the
         limiter) is this step's to show.
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
          named({
            sessionToken,
            displayName: renamed.displayName,
            emailAttached: attached,
            email: attached ? typedEmail : null,
          });
          return;
        }
        if (renamed.refusal.kind === SESSION_OTHER_ACCOUNT) {
          // Somebody else's ticket: down it goes, then the fresh join below
          // mints this person their own row under the name they just typed.
          await dropGuestTicket(qrToken);
        } else if (
          renamed.refusal.kind !== "invalid_session" &&
          renamed.refusal.kind !== "unauthorized"
        ) {
          setRefusal(renamed.refusal);
          return;
        }
        // A dead token, a (defensive) verified row, or a ticket that was not
        // this viewer's: nothing left to rename, so fall through to the same
        // fresh join a session-less device takes.
      }
      /* ★ A FRESH JOIN IS ONE POST, name and address together. The key is absent
         when nothing was typed, so a guest who declined the field sends a
         name-only body. */
      const joined = await joinEvent({
        qrToken,
        displayName: name,
        ...(typedEmail ? { email: typedEmail } : {}),
      });
      if (!joined.ok) {
        if (joined.refusal.kind === "verification_required") {
          letGo();
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
      named({
        sessionToken: joined.guest.sessionToken,
        displayName: landed,
        emailAttached: joined.guest.emailAttached,
        email: joined.guest.emailAttached ? typedEmail : null,
      });
    });
  }

  return (
    <form
      ref={formRef}
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
        {/* ★ THE QUESTION IS THE HEADING. The title IS the question at the door, so a visible
            label would ask it twice in one sheet. The label stays for the a11y tree, naming the
            FIELD. */}
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
          onKeyDown={(e) => {
            // Return moves on to the address when the guest has opened it, and sends otherwise.
            if (e.key === "Enter" && asksEmail && emailOpen) {
              e.preventDefault();
              emailRef.current?.focus();
            }
          }}
          placeholder="Your name"
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          autoComplete="name"
          autoCapitalize="words"
          inputMode="text"
          enterKeyHint={asksEmail && emailOpen ? "next" : "go"}
          aria-invalid={refusal ? true : undefined}
          aria-describedby="pr-guest-name-hint"
          className="h-11 text-base"
        />
        {refusal ? (
          <p id="pr-guest-name-hint" className="text-reading text-destructive">
            {refusal.message}
          </p>
        ) : (
          // The reassurance is that nothing is being proved, because every
          // other door this guest has met asked them to prove something.
          <p
            id="pr-guest-name-hint"
            className="text-reading text-muted-foreground"
          >
            Just a name. Nobody has to prove a name.
          </p>
        )}
      </div>
      {asksEmail &&
        (emailOpen ? (
          /* ★ THE OPTIONAL ADDRESS, OPENED. A VISIBLE label, because unlike the
             name this question is not the heading and "(optional)" is the most
             important word on it; a helper line that is a benefit to THEM
             rather than a reason of ours. */
          <div className="space-y-1.5">
            <Label htmlFor="pr-guest-email">Email (optional)</Label>
            <Input
              ref={emailRef}
              id="pr-guest-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
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
              <p
                id="pr-guest-email-hint"
                className="text-reading text-destructive"
              >
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
        ) : (
          /* ★ THE GHOST LINE: one row, full width, at least 44px tall, that
             reads as an easy afterthought rather than a second question. */
          <button
            type="button"
            data-email-ghost
            onClick={openEmail}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 text-left text-working text-muted-foreground transition-colors duration-150 ease-emphasis outline-none hover:border-foreground/30 hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Mail className="size-4 shrink-0 max-[359px]:hidden" aria-hidden />
            Add an email to come back anytime
          </button>
        ))}
      <div data-sheet-primary className={cn("relative", floatingKeyboardFoot)}>
        <Button
          type="submit"
          size="cta"
          className="w-full"
          disabled={saving || !value.trim()}
        >
          {saving ? "Just a second…" : editing ? "Save name" : "Continue"}
        </Button>
      </div>
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
  /** Ignored (see the `join` branch); kept so callers compile. */
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
  /* ★ THE HOST GOES UNNAMED HERE: the lede says "so the host knows who to
     thank" on every event rather than the host's own name. `hostName` stays
     in the signature, ignored, so every caller and the lab's fixtures compile
     untouched. */
  return {
    title: "What should we call you?",
    reason:
      "Your name goes on the photos you add, so the host knows who to thank.",
  };
}

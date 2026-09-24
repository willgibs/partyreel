"use client";

import { Lock } from "lucide-react";

import { AccountDoor, DOOR_WEAR } from "@/components/auth/account-door";
import { formatCount } from "@/lib/format/count";

// The entry modal's ACCOUNT step (an event with Require verified emails on). All roads
// lead to an account: email is PRIMARY (one tap sends a code + magic link that creates the account or
// logs in, no password needed), with Google beside it and a quiet password link for returning users.
// After auth, router.refresh() re-runs the page RSC -> access becomes `full` -> the modal closes (then
// the name step, if a brand-new account, or the upload panel). P1 gated the VIEW, so an account now
// unlocks SEEING the full gallery, not just uploading. Renders inside the Dialog (no card wrapper).
//
// ★ THE GATE IS A WEAR, NOT A FORM (Will, 2026-09-20, `app-door` r1 `surfaces=one`). Everything under
// the framing is <AccountDoor>: the same field, the same failure paths, the same existing-account
// line as /login and the album's confirm door. What stays HERE is the framing, which is this
// surface's alone.
export function EnterEventPrompt({
  qrToken,
  mediaTotal,
  accountNameNote = false,
  onVerified,
}: {
  qrToken: string;
  /** Approved media count for the "N photos are waiting" tease. */
  mediaTotal?: number;
  /**
   * The guest typed a name at the door a step ago and this account may already have one of its
   * own. One line says which wins, BEFORE they confirm rather than after they see somebody else's
   * version of their own name under a photograph.
   */
  accountNameNote?: boolean;
  /**
   * ★ THE CALLER OWNS WHAT HAPPENS NEXT (the door as three steps, 2026-09-21). This used to claim
   * the anonymous uploads, call back and `router.refresh()` itself. The door now holds a NAME that
   * has never been sent anywhere, and the ORDER of the four writes after a confirmation is the
   * difference between a guest who lands named and one whose photographs carry no name, so the
   * sequence moved up to `entry-modal.tsx` and this is a plain callback again.
   */
  onVerified: () => void | Promise<void>;
}) {
  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=/e/${qrToken}`
      : `/auth/callback?next=/e/${qrToken}`;

  return (
    <div className="text-center">
      {/* The ratified gate framing (Phase 4.5 warm rewrite): the "almost in"
          eyebrow, the REAL count as the promise, and the account step as the
          HOST'S safety choice (intent preserved, tone softened). */}
      <p className="flex items-center justify-center gap-1.5 text-label font-medium text-muted-foreground uppercase">
        <Lock className="size-3" aria-hidden />
        {DOOR_WEAR.gate.heading}
      </p>
      {/* The entry sheet's title slot, so the event name's own step (`page`)
          whichever of its screens is showing; the step carries its leading.
          ★ THE NOUN NOW MATCHES THE HEADER AND THE TEASER CTA (POLISH 1, the
          identity red-team, 2026-09-21): this line already counted the true
          `approvedTotal` (photos and videos); only "photo(s)" said less than
          the number meant. Reusing the header's own always-both-nouns rule
          keeps one album's size worded the same way on every surface that
          says it. The count itself is unchanged. */}
      <p className="mt-1.5 font-heading text-page text-balance">
        {mediaTotal && mediaTotal > 0
          ? `${formatCount(mediaTotal)} ${mediaTotal === 1 ? "photo" : "photos"} & videos ${mediaTotal === 1 ? "is" : "are"} waiting`
          : "See all the photos"}
      </p>
      {/* ★ RULED (Will, 2026-09-19, voice r1 `gate=ask`), his own adjustment to
          the winning candidate and wired verbatim. What he was ruling OUT is
          the reading the other candidates carried: "The rest of the options
          feel like the host has gated the event to certain emails." They do not
          - the gate is a yes/no switch, not an allow-list - so the body has to
          say WHY (safety), WHOSE call it is (the host's) and how much it costs
          (one tap). The words now live in the door's own wear table, so the
          gate and its component cannot drift; the eyebrow, the title's real
          count and the password path are unchanged. His larger question,
          whether confirmation should be skipped for a verified-email badge,
          became `guest-verify` and then the identity reshape, whose ruling of
          2026-09-22 RE-RULED this very sentence (the ask first, the safety as
          its reason, "tap" his word). That is exactly why the table below is
          the only place it can be changed and this comment is not a copy. */}
      <p className="mx-auto mt-2 max-w-xs text-base leading-relaxed text-muted-foreground">
        {DOOR_WEAR.gate.reason}
      </p>
      {accountNameNote && (
        <p className="mx-auto mt-2 max-w-xs text-reading text-muted-foreground">
          If you have a Partyreel account, its name is the one that shows.
        </p>
      )}
      <div className="mb-4" />
      <div className="mx-auto max-w-xs text-left">
        <AccountDoor
          wear="gate"
          // Google joins the gate this round: it was the one account surface
          // without it, and a guest at a party has a Google session far more
          // often than a password.
          methods={{ code: true, google: true, password: true }}
          emailRedirectTo={emailRedirectTo}
          // The welcome step above this one already carries the Terms line, so
          // a second one here would be the same sentence twice in one sheet.
          consent={false}
          chrome="none"
          // A guest arriving at a gate is creating an account far more often
          // than signing into one, so the "you already had one" line belongs.
          intent="create"
          // ★ AND THE CLAIM WAITS FOR IT. See AccountDoor's ExistingAccount:
          // claiming this browser's photographs onto an account the guest is
          // about to sign out of is permanent, so nothing is claimed until the
          // line is answered or four seconds pass.
          hold
          inputClassName="h-11 text-base"
          buttonClassName="h-11"
          onVerified={onVerified}
        />
      </div>
    </div>
  );
}

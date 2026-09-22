"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

import { AccountDoor, DOOR_WEAR } from "@/components/auth/account-door";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";

// The entry modal's ACCOUNT step (account-required events, allow_anonymous_uploads = false). All roads
// lead to an account: email is PRIMARY (one tap sends a code + magic link that creates the account or
// logs in, no password needed), with Google beside it and a quiet password link for returning users.
// After auth, router.refresh() re-runs the page RSC -> access becomes `full` -> the modal closes (then
// the name step, if a brand-new account, or the upload panel). P1 gated the VIEW, so an account now
// unlocks SEEING the full gallery, not just uploading. Renders inside the Dialog (no card wrapper).
//
// ★ THE GATE IS A WEAR, NOT A FORM (Will, 2026-09-20, `app-door` r1 `surfaces=one`). Everything under
// the framing is <AccountDoor>: the same field, the same failure paths, the same existing-account
// line as /login and Save. What stays HERE is the framing, which is this surface's alone.
export function EnterEventPrompt({
  qrToken,
  mediaTotal,
  onUnlocked,
}: {
  qrToken: string;
  /** Approved media count for the "N photos are waiting" tease. */
  mediaTotal?: number;
  /** Fired the instant access is granted, so the entry surface can hold the
   *  "You're in" beat over the router.refresh() roundtrip (Phase 4.5 S5). */
  onUnlocked?: () => void;
}) {
  const router = useRouter();
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
          ? `${mediaTotal} ${mediaTotal === 1 ? "photo" : "photos"} & videos ${mediaTotal === 1 ? "is" : "are"} waiting`
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
          whether confirmation should be skipped for a verified-email badge, is
          the queued `guest-verify` exploration, NOT this line. */}
      <p className="mx-auto mt-2 mb-4 max-w-xs text-base leading-relaxed text-muted-foreground">
        {DOOR_WEAR.gate.reason}
      </p>
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
          onVerified={async () => {
            // Blur FIRST so the iOS keyboard retracts during the success
            // beat, never mid-exit (without reaching into the door).
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
            // In-page OTP verify does router.refresh() (no remount), so claim directly here. Silent:
            // the guest page isn't the account context + must not stack with other toasts.
            await claimAnonymousUploads({ silent: true });
            // Hold the success beat over the refresh, then it reveals (S5).
            onUnlocked?.();
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AtSign } from "lucide-react";

import { updateDisplayNameAction } from "@/app/(app)/account/actions";
import { PROFILE_SETUP_PATH } from "@/app/(app)/account/profile/invite";
import {
  FollowMomentCard,
  type FollowMomentHost,
} from "@/components/guest/follow-moment-card";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";
import { readTypedName } from "@/lib/guest/confirm-beat";
import { countWaitingEventsAction } from "@/lib/guest/confirm-beat-action";
import { createClient } from "@/lib/supabase/client";

/**
 * THE SLOT UNDER A GUEST'S UPLOADS, which captures a guest without getting in the way of their
 * uploading. A guest who has just added photographs to a wedding is named on that album from now
 * on; this is where they learn a handle exists at all, and without one most chips on a guest list
 * go nowhere.
 *
 * ★ IT OWNS THE WHOLE POST-UPLOAD SLOT, one card at a time, and the ladder is:
 *   just CONFIRMED          -> the follow moment: what they gained, the other events said once,
 *                              the name they are now on as (with its Change), the host to follow,
 *                              and the handle line folded in.
 *   signed IN, no handle    -> the handle card (a guest who was already signed in when they
 *                              uploaded: nothing was captured, so there is no moment to mark).
 *   signed IN, with handle  -> nothing. They already have the page; the album is not the place
 *                              to congratulate them about it.
 *   signed OUT              -> nothing. The ask to keep what they added is the DOOR's last screen
 *                              now (`guest-capture` r1, `moment=first` and `shape=sheet-step`): it
 *                              meets every signed-out guest the instant their first file lands,
 *                              whichever Add sent it, and a guest who put it down there is not
 *                              asked again under the album. What the old offer card was left with
 *                              has a home each: a guest back later has her menu's "Save this event
 *                              for later" card; the demo never asked (its turn card is its own);
 *                              and an album whose uploads are closed has nothing new to keep.
 * Rendering two would stack growth cards under a gallery a guest came here to look at, which is
 * exactly getting in the way, so this component decides which one stands.
 *
 * ★ "JUST CONFIRMED" IS THE ALBUM'S DECISION, HANDED IN. Every confirm door writes
 * `pr_pending_offer_<qr_token>` when it OPENS, and the album page (`use-confirm-return.ts`) hears
 * every claim made on it: when a claim moved this album's own uploads and that marker was there, it
 * sets `moment`, and this card plays the moment exactly once, identically whether the guest typed
 * the code in place or came back from Google or a magic link through a full reload, and with no
 * upload needed this visit.
 *
 * ★ AND THE TYPED NAME BECOMES THE PROFILE NAME, when the profile has none, THEN SHE IS TOLD
 * (`guest-capture` r1, Will's `name=told`). `claim_anonymous_uploads` names a nameless profile from
 * the newest row it claimed; one call to `updateDisplayNameAction` (the single, profanity-checked
 * write path) is the belt for a typed name that never reached a row, and it never overwrites a name
 * that already exists. The card then says the name her photographs carry now, whenever she typed one
 * here, whichever name won (`confirm-beat.ts`), with a Change that changes it.
 *
 * ★ THE EVENTS WAITING UNDER HER EMAIL ARE READ FOR THE MOMENT ALONE (`identity-claims` r3,
 * `pointer=line`): the server counts them (`confirm-beat-action.ts`, the dashboard banner's own
 * list, never this album) while the profile is read, and the card says them in its one line about
 * other events. No other rung reads them, so a confirmation before her first upload here (which
 * moves nothing of hers and plays no moment) says nothing about them: his "especially prior to
 * upload", with her dashboard's banner holding them. A count that cannot be read is simply not said.
 *
 * ★ RESOLVING RENDERS NOTHING, on purpose. getSession() is local (no network), so the wait is a
 * tick; drawing one card first and swapping it for another would be a visible flicker on the
 * surface that is meant to be quiet.
 */
type State = "resolving" | "anon" | "moment" | "no-handle" | "has-handle";

function dismissKey(qrToken: string) {
  return `pr_claim_prompt_${qrToken}`;
}

/** The server's count of other events waiting under her email; 0 when it cannot be read. */
async function readWaitingEvents(qrToken: string): Promise<number> {
  try {
    return await countWaitingEventsAction(qrToken);
  } catch {
    // A dropped request costs the line and nothing else: the moment still plays.
    return 0;
  }
}

export function ClaimHandlePrompt({
  doneCount,
  qrToken,
  host,
  moment = false,
  elsewhere = 0,
  onAccountRenamed,
}: {
  /** Photographs that landed in this session (the sentence's number). */
  doneCount: number;
  /** Keys the per-event dismissal and the typed name this device holds. */
  qrToken: string;
  /** The event's host as a public card, for the follow moment's one row. */
  host?: FollowMomentHost | null;
  /**
   * A confirmation from this album just claimed its uploads (the album page's
   * `useConfirmReturn`): the follow moment is due, whatever the slot showed.
   */
  moment?: boolean;
  /** The same claim's rows at other events, said once in the moment. */
  elsewhere?: number;
  /** The told name was changed in the moment's own line. */
  onAccountRenamed?: (displayName: string) => void;
}) {
  const [state, setState] = useState<State>("resolving");
  const [needsHandle, setNeedsHandle] = useState(false);
  // The name her photographs carry now, told in the moment; null when she typed none here.
  const [toldName, setToldName] = useState<string | null>(null);
  // Other events waiting under her email for her dashboard, said in the moment; 0 says nothing.
  const [waiting, setWaiting] = useState(0);
  // A plain flag rather than a cross-tab store: nothing else writes this key, so a same-tab state
  // update is the whole requirement.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (localStorage.getItem(dismissKey(qrToken)) === "1") {
          if (active) setDismissed(true);
        }
      } catch {
        // Private mode or blocked storage: show the card. A nudge that cannot
        // remember a dismissal is better than one that never appears.
      }
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      if (!session) {
        setState("anon");
        return;
      }
      // The moment's count of events waiting under her email, beside the
      // profile read rather than after it; no other rung asks for it.
      const waitingRead = moment
        ? readWaitingEvents(qrToken)
        : Promise.resolve(0);
      // Own-row read (profiles_select_own): the handle decides whether the
      // second line earns its place, the name decides whether the typed one is
      // still wanted. DELIBERATE swallow: a failed read leaves the state
      // unresolved and this card simply does not appear, which is the harmless
      // direction for a nudge.
      // eslint-disable-next-line partyreel/no-swallowed-db-error
      const { data } = await supabase
        .from("profiles")
        .select("slug, display_name")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!active) return;
      const hasHandle = Boolean(data?.slug);

      let name = data?.display_name?.trim() || null;
      const typed = moment ? readTypedName(qrToken) : null;
      if (moment && !name && typed) {
        // Best effort, and never fatal: the profile can always be named from
        // /account, and a nameless account is the state it was already in.
        // (The claim names a nameless profile from the rows it moved; this is
        // the belt for a typed name that never reached a row.)
        const saved = await updateDisplayNameAction(typed);
        if (saved.ok) name = typed;
      }
      // The card waits for the count and is drawn once (resolving renders
      // nothing), so its line never arrives under a reader's eyes.
      const waitingCount = await waitingRead;

      if (!active) return;
      setNeedsHandle(!hasHandle);
      setToldName(typed ? name : null);
      setWaiting(waitingCount);
      setState(moment ? "moment" : hasHandle ? "has-handle" : "no-handle");
    })();
    return () => {
      active = false;
    };
    // `moment` re-resolves on purpose: it arrives AFTER a confirmation made in
    // this very page, when the session this effect first found absent exists.
  }, [qrToken, moment]);

  if (state === "moment") {
    // Never behind the handle card's dismissal: the moment is a one-off the
    // guest just earned, not the nudge they declined.
    return (
      <FollowMomentCard
        host={host ?? null}
        needsHandle={needsHandle}
        // A return from Google or a magic link lands with nothing uploaded
        // this visit: the card then speaks of the photos without a number.
        count={doneCount > 0 ? doneCount : null}
        elsewhere={elsewhere}
        waiting={waiting}
        toldName={toldName}
        onRenamed={(renamed) => {
          setToldName(renamed);
          onAccountRenamed?.(renamed);
        }}
      />
    );
  }
  if (dismissed) return null;
  if (state !== "no-handle") return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(dismissKey(qrToken), "1");
    } catch {
      // Dismissed for this visit at least.
    }
  }

  return (
    <div
      data-media-tile
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
    >
      <AtSign
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          {doneCount === 1
            ? "Your photo is on this album under your name."
            : `Your ${formatCount(doneCount)} photos are on this album under your name.`}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Claim a handle and that name becomes a page.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Not now
        </button>
      </div>
      {/* The door is the page's own setup (profile-setup's wizard, where the handle is claimed
          last, at Finish): the offer and the act that answers it are one. */}
      <Button asChild size="sm" variant="outline">
        <Link href={PROFILE_SETUP_PATH}>Claim</Link>
      </Button>
    </div>
  );
}

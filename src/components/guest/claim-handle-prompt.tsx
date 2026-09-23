"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AtSign } from "lucide-react";

import { updateDisplayNameAction } from "@/app/(app)/account/actions";
import {
  FollowMomentCard,
  type FollowMomentHost,
} from "@/components/guest/follow-moment-card";
import { Button } from "@/components/ui/button";
import { GUEST_NAME_PREFIX } from "@/lib/guest/use-stored-name";
import { createClient } from "@/lib/supabase/client";

/**
 * THE OFFER, AT THE ONE MOMENT ANYONE CARES (Will, `claim=after`, 2026-09-19:
 * "Amazing capture method without getting in the way of uploading photos. Great
 * idea here"). A guest who has just added photographs to a wedding is named on
 * that album from now on; until this round nothing anywhere told them a handle
 * existed, which is why most chips on a guest list go nowhere.
 *
 * ★ IT OWNS THE WHOLE POST-UPLOAD SLOT, one card at a time, and that is the
 * sequencing the round asked for. The identity reshape (2026-09-21) added the
 * middle beat, so the ladder is now:
 *   signed OUT              -> the offer card (keep your N photos), exactly as
 *                              `account=after` left it, now counting them.
 *   just CONFIRMED          -> the follow moment: what they gained, the host to
 *                              follow, and the handle line folded in.
 *   signed IN, no handle    -> the handle card (a guest who was already signed
 *                              in when they uploaded: nothing was captured, so
 *                              there is no moment to mark).
 *   signed IN, with handle  -> nothing. They already have the page; the album
 *                              is not the place to congratulate them about it.
 * Rendering two would stack growth cards under a gallery a guest came here to
 * look at, which is the opposite of "without getting in the way", so the offer
 * card arrives as a prop and this component decides which one stands.
 *
 * ★ "JUST CONFIRMED" IS THE ALBUM'S DECISION, HANDED IN (guest by upload,
 * 2026-09-22). Every confirm door writes `pr_pending_offer_<qr_token>` when it
 * OPENS, and the album page (`use-confirm-return.ts`) hears every claim made on
 * it: when a claim moved this album's own uploads and that marker was there, it
 * sets `moment`, and this card plays the moment exactly once, identically
 * whether the guest typed the code in place or came back from Google or a
 * magic link through a full reload, and with no upload needed this visit.
 *
 * ★ AND THE TYPED NAME BECOMES THE PROFILE NAME, when the profile has none.
 * `claim_anonymous_uploads` was deliberately left unchanged by the reshape's
 * schema (wave 0's finding), so the claim stamps `user_id` onto the guest rows
 * and stops there; a brand-new account would otherwise land nameless while the
 * person is standing on an album that has been calling them Sam all evening. One
 * call to `updateDisplayNameAction` (the single, profanity-checked write path)
 * closes that, and it never overwrites a name that already exists.
 *
 * ★ RESOLVING RENDERS NOTHING, on purpose. getSession() is local (no network),
 * so the wait is a tick; drawing the offer card first and swapping it for the
 * moment would be a visible flicker on the surface that is meant to be quiet.
 */
type State = "resolving" | "anon" | "moment" | "no-handle" | "has-handle";

function dismissKey(qrToken: string) {
  return `pr_claim_prompt_${qrToken}`;
}

/** The name this device typed at this event, read once without the hook's subscription. */
function readTypedName(qrToken: string): string | null {
  try {
    const value = localStorage.getItem(`${GUEST_NAME_PREFIX}${qrToken}`);
    return value && value.trim() ? value : null;
  } catch {
    return null;
  }
}

export function ClaimHandlePrompt({
  doneCount,
  qrToken,
  savePrompt,
  host,
  moment = false,
}: {
  /** Photographs that landed in this session (the sentence's number). */
  doneCount: number;
  /** Keys the per-event dismissal and the typed name this device holds. */
  qrToken: string;
  /** What a signed-OUT guest gets instead: the offer card. */
  savePrompt: ReactNode;
  /** The event's host as a public card, for the follow moment's one row. */
  host?: FollowMomentHost | null;
  /**
   * A confirmation from this album just claimed its uploads (the album page's
   * `useConfirmReturn`): the follow moment is due, whatever the slot showed.
   */
  moment?: boolean;
}) {
  const [state, setState] = useState<State>("resolving");
  const [needsHandle, setNeedsHandle] = useState(false);
  // A plain flag rather than the save prompt's cross-tab store: nothing else
  // writes this key, so a same-tab state update is the whole requirement, and a
  // second copy of that hook is a second thing to keep in step.
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

      if (moment && !data?.display_name) {
        const typed = readTypedName(qrToken);
        // Best effort, and never fatal: the profile can always be named from
        // /account, and a nameless account is the state it was already in.
        // (The claim names a nameless profile from the rows it moved; this is
        // the belt for a typed name that never reached a row.)
        if (typed) await updateDisplayNameAction(typed);
      }

      if (!active) return;
      setNeedsHandle(!hasHandle);
      setState(moment ? "moment" : hasHandle ? "has-handle" : "no-handle");
    })();
    return () => {
      active = false;
    };
    // `moment` re-resolves on purpose: it arrives AFTER a confirmation made in
    // this very page, when the session this effect first found absent exists.
  }, [qrToken, moment]);

  if (state === "anon") return <>{savePrompt}</>;
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
            : `Your ${doneCount} photos are on this album under your name.`}
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
      {/* The door lands ON the handle field, not at the top of a five-card
          account page: the offer and the box that answers it are one act. */}
      <Button asChild size="sm" variant="outline">
        <Link href="/account#public-profile">Claim</Link>
      </Button>
    </div>
  );
}

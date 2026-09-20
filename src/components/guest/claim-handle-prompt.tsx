"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AtSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/**
 * THE OFFER, AT THE ONE MOMENT ANYONE CARES (Will, `claim=after`, 2026-09-19:
 * "Amazing capture method without getting in the way of uploading photos. Great
 * idea here"). A guest who has just added photographs to a wedding is named on
 * that album from now on; until this round nothing anywhere told them a handle
 * existed, which is why most chips on a guest list go nowhere.
 *
 * ★ IT OWNS THE WHOLE POST-UPLOAD SLOT, one card at a time, and that is the
 * sequencing the round asked for:
 *   signed OUT              -> the save-account prompt, exactly as today (an
 *                              account comes before a handle: there is nothing
 *                              to hang a page on yet).
 *   signed IN, no handle    -> this card.
 *   signed IN, with handle  -> nothing. They already have the page; the album
 *                              is not the place to congratulate them about it.
 * Rendering both would stack two growth cards under a gallery a guest came here
 * to look at, which is the opposite of "without getting in the way", so the
 * save prompt arrives as a prop and this component decides which one stands.
 *
 * ★ RESOLVING RENDERS NOTHING, on purpose. getSession() is local (no network),
 * so the wait is a tick; drawing the save card first and swapping it for this
 * one would be a visible flicker on the surface that is meant to be quiet.
 *
 * ★ AND THE HANDLE IS FREE NOW (his plan-mode answer the same day), so this
 * card never mentions a plan and the door it opens never refuses anybody.
 */
type State = "resolving" | "anon" | "no-handle" | "has-handle";

function dismissKey(qrToken: string) {
  return `pr_claim_prompt_${qrToken}`;
}

export function ClaimHandlePrompt({
  doneCount,
  qrToken,
  savePrompt,
}: {
  /** Photographs that landed in this session (the sentence's number). */
  doneCount: number;
  /** Keys the per-event dismissal. */
  qrToken: string;
  /** What a signed-OUT guest gets instead: the save-account prompt. */
  savePrompt: ReactNode;
}) {
  const [state, setState] = useState<State>("resolving");
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
      // Own-row read (profiles_select_own): the only thing asked for is whether
      // I have a handle. DELIBERATE swallow: a failed read leaves the state
      // unresolved and this card simply does not appear, which is the harmless
      // direction for a nudge.
      // eslint-disable-next-line partyreel/no-swallowed-db-error
      const { data } = await supabase
        .from("profiles")
        .select("slug")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!active) return;
      setState(data?.slug ? "has-handle" : "no-handle");
    })();
    return () => {
      active = false;
    };
  }, [qrToken]);

  if (state === "anon") return <>{savePrompt}</>;
  if (state !== "no-handle" || dismissed) return null;

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

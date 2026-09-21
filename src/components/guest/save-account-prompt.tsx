"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Bookmark } from "lucide-react";

import { SaveEventButton } from "@/components/guest/save-event-button";
import { createClient } from "@/lib/supabase/client";

/**
 * THE OFFER, RIGHT AFTER A GUEST'S FIRST PHOTOGRAPHS LAND (Will, `account=after`,
 * 2026-09-20: "Moving Save makes it feel more natural after upload rather than a
 * random button above an album for guests"), reshaped into the CAPTURE FLOW at
 * the identity reshape (2026-09-21, his `collision=offer`: "a flow for us to
 * capture non-user guests after their uploads to save the event/uploads to a
 * profile, follow host/other guests").
 *
 * ★ IT COUNTS WHAT THEY JUST ADDED, and that is the whole difference between a
 * growth card and an offer: "Keep your 7 photos" is about the thing in front of
 * them, "create a free account" was about us.
 *
 * ★ IT MARKS THE DOOR'S OPENING (`pr_pending_offer_<qr_token>`) so the beat
 * AFTER a confirmation is the same on every path. The in-page code returns to
 * this very component tree; a Google round trip or a tapped magic link leaves
 * the page entirely and comes back on a fresh mount with no memory of what the
 * guest was doing. The marker is that memory, and `claim-handle-prompt.tsx` (the
 * slot's owner) consumes it on the next mount and stands the follow moment up.
 * Written on OPEN rather than on success for the same reason `pr_pending_save_`
 * is: by the time the redirect happens there is no code of ours running.
 */

function promptKey(qrToken: string) {
  return `pr_save_prompt_${qrToken}`;
}

/** The capture flow's own marker: the door was opened from this offer. */
export function pendingOfferKey(qrToken: string) {
  return `pr_pending_offer_${qrToken}`;
}

// Same-tab subscribers — the native `storage` event only fires in OTHER tabs. Mirrors
// the use-stored-session localStorage gate; server snapshot is `true` so the card never
// flashes before hydration.
const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

function useDismissed(key: string): [boolean, () => void] {
  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  }, []);

  const dismissed = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) === "1",
    () => true,
  );

  const dismiss = useCallback(() => {
    localStorage.setItem(key, "1");
    emit();
  }, [key]);

  return [dismissed, dismiss];
}

export function SaveAccountPrompt({
  eventId,
  qrToken,
  sessionToken,
  count = 0,
}: {
  eventId: string;
  qrToken: string;
  sessionToken: string;
  /** Photographs this guest added in this session (the sentence's number). */
  count?: number;
}) {
  const [dismissed, dismiss] = useDismissed(promptKey(qrToken));
  // Already signed in AND already saved → no prompt (resolved client-side).
  const [hide, setHide] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !active) return;
      // DELIBERATE swallow: this only decides whether to HIDE an optional prompt.
      // A failed read leaves `row` undefined, so the prompt shows; the save action
      // itself is idempotent and reports its own errors. Failing toward "show" is
      // the harmless direction, and a toast here would be noise on a nudge.
      // eslint-disable-next-line partyreel/no-swallowed-db-error
      const { data: row } = await supabase
        .from("saved_events")
        .select("event_id")
        .eq("event_id", eventId)
        .maybeSingle();
      if (active && row) setHide(true);
    })();
    return () => {
      active = false;
    };
  }, [eventId]);

  if (dismissed || hide) return null;

  return (
    <div
      data-media-tile
      className="rounded-xl border border-border bg-card p-5 text-center"
    >
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Bookmark className="size-5" />
      </div>
      {/* A prompt tile's title: the app's quiet middle, `subsection`. ★ The
          HEADING is deliberately the constant one a help article already
          quotes; the NUMBER rides the sentence under it, where it belongs:
          "Keep these photos" is the offer, "these 7" is what is in front of
          them. */}
      <p className="font-heading text-subsection">Keep these photos</p>
      <p className="mx-auto mt-1 mb-4 max-w-xs text-reading text-muted-foreground">
        Confirm your email and{" "}
        {count === 1 ? "it stays" : count > 1 ? `all ${count} stay` : "they stay"}{" "}
        with you: this event on your profile, and everything you added to it.
      </p>
      <div className="flex justify-center">
        <SaveEventButton
          eventId={eventId}
          qrToken={qrToken}
          sessionToken={sessionToken}
          offerNewsletter
          triggerLabel="Confirm your email"
          onSaved={dismiss}
          onDoorOpen={() => {
            try {
              localStorage.setItem(pendingOfferKey(qrToken), "1");
            } catch {
              // Blocked storage: the in-page path still lands the moment,
              // because that one never leaves this tree. Only the redirect
              // round trip loses it, and a nudge that cannot remember is
              // better than a crash.
            }
          }}
        />
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Maybe later
      </button>
    </div>
  );
}

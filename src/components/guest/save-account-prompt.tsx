"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Bookmark } from "lucide-react";

import { SaveEventButton } from "@/components/guest/save-event-button";
import { createClient } from "@/lib/supabase/client";

// One-time, post-upload "save this event" growth card (Phase 3) — the unified successor
// to the newsletter email-capture prompt. Account-first: "create a free account to save
// this event", with the newsletter opt-in folded into the save dialog as a checkbox. The
// same Save button also lives in the page header; this is the high-intent reprise right
// after a guest contributes. Self-hides after dismiss, or if already signed in + saved.

function promptKey(qrToken: string) {
  return `pr_save_prompt_${qrToken}`;
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
}: {
  eventId: string;
  qrToken: string;
  sessionToken: string;
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
      {/* A prompt tile's title: the app's quiet middle, `subsection`. */}
      <p className="font-heading text-subsection">Keep these photos</p>
      <p className="mx-auto mt-1 mb-4 max-w-xs text-reading text-muted-foreground">
        Create a free account to save this event and come back to the album
        whenever you want.
      </p>
      <div className="flex justify-center">
        <SaveEventButton
          eventId={eventId}
          qrToken={qrToken}
          sessionToken={sessionToken}
          offerNewsletter
          onSaved={dismiss}
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
